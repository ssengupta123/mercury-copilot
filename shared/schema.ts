import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Conversation"),
  activeAgent: text("active_agent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  agentId: text("agent_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const copilotBots = pgTable("copilot_bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phaseId: text("phase_id").notNull(),
  skillRole: text("skill_role").notNull(),
  botEndpoint: text("bot_endpoint").notNull().default(""),
  botSecret: text("bot_secret"),
  embedUrl: text("embed_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const phaseConfigs = pgTable("phase_configs", {
  id: serial("id").primaryKey(),
  phaseId: text("phase_id").notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  deliverables: text("deliverables").array().notNull(),
  keywords: text("keywords").array().notNull(),
  description: text("description").notNull(),
  weekRange: text("week_range").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCopilotBotSchema = createInsertSchema(copilotBots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CopilotBot = typeof copilotBots.$inferSelect;
export type InsertCopilotBot = z.infer<typeof insertCopilotBotSchema>;

export const insertPhaseConfigSchema = createInsertSchema(phaseConfigs).omit({
  id: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export type PhaseConfig = typeof phaseConfigs.$inferSelect;
export type InsertPhaseConfig = z.infer<typeof insertPhaseConfigSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1),
});
