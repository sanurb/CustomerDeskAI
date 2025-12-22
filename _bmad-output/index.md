# Project Documentation Index - CustomerDeskAI

**Generated:** 2025-12-21
**Scan Type:** Deep Scan
**Purpose:** Primary entry point for AI-assisted development

---

## Project Overview

**Name:** CustomerDeskAI
**Type:** Monorepo (Turborepo + pnpm workspaces)
**Parts:** 3 applications + 5 shared packages
**Primary Language:** TypeScript
**Architecture:** Full-stack with end-to-end type safety

### Quick Reference

#### Part: web (Frontend)
- **Type:** Web Application
- **Tech Stack:** Next.js 16, React 19, TailwindCSS 4
- **Root:** `apps/web/`
- **Port:** 3001

#### Part: server (Backend API)
- **Type:** Backend API
- **Tech Stack:** Elysia, Bun runtime, oRPC
- **Root:** `apps/server/`
- **Port:** 3000

#### Part: fumadocs (Documentation)
- **Type:** Documentation Site
- **Tech Stack:** Next.js 16, Fumadocs
- **Root:** `apps/fumadocs/`
- **Port:** 4000

---

## Generated Documentation

### Core Documentation

- **[Project Overview](./project-overview.md)** - Executive summary, tech stack, and getting started
- **[Source Tree Analysis](./source-tree-analysis.md)** - Complete directory structure with annotations
- **[Integration Architecture](./integration-architecture.md)** - How parts communicate and integrate
- **[Development Guide](./development-guide.md)** - Setup, workflow, and best practices

### Technical Documentation

- **[API Contracts - Server](./api-contracts-server.md)** - Backend API endpoints and types
- **[Data Models](./data-models.md)** - Database schema and relationships

---

## Existing Documentation

### Project Documentation (`memory/docs/`)

- **[Architecture Notes](../memory/docs/architecture.md)** - Existing architecture documentation
- **[Product Requirements](../memory/docs/product_requirement_docs.md)** - Product requirements document
- **[Technical Documentation](../memory/docs/technical.md)** - Technical specifications
- **[Migration Guide](../memory/docs/migrations_repro.md)** - Database migration reproduction steps

### Task Planning (`memory/tasks/`)

- **[Active Context](../memory/tasks/active_context.md)** - Current work context
- **[Task Plan](../memory/tasks/tasks_plan.md)** - Task planning and tracking

### AI Assistant Instructions

- **[Claude Code Instructions](../CLAUDE.md)** - Main Claude Code project instructions
- **[Additional Claude Instructions](../.claude/CLAUDE.md)** - Extended Claude configuration
- **[GitHub Copilot Instructions](../.github/copilot-instructions.md)** - Copilot guidelines
- **[Agent Instructions](../AGENT.md)** - General AI agent instructions

### Project Root

- **[README.md](../README.md)** - Main project readme
- **[Ultracite Config](../ultracite.md)** - Code formatting configuration

---

## Technology Stack

### Frontend (web)
- **Framework:** Next.js 16.0.10
- **UI:** React 19.2.1, TailwindCSS 4.1.10, Radix UI 1.4.2
- **State:** TanStack Query 5.90.12, TanStack Form 1.27.3
- **API:** oRPC Client (type-safe RPC)
- **Auth:** Better-Auth
- **AI:** Vercel AI SDK

### Backend (server)
- **Runtime:** Bun
- **Framework:** Elysia
- **API:** oRPC Server, OpenAPI
- **Database:** Drizzle ORM + PostgreSQL
- **Auth:** Better-Auth with Nile plugin
- **AI:** Vercel AI SDK + Google Gemini 2.5

### Shared Infrastructure
- **Build:** Turborepo 2.5.4
- **Package Manager:** pnpm 10.23.0
- **Language:** TypeScript 5.x
- **Multi-tenancy:** Nile (tenant isolation)

---

## Architecture Patterns

### Frontend
**Pattern:** Component-based with Server/Client Components (Next.js App Router)

**Key Directories:**
- `apps/web/src/app/` - Routes and pages
- `apps/web/src/components/` - React components
- `apps/web/src/lib/` - Utilities and helpers

### Backend
**Pattern:** Service-oriented with RPC endpoints

**Key Directories:**
- `packages/api/src/routers/` - oRPC route handlers
- `packages/db/src/schema/` - Database schemas
- `packages/auth/` - Authentication configuration

### Database
**Pattern:** Relational with multi-tenant isolation

**Tables:**
- **Auth:** users, sessions, accounts
- **Multi-tenancy:** tenants, tenant_users, invitations
- **Application:** todo

---

## Getting Started

### Prerequisites
```bash
# Required
Node.js 20+
pnpm 10.23.0+
Docker (for PostgreSQL)

# Optional
Bun (server runtime)
```

### Quick Start
```bash
# Install dependencies
pnpm install

# Start database
pnpm db:start

# Push schema
pnpm db:push

# Start all apps
pnpm dev
```

### Access Points
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/rpc
- API Docs: http://localhost:3000/api-reference
- Documentation: http://localhost:4000
- Database Studio: `pnpm db:studio`

---

## Development Workflow

### Daily Workflow
1. Start PostgreSQL: `pnpm db:start`
2. Start dev servers: `pnpm dev`
3. Make changes (hot reload enabled)
4. Check types: `pnpm check-types`
5. Format code: `pnpm format`

### Database Changes
1. Modify schema in `packages/db/src/schema/`
2. Push changes: `pnpm db:push` (dev) or `pnpm db:generate && pnpm db:migrate` (prod)
3. Verify in Drizzle Studio: `pnpm db:studio`

### Adding Features
See [Development Guide](./development-guide.md) for detailed workflows on:
- Adding new API endpoints
- Creating database tables
- Building UI components
- Managing dependencies

---

## API Reference

### oRPC Endpoints

**Base URL:** `http://localhost:3000/rpc`

**Available Routers:**
- `healthCheck` - Health check endpoint (public)
- `privateData` - Private data endpoint (protected)
- `todo` - Todo CRUD operations (public)
  - `todo.getAll` - Get all todos
  - `todo.create` - Create new todo
  - `todo.toggle` - Toggle todo completion
  - `todo.delete` - Delete todo

**Full Documentation:** [API Contracts](./api-contracts-server.md)

---

## Database Schema

### Tables

**Application Data:**
- `todo` - Todo list items

**Authentication:**
- `users` - User accounts (UUID-based, Nile-compatible)
- `sessions` - Active user sessions
- `accounts` - OAuth provider accounts

**Multi-tenancy:**
- `tenants` - Organizations/workspaces (Nile-managed)
- `tenant_users` - User-tenant memberships with roles
- `invitations` - Pending tenant invitations

**Full Documentation:** [Data Models](./data-models.md)

---

## Integration Points

### Web ↔ Server
- **Protocol:** oRPC over HTTP
- **Endpoint:** `/rpc`
- **Type Safety:** Shared `AppRouter` type
- **Authentication:** Session cookies

### Server ↔ Database
- **ORM:** Drizzle ORM
- **Driver:** `pg` (PostgreSQL)
- **Type Safety:** Full TypeScript inference

**Full Documentation:** [Integration Architecture](./integration-architecture.md)

---

## Multi-Tenancy (Nile Integration)

### Key Concepts
- **UUID-based IDs** - Global user identity across tenants
- **Tenant Isolation** - Enforced by Nile at platform level
- **No Foreign Keys** - Intentional design for cross-scope compatibility
- **Composite Primary Keys** - `(tenant_id, user_id)` for tenant-scoped data

### Current Implementation
- Better-Auth adapted for Nile
- Custom `better-auth-nile` plugin
- Tenant-aware sessions via `activeOrganizationId`

---

## Code Quality

### Tools
- **Formatting:** Ultracite (Biome preset)
- **Linting:** Ultracite + Oxlint
- **Type Checking:** TypeScript compiler
- **Build:** Turborepo

### Commands
```bash
pnpm format          # Auto-fix formatting
pnpm lint            # Lint check
pnpm check-types     # Type check all workspaces
pnpm build           # Build all apps
```

---

## Testing

**Current State:** Test framework not yet configured

**Recommended Setup:**
- **Backend:** Bun test (built-in)
- **Frontend:** Vitest
- **E2E:** Playwright or Cypress

---

## Deployment

### Build Commands
```bash
pnpm build              # Build all apps
pnpm build --filter web # Frontend only
pnpm build --filter server # Backend only
```

### Build Outputs
- **web:** `apps/web/.next/`
- **server:** `apps/server/dist/`
- **fumadocs:** `apps/fumadocs/.next/`

### Deployment Targets
- **Frontend:** Vercel, Netlify (Next.js)
- **Backend:** VPS, containers, Bun-compatible PaaS
- **Database:** Nile, Supabase, managed PostgreSQL

---

## Monorepo Structure

```
CustomerDeskAI/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── server/       # Elysia backend
│   ├── fumadocs/     # Documentation
│   └── email/        # Email development
│
├── packages/
│   ├── api/          # oRPC routers
│   ├── auth/         # Better-Auth config
│   ├── db/           # Drizzle ORM
│   ├── better-auth-nile/ # Custom plugin
│   ├── email/        # Email utilities
│   └── config/       # Shared configs
│
├── memory/
│   ├── docs/         # Project docs
│   └── tasks/        # Task planning
│
├── _bmad-output/     # Generated docs (this folder)
└── _bmad/            # BMAD framework
```

**Detailed Structure:** [Source Tree Analysis](./source-tree-analysis.md)

---

## Key Files & Entry Points

### Application Entry Points
- `apps/server/src/index.ts` - Backend server initialization
- `apps/web/src/app/layout.tsx` - Frontend root layout
- `apps/web/src/app/page.tsx` - Frontend home page

### Configuration Files
- `package.json` - Root workspace config
- `turbo.json` - Turborepo task configuration
- `pnpm-workspace.yaml` - Workspace definition
- `apps/server/.env` - Server environment variables
- `apps/web/.env.local` - Frontend environment variables

### Database
- `packages/db/src/client.ts` - PostgreSQL client
- `packages/db/src/schema/` - Schema definitions
- `packages/db/drizzle.config.ts` - Drizzle Kit config

---

## Common Tasks

### Starting Development
```bash
pnpm dev              # All apps
pnpm dev:web          # Frontend only
pnpm dev:server       # Backend only
```

### Database Operations
```bash
pnpm db:start         # Start PostgreSQL
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
```

### Code Quality
```bash
pnpm format           # Format code
pnpm lint             # Lint check
pnpm check-types      # Type check
```

### Managing Dependencies
```bash
pnpm add <pkg> --filter web     # Add to frontend
pnpm add <pkg> --filter server  # Add to backend
pnpm add <pkg> -w               # Add to root
```

---

## Documentation Maintenance

### Regenerating Documentation

To update this documentation after significant code changes:

```bash
# Option 1: Full rescan
# Load the document-project workflow and select "Re-scan entire project"

# Option 2: Deep-dive specific area
# Load document-project workflow and select "Deep-dive into specific area"
```

### Documentation Workflow
1. Load `analyst` agent or similar BMAD agent
2. Run `document-project` workflow
3. Choose scan depth (quick/deep/exhaustive)
4. Review generated documentation
5. Commit to repository

---

## Troubleshooting

### Common Issues

**Database connection refused:**
- Check PostgreSQL is running: `pnpm db:start`
- Verify `DATABASE_URL` in `apps/server/.env`
- Check Docker: `docker ps`

**Type errors:**
- Run `pnpm check-types` to see all errors
- Restart TypeScript server in VS Code
- Rebuild: `pnpm build`

**Hot reload not working:**
- Restart dev server: `pnpm dev`
- Check terminal for errors
- Clear `.next` cache: `rm -rf apps/web/.next`

**Detailed troubleshooting:** [Development Guide](./development-guide.md#common-issues--solutions)

---

## Resources

### Internal Documentation
- [Project Overview](./project-overview.md)
- [Development Guide](./development-guide.md)
- [API Contracts](./api-contracts-server.md)
- [Data Models](./data-models.md)
- [Source Tree](./source-tree-analysis.md)
- [Integration Architecture](./integration-architecture.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Elysia Documentation](https://elysiajs.com)
- [oRPC Documentation](https://orpc.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better-Auth](https://better-auth.com)
- [Nile](https://thenile.dev)
- [TailwindCSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)

---

## Project Status

### Completed
✅ Core authentication system (Better-Auth + Nile)
✅ Multi-tenancy foundation (Nile integration)
✅ Type-safe API layer (oRPC)
✅ Database schema and ORM (Drizzle)
✅ Frontend framework (Next.js 16 + React 19)
✅ Backend framework (Elysia + Bun)
✅ Monorepo setup (Turborepo + pnpm)

### In Progress
🚧 Email functionality
🚧 AI integration (Vercel AI SDK + Gemini)
🚧 Documentation site (Fumadocs)

### Planned
📋 Comprehensive test coverage
📋 CI/CD pipeline
📋 Production deployment setup
📋 Monitoring and logging
📋 Error tracking (Sentry)
📋 Performance optimization

---

## Contact & Support

### Project Team
- Review existing docs in `memory/docs/`
- Check task plans in `memory/tasks/`
- Refer to AI assistant instructions in root

### Getting Help
1. Check this documentation index
2. Review specific topic documentation
3. Check external resource links
4. Consult existing project docs in `memory/`

---

**Last Updated:** 2025-12-21
**Documentation Version:** 1.0.0
**Scan Level:** Deep
**Next Review:** As needed (after major changes)
