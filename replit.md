# Mercury Copilot - AI Delivery Orchestrator

## Overview
Mercury Copilot is an AI-powered chatbot that orchestrates a 12-week delivery methodology called Mercury. It uses an intelligent orchestrator to route user queries to 12 specialist agents, each covering a specific phase of the delivery process.

## Architecture

### Backend (Express + TypeScript)
- **server/index.ts** - Express server entry point
- **server/routes.ts** - API routes for conversations and messages
- **server/orchestrator.ts** - AI orchestrator that routes messages to specialist agents using GPT-5-nano for routing and GPT-5.2 for agent responses
- **server/agents.ts** - 12 Mercury agent definitions with system prompts, keywords, and prerequisites
- **server/storage.ts** - Database storage layer using Drizzle ORM
- **server/db.ts** - PostgreSQL database connection via Neon serverless

### Frontend (React + TypeScript)
- **client/src/App.tsx** - Root app component with routing and providers
- **client/src/pages/home.tsx** - Main page with sidebar + chat layout
- **client/src/components/chat-view.tsx** - Chat view with SSE streaming support
- **client/src/components/chat-sidebar.tsx** - Sidebar with conversations and agents list
- **client/src/components/chat-input.tsx** - Chat input with keyboard shortcuts
- **client/src/components/chat-message.tsx** - Message display with agent indicators
- **client/src/components/welcome-screen.tsx** - Welcome screen with suggestion cards
- **client/src/components/markdown-renderer.tsx** - XSS-safe markdown rendering
- **client/src/components/agent-icon.tsx** - Dynamic agent icon mapping
- **client/src/components/theme-provider.tsx** - Dark/light theme toggle

### Shared
- **shared/schema.ts** - Drizzle schema for conversations and messages tables

## Mercury Agents (12)
1. Discovery & Scoping (Weeks 1-2)
2. Business Analysis (Week 3)
3. Solution Architecture (Week 4)
4. Change Management (Week 5)
5. Project Planning (Week 6)
6. UX & Design (Week 7)
7. Development (Week 8)
8. Testing & QA (Week 9)
9. Training & Enablement (Week 10)
10. Deployment & Go-Live (Week 11)
11. Hypercare & Stabilization (Week 12)
12. Governance & Reporting (Continuous)

## Key Features
- Intelligent message routing via AI orchestrator
- Streaming AI responses via SSE
- Agent prerequisite checking (warns when phases are skipped)
- Conversation persistence in PostgreSQL
- Dark/light theme toggle
- Rich markdown rendering for templates and guidance

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
