import type {
  Conversation, Message, CopilotBot, PhaseConfig, Document, PhaseDeliverableTile,
  InsertConversation, InsertMessage, InsertCopilotBot, InsertPhaseConfig, InsertDocument, InsertPhaseDeliverableTile
} from "@shared/schema";

export interface IStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;

  getAllCopilotBots(): Promise<CopilotBot[]>;
  getCopilotBotsByPhase(phaseId: string): Promise<CopilotBot[]>;
  getCopilotBot(id: number): Promise<CopilotBot | undefined>;
  createCopilotBot(data: InsertCopilotBot): Promise<CopilotBot>;
  updateCopilotBot(id: number, data: Partial<InsertCopilotBot>): Promise<CopilotBot | undefined>;
  deleteCopilotBot(id: number): Promise<void>;
  getActiveBotForPhaseAndRole(phaseId: string, skillRole: string): Promise<CopilotBot | undefined>;

  getAllPhaseConfigs(): Promise<PhaseConfig[]>;
  getPhaseConfig(phaseId: string): Promise<PhaseConfig | undefined>;
  upsertPhaseConfig(data: InsertPhaseConfig): Promise<PhaseConfig>;

  createDocument(data: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByConversation(conversationId: number): Promise<Document[]>;
  linkDocumentToConversation(id: number, conversationId: number): Promise<void>;

  getDeliverableTilesByPhase(phaseId: string): Promise<PhaseDeliverableTile[]>;
  getAllDeliverableTiles(): Promise<PhaseDeliverableTile[]>;
  createDeliverableTile(data: InsertPhaseDeliverableTile): Promise<PhaseDeliverableTile>;
  updateDeliverableTile(id: number, data: Partial<InsertPhaseDeliverableTile>): Promise<PhaseDeliverableTile | undefined>;
  deleteDeliverableTile(id: number): Promise<void>;
}

let storageInstance: IStorage | null = null;

async function initStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;

  if (process.env.AZURE_SQL_CONNECTION_STRING) {
    const { MssqlStorage } = await import("./storage-mssql");
    storageInstance = new MssqlStorage();
  } else {
    const { DatabaseStorage } = await import("./storage-pg");
    storageInstance = new DatabaseStorage();
  }

  return storageInstance;
}

class StorageProxy implements IStorage {
  private getStorage(): Promise<IStorage> {
    return initStorage();
  }

  async getConversation(id: number) { return (await this.getStorage()).getConversation(id); }
  async getAllConversations() { return (await this.getStorage()).getAllConversations(); }
  async createConversation(data: InsertConversation) { return (await this.getStorage()).createConversation(data); }
  async updateConversation(id: number, data: Partial<InsertConversation>) { return (await this.getStorage()).updateConversation(id, data); }
  async deleteConversation(id: number) { return (await this.getStorage()).deleteConversation(id); }
  async getMessagesByConversation(conversationId: number) { return (await this.getStorage()).getMessagesByConversation(conversationId); }
  async createMessage(data: InsertMessage) { return (await this.getStorage()).createMessage(data); }
  async getAllCopilotBots() { return (await this.getStorage()).getAllCopilotBots(); }
  async getCopilotBotsByPhase(phaseId: string) { return (await this.getStorage()).getCopilotBotsByPhase(phaseId); }
  async getCopilotBot(id: number) { return (await this.getStorage()).getCopilotBot(id); }
  async createCopilotBot(data: InsertCopilotBot) { return (await this.getStorage()).createCopilotBot(data); }
  async updateCopilotBot(id: number, data: Partial<InsertCopilotBot>) { return (await this.getStorage()).updateCopilotBot(id, data); }
  async deleteCopilotBot(id: number) { return (await this.getStorage()).deleteCopilotBot(id); }
  async getActiveBotForPhaseAndRole(phaseId: string, skillRole: string) { return (await this.getStorage()).getActiveBotForPhaseAndRole(phaseId, skillRole); }
  async getAllPhaseConfigs() { return (await this.getStorage()).getAllPhaseConfigs(); }
  async getPhaseConfig(phaseId: string) { return (await this.getStorage()).getPhaseConfig(phaseId); }
  async upsertPhaseConfig(data: InsertPhaseConfig) { return (await this.getStorage()).upsertPhaseConfig(data); }
  async createDocument(data: InsertDocument) { return (await this.getStorage()).createDocument(data); }
  async getDocument(id: number) { return (await this.getStorage()).getDocument(id); }
  async getDocumentsByConversation(conversationId: number) { return (await this.getStorage()).getDocumentsByConversation(conversationId); }
  async linkDocumentToConversation(id: number, conversationId: number) { return (await this.getStorage()).linkDocumentToConversation(id, conversationId); }
  async getDeliverableTilesByPhase(phaseId: string) { return (await this.getStorage()).getDeliverableTilesByPhase(phaseId); }
  async getAllDeliverableTiles() { return (await this.getStorage()).getAllDeliverableTiles(); }
  async createDeliverableTile(data: InsertPhaseDeliverableTile) { return (await this.getStorage()).createDeliverableTile(data); }
  async updateDeliverableTile(id: number, data: Partial<InsertPhaseDeliverableTile>) { return (await this.getStorage()).updateDeliverableTile(id, data); }
  async deleteDeliverableTile(id: number) { return (await this.getStorage()).deleteDeliverableTile(id); }
}

export const storage: IStorage = new StorageProxy();
