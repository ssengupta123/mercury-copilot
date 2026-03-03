import { db } from "./db";
import { conversations, messages, type Conversation, type Message, type InsertConversation, type InsertMessage } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(data).returning();
    return conv;
  }

  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [conv] = await db
      .update(conversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conv;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();
