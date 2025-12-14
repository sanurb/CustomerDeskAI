# Task Backlog and Project Progress Tracker

## Backlog:

### 0) Project Standards, Boundaries, and “No Debt” Guardrails
- [ ] Publish a 1–2 page Engineering RFC: “Multi-Tenant Invariants + Coding Standards”
    -- Context: Establishes non-negotiables used in reviews and CI (tenant isolation, context shape, repo boundaries, authz placement, DTO rules, error codes). Prevents architectural drift.
    -- Importance: High
    -- Dependencies: None

- [ ] Define canonical tenant routing convention (tenant identity MUST be in URL, not headers)
    -- Context: Tenant context MUST be explicit and traceable. Canonical patterns:
        - Tenant-scoped APIs: `/t/:tenantSlug/rpc/*`, `/t/:tenantSlug/api-reference/*`
        - Global auth/org management APIs: `/api/auth/*`, `/organization/*`
      This avoids “hidden tenancy” and supports clean logging, cache, debugging, and correctness.
    -- Importance: High
    -- Dependencies: Tenant slug format decision

- [ ] Lock tenant slug rules (format, length, normalization, case-sensitivity, collision behavior)
    -- Context: Slug becomes part of the public API surface; decisions affect SEO, URL stability, migration feasibility.
    -- Importance: High
    -- Dependencies: Product input (branding/domain strategy)


### 1) NileDB + Drizzle Foundation (Production-Grade DB Package)
- [ ] Remove hardcoded dotenv path from `packages/db/src/index.ts`
    -- Context: `dotenv.config({ path: "../../apps/server/.env" })` is brittle and non-portable. DB package MUST not assume app paths.
    -- Importance: High
    -- Dependencies: None

- [ ] Introduce validated server config module (single source of truth for env)
    -- Context: Centralize env validation (DATABASE_URL, auth secrets). Prevent “works locally” configuration errors.
    -- Importance: High
    -- Dependencies: None

- [ ] Replace connection-string drizzle init with `pg.Pool` + drizzle instance (instrumentable)
    -- Context: Required for production stability (pool sizing), observability, and avoiding connection storms.
    -- Importance: High
    -- Dependencies: Config module

- [ ] Establish migration discipline:
    - [ ] `drizzle-kit generate` + `drizzle-kit migrate` as the only allowed path for shared/dev/staging/prod
    - [ ] Restrict `drizzle-kit push` to local-only (explicit opt-in)
    -- Context: Prevent schema drift and destructive changes; ensures reproducible environments.
    -- Importance: High
    -- Dependencies: CI adjustments

- [ ] Create a NileDB connectivity verification checklist and add CI smoke test
    -- Context: Validate DB connectivity early (DNS/network/credentials), fail fast in CI.
    -- Importance: High
    -- Dependencies: Config module + Pool init


### 2) Integrate `packages/better-auth-nile` (Core Priority: Auth + Tenant Isolation)
- [ ] Treat `packages/better-auth-nile` as the canonical org/tenant plugin (server + client)
    -- Context: New internal package defines the Nile-adapted organization plugin and client plugin. This becomes the standard integration point.
    -- Importance: High
    -- Dependencies: None

- [ ] Wire `better-auth-nile` into `@CustomerDeskAI/auth` server configuration
    -- Context: `auth` MUST include the `nile()` plugin and expose `/organization/*` endpoints as part of Better-Auth handler routing.
    -- Importance: High
    -- Dependencies: DB foundation + Better-Auth base config

- [ ] Validate schema mapping correctness (critical):
    - [ ] organizations → `tenants`
    - [ ] members → `tenant_users`
    - [ ] session field: `activeOrganizationId`
    - [ ] role storage: Nile roles array (`roles` column) must match plugin expectations (`member.role[0]`)
    -- Context: This is where tenant isolation is won or lost. Any mismatch creates subtle security bugs.
    -- Importance: High
    -- Dependencies: Nile tables present + migrations applied

- [ ] Resolve the slug uniqueness constraint conflict explicitly
    -- Context: The plugin schema currently marks `slug` as `unique: true`, while Nile tenant virtualization constraints may require relaxing uniqueness at DB-level. Decide and implement one consistent approach:
        Option A: DB enforces uniqueness (preferred if supported by Nile for `tenants.slug`)
        Option B: DB does NOT enforce uniqueness; application enforces uniqueness with concurrency-safe create semantics
      This MUST be decided now to avoid irreversible data issues.
    -- Importance: High
    -- Dependencies: Confirm Nile constraints in your target configuration

- [ ] UUID strategy verification (end-to-end)
    -- Context: Ensure organization/tenant IDs and membership keys are UUID-safe and consistent with plugin behavior. Confirm no nanoid assumptions remain.
    -- Importance: High
    -- Dependencies: Better-Auth config + migrations

- [ ] Implement membership resolution helpers in `@CustomerDeskAI/auth` (do not scatter logic)
    -- Context: Provide a single interface used by API context:
        - resolveTenantBySlug(slug) -> tenantId
        - getMembership(tenantId, userId) -> roles[]
        - hasRole(membership, role) / hasPermission(...)
      Avoid calling plugin endpoints from internal server logic when direct DB reads are sufficient.
    -- Importance: High
    -- Dependencies: Drizzle repos + schema finalized

- [ ] Decide: Nile SDK usage vs pure Drizzle for authorization checks
    -- Context: Demo uses `@niledatabase/server` instance on Next.js; your plan is Elysia backend. Choose one:
        - Preferred: Use Drizzle + Nile tables for membership/tenant checks (fewer moving parts)
        - Optional: Nile SDK for additional Nile APIs (only if needed)
    -- Importance: High
    -- Dependencies: Team decision


### 3) Tenant-Aware Routing (URL Tenancy) + Context Upgrade (Critical Path)
- [ ] Implement tenant-scoped routing prefixes in `apps/server` (Elysia)
    -- Context: Tenant-scoped endpoints MUST be under `/t/:tenantSlug/*`:
        - `/t/:tenantSlug/rpc/*` (oRPC RPCHandler)
        - `/t/:tenantSlug/api-reference/*` (OpenAPIHandler)
      Global endpoints remain outside tenant path:
        - `/api/auth/*`
        - `/organization/*`
    -- Importance: High
    -- Dependencies: Tenant slug rules

- [ ] Fix OpenAPI routing consistency definitively
    -- Context: Route path and handler prefix MUST match exactly; no mismatches (prevents broken docs/tooling).
    -- Importance: High
    -- Dependencies: Server routing changes

- [ ] Upgrade `packages/api/src/context.ts` into a strict, tenant-aware context factory
    -- Context: Current implementation returns only `{ session }`. New context MUST provide:
        - requestId
        - session (nullable)
        - userId (nullable)
        - tenantSlug (nullable)
        - tenantId (nullable; required for tenant-scoped routes)
        - membership (nullable; required for tenant-scoped routes)
        - tenantDb / repos (only for tenant-scoped routes)
      Tenant resolution MUST come from URL params, not headers.
    -- Importance: High
    -- Dependencies: Tenant routing + auth helpers + DB factory

- [ ] Implement guard middleware used by every tenant procedure
    -- Context: Guards MUST be centralized and composable:
        - requireAuth(ctx)
        - requireTenant(ctx)
        - requireMembership(ctx)
        - requireRole(ctx, roles[])
      Enforcement MUST happen at procedure boundary (no “inline authz” inside business logic).
    -- Importance: High
    -- Dependencies: Context upgrade + role taxonomy

- [ ] Define stable typed error contract across API
    -- Context: Standardize error codes and payload shape for predictable clients and observability:
        `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`
    -- Importance: High
    -- Dependencies: Guards


### 4) Client Integration (Web) with `organizationClient` (Tenant UX Without Hacks)
- [ ] Integrate `organizationClient` in `apps/web` Better-Auth client setup
    -- Context: Enables list orgs, active org, active member retrieval via `/organization/*` endpoints.
    -- Importance: Medium
    -- Dependencies: Server plugin wired and working

- [ ] Define canonical UX flow for tenant entry:
    - [ ] URL `/t/:tenantSlug` is source of truth for navigation
    - [ ] On first entry or mismatch, call `setActiveOrganization` so Better-Auth session aligns with URL
    -- Context: Avoids “two competing tenant states” (URL vs session). Must be deterministic.
    -- Importance: High
    -- Dependencies: Tenant slug resolution + org endpoints verified

- [ ] Implement role-aware UI gating aligned with server guards
    -- Context: UI gating is for usability only; server remains source of truth. Must use `activeMember.roles`.
    -- Importance: Medium
    -- Dependencies: Membership shape + roles finalized


### 5) Core Schema + Repositories (Tenant-Scoped by Construction)
- [ ] Define Drizzle schema for product tables (tenant-scoped)
    -- Context: Minimum viable entities:
        - tickets
        - ticket_messages (append-only)
        - knowledge_base_articles
        - branding_settings
        - audit_logs
      Every table MUST include `tenant_id` + indexes for pagination and common filters.
    -- Importance: High
    -- Dependencies: Tenant model stable

- [ ] Build tenant-scoped repositories (repo factories require tenantId)
    -- Context: Eliminate the “global db” footgun. Repos MUST be constructed from tenant context only.
    -- Importance: High
    -- Dependencies: Schema + context

- [ ] Add isolation regression tests (negative tests)
    -- Context: Prove that cross-tenant reads are impossible and remain impossible as code evolves.
    -- Importance: High
    -- Dependencies: Test harness + seed strategy


### 6) Minimal Vertical Slice (Prove Platform First, Then Features)
- [ ] Tenant bootstrap slice (MVP platform validation)
    -- Context: Deliver:
        - Sign up / sign in
        - Create tenant (organization)
        - List organizations
        - Set active organization
        - Resolve tenant by slug in URL and enforce membership
    -- Importance: High
    -- Dependencies: Auth + routing + context + org client

- [ ] Tickets v0 slice (first business capability)
    -- Context: Tenant-scoped:
        - create ticket
        - reply
        - list (paginated)
        - thread view (paginated)
        - status/priority updates with role checks
    -- Importance: High
    -- Dependencies: Repos + guards + DTOs


### 7) AI Endpoint Hardening (Only After Tenant Invariants Exist)
- [ ] Restrict `/ai` usage until context invariants are enforced
    -- Context: AI is a high-risk leakage surface. It MUST NOT process tenant data without tenant identity + membership validation.
    -- Importance: High
    -- Dependencies: Tenant routing + context + guards

- [ ] Implement tenant-scoped AI assist endpoints (draft/summarize) under `/t/:tenantSlug/...`
    -- Context: AI operations must consume only tenant-scoped ticket/KB data and must be human-in-the-loop (no autonomous writes).
    -- Importance: Medium
    -- Dependencies: Tickets/KB v0 + policy


### 8) Observability, CI/CD, and Quality Gates (Enforce “0 Debt”)
- [ ] Add structured logging fields at server boundary
    -- Context: MUST include requestId, tenantSlug, tenantId, userId, procedureName, errorCode, latencyMs.
    -- Importance: High
    -- Dependencies: Context upgrade

- [ ] CI gates
    -- Context: MUST run lint, typecheck, unit tests, migration checks, isolation regression tests.
    -- Importance: High
    -- Dependencies: Migration strategy

- [ ] Contract drift checks
    -- Context: Ensure OpenAPI generation remains consistent with routers; prevent accidental breaking changes.
    -- Importance: Medium
    -- Dependencies: oRPC routers stabilized