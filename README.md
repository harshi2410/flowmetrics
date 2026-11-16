<<<<<<< HEAD
# Flowmetrics — AI-Powered Enterprise Operations Platform
deployed link - https://flowmetrics-xf93.onrender.com Email: admin@flowmetrics.io Password: flowmetrics2026
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Raw%20SQL%20(No%20ORM)-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com/)

**Flowmetrics** is a production-oriented, AI-powered Enterprise Operations Platform designed to streamline cross-functional engineering workflows, project delivery, team capacity, enterprise support triage, internal knowledge retrieval, and automated agent execution.

Built with a decoupled **Next.js 16 App Router** frontend, an **Express.js TypeScript** enterprise backend, and direct **PostgreSQL** parameterized persistence (without Prisma or ORMs), Flowmetrics combines deep operational governance with bounded, auditable AI agents.

---

## 📑 Table of Contents

- [Core Platform Capabilities](#-core-platform-capabilities)
- [System Architecture](#-system-architecture)
- [Autonomous Agent Execution Workflow](#-autonomous-agent-execution-workflow)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Database Architecture & Migrations](#-database-architecture--migrations)
- [API Reference](#-api-reference)
- [Security & Governance](#-security--governance)
- [Appearance & Themes (Dark / Light)](#-appearance--themes-dark--light)
- [Local Development Setup](#-local-development-setup)
- [Automated Verification & Testing](#-automated-verification--testing)
- [Deployment Guide](#-deployment-guide)

---

## 🌟 Core Platform Capabilities

### 1. Enterprise Operations & Project Management
- **Interactive Kanban Boards**: Real-time task board with drag-and-drop state transitions (`to_do`, `in_progress`, `review`, `done`), priority markers, estimated vs. actual hour tracking, and assignee allocation.
- **Project & Milestone Tracking**: Multi-project tracking with progress velocity, target due dates, and health scoring.
- **Team Capacity & Workload Balancing**: Real-time sprint capacity distribution tracking active vs. completed tasks, logged hours, and overloaded member detection.

### 2. Enterprise Support Operations & SLA Tracking
- **Automated Support Helpdesk**: Centralized support queue managing incoming issues with severity classification, SLA countdowns, customer metadata, and audit logs.
- **SLA Breach Monitoring**: Real-time tracking of First Response and Resolution SLAs based on priority (`low`, `medium`, `high`, `critical`).
- **Internal Knowledge Retrieval**: Direct integration between tickets and internal runbooks for instant contextual triage.

### 3. Knowledge Base & RAG (Retrieval-Augmented Generation)
- **Document & Runbook Indexing**: Ingest standard operating procedures (SOPs), incident playbooks, API docs, and runbooks.
- **Semantic Similarity Search**: Context retrieval with bounded similarity scoring to enrich AI agent prompts with verified company knowledge.

### 4. Controlled AI Agent Orchestration
- **Specialized Operational Agents**:
  - **Support Triage Agent**: Ingests incoming tickets, searches knowledge base runbooks, assesses severity, classifies root causes, and recommends team routing.
  - **Operations Orchestrator**: Coordinates tasks across projects, balances sprint workloads, and drafts engineering mitigation plans.
- **Bounded Execution Loops**: Prevents runaway token loops with max-step limits, cycle detection, and strict state-machine bounds (`idle` → `planning` → `retrieving_context` → `reasoning` → `awaiting_approval` → `executing` → `completed`).
- **Validated Tool Registry**: Parameterized tool executions validated at runtime with Zod schemas.

### 5. Human-in-the-Loop (HITL) Approvals
- **Risk-Gated Actions**: High-risk tool calls (e.g., paging on-call engineers, escalating to critical, reassigning teams) automatically suspend execution into `awaiting_approval`.
- **Operator Review Console**: Engineering leads and managers can review proposed actions, payloads, and rationale to approve or reject with audit comments.
- **One-Time Execution Guarantee**: Approved actions execute exactly once with complete idempotency.

### 6. Agent Observability & Evaluation Deck
- **Step-by-Step Execution Traces**: Full trace breakdown with step latency, states, and input/output payload visibility.
- **Telemetry & Cost Accounting**: Live token consumption, execution durations, and tool failure metrics.
- **Regression Benchmarking**: Run evaluation test suites comparing agent reasoning against gold-standard historical outcomes.

### 7. Event-Driven Workflow Automation
- **Configurable Event Triggers**: Trigger automated workflows on platform events (`ticket.created`, `ticket.updated`, `task.status_changed`, `member.invited`).
- **Conditional Dispatch**: Filter events by priority, tags, or severity to trigger webhooks, notifications, or direct AI agent runs.

### 8. Model Context Protocol (MCP) Interoperability
- Standardized MCP tool discovery and execution endpoints (`/api/mcp/tools`, `/api/mcp/execute`) enabling external IDEs and agents to interact securely with Flowmetrics.

### 9. Multi-Tenant SaaS & Role-Based Access Control (RBAC)
- **Tenant Isolation**: Strict organization-scoped database queries (`WHERE organization_id = $1`). Organization IDs are never trusted from the browser.
- **8 Granular Roles**: Owner, Organization Admin, Operations Manager, Project Manager, Support Manager, Support Agent, Team Member, Viewer.
- **Permission Matrix**: Fine-grained permissions governing projects, tasks, support tickets, knowledge base, agent execution, and audit logs.

### 10. AI Content Studio (Preserved Feature)
- Dedicated studio (`/admin/generator`) for generating social captions (LinkedIn, Twitter/X, Instagram), SEO blog posts, and executive summaries with dual-engine reliability (OpenAI API + local heuristic fallback).

---

## 🏗️ System Architecture

```
                          FLOWMETRICS SYSTEM ARCHITECTURE

  ┌────────────────────────────────────────────────────────────────────────┐
  │                 NEXT.JS 16 FRONTEND (App Router / React 19)            │
  │  - Public Landing Page (/page.tsx) & Blog (/blog/[slug])               │
  │  - Admin Dashboard, Kanban Board, Workload, Support Helpdesk           │
  │  - Agent Control Deck, Observability Traces, Workflow Engine           │
  │  - Settings & Appearance (Dark / Light Theme Engine)                   │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTP / Signed JWT
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 EXPRESS.JS BACKEND (TypeScript / Modular)              │
  │                                                                        │
  │  [ Security & Middleware Layer ]                                       │
  │  - Helmet Security Headers & Strict CORS Allowlist                     │
  │  - UUID Request Tracing (X-Request-Id) & Structured Logging           │
  │  - IP Rate Limiting (express-rate-limit)                               │
  │  - JWT Verification & Tenant Isolation (X-Organization-Id check)      │
  │  - RBAC Permission Enforcement Middleware                              │
  │                                                                        │
  │  [ Operational Modules ]                                               │
  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
  │  │ Organization │ │  Operations  │ │   Support    │ │  Knowledge   │  │
  │  │  & Members   │ │ (Tasks/Teams)│ │  Helpdesk    │ │  (RAG Docs)  │  │
  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │
  │         │                │                │                │          │
  │  [ Autonomous AI Agent Engine ]           │                │          │
  │  ┌────────────────────────────────────────┴────────────────┴────────┐ │
  │  │  - Agent Execution Engine (Support Triage / Ops Orchestrator)    │ │
  │  │  - Bounded State Machine (Planning, Context, Reasoning)          │ │
  │  │  - Validated Tool Registry (Zod Schemas & Parameterized Exec)    │ │
  │  │  - Human-in-the-Loop (HITL) Approval Gates                       │ │
  │  │  - Observability Tracing, Token Telemetry & Eval Benchmark       │ │
  │  └────────────────────────────────────────┬─────────────────────────┘ │
  │                                           │                           │
  │  [ Event-Driven Workflows & MCP ]         │                           │
  │  - Workflow Automation Engine (ticket.created -> agent invocation)    │
  │  - Model Context Protocol (MCP) Standardized Tool Interface           │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ Parameterized SQL Pool (pg)
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    POSTGRESQL MULTI-TENANT DATABASE                    │
  │  organizations, users, organization_members, teams, projects, tasks,   │
  │  tickets, knowledge_documents, agent_executions, approval_requests,    │
  │  workflow_rules, audit_logs, pricing_plans, blog_posts                 │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Autonomous Agent Execution Workflow

The operational AI agents follow a strict, bounded 8-step execution lifecycle:

```
[1. Ticket Received] ────────► [2. Agent Investigates] ────────► [3. Agent Plans]
User submits enterprise         Performs similarity search       Formulates bounded steps;
support incident.               on company runbooks.             selects validated tools.
                                                                        │
                                                                        ▼
[6. Controlled Execution] ◄─── [5. Human Approval Gate] ◄─── [4. Evidence Recommendation]
Single idempotent run           Operations Manager reviews       Proposes priority, routing,
with permission checks.         high-risk actions (Approve/Deny) and resolution steps.
         │
         ▼
[7. Observability & Traces] ──► [8. Regression Evaluation]
Captures steps, tool latency,   Compares decisions against
token usage, and audit trail.   benchmark expected outcomes.
```

---

## 💻 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16.3.4 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend** | Node.js 20+, Express.js 4.21, TypeScript 5.7 |
| **Database** | PostgreSQL, node-postgres (`pg`) connection pooling, raw parameterized SQL (No ORM) |
| **Auth & Security**| Supabase Auth, Cryptographically Signed JWTs, RBAC Authorization Middleware, Helmet, CORS |
| **Validation** | Zod 3 / Zod 4 runtime schema validation |
| **Observability** | UUID request tracing (`X-Request-Id`), structured console logs, step-by-step agent telemetry |
| **Theming** | Dynamic CSS Tokens, System-aware Dark and Light themes with instantaneous event synchronization |

---

## 📁 Directory Structure

```
flowmetrics/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout with theme hydration script
│   ├── page.tsx                            # Public SaaS landing page
│   ├── globals.css                         # Tailwind CSS 4 tokens (Dark/Light CSS vars)
│   ├── blog/[slug]/page.tsx                # Public blog post view
│   ├── api/                                # Next.js Edge / Server Routes
│   │   ├── ai/generate/route.ts            # AI Content Studio API endpoint
│   │   ├── events/route.ts                 # Real-time event ingress endpoint
│   │   └── health/route.ts                 # Frontend health check
│   └── admin/                              # Protected Admin & Operations Workspace
│       ├── login/page.tsx                  # Secure administrator sign-in
│       └── (dashboard)/                    # Dashboard layout with Sidebar
│           ├── page.tsx                    # Operations KPI Dashboard & Telemetry
│           ├── settings/page.tsx           # Settings & Appearance (Theme selection)
│           ├── organization/page.tsx       # Workspace profile, slug, and timezone
│           ├── members/page.tsx            # Member management & RBAC role assignments
│           ├── tasks/page.tsx              # Interactive Kanban board & sprint tracking
│           ├── workload/page.tsx           # Team member workload & capacity tracker
│           ├── support/page.tsx            # Enterprise support tickets & SLA manager
│           ├── knowledge/page.tsx          # Knowledge base docs & RAG search
│           ├── agents/page.tsx             # Agent Control Deck & HITL approvals
│           ├── observability/page.tsx      # Agent traces, step telemetry, & benchmarks
│           ├── workflows/page.tsx          # Workflow automation rule builder
│           ├── audit/page.tsx              # Immutable compliance audit log viewer
│           ├── pricing/page.tsx            # Public pricing plan CRUD
│           ├── blog/page.tsx               # Blog content CMS
│           └── generator/page.tsx          # AI Content Studio
│
├── components/
│   ├── admin/                              # Modular enterprise administration components
│   │   ├── Sidebar.tsx                     # Navigation sidebar with UI Kit tokens
│   │   ├── AgentOpsDashboard.tsx           # Agent execution and human review panel
│   │   ├── ObservabilityViewer.tsx         # Trace viewer with step latency charts
│   │   ├── KanbanBoard.tsx                 # Drag-and-drop task workflow board
│   │   ├── SupportTicketsTable.tsx         # Helpdesk queue & SLA tracker
│   │   ├── KnowledgeBaseManager.tsx        # Document chunking & runbook indexer
│   │   ├── WorkflowAutomationManager.tsx   # Event trigger and condition configurator
│   │   ├── OrganizationSettings.tsx        # Workspace identity & Dark/Light theme cards
│   │   ├── MemberManagement.tsx            # Multi-tenant invite and role editor
│   │   ├── WorkloadTracker.tsx             # Capacity balancing component
│   │   ├── AuditLogsViewer.tsx             # Audit log browser with metadata inspection
│   │   ├── ContentGenerator.tsx            # AI Content Studio UI
│   │   ├── BlogPostEditor.tsx              # Markdown blog authoring component
│   │   └── PricingPlanEditor.tsx           # Pricing plan configuration component
│   ├── landing/                            # Public landing page components
│   └── ui/                                 # Reusable UI primitives (Button, ThemeToggle)
│
├── backend/                                # Decoupled Express.js TypeScript Backend
│   ├── sql/                                # Database DDL and migrations
│   │   ├── schema.sql                      # Base schema (pricing_plans, blog_posts)
│   │   ├── seed.sql                        # Initial seed data
│   │   └── migrations/                     # Production schema migration
│   │       └── 001_enterprise_operations_platform.sql
│   ├── src/
│   │   ├── server.ts                       # Backend entrypoint and graceful shutdown
│   │   ├── app.ts                          # Express route configuration & error handling
│   │   ├── config/env.ts                   # Validated environment configuration
│   │   ├── db/
│   │   │   ├── pool.ts                     # PostgreSQL node-postgres pool manager
│   │   │   └── init.ts                     # Automated database schema initializer
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # Cryptographic JWT authentication
│   │   │   ├── tenant.middleware.ts        # Organization tenant scoping & RBAC
│   │   │   ├── security.middleware.ts      # Helmet headers and strict CORS
│   │   │   ├── rateLimit.middleware.ts     # IP rate limit protection
│   │   │   ├── requestId.middleware.ts     # UUID X-Request-Id injector
│   │   │   ├── logger.middleware.ts        # Structured request logging
│   │   │   └── error.middleware.ts         # Centralized error handler
│   │   ├── modules/
│   │   │   ├── organizations/              # Organization CRUD and memberships
│   │   │   ├── operations/                 # Teams, projects, tasks, workload
│   │   │   ├── support/                    # Tickets, comments, SLA evaluation
│   │   │   ├── knowledge/                  # Knowledge documents & vector RAG search
│   │   │   ├── agents/                     # Agent execution engine & tool registry
│   │   │   ├── workflows/                  # Event triggers & automated actions
│   │   │   ├── audit/                      # Immutable tenant audit logger
│   │   │   ├── mcp/                        # Model Context Protocol endpoints
│   │   │   └── ai/                         # AI provider infrastructure
│   │   └── utils/
│   │       ├── jwt.ts                      # JWT signing & verification utilities
│   │       └── response.ts                 # Standardized JSON response envelope
│   └── test-api.mjs                        # Automated end-to-end API test suite
│
├── render.yaml                             # Production deployment blueprint for Render
├── package.json                            # Root workspace dependencies & scripts
└── tsconfig.json                           # TypeScript configuration
```

---

## 🗄️ Database Architecture & Migrations

All queries use **raw parameterized SQL** (`$1`, `$2`) to eliminate SQL injection vulnerabilities. No Prisma or heavyweight ORMs are used.

### Schema Breakdown (`backend/sql/migrations/001_enterprise_operations_platform.sql`)

1. **`organizations`**: Multi-tenant workspace entities (`id`, `name`, `slug`, `logo_url`, `timezone`, `status`).
2. **`organization_members`**: User associations with role assignments (`organization_id`, `user_id`, `role`, `status`).
3. **`teams` & `team_members`**: Operational teams with designated team leads and member assignments.
4. **`projects`**: Operational projects (`key`, `name`, `status`, `target_date`, `lead_id`).
5. **`tasks`**: Kanban tasks with estimations (`task_number`, `status`, `priority`, `estimated_hours`, `actual_hours`, `assignee_id`).
6. **`support_tickets`**: Enterprise helpdesk tickets with SLA deadlines (`ticket_number`, `status`, `priority`, `sla_due_at`, `assignee_id`).
7. **`knowledge_documents` & `knowledge_chunks`**: Markdown runbooks broken down into indexed chunks for semantic similarity search.
8. **`agent_executions`**: Execution logs recording agent type, status, prompt, duration, and token usage.
9. **`agent_execution_steps`**: Granular step traces (`state`, `duration_ms`, `input_payload`, `output_payload`).
10. **`agent_tool_calls`**: Parameterized tool executions with latency, arguments, and error tracking.
11. **`approval_requests`**: HITL approval queue for operator intervention (`proposed_action`, `risk_level`, `status`).
12. **`workflow_rules`**: Configurable automation rules (`trigger_event`, `conditions`, `actions`, `is_active`).
13. **`audit_logs`**: Immutable compliance records (`actor_email`, `action`, `resource_type`, `resource_id`, `ip_address`).
14. **`pricing_plans` & `blog_posts`**: Preserved public CMS tables.

---

## 📡 API Reference

All protected endpoints enforce **JWT Authentication** (`Authorization: Bearer <token>`) and **Tenant Scoping** (`X-Organization-Id: <slug|id>`).

### 1. Authentication & System Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive database and memory health check |
| `POST` | `/api/auth/login` | Authenticate with email/password and obtain signed JWT |

### 2. Multi-Tenant Organizations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/organizations` | List organizations associated with current user |
| `POST` | `/api/organizations` | Create a new tenant workspace |
| `GET` | `/api/organizations/:id` | Fetch organization details |
| `PUT` | `/api/organizations/:id` | Update organization settings, timezone, and logo |
| `GET` | `/api/organizations/:id/members` | List members and roles in organization |
| `POST` | `/api/organizations/:id/members/invite`| Invite a new member with specified role |

### 3. Enterprise Operations & Tasks
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/operations/projects` | List active projects and milestone status |
| `POST` | `/api/operations/projects` | Create a new project |
| `GET` | `/api/operations/tasks` | Fetch Kanban tasks (supports status/project filters) |
| `POST` | `/api/operations/tasks` | Create an operational task |
| `PUT` | `/api/operations/tasks/:id` | Update task status, hours, or assignee |
| `GET` | `/api/operations/teams` | List cross-functional teams |
| `GET` | `/api/operations/workload` | Team member capacity and workload distribution |

### 4. Support Operations & Helpdesk
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/support/tickets` | List tickets with priority, SLA, and customer context |
| `POST` | `/api/support/tickets` | Ingest support ticket (triggers workflow automations) |
| `GET` | `/api/support/tickets/:id` | Fetch full ticket conversation history |
| `POST` | `/api/support/tickets/:id/comments` | Add public reply or internal staff note |

### 5. Knowledge Base & RAG Search
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/knowledge/documents` | List indexed runbooks and operating documents |
| `POST` | `/api/knowledge/documents` | Ingest and chunk new knowledge documentation |
| `POST` | `/api/knowledge/search` | Perform semantic similarity search across chunks |

### 6. AI Agent Orchestration & Approvals
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/agents/execute` | Trigger agent run (`support_triage`, `ops_orchestrator`) |
| `GET` | `/api/agents/approvals` | List pending Human-in-the-Loop approvals |
| `POST` | `/api/agents/approvals/:id/review`| Approve or reject a suspended agent action |
| `GET` | `/api/agents/tools` | List registered tools and parameter specifications |

### 7. Observability & Benchmark Evaluations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/agents/executions` | List recent agent execution runs |
| `GET` | `/api/agents/executions/:id/trace`| Fetch detailed step trace and tool calls for a run |
| `POST` | `/api/agents/evaluations/run` | Run regression benchmark suite against gold-standard cases |

### 8. Workflow Automation Engine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/workflows/rules` | List configured event-driven automation rules |
| `POST` | `/api/workflows/rules` | Create a rule (e.g., auto-triage critical tickets) |
| `PUT` | `/api/workflows/rules/:id` | Update trigger conditions or activation state |

### 9. Model Context Protocol (MCP)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mcp/tools` | Discover available tools using MCP standard |
| `POST` | `/api/mcp/execute` | Execute an approved tool via MCP format |

### 10. Compliance Audit Logs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/audit/logs` | Browse immutable tenant audit events |

### 11. Preserved CMS Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/pricing` | Public active pricing tiers |
| `GET` | `/api/blog` | Public published blog articles |
| `GET` | `/api/admin/pricing` | Manage pricing tiers (Admin) |
| `GET` | `/api/admin/blog` | Manage blog posts (Admin) |

---

## 🔒 Security & Governance

Flowmetrics follows a zero-trust enterprise security posture:

1. **Zero Hardcoded Bypasses**: Old demo tokens and unauthenticated backdoor paths have been completely eliminated. All requests require authentic, signed JWT credentials.
2. **Tenant Boundary Isolation**: Every tenant-owned database query explicitly checks `WHERE organization_id = $1`. Cross-tenant data leakage is strictly prevented on the backend.
3. **Traceability (`X-Request-Id`)**: Every request is assigned a unique UUID in transit, enabling distributed tracing across frontend, backend, and agent runs.
4. **Rate Limiting**: Protects sensitive write, auth, and agent execution endpoints from denial-of-service abuse.
5. **Content Security & Headers**: Powered by Helmet, enforcing `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict CORS origin validation.
6. **No Fabricated Data**: The operational dashboards present genuine database telemetry and provide clean error and empty states without synthetic demo fallbacks.

---

## 🎨 Appearance & Themes (Dark / Light)

Flowmetrics provides a native, high-performance theming engine with zero flicker on page reload:

- **Dark Theme** *(Default)*: Deep charcoal surfaces (`#0b0d0f`, `#12151a`), high-contrast mint signal accents (`#43e0c6`), and muted slate borders. Optimized for low-light engineering sessions.
- **Light Theme**: Clean porcelain surfaces (`#ffffff`, `#f8fafc`), crisp slate text (`#0f172a`), and teal highlights (`#0d9488`). Optimized for bright daylight environments.
- **Live Theme Synchronization**:
  - Accessible via **Settings & Appearance** (`/admin/settings`) through visual theme selection cards.
  - Quick toggle button in the sidebar footer.
  - Changes instantly broadcast via window events, keeping all UI elements in 100% two-way sync across browser tabs.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: v14.x or higher (local installation or hosted instance on Supabase/Neon)
- **Git**

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/flowmetrics.git
cd flowmetrics

# Install root & frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

**Root `.env` (Frontend & Shared)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/flowmetrics
JWT_SECRET=your-super-secret-jwt-signing-key-32chars
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**`backend/.env` (Backend Server)**:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/flowmetrics
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-signing-key-32chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-optional-openai-key
```

### 3. Initialize the Database
```bash
# Run automated schema migrations and seeding
npm --prefix backend run db:init
```

### 4. Start Development Servers

Run the backend and frontend concurrently:

```bash
# Terminal 1: Start Express.js Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Next.js Frontend (Port 3000)
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Admin Workspace**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Verification & Testing

Flowmetrics includes comprehensive test scripts to verify API security, TypeScript integrity, and production build readiness:

```bash
# 1. Verify frontend TypeScript type-safety
npx tsc --noEmit

# 2. Verify backend compilation
npm --prefix backend run build

# 3. Run automated API security & CRUD test suite against backend
node backend/test-api.mjs http://localhost:5000

# 4. Run Next.js production build
npm run build:frontend
```

---

## 🚢 Deployment Guide

### Deploying to Render (`render.yaml`)

Flowmetrics includes a pre-configured `render.yaml` blueprint for one-click deployment:

1. Connect your repository to [Render](https://render.com).
2. Create a new **Web Service** using the included `render.yaml`.
3. Set your secret environment variables in the Render dashboard:
   - `DATABASE_URL`: Hosted PostgreSQL connection string with SSL enabled.
   - `JWT_SECRET`: Random 64-character signing secret.
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY`: Your Supabase project credentials.
4. Render builds the backend and frontend simultaneously with:
   ```bash
   npm run build:render
   ```
5. Starts the service with:
   ```bash
   npm run start
   ```

---

## 📄 License
=======
>>>>>>> 3501619bb465f7ddd0d538a2a0b4b7389ff5a7a7

This project is licensed under the [MIT License](LICENSE).
