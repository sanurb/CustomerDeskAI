# Technical Specifications Document

## 1. Introduction

* **Project Name:** CustomerDeskAI – White-Label Multi-Tenant Customer Support Platform
* **Document Version:** 1.0
* **Date:** 2025-12-14
* **Author(s):** David Santiago Urbano

### Purpose

This document defines **precise technical specifications** for implementing CustomerDeskAI. It translates product and architecture intent into **enforceable engineering standards** designed to prevent ambiguity and technical debt.

This document is **normative**:

* Requirements stated with **MUST** are mandatory.
* Requirements stated with **SHOULD** are strongly recommended; deviations require explicit justification.
* Requirements stated with **MAY** are optional.

This document complements (and must remain consistent with) the **Architecture Document**. If implementation conflicts with this document, the implementation MUST be corrected.


## 2. Goals

### Technical Goals

1. **Correct-by-Construction Multi-Tenancy**

   * Every request that reads or writes tenant-scoped data MUST carry an explicit `tenantId`.
   * Any access to tenant-scoped tables MUST be constrained by that `tenantId`.

2. **End-to-End Type Safety**

   * All API inputs/outputs MUST be defined once and shared between client and server.
   * Runtime validation MUST match compile-time types (no “type-only contracts”).

3. **Security-by-Default**

   * Authentication and authorization MUST be enforced consistently at procedure boundaries.
   * AI-assisted workflows MUST NOT introduce cross-tenant data leakage.

4. **Maintainability with Minimal Abstraction**

   * Abstractions MUST exist to prevent bug classes (e.g., tenant leakage), not to hide complexity.
   * Boundaries between layers MUST be explicit and testable.

5. **Operational Predictability**

   * The system MUST support observability for debugging, compliance, and incident response.

### Business Goals

* Enable white-label, multi-tenant support across industries
* Reduce cost-to-serve per ticket as tenant and ticket volume grows
* Increase customer satisfaction via faster resolution and self-service
* Enable tenant onboarding without bespoke engineering


## 3. Development Environment

### Operating Systems (Supported)

* **Linux** (CI and production reference)
* **macOS** (primary developer workstation)
* **Windows** (supported, not primary)

### Programming Languages

* **TypeScript 5+** (all applications and packages)
* **SQL (Postgres dialect)** (via generated migrations)

### Frameworks

* **Next.js 16** (frontend framework)
* **React 19** (UI)
* **Elysia** (HTTP server)
* **Bun** (runtime for server)

### Libraries (Key)

* **oRPC** (`@orpc/server`, `@orpc/client`, `@orpc/zod`, `@orpc/openapi`)
* **Zod** (schema validation + inference)
* **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`)
* **node-postgres** (`pg`)
* **Better-Auth** (auth + organization plugin)
* **NileDB** (multi-tenant Postgres platform)
* **AI SDK** (`ai`, `@ai-sdk/google`)
* **type-fest** (utility types)

### Development Tools

* **pnpm workspaces** (dependency + workspace management)
* **Turborepo** (build orchestration)
* **drizzle-kit** (migration generation and application)
* Lint/typecheck tools configured in repo (`oxlint`, `biome`, `tsc`)


## 4. Technologies Used

### Technology Stack

* **Frontend:** Next.js + React + TanStack Query + oRPC client adapter
* **Backend:** Bun + Elysia + oRPC RPCHandler + OpenAPIHandler
* **API Contract:** oRPC routers + Zod schemas (single source of truth)
* **Auth:** Better-Auth (organizations) integrated with Nile tenant model
* **Data Access:** Drizzle ORM + pg driver against NileDB Postgres
* **AI:** AI SDK streaming on server endpoints, invoked from UI

### Technology Selection Rationale

* **oRPC + Zod** chosen to guarantee one contract drives:

  * compile-time types
  * runtime validation
  * OpenAPI documentation
    This reduces integration failures and accelerates iteration.
* **Drizzle** chosen to provide:

  * transparent SQL semantics
  * schema-first correctness
  * strong typing without heavy runtime abstractions
* **NileDB** chosen to treat multi-tenancy as a platform primitive
* **Better-Auth** chosen for first-class organization/membership semantics
* **Bun + Elysia** chosen for fast dev loop and low overhead server model


## 5. Key Technical Decisions

### 5.1 Single Source of Truth for API Contracts

* **Decision:** All API procedures and schemas MUST live in `@CustomerDeskAI/api`.
* **Rationale:** Prevents “client/server drift” and duplicated validation logic.

### 5.2 Strict Per-Request Context (No Globals)

* **Decision:** Every RPC/OpenAPI execution MUST receive a context object created by `createContext`.
* **Context MUST include:**

  * `session` (nullable)
  * `user` and `userId` (nullable unless protected route)
  * `tenantId` (nullable unless tenant-scoped route)
  * `membership` (nullable unless tenant-scoped route)
  * `db` (tenant-scoped Drizzle handle for tenant-scoped procedures)
* **Rationale:** Eliminates hidden dependencies and ensures reproducible behavior.

### 5.3 Tenant-Scoped Data Access Enforcement

* **Decision:** Tenant-scoped repositories MUST require `tenantId` at construction time.
* **Rationale:** Prevents accidental cross-tenant reads/writes.

### 5.4 Error Semantics Are Part of the Contract

* **Decision:** Procedures MUST return typed errors with stable codes:

  * `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`
* **Rationale:** Enables reliable client behavior and observability.

### 5.5 OpenAPI Is Derived, Not Authored

* **Decision:** OpenAPI MUST be generated from the oRPC + Zod contract.
* **Rationale:** Avoids double-maintenance and mismatch.

### 5.6 AI Is Assistive Only

* **Decision:** AI output MUST NOT directly mutate system state without user action.
* **Rationale:** Safety, compliance, user trust.


## 6. Design Patterns

### 6.1 Contract-First API Pattern

* Procedure signatures and schemas live centrally in `@CustomerDeskAI/api`.
* The web app consumes types directly and uses oRPC client.

### 6.2 Context Object Pattern

* `createContext` is the only allowed place to:

  * load session
  * resolve tenant
  * load membership/roles
  * construct tenant-scoped DB access

### 6.3 Policy-Based Authorization (Lightweight)

* Authorization MUST be expressed via reusable guards:

  * `requireAuth(ctx)`
  * `requireTenant(ctx)`
  * `requireRole(ctx, roles[])`
* Guards MUST fail fast and return typed errors.

### 6.4 Tenant-Scoped Repository Pattern

* All write/read operations against tenant-scoped tables MUST go through repositories created with a tenant context.

### 6.5 Append-Only Event Modeling for Tickets

* Ticket history SHOULD be modeled as append-only messages/events rather than overwriting prior state.
* Rationale: auditability and debugging; supports future analytics.


## 7. Technical Constraints

### 7.1 NileDB Multi-Tenant Constraints

* Tenant isolation depends on using Nile’s tenant model (tenants + tenant_users).
* Some foreign key and uniqueness constraints may not be supported across shared vs isolated tables.
* **Mitigation:** enforce certain integrity rules at the application layer and ensure repositories always scope to tenant.

### 7.2 Better-Auth Organization Plugin Adaptation

* Organization == tenant
* Membership must map to tenant_users
* Roles may be stored as arrays and must be normalized consistently
* **Mitigation:** enforce a single membership/role representation in auth package utilities.

### 7.3 OpenAPI Routing Consistency

* Current server code routes `.all("/api*", ...)` but uses prefix `"/api-reference"`.
* **Constraint:** routing MUST be consistent.
* **Mitigation:** standardize to:

  * `ALL /api-reference/*` → OpenAPIHandler with prefix `/api-reference`


## 8. API Specifications

### 8.1 Routing Specification (Normative)

The server MUST expose the following routes:

1. `ALL /api/auth/*`

   * Delegated to Better-Auth handler
   * Accepts `GET` and `POST`

2. `ALL /rpc/*`

   * Delegated to oRPC RPCHandler
   * Prefix MUST be `/rpc`

3. `ALL /api-reference/*`

   * Delegated to OpenAPIHandler
   * Prefix MUST be `/api-reference`

4. `POST /ai`

   * AI streaming endpoint
   * MUST require authentication and tenant context if it uses tenant data

### 8.2 Authentication

* Session retrieval performed via `auth.api.getSession({ headers })`.
* Authentication MUST be enforced at procedure boundaries by guard middleware.

### 8.3 Authorization

* Tenant-scoped procedures MUST require:

  * authenticated user
  * tenantId resolved
  * membership verified
* Role checks MUST be explicit and centralized.

### 8.4 Request/Response Formats

* All procedure inputs/outputs MUST be Zod-validated.
* All responses MUST be JSON-serializable (enforce using `type-fest` `JsonValue` where appropriate).


## 9. Data Storage

### 9.1 Storage

* Primary storage: NileDB Postgres

### 9.2 Schema Requirements (Normative)

* All tenant-scoped tables MUST include `tenant_id`.
* Tenant-scoped queries MUST filter by `tenant_id`.
* Schema MUST be defined in Drizzle schema files under `@CustomerDeskAI/db`.

### 9.3 Data Access Methods

* Use Drizzle ORM via `drizzle-orm/node-postgres`.
* Production schema evolution MUST use `drizzle-kit generate` + `drizzle-kit migrate`.
* `drizzle-kit push` MAY be used only in non-production development environments.

### 9.4 Connection Management

* DB connection MUST be created using `pg` Pool (or equivalent).
* Drizzle instance creation MUST NOT hardcode env file paths (the current `dotenv.config({ path: "../../apps/server/.env" })` MUST be replaced with standard environment injection).

  * Rationale: prevents brittle builds, broken CI, and unclear configuration ownership.


## 10. Security Considerations

### Security Considerations

* Tenant data leakage
* Auth bypass due to missing guards
* Permission drift (roles mismatch)
* AI prompt leakage
* CORS credential misuse

### Security Measures (Normative)

* Every tenant-scoped procedure MUST:

  * require auth
  * require tenant membership
  * perform role checks
* AI endpoints MUST:

  * only consume tenant-scoped data
  * never mix data across tenants
* CORS MUST:

  * use explicit allowed origins
  * only enable credentials when required by session strategy
* Audit logs MUST exist for privileged actions:

  * membership/role changes
  * KB publish actions
  * ticket status transitions


## 11. Performance Considerations

### Performance Considerations

* Ticket list and thread retrieval volume
* KB search performance
* AI streaming concurrency
* DB pool saturation

### Optimization Requirements

* All list endpoints MUST be paginated.
* DB queries MUST be indexed for expected access paths:

  * `(tenant_id, status, updated_at)`
  * `(tenant_id, ticket_id, created_at)`
* AI requests SHOULD be bounded by token/size limits.
* Long AI responses MUST use streaming (already implemented).


## 12. Scalability Considerations

### Scalability Considerations

* Rapid growth in number of tenants
* Tenants with high ticket volumes (noisy neighbor)
* Growth in KB articles and search usage

### Scaling Strategy

* Server tier MUST be stateless (scale horizontally).
* Tenant scoping MUST be enforced consistently so traffic isolation is logical and measurable.
* Monitoring MUST report per-tenant traffic and latency to identify noisy neighbors.


## 13. Open Issues

1. **Tenant resolution strategy:** Web app uses `{tenant}.app.com` (and optional custom domains) as the source of truth. Public API is tenant-scoped via the URI (`/v1/tenants/{tenantId}/...`). Tenant ID is never accepted from client-provided headers (no `x-tenant-id`). If a user belongs to multiple tenants, the UI switcher updates the active tenant by navigating to the tenant subdomain and/or requesting a tenant-scoped token; every request is authorized against tenant membership.
2. **User identity rules:** can one user belong to multiple tenants with same email?
3. **Knowledge base visibility:** public vs authenticated vs mixed
4. **Per-tenant AI limits:** budgeting, quotas, and controls
5. **Role taxonomy:** exact roles and whether tenants can define custom roles


## 14. Future Considerations

* Omnichannel ingestion (email/chat)
* Workflow automation/routing rules
* Advanced analytics and SLA forecasting
* Policy engine for complex authorization
* Data residency requirements


## 15. Glossary

* **Tenant:** A company/workspace boundary for data isolation
* **Context:** Per-request execution state containing identity, tenant, and DB scope
* **RBAC:** Role-Based Access Control
* **oRPC:** Type-safe RPC framework with shared contracts and OpenAPI integration
* **Drizzle ORM:** Type-safe ORM for Postgres with schema-defined migrations
* **NileDB:** Postgres platform optimized for B2B multi-tenancy
* **MTTR:** Mean Time to Resolution


## Implementation Readiness Checklist (Non-Negotiable)

To ensure “best possible” execution with minimal debt, the following MUST be true before release:

1. OpenAPI route and prefix are consistent (`/api-reference/*`).
2. `createContext` returns tenant + membership + db for tenant-scoped procedures.
3. No repository can query tenant data without tenantId.
4. No AI prompt can include data not derived from tenant-scoped queries.
5. DB config does not rely on hardcoded `.env` paths; environment injection is standardized.
6. Pagination exists for any list endpoint.
7. Authorization guards are centralized and used on every protected procedure.