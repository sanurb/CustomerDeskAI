# Project Overview - CustomerDeskAI

**Generated:** 2025-12-21
**Repository:** Monorepo (Turborepo + pnpm)
**Primary Language:** TypeScript
**Architecture:** Full-stack monorepo with type-safe RPC

---

## Executive Summary

CustomerDeskAI is a modern full-stack TypeScript monorepo built with the Better-T-Stack, emphasizing end-to-end type safety from database to frontend. The project combines Next.js 16 (React 19), Elysia (Bun runtime), and PostgreSQL with Drizzle ORM, using oRPC for type-safe client-server communication.

The architecture supports multi-tenancy via Nile integration and includes Better-Auth for authentication with custom tenant-aware plugins.

---

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.0.10 | React meta-framework with SSR |
| **UI Library** | React | 19.2.1 | Component-based UI |
| **Styling** | TailwindCSS | 4.1.10 | Utility-first CSS |
| **Backend** | Elysia | Latest | Fast Bun-based web framework |
| **Runtime** | Bun | Latest | High-performance JavaScript runtime |
| **API Layer** | oRPC | Latest | Type-safe RPC with auto-inference |
| **Database** | PostgreSQL | 8.16.3 | Relational database |
| **ORM** | Drizzle ORM | Latest | Type-safe SQL ORM |
| **Auth** | Better-Auth | Latest | Modern authentication library |
| **Multi-tenancy** | Nile | Latest | Tenant isolation platform |
| **State** | TanStack Query | 5.90.12 | Server state management |
| **Build System** | Turborepo | 2.5.4 | Monorepo build orchestration |
| **Package Manager** | pnpm | 10.23.0 | Fast, efficient package manager |
| **AI Integration** | Vercel AI SDK | Latest | AI/LLM capabilities |

---

## Repository Structure

### Monorepo Organization

**Type:** Monorepo
**Parts:** 3 applications + 5 shared packages
**Workspace Manager:** pnpm workspaces
**Build Orchestrator:** Turborepo

### Applications (`apps/`)

1. **web** - Next.js 16 frontend (port 3001)
2. **server** - Elysia backend API (port 3000)
3. **fumadocs** - Documentation site (port 4000)
4. **email** - Email template development

### Shared Packages (`packages/`)

1. **api** - oRPC router definitions and business logic
2. **auth** - Better-Auth configuration with Nile plugin
3. **db** - Drizzle ORM schemas and database client
4. **better-auth-nile** - Custom Better-Auth + Nile integration
5. **email** - Email utilities and templates
6. **config** - Shared TypeScript configurations

---

## Architecture Classification

### Primary Pattern
**Full-stack Monorepo with Type-safe RPC**

### Component Architecture
- **Frontend:** Component-based (React) with Server/Client Components
- **Backend:** Service-oriented with RPC endpoints
- **Database:** Relational with multi-tenant isolation

### Communication Pattern
- **Client ↔ Server:** oRPC over HTTP
- **Server ↔ Database:** Drizzle ORM (type-safe queries)
- **Auth Flow:** Better-Auth with session-based authentication

---

## Key Features

### End-to-End Type Safety
- **oRPC:** Automatic type inference from server to client
- **Zod:** Runtime validation with type inference
- **Drizzle:** Type-safe database queries
- **TypeScript:** Static typing throughout

### Multi-Tenancy (Nile Integration)
- Tenant isolation at database level
- UUID-based global user identity
- Composite primary keys for tenant-scoped data
- No cross-scope foreign keys

### Authentication (Better-Auth)
- Session-based authentication
- Email/password and OAuth support
- 2FA capabilities
- Admin impersonation
- Tenant-aware sessions

### Modern Development Experience
- Hot reload (Bun for server, Next.js for web)
- Type-safe API calls with autocomplete
- Shared code via workspace protocol
- Automated dependency management

---

## Project Classification

| Aspect | Classification |
|--------|---------------|
| **Field Type** | Brownfield (existing codebase) |
| **Complexity** | Medium-High (multi-tenant, full-stack) |
| **Team Size** | Small (1-5 developers) |
| **Development Stage** | Active development |
| **Primary Domain** | Customer service / desk automation |

---

## Getting Started

### Prerequisites
- Node.js 20+ (or Bun)
- pnpm 10.23.0+
- PostgreSQL 14+ (or Docker)
- Git

### Quick Start
```bash
# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
pnpm db:start

# Push database schema
pnpm db:push

# Start all apps
pnpm dev

# Or start individually
pnpm dev:web      # Frontend on :3001
pnpm dev:server   # Backend on :3000
```

### Access Points
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/rpc
- **API Docs:** http://localhost:3000/api-reference
- **Database Studio:** `pnpm db:studio`

---

## Documentation Links

### Generated Documentation
- [Source Tree Analysis](./source-tree-analysis.md) - Complete directory structure
- [API Contracts](./api-contracts-server.md) - Backend API endpoints
- [Data Models](./data-models.md) - Database schema
- [Development Guide](./development-guide.md) - Setup and workflow
- [Integration Architecture](./integration-architecture.md) - Multi-part communication

### Existing Documentation
- [README.md](../README.md) - Project readme
- [CLAUDE.md](../CLAUDE.md) - AI assistant instructions
- [Architecture Notes](../memory/docs/architecture.md) - Existing architecture
- [Product Requirements](../memory/docs/product_requirement_docs.md) - PRD
- [Technical Docs](../memory/docs/technical.md) - Technical documentation

---

## Development Workflow

### Daily Development
1. Start PostgreSQL: `pnpm db:start`
2. Run dev servers: `pnpm dev`
3. Make changes (hot reload active)
4. Check types: `pnpm check-types`
5. Format code: `pnpm format`

### Database Changes
1. Modify schema in `packages/db/src/schema/`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`
4. Or push directly (dev): `pnpm db:push`

### Adding Dependencies
```bash
# To specific workspace
pnpm add <package> --filter web
pnpm add <package> --filter server

# To root
pnpm add <package> -w
```

---

## Build & Deployment

### Production Build
```bash
pnpm build  # Builds all apps via Turborepo
```

### Build Outputs
- **web:** `.next/` production build
- **server:** `dist/` compiled JavaScript
- **fumadocs:** `.next/` static export

### Deployment Considerations
- **Frontend:** Vercel, Netlify, or any Next.js host
- **Backend:** VPS, container, or Bun-compatible PaaS
- **Database:** Managed PostgreSQL (Nile, Supabase, etc.)

---

## Project Health

### Strengths
✅ Strong type safety throughout stack
✅ Modern, performant technologies
✅ Well-organized monorepo structure
✅ Multi-tenancy support built-in
✅ Comprehensive authentication

### Areas for Improvement
⚠️ Test coverage needs expansion
⚠️ CI/CD pipeline not yet configured
⚠️ Production deployment docs needed
⚠️ Monitoring/logging not implemented
⚠️ API rate limiting not configured

---

## Contact & Resources

### Project Resources
- **Repository:** (Local development)
- **Documentation Site:** http://localhost:4000 (fumadocs)
- **API Reference:** http://localhost:3000/api-reference

### Key Technologies
- [Next.js Docs](https://nextjs.org/docs)
- [Elysia Docs](https://elysiajs.com)
- [oRPC Docs](https://orpc.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better-Auth](https://better-auth.com)
- [Nile](https://thenile.dev)
