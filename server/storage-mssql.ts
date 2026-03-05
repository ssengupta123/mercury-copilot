import { getPool, sql } from "./db-mssql";
import type {
  IStorage
} from "./storage";
import type {
  Conversation, Message, CopilotBot, PhaseConfig, Document,
  InsertConversation, InsertMessage, InsertCopilotBot, InsertPhaseConfig, InsertDocument
} from "@shared/schema";

export class MssqlStorage implements IStorage {
  async getConversation(id: number): Promise<Conversation | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM conversations WHERE id = @id");
    return this.mapConversation(result.recordset[0]);
  }

  async getAllConversations(): Promise<Conversation[]> {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT * FROM conversations ORDER BY updated_at DESC");
    return result.recordset.map(r => this.mapConversation(r)!);
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const pool = await getPool();
    const result = await pool.request()
      .input("title", sql.NVarChar, data.title || "New Conversation")
      .input("activeAgent", sql.NVarChar, data.activeAgent || null)
      .query(`
        INSERT INTO conversations (title, active_agent, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@title, @activeAgent, GETUTCDATE(), GETUTCDATE())
      `);
    return this.mapConversation(result.recordset[0])!;
  }

  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const pool = await getPool();
    const setClauses: string[] = ["updated_at = GETUTCDATE()"];
    const request = pool.request().input("id", sql.Int, id);

    if (data.title !== undefined) {
      setClauses.push("title = @title");
      request.input("title", sql.NVarChar, data.title);
    }
    if (data.activeAgent !== undefined) {
      setClauses.push("active_agent = @activeAgent");
      request.input("activeAgent", sql.NVarChar, data.activeAgent);
    }

    const result = await request.query(`
      UPDATE conversations SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    return this.mapConversation(result.recordset[0]);
  }

  async deleteConversation(id: number): Promise<void> {
    const pool = await getPool();
    await pool.request().input("id", sql.Int, id)
      .query("DELETE FROM messages WHERE conversation_id = @id");
    await pool.request().input("id", sql.Int, id)
      .query("DELETE FROM conversations WHERE id = @id");
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const pool = await getPool();
    const result = await pool.request()
      .input("conversationId", sql.Int, conversationId)
      .query("SELECT * FROM messages WHERE conversation_id = @conversationId ORDER BY created_at ASC");
    return result.recordset.map(r => this.mapMessage(r)!);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const pool = await getPool();
    const result = await pool.request()
      .input("conversationId", sql.Int, data.conversationId)
      .input("role", sql.NVarChar, data.role)
      .input("content", sql.NVarChar(sql.MAX), data.content)
      .input("agentId", sql.NVarChar, data.agentId || null)
      .query(`
        INSERT INTO messages (conversation_id, role, content, agent_id, created_at)
        OUTPUT INSERTED.*
        VALUES (@conversationId, @role, @content, @agentId, GETUTCDATE())
      `);
    return this.mapMessage(result.recordset[0])!;
  }

  async getAllCopilotBots(): Promise<CopilotBot[]> {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT * FROM copilot_bots ORDER BY phase_id ASC, skill_role ASC");
    return result.recordset.map(r => this.mapCopilotBot(r)!);
  }

  async getCopilotBotsByPhase(phaseId: string): Promise<CopilotBot[]> {
    const pool = await getPool();
    const result = await pool.request()
      .input("phaseId", sql.NVarChar, phaseId)
      .query("SELECT * FROM copilot_bots WHERE phase_id = @phaseId ORDER BY skill_role ASC");
    return result.recordset.map(r => this.mapCopilotBot(r)!);
  }

  async getCopilotBot(id: number): Promise<CopilotBot | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM copilot_bots WHERE id = @id");
    return this.mapCopilotBot(result.recordset[0]);
  }

  async createCopilotBot(data: InsertCopilotBot): Promise<CopilotBot> {
    const pool = await getPool();
    const result = await pool.request()
      .input("name", sql.NVarChar, data.name)
      .input("phaseId", sql.NVarChar, data.phaseId)
      .input("skillRole", sql.NVarChar, data.skillRole)
      .input("botEndpoint", sql.NVarChar, data.botEndpoint)
      .input("botSecret", sql.NVarChar, data.botSecret || null)
      .input("description", sql.NVarChar, data.description || null)
      .input("isActive", sql.Bit, data.isActive !== undefined ? data.isActive : true)
      .query(`
        INSERT INTO copilot_bots (name, phase_id, skill_role, bot_endpoint, bot_secret, description, is_active, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@name, @phaseId, @skillRole, @botEndpoint, @botSecret, @description, @isActive, GETUTCDATE(), GETUTCDATE())
      `);
    return this.mapCopilotBot(result.recordset[0])!;
  }

  async updateCopilotBot(id: number, data: Partial<InsertCopilotBot>): Promise<CopilotBot | undefined> {
    const pool = await getPool();
    const setClauses: string[] = ["updated_at = GETUTCDATE()"];
    const request = pool.request().input("id", sql.Int, id);

    if (data.name !== undefined) {
      setClauses.push("name = @name");
      request.input("name", sql.NVarChar, data.name);
    }
    if (data.phaseId !== undefined) {
      setClauses.push("phase_id = @phaseId");
      request.input("phaseId", sql.NVarChar, data.phaseId);
    }
    if (data.skillRole !== undefined) {
      setClauses.push("skill_role = @skillRole");
      request.input("skillRole", sql.NVarChar, data.skillRole);
    }
    if (data.botEndpoint !== undefined) {
      setClauses.push("bot_endpoint = @botEndpoint");
      request.input("botEndpoint", sql.NVarChar, data.botEndpoint);
    }
    if (data.botSecret !== undefined) {
      setClauses.push("bot_secret = @botSecret");
      request.input("botSecret", sql.NVarChar, data.botSecret);
    }
    if (data.description !== undefined) {
      setClauses.push("description = @description");
      request.input("description", sql.NVarChar, data.description);
    }
    if (data.isActive !== undefined) {
      setClauses.push("is_active = @isActive");
      request.input("isActive", sql.Bit, data.isActive);
    }

    const result = await request.query(`
      UPDATE copilot_bots SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    return this.mapCopilotBot(result.recordset[0]);
  }

  async deleteCopilotBot(id: number): Promise<void> {
    const pool = await getPool();
    await pool.request().input("id", sql.Int, id)
      .query("DELETE FROM copilot_bots WHERE id = @id");
  }

  async getActiveBotForPhaseAndRole(phaseId: string, skillRole: string): Promise<CopilotBot | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input("phaseId", sql.NVarChar, phaseId)
      .input("skillRole", sql.NVarChar, skillRole)
      .query("SELECT * FROM copilot_bots WHERE phase_id = @phaseId AND skill_role = @skillRole AND is_active = 1");
    return this.mapCopilotBot(result.recordset[0]);
  }

  async getAllPhaseConfigs(): Promise<PhaseConfig[]> {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT * FROM phase_configs ORDER BY phase_id ASC");
    return result.recordset.map(r => this.mapPhaseConfig(r)!);
  }

  async getPhaseConfig(phaseId: string): Promise<PhaseConfig | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input("phaseId", sql.NVarChar, phaseId)
      .query("SELECT * FROM phase_configs WHERE phase_id = @phaseId");
    return this.mapPhaseConfig(result.recordset[0]);
  }

  async upsertPhaseConfig(data: InsertPhaseConfig): Promise<PhaseConfig> {
    const pool = await getPool();
    const existing = await this.getPhaseConfig(data.phaseId);
    const deliverablesJson = JSON.stringify(data.deliverables);
    const keywordsJson = JSON.stringify(data.keywords);

    if (existing) {
      const result = await pool.request()
        .input("phaseId", sql.NVarChar, data.phaseId)
        .input("systemPrompt", sql.NVarChar(sql.MAX), data.systemPrompt)
        .input("deliverables", sql.NVarChar(sql.MAX), deliverablesJson)
        .input("keywords", sql.NVarChar(sql.MAX), keywordsJson)
        .input("description", sql.NVarChar(sql.MAX), data.description)
        .input("weekRange", sql.NVarChar, data.weekRange)
        .query(`
          UPDATE phase_configs SET system_prompt = @systemPrompt, deliverables = @deliverables,
            keywords = @keywords, description = @description, week_range = @weekRange, updated_at = GETUTCDATE()
          OUTPUT INSERTED.*
          WHERE phase_id = @phaseId
        `);
      return this.mapPhaseConfig(result.recordset[0])!;
    }

    const result = await pool.request()
      .input("phaseId", sql.NVarChar, data.phaseId)
      .input("systemPrompt", sql.NVarChar(sql.MAX), data.systemPrompt)
      .input("deliverables", sql.NVarChar(sql.MAX), deliverablesJson)
      .input("keywords", sql.NVarChar(sql.MAX), keywordsJson)
      .input("description", sql.NVarChar(sql.MAX), data.description)
      .input("weekRange", sql.NVarChar, data.weekRange)
      .query(`
        INSERT INTO phase_configs (phase_id, system_prompt, deliverables, keywords, description, week_range, updated_at)
        OUTPUT INSERTED.*
        VALUES (@phaseId, @systemPrompt, @deliverables, @keywords, @description, @weekRange, GETUTCDATE())
      `);
    return this.mapPhaseConfig(result.recordset[0])!;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const pool = await getPool();
    const result = await pool.request()
      .input("conversationId", sql.Int, data.conversationId || null)
      .input("filename", sql.NVarChar, data.filename)
      .input("originalName", sql.NVarChar, data.originalName)
      .input("mimeType", sql.NVarChar, data.mimeType)
      .input("size", sql.Int, data.size)
      .query(`
        INSERT INTO documents (conversation_id, filename, original_name, mime_type, size, created_at)
        OUTPUT INSERTED.*
        VALUES (@conversationId, @filename, @originalName, @mimeType, @size, GETUTCDATE())
      `);
    return this.mapDocument(result.recordset[0])!;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM documents WHERE id = @id");
    return this.mapDocument(result.recordset[0]);
  }

  async getDocumentsByConversation(conversationId: number): Promise<Document[]> {
    const pool = await getPool();
    const result = await pool.request()
      .input("conversationId", sql.Int, conversationId)
      .query("SELECT * FROM documents WHERE conversation_id = @conversationId ORDER BY created_at ASC");
    return result.recordset.map(r => this.mapDocument(r)!);
  }

  private mapConversation(row: any): Conversation | undefined {
    if (!row) return undefined;
    return {
      id: row.id,
      title: row.title,
      activeAgent: row.active_agent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapMessage(row: any): Message | undefined {
    if (!row) return undefined;
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      agentId: row.agent_id,
      createdAt: row.created_at,
    };
  }

  private mapCopilotBot(row: any): CopilotBot | undefined {
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      phaseId: row.phase_id,
      skillRole: row.skill_role,
      botEndpoint: row.bot_endpoint,
      botSecret: row.bot_secret,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPhaseConfig(row: any): PhaseConfig | undefined {
    if (!row) return undefined;
    let deliverables = row.deliverables;
    let keywords = row.keywords;
    if (typeof deliverables === "string") deliverables = JSON.parse(deliverables);
    if (typeof keywords === "string") keywords = JSON.parse(keywords);
    return {
      id: row.id,
      phaseId: row.phase_id,
      systemPrompt: row.system_prompt,
      deliverables,
      keywords,
      description: row.description,
      weekRange: row.week_range,
      updatedAt: row.updated_at,
    };
  }

  private mapDocument(row: any): Document | undefined {
    if (!row) return undefined;
    return {
      id: row.id,
      conversationId: row.conversation_id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: row.size,
      createdAt: row.created_at,
    };
  }
}
