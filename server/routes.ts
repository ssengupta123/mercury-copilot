import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { routeMessage } from "./orchestrator";
import { MERCURY_AGENTS } from "./agents";
import { sendMessageSchema, insertCopilotBotSchema, insertPhaseConfigSchema } from "@shared/schema";
import { callCopilotBot } from "./bot-connector";
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", async (_req, res) => {
    try {
      if (process.env.AZURE_SQL_CONNECTION_STRING) {
        const { getPool } = await import("./db-mssql");
        const pool = await getPool();
        await pool.request().query("SELECT 1");
      } else {
        const { getPool } = await import("./db");
        const pgPool = await getPool();
        await pgPool.query("SELECT 1");
      }
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ status: "unhealthy", error: "Database connection failed" });
    }
  });

  app.get("/api/agents", (_req, res) => {
    const agents = MERCURY_AGENTS.map(a => ({
      id: a.id,
      name: a.name,
      phase: a.phase,
      weekRange: a.weekRange,
      description: a.description,
      icon: a.icon,
      color: a.color,
      prerequisites: a.prerequisites,
      deliverables: a.deliverables,
    }));
    res.json(agents);
  });

  app.get("/api/conversations", async (_req, res) => {
    try {
      const convs = await storage.getAllConversations();
      res.json(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conv = await storage.getConversation(id);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      const msgs = await storage.getMessagesByConversation(id);
      res.json({ ...conv, messages: msgs });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conv = await storage.createConversation({
        title: req.body.title || "New Conversation",
      });
      res.status(201).json(conv);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Message content is required" });
      }
      const { content } = parsed.data;

      const conv = await storage.getConversation(conversationId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
        agentId: null,
      });

      const existingMessages = await storage.getMessagesByConversation(conversationId);
      const historyForRouting = existingMessages.map(m => ({
        role: m.role,
        content: m.content,
        agentId: m.agentId,
      }));

      const routing = await routeMessage(content, historyForRouting, conv.activeAgent);

      await storage.updateConversation(conversationId, {
        activeAgent: routing.agentId,
      });

      if (existingMessages.length <= 1) {
        const titleContent = content.length > 50 ? content.substring(0, 50) + "..." : content;
        await storage.updateConversation(conversationId, {
          title: titleContent,
          activeAgent: routing.agentId,
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({
        type: "routing",
        agentId: routing.agentId,
        agentName: routing.agent.name,
        greeting: routing.greeting,
        reason: routing.reason,
      })}\n\n`);

      let fullResponse = "";

      try {
        const configuredBots = await storage.getCopilotBotsByPhase(routing.agentId);
        const activeBots = configuredBots.filter(b => b.isActive && b.botEndpoint);

        if (activeBots.length > 0) {
          const bot = activeBots[0];
          res.write(`data: ${JSON.stringify({ type: "status", message: `Connecting to ${bot.name}...` })}\n\n`);
          try {
            const userToken = req.session?.accessToken;
            const botReply = await callCopilotBot(bot.botEndpoint, content, userToken);
            fullResponse = botReply;
          } catch (botError: any) {
            console.error("Error calling Copilot bot:", botError);
            const errMsg = botError?.message || "";
            if (errMsg.includes("Failed to get DirectLine token")) {
              fullResponse = `Could not connect to the Copilot Studio bot "${bot.name}". The bot endpoint may be incorrect or the bot may not be published. Please verify the endpoint URL in the admin panel.`;
            } else if (errMsg.includes("Failed to start DirectLine conversation")) {
              fullResponse = `Connected to Copilot Studio but failed to start a conversation with "${bot.name}". The DirectLine token may have expired or the bot may be unavailable.`;
            } else {
              fullResponse = `Sorry, I encountered an issue connecting to the specialist agent "${bot.name}". Please try again later or contact your administrator.`;
            }
          }
          res.write(`data: ${JSON.stringify({ type: "content", content: fullResponse })}\n\n`);
        } else {
          fullResponse = "Sorry, currently no specialist agent is available for this phase. Please contact your administrator to configure a Copilot Studio bot.";
          res.write(`data: ${JSON.stringify({ type: "content", content: fullResponse })}\n\n`);
        }
      } catch (streamError) {
        console.error("Error during response:", streamError);
        fullResponse = "Sorry, currently no specialist agent is available.";
        res.write(`data: ${JSON.stringify({ type: "content", content: fullResponse })}\n\n`);
      }

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        agentId: routing.agentId,
      });

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  const sanitizeBot = (bot: any) => {
    const { botSecret, ...safe } = bot;
    return { ...safe, hasSecret: !!botSecret };
  };

  const updateCopilotBotSchema = insertCopilotBotSchema.partial();

  app.get("/api/admin/copilot-bots", async (_req, res) => {
    try {
      const bots = await storage.getAllCopilotBots();
      res.json(bots.map(sanitizeBot));
    } catch (error) {
      console.error("Error fetching copilot bots:", error);
      res.status(500).json({ error: "Failed to fetch copilot bots" });
    }
  });

  app.post("/api/admin/copilot-bots", async (req, res) => {
    try {
      const parsed = insertCopilotBotSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bot configuration", details: parsed.error.errors });
      }
      const bot = await storage.createCopilotBot(parsed.data);
      res.status(201).json(sanitizeBot(bot));
    } catch (error) {
      console.error("Error creating copilot bot:", error);
      res.status(500).json({ error: "Failed to create copilot bot" });
    }
  });

  app.patch("/api/admin/copilot-bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = updateCopilotBotSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.errors });
      }
      const bot = await storage.updateCopilotBot(id, parsed.data);
      if (!bot) return res.status(404).json({ error: "Bot not found" });
      res.json(sanitizeBot(bot));
    } catch (error) {
      console.error("Error updating copilot bot:", error);
      res.status(500).json({ error: "Failed to update copilot bot" });
    }
  });

  app.delete("/api/admin/copilot-bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCopilotBot(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting copilot bot:", error);
      res.status(500).json({ error: "Failed to delete copilot bot" });
    }
  });

  app.get("/api/admin/phase-configs", async (_req, res) => {
    try {
      const configs = await storage.getAllPhaseConfigs();
      const defaultConfigs = MERCURY_AGENTS.map(a => {
        const saved = configs.find(c => c.phaseId === a.id);
        return saved || {
          id: 0,
          phaseId: a.id,
          systemPrompt: a.systemPrompt,
          deliverables: a.deliverables,
          keywords: a.keywords,
          description: a.description,
          weekRange: a.weekRange,
          updatedAt: null,
        };
      });
      res.json(defaultConfigs);
    } catch (error) {
      console.error("Error fetching phase configs:", error);
      res.status(500).json({ error: "Failed to fetch phase configs" });
    }
  });

  app.put("/api/admin/phase-configs/:phaseId", async (req, res) => {
    try {
      const { phaseId } = req.params;
      const agent = MERCURY_AGENTS.find(a => a.id === phaseId);
      if (!agent) return res.status(404).json({ error: "Phase not found" });

      const data = {
        phaseId,
        systemPrompt: req.body.systemPrompt || agent.systemPrompt,
        deliverables: req.body.deliverables || agent.deliverables,
        keywords: req.body.keywords || agent.keywords,
        description: req.body.description || agent.description,
        weekRange: req.body.weekRange || agent.weekRange,
      };

      const parsed = insertPhaseConfigSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid config data", details: parsed.error.errors });
      }

      const config = await storage.upsertPhaseConfig(parsed.data);
      res.json(config);
    } catch (error) {
      console.error("Error updating phase config:", error);
      res.status(500).json({ error: "Failed to update phase config" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const conversationId = req.body.conversationId ? parseInt(req.body.conversationId) : null;
      const doc = await storage.createDocument({
        conversationId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      res.status(201).json(doc);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/uploads/:filename", (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    res.sendFile(filePath);
  });

  app.patch("/api/documents/:id/link", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { conversationId } = req.body;
      if (!conversationId) return res.status(400).json({ error: "conversationId required" });
      const doc = await storage.getDocument(id);
      if (!doc) return res.status(404).json({ error: "Document not found" });
      await storage.linkDocumentToConversation(id, conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error linking document:", error);
      res.status(500).json({ error: "Failed to link document" });
    }
  });

  app.get("/api/conversations/:id/documents", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const docs = await storage.getDocumentsByConversation(id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  const ssoEnabled = !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_SECRET);

  app.get("/api/auth/login", async (req, res) => {
    if (!ssoEnabled) return res.status(501).json({ error: "SSO not configured" });
    try {
      const { getMsalClient, SCOPES, getRedirectUri } = await import("./auth");
      const authUrl = await getMsalClient().getAuthCodeUrl({
        scopes: SCOPES,
        redirectUri: getRedirectUri(),
        prompt: "select_account",
      });
      res.redirect(authUrl);
    } catch (error) {
      console.error("Auth login error:", error);
      res.status(500).json({ error: "Failed to initiate login" });
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    if (!ssoEnabled) return res.redirect("/?error=sso_not_configured");
    try {
      const { getMsalClient, SCOPES, getRedirectUri } = await import("./auth");
      const tokenResponse = await getMsalClient().acquireTokenByCode({
        code: req.query.code as string,
        scopes: SCOPES,
        redirectUri: getRedirectUri(),
      });
      req.session.user = {
        name: tokenResponse.account?.name || "User",
        email: tokenResponse.account?.username || "",
        oid: tokenResponse.account?.homeAccountId || "",
      };
      req.session.accessToken = tokenResponse.accessToken;
      req.session.idToken = tokenResponse.idToken;
      res.redirect("/");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.user) {
      res.json({ authenticated: true, user: req.session.user, ssoEnabled });
    } else {
      res.json({ authenticated: false, ssoEnabled });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  return httpServer;
}
