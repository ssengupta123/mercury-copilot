import { getDb } from "./db";
import {
  conversations, messages, copilotBots, phaseConfigs, documents, phaseDeliverableTiles,
  type Conversation, type Message, type InsertConversation, type InsertMessage,
  type CopilotBot, type InsertCopilotBot, type PhaseConfig, type InsertPhaseConfig,
  type Document, type InsertDocument, type PhaseDeliverableTile, type InsertPhaseDeliverableTile
} from "@shared/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getConversation(id: number): Promise<Conversation | undefined> {
    const db = await getDb();
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getAllConversations(): Promise<Conversation[]> {
    const db = await getDb();
    return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const db = await getDb();
    const [conv] = await db.insert(conversations).values(data).returning();
    return conv;
  }

  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const db = await getDb();
    const [conv] = await db
      .update(conversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conv;
  }

  async deleteConversation(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const db = await getDb();
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const db = await getDb();
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getAllCopilotBots(): Promise<CopilotBot[]> {
    const db = await getDb();
    return db.select().from(copilotBots).orderBy(asc(copilotBots.phaseId), asc(copilotBots.skillRole));
  }

  async getCopilotBotsByPhase(phaseId: string): Promise<CopilotBot[]> {
    const db = await getDb();
    return db.select().from(copilotBots).where(eq(copilotBots.phaseId, phaseId)).orderBy(asc(copilotBots.skillRole));
  }

  async getCopilotBot(id: number): Promise<CopilotBot | undefined> {
    const db = await getDb();
    const [bot] = await db.select().from(copilotBots).where(eq(copilotBots.id, id));
    return bot;
  }

  async createCopilotBot(data: InsertCopilotBot): Promise<CopilotBot> {
    const db = await getDb();
    const [bot] = await db.insert(copilotBots).values(data).returning();
    return bot;
  }

  async updateCopilotBot(id: number, data: Partial<InsertCopilotBot>): Promise<CopilotBot | undefined> {
    const db = await getDb();
    const [bot] = await db
      .update(copilotBots)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(copilotBots.id, id))
      .returning();
    return bot;
  }

  async deleteCopilotBot(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(copilotBots).where(eq(copilotBots.id, id));
  }

  async getActiveBotForPhaseAndRole(phaseId: string, skillRole: string): Promise<CopilotBot | undefined> {
    const db = await getDb();
    const [bot] = await db
      .select()
      .from(copilotBots)
      .where(
        and(
          eq(copilotBots.phaseId, phaseId),
          eq(copilotBots.skillRole, skillRole),
          eq(copilotBots.isActive, true)
        )
      );
    return bot;
  }

  async getAllPhaseConfigs(): Promise<PhaseConfig[]> {
    const db = await getDb();
    return db.select().from(phaseConfigs).orderBy(asc(phaseConfigs.phaseId));
  }

  async getPhaseConfig(phaseId: string): Promise<PhaseConfig | undefined> {
    const db = await getDb();
    const [config] = await db.select().from(phaseConfigs).where(eq(phaseConfigs.phaseId, phaseId));
    return config;
  }

  async upsertPhaseConfig(data: InsertPhaseConfig): Promise<PhaseConfig> {
    const db = await getDb();
    const existing = await this.getPhaseConfig(data.phaseId);
    if (existing) {
      const [updated] = await db
        .update(phaseConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(phaseConfigs.phaseId, data.phaseId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(phaseConfigs).values(data).returning();
    return created;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const db = await getDb();
    const [doc] = await db.insert(documents).values(data).returning();
    return doc;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const db = await getDb();
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentsByConversation(conversationId: number): Promise<Document[]> {
    const db = await getDb();
    return db.select().from(documents).where(eq(documents.conversationId, conversationId)).orderBy(asc(documents.createdAt));
  }

  async linkDocumentToConversation(id: number, conversationId: number): Promise<void> {
    const db = await getDb();
    await db.update(documents).set({ conversationId }).where(eq(documents.id, id));
  }

  async getDeliverableTilesByPhase(phaseId: string): Promise<PhaseDeliverableTile[]> {
    const db = await getDb();
    return db.select().from(phaseDeliverableTiles).where(eq(phaseDeliverableTiles.phaseId, phaseId)).orderBy(asc(phaseDeliverableTiles.sortOrder));
  }

  async getAllDeliverableTiles(): Promise<PhaseDeliverableTile[]> {
    const db = await getDb();
    return db.select().from(phaseDeliverableTiles).orderBy(asc(phaseDeliverableTiles.phaseId), asc(phaseDeliverableTiles.sortOrder));
  }

  async createDeliverableTile(data: InsertPhaseDeliverableTile): Promise<PhaseDeliverableTile> {
    const db = await getDb();
    const [tile] = await db.insert(phaseDeliverableTiles).values(data).returning();
    return tile;
  }

  async updateDeliverableTile(id: number, data: Partial<InsertPhaseDeliverableTile>): Promise<PhaseDeliverableTile | undefined> {
    const db = await getDb();
    const [tile] = await db
      .update(phaseDeliverableTiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(phaseDeliverableTiles.id, id))
      .returning();
    return tile;
  }

  async deleteDeliverableTile(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(phaseDeliverableTiles).where(eq(phaseDeliverableTiles.id, id));
  }
}
