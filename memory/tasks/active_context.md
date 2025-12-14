# Active Development Context

## Current Work Focus:
* **Primary focus:** Establish a **correct-by-construction multi-tenant foundation** by completing the integration between **NileDB + Drizzle + Better-Auth**, using the new internal package **`packages/better-auth-nile`** as the canonical organization/tenant layer.
* **Immediate objective:** Make tenant identity **explicit in the URL** (not headers), and upgrade the request execution model so every tenant-scoped operation runs with:
  - authenticated session (when required)
  - resolved tenant (slug → tenantId)
  - verified membership + roles
  - tenant-scoped data access (repos/db scope)
* **Definition of “ready to build features”:** after the above is in place, the team can safely implement Tickets and Knowledge Base without risking cross-tenant leakage or accumulating structural debt.


## Active Decisions and Considerations:
* **Tenant identity propagation (canonical):**
  - Decision in progress: tenant MUST be expressed as a URL prefix for tenant-scoped APIs:
    - `/t/:tenantSlug/rpc/*`
    - `/t/:tenantSlug/api-reference/*`
  - Considerations: URL tenancy improves debuggability, log correlation, cache semantics, and prevents “hidden tenancy” bugs. It also requires a deterministic slug policy.

* **Tenant slug policy (needs locking):**
  - Format constraints (lowercase, allowed chars, length)
  - Normalization rules (case folding, trimming, reserved words)
  - Collision behavior and migration strategy

* **Uniqueness enforcement for tenant slug (DB vs application):**
  - `packages/better-auth-nile` schema declares `slug` as `unique: true`, but Nile tenant virtualization constraints may limit uniqueness enforcement on `tenants.slug`.
  - Active decision: enforce uniqueness at DB level if fully supported; otherwise implement **application-level uniqueness** with concurrency-safe creation semantics.

* **Authorization model: roles and permissions**
  - Active decision: finalize role taxonomy (Owner/Admin/Support/Customer) and whether tenants can define custom roles.
  - `better-auth-nile` stores member roles as an array (`roles` column), while plugin reads `member.role[0]`; need to ensure canonical representation and avoid role drift.

* **DB access strategy for tenant checks: Nile SDK vs Drizzle-only**
  - The demo uses the Nile SDK `getInstance()` pattern in Next.js.
  - Our architecture prefers Elysia backend and Drizzle repositories.
  - Active decision: default to **Drizzle + Nile tables** for membership and tenant resolution; only introduce Nile SDK server-side if a specific Nile-only feature is required.

* **OpenAPI routing alignment**
  - Current server code has a known mismatch risk between route path and handler prefix.
  - Decision: standardize OpenAPI under `/api-reference/*` (and tenant-scoped variant under `/t/:tenantSlug/api-reference/*`) with exact prefix alignment.

* **AI endpoint safety**
  - `/ai` currently streams model output without enforcing tenant invariants.
  - Active decision: AI endpoints must become tenant-scoped (`/t/:tenantSlug/...`) and require membership if they consume tenant data; no tenant data processing until invariants exist.


## Recent Changes:
* **New internal package introduced:** `packages/better-auth-nile`
  - Adds a **server plugin** (`nile()` in `organization.ts`) mapping Better-Auth organization concepts to Nile integrated tables:
    - organizations → `tenants`
    - members → `tenant_users`
    - session field → `activeOrganizationId`
    - roles → `roles` array field mapping
  - Adds a **client plugin** (`organizationClient()` in `client.ts`) enabling:
    - listing organizations (`/organization/list`)
    - retrieving active organization (`/organization/get-full-organization`)
    - retrieving active member (`/organization/get-active-member`)
    - role permission checks (client-side evaluation)

* **Current server entrypoint exists:** `apps/server/src/index.ts`
  - Routes configured for:
    - Better-Auth handler: `/api/auth/*`
    - oRPC RPC handler: `/rpc*`
    - OpenAPI handler: `/api*` (requires standardization)
    - AI streaming: `/ai`

* **Current API context exists:** `packages/api/src/context.ts`
  - Returns only `{ session }` via `auth.api.getSession(...)`
  - Does not resolve tenant or membership yet (this is now the highest priority gap)

* **Current DB bootstrap exists:** `packages/db/src/index.ts`
  - Uses `dotenv.config()` with a hardcoded path and `drizzle(connectionString)`
  - Not yet configured for Nile conventions or production-grade pooling (planned change)


## Next Steps:
* **1) Tenant-aware routing (URL tenancy)**
  - Implement canonical tenant-scoped endpoints:
    - `/t/:tenantSlug/rpc/*`
    - `/t/:tenantSlug/api-reference/*`
  - Keep global endpoints:
    - `/api/auth/*`
    - `/organization/*`
  - Ensure oRPC handler prefixes match route paths exactly.

* **2) Upgrade `createContext` to tenant-aware strict context**
  - Resolve `tenantSlug` from route params.
  - Resolve `tenantId` from `tenants` table.
  - Fetch membership from `tenant_users` for authenticated users.
  - Attach roles and permission helpers.
  - Provide tenant-scoped repo/db handle for tenant-scoped routes.

* **3) Make DB package production-safe**
  - Remove hardcoded dotenv path from `@CustomerDeskAI/db`.
  - Introduce `pg.Pool` and drizzle initialization via injected config.
  - Establish migration discipline (`generate+migrate` as default).

* **4) Wire Better-Auth + `better-auth-nile` into `@CustomerDeskAI/auth`**
  - Ensure the Better-Auth handler exposes `/organization/*` endpoints.
  - Validate schema mappings and role storage behavior.

* **5) Resolve tenant slug uniqueness strategy**
  - Confirm Nile constraints for `tenants.slug`.
  - Implement DB-level uniqueness if supported; otherwise implement application-level uniqueness with concurrency-safe semantics.

* **6) Freeze minimal vertical slice for platform validation**
  - Sign up / sign in
  - Create tenant
  - List tenants
  - Set active tenant
  - Navigate under `/t/:tenantSlug/...` with strict membership enforcement

* **7) Lock down AI**
  - Do not use `/ai` with tenant data until tenant invariants are enforced.
  - Design tenant-scoped AI endpoints only after tickets/KB data paths are safely tenant-scoped.