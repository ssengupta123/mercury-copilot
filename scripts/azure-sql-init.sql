IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'conversations')
BEGIN
    CREATE TABLE conversations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(MAX) NOT NULL DEFAULT 'New Conversation',
        active_agent NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
BEGIN
    CREATE TABLE messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        conversation_id INT NOT NULL,
        role NVARCHAR(50) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        agent_id NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_messages_conversations
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'copilot_bots')
BEGIN
    CREATE TABLE copilot_bots (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phase_id NVARCHAR(255) NOT NULL,
        skill_role NVARCHAR(255) NOT NULL,
        bot_endpoint NVARCHAR(MAX) NOT NULL,
        bot_secret NVARCHAR(MAX) NULL,
        description NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_messages_conversation_id')
BEGIN
    CREATE INDEX IX_messages_conversation_id ON messages(conversation_id);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_copilot_bots_phase_id')
BEGIN
    CREATE INDEX IX_copilot_bots_phase_id ON copilot_bots(phase_id);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_copilot_bots_phase_role')
BEGIN
    CREATE INDEX IX_copilot_bots_phase_role ON copilot_bots(phase_id, skill_role);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'phase_configs')
BEGIN
    CREATE TABLE phase_configs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        phase_id NVARCHAR(255) NOT NULL UNIQUE,
        system_prompt NVARCHAR(MAX) NOT NULL,
        deliverables NVARCHAR(MAX) NOT NULL,
        keywords NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        week_range NVARCHAR(255) NOT NULL,
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
BEGIN
    CREATE TABLE documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        conversation_id INT NULL,
        filename NVARCHAR(500) NOT NULL,
        original_name NVARCHAR(500) NOT NULL,
        mime_type NVARCHAR(255) NOT NULL,
        size INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_documents_conversations
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_documents_conversation_id')
BEGIN
    CREATE INDEX IX_documents_conversation_id ON documents(conversation_id);
END;
