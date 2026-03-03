# Mercury Copilot - AI Delivery Orchestrator

## Overview
Mercury Copilot is an AI-powered chatbot for Reason Group's Mercury Method — a 13-week delivery framework purpose-built for government. It uses an intelligent orchestrator to route user queries to 5 phase-specific agents, each covering a phase of the Mercury delivery process. Branded with Reason Group's teal identity.

## Architecture

### Backend (Express + TypeScript)
- **server/index.ts** - Express server entry point
- **server/routes.ts** - API routes for conversations and messages
- **server/orchestrator.ts** - AI orchestrator using GPT-5-nano for routing and GPT-5.2 for agent responses
- **server/agents.ts** - 5 Mercury phase agents with system prompts, keywords, deliverables, and prerequisites
- **server/storage.ts** - Database storage layer using Drizzle ORM
- **server/db.ts** - PostgreSQL database connection via standard pg driver (compatible with Azure PostgreSQL)

### Frontend (React + TypeScript)
- **client/src/App.tsx** - Root app component with routing and providers
- **client/src/pages/home.tsx** - Main page with sidebar + chat layout
- **client/src/components/chat-view.tsx** - Chat view with SSE streaming support
- **client/src/components/chat-sidebar.tsx** - Sidebar with Reason Group logo, conversations, and Mercury phases
- **client/src/components/chat-input.tsx** - Chat input with keyboard shortcuts
- **client/src/components/chat-message.tsx** - Message display with agent indicators
- **client/src/components/welcome-screen.tsx** - Welcome screen with suggestion cards
- **client/src/components/markdown-renderer.tsx** - XSS-safe markdown rendering
- **client/src/components/agent-icon.tsx** - Dynamic agent icon mapping
- **client/src/components/theme-provider.tsx** - Dark/light theme toggle (defaults to light)
- **client/src/lib/types.ts** - Frontend TypeScript types

### Shared
- **shared/schema.ts** - Drizzle schema for conversations, messages, and copilot_bots tables

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
- Intelligent message routing via AI orchestrator
- Streaming AI responses via SSE
- Agent prerequisite checking
- Conversation persistence in PostgreSQL
- Admin configuration panel (/admin) for registering Microsoft Copilot Studio bots per phase and skill role
- Copilot bot CRUD via API: GET/POST/PATCH/DELETE /api/admin/copilot-bots
- Orchestrator awareness of configured bots — informs agents about available specialist bots
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
- PostgreSQL + Drizzle ORM (database)
- OpenAI via Replit AI Integrations (AI)
- Tailwind CSS + shadcn/ui (styling)
- TanStack Query (data fetching)

## Database
PostgreSQL with tables:
- `conversations` - id, title, activeAgent, createdAt, updatedAt
- `messages` - id, conversationId, role, content, agentId, createdAt
- `copilot_bots` - id, name, phaseId, skillRole, botEndpoint, botSecret, description, isActive, createdAt, updatedAt

## Deployment
- **Dev environment**: Replit (this project)
- **Production**: Azure Web App + Azure Database for PostgreSQL
- **CI/CD**: GitHub Actions (`.github/workflows/azure-deploy.yml`) — auto-deploys on push to `main`
- **Build**: `npm run build` → `npm start` (frontend Vite + backend esbuild → `dist/index.cjs`)
- **Health check**: GET `/api/health` — verifies app + database connectivity
- **Azure config**: Set `DATABASE_SSL=true` for Azure PostgreSQL SSL connections
- **Deployment guide**: See `AZURE_DEPLOYMENT.md` for full setup instructions

## Admin Panel
- Route: /admin
- Page: client/src/pages/admin.tsx
- API: /api/admin/copilot-bots (CRUD)
- Accessible via "Admin Settings" link in sidebar
- Manages Microsoft Copilot Studio bot registrations per Mercury phase and skill role
- Skill roles: Business Analyst, Solution Architect, Data Engineer, Tech Lead, Tester, Business Consultant, Rules Expert, UX Designer, Change Manager, Project Coordinator, Custom
