# Integration Architecture

**Generated:** 2025-12-21
**Project:** CustomerDeskAI Monorepo
**Parts:** web ↔ server ↔ fumadocs

---

## Overview

This document describes how the three main applications (web, server, fumadocs) communicate and integrate within the CustomerDeskAI monorepo. All parts share common packages for type safety and code reuse.

---

## Integration Points

### 1. Web ↔ Server (Primary Integration)

**Type:** HTTP-based RPC
**Protocol:** oRPC over HTTP
**Direction:** Bidirectional (primarily web → server)

#### Connection Details

| Aspect | Configuration |
|--------|---------------|
| **Protocol** | HTTP/HTTPS |
| **Endpoint** | `http://localhost:3000/rpc` (dev) |
| **Method** | POST |
| **Content-Type** | `application/json` |
| **Authentication** | Session cookies (Better-Auth) |
| **Type Safety** | Shared `AppRouter` type |

#### Data Flow

```
┌─────────────────┐
│   apps/web/     │
│  (Next.js 16)   │
└────────┬────────┘
         │
         │ oRPC Client
         │ (HTTP POST /rpc)
         │ + Session Cookie
         │
         ▼
┌─────────────────┐
│  apps/server/   │
│   (Elysia)      │
└─────────────────┘
```

#### Type-Safe Communication

**Server Side** (`packages/api/src/routers/index.ts`):
```typescript
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  todo: todoRouter,
};

export type AppRouter = typeof appRouter;
```

**Client Side** (`apps/web/src/utils/orpc.ts`):
```typescript
import type { AppRouterClient } from "@CustomerDeskAI/api";

const client: AppRouterClient = createClient({
  baseURL: "http://localhost:3000/rpc",
});
```

**Usage** (`apps/web/src/components/TodoList.tsx`):
```typescript
import { orpc } from "@/utils/orpc";

function TodoList() {
  // Fully typed, autocomplete works!
  const { data: todos } = orpc.todo.getAll.useQuery();
  //    ^? Array<{ id: number; text: string; completed: boolean; }>

  const createMutation = orpc.todo.create.useMutation();

  return (
    <button onClick={() => createMutation.mutate({ text: "New todo" })}>
      Add Todo
    </button>
  );
}
```

#### Authentication Flow

```
┌─────────────────┐
│  Web Frontend   │
│                 │
│  Sign-in form   │
└────────┬────────┘
         │
         │ POST /api/auth/sign-in
         │
         ▼
┌─────────────────┐
│ Elysia Server   │
│                 │
│ Better-Auth     │─────► Set session cookie
│ Handler         │
└────────┬────────┘
         │
         │ Store session
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│                 │
│ users, sessions │
└─────────────────┘

---

Subsequent requests:
┌─────────────────┐
│  Web Frontend   │
│                 │
│  API call       │
└────────┬────────┘
         │
         │ POST /rpc
         │ + Session cookie
         │
         ▼
┌─────────────────┐
│ Elysia Server   │
│                 │
│ Auth middleware │─────► Verify session
│                 │
│ Protected       │─────► context.session available
│ Procedure       │
└─────────────────┘
```

---

### 2. Server ↔ Database

**Type:** Direct database connection
**Protocol:** PostgreSQL wire protocol
**ORM:** Drizzle ORM

#### Connection Details

| Aspect | Configuration |
|--------|---------------|
| **Driver** | `pg` (node-postgres) |
| **Pool** | Connection pooling enabled |
| **Type Safety** | Drizzle ORM with TypeScript |
| **Migrations** | Drizzle Kit |

#### Data Access Pattern

```
┌─────────────────┐
│  apps/server/   │
│                 │
│  API Handler    │
└────────┬────────┘
         │
         │ import db
         │
         ▼
┌─────────────────┐
│  packages/db/   │
│                 │
│  Drizzle Client │
└────────┬────────┘
         │
         │ SQL queries
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│                 │
│  (Docker/Nile)  │
└─────────────────┘
```

#### Example Query Flow

```typescript
// packages/api/src/routers/todo.ts
import { db } from "@CustomerDeskAI/db/client";
import { todo } from "@CustomerDeskAI/db/schema/todo";

export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(todo);
    //             ^? Type-safe query builder
  }),
};
```

---

### 3. Fumadocs ↔ Server (Minimal)

**Type:** Documentation site (mostly static)
**Integration:** Minimal/none during runtime

Fumadocs is primarily a documentation site that **does not** directly communicate with the server during runtime. It may reference API documentation generated via OpenAPI.

---

## Shared Dependencies

### Package Integration Model

All parts share code via workspace protocol:

```
┌──────────────┐
│  apps/web/   │────┐
└──────────────┘    │
                    │
┌──────────────┐    │    ┌────────────────────┐
│apps/server/  │────┼───►│  packages/api/     │
└──────────────┘    │    │  (oRPC routers)    │
                    │    └────────────────────┘
┌──────────────┐    │
│apps/fumadocs/│────┘    ┌────────────────────┐
└──────────────┘         │  packages/auth/    │◄───┐
                         │  (Better-Auth)     │    │
                         └────────────────────┘    │
                                                   │
                         ┌────────────────────┐    │
                         │  packages/db/      │◄───┤
                         │  (Drizzle ORM)     │    │
                         └────────────────────┘    │
                                                   │
                         ┌────────────────────┐    │
                         │packages/email/     │◄───┤
                         └────────────────────┘    │
                                                   │
                         ┌────────────────────┐    │
                         │better-auth-nile/   │◄───┘
                         │(Custom plugin)     │
                         └────────────────────┘
```

### Import Examples

**Web imports API types:**
```typescript
// apps/web/src/utils/orpc.ts
import type { AppRouterClient } from "@CustomerDeskAI/api";
```

**Server imports database:**
```typescript
// apps/server/src/index.ts
import { db } from "@CustomerDeskAI/db/client";
import * as schema from "@CustomerDeskAI/db/schema";
```

**Server imports auth:**
```typescript
// apps/server/src/index.ts
import { auth } from "@CustomerDeskAI/auth";
```

---

## Cross-Cutting Concerns

### Type Safety Chain

```
Database Schema (Drizzle)
    ↓
API Router Input/Output (Zod + oRPC)
    ↓
Frontend Client Types (oRPC inference)
```

**Example:**
```typescript
// 1. Database schema
export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

// 2. API procedure
export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(todo);
  }),
};

// 3. Frontend automatically infers
const { data } = orpc.todo.getAll.useQuery();
//    ^? Array<{ id: number; text: string; completed: boolean; }>
```

---

### Authentication Integration

#### Session Flow

```
┌─────────┐  1. Sign In  ┌─────────┐  2. Create   ┌──────────┐
│   Web   │─────────────►│ Server  │──── Session ──►│Database│
└─────────┘              └─────────┘              └──────────┘
     ▲                        │
     │                        │ 3. Set Cookie
     │                        │
     └────────────────────────┘


Subsequent Requests:
┌─────────┐  API Call    ┌─────────┐  Verify      ┌──────────┐
│   Web   │─────────────►│ Server  │──── Session ──►│Database│
└─────────┘  + Cookie    └─────────┘              └──────────┘
                              │
                              ▼
                         context.session
                         (available in handlers)
```

#### Multi-tenancy Integration

With Nile tenant isolation:

```
┌─────────┐
│  User   │
└────┬────┘
     │ Signs In
     ▼
┌─────────────────────────┐
│  Session Created        │
│  activeOrganizationId   │────► Tenant Context
│  = tenant_uuid          │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  All Queries            │
│  Filtered by            │────► Tenant Isolation
│  activeOrganizationId   │
└─────────────────────────┘
```

---

## API Contracts

### REST API (via OpenAPI)

While primary communication uses oRPC, the server also exposes an OpenAPI-compatible REST API:

**Endpoints:**
- `GET /api/*` - REST endpoints (auto-generated from oRPC)
- `GET /api-reference` - Interactive API documentation (Scalar)

**Purpose:**
- Third-party integration
- API exploration and testing
- Documentation generation

---

## Error Handling

### Error Propagation

```
Frontend Error
    ↓
oRPC Client Error
    ↓
Network/HTTP Error
    ↓
Server oRPC Handler Error
    ↓
Database/Business Logic Error
```

**Example:**
```typescript
// Frontend
try {
  await orpc.todo.create.mutate({ text: "" });
} catch (error) {
  // Catches Zod validation error from server
  console.error(error.message); // "Input validation failed"
}

// Server automatically validates
todo.create.input(z.object({ text: z.string().min(1) }))
//                                             ^^^^^^ Validation fails for empty string
```

---

## Performance Considerations

### Connection Pooling

**Database:** PostgreSQL connection pool managed by `pg`
```typescript
// packages/db/src/client.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
});
```

### Caching Strategy

**Frontend:**
- TanStack Query caching for API responses
- Next.js page/data caching

**Backend:**
- No application-level caching yet
- PostgreSQL query caching

---

## Security

### CORS Configuration

```typescript
// apps/server/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN, // http://localhost:3001
  credentials: true,
}));
```

### Authentication Security

- Session tokens stored in HTTP-only cookies
- CSRF protection via Better-Auth
- Secure cookie flags in production

---

## Monitoring & Observability

**Current State:** Not yet implemented

**Recommended:**
- OpenTelemetry for distributed tracing
- Logging: Pino or Winston
- Metrics: Prometheus
- Error tracking: Sentry

---

## Future Integration Points

### Planned Integrations

1. **Email Service** - `packages/email` integration
2. **File Upload** - S3/Cloudflare R2 for assets
3. **Real-time Updates** - WebSocket or SSE
4. **Job Queue** - BullMQ for background tasks
5. **Caching Layer** - Redis for session/data caching

---

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│           CDN / Edge Network             │
│         (Vercel Edge, Cloudflare)        │
└──────────────┬───────────────────────────┘
               │
        ┌──────▼──────┐
        │             │
   ┌────▼────┐   ┌────▼────┐
   │  Web    │   │  Docs   │
   │ (Next.js)│   │(Fumadocs)│
   └────┬────┘   └─────────┘
        │
        │ API Calls
        │
   ┌────▼──────┐
   │  Server   │
   │ (Elysia)  │
   └────┬──────┘
        │
        │ DB Queries
        │
   ┌────▼───────┐
   │PostgreSQL  │
   │   (Nile)   │
   └────────────┘
```

---

## Summary

The CustomerDeskAI monorepo achieves strong integration through:

1. **Type-safe RPC** (oRPC) between web and server
2. **Shared packages** via workspace protocol
3. **Unified authentication** with Better-Auth
4. **Multi-tenant database** with Nile integration
5. **End-to-end type safety** from DB to UI

All integration points are designed for developer experience, type safety, and maintainability.
