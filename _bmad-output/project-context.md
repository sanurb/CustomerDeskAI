---
project_name: 'CustomerDeskAI'
user_name: 'Davidu'
date: '2025-12-26'
sections_completed: ['technology_stack', 'typescript_standards', 'architectural_patterns', 'multi_tenancy', 'testing_patterns', 'react_frontend', 'error_handling_i18n', 'code_quality', 'security_performance', 'critical_gotchas']
status: 'complete'
rule_count: 40
optimized_for_llm: true
source_documents:
  - 'CLAUDE.md'
  - '.claude/CLAUDE.md'
  - '_bmad-output/architecture.md'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in CustomerDeskAI. Focus on unobvious details that agents might otherwise miss._

**IMPORTANT:** This document consolidates engineering standards (CLAUDE.md) with architectural patterns (architecture.md) into a single source of truth. All AI agents MUST follow these rules exactly.

---

## Technology Stack & Versions

**Frontend:**
- Next.js 16.0.10 (App Router, React Server Components)
- React 19.2.1 (ref as prop, no forwardRef, React Compiler enabled)
- TailwindCSS 4.1.10 (oxide engine)
- Radix UI 1.4.2 + shadcn/ui components
- TanStack Query 5.90.12 + TanStack Form 1.27.3
- oRPC 1.12.2 (end-to-end type safety)
- Vercel AI SDK + @ai-sdk/react 2.0.39
- TypeScript 5 (strict mode, verbatimModuleSyntax)

**Backend:**
- Bun runtime (latest stable)
- Elysia framework (latest stable)
- oRPC server (latest stable)
- Drizzle ORM (latest stable) + PostgreSQL 15+
- Better-Auth (latest stable) + Nile Plugin

**Infrastructure:**
- SST Ion (latest, TypeScript-first IaC)
- Upstash Redis (latest, edge caching)
- UploadThing (file management)
- Sentry (error tracking) + PostHog (analytics)
- Turborepo 2.5.4 + pnpm 10.23.0

**Testing:**
- Vitest (contract tests)
- Bun Test (unit tests)
- Playwright (E2E tests)
- Testcontainers (integration tests with real PostgreSQL)
- MSW (Mock Service Worker for frontend)

**Code Quality:**
- Ultracite 6.4.0 (Biome preset for formatting/linting)
- Oxlint 1.32.0 (additional linting)

---

## Critical Implementation Rules

### 1. TypeScript Standards (MANDATORY)

**Type Safety:**
- ✅ Always use explicit parameter and return types when they add clarity
- ✅ Prefer `unknown` over `any` (only use `any` inside generics where TypeScript cannot model runtime logic)
- ✅ Use `as const` for immutable objects and enum-like behavior
- ✅ Always use `import type` for type-only imports
- ❌ NEVER use default exports (except when required by framework like Next.js pages)
- ❌ NEVER introduce new `enum`s (use `as const` objects instead)

**Discriminated Unions (Required Pattern):**
```typescript
// ✅ CORRECT: Use discriminated unions for state machines
type FetchState<TData> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; error: Error };

// ❌ WRONG: Bag of optionals
type FetchState = { loading?: boolean; data?: TData; error?: Error };
```

**Configuration:**
- `strict: true`, `strictNullChecks: true`, `verbatimModuleSyntax: true`
- Use `@/*` path alias for `./src/*` in all apps

---

### 2. Architectural Patterns (From Architecture Document)

**Resource-Oriented RPC Naming (MANDATORY):**
```typescript
// ✅ CORRECT: {domain}.{Resource}{Action}
export const ticketingRouter = {
  TicketList: publicProcedure.handler(...),
  TicketGet: publicProcedure.handler(...),
  TicketResolve: protectedProcedure.handler(...),
};

// ❌ WRONG: Inconsistent naming
export const ticketingRouter = {
  listTickets: publicProcedure.handler(...),  // Wrong!
  get: publicProcedure.handler(...),          // Wrong!
  resolveTicket: protectedProcedure.handler(...), // Wrong!
};
```

**Prefixed UUIDs (MANDATORY for Observability):**
```typescript
// ✅ CORRECT: Always use generateId() with prefix
import { generateId } from "@CustomerDeskAI/db/utils/id-generator";

export const tickets = pgTable("tickets", {
  id: varchar("id", { length: 41 })
    .primaryKey()
    .$defaultFn(() => generateId("tkt")), // Generates: tkt_01JGQS...
});

// ❌ WRONG: Raw UUIDs without prefixes
id: uuid("id").defaultRandom() // NO! Loses observability in logs
```

**Prefixes:** `usr_` (users), `tnt_` (tenants), `tkt_` (tickets), `art_` (articles), `tpl_` (templates), `wks_` (workspaces), `ses_` (sessions)

**Idempotent Sagas (MANDATORY for Multi-Step Operations):**
```typescript
// ✅ CORRECT: Use SagaOrchestrator with execute() + markForDeletion()
import { SagaOrchestrator } from "@CustomerDeskAI/api/orchestrators/saga-orchestrator";

const saga = new SagaOrchestrator([
  createTenantStep,
  createOwnerUserStep,
  sendWelcomeEmailStep,
]);

const result = await saga.execute();

// ❌ WRONG: try-catch-rollback patterns (brittle)
try {
  await createTenant();
  await createOwner();
  await sendEmail();
} catch (error) {
  await deleteTenant(); // NO! Use Reaper pattern instead
}
```

**Reaper Pattern (Soft Delete + Cron Cleanup):**
- All deletions use `deleted_at` timestamp (NEVER hard delete)
- SST Ion Cron runs every 6 hours to permanently delete resources where `deleted_at` > 24 hours ago
- Provides 24-hour grace period for recovery

---

### 3. Multi-Tenancy Rules (CRITICAL)

**ALWAYS Filter by tenant_id:**
```typescript
// ✅ CORRECT: EVERY query MUST filter by tenant_id
const tickets = await db
  .select()
  .from(ticketsTable)
  .where(eq(ticketsTable.tenantId, tenantId)); // MANDATORY!

// ❌ WRONG: Querying across tenants (SECURITY VIOLATION)
const tickets = await db.select().from(ticketsTable); // NO!
```

**Shadow FK Validation (Application-Level Integrity):**
```typescript
// ✅ CORRECT: Validate foreign keys in application code
import { validateShadowFKs } from "@CustomerDeskAI/db/utils/shadow-fk-validator";

await validateShadowFKs({
  table: "tickets",
  references: {
    assignee_id: { table: "users", column: "id" },
    created_by: { table: "users", column: "id" },
  },
});

// ❌ WRONG: Database foreign keys (Nile prevents cross-tenant FKs)
foreignKey: { ... } // NO! Use Shadow FKs instead
```

**Composite Primary Keys:**
```typescript
// ✅ CORRECT: Use composite keys for tenant-scoped data
export const tenantUsers = pgTable("tenant_users", {
  tenantId: varchar("tenant_id", { length: 41 }).notNull(),
  userId: varchar("user_id", { length: 41 }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tenantId, table.userId] }),
}));
```

**Audit Columns (MANDATORY):**
Every tenant-scoped table MUST have:
- `created_by` (varchar, references users.id via Shadow FK)
- `updated_by` (varchar, references users.id via Shadow FK)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `deleted_at` (timestamp with time zone, nullable, for soft delete)

---

### 4. Testing Patterns (MANDATORY)

**Contract Tests (oRPC Schema Snapshots):**
```typescript
// ✅ CORRECT: Snapshot oRPC schemas to detect breaking changes
import { describe, it, expect } from "vitest";
import { ticketingRouter } from "./index";

describe("Ticketing Router Contracts", () => {
  it("TicketResolve schema matches snapshot", () => {
    expect(ticketingRouter.TicketResolve.schema).toMatchSnapshot();
  });
});
```

**Sociable Integration Tests (Testcontainers):**
```typescript
// ✅ CORRECT: Use real PostgreSQL for integration tests
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const container = await new PostgreSqlContainer().start();
const DATABASE_URL = container.getConnectionUri();
```

**Frontend Mocking (MSW):**
```typescript
// ✅ CORRECT: Mock external services to simulate failures
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/uploadthing", () => {
    return HttpResponse.error(); // Simulate UploadThing failure
  }),
];
```

**Test Organization:**
- Unit tests: Co-located `*.test.ts` files
- Integration tests: `tests/integration/` directory
- E2E tests: `tests/e2e/` directory (Playwright)
- Use `it()` or `test()` blocks only (never `done` callback)
- NEVER commit `.only` or `.skip`

---

### 5. React & Frontend Patterns (MANDATORY)

**React 19 Patterns:**
- ✅ Use function components only
- ✅ Pass `ref` as a prop (React 19 feature, no `forwardRef`)
- ✅ Hooks must be called unconditionally at top level
- ✅ All hook dependencies must be correct
- ❌ NEVER define components inside other components
- ❌ NEVER use array indices as keys

**Optimistic UI (Mutation Snapshotting):**
```typescript
// ✅ CORRECT: Unique mutation keys per entity
const { mutate } = orpc.ticketing.TicketResolve.useMutation({
  mutationKey: ["ticket", ticketId], // Unique per ticket!
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ["ticket", ticketId] });
    const previousTicket = queryClient.getQueryData(["ticket", ticketId]);
    queryClient.setQueryData(["ticket", ticketId], { ...previousTicket, status: "resolved" });
    return { previousTicket };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(["ticket", ticketId], context.previousTicket); // Rollback
  },
});

// ❌ WRONG: Generic mutation keys (causes UI jitter)
mutationKey: ["updateTicket"] // NO! Not specific enough
```

**Terminal Sync (Draft Persistence):**
```typescript
// ✅ CORRECT: Use navigator.sendBeacon() on visibilitychange
useEffect(() => {
  function handleVisibilityChange() {
    if (document.visibilityState === "hidden" && isDirty) {
      const blob = new Blob([JSON.stringify({ ticketId, draft })]);
      navigator.sendBeacon("/api/drafts/terminal-sync", blob);
    }
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
}, [ticketId, draft, isDirty]);
```

**Accessibility (MANDATORY):**
- ✅ Use semantic HTML (`button`, `nav`, `main`, `header`, `footer`)
- ✅ Provide alt text for all images
- ✅ Label all form inputs (use `<label>` or `aria-label`)
- ✅ Keyboard support must mirror mouse interactions
- ❌ NEVER use `div` with `role` when semantic elements exist

---

### 6. Error Handling & i18n Patterns (MANDATORY)

**Translation Keys (Backend-Agnostic Localization):**
```typescript
// ✅ CORRECT: Backend returns machine-readable keys
throw new ORPCError({
  code: "NOT_FOUND",
  message: "error.ticket_not_found", // Translation key!
  data: { ticketId },
});

// ❌ WRONG: Hardcoded user-facing strings in backend
throw new ORPCError({
  code: "NOT_FOUND",
  message: "Ticket not found", // NO! Breaks i18n
});
```

```typescript
// ✅ CORRECT: Frontend translates via next-international
import { useI18n } from "@/lib/i18n";

const t = useI18n();
const errorMessage = t("error.ticket_not_found"); // "Ticket not found" or "Boleto no encontrado"
```

**Error Taxonomy (Use Exact Codes):**
- `NOT_FOUND` - Resource does not exist
- `ALREADY_EXISTS` - Duplicate resource (e.g., email already registered)
- `PERMISSION_DENIED` - User lacks access rights
- `FAILED_PRECONDITION` - Operation cannot proceed (e.g., ticket already resolved)
- `INVALID_ARGUMENT` - Input validation failed
- `UNAUTHENTICATED` - Session expired or missing
- `RESOURCE_EXHAUSTED` - Rate limit exceeded

---

### 7. Code Quality & Monorepo Boundaries (MANDATORY)

**Ultracite Enforcement:**
```bash
# ALWAYS run before committing
npx ultracite fix

# Check code quality
npx ultracite check
```

**Monorepo Boundaries (TypeScript Project References):**
```typescript
// ✅ CORRECT: Import from packages/
import { ticketingRouter } from "@CustomerDeskAI/api/routers/ticketing";

// ❌ WRONG: Import from apps/ (violates boundaries)
import { SomeComponent } from "apps/web/src/components/SomeComponent"; // NO!
```

**Package Dependencies:**
- `apps/web` → CAN import from `packages/*`
- `apps/server` → CAN import from `packages/*`
- `packages/api` → CAN import from `packages/db`, `packages/auth`
- `packages/*` → CANNOT import from `apps/*` (build error is INTENTIONAL)

---

### 8. Security & Performance Rules (MANDATORY)

**Security:**
- ✅ Add `rel="noopener noreferrer"` to all `target="_blank"` links
- ✅ Validate and sanitize ALL user input (use Zod schemas)
- ✅ NEVER use `dangerouslySetInnerHTML` (use markdown renderer with sanitization)
- ✅ NEVER use `eval` or `new Function()`
- ❌ NEVER manipulate `document.cookie` directly (use Better-Auth client)

**Performance:**
- ✅ Use Next.js `<Image>` component (automatic optimization)
- ✅ Hoist regex literals out of loops
- ✅ Use specific imports over namespace imports (`import { foo } from "lib"` not `import * as lib from "lib"`)
- ❌ NEVER use barrel files (`index.ts` re-exporting everything)

---

### 9. Critical Don't-Miss Rules (GOTCHAS)

**1. Never Skip tenant_id Filtering:**
Every database query MUST filter by `tenant_id`. This is the #1 security rule.

**2. Never Use Database Foreign Keys:**
Nile prevents cross-tenant foreign keys. Use Shadow FK validation in application code instead.

**3. Never Return Hardcoded Strings in API Responses:**
Always return translation keys (`error.ticket_not_found`), never hardcoded strings.

**4. Never Use Generic Mutation Keys:**
TanStack Query mutation keys MUST be entity-specific (`["ticket", ticketId]`), not generic (`["updateTicket"]`).

**5. Never Use try-catch-rollback for Multi-Step Operations:**
Use Idempotent Sagas + Reaper pattern instead. Immediate rollbacks are brittle.

**6. Never Create Resources Without Prefixed UUIDs:**
Always use `generateId("tkt")` from id-generator utility. Raw UUIDs lose observability.

**7. Never Import Across Monorepo Boundaries:**
`packages/*` CANNOT import from `apps/*`. TypeScript project references enforce this.

**8. Never Use React.forwardRef:**
React 19 accepts `ref` as a prop. `forwardRef` is deprecated.

**9. Never Commit Without Running Ultracite:**
Run `npx ultracite fix` before every commit. Build will fail on CI if you skip this.

**10. Never Use Default Exports:**
Use named exports everywhere (except Next.js pages which require default exports).

---

## Implementation Priority

When implementing features, reference the complete architecture document (`_bmad-output/architecture.md`) for:
- Complete project structure with all file locations
- Detailed requirements to structure mapping
- Integration patterns and data flow diagrams
- First implementation priority: Workspace Provisioning Saga

This project-context.md file provides the **critical rules** AI agents must follow. The architecture.md provides the **complete technical blueprint**.

---

**Document Status:** COMPLETE ✅
**Last Updated:** 2025-12-26
**Source Documents:** CLAUDE.md, .claude/CLAUDE.md, _bmad-output/architecture.md

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Reference `_bmad-output/architecture.md` for complete technical blueprint
- Ask for clarification rather than guessing when patterns are ambiguous

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time
- Use this as onboarding guide for new AI agents joining the project

**Relationship to Other Documents:**

- **project-context.md (this file)**: Critical rules AI agents must follow
- **architecture.md**: Complete technical blueprint with all decisions, patterns, and structure
- **CLAUDE.md**: Original engineering standards (consolidated into this file)
- **.claude/CLAUDE.md**: Additional engineering standards (consolidated into this file)

**Last Updated:** 2025-12-26

