import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;
let migrationsRun = false;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const connStr = process.env.AZURE_SQL_CONNECTION_STRING;
    if (!connStr) {
      throw new Error("AZURE_SQL_CONNECTION_STRING must be set for Azure SQL.");
    }
    const config: sql.config = {
      ...sql.ConnectionPool.parseConnectionString(connStr) as sql.config,
      connectionTimeout: 30000,
      requestTimeout: 30000,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };
    poolPromise = new sql.ConnectionPool(config).connect().then(async (pool) => {
      console.log("[db-mssql] Connected to Azure SQL successfully");
      if (!migrationsRun) {
        migrationsRun = true;
        await runMigrations(pool);
      }
      return pool;
    }).catch((err) => {
      console.error("[db-mssql] Failed to connect to Azure SQL:", err.message);
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

async function runMigrations(pool: sql.ConnectionPool): Promise<void> {
  const migrations = [
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'conversations')
     BEGIN CREATE TABLE conversations (id INT IDENTITY(1,1) PRIMARY KEY, title NVARCHAR(MAX) NOT NULL DEFAULT 'New Conversation', active_agent NVARCHAR(255) NULL, created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(), updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()) END`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
     BEGIN CREATE TABLE messages (id INT IDENTITY(1,1) PRIMARY KEY, conversation_id INT NOT NULL, role NVARCHAR(50) NOT NULL, content NVARCHAR(MAX) NOT NULL, agent_id NVARCHAR(255) NULL, created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(), CONSTRAINT FK_messages_conversations FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE) END`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'copilot_bots')
     BEGIN CREATE TABLE copilot_bots (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(255) NOT NULL, phase_id NVARCHAR(255) NOT NULL, skill_role NVARCHAR(255) NOT NULL, bot_endpoint NVARCHAR(MAX) NOT NULL, bot_secret NVARCHAR(MAX) NULL, embed_url NVARCHAR(MAX) NULL, description NVARCHAR(MAX) NULL, is_active BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(), updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()) END`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'phase_configs')
     BEGIN CREATE TABLE phase_configs (id INT IDENTITY(1,1) PRIMARY KEY, phase_id NVARCHAR(255) NOT NULL UNIQUE, system_prompt NVARCHAR(MAX) NOT NULL, deliverables NVARCHAR(MAX) NOT NULL, keywords NVARCHAR(MAX) NOT NULL, description NVARCHAR(MAX) NOT NULL, week_range NVARCHAR(255) NOT NULL, updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()) END`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
     BEGIN CREATE TABLE documents (id INT IDENTITY(1,1) PRIMARY KEY, conversation_id INT NULL, filename NVARCHAR(500) NOT NULL, original_name NVARCHAR(500) NOT NULL, mime_type NVARCHAR(255) NOT NULL, size INT NOT NULL, created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(), CONSTRAINT FK_documents_conversations FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE) END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('copilot_bots') AND name = 'embed_url') BEGIN ALTER TABLE copilot_bots ADD embed_url NVARCHAR(MAX) NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('copilot_bots') AND name = 'bot_secret') BEGIN ALTER TABLE copilot_bots ADD bot_secret NVARCHAR(MAX) NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('copilot_bots') AND name = 'description') BEGIN ALTER TABLE copilot_bots ADD description NVARCHAR(MAX) NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('copilot_bots') AND name = 'is_active') BEGIN ALTER TABLE copilot_bots ADD is_active BIT NOT NULL DEFAULT 1 END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('copilot_bots') AND name = 'bot_endpoint') BEGIN ALTER TABLE copilot_bots ADD bot_endpoint NVARCHAR(MAX) NOT NULL DEFAULT '' END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('messages') AND name = 'agent_id') BEGIN ALTER TABLE messages ADD agent_id NVARCHAR(255) NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('conversations') AND name = 'active_agent') BEGIN ALTER TABLE conversations ADD active_agent NVARCHAR(255) NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'conversation_id') BEGIN ALTER TABLE documents ADD conversation_id INT NULL END`,
    `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_messages_conversation_id') BEGIN CREATE INDEX IX_messages_conversation_id ON messages(conversation_id) END`,
    `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_copilot_bots_phase_id') BEGIN CREATE INDEX IX_copilot_bots_phase_id ON copilot_bots(phase_id) END`,
    `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_copilot_bots_phase_role') BEGIN CREATE INDEX IX_copilot_bots_phase_role ON copilot_bots(phase_id, skill_role) END`,
    `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_documents_conversation_id') BEGIN CREATE INDEX IX_documents_conversation_id ON documents(conversation_id) END`,
  ];

  for (const migration of migrations) {
    try {
      await pool.request().query(migration);
    } catch (err: any) {
      console.error(`[db-mssql] Migration warning: ${err.message}`);
    }
  }
  console.log("[db-mssql] Database migrations complete.");
}

export { sql };
