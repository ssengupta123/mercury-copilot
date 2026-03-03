import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { routeMessage, generateAgentResponse } from "./orchestrator";
import { MERCURY_AGENTS, getAgentById } from "./agents";
import { sendMessageSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

      let prerequisiteWarning: string | undefined;
      const missingPrereqs = routing.agent.prerequisites.filter(prereqId => {
        const hasDiscussion = existingMessages.some(m => m.agentId === prereqId);
        return !hasDiscussion;
      });

      if (missingPrereqs.length > 0) {
        const prereqNames = missingPrereqs
          .map(id => getAgentById(id)?.name || id)
          .join(", ");
        prerequisiteWarning = `The user may not have completed prerequisite phases: ${prereqNames}. Gently mention this and offer to help with prerequisites if needed, but still answer their question.`;
      }

      const history = existingMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

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
        const stream = generateAgentResponse(routing.agent, content, history, prerequisiteWarning);
        for await (const chunk of stream) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`);
        }
      } catch (streamError) {
        console.error("Error during streaming:", streamError);
        const errorMsg = "I apologize, but I encountered an issue generating a response. Please try again.";
        fullResponse = errorMsg;
        res.write(`data: ${JSON.stringify({ type: "content", content: errorMsg })}\n\n`);
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

  return httpServer;
}
