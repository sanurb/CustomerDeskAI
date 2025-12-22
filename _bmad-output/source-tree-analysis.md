# Source Tree Analysis

**Generated:** 2025-12-21
**Repository Type:** Monorepo (Turborepo + pnpm workspaces)
**Structure:** 3 apps + 5 shared packages

---

## Project Structure Overview

```
CustomerDeskAI/
├── apps/                       # Application workspaces
│   ├── web/                    # [Part: web] Next.js 16 frontend application
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages and layouts
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # Utility libraries and helpers
│   │   │   └── utils/          # Shared utility functions
│   │   ├── public/             # Static assets
│   │   ├── package.json        # Frontend dependencies
│   │   └── next.config.js      # Next.js configuration
│   │
│   ├── server/                 # [Part: server] Elysia backend API
│   │   ├── src/
│   │   │   └── index.ts        # ⭐ Entry point - Elysia server setup
│   │   ├── package.json        # Backend dependencies
│   │   └── tsconfig.json       # TypeScript config
│   │
│   ├── fumadocs/               # [Part: fumadocs] Documentation site
│   │   ├── app/                # Next.js App Router for docs
│   │   ├── content/            # MDX documentation content
│   │   ├── package.json        # Fumadocs dependencies
│   │   └── next.config.js      # Documentation site config
│   │
│   └── email/                  # Email preview/development app
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                   # Shared package workspaces
│   ├── api/                    # ⭐ oRPC API router definitions
│   │   └── src/
│   │       ├── index.ts        # Base procedure definitions
│   │       └── routers/        # API route handlers
│   │           ├── index.ts    # App router aggregation
│   │           └── todo.ts     # Todo CRUD operations
│   │
│   ├── auth/                   # ⭐ Better-Auth configuration
│   │   └── src/
│   │       └── index.ts        # Auth setup with Nile integration
│   │
│   ├── db/                     # ⭐ Database layer (Drizzle ORM)
│   │   ├── src/
│   │   │   ├── client.ts       # PostgreSQL client setup
│   │   │   ├── keys.ts         # Encryption keys
│   │   │   └── schema/         # Database schema definitions
│   │   │       ├── auth.ts     # Better-Auth tables (Nile-adapted)
│   │   │       ├── nile.ts     # Multi-tenancy tables
│   │   │       └── todo.ts     # Application tables
│   │   ├── drizzle.config.ts   # Drizzle Kit configuration
│   │   └── docker-compose.yml  # PostgreSQL container setup
│   │
│   ├── better-auth-nile/       # Custom Better-Auth plugin
│   │   └── src/
│   │       └── index.ts        # Nile integration for Better-Auth
│   │
│   ├── email/                  # Email utilities and templates
│   │   └── src/
│   │
│   └── config/                 # Shared TypeScript configurations
│       ├── tsconfig.base.json  # Base TS config
│       └── tsconfig.json       # Package TS config
│
├── memory/                     # Project documentation and planning
│   ├── docs/                   # Project documentation
│   │   ├── architecture.md     # Architecture notes
│   │   ├── product_requirement_docs.md # PRD
│   │   ├── technical.md        # Technical docs
│   │   └── migrations_repro.md # Migration guides
│   │
│   └── tasks/                  # Task planning
│       ├── active_context.md   # Current work context
│       └── tasks_plan.md       # Task planning docs
│
├── .github/                    # GitHub configuration
│   ├── copilot-instructions.md # GitHub Copilot guidelines
│   └── agents/                 # BMAD agent definitions
│
├── .claude/                    # Claude Code configuration
│   └── CLAUDE.md               # Claude project instructions
│
├── _bmad/                      # BMAD framework installation
│   └── bmm/                    # BMAD Method Module
│
├── node_modules/               # Dependency installations
│
├── package.json                # ⭐ Root workspace configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
├── turbo.json                  # ⭐ Turborepo build configuration
├── tsconfig.json               # Root TypeScript config
├── README.md                   # Project readme
└── CLAUDE.md                   # AI assistant instructions
```

---

## Critical Directories Explained

### Application Entry Points

#### `apps/server/src/index.ts`
**Type:** Backend entry point
**Purpose:** Elysia server initialization with:
- oRPC RPC handler (`/rpc*`)
- oRPC OpenAPI handler (`/api*` and `/api-reference`)
- Better-Auth endpoints (`/api/auth/*`)
- AI SDK endpoint (`/ai`)
- CORS configuration

**Integration Points:**
- Imports `@CustomerDeskAI/api` for RPC router
- Uses `@CustomerDeskAI/auth` for authentication
- Connects to `@CustomerDeskAI/db` for database access

#### `apps/web/src/app/`
**Type:** Frontend entry point
**Purpose:** Next.js 16 App Router with:
- Server and Client Components
- Route handlers for API proxying
- Layouts and pages

**Integration Points:**
- Calls server via oRPC client (`@/utils/orpc.ts`)
- Uses Better-Auth client (`@/lib/auth-client.ts`)
- Queries via TanStack Query hooks

---

### Shared Code Patterns

#### `packages/api/src/routers/`
**Purpose:** oRPC router definitions
**Pattern:** Type-safe procedure handlers
**Exports:** `appRouter` and `AppRouter` type

**Usage:**
- Server imports and mounts via `RPCHandler`
- Client imports type for type inference

#### `packages/db/src/schema/`
**Purpose:** Drizzle ORM schema definitions
**Pattern:** Table definitions with relations
**Key Files:**
- `auth.ts` - Better-Auth tables adapted for Nile
- `nile.ts` - Multi-tenancy tables (tenants, tenant_users, invitations)
- `todo.ts` - Application data tables

---

### Configuration Patterns

#### Monorepo Workspace (`pnpm-workspace.yaml`)
```yaml
workspaces:
  - "apps/*"
  - "packages/*"
```

All packages use `workspace:*` protocol for internal dependencies.

#### Turborepo Tasks (`turbo.json`)
Defines task dependencies and caching:
- `build` - Build all apps with dependency graph
- `dev` - Start development servers
- `check-types` - TypeScript type checking
- `db:*` - Database operations (no caching)

---

## Data Flow

### Frontend → Backend
```
apps/web/src/
  └── Client Component
      └── orpc.client.todo.getAll()
          └── HTTP POST to /rpc
              └── apps/server/src/index.ts
                  └── RPCHandler
                      └── packages/api/src/routers/todo.ts
                          └── todoRouter.getAll.handler()
                              └── packages/db (Drizzle query)
                                  └── PostgreSQL
```

### Authentication Flow
```
apps/web/
  └── Sign-in form
      └── Better-Auth client
          └── POST /api/auth/sign-in
              └── apps/server/
                  └── Better-Auth handler
                      └── packages/auth/
                          └── Better-Auth + Nile plugin
                              └── packages/db/schema/auth.ts
                                  └── PostgreSQL (users, sessions)
```

---

## Multi-Part Integration

### Web ↔ Server Communication
- **Protocol:** oRPC over HTTP
- **Endpoint:** `http://localhost:3000/rpc`
- **Type Safety:** Shared `AppRouter` type
- **Authentication:** Session cookies forwarded automatically

### Shared Packages Usage

**Type-safe API layer:**
```typescript
// packages/api defines routers
export const appRouter = { todo: todoRouter };

// apps/server mounts them
RPCHandler({ router: appRouter });

// apps/web consumes them
const client: AppRouterClient = createClient();
```

**Database access:**
```typescript
// packages/db exports client
export const db = drizzle(pool);

// packages/api uses it
import { db } from "@CustomerDeskAI/db/client";
await db.select().from(todo);
```

---

## Testing Strategy

**Location:** Test files co-located with source
**Pattern:** `*.test.ts`, `*.spec.ts`, `**/__tests__/**`
**Framework:** Not yet configured (no test files detected)

---

## Build & Development

### Development Workflow
```bash
pnpm dev              # Start all apps
pnpm dev:web          # Frontend only
pnpm dev:server       # Backend only
```

### Type Checking
```bash
pnpm check-types      # All workspaces
```

### Database Operations
```bash
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
pnpm db:start         # Start PostgreSQL (Docker)
```

---

## Deployment Architecture

### Docker Support
- PostgreSQL via Docker Compose (`packages/db/docker-compose.yml`)
- No containerization for apps yet

### Build Outputs
- **web:** `.next/` (Next.js production build)
- **server:** `dist/` (tsdown compiled output)
- **fumadocs:** `.next/` (Next.js static export potential)

---

## Key Observations

1. **End-to-end Type Safety:** oRPC provides seamless type inference from backend to frontend
2. **Nile Integration:** Custom multi-tenancy with tenant isolation
3. **Monorepo Benefits:** Shared code reuse with workspace protocol
4. **Modern Stack:** Latest React 19, Next.js 16, Bun runtime
5. **Database-first:** Drizzle ORM with strong typing
6. **Auth Flexibility:** Better-Auth with custom Nile plugin

---

## Next Steps for Development

1. Add comprehensive test coverage
2. Configure CI/CD pipeline
3. Set up production deployment (Vercel for web, VPS/container for server)
4. Implement monitoring and logging
5. Add E2E tests with Playwright/Cypress
6. Document API contracts via OpenAPI
