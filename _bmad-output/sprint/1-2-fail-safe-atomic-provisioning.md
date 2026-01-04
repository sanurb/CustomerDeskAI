# Story 1.2: Fail-Safe Atomic Provisioning

**Epic:** 1 - Frictionless Workspace Activation
**Status:** ready-for-dev
**Business Value:** Platform Reliability & User Trust
**Success Metric:** Zero zombie workspaces (100% atomicity)

---

## Story

**As a** Workspace Owner (Sarah Chen - Head of Customer Success),
**I want** an automated, fail-safe setup process,
**So that** I don't encounter "partially created" workspaces that require support intervention.

---

## Acceptance Criteria

1. **Complete Rollback on Failure**
   - Workspace provisioning succeeds completely OR rolls back entirely (zero "zombie workspaces")
   - If any step fails (user creation, branding setup, session initialization), all progress is reversed
   - No orphaned records remain in database after failed provisioning

2. **URL Reservation Freed on Failure**
   - Workspace URL (slug) is freed for retry if provisioning fails
   - User can immediately retry with the same slug after failure
   - No "slug already taken" error on retry after rollback

3. **Clear Error Messages**
   - User receives clear error message with actionable recovery steps (not generic "Error occurred")
   - Error messages indicate which step failed (e.g., "Email service unavailable - please try again")
   - I18n support for English, Spanish, Portuguese (Brazil)

4. **Form State Persistence**
   - User can resume with pre-filled form data after recoverable failures
   - Logo upload persists through retry (doesn't require re-upload)
   - Form state cleared only on successful workspace creation

5. **Idempotent Operations**
   - Calling workspace creation twice with same slug returns existing workspace (if completed)
   - Retry after partial failure creates new workspace (after rollback)
   - No duplicate workspaces created for same slug

---

## Context & User Journey

Sarah is creating her workspace at 11 PM after a long day. If provisioning fails halfway through, she doesn't have the energy to debug "partially created" states or contact support. The system must either succeed completely or cleanly roll back, allowing her to retry immediately without confusion.

**Critical User Psychology:**
- Sarah is exhausted and time-pressured
- She has no patience for "contact support" scenarios
- She needs immediate retry capability after failure
- Any orphaned state erodes trust in the platform

---

## Technical Implementation Requirements

### Architecture Pattern: Compensating Transaction Pattern (MANDATORY)

**Critical:** This story focuses on the **compensation logic** of the saga pattern. While Story 1.1 implements the happy path (successful provisioning), this story ensures fail-safe behavior when ANY step fails.

**Saga Compensation Flow:**

```typescript
// packages/api/src/orchestrators/saga-orchestrator.ts
export class SagaOrchestrator<TContext> {
  private steps: IdempotentSagaStep<unknown, unknown>[] = [];
  private executedSteps: { step: IdempotentSagaStep<unknown, unknown>; result: unknown }[] = [];

  async execute(): Promise<{ success: boolean; results: unknown[] }> {
    try {
      // Execute all steps in order
      for (const step of this.steps) {
        const result = await step.execute(this.context);
        this.executedSteps.push({ step, result });
      }

      return { success: true, results: this.executedSteps.map(s => s.result) };
    } catch (error) {
      // CRITICAL: Compensate ALL executed steps in reverse order
      for (const { step, result } of this.executedSteps.reverse()) {
        await step.markForDeletion(result).catch(err => {
          // Log but don't fail - Reaper will handle cleanup
          console.error(`Failed to mark ${step.name} for deletion:`, err);
        });
      }

      throw error; // Re-throw original error for client
    }
  }
}
```

**Key Compensation Rules:**

1. **Reverse Order:** Compensate steps in reverse order of execution
2. **Non-Failing:** `markForDeletion()` should never throw - log errors instead
3. **Soft Delete:** Mark records with `deletedAt` timestamp (Reaper cleans up later)
4. **Eventual Consistency:** Accept 24-hour cleanup delay for edge cases

---

### Compensation Steps Implementation

#### 1. ReserveSlugStep Compensation

```typescript
// packages/api/src/orchestrators/steps/reserve-slug-step.ts
export class ReserveSlugStep implements IdempotentSagaStep<{ slug: string }, { reservationId: string }> {
  name = "ReserveSlug";

  async execute(input: { slug: string }): Promise<{ reservationId: string }> {
    // Check if already reserved by this request (idempotent)
    const existing = await db
      .select({ id: slugReservations.id })
      .from(slugReservations)
      .where(eq(slugReservations.slug, input.slug))
      .where(gt(slugReservations.expiresAt, new Date())) // Not expired
      .limit(1);

    if (existing.length > 0) {
      return { reservationId: existing[0].id };
    }

    // Reserve slug with 5-minute expiration
    const reservationId = generateId("res");
    await db.insert(slugReservations).values({
      id: reservationId,
      slug: input.slug,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    return { reservationId };
  }

  async markForDeletion(output: { reservationId: string }): Promise<void> {
    // Delete reservation immediately (frees slug for retry)
    await db
      .delete(slugReservations)
      .where(eq(slugReservations.id, output.reservationId))
      .catch(err => {
        console.error("Failed to delete slug reservation:", err);
        // Non-critical - reservation expires anyway
      });
  }
}
```

**New Table:** `slug_reservations`

```typescript
// packages/db/src/schema/slug-reservations.ts
export const slugReservations = pgTable("slug_reservations", {
  id: varchar("id", { length: 41 })
    .primaryKey()
    .$defaultFn(() => generateId("res")),

  slug: varchar("slug", { length: 255 }).notNull().unique(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 2. CreateWorkspaceStep Compensation

```typescript
// packages/api/src/orchestrators/steps/create-workspace-step.ts
export class CreateWorkspaceStep implements IdempotentSagaStep<CreateWorkspaceInput, { workspaceId: string }> {
  name = "CreateWorkspace";

  async execute(input: CreateWorkspaceInput): Promise<{ workspaceId: string }> {
    // Check if workspace already exists (idempotent)
    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, input.slug))
      .where(isNull(tenants.deletedAt)) // Not soft-deleted
      .limit(1);

    if (existing.length > 0) {
      return { workspaceId: existing[0].id };
    }

    // Create new workspace
    const workspaceId = generateId("tnt");
    await db.insert(tenants).values({
      id: workspaceId,
      slug: input.slug,
      name: input.name,
      createdBy: "usr_system",
      updatedBy: "usr_system",
    });

    return { workspaceId };
  }

  async markForDeletion(output: { workspaceId: string }): Promise<void> {
    // Soft delete (Reaper will clean up after 24h)
    await db
      .update(tenants)
      .set({ deletedAt: new Date() })
      .where(eq(tenants.id, output.workspaceId))
      .catch(err => {
        console.error("Failed to soft delete workspace:", err);
        // Log for manual investigation
      });
  }
}
```

#### 3. CreateBetterAuthUserStep Compensation

```typescript
// packages/api/src/orchestrators/steps/create-better-auth-user-step.ts
export class CreateBetterAuthUserStep implements IdempotentSagaStep<CreateUserInput, { userId: string }> {
  name = "CreateBetterAuthUser";

  async execute(input: CreateUserInput): Promise<{ userId: string }> {
    // Check if user already exists (idempotent)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      return { userId: existing[0].id };
    }

    // Create user via Better-Auth
    const user = await auth.api.signUp({
      email: input.email,
      password: input.password,
      name: input.fullName,
    });

    return { userId: user.user.id };
  }

  async markForDeletion(output: { userId: string }): Promise<void> {
    // Better-Auth doesn't support user deletion - mark as disabled instead
    await db
      .update(users)
      .set({
        disabled: true,
        disabledReason: "Onboarding rollback",
        disabledAt: new Date(),
      })
      .where(eq(users.id, output.userId))
      .catch(err => {
        console.error("Failed to disable user:", err);
        // Log for manual investigation
      });
  }
}
```

#### 4. CreateBrandingStep Compensation (With UploadThing Rollback)

```typescript
// packages/api/src/orchestrators/steps/create-branding-step.ts
export class CreateBrandingStep implements IdempotentSagaStep<CreateBrandingInput, { brandingId: string; logoKey?: string }> {
  name = "CreateBranding";

  async execute(input: CreateBrandingInput): Promise<{ brandingId: string; logoKey?: string }> {
    // Check if branding already exists (idempotent)
    const existing = await db
      .select({ id: brandingSettings.id, logoKey: brandingSettings.logoKey })
      .from(brandingSettings)
      .where(eq(brandingSettings.tenantId, input.workspaceId))
      .limit(1);

    if (existing.length > 0) {
      return { brandingId: existing[0].id, logoKey: existing[0].logoKey ?? undefined };
    }

    // Create branding config
    const brandingId = generateId("brd");
    await db.insert(brandingSettings).values({
      id: brandingId,
      tenantId: input.workspaceId,
      logoUrl: input.logoUrl,
      logoKey: input.logoKey,
      primaryColor: input.primaryColor ?? "#000000",
      language: input.language ?? "en",
      timezone: input.timezone ?? "UTC",
      createdBy: "usr_system",
      updatedBy: "usr_system",
    });

    return { brandingId, logoKey: input.logoKey };
  }

  async markForDeletion(output: { brandingId: string; logoKey?: string }): Promise<void> {
    // Delete branding config from database
    await db
      .delete(brandingSettings)
      .where(eq(brandingSettings.id, output.brandingId))
      .catch(err => {
        console.error("Failed to delete branding config:", err);
      });

    // Delete uploaded file from UploadThing (if exists)
    if (output.logoKey) {
      await utapi.deleteFiles([output.logoKey]).catch(err => {
        console.error("Failed to delete UploadThing file:", err);
        // Log for manual cleanup - not critical
      });
    }
  }
}
```

#### 5. CreateSessionStep Compensation

```typescript
// packages/api/src/orchestrators/steps/create-session-step.ts
export class CreateSessionStep implements IdempotentSagaStep<SessionInput, { sessionId: string }> {
  name = "CreateSession";

  async execute(input: SessionInput): Promise<{ sessionId: string }> {
    // Better-Auth handles idempotency internally
    const session = await auth.api.createSession({
      userId: input.userId,
      activeOrganizationId: input.workspaceId,
    });

    return { sessionId: session.session.id };
  }

  async markForDeletion(output: { sessionId: string }): Promise<void> {
    // Revoke session immediately
    await auth.api.revokeSession(output.sessionId).catch(err => {
      console.error("Failed to revoke session:", err);
      // Log for investigation - session will expire anyway
    });
  }
}
```

#### 6. SendWelcomeEmailStep Compensation

```typescript
// packages/api/src/orchestrators/steps/send-welcome-email-step.ts
export class SendWelcomeEmailStep implements IdempotentSagaStep<SendWelcomeEmailInput, { emailId: string }> {
  name = "SendWelcomeEmail";

  async execute(input: SendWelcomeEmailInput): Promise<{ emailId: string }> {
    // Send via Resend
    const result = await resend.emails.send({
      from: "onboarding@customerdeskai.com",
      to: input.email,
      subject: `Welcome to ${input.workspaceName}`,
      react: <WelcomeEmail {...input} />,
    });

    return { emailId: result.id };
  }

  async markForDeletion(output: { emailId: string }): Promise<void> {
    // Email sending is NOT rollback-able
    // Log for manual review (send "Sorry, workspace creation failed" email?)
    console.warn("SendWelcomeEmailStep marked for deletion (email already sent)", {
      emailId: output.emailId,
      action: "manual_review_needed",
    });

    // Optional: Send "Sorry, please retry" email
    // await resend.emails.send({ ... }); // Low priority
  }
}
```

---

### Error Handling & User Feedback

**Error Response Format:**

```typescript
// packages/api/src/errors/workspace-creation-error.ts
export class WorkspaceCreationError extends Error {
  constructor(
    public code: string,
    public step: string,
    public userMessage: string,
    public recoverySteps: string[],
    public cause?: Error,
  ) {
    super(userMessage);
    this.name = "WorkspaceCreationError";
  }

  toJSON() {
    return {
      code: this.code,
      step: this.step,
      userMessage: this.userMessage,
      recoverySteps: this.recoverySteps,
    };
  }
}
```

**Error Codes & User Messages:**

```typescript
// Nile tenant creation failure
throw new WorkspaceCreationError(
  "error.tenant_creation_failed",
  "CreateWorkspace",
  "Failed to create workspace. Please try again.",
  ["Check your internet connection", "Try again in a few moments"],
  error
);

// Better-Auth user creation failure
throw new WorkspaceCreationError(
  "error.user_creation_failed",
  "CreateBetterAuthUser",
  "Failed to create your account. Please try again.",
  ["Verify your email address is correct", "Check if you already have an account"],
  error
);

// Email service failure (Resend)
throw new WorkspaceCreationError(
  "error.email_send_failed",
  "SendWelcomeEmail",
  "Workspace created successfully, but welcome email failed to send.",
  ["Check your email in a few minutes", "You can access your workspace now"],
  error
);
```

**I18n Keys:**

```json
// en.json
{
  "error.tenant_creation_failed": "Failed to create workspace. Please try again.",
  "error.user_creation_failed": "Failed to create your account. Please try again.",
  "error.email_send_failed": "Workspace created successfully, but welcome email failed to send.",
  "recovery_step.check_connection": "Check your internet connection",
  "recovery_step.try_again": "Try again in a few moments",
  "recovery_step.verify_email": "Verify your email address is correct",
  "recovery_step.check_existing_account": "Check if you already have an account",
  "recovery_step.check_email_later": "Check your email in a few minutes",
  "recovery_step.access_now": "You can access your workspace now"
}
```

---

### Frontend Error Handling

**Location:** `apps/web/src/app/onboarding/page.tsx`

```typescript
const createWorkspace = orpc.workspaces.WorkspaceCreate.useMutation({
  onError: (error) => {
    // Parse WorkspaceCreationError
    const errorData = error.data as WorkspaceCreationError;

    setErrorMessage(t(errorData.code));
    setRecoverySteps(errorData.recoverySteps.map(step => t(step)));

    // Preserve form state for retry
    // Do NOT clear form data on error
  },

  onSuccess: (result) => {
    // Clear form state only on success
    form.reset();

    // Redirect to workspace subdomain
    window.location.href = result.workspaceUrl;
  },
});

const onSubmit = async (data: FormData) => {
  try {
    await createWorkspace.mutateAsync({
      slug: data.slug,
      name: data.name,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      logoKey,
      primaryColor: data.primaryColor,
    });
  } catch (error) {
    // Error handling in onError callback
    // Form state preserved for retry
  }
};
```

**Error Display Component:**

```typescript
// apps/web/src/components/error-message.tsx
export function ErrorMessage({ code, recoverySteps }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {t(code)}
          </h3>
          {recoverySteps && recoverySteps.length > 0 && (
            <div className="mt-2 text-sm text-red-700">
              <p>To resolve this:</p>
              <ul className="list-disc pl-5 space-y-1">
                {recoverySteps.map((step, i) => (
                  <li key={i}>{t(step)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Reaper Pattern (Background Cleanup)

**Worker:** `packages/api/src/workers/reaper.ts`

```typescript
export async function reaperWorker() {
  const gracePeriod = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  // 1. Clean up soft-deleted workspaces
  const deletedWorkspaces = await db.delete(tenants).where(
    and(
      isNotNull(tenants.deletedAt),
      lt(tenants.deletedAt, gracePeriod)
    )
  ).returning({ id: tenants.id });

  console.log(`Reaper: Cleaned up ${deletedWorkspaces.length} workspaces`);

  // 2. Clean up expired slug reservations
  const expiredReservations = await db.delete(slugReservations).where(
    lt(slugReservations.expiresAt, new Date())
  ).returning({ id: slugReservations.id });

  console.log(`Reaper: Cleaned up ${expiredReservations.length} slug reservations`);

  // 3. Detect orphaned branding configs (no matching tenant)
  const orphanedBranding = await db
    .select({ id: brandingSettings.id, tenantId: brandingSettings.tenantId })
    .from(brandingSettings)
    .leftJoin(tenants, eq(brandingSettings.tenantId, tenants.id))
    .where(isNull(tenants.id));

  if (orphanedBranding.length > 0) {
    console.warn(`Reaper: Found ${orphanedBranding.length} orphaned branding configs`, {
      tenantIds: orphanedBranding.map(b => b.tenantId),
    });

    // Delete orphaned branding configs
    await db.delete(brandingSettings).where(
      inArray(brandingSettings.id, orphanedBranding.map(b => b.id))
    );
  }

  // 4. Detect orphaned users (disabled + no tenant linkage)
  const orphanedUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .leftJoin(tenantUsers, eq(users.id, tenantUsers.userId))
    .where(
      and(
        eq(users.disabled, true),
        eq(users.disabledReason, "Onboarding rollback"),
        isNull(tenantUsers.userId)
      )
    );

  if (orphanedUsers.length > 0) {
    console.warn(`Reaper: Found ${orphanedUsers.length} orphaned users`, {
      emails: orphanedUsers.map(u => u.email),
    });

    // Alert for manual review (don't auto-delete users - security concern)
  }
}
```

---

### Testing Strategy

**Integration Tests: Compensation Logic**

**Location:** `packages/api/src/orchestrators/__tests__/onboarding-saga-compensation.test.ts`

```typescript
describe("OnboardingSaga - Compensation & Rollback", () => {
  it("should rollback all steps if CreateWorkspaceStep fails", async () => {
    // Mock: CreateWorkspaceStep throws error
    const mockError = new Error("Database connection lost");
    vi.spyOn(CreateWorkspaceStep.prototype, "execute").mockRejectedValue(mockError);

    const saga = new OnboardingSaga();

    await expect(saga.execute(input)).rejects.toThrow("Database connection lost");

    // Verify: ReserveSlugStep.markForDeletion() was called
    expect(reserveSlugStep.markForDeletion).toHaveBeenCalled();

    // Verify: Slug reservation was deleted
    const reservation = await db
      .select()
      .from(slugReservations)
      .where(eq(slugReservations.slug, input.slug));

    expect(reservation).toHaveLength(0);
  });

  it("should rollback all steps if CreateSessionStep fails", async () => {
    // Mock: CreateSessionStep throws error
    vi.spyOn(CreateSessionStep.prototype, "execute").mockRejectedValue(
      new Error("Better-Auth unavailable")
    );

    const saga = new OnboardingSaga();

    await expect(saga.execute(input)).rejects.toThrow("Better-Auth unavailable");

    // Verify: All previous steps marked for deletion
    expect(reserveSlugStep.markForDeletion).toHaveBeenCalled();
    expect(createWorkspaceStep.markForDeletion).toHaveBeenCalled();
    expect(createUserStep.markForDeletion).toHaveBeenCalled();
    expect(linkTenantUserStep.markForDeletion).toHaveBeenCalled();
    expect(createBrandingStep.markForDeletion).toHaveBeenCalled();

    // Verify: Workspace soft-deleted
    const workspace = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, input.slug));

    expect(workspace[0].deletedAt).not.toBeNull();
  });

  it("should allow retry with same slug after rollback", async () => {
    // First attempt: Fail at session creation
    vi.spyOn(CreateSessionStep.prototype, "execute")
      .mockRejectedValueOnce(new Error("Session creation failed"))
      .mockResolvedValueOnce({ sessionId: "ses_123" });

    const saga1 = new OnboardingSaga();
    await expect(saga1.execute(input)).rejects.toThrow("Session creation failed");

    // Verify: Slug reservation deleted
    const reservation = await db
      .select()
      .from(slugReservations)
      .where(eq(slugReservations.slug, input.slug));
    expect(reservation).toHaveLength(0);

    // Second attempt: Should succeed with same slug
    const saga2 = new OnboardingSaga();
    const result = await saga2.execute(input);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(7); // All steps completed
  });

  it("should not create duplicate workspaces on concurrent requests", async () => {
    // Simulate race condition: Two users submit same slug simultaneously
    const saga1 = new OnboardingSaga();
    const saga2 = new OnboardingSaga();

    const [result1, result2] = await Promise.allSettled([
      saga1.execute(input),
      saga2.execute(input),
    ]);

    // One should succeed, one should fail with "slug already taken" error
    const successful = [result1, result2].filter(r => r.status === "fulfilled");
    const failed = [result1, result2].filter(r => r.status === "rejected");

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });

  it("should detect and repair orphaned branding configs", async () => {
    // Simulate orphan: Create branding config without tenant
    await db.insert(brandingSettings).values({
      id: generateId("brd"),
      tenantId: "tnt_nonexistent",
      primaryColor: "#000000",
      createdBy: "usr_system",
      updatedBy: "usr_system",
    });

    // Run Reaper
    await reaperWorker();

    // Verify: Orphaned branding config deleted
    const orphans = await db
      .select()
      .from(brandingSettings)
      .where(eq(brandingSettings.tenantId, "tnt_nonexistent"));

    expect(orphans).toHaveLength(0);
  });
});
```

**E2E Tests: Error Recovery**

**Location:** `apps/web/e2e/onboarding-error-recovery.spec.ts`

```typescript
describe("Workspace Onboarding - Error Recovery", () => {
  it("should preserve form state after network error", async () => {
    await page.goto("/onboarding");

    // Fill form
    await page.fill('[name="slug"]', "test-workspace");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.fill('[name="fullName"]', "Test User");

    // Simulate network error
    await page.route("**/rpc/workspaces.WorkspaceCreate", route =>
      route.abort("failed")
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]');

    // Verify: Form state preserved
    expect(await page.inputValue('[name="slug"]')).toBe("test-workspace");
    expect(await page.inputValue('[name="email"]')).toBe("test@example.com");
    expect(await page.inputValue('[name="fullName"]')).toBe("Test User");
    // Password field empty for security (expected)

    // Verify: Error message displayed
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain("Please try again");

    // Verify: Recovery steps displayed
    const recoverySteps = await page.$$('[data-testid="recovery-step"]');
    expect(recoverySteps.length).toBeGreaterThan(0);
  });

  it("should allow retry with same slug after rollback", async () => {
    // First attempt: Simulate server error
    await page.route("**/rpc/workspaces.WorkspaceCreate", route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: {
            code: "error.tenant_creation_failed",
            step: "CreateWorkspace",
            userMessage: "Failed to create workspace. Please try again.",
            recoverySteps: ["Check your internet connection"],
          },
        }),
      })
    );

    await page.goto("/onboarding");
    await page.fill('[name="slug"]', "test-workspace");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.fill('[name="fullName"]', "Test User");
    await page.click('button[type="submit"]');

    // Wait for error
    await page.waitForSelector('[data-testid="error-message"]');

    // Second attempt: Remove error simulation, retry
    await page.unroute("**/rpc/workspaces.WorkspaceCreate");

    await page.fill('[name="password"]', "SecurePass123!"); // Re-enter password
    await page.click('button[type="submit"]');

    // Should succeed with same slug
    await page.waitForURL(/https:\/\/test-workspace\.customerdeskai\.com/);
  });
});
```

---

## Tasks / Subtasks

### Task 1: Slug Reservation Table (AC: 2)
- [ ] Create `slug_reservations` table schema in `packages/db/src/schema/slug-reservations.ts`
  - [ ] Add `id` (varchar 41, prefixed UUID with `generateId("res")`)
  - [ ] Add `slug` (varchar 255, unique, not null)
  - [ ] Add `expiresAt` (timestamp, not null)
  - [ ] Add `createdAt` (timestamp, default now)
- [ ] Generate migration: `pnpm run db:generate`
- [ ] Run migration: `pnpm run db:migrate`
- [ ] Verify in Drizzle Studio: `pnpm run db:studio`

### Task 2: Implement ReserveSlugStep with Compensation (AC: 2)
- [ ] Create `ReserveSlugStep` in `packages/api/src/orchestrators/steps/reserve-slug-step.ts`
  - [ ] `execute()`: Check for existing reservation (idempotent)
  - [ ] `execute()`: Reserve slug with 5-minute expiration if not reserved
  - [ ] `execute()`: Return `{ reservationId }`
  - [ ] `markForDeletion()`: Delete reservation immediately (frees slug)
  - [ ] `markForDeletion()`: Log errors, don't throw
- [ ] Add to `OnboardingSaga` as first step
- [ ] Test idempotency: calling twice with same slug returns same reservation

### Task 3: Enhance CreateWorkspaceStep Compensation (AC: 1, 2)
- [ ] Update `CreateWorkspaceStep` in `packages/api/src/orchestrators/steps/create-workspace-step.ts`
  - [ ] `execute()`: Add idempotency check (return existing if found, exclude soft-deleted)
  - [ ] `markForDeletion()`: Soft delete with `deletedAt` timestamp
  - [ ] `markForDeletion()`: Log errors, don't throw
- [ ] Test compensation: verify soft delete sets `deletedAt`
- [ ] Test idempotency: verify returns existing workspace if already created

### Task 4: Enhance CreateBetterAuthUserStep Compensation (AC: 1)
- [ ] Update `CreateBetterAuthUserStep` in `packages/api/src/orchestrators/steps/create-better-auth-user-step.ts`
  - [ ] `execute()`: Add idempotency check (return existing if email already registered)
  - [ ] `markForDeletion()`: Mark user as disabled (Better-Auth doesn't support deletion)
  - [ ] `markForDeletion()`: Add `disabledReason: "Onboarding rollback"`
  - [ ] `markForDeletion()`: Log errors, don't throw
- [ ] Add `disabled`, `disabledReason`, `disabledAt` columns to `users` table (if not exist)
- [ ] Test compensation: verify user marked as disabled

### Task 5: Enhance CreateBrandingStep with UploadThing Rollback (AC: 1)
- [ ] Update `CreateBrandingStep` in `packages/api/src/orchestrators/steps/create-branding-step.ts`
  - [ ] `execute()`: Add idempotency check (return existing if branding config exists)
  - [ ] `markForDeletion()`: Delete branding config from database
  - [ ] `markForDeletion()`: Delete uploaded file from UploadThing (if logoKey exists)
  - [ ] `markForDeletion()`: Use `utapi.deleteFiles([logoKey])`
  - [ ] `markForDeletion()`: Log errors, don't throw
- [ ] Test UploadThing rollback: verify file deleted after compensation

### Task 6: Enhance CreateSessionStep Compensation (AC: 1)
- [ ] Update `CreateSessionStep` in `packages/api/src/orchestrators/steps/create-session-step.ts`
  - [ ] `execute()`: Better-Auth handles idempotency internally
  - [ ] `markForDeletion()`: Revoke session with `auth.api.revokeSession(sessionId)`
  - [ ] `markForDeletion()`: Log errors, don't throw
- [ ] Test session revocation: verify session invalid after rollback

### Task 7: Implement Structured Error Handling (AC: 3)
- [ ] Create `WorkspaceCreationError` class in `packages/api/src/errors/workspace-creation-error.ts`
  - [ ] Add `code`, `step`, `userMessage`, `recoverySteps` properties
  - [ ] Implement `toJSON()` for API response serialization
- [ ] Update each saga step to throw `WorkspaceCreationError` on failure:
  - [ ] `ReserveSlugStep`: `error.slug_reservation_failed`
  - [ ] `CreateWorkspaceStep`: `error.tenant_creation_failed`
  - [ ] `CreateBetterAuthUserStep`: `error.user_creation_failed`
  - [ ] `LinkTenantUserStep`: `error.tenant_user_link_failed`
  - [ ] `CreateBrandingStep`: `error.branding_creation_failed`
  - [ ] `CreateSessionStep`: `error.session_creation_failed`
  - [ ] `SendWelcomeEmailStep`: `error.email_send_failed`
- [ ] Add error messages to i18n files (`en.json`, `es.json`, `pt-BR.json`)

### Task 8: Frontend Error Display Component (AC: 3, 4)
- [ ] Create `ErrorMessage` component in `apps/web/src/components/error-message.tsx`
  - [ ] Display error icon (AlertCircle from lucide-react)
  - [ ] Display translated error message
  - [ ] Display recovery steps as bulleted list
  - [ ] Style with Tailwind (red background, proper spacing)
- [ ] Update onboarding page to use `ErrorMessage` component
  - [ ] Show error message on mutation error
  - [ ] Preserve form state on error (don't reset form)
  - [ ] Clear form state only on successful creation

### Task 9: Reaper Worker Enhancements (AC: 1, 2)
- [ ] Update `reaperWorker` in `packages/api/src/workers/reaper.ts`
  - [ ] Clean up expired slug reservations (expiresAt < now)
  - [ ] Clean up soft-deleted workspaces (deletedAt < 24h ago)
  - [ ] Detect orphaned branding configs (no matching tenant)
  - [ ] Detect orphaned users (disabled + no tenant linkage)
  - [ ] Log orphan counts for monitoring
- [ ] Add alerting for orphan detection (Sentry or console.warn)
- [ ] Schedule cron job: `rate(6 hours)` in `sst.config.ts`

### Task 10: Integration Tests - Compensation Logic (AC: 1, 2, 5)
- [ ] Create `onboarding-saga-compensation.test.ts` in `packages/api/src/orchestrators/__tests__/`
  - [ ] Test: Rollback when CreateWorkspaceStep fails
    - [ ] Verify: ReserveSlugStep.markForDeletion() called
    - [ ] Verify: Slug reservation deleted
  - [ ] Test: Rollback when CreateSessionStep fails
    - [ ] Verify: All previous steps.markForDeletion() called
    - [ ] Verify: Workspace soft-deleted
    - [ ] Verify: User disabled
    - [ ] Verify: Session revoked
  - [ ] Test: Retry with same slug after rollback succeeds
    - [ ] First attempt fails, rollback executes
    - [ ] Second attempt with same slug succeeds
  - [ ] Test: Concurrent requests with same slug (race condition)
    - [ ] One succeeds, one fails with "slug already taken"
  - [ ] Test: Reaper detects and repairs orphaned branding configs
- [ ] Run tests: `pnpm test`

### Task 11: E2E Tests - Error Recovery (AC: 3, 4)
- [ ] Create `onboarding-error-recovery.spec.ts` in `apps/web/e2e/`
  - [ ] Test: Form state preserved after network error
    - [ ] Simulate network failure
    - [ ] Verify form fields still populated (except password)
    - [ ] Verify error message displayed
    - [ ] Verify recovery steps displayed
  - [ ] Test: Retry with same slug after rollback
    - [ ] First attempt fails with server error
    - [ ] Retry with same slug succeeds
- [ ] Run E2E tests: `pnpm run test:e2e`

### Task 12: Code Quality & Linting (AC: All)
- [ ] Run Ultracite: `npx ultracite fix`
- [ ] Run Oxlint: `pnpm run check`
- [ ] Run TypeScript check: `pnpm run check-types`
- [ ] Fix all linting errors and type errors

---

## Dev Notes

### Relationship to Story 1.1

**Story 1.1 (Single-Session Workspace Creation):**
- Focuses on **happy path** - successful workspace provisioning
- Implements saga orchestrator base and all saga steps
- Creates database schema, API endpoints, frontend form

**Story 1.2 (Fail-Safe Atomic Provisioning):**
- Focuses on **error handling** - compensation logic and rollback
- Enhances each saga step with `markForDeletion()` implementation
- Adds structured error handling and user feedback
- Implements Reaper worker for orphan cleanup
- Tests compensation scenarios

**Implementation Order:**
- Story 1.1 implements the foundation (saga orchestrator, happy path)
- Story 1.2 adds fail-safe behavior (compensation, error handling)
- Both stories work on the same codebase (saga steps, frontend)

### Critical Patterns

**Compensating Transaction Pattern (MANDATORY):**
- Every saga step must implement `markForDeletion()`
- Compensation executes in **reverse order** of execution
- Compensation should **never throw** - log errors instead
- Use **soft delete** (`deletedAt` timestamp) for eventually consistent cleanup

**Idempotency (MANDATORY):**
- Every saga step must check for existing records before creating
- Calling same step twice with same input returns same result
- Enables retry without creating duplicates

**Eventual Consistency (Acceptable):**
- Reaper cleans up orphans after 24-hour grace period
- Not all compensation is instantaneous (e.g., UploadThing deletion)
- Monitoring alerts on orphan detection

### Technology Stack

Same as Story 1.1:
- Next.js 16.0.10, React 19.2.1
- Drizzle ORM, Better-Auth, Nile Plugin
- UploadThing, Upstash Redis, Resend
- Ultracite 6.4.0, Oxlint 1.32.0

### Performance Impact

**Compensation Overhead:**
- Minimal impact on happy path (<50ms)
- Compensation only executes on failure (rare)
- Reaper runs every 6 hours (low resource usage)

**Monitoring:**
- Track compensation execution count (should be low)
- Alert if orphan count > threshold (indicates bugs)

### Security Considerations

**User Account Protection:**
- Users are **disabled**, not deleted (security audit trail)
- Manual review required before permanent deletion
- Email addresses remain reserved (prevent impersonation)

**Session Security:**
- Sessions revoked immediately on rollback
- No active sessions remain after failed provisioning

### References

- [Architecture: Saga + Outbox Pattern] _bmad-output/architecture.md
- [Architecture: Reaper Pattern] _bmad-output/architecture.md
- [Project Context: Idempotent Sagas] _bmad-output/project-context.md
- [Story 1.1: Implementation Foundation] _bmad-output/sprint/1-1-single-session-workspace-creation.md
- [Epic 1 Context] _bmad-output/epics.md:594-605

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
**Story:** 1.2 - Fail-Safe Atomic Provisioning

**Next Steps:**
1. Review this comprehensive story context
2. Optional: Run `validate-create-story` for quality check
3. Run `dev-story` workflow to begin implementation
4. Run `code-review` when complete
