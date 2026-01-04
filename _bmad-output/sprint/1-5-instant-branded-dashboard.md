# Story 1.5: Instant Branded Dashboard

**Story ID:** 1.5
**Story Key:** `1-5-instant-branded-dashboard`
**Epic:** Epic 1 - Frictionless Workspace Activation
**Status:** ready-for-dev
**Created:** 2026-01-04

---

## User Story

**As a** Workspace Owner
**I want** to see my brand (logo, colors) applied immediately upon workspace creation
**So that** I feel ownership and see tangible progress instantly

---

## Acceptance Criteria

- [ ] Workspace logo appears in navigation header immediately after creation
- [ ] Primary and accent colors applied to dashboard UI (buttons, links, headers)
- [ ] Branded empty state shows clear next steps (not generic platform branding)
- [ ] "Getting Started" checklist visible with 3 high-impact items

---

## Business Context

**Mental Bandwidth Recovery Principle:** After Sarah López completes onboarding, she needs immediate visual confirmation that this workspace is HERS, not another generic SaaS dashboard. Seeing her company logo and brand colors creates a sense of ownership and progress.

**Zero-Gravity UX Requirement:** The transition from onboarding to dashboard must feel seamless. No generic "Welcome to CustomerDeskAI" placeholder branding. Sarah should immediately recognize this as her company's support desk.

**Performance Target:**
- Logo display: <200ms (SSR + CDN)
- Theme application: <100ms (inline CSS custom properties)
- Dashboard initial render: <1.5s (p95)
- "Getting Started" checklist: visible above the fold (no scroll)

**Business Impact:**
- Reduces perceived setup time (instant gratification)
- Increases workspace activation rate (tangible progress)
- Establishes brand sovereignty early (not platform-centric)

---

## Technical Overview

### Architecture Pattern: Server-Side Theming with CSS Custom Properties

This story implements **server-side branding data injection** with **CSS custom properties** for instant theme application.

**Key Components:**
1. **Branding Data Fetch** via oRPC (server-side)
2. **CSS Custom Properties** (TailwindCSS 4 integration)
3. **Branded Layout Component** (logo + navigation)
4. **Empty State Components** (branded, not generic)
5. **Getting Started Checklist** (high-impact onboarding tasks)

**Data Flow:**
```
User completes onboarding → Redirect to workspace dashboard
  ↓
Next.js SSR → Fetch branding settings (logo, colors) from DB
  ↓
Inject CSS custom properties → <style> tag in <head>
  ↓
Render branded layout → Logo in header, themed UI
  ↓
Show branded empty state + Getting Started checklist
```

**Performance Strategy:**
- SSR branding data (no client-side flash)
- Inline CSS custom properties (no external stylesheet)
- Logo preloaded via `<link rel="preload">`
- UploadThing CDN for logo delivery (<100ms)

---

## Technical Implementation

### Task 1: Create Branding Settings API Endpoint

**File:** `packages/api/src/routers/branding/index.ts`

```typescript
import { z } from "zod";
import { protectedProcedure } from "../../index";
import { db } from "@CustomerDeskAI/db";
import { brandingSettings } from "@CustomerDeskAI/db/schema";
import { eq } from "drizzle-orm";

/**
 * Branding router for workspace theme management.
 */
export const brandingRouter = {
  /**
   * Get branding settings for current tenant.
   * Used for server-side rendering of branded dashboard.
   */
  BrandingGet: protectedProcedure.handler(async ({ context }) => {
    const { tenantId } = context.session;

    const branding = await db.query.brandingSettings.findFirst({
      where: eq(brandingSettings.tenantId, tenantId),
    });

    if (!branding) {
      // Return default branding if none exists
      return {
        logoUrl: null,
        primaryColor: "#4F46E5", // Indigo 600 (default)
        accentColor: "#10B981", // Emerald 500 (default)
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      };
    }

    return {
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor || "#4F46E5",
      accentColor: branding.accentColor || "#10B981",
      backgroundColor: branding.backgroundColor || "#FFFFFF",
      textColor: branding.textColor || "#111827",
    };
  }),

  /**
   * Update branding settings for current tenant.
   */
  BrandingUpdate: protectedProcedure
    .input(
      z.object({
        logoKey: z.string().optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        textColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { tenantId, userId } = context.session;

      // Upsert branding settings
      const updated = await db
        .insert(brandingSettings)
        .values({
          tenantId,
          logoKey: input.logoKey,
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          accentColor: input.accentColor,
          backgroundColor: input.backgroundColor,
          textColor: input.textColor,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: brandingSettings.tenantId,
          set: {
            logoKey: input.logoKey,
            logoUrl: input.logoUrl,
            primaryColor: input.primaryColor,
            accentColor: input.accentColor,
            backgroundColor: input.backgroundColor,
            textColor: input.textColor,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        })
        .returning();

      return updated[0];
    }),
};
```

**Subtasks:**
1. Create `brandingRouter` in `packages/api/src/routers/branding/index.ts`
2. Add `BrandingGet` procedure (returns default if none exists)
3. Add `BrandingUpdate` procedure (upsert pattern)
4. Mount router in `packages/api/src/routers/index.ts`
5. Add Zod schema for color validation (`#RRGGBB` format)
6. Add default colors (Indigo 600 primary, Emerald 500 accent)
7. Return `logoUrl`, `primaryColor`, `accentColor`, `backgroundColor`, `textColor`

---

### Task 2: Mount Branding Router in App Router

**File:** `packages/api/src/routers/index.ts`

```typescript
import { brandingRouter } from "./branding";

export const appRouter = {
  // ... existing routers
  workspaces: workspaceRouter,
  branding: brandingRouter, // Add branding router
  todo: todoRouter,
};

export type AppRouter = typeof appRouter;
```

**Subtasks:**
1. Import `brandingRouter`
2. Add `branding: brandingRouter` to `appRouter`
3. Verify TypeScript types propagate to client

---

### Task 3: Create Theme Provider Component

**File:** `apps/web/src/components/providers/theme-provider.tsx`

```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface BrandingTheme {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

const ThemeContext = createContext<BrandingTheme | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  theme: BrandingTheme;
}

/**
 * Client-side theme context provider.
 * Receives branding data from server via props (SSR).
 */
export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current branding theme.
 */
export function useTheme(): BrandingTheme {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return theme;
}
```

**Subtasks:**
1. Create `BrandingTheme` interface
2. Create `ThemeContext` with `createContext`
3. Create `ThemeProvider` component receiving theme via props
4. Create `useTheme` hook for client components
5. Add error handling if used outside provider

---

### Task 4: Create Branded Layout with CSS Custom Properties

**File:** `apps/web/src/app/(workspace)/layout.tsx`

```typescript
import { orpc } from "@/utils/orpc";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BrandedHeader } from "@/components/layout/branded-header";
import type { ReactNode } from "react";

export interface WorkspaceLayoutProps {
  children: ReactNode;
}

/**
 * Workspace layout with server-side branding.
 * Fetches branding settings and injects CSS custom properties.
 */
export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  // Fetch branding settings server-side
  const branding = await orpc.branding.BrandingGet();

  return (
    <>
      {/* Inject CSS custom properties */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${branding.primaryColor};
              --color-accent: ${branding.accentColor};
              --color-background: ${branding.backgroundColor};
              --color-text: ${branding.textColor};
            }
          `,
        }}
      />

      {/* Preload logo for instant display */}
      {branding.logoUrl && (
        <link rel="preload" href={branding.logoUrl} as="image" />
      )}

      <ThemeProvider theme={branding}>
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
          <BrandedHeader logoUrl={branding.logoUrl} />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </ThemeProvider>
    </>
  );
}
```

**Subtasks:**
1. Create workspace layout in `apps/web/src/app/(workspace)/layout.tsx`
2. Fetch branding via `orpc.branding.BrandingGet()` server-side
3. Inject CSS custom properties via inline `<style>` tag
4. Add logo preload via `<link rel="preload">`
5. Wrap in `ThemeProvider` for client components
6. Apply CSS custom properties to root div (`bg-[var(--color-background)]`)
7. Render `BrandedHeader` with logo
8. Add `container` wrapper for main content

---

### Task 5: Create Branded Header Component

**File:** `apps/web/src/components/layout/branded-header.tsx`

```typescript
"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export interface BrandedHeaderProps {
  logoUrl: string | null;
}

/**
 * Branded navigation header with workspace logo.
 *
 * Accessibility:
 * - <nav> semantic element
 * - Skip link for keyboard navigation
 * - Alt text for logo
 */
export function BrandedHeader({ logoUrl }: BrandedHeaderProps) {
  const theme = useTheme();

  return (
    <header
      className="border-b"
      style={{ borderColor: `${theme.primaryColor}20` }} // 20% opacity
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
        >
          Skip to main content
        </a>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Workspace logo"
              width={40}
              height={40}
              className="rounded-md object-contain"
              priority // Above-the-fold image
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <span className="text-lg font-semibold" style={{ color: theme.textColor }}>
            Support Desk
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/tickets"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.textColor }}
          >
            Tickets
          </Link>
          <Link
            href="/knowledge-base"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.textColor }}
          >
            Knowledge Base
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.textColor }}
          >
            Settings
          </Link>

          <Button
            size="sm"
            style={{
              backgroundColor: theme.primaryColor,
              color: "#FFFFFF",
            }}
          >
            New Ticket
          </Button>
        </div>
      </nav>
    </header>
  );
}
```

**Subtasks:**
1. Create `BrandedHeader` component
2. Add logo display with Next.js `Image` component (priority=true)
3. Add fallback icon if no logo (Building2 with primary color background)
4. Add navigation links (Tickets, Knowledge Base, Settings)
5. Add "New Ticket" button with primary color
6. Add skip link for keyboard accessibility
7. Use CSS custom properties via inline styles
8. Add semantic `<nav>` element
9. Add border with primary color (20% opacity)

---

### Task 6: Create Branded Empty State Component

**File:** `apps/web/src/components/dashboard/empty-state.tsx`

```typescript
"use client";

import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/providers/theme-provider";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Branded empty state component.
 * Uses workspace primary color for icon and button.
 *
 * NOT generic "Welcome to CustomerDeskAI" - uses workspace branding.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {/* Icon with primary color */}
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primaryColor}10` }} // 10% opacity
        >
          <Icon
            className="h-8 w-8"
            style={{ color: theme.primaryColor }}
          />
        </div>

        {/* Title and description */}
        <h3
          className="mb-2 text-xl font-semibold"
          style={{ color: theme.textColor }}
        >
          {title}
        </h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>

        {/* Action button */}
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            style={{
              backgroundColor: theme.primaryColor,
              color: "#FFFFFF",
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Subtasks:**
1. Create `EmptyState` component with branding
2. Add icon prop (default: Inbox)
3. Add icon background with primary color (10% opacity)
4. Add title and description props
5. Add optional action button with primary color
6. Use `useTheme()` for color injection
7. Add dashed border on Card
8. Center content with flexbox
9. Add Plus icon to action button

---

### Task 7: Create Getting Started Checklist Component

**File:** `apps/web/src/components/dashboard/getting-started-checklist.tsx`

```typescript
"use client";

import { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
}

export interface GettingStartedChecklistProps {
  items: ChecklistItem[];
  onItemClick: (itemId: string) => void;
  onDismiss: () => void;
}

/**
 * Getting Started checklist with 3 high-impact onboarding tasks.
 *
 * Branded with workspace primary color for completed items.
 */
export function GettingStartedChecklist({
  items,
  onItemClick,
  onDismiss,
}: GettingStartedChecklistProps) {
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">
            Getting Started
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} completed
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onDismiss();
            setDismissed(true);
          }}
          aria-label="Dismiss getting started checklist"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: theme.primaryColor,
            }}
          />
        </div>

        {/* Checklist items */}
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
              >
                {/* Checkbox */}
                {item.completed ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                    style={{ color: theme.primaryColor }}
                  />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                )}

                {/* Content */}
                <div className="flex-1">
                  <h4
                    className={`text-sm font-medium ${
                      item.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-600">
                    {item.description}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

**Subtasks:**
1. Create `GettingStartedChecklist` component
2. Add `ChecklistItem` interface (id, title, description, completed, href)
3. Add progress bar with primary color
4. Add completed count (e.g., "2 of 3 completed")
5. Add dismiss button with X icon
6. Add checklist items as clickable buttons
7. Add CheckCircle2 icon for completed (primary color)
8. Add Circle icon for incomplete (gray)
9. Add line-through styling for completed items
10. Add hover effect on items
11. Add dismissed state (hide when dismissed)

---

### Task 8: Create Dashboard Page with Empty State

**File:** `apps/web/src/app/(workspace)/dashboard/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist";
import type { ChecklistItem } from "@/components/dashboard/getting-started-checklist";

export default function DashboardPage() {
  const router = useRouter();

  // Getting Started checklist state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: "invite-team",
      title: "Invite your team",
      description: "Add team members to start collaborating on tickets",
      completed: false,
      href: "/settings/team",
    },
    {
      id: "create-kb-article",
      title: "Create your first knowledge base article",
      description: "Help customers find answers with self-service content",
      completed: false,
      href: "/knowledge-base/new",
    },
    {
      id: "customize-branding",
      title: "Customize your email templates",
      description: "Add your brand to customer-facing emails",
      completed: false,
      href: "/settings/branding/emails",
    },
  ]);

  const handleChecklistItemClick = (itemId: string) => {
    const item = checklistItems.find((i) => i.id === itemId);
    if (item) {
      router.push(item.href);
    }
  };

  const handleChecklistDismiss = () => {
    // Persist dismissal to localStorage
    localStorage.setItem("customerdeskai:getting-started:dismissed", "true");
  };

  return (
    <div id="main-content">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      {/* Getting Started Checklist */}
      <GettingStartedChecklist
        items={checklistItems}
        onItemClick={handleChecklistItemClick}
        onDismiss={handleChecklistDismiss}
      />

      {/* Empty State */}
      <EmptyState
        title="No tickets yet"
        description="When customers submit tickets, they'll appear here. Get started by inviting your team or creating knowledge base articles."
        actionLabel="Create Test Ticket"
        onAction={() => router.push("/tickets/new")}
      />
    </div>
  );
}
```

**Subtasks:**
1. Create dashboard page in `apps/web/src/app/(workspace)/dashboard/page.tsx`
2. Add `GettingStartedChecklist` with 3 items:
   - Invite your team
   - Create first KB article
   - Customize email templates
3. Add `EmptyState` for no tickets
4. Add checklist item click handler (navigate to href)
5. Add checklist dismiss handler (persist to localStorage)
6. Add page heading "Dashboard"
7. Add `id="main-content"` for skip link

---

### Task 9: Update TailwindCSS Config for CSS Custom Properties

**File:** `apps/web/tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Allow CSS custom properties in Tailwind
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        foreground: "var(--color-text)",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Subtasks:**
1. Open `apps/web/tailwind.config.ts`
2. Add CSS custom property colors to `theme.extend.colors`
3. Map `primary`, `accent`, `background`, `foreground` to CSS vars
4. Enable usage in Tailwind classes (e.g., `bg-primary`, `text-primary`)

---

### Task 10: Add Logo to Workspace Creation Response

**File:** `packages/api/src/routers/workspaces/index.ts`

```typescript
WorkspaceCreate: publicProcedure
  .input(z.object({
    slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
    logoKey: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  }))
  .handler(async ({ input }) => {
    const saga = new OnboardingSaga();
    const result = await saga.execute(input);

    // Return workspace details including logo URL
    const branding = await db.query.brandingSettings.findFirst({
      where: eq(brandingSettings.tenantId, result.workspaceId),
    });

    return {
      workspaceId: result.workspaceId,
      userId: result.userId,
      sessionId: result.sessionId,
      workspaceUrl: `https://${input.slug}.customerdeskai.com`,
      logoUrl: branding?.logoUrl ?? null,
      primaryColor: branding?.primaryColor ?? "#4F46E5",
    };
  }),
```

**Subtasks:**
1. Update `WorkspaceCreate` handler
2. Fetch branding settings after saga completion
3. Return `logoUrl` and `primaryColor` in response
4. Add to response type inference

---

### Task 11: Add Branding Settings Seed Data

**File:** `packages/db/src/seed.ts`

```typescript
import { db } from "./index";
import { brandingSettings } from "./schema/branding";
import { tenants } from "./schema/tenants";

async function seed() {
  // Create demo tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: "demo-workspace",
      name: "Demo Workspace",
      createdBy: "usr_seed",
      updatedBy: "usr_seed",
    })
    .returning();

  // Create branding settings
  await db.insert(brandingSettings).values({
    tenantId: tenant.id,
    logoUrl: "https://utfs.io/f/demo-logo.png",
    primaryColor: "#4F46E5", // Indigo 600
    accentColor: "#10B981", // Emerald 500
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    createdBy: "usr_seed",
    updatedBy: "usr_seed",
  });

  console.log("✅ Seed data created");
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
```

**Subtasks:**
1. Create or update `packages/db/src/seed.ts`
2. Add demo tenant creation
3. Add branding settings for demo tenant
4. Add seed script to `package.json`: `"db:seed": "tsx src/seed.ts"`
5. Document seed data in README

---

### Task 12: Add E2E Tests for Branded Dashboard

**File:** `apps/web/tests/e2e/branded-dashboard.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Branded Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Complete onboarding with branding
    await page.goto("/onboarding");
    await page.fill('input[name="slug"]', "acme-support");
    await page.fill('input[name="name"]', "Acme Support");
    await page.fill('input[name="email"]', "sarah@acme.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="fullName"]', "Sarah López");
    await page.fill('input[name="primaryColor"]', "#FF5722"); // Custom orange

    // Upload logo (mock)
    // await page.setInputFiles('input[type="file"]', "tests/fixtures/logo.png");

    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/acme-support\.customerdeskai\.com\/dashboard/);
  });

  test("should display workspace logo in header", async ({ page }) => {
    const logo = page.locator('nav img[alt="Workspace logo"]');
    await expect(logo).toBeVisible();
  });

  test("should apply primary color to UI elements", async ({ page }) => {
    // Check button background color
    const button = page.locator('button:has-text("New Ticket")');
    const bgColor = await button.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // RGB for #FF5722 is rgb(255, 87, 34)
    expect(bgColor).toBe("rgb(255, 87, 34)");
  });

  test("should inject CSS custom properties", async ({ page }) => {
    const rootStyles = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement);
    });

    const primaryColor = rootStyles.getPropertyValue("--color-primary").trim();
    expect(primaryColor).toBe("#FF5722");
  });

  test("should show Getting Started checklist", async ({ page }) => {
    await expect(page.locator('text=Getting Started')).toBeVisible();
    await expect(page.locator('text=Invite your team')).toBeVisible();
    await expect(page.locator('text=Create your first knowledge base article')).toBeVisible();
    await expect(page.locator('text=Customize your email templates')).toBeVisible();
  });

  test("should show progress bar with primary color", async ({ page }) => {
    const progressBar = page.locator('.h-2.w-full .h-full');
    const bgColor = await progressBar.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(bgColor).toBe("rgb(255, 87, 34)"); // #FF5722
  });

  test("should navigate on checklist item click", async ({ page }) => {
    await page.click('text=Invite your team');
    await page.waitForURL(/\/settings\/team/);
  });

  test("should dismiss checklist", async ({ page }) => {
    const dismissButton = page.locator('button[aria-label="Dismiss getting started checklist"]');
    await dismissButton.click();

    await expect(page.locator('text=Getting Started')).not.toBeVisible();
  });

  test("should show branded empty state", async ({ page }) => {
    await expect(page.locator('text=No tickets yet')).toBeVisible();

    // Check icon color (primary color)
    const icon = page.locator('.h-16.w-16 svg');
    const color = await icon.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    expect(color).toBe("rgb(255, 87, 34)"); // #FF5722
  });

  test("should navigate on empty state action", async ({ page }) => {
    await page.click('button:has-text("Create Test Ticket")');
    await page.waitForURL(/\/tickets\/new/);
  });

  test("should show default branding if no logo uploaded", async ({ page }) => {
    // If logo not uploaded, fallback icon should appear
    const fallbackIcon = page.locator('nav .h-10.w-10 svg');

    // Only visible if logo NOT present
    const logoVisible = await page.locator('nav img[alt="Workspace logo"]').isVisible();

    if (!logoVisible) {
      await expect(fallbackIcon).toBeVisible();
    }
  });
});
```

**Subtasks:**
1. Test logo displays in navigation header
2. Test primary color applied to buttons
3. Test CSS custom properties injected in :root
4. Test Getting Started checklist visible
5. Test checklist progress bar uses primary color
6. Test checklist item click navigates
7. Test checklist dismiss hides component
8. Test empty state displays
9. Test empty state icon uses primary color
10. Test empty state action navigates
11. Test fallback icon when no logo uploaded

---

### Task 13: Add Integration Tests for Branding API

**File:** `packages/api/src/routers/branding/__tests__/branding.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@CustomerDeskAI/db";
import { brandingSettings, tenants } from "@CustomerDeskAI/db/schema";
import { brandingRouter } from "../index";

describe("Branding Router", () => {
  let testTenantId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: "test-workspace",
        name: "Test Workspace",
        createdBy: "usr_test",
        updatedBy: "usr_test",
      })
      .returning();

    testTenantId = tenant.id;
    testUserId = "usr_test";
  });

  it("should return default branding if none exists", async () => {
    const result = await brandingRouter.BrandingGet.handler({
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    expect(result).toEqual({
      logoUrl: null,
      primaryColor: "#4F46E5",
      accentColor: "#10B981",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
    });
  });

  it("should create branding settings", async () => {
    const result = await brandingRouter.BrandingUpdate.handler({
      input: {
        logoUrl: "https://utfs.io/f/test-logo.png",
        logoKey: "test-logo-key",
        primaryColor: "#FF5722",
        accentColor: "#2196F3",
      },
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    expect(result.logoUrl).toBe("https://utfs.io/f/test-logo.png");
    expect(result.primaryColor).toBe("#FF5722");
    expect(result.accentColor).toBe("#2196F3");
  });

  it("should update existing branding settings", async () => {
    // Create initial branding
    await brandingRouter.BrandingUpdate.handler({
      input: {
        primaryColor: "#4F46E5",
      },
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    // Update branding
    const result = await brandingRouter.BrandingUpdate.handler({
      input: {
        primaryColor: "#FF5722",
        accentColor: "#2196F3",
      },
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    expect(result.primaryColor).toBe("#FF5722");
    expect(result.accentColor).toBe("#2196F3");
  });

  it("should validate color format", async () => {
    await expect(
      brandingRouter.BrandingUpdate.handler({
        input: {
          primaryColor: "invalid-color",
        },
        context: {
          session: { tenantId: testTenantId, userId: testUserId },
        },
      })
    ).rejects.toThrow(); // Zod validation error
  });

  it("should fetch created branding", async () => {
    // Create branding
    await brandingRouter.BrandingUpdate.handler({
      input: {
        logoUrl: "https://utfs.io/f/test-logo.png",
        primaryColor: "#FF5722",
      },
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    // Fetch branding
    const result = await brandingRouter.BrandingGet.handler({
      context: {
        session: { tenantId: testTenantId, userId: testUserId },
      },
    });

    expect(result.logoUrl).toBe("https://utfs.io/f/test-logo.png");
    expect(result.primaryColor).toBe("#FF5722");
  });
});
```

**Subtasks:**
1. Test `BrandingGet` returns defaults if none exists
2. Test `BrandingUpdate` creates new branding
3. Test `BrandingUpdate` updates existing branding (upsert)
4. Test color format validation (#RRGGBB)
5. Test `BrandingGet` returns created branding
6. Add test tenant creation in beforeEach
7. Clean up test data after each test

---

### Task 14: Update Architecture Documentation

**File:** `_bmad-output/architecture.md`

Add new section under "Frontend Patterns":

```markdown
### Server-Side Branding with CSS Custom Properties

**Pattern:** SSR Theme Injection + CSS Variables

**Use Case:** Instant branded dashboard with zero flash of unstyled content (FOUC)

**Implementation:**

1. **Fetch branding server-side** (Next.js App Router):
```typescript
export default async function WorkspaceLayout({ children }) {
  const branding = await orpc.branding.BrandingGet();

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `:root {
          --color-primary: ${branding.primaryColor};
          --color-accent: ${branding.accentColor};
        }`
      }} />
      <ThemeProvider theme={branding}>
        {children}
      </ThemeProvider>
    </>
  );
}
```

2. **Use CSS custom properties in components**:
```typescript
<Button style={{ backgroundColor: "var(--color-primary)" }} />
// OR
<Button className="bg-primary" /> // Via Tailwind config
```

**Benefits:**
- No FOUC (branding rendered server-side)
- No client-side fetch latency
- SEO-friendly (static HTML includes branding)
- Logo preloaded via `<link rel="preload">`

**Performance:**
- CSS injection: <10ms (inline style tag)
- Logo CDN: <100ms (UploadThing)
- Total branded render: <200ms (p95)
```

**Subtasks:**
1. Add "Server-Side Branding" section
2. Document SSR pattern with Next.js App Router
3. Document CSS custom property injection
4. Document ThemeProvider pattern
5. Document logo preloading
6. Add performance metrics

---

## Definition of Done

**Functional Requirements:**
- [ ] Logo displays in navigation header immediately after workspace creation
- [ ] Primary color applied to buttons, links, progress bars
- [ ] Accent color available for secondary UI elements
- [ ] Empty state uses branded colors (not generic platform branding)
- [ ] Getting Started checklist shows 3 high-impact items
- [ ] Checklist progress bar uses primary color
- [ ] Checklist items navigate on click
- [ ] Checklist dismisses and persists dismissal
- [ ] Default branding (Indigo + Emerald) if no logo uploaded

**Technical Requirements:**
- [ ] `BrandingGet` API endpoint returns branding settings
- [ ] `BrandingUpdate` API endpoint creates/updates branding (upsert)
- [ ] CSS custom properties injected server-side (no FOUC)
- [ ] Logo preloaded via `<link rel="preload">`
- [ ] `ThemeProvider` context for client components
- [ ] `useTheme()` hook for accessing branding
- [ ] `BrandedHeader` component with logo + navigation
- [ ] `EmptyState` component with branded colors
- [ ] `GettingStartedChecklist` component with 3 items
- [ ] TailwindCSS config supports CSS custom properties

**Testing Requirements:**
- [ ] E2E tests: logo displays in header
- [ ] E2E tests: primary color applied to buttons
- [ ] E2E tests: CSS custom properties injected
- [ ] E2E tests: Getting Started checklist visible
- [ ] E2E tests: checklist progress bar color
- [ ] E2E tests: checklist item navigation
- [ ] E2E tests: checklist dismiss
- [ ] E2E tests: empty state displays
- [ ] E2E tests: empty state icon color
- [ ] E2E tests: fallback icon when no logo
- [ ] Unit tests: `BrandingGet` returns defaults
- [ ] Unit tests: `BrandingUpdate` creates/updates
- [ ] Unit tests: color validation

**Performance Requirements:**
- [ ] Logo display: <200ms (SSR + CDN)
- [ ] CSS injection: <100ms (inline style)
- [ ] Dashboard initial render: <1.5s (p95)
- [ ] No FOUC (flash of unstyled content)

**Code Quality:**
- [ ] TypeScript types for all branding APIs
- [ ] Zod schema for color validation
- [ ] Accessibility: semantic HTML, skip links
- [ ] Code passes `npx ultracite check`

---

## Related Stories

**Dependencies:**
- **Story 1.1 (Single-Session Workspace Creation):** Provides base onboarding flow and workspace creation
- **Story 1.1 (Single-Session Workspace Creation):** Logo upload creates `brandingSettings` record

**Enhances:**
- **Story 4.1 (Instant Visual Brand Identity):** Extends branding to email templates

**Blocks:**
- None (can be implemented independently)

---

## Performance Metrics

**Target Metrics:**
- Logo display latency: <200ms (p95)
- CSS custom property injection: <100ms (p50)
- Dashboard initial render: <1.5s (p95)
- Getting Started checklist render: <200ms (p95)

**Monitoring:**
- Logo CDN latency (UploadThing)
- SSR branding fetch latency (oRPC)
- Client-side theme context initialization

---

## Security & Privacy Considerations

**Data Access:**
- Branding data scoped to current tenant via session
- Row-Level Security (RLS) enforced by Nile

**XSS Mitigation:**
- CSS custom properties sanitized (Zod validation)
- Color values regex validated (`#RRGGBB` only)
- Logo URLs trusted (UploadThing CDN only)
- `dangerouslySetInnerHTML` limited to CSS injection (no JS)

**Content Security Policy:**
- Logo images from UploadThing CDN (`https://utfs.io/*`)
- Inline styles allowed for CSS custom properties

---

## Edge Cases

1. **No Logo Uploaded:**
   - Show fallback icon (Building2) with primary color background
   - Graceful degradation

2. **Invalid Logo URL:**
   - Next.js Image component handles broken images
   - Show fallback icon

3. **Invalid Color Format:**
   - Zod validation rejects non-`#RRGGBB` colors
   - Return 400 error with clear message

4. **Missing Branding Settings:**
   - `BrandingGet` returns defaults (Indigo + Emerald)
   - Never show broken UI

5. **Checklist Already Dismissed:**
   - Check localStorage on mount
   - Don't show if `customerdeskai:getting-started:dismissed === "true"`

6. **Concurrent Branding Updates:**
   - Last write wins (acceptable for single-user scenario)
   - Optimistic UI shows update immediately

---

## Implementation Notes

**CSS Custom Properties Strategy:**
- Inline `<style>` tag in layout (no external stylesheet)
- Injected server-side (Next.js App Router)
- No client-side flash (SSR renders with branding)
- Tailwind classes can reference via `bg-primary`, `text-primary`

**Logo Preloading:**
- `<link rel="preload" href={logoUrl} as="image" />`
- Prioritizes logo download
- Reduces perceived latency

**Getting Started Checklist Items:**
1. **Invite your team** → `/settings/team`
2. **Create first KB article** → `/knowledge-base/new`
3. **Customize email templates** → `/settings/branding/emails`

**Dismissal Persistence:**
- Stored in localStorage: `customerdeskai:getting-started:dismissed`
- Not synced to server (client-side preference)
- Persists across sessions

**Empty State Patterns:**
- No tickets: "Create Test Ticket" action
- No KB articles: "Create Article" action
- No team members: "Invite Team" action

---

## Open Questions

1. **Should we allow custom fonts in branding?**
   - **Answer:** NO in this story. Future enhancement (Story 4.1).

2. **Should Getting Started checklist sync completion state to server?**
   - **Answer:** NO. Client-side localStorage only. Keep it simple.

3. **Should we show a "Preview" mode when uploading logo in onboarding?**
   - **Answer:** YES, but that's Story 1.1 enhancement. Not in scope here.

4. **Should we support dark mode?**
   - **Answer:** NO in this story. Future enhancement.

---

## Success Metrics

**User Behavior:**
- % of users who complete ≥1 Getting Started item (target: >50%)
- % of users who dismiss checklist (acceptable: <30%)
- Time to first checklist item click (target: <30s)

**Technical Metrics:**
- Zero FOUC incidents (0 reports)
- Logo display latency: <200ms (p95)
- CSS injection latency: <100ms (p50)

**Business Impact:**
- Increased workspace activation rate by 20%
- Reduced time-to-first-action by 15%
- Improved brand sovereignty perception (qualitative feedback)
