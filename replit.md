# Mercury Copilot - AI Delivery Orchestrator

## Overview
Mercury Copilot is an AI-powered chatbot that orchestrates Reason Group's Mercury delivery methodology. It uses an intelligent orchestrator to route user queries to 9 specialist agents, each covering a specific phase of the delivery process. Branded with Reason Group's teal identity (HSL 181 62% 45%).

## Architecture

### Backend (Express + TypeScript)
- **server/index.ts** - Express server entry point
- **server/routes.ts** - API routes for conversations and messages
- **server/orchestrator.ts** - AI orchestrator that routes messages to specialist agents using GPT-5-nano for routing and GPT-5.2 for agent responses
- **server/agents.ts** - 9 Mercury agent definitions with system prompts, keywords, deliverables, and prerequisites
- **server/storage.ts** - Database storage layer using Drizzle ORM
- **server/db.ts** - PostgreSQL database connection via Neon serverless

### Frontend (React + TypeScript)
- **client/src/App.tsx** - Root app component with routing and providers
- **client/src/pages/home.tsx** - Main page with sidebar + chat layout
- **client/src/components/chat-view.tsx** - Chat view with SSE streaming support
- **client/src/components/chat-sidebar.tsx** - Sidebar with Reason Group logo, conversations, and Mercury phases list
- **client/src/components/chat-input.tsx** - Chat input with keyboard shortcuts
- **client/src/components/chat-message.tsx** - Message display with agent indicators
- **client/src/components/welcome-screen.tsx** - Welcome screen with suggestion cards
- **client/src/components/markdown-renderer.tsx** - XSS-safe markdown rendering
- **client/src/components/agent-icon.tsx** - Dynamic agent icon mapping
- **client/src/components/theme-provider.tsx** - Dark/light theme toggle
- **client/src/lib/types.ts** - Frontend TypeScript types for Agent, Conversation, Message, SSE events

### Shared
- **shared/schema.ts** - Drizzle schema for conversations and messages tables

## Mercury Phases (9)
1. Initiation - SOW, stakeholder matrix, RAID log, kick-off deck
2. Planning - Project plan, testing/training/deployment strategies, development standards
3. Discovery & Design - Requirements (Epic > Feature > User Story > AC), MoSCoW, fit-gap, HLD, data migration
4. Design - Impact assessment, technical design, traceability matrix, sprint planning
5. Build - As-built docs, showcases, testing plan, unit/SIT test cases, UAT kick-off pack
6. UAT Planning - UAT training, scenarios (customer-owned), use cases
7. UAT Execution - Defect management, UAT execution and sign-off
8. Deployment - Release management, release checklist, TVT, BVT
9. Hypercare - Daily standups, defect/incident status meetings, post go-live support

## Key Features
- Intelligent message routing via AI orchestrator
- Streaming AI responses via SSE
- Agent prerequisite checking (warns when phases are skipped)
- Conversation persistence in PostgreSQL
- Dark/light theme toggle with dark teal sidebar
- Rich markdown rendering for templates and guidance
- Reason Group logo in sidebar and welcome screen

## Branding
- Primary color: Teal HSL(181, 62%, 45%) - matches Reason Group brand
- Dark sidebar: HSL(181, 25%, 10-18%)
- Fonts: Inter (sans), JetBrains Mono (mono)
- Logo: attached_assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png

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
