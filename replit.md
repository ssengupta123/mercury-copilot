# Mercury Copilot - AI Delivery Orchestrator

## Overview
Mercury Copilot is an AI-powered chatbot for Reason Group's Mercury Method — a 13-week delivery framework purpose-built for government. It uses an intelligent orchestrator to route user queries to 5 phase-specific agents, each covering a phase of the Mercury delivery process. Branded with Reason Group's teal identity.

## Architecture

### Backend (Express + TypeScript)
- **server/index.ts** - Express server entry point
- **server/routes.ts** - API routes for conversations and messages
- **server/orchestrator.ts** - Keyword-based message routing to Mercury phase agents (no OpenAI dependency)
- **server/agents.ts** - 5 Mercury phase agents with system prompts, keywords, deliverables, and prerequisites
- **server/storage.ts** - Storage interface + proxy (auto-selects PG or MSSQL based on environment)
- **server/storage-pg.ts** - PostgreSQL storage implementation (Drizzle ORM, used in Replit dev)
- **server/storage-mssql.ts** - Azure SQL storage implementation (mssql package, used in Azure production)
- **server/db.ts** - PostgreSQL database connection (Replit dev)
- **server/db-mssql.ts** - Azure SQL database connection (Azure production)

### Frontend (React + TypeScript)
- **client/src/App.tsx** - Root app component with routing and providers
- **client/src/pages/home.tsx** - Main page with sidebar + chat layout
- **client/src/pages/admin.tsx** - Admin panel for bot configuration
- **client/src/pages/phase-config.tsx** - Phase configuration editor (prompts, deliverables, keywords)
- **client/src/components/chat-view.tsx** - Chat view with SSE streaming support
- **client/src/components/chat-sidebar.tsx** - Sidebar with Reason Group logo, conversations, and Mercury phases
- **client/src/components/chat-input.tsx** - Chat input with keyboard shortcuts and file upload
- **client/src/components/chat-message.tsx** - Message display with agent indicators
- **client/src/components/welcome-screen.tsx** - Welcome screen with suggestion cards
- **client/src/components/markdown-renderer.tsx** - XSS-safe markdown rendering
- **client/src/components/agent-icon.tsx** - Dynamic agent icon mapping
- **client/src/components/theme-provider.tsx** - Dark/light theme toggle (defaults to light)
- **client/src/lib/types.ts** - Frontend TypeScript types

### Shared
- **shared/schema.ts** - Drizzle schema for conversations, messages, copilot_bots, phase_configs, and documents tables

## Mercury Method — 5 Phases, 13 Weeks
1. **Mobilisation** (Week 1) - Mission placemat, success criteria, governance, stakeholder ID, seven guardrails
2. **Planning** (Week 1) - Team assembly, roles, sandbox environment, data access, customer panel, champion team
3. **Discovery** (Weeks 2-3) - Customer research, data exploration, prototyping (multiple per day), feedback loops, daily showcases
4. **Delivery** (Weeks 4-12) - Iterative development, daily playbacks, weekly value showcases, continuous user testing, champion validation
5. **Approval** (Week 13) - Final showcase, value validation, handover documentation, lessons learned, next steps

## Mercury Core Principles (Manifesto)
1. High Performance Teams — trans-disciplinary (data, tech, process, customer)
2. Engage with Purpose — clear north star and mission alignment
3. Listen Faster Than You Deliver — feedback loops faster than delivery
4. Learn Rapidly — iterate, progress over perfection
5. Attack Ambiguity with Gusto — VUCA, don't rush to certainty

## Seven Guardrails
1. Create a Workzone
2. Create a Placemat
3. Create a Sandbox
4. Create Actionable Project Insights
5. Create a Customer Panel
6. Create a Champion Working Team
7. Create Value Showcases Daily

## Key Features
- Keyword-based message routing to Mercury phase agents
- Direct routing to Copilot Studio bots when assigned to phase; "no specialist agent available" when not
- Two bot integration modes: (1) Embed URL — bot webchat embedded seamlessly in chat area, (2) DirectLine API — bot called via API with responses streamed
- When embed URL is set, the bot's own webchat fills the chat area (no API rate limits); otherwise falls back to DirectLine API
- Real-time status updates ("Connecting to...") while calling external bots via API
- Actionable error messages for common Copilot Studio configuration issues
- File upload (up to 10MB) — paperclip icon in chat input, stored on disk
- Phase configuration admin page (/admin/phases) — edit prompts, deliverables, keywords per phase
- Admin bot panel (/admin) for registering Microsoft Copilot Studio bots per phase and skill role
- Copilot bot CRUD via API: GET/POST/PATCH/DELETE /api/admin/copilot-bots
- SSO via Microsoft Entra ID (MSAL) with identity flowing to Copilot Studio bots
- Conversation persistence in PostgreSQL (dev) / Azure SQL (prod)
- Dark/light theme toggle (light default, white background)
- Rich markdown rendering for templates and guidance
- Reason Group logo in sidebar and welcome screen

## Branding
- Primary color: Teal HSL(181, 62%, 45%)
- Light mode: White background, white sidebar, dark text
- Dark mode: Grey background with darker sidebar
- Fonts: Inter (sans), JetBrains Mono (mono)
- Logo: attached_assets/Reason_Group_Logo_CMYK_(1)_1772539075105.png (horizontal format)

## Tech Stack
- React + TypeScript + Vite (frontend)
- Express + TypeScript (backend)
- PostgreSQL + Drizzle ORM (dev database, Replit)
- Azure SQL + mssql package (production database, Azure)
- Microsoft Copilot Studio (specialist bot responses via DirectLine API)
- Tailwind CSS + shadcn/ui (styling)
- TanStack Query (data fetching)

## Database
Dual database support — auto-detected by environment variable:
- **Dev (Replit)**: PostgreSQL via `DATABASE_URL` + Drizzle ORM
- **Prod (Azure)**: Azure SQL via `AZURE_SQL_CONNECTION_STRING` + mssql package

Tables:
- `conversations` - id, title, active_agent, created_at, updated_at
- `messages` - id, conversation_id, role, content, agent_id, created_at
- `copilot_bots` - id, name, phase_id, skill_role, bot_endpoint, bot_secret, embed_url, description, is_active, created_at, updated_at
- `phase_configs` - id, phase_id (unique), system_prompt, deliverables (array), keywords (array), description, week_range, updated_at
- `documents` - id, conversation_id, filename, original_name, mime_type, size, created_at

Azure SQL schema init script: `scripts/azure-sql-init.sql`

## Deployment
- **Dev environment**: Replit (this project) with PostgreSQL
- **Production**: Azure Web App + Azure SQL Database
- **CI/CD**: GitHub Actions (`.github/workflows/azure-deploy.yml`) — auto-deploys on push to `main`
- **Build**: `npm run build` → `npm start` (frontend Vite + backend esbuild → `dist/index.cjs`)
- **Health check**: GET `/api/health` — verifies app + database connectivity
- **Azure config**: Set `AZURE_SQL_CONNECTION_STRING` for Azure SQL connections
- **Deployment guide**: See `AZURE_DEPLOYMENT.md` for full setup instructions

## Admin Panel
- Route: /admin — Bot configuration
- Route: /admin/phases — Phase configuration (prompts, deliverables, keywords)
- Pages: client/src/pages/admin.tsx, client/src/pages/phase-config.tsx
- API: /api/admin/copilot-bots (CRUD), /api/admin/phase-configs (GET all, PUT per phase)
- API: /api/upload (POST file), /api/uploads/:filename (GET file), /api/conversations/:id/documents (GET)
- Accessible via "Admin Settings" link in sidebar
- Manages Microsoft Copilot Studio bot registrations per Mercury phase and skill role
- Phase config allows editing system prompts, deliverables, and keywords per phase
- File upload supports PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, PPTX, PPT, PNG, JPG, GIF (max 10MB)
