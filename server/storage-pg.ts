import { getDb } from "./db";
import {
  conversations, messages, copilotBots,
  type Conversation, type Message, type InsertConversation, type InsertMessage,
  type CopilotBot, type InsertCopilotBot
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
}
