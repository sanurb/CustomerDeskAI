# Story 1.1: Single-Session Workspace Creation

**Epic:** 1 - Frictionless Workspace Activation
**Status:** ready-for-dev
**Business Value:** Time-to-Value (Revenue Capture)
**Success Metric:** <60 seconds from landing page to functional dashboard

---

## Story

**As a** Workspace Owner (Sarah Chen - Head of Customer Success),
**I want to** create a unique, branded workspace in a single form submission,
**So that** I can begin serving my customers immediately without multi-step wizards.

---

## Acceptance Criteria

1. **Single-Session Completion**
   - Workspace creation completes in one session without manual retries or confirmation emails
   - Zero "zombie workspaces" - workspace provisioning succeeds completely or rolls back entirely

2. **Minimal User Input (6 Fields Maximum)**
   - User provides only essential data:
     - Workspace name
     - URL slug
     - Admin full name
     - Email address
     - Password
     - Logo upload (optional)

3. **Real-Time URL Validation**
   - Real-time URL availability check during form input (debounced <300ms)
   - Race condition protection prevents two users reserving same URL simultaneously
   - Clear error message if slug is taken (not generic "Error occurred")

4. **Instant Branding Application**
   - Initial branding (logo upload optional) is applied and visible across all views instantly
   - Logo appears in navigation header immediately after creation
   - Primary color applied to dashboard UI elements

5. **Automatic Authentication**
   - Admin is automatically authenticated into the new workspace upon creation
   - Session created with activeOrganizationId set to new tenant

6. **Performance Target**
   - Total time from form submission to functional dashboard: **<60 seconds (90th percentile)**
   - Server-side workspace provisioning: **<3 seconds (95th percentile)**

---

## Context & User Journey

Sarah arrives exhausted at 11 PM, burned by complex tools. She needs something that works "tonight" with zero friction. Every additional 30 seconds increases abandonment risk by 20% (Zendesk data). This story enables her to create a workspace, upload her logo, and invite her first teammate within 60 seconds total.

**Critical User Psychology:**
- Sarah is evaluating multiple tools
- She has already been burned by complex onboarding in other products
- Time pressure: needs solution deployed "tonight"
- Each extra step or delay increases abandonment risk exponentially

---

## Technical Implementation Requirements

### Architecture Pattern: Orchestrated Saga with Compensating Transactions

**Critical:** This story implements the Compensating Transaction Pattern documented in architecture.md. Workspace provisioning is a multi-step atomic operation requiring explicit coordination between Nile tenant creation and Better-Auth user creation.

**Saga Steps (Idempotent + Compensable):**

```typescript
// packages/api/src/routers/workspaces/onboarding-saga.ts
import { SagaOrchestrator } from "@CustomerDeskAI/api/orchestrators/saga-orchestrator";

export class OnboardingSaga extends SagaOrchestrator {
  async execute(input: OnboardingInput) {
    return await this
      .addStep(new ReserveSlugStep())           // → compensate: release reservation
      .addStep(new CreateWorkspaceStep())       // → compensate: delete tenant (soft delete)
      .addStep(new CreateBetterAuthUserStep())  // → compensate: delete user or mark disabled
      .addStep(new LinkTenantUserStep())        // → compensate: delete link
      .addStep(new CreateBrandingStep())        // → compensate: delete branding config
      .addStep(new CreateSessionStep())         // → compensate: revoke session
      .addStep(new SendWelcomeEmailStep())      // → compensate: log for manual review (email not rollback-able)
      .execute(input);
  }
}
```

**Idempotency Requirement:** Every saga step MUST be idempotent. Calling `CreateWorkspaceStep` twice with the same `slug` should return the existing workspace, not throw an error.

---

### Database Schema

#### 1. Tenants Table

**Location:** `packages/db/src/schema/tenants.ts`

```typescript
export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 41 })
    .primaryKey()
    .$defaultFn(() => generateId("tnt")),     // Generates: tnt_01JGQS...

  slug: varchar("slug", { length: 255 })
    .notNull()
    .unique(),                                 // Subdomain name (e.g., "acme")

  name: text("name").notNull(),                // Display name (e.g., "Acme Support")

  createdBy: varchar("created_by", { length: 41 }).notNull(),
  updatedBy: varchar("updated_by", { length: 41 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),          // Soft delete for Reaper pattern
});
```

**Critical Rules:**
- ✅ Use `generateId("tnt")` for prefixed UUIDs (observability in logs)
- ✅ Soft delete with `deletedAt` timestamp (Reaper pattern cleans up after 24h)
- ❌ NEVER use raw UUIDs - always use prefixed IDs

#### 2. Branding Settings Table

**Location:** `packages/db/src/schema/branding.ts`

```typescript
export const brandingSettings = pgTable("branding_settings", {
  id: varchar("id", { length: 41 })
    .primaryKey()
    .$defaultFn(() => generateId("brd")),

  tenantId: varchar("tenant_id", { length: 41 }).notNull(),

  // Logo upload via UploadThing
  logoUrl: text("logo_url"),                   // UploadThing asset URL
  logoKey: varchar("logo_key"),                // UploadThing file key (for rollback)

  faviconUrl: text("favicon_url"),

  // Theme colors
  primaryColor: varchar("primary_color", { length: 7 }),      // CSS hex color
  secondaryColor: varchar("secondary_color", { length: 7 }),
  accentColor: varchar("accent_color", { length: 7 }),

  // Localization
  language: varchar("language", { length: 5 }).default("en"),  // en, es, pt-BR
  timezone: varchar("timezone", { length: 50 }).default("UTC"),

  createdBy: varchar("created_by", { length: 41 }).notNull(),
  updatedBy: varchar("updated_by", { length: 41 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### 3. Tenant-Users (RBAC) Table

**Location:** `packages/db/src/schema/tenant-users.ts`

```typescript
export const tenantUsers = pgTable("tenant_users", {
  tenantId: varchar("tenant_id", { length: 41 }).notNull(),
  userId: varchar("user_id", { length: 41 }).notNull(),

  role: varchar("role", { length: 20 }).notNull(),  // owner, admin, agent

  invitedBy: varchar("invited_by", { length: 41 }), // usr_... (nullable for founders)
  joinedAt: timestamp("joined_at").defaultNow().notNull(),

  // Composite primary key (Nile-compatible)
}, (table) => ({
  pk: primaryKey({ columns: [table.tenantId, table.userId] }),
}));
```

---

### API Endpoint: WorkspaceCreate

**Location:** `packages/api/src/routers/workspaces/index.ts`

**Resource-Oriented RPC Naming (MANDATORY):**

```typescript
// ✅ CORRECT: {Resource}{Action}
export const workspacesRouter = {
  WorkspaceCreate: publicProcedure
    .input(z.object({
      slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
      name: z.string().min(1).max(255),
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1),
      logoKey?: z.string(),                     // UploadThing key (from client upload)
      primaryColor?: z.string().regex(/^#[0-9A-F]{6}$/i),
      language?: z.enum(["en", "es", "pt-BR"]).default("en"),
      timezone?: z.string().default("UTC"),
    }))
    .output(z.object({
      workspaceId: z.string().startsWith("tnt_"),
      userId: z.string().startsWith("usr_"),
      sessionId: z.string(),
      workspaceUrl: z.string().url(),
    }))
    .handler(async ({ input, context }) => {
      const saga = new OnboardingSaga();

      const result = await saga.execute({
        slug: input.slug,
        name: input.name,
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        logoKey: input.logoKey,
        primaryColor: input.primaryColor,
        language: input.language,
        timezone: input.timezone,
      });

      const [slugReservation, workspace, user, tenantUser, branding, session, email] = result.results;

      return {
        workspaceId: workspace.workspaceId,
        userId: user.userId,
        sessionId: session.sessionId,
        workspaceUrl: `https://${input.slug}.customerdeskai.com`,
      };
    }),

  // Real-time slug availability check
  WorkspaceCheckAvailability: publicProcedure
    .input(z.object({
      slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
    }))
    .output(z.object({
      available: z.boolean(),
      error?: z.string(),
    }))
    .handler(async ({ input }) => {
      const existing = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, input.slug))
        .where(isNull(tenants.deletedAt))
        .limit(1);

      if (existing.length > 0) {
        return { available: false, error: "error.workspace_slug_taken" };
      }

      return { available: true };
    }),
};

// ❌ WRONG: Inconsistent naming
// listTickets, get, resolveTicket  <-- Don't use this pattern!
```

---

### Multi-Tenant Routing (Subdomain-Based)

**Subdomain Pattern:** `{slug}.customerdeskai.com`

**Cookie Domain:** `.customerdeskai.com` with `SameSite=Lax`

**Tenant ID Injection:** Next.js middleware extracts from subdomain on every request

**Critical:** Session cookies must be scoped to `.customerdeskai.com` domain to enable cross-workspace switching.

---

### Better-Auth Session Management

**Configuration:** `packages/auth/src/index.ts`

```typescript
import { betterAuth } from "better-auth";
import { nilePlugin } from "@CustomerDeskAI/better-auth-nile";

export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  plugins: [
    nilePlugin({
      // UUID-based user identity (cross-tenant)
      // activeOrganizationId mapped to tenant_id
    }),
  ],

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    },
  },
});
```

**Session Creation:**

```typescript
// packages/api/src/orchestrators/steps/create-session-step.ts
export class CreateSessionStep implements IdempotentSagaStep<SessionInput, { sessionId: string }> {
  async execute(input: SessionInput): Promise<{ sessionId: string }> {
    const session = await auth.api.createSession({
      userId: input.userId,
      activeOrganizationId: input.workspaceId,  // Nile plugin: multi-workspace support
    });

    return { sessionId: session.session.id };
  }

  async markForDeletion(output: { sessionId: string }): Promise<void> {
    await auth.api.revokeSession(output.sessionId);
  }
}
```

---

### File Upload (UploadThing)

**Pattern:** Client-side upload → Get file key → Pass key to saga

**Location:** `apps/web/src/uploadthing.ts`

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const OurFileRouter = {
  logoUpload: f({
    image: { maxFileSize: "500KB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Logo upload is pre-authentication, so no session check
      // Tenant isolation happens in saga via tenantId
      return { uploadContext: "workspace-onboarding" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return file key for saga to use
      return { key: file.key, url: file.url };
    }),
} satisfies FileRouter;
```

**Client Usage:**

```typescript
// apps/web/src/app/onboarding/page.tsx
import { useUploadThing } from "@/utils/uploadthing";

const { startUpload } = useUploadThing("logoUpload");

// Upload logo before workspace creation
const uploadResult = await startUpload([logoFile]);
const logoKey = uploadResult?.[0]?.key;

// Pass key to WorkspaceCreate
await client.workspaces.WorkspaceCreate({
  slug,
  name,
  email,
  password,
  fullName,
  logoKey,  // UploadThing file key
});
```

---

### Frontend Implementation (Next.js 16 + React 19)

**Location:** `apps/web/src/app/onboarding/page.tsx`

**Key Requirements:**

1. **React 19 Patterns:**
   - ✅ Use `ref` as prop (no `forwardRef`)
   - ✅ Form handled with TanStack Form + oRPC mutation
   - ✅ Optimistic UI for instant feedback

2. **Real-Time Slug Validation:**
   ```typescript
   import { useDebouncedCallback } from "use-debounce";

   const checkSlugAvailability = useDebouncedCallback(
     async (slug: string) => {
       const result = await client.workspaces.WorkspaceCheckAvailability({ slug });
       setSlugAvailable(result.available);
     },
     300  // 300ms debounce
   );
   ```

3. **Logo Upload Flow:**
   ```typescript
   const { startUpload, isUploading } = useUploadThing("logoUpload");

   const handleLogoChange = async (file: File) => {
     const result = await startUpload([file]);
     setLogoKey(result[0].key);
     setLogoPreview(result[0].url);
   };
   ```

4. **Form Submission:**
   ```typescript
   const createWorkspace = orpc.workspaces.WorkspaceCreate.useMutation();

   const onSubmit = async (data: FormData) => {
     const result = await createWorkspace.mutateAsync({
       slug: data.slug,
       name: data.name,
       email: data.email,
       password: data.password,
       fullName: data.fullName,
       logoKey,
       primaryColor: data.primaryColor,
     });

     // Redirect to workspace subdomain
     window.location.href = result.workspaceUrl;
   };
   ```

5. **Error Handling:**
   ```typescript
   // ✅ CORRECT: Specific error messages with i18n
   if (error.code === "error.workspace_slug_taken") {
     return t("onboarding.slug_taken");
   }

   // ❌ WRONG: Generic error messages
   if (error) return "Error occurred";
   ```

---

### Performance Optimization

**Critical NFRs:**

- **NFR-P1:** <3s server-side provisioning (95th percentile)
- **NFR-U1:** <60s onboarding to functional dashboard (90th percentile)

**Optimization Strategies:**

1. **Parallel Execution Where Possible:**
   ```typescript
   // ❌ WRONG: Sequential awaits
   const user = await createUser();
   const branding = await createBranding();

   // ✅ CORRECT: Parallel execution (if no dependency)
   const [user, branding] = await Promise.all([
     createUser(),
     createBranding(),
   ]);
   ```

2. **Database Connection Pooling:**
   - Use Drizzle connection pool with max 20 connections
   - Configure `connectionTimeoutMillis: 5000`

3. **Cache-First Branding Lookup:**
   - Use Upstash Redis for tenant branding cache
   - TTL: 1 hour, stale-while-revalidate pattern

---

### Error Handling & Validation

**Validation Rules (Tiger Style Engineering):**

- ✅ Fail fast with assertions - validate `tenantId`, `userId` at boundaries
- ✅ Explicit control flow - orchestration functions own branching
- ✅ Bounded resources - maximum request body sizes
- ❌ NO implicit defaults - all caches, retries, timeouts explicitly set

**Slug Validation:**

```typescript
// Regex pattern: lowercase alphanumeric + hyphens only
const slugPattern = /^[a-z0-9-]+$/;

// Reserved slugs (cannot be used)
const RESERVED_SLUGS = ["www", "app", "api", "admin", "dashboard"];

function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (slug.length < 3) return { valid: false, error: "error.slug_too_short" };
  if (slug.length > 63) return { valid: false, error: "error.slug_too_long" };
  if (!slugPattern.test(slug)) return { valid: false, error: "error.slug_invalid_chars" };
  if (RESERVED_SLUGS.includes(slug)) return { valid: false, error: "error.slug_reserved" };

  return { valid: true };
}
```

---

### Testing Requirements

**Test Locations:**

1. **Saga Integration Tests:** `packages/api/src/orchestrators/__tests__/onboarding-saga.test.ts`
2. **API Contract Tests:** `packages/api/src/routers/workspaces/__tests__/workspaces.test.ts`
3. **E2E Tests:** `apps/web/e2e/onboarding.spec.ts`

**Critical Test Cases:**

```typescript
// Integration test: Saga compensation
describe("OnboardingSaga - Compensation", () => {
  it("should rollback all steps if CreateSessionStep fails", async () => {
    // Inject failure at session creation
    const saga = new OnboardingSaga();
    const mockSessionStep = {
      execute: () => Promise.reject(new Error("Session creation failed")),
      markForDeletion: vi.fn(),
    };

    await expect(saga.execute(input)).rejects.toThrow("Session creation failed");

    // Verify all previous steps marked for deletion
    expect(mockWorkspaceStep.markForDeletion).toHaveBeenCalled();
    expect(mockUserStep.markForDeletion).toHaveBeenCalled();
  });

  it("should detect and repair orphan tenants", async () => {
    // Background reconciler job test
    const orphans = await findOrphanTenants();
    expect(orphans).toHaveLength(0);
  });
});

// E2E test: Complete onboarding flow
describe("Workspace Onboarding Flow", () => {
  it("should create workspace and redirect in <60 seconds", async () => {
    const startTime = Date.now();

    await page.goto("/onboarding");
    await page.fill('[name="slug"]', "test-workspace");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.fill('[name="fullName"]', "Test User");

    // Upload logo
    await page.setInputFiles('[name="logo"]', "./fixtures/test-logo.png");

    await page.click('button[type="submit"]');

    // Wait for redirect to workspace subdomain
    await page.waitForURL(/https:\/\/test-workspace\.customerdeskai\.com/);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(60000); // <60 seconds
  });
});
```

---

### Reaper Pattern (Background Cleanup)

**Worker Location:** `packages/api/src/workers/reaper.ts`

```typescript
export async function reaperWorker() {
  const gracePeriod = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  // Delete workspaces marked for deletion > 24h ago
  await db.delete(tenants).where(
    and(
      isNotNull(tenants.deletedAt),
      lt(tenants.deletedAt, gracePeriod)
    )
  );

  console.log("Reaper cleanup completed");
}

// Schedule with cron (every 6 hours)
// sst.config.ts:
// new sst.aws.Cron("Reaper", {
//   schedule: "rate(6 hours)",
//   job: { handler: "packages/api/src/workers/reaper.reaperWorker" },
// });
```

---

## Tasks / Subtasks

### Task 1: Database Schema Setup (AC: 1, 2)
- [ ] Create `tenants` table schema in `packages/db/src/schema/tenants.ts`
  - [ ] Add `id` (varchar 41, prefixed UUID with `generateId("tnt")`)
  - [ ] Add `slug` (varchar 255, unique, not null)
  - [ ] Add `name` (text, not null)
  - [ ] Add audit fields (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`)
  - [ ] Add `deletedAt` timestamp for soft delete (Reaper pattern)
- [ ] Create `branding_settings` table in `packages/db/src/schema/branding.ts`
  - [ ] Add `id` (varchar 41, prefixed UUID with `generateId("brd")`)
  - [ ] Add `tenantId` (varchar 41, not null)
  - [ ] Add `logoUrl`, `logoKey` for UploadThing integration
  - [ ] Add theme colors (`primaryColor`, `secondaryColor`, `accentColor`)
  - [ ] Add localization fields (`language`, `timezone`)
- [ ] Create `tenant_users` table in `packages/db/src/schema/tenant-users.ts`
  - [ ] Add composite primary key (`tenantId`, `userId`)
  - [ ] Add `role` (owner, admin, agent)
  - [ ] Add `invitedBy` (nullable for founders), `joinedAt`
- [ ] Generate migration: `pnpm run db:generate`
- [ ] Run migration: `pnpm run db:migrate`
- [ ] Verify schema in Drizzle Studio: `pnpm run db:studio`

### Task 2: Saga Orchestrator Base (AC: 1, 6)
- [ ] Create `SagaOrchestrator` base class in `packages/api/src/orchestrators/saga-orchestrator.ts`
  - [ ] Define `IdempotentSagaStep` interface with `execute()` and `markForDeletion()`
  - [ ] Implement `addStep()` method for builder pattern
  - [ ] Implement `execute()` with try-catch compensation logic
  - [ ] On error, call `markForDeletion()` for all executed steps in reverse order
  - [ ] Log compensation errors (don't fail - Reaper will handle)
- [ ] Create individual saga steps in `packages/api/src/orchestrators/steps/`:
  - [ ] `ReserveSlugStep` - Reserve slug with expiration (idempotent)
  - [ ] `CreateWorkspaceStep` - Create tenant (idempotent: return existing if found)
  - [ ] `CreateBetterAuthUserStep` - Create user via Better-Auth (idempotent)
  - [ ] `LinkTenantUserStep` - Link user to tenant with role "owner" (upsert)
  - [ ] `CreateBrandingStep` - Create branding config (idempotent)
  - [ ] `CreateSessionStep` - Initialize session with activeOrganizationId
  - [ ] `SendWelcomeEmailStep` - Send welcome email (log-only compensation)
- [ ] Implement `OnboardingSaga` in `packages/api/src/routers/workspaces/onboarding-saga.ts`
  - [ ] Chain all saga steps in correct order
  - [ ] Return results array with typed destructuring

### Task 3: API Endpoints (AC: 2, 3)
- [ ] Create `workspacesRouter` in `packages/api/src/routers/workspaces/index.ts`
  - [ ] Implement `WorkspaceCreate` procedure:
    - [ ] Input validation with Zod schema (slug, name, email, password, fullName, optional logoKey/primaryColor)
    - [ ] Execute OnboardingSaga with input
    - [ ] Return `workspaceId`, `userId`, `sessionId`, `workspaceUrl`
  - [ ] Implement `WorkspaceCheckAvailability` procedure:
    - [ ] Input: slug (3-63 chars, lowercase alphanumeric + hyphens)
    - [ ] Query database for existing tenant with slug (exclude soft-deleted)
    - [ ] Return `available: boolean`, `error?: string`
  - [ ] Implement `WorkspaceGet` procedure (protected):
    - [ ] Input: workspaceId
    - [ ] Query database, return workspace details
    - [ ] Throw NotFoundError if not found
- [ ] Export router in `packages/api/src/routers/index.ts`
- [ ] Test with Hoppscotch or Postman (localhost:3000/rpc)

### Task 4: UploadThing Integration (AC: 4)
- [ ] Configure UploadThing in `apps/web/src/uploadthing.ts`
  - [ ] Create `logoUpload` file route (image, 500KB max, 1 file max)
  - [ ] Middleware: no auth required (pre-onboarding upload)
  - [ ] `onUploadComplete`: return `{ key, url }` for saga
- [ ] Create upload utilities in `apps/web/src/utils/uploadthing.ts`
  - [ ] Export `useUploadThing` hook
  - [ ] Export `uploadFiles` helper
- [ ] Add UploadThing API route in `apps/web/src/app/api/uploadthing/route.ts`
- [ ] Test file upload in isolation before integrating with form

### Task 5: Frontend Onboarding Form (AC: 2, 3, 4, 5, 6)
- [ ] Create onboarding page in `apps/web/src/app/onboarding/page.tsx`
  - [ ] Use TanStack Form for form state management
  - [ ] Add form fields: slug, name, email, password, fullName
  - [ ] Add optional logo upload with preview
  - [ ] Add optional primary color picker
- [ ] Implement real-time slug validation (debounced 300ms):
  - [ ] Use `useDebouncedCallback` from `use-debounce`
  - [ ] Call `WorkspaceCheckAvailability` on slug input change
  - [ ] Display availability status (✅ Available / ❌ Taken)
  - [ ] Show error message with i18n key if taken
- [ ] Implement logo upload:
  - [ ] Use `useUploadThing("logoUpload")` hook
  - [ ] Show upload progress indicator
  - [ ] Preview uploaded logo
  - [ ] Store logoKey in form state
- [ ] Implement form submission:
  - [ ] Use `orpc.workspaces.WorkspaceCreate.useMutation()`
  - [ ] Show loading state during submission
  - [ ] On success: redirect to `result.workspaceUrl` (subdomain)
  - [ ] On error: display specific error message (i18n)
- [ ] Add performance monitoring:
  - [ ] Track time from page load to redirect
  - [ ] Send metric to PostHog: `onboarding_duration_ms`
  - [ ] Alert if >60 seconds (90th percentile target)

### Task 6: Better-Auth Session Management (AC: 5)
- [ ] Verify Better-Auth configuration in `packages/auth/src/index.ts`
  - [ ] Ensure Nile plugin is enabled
  - [ ] Verify `activeOrganizationId` mapping
- [ ] Implement `CreateSessionStep`:
  - [ ] Call `auth.api.createSession({ userId, activeOrganizationId: workspaceId })`
  - [ ] Return sessionId
  - [ ] Implement `markForDeletion`: call `auth.api.revokeSession(sessionId)`
- [ ] Test session creation:
  - [ ] Verify session cookie is set with `.customerdeskai.com` domain
  - [ ] Verify `SameSite=Lax` attribute
  - [ ] Verify `activeOrganizationId` is set to new tenant

### Task 7: Multi-Tenant Routing (AC: 5)
- [ ] Verify Next.js middleware in `apps/web/middleware.ts`
  - [ ] Extract subdomain from host header
  - [ ] Resolve tenant from subdomain using `tenantService.resolveFromHost()`
  - [ ] Redirect to `/not-found` if tenant not found
  - [ ] Canonical origin enforcement (optional)
- [ ] Test subdomain routing:
  - [ ] Create workspace with slug "test-workspace"
  - [ ] Verify redirect to `https://test-workspace.customerdeskai.com`
  - [ ] Verify session persists across subdomain switch

### Task 8: Background Cleanup (Reaper Pattern) (AC: 1)
- [ ] Create `reaperWorker` in `packages/api/src/workers/reaper.ts`
  - [ ] Query tenants where `deletedAt IS NOT NULL AND deletedAt < NOW() - INTERVAL '24 hours'`
  - [ ] Delete matching tenants (hard delete after grace period)
  - [ ] Log cleanup count
- [ ] Schedule cron job in `sst.config.ts`:
  - [ ] Create `Cron` resource with `rate(6 hours)` schedule
  - [ ] Point to `packages/api/src/workers/reaper.reaperWorker` handler
- [ ] Add monitoring: alert if orphan count > 0

### Task 9: Integration Tests (AC: 1, 6)
- [ ] Create saga integration tests in `packages/api/src/orchestrators/__tests__/onboarding-saga.test.ts`
  - [ ] Test idempotency: calling saga twice with same slug returns existing workspace
  - [ ] Test compensation: inject failure at each step, verify rollback
  - [ ] Test race condition: concurrent slug reservations
  - [ ] Test orphan detection: verify Reaper finds and cleans up orphans
- [ ] Create API contract tests in `packages/api/src/routers/workspaces/__tests__/workspaces.test.ts`
  - [ ] Test `WorkspaceCreate` success case
  - [ ] Test `WorkspaceCreate` with duplicate slug (should fail)
  - [ ] Test `WorkspaceCheckAvailability` for available and taken slugs
- [ ] Run tests: `pnpm test`

### Task 10: E2E Tests (AC: 6)
- [ ] Create E2E test in `apps/web/e2e/onboarding.spec.ts`
  - [ ] Test complete onboarding flow: fill form → upload logo → submit → verify redirect
  - [ ] Test performance: measure duration from page load to redirect, assert <60s
  - [ ] Test slug validation: enter taken slug, verify error message
  - [ ] Test error handling: simulate network failure, verify error message
- [ ] Run E2E tests: `pnpm run test:e2e`

### Task 11: Code Quality & Linting (AC: All)
- [ ] Run Ultracite: `npx ultracite fix`
- [ ] Run Oxlint: `pnpm run check`
- [ ] Run TypeScript check: `pnpm run check-types`
- [ ] Fix all linting errors and type errors
- [ ] Verify all files follow project-context.md rules:
  - [ ] Resource-Oriented RPC naming (`WorkspaceCreate`, not `createWorkspace`)
  - [ ] Prefixed UUIDs (`generateId("tnt")`, not raw UUIDs)
  - [ ] Discriminated unions (not bag of optionals)
  - [ ] No default exports (except Next.js pages)
  - [ ] `import type` for type-only imports

---

## Dev Notes

### Architecture Patterns to Follow

1. **Compensating Transaction Pattern (MANDATORY)**
   - Use `SagaOrchestrator` with idempotent steps
   - Every step must implement `execute()` and `markForDeletion()`
   - Soft delete with `deletedAt` timestamp
   - Reaper worker cleans up after 24-hour grace period

2. **Resource-Oriented RPC Naming (MANDATORY)**
   - Format: `{Resource}{Action}` (e.g., `WorkspaceCreate`, not `createWorkspace`)
   - Never use verb-first naming (e.g., `listTickets`, `get`, `resolveTicket`)

3. **Prefixed UUIDs for Observability (MANDATORY)**
   - Always use `generateId("prefix")` from `@CustomerDeskAI/db/utils/id-generator`
   - Prefixes: `tnt_` (tenants), `usr_` (users), `brd_` (branding), `ses_` (sessions)
   - Never use raw UUIDs or `uuid().defaultRandom()`

4. **Tiger Style Engineering**
   - Fail fast with assertions (validate inputs at boundaries)
   - Explicit control flow (orchestration owns branching)
   - Bounded resources (max request body sizes)
   - No implicit defaults (explicit caches, retries, timeouts)

### Critical File Locations

**Database Schema:**
- `packages/db/src/schema/tenants.ts` - Tenants table
- `packages/db/src/schema/branding.ts` - Branding settings table
- `packages/db/src/schema/tenant-users.ts` - RBAC table

**API:**
- `packages/api/src/routers/workspaces/index.ts` - Workspace router
- `packages/api/src/routers/workspaces/onboarding-saga.ts` - Saga orchestration
- `packages/api/src/orchestrators/saga-orchestrator.ts` - Base saga class
- `packages/api/src/orchestrators/steps/` - Individual saga steps

**Frontend:**
- `apps/web/src/app/onboarding/page.tsx` - Onboarding form
- `apps/web/src/uploadthing.ts` - UploadThing file router
- `apps/web/middleware.ts` - Multi-tenant routing

**Workers:**
- `packages/api/src/workers/reaper.ts` - Background cleanup

**Auth:**
- `packages/auth/src/index.ts` - Better-Auth configuration

### Technology Stack (From project-context.md)

**Frontend:**
- Next.js 16.0.10 (App Router, React Server Components)
- React 19.2.1 (`ref` as prop, no `forwardRef`)
- TailwindCSS 4.1.10 (oxide engine)
- TanStack Form 1.27.3 + TanStack Query 5.90.12
- oRPC 1.12.2 (type-safe RPC)

**Backend:**
- Bun runtime
- Elysia framework
- Drizzle ORM + PostgreSQL 15+
- Better-Auth + Nile Plugin

**Testing:**
- Vitest (contract tests)
- Playwright (E2E tests)
- Testcontainers (integration tests with real PostgreSQL)

**Code Quality:**
- Ultracite 6.4.0 (Biome preset)
- Oxlint 1.32.0

### Performance Targets (Non-Functional Requirements)

- **NFR-P1:** <3s server-side provisioning (95th percentile)
  - Breakdown targets:
    - Nile tenant creation: <800ms
    - Better-Auth user creation: <500ms
    - tenant_users linkage: <200ms
    - Session initialization: <300ms
    - Middleware overhead: <200ms

- **NFR-U1:** <60s onboarding to functional dashboard (90th percentile)
  - Includes: form fill + logo upload + server processing + redirect

- **NFR-R2:** Zero zombie workspaces (100% atomicity)
  - Critical: Most important NFR, drives compensating transaction pattern
  - Test: Integration tests must verify compensation logic

### Security Requirements

- **Multi-Tenant Isolation:**
  - Subdomain-based security origins prevent cross-tenant cookie contamination
  - Tenant ID validated on every RPC call via middleware
  - Nile Row-Level Security (RLS) enforces database-level tenant isolation
  - Zero cross-tenant data leakage

- **Password Security:**
  - bcrypt hashing with 10 rounds minimum (Better-Auth default)
  - Password length: minimum 8 characters
  - No password complexity requirements (per NIST guidelines)

- **Session Security:**
  - HTTP-only encrypted cookies for XSS protection
  - SameSite=Lax for CSRF protection
  - Cookie domain: `.customerdeskai.com` (enables cross-workspace switching)

### I18n / Error Messages

**Error Keys (to be defined in i18n files):**

- `error.workspace_slug_taken` - Slug already in use
- `error.slug_too_short` - Slug must be at least 3 characters
- `error.slug_too_long` - Slug cannot exceed 63 characters
- `error.slug_invalid_chars` - Slug can only contain lowercase letters, numbers, and hyphens
- `error.slug_reserved` - Slug is reserved (e.g., "www", "app", "api")
- `error.workspace_not_found` - Workspace not found
- `error.insufficient_permissions` - User lacks required permissions

**Supported Languages (Phase 1):**
- English (`en`)
- Spanish (`es`)
- Portuguese (Brazil) (`pt-BR`)

### References

- [Architecture: Onboarding Atomicity] _bmad-output/architecture.md - "Saga + Outbox Pattern"
- [Architecture: Multi-Tenant Routing] _bmad-output/architecture.md - "Tenant Resolver"
- [Architecture: Branding Configuration] _bmad-output/architecture.md - "Theme Before FCP"
- [Architecture: Database Schema] _bmad-output/architecture.md - "Tenants Table", "Branding Settings Table"
- [Project Context: TypeScript Standards] _bmad-output/project-context.md - "TypeScript Standards (MANDATORY)"
- [Project Context: Architectural Patterns] _bmad-output/project-context.md - "Resource-Oriented RPC Naming", "Prefixed UUIDs"
- [Epic 1 Context] _bmad-output/epics.md:567-640 - "Frictionless Workspace Activation"
- [Engineering Standards] .claude/CLAUDE.md - "TypeScript Standards", "React / UI Standards"

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev-story workflow_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation - list all files created/modified_

---

**Status:** ready-for-dev
**Created:** 2026-01-03
**Epic:** 1 - Frictionless Workspace Activation
**Story:** 1.1 - Single-Session Workspace Creation

**Next Steps:**
1. Review this comprehensive story context
2. Optional: Run `validate-create-story` for quality check
3. Run `dev-story` workflow to begin implementation
4. Run `code-review` when complete
