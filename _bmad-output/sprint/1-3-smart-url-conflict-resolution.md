# Story 1.3: Smart URL Conflict Resolution

**Epic:** 1 - Frictionless Workspace Activation
**Status:** ready-for-dev
**Business Value:** User Experience & Conversion Rate
**Success Metric:** <5% form abandonment due to slug conflicts

---

## Story

**As a** Workspace Owner (Sarah Chen - Head of Customer Success),
**I want** intelligent suggestions when my preferred workspace URL is taken,
**So that** I don't waste time guessing alternatives or feel frustrated.

---

## Acceptance Criteria

1. **Real-Time URL Availability Check**
   - Real-time URL availability check during form input (debounced 300ms)
   - Visual feedback: ✅ "Available" or ❌ "Already taken"
   - Check executes on every keystroke (with debouncing)
   - No form submission allowed if slug is unavailable

2. **Smart Suggestions on Conflict**
   - Smart suggestions provided when URL is taken (e.g., "acme" → "acme-support", "acme-cs")
   - Minimum 3 suggestions shown, maximum 5
   - Suggestions follow naming patterns: `{base}-support`, `{base}-cs`, `{base}-help`, `{base}2`, `{base}-team`
   - All suggested slugs verified as available before displaying

3. **One-Click Alternative Selection**
   - User can select suggested alternative with one click (auto-fills form)
   - Clicking suggestion updates slug input field immediately
   - Availability re-checked automatically after selection
   - Form can be submitted immediately after selecting available suggestion

4. **Race Condition Protection**
   - Race condition protection prevents two users reserving same URL simultaneously
   - Database unique constraint on `slug` column enforces uniqueness
   - Slug reservation (from Story 1.2) expires after 5 minutes
   - If reservation exists but expired, treat as available

---

## Context & User Journey

Sarah is creating her workspace and naturally tries "acme" as her slug (her company name). When it's taken, she doesn't want to:
- Guess random alternatives ("acme2", "acme3", "acme-test")
- Get frustrated by trial-and-error
- Abandon the process entirely

The system should intelligently suggest professional alternatives that make sense for her business (e.g., "acme-support", "acme-cs"), allowing her to pick one with a single click and continue.

**Critical User Psychology:**
- Slug conflict is a common friction point (30-40% of users encounter it)
- Poor suggestion UX increases abandonment risk by 15-20%
- Single-click selection reduces cognitive load
- Professional suggestions build trust in the platform

---

## Technical Implementation Requirements

### Architecture Pattern: Debounced Real-Time Validation

**Critical:** This story implements real-time slug validation with intelligent suggestion generation. It builds on the `WorkspaceCheckAvailability` endpoint from Story 1.1.

**Frontend Flow:**

```typescript
// apps/web/src/app/onboarding/page.tsx
import { useDebouncedCallback } from "use-debounce";
import { orpc } from "@/utils/orpc";

const [slugInput, setSlugInput] = useState("");
const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
const [isCheckingSlug, setIsCheckingSlug] = useState(false);

// Debounced availability check (300ms)
const checkSlugAvailability = useDebouncedCallback(
  async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      setSlugSuggestions([]);
      return;
    }

    setIsCheckingSlug(true);

    try {
      const result = await orpc.workspaces.WorkspaceCheckAvailability({
        slug,
      });

      setSlugAvailable(result.available);

      // If unavailable, generate suggestions
      if (!result.available) {
        const suggestions = await orpc.workspaces.WorkspaceGenerateSuggestions({
          slug,
        });
        setSlugSuggestions(suggestions.suggestions);
      } else {
        setSlugSuggestions([]);
      }
    } catch (error) {
      console.error("Slug check failed:", error);
      setSlugAvailable(null);
      setSlugSuggestions([]);
    } finally {
      setIsCheckingSlug(false);
    }
  },
  300 // 300ms debounce
);

// Trigger check on slug input change
useEffect(() => {
  checkSlugAvailability(slugInput);
}, [slugInput, checkSlugAvailability]);
```

---

### API Endpoint: WorkspaceGenerateSuggestions

**Location:** `packages/api/src/routers/workspaces/index.ts`

**New Procedure:**

```typescript
// packages/api/src/routers/workspaces/index.ts
export const workspacesRouter = {
  // ... existing procedures (WorkspaceCreate, WorkspaceCheckAvailability)

  WorkspaceGenerateSuggestions: publicProcedure
    .input(z.object({
      slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
    }))
    .output(z.object({
      suggestions: z.array(z.string()).min(3).max(5),
    }))
    .handler(async ({ input }) => {
      const suggestions = await generateSlugSuggestions(input.slug);

      return {
        suggestions,
      };
    }),
};
```

---

### Slug Suggestion Generation Algorithm

**Location:** `packages/api/src/utils/slug-suggestions.ts`

**Algorithm:**

```typescript
// packages/api/src/utils/slug-suggestions.ts
import { db } from "@CustomerDeskAI/db";
import { tenants, slugReservations } from "@CustomerDeskAI/db/schema";
import { eq, or, isNull, gt } from "drizzle-orm";

/**
 * Generate intelligent slug suggestions when base slug is taken
 *
 * Patterns:
 * 1. {base}-support (highest priority for customer support products)
 * 2. {base}-cs (customer service abbreviation)
 * 3. {base}-help (help desk context)
 * 4. {base}-team (team collaboration context)
 * 5. {base}2 (numeric suffix, last resort)
 *
 * All suggestions verified as available before returning
 */
export async function generateSlugSuggestions(baseSlug: string): Promise<string[]> {
  const patterns = [
    `${baseSlug}-support`,
    `${baseSlug}-cs`,
    `${baseSlug}-help`,
    `${baseSlug}-team`,
    `${baseSlug}2`,
    `${baseSlug}-desk`,
    `${baseSlug}3`,
  ];

  const availableSuggestions: string[] = [];

  // Check each pattern for availability
  for (const pattern of patterns) {
    const isAvailable = await checkSlugAvailable(pattern);

    if (isAvailable) {
      availableSuggestions.push(pattern);
    }

    // Stop once we have 5 suggestions
    if (availableSuggestions.length >= 5) {
      break;
    }
  }

  // If we still don't have 3 suggestions, generate numbered variants
  let counter = 4;
  while (availableSuggestions.length < 3 && counter <= 10) {
    const numberedSlug = `${baseSlug}${counter}`;
    const isAvailable = await checkSlugAvailable(numberedSlug);

    if (isAvailable) {
      availableSuggestions.push(numberedSlug);
    }

    counter++;
  }

  // Return minimum 3, maximum 5 suggestions
  return availableSuggestions.slice(0, 5);
}

/**
 * Check if slug is available (not taken by active tenant or unexpired reservation)
 */
async function checkSlugAvailable(slug: string): Promise<boolean> {
  // Check tenants table (exclude soft-deleted)
  const existingTenant = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .where(isNull(tenants.deletedAt))
    .limit(1);

  if (existingTenant.length > 0) {
    return false; // Slug taken by active tenant
  }

  // Check slug reservations (unexpired only)
  const existingReservation = await db
    .select({ id: slugReservations.id })
    .from(slugReservations)
    .where(eq(slugReservations.slug, slug))
    .where(gt(slugReservations.expiresAt, new Date())) // Not expired
    .limit(1);

  if (existingReservation.length > 0) {
    return false; // Slug reserved (not expired)
  }

  return true; // Slug available
}
```

**Suggestion Priority (by use case):**

1. **`{base}-support`** - Highest priority (customer support context)
2. **`{base}-cs`** - Customer service abbreviation
3. **`{base}-help`** - Help desk context
4. **`{base}-team`** - Team collaboration context
5. **`{base}2`** - Numeric suffix (simple, clear)
6. **`{base}-desk`** - Service desk context
7. **`{base}3`, `{base}4`, etc.** - Fallback numbered variants

---

### Frontend Slug Input Component

**Location:** `apps/web/src/app/onboarding/components/slug-input.tsx`

**Component Structure:**

```typescript
// apps/web/src/app/onboarding/components/slug-input.tsx
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  isChecking: boolean;
  isAvailable: boolean | null;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export function SlugInput({
  value,
  onChange,
  isChecking,
  isAvailable,
  suggestions,
  onSelectSuggestion,
}: SlugInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="slug" className="text-sm font-medium">
        Workspace URL
      </label>

      {/* Input with validation icon */}
      <div className="relative">
        <Input
          id="slug"
          name="slug"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          placeholder="your-workspace"
          className={cn(
            "pr-10",
            isAvailable === false && "border-red-500 focus-visible:ring-red-500",
            isAvailable === true && "border-green-500 focus-visible:ring-green-500"
          )}
        />

        {/* Validation icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          )}
          {!isChecking && isAvailable === true && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {!isChecking && isAvailable === false && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Subdomain preview */}
      <p className="text-sm text-gray-500">
        Your workspace will be available at:{" "}
        <span className="font-mono font-medium">
          {value || "your-workspace"}.customerdeskai.com
        </span>
      </p>

      {/* Availability status */}
      {isAvailable === false && (
        <p className="text-sm text-red-600">
          This URL is already taken. Try one of these suggestions:
        </p>
      )}

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {suggestion}.customerdeskai.com
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Race Condition Protection

**Database Constraint (Already exists from Story 1.1):**

```typescript
// packages/db/src/schema/tenants.ts
export const tenants = pgTable("tenants", {
  // ... other fields
  slug: varchar("slug", { length: 255 }).notNull().unique(), // UNIQUE constraint
});
```

**Slug Reservation (From Story 1.2):**

```typescript
// packages/db/src/schema/slug-reservations.ts
export const slugReservations = pgTable("slug_reservations", {
  id: varchar("id", { length: 41 }).primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // UNIQUE constraint
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Race Condition Scenario:**

1. **User A** checks "acme" → Available ✅
2. **User B** checks "acme" → Available ✅ (concurrent check)
3. **User A** submits form → Slug reserved (saga step 1)
4. **User B** submits form → Database unique constraint violation
5. **User B** receives error: "This URL was just taken. Please try another."
6. **User B** sees suggestions: "acme-support", "acme-cs", "acme-help"

**Error Handling:**

```typescript
// packages/api/src/routers/workspaces/index.ts
WorkspaceCreate: publicProcedure
  .handler(async ({ input }) => {
    try {
      const result = await onboardingSaga.execute(input);
      return result;
    } catch (error) {
      // Check for unique constraint violation (race condition)
      if (error.code === "23505") { // PostgreSQL unique violation
        throw new WorkspaceCreationError(
          "error.slug_race_condition",
          "ReserveSlug",
          "This URL was just taken by another user. Please try another.",
          ["Try one of the suggested alternatives", "Choose a different workspace name"],
          error
        );
      }

      throw error;
    }
  }),
```

---

### Performance Optimization

**Debouncing Strategy:**

- **300ms debounce** on slug input (prevents excessive API calls)
- **Abort previous requests** if new input arrives
- **Cache suggestions** client-side (5-minute TTL)

**Implementation:**

```typescript
// apps/web/src/app/onboarding/page.tsx
import { useDebouncedCallback } from "use-debounce";

const checkSlugAvailability = useDebouncedCallback(
  async (slug: string, { signal }: { signal: AbortSignal }) => {
    // ... API call with AbortSignal
    const result = await orpc.workspaces.WorkspaceCheckAvailability(
      { slug },
      { signal } // Abort if new input arrives
    );

    // ... handle result
  },
  300, // 300ms debounce
  {
    leading: false,  // Don't check on first keystroke
    trailing: true,  // Check after user stops typing
  }
);
```

**Suggestion Caching:**

```typescript
// apps/web/src/hooks/use-slug-suggestions.ts
import { useQuery } from "@tanstack/react-query";

export function useSlugSuggestions(baseSlug: string) {
  return useQuery({
    queryKey: ["slug-suggestions", baseSlug],
    queryFn: async () => {
      const result = await orpc.workspaces.WorkspaceGenerateSuggestions({
        slug: baseSlug,
      });
      return result.suggestions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: baseSlug.length >= 3, // Only fetch if slug is valid length
  });
}
```

---

### Validation Rules

**Slug Format Validation:**

```typescript
// packages/api/src/utils/slug-validation.ts
const SLUG_REGEX = /^[a-z0-9-]+$/;
const RESERVED_SLUGS = ["www", "app", "api", "admin", "dashboard", "auth", "docs"];

export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  // Length check
  if (slug.length < 3) {
    return { valid: false, error: "error.slug_too_short" };
  }

  if (slug.length > 63) {
    return { valid: false, error: "error.slug_too_long" };
  }

  // Character check
  if (!SLUG_REGEX.test(slug)) {
    return { valid: false, error: "error.slug_invalid_chars" };
  }

  // Reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: "error.slug_reserved" };
  }

  // Cannot start or end with hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { valid: false, error: "error.slug_invalid_format" };
  }

  // Cannot have consecutive hyphens
  if (slug.includes("--")) {
    return { valid: false, error: "error.slug_invalid_format" };
  }

  return { valid: true };
}
```

**Frontend Validation:**

```typescript
// apps/web/src/app/onboarding/page.tsx
const handleSlugChange = (value: string) => {
  // Normalize input (lowercase only)
  const normalized = value.toLowerCase();

  // Real-time format validation (immediate feedback)
  const validation = validateSlugFormat(normalized);

  if (!validation.valid) {
    setSlugError(validation.error);
    setSlugInput(normalized);
    return;
  }

  // Clear error if valid format
  setSlugError(null);
  setSlugInput(normalized);

  // Trigger debounced availability check
  checkSlugAvailability(normalized);
};
```

---

### Accessibility

**Keyboard Navigation:**

- ✅ Tab through suggestions with keyboard
- ✅ Enter key selects highlighted suggestion
- ✅ Escape key closes suggestions (returns focus to input)
- ✅ Arrow up/down to navigate suggestions

**Screen Reader Support:**

```typescript
// apps/web/src/app/onboarding/components/slug-input.tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {isChecking && <span className="sr-only">Checking availability...</span>}
  {isAvailable === true && (
    <span className="sr-only">{value} is available</span>
  )}
  {isAvailable === false && (
    <span className="sr-only">
      {value} is already taken. {suggestions.length} suggestions available.
    </span>
  )}
</div>

<ul role="listbox" aria-label="Suggested workspace URLs">
  {suggestions.map((suggestion) => (
    <li
      key={suggestion}
      role="option"
      aria-selected={suggestion === selectedSuggestion}
    >
      <button onClick={() => onSelectSuggestion(suggestion)}>
        {suggestion}.customerdeskai.com
      </button>
    </li>
  ))}
</ul>
```

---

### I18n / Error Messages

**Error Keys:**

```json
// en.json
{
  "slug.available": "Available",
  "slug.taken": "Already taken",
  "slug.checking": "Checking availability...",
  "slug.suggestions_prompt": "This URL is already taken. Try one of these suggestions:",
  "slug.select_suggestion": "Click to use this URL",
  "error.slug_too_short": "Workspace URL must be at least 3 characters",
  "error.slug_too_long": "Workspace URL cannot exceed 63 characters",
  "error.slug_invalid_chars": "Only lowercase letters, numbers, and hyphens allowed",
  "error.slug_reserved": "This URL is reserved and cannot be used",
  "error.slug_invalid_format": "URL cannot start/end with hyphen or have consecutive hyphens",
  "error.slug_race_condition": "This URL was just taken by another user. Please try another."
}
```

```json
// es.json
{
  "slug.available": "Disponible",
  "slug.taken": "Ya está en uso",
  "slug.checking": "Verificando disponibilidad...",
  "slug.suggestions_prompt": "Esta URL ya está en uso. Prueba una de estas sugerencias:",
  "slug.select_suggestion": "Haz clic para usar esta URL",
  "error.slug_too_short": "La URL del espacio de trabajo debe tener al menos 3 caracteres",
  "error.slug_too_long": "La URL del espacio de trabajo no puede exceder 63 caracteres",
  "error.slug_invalid_chars": "Solo se permiten letras minúsculas, números y guiones",
  "error.slug_reserved": "Esta URL está reservada y no se puede usar",
  "error.slug_invalid_format": "La URL no puede comenzar/terminar con guión ni tener guiones consecutivos",
  "error.slug_race_condition": "Esta URL acaba de ser tomada por otro usuario. Por favor, prueba otra."
}
```

---

## Tasks / Subtasks

### Task 1: Slug Suggestion Generation Utility (AC: 2)
- [ ] Create `slug-suggestions.ts` in `packages/api/src/utils/`
  - [ ] Implement `generateSlugSuggestions(baseSlug)` function
    - [ ] Define suggestion patterns: `-support`, `-cs`, `-help`, `-team`, `2`, `-desk`, `3`
    - [ ] Check each pattern for availability (query tenants + reservations)
    - [ ] Return minimum 3, maximum 5 available suggestions
  - [ ] Implement `checkSlugAvailable(slug)` helper
    - [ ] Query tenants table (exclude soft-deleted)
    - [ ] Query slug_reservations table (unexpired only)
    - [ ] Return true if slug available, false if taken
- [ ] Add unit tests in `packages/api/src/utils/__tests__/slug-suggestions.test.ts`
  - [ ] Test: Returns 3-5 suggestions for taken slug
  - [ ] Test: All suggestions verified as available
  - [ ] Test: Handles edge case where all patterns taken (falls back to numbered)

### Task 2: API Endpoint - WorkspaceGenerateSuggestions (AC: 2)
- [ ] Add `WorkspaceGenerateSuggestions` procedure to `workspacesRouter`
  - [ ] Input: `slug` (string, 3-63 chars, regex `/^[a-z0-9-]+$/`)
  - [ ] Output: `{ suggestions: string[] }` (3-5 suggestions)
  - [ ] Handler: Call `generateSlugSuggestions(input.slug)`
  - [ ] Return suggestions array
- [ ] Test endpoint with Hoppscotch/Postman
  - [ ] Test with common slug "acme" → Should return suggestions
  - [ ] Test with available slug → Should return empty or alternative suggestions

### Task 3: Enhanced Slug Validation Utility (AC: 1)
- [ ] Create `slug-validation.ts` in `packages/api/src/utils/`
  - [ ] Implement `validateSlug(slug)` function
    - [ ] Length check: 3-63 characters
    - [ ] Regex check: `/^[a-z0-9-]+$/` (lowercase alphanumeric + hyphens)
    - [ ] Reserved slugs: ["www", "app", "api", "admin", "dashboard", "auth", "docs"]
    - [ ] Format check: Cannot start/end with hyphen, no consecutive hyphens
    - [ ] Return `{ valid: boolean, error?: string }`
- [ ] Add validation to `WorkspaceCheckAvailability` endpoint
  - [ ] Validate format before checking database
  - [ ] Return specific error message if invalid format

### Task 4: Frontend - SlugInput Component (AC: 1, 2, 3)
- [ ] Create `slug-input.tsx` component in `apps/web/src/app/onboarding/components/`
  - [ ] Props: `value`, `onChange`, `isChecking`, `isAvailable`, `suggestions`, `onSelectSuggestion`
  - [ ] Render input field with validation icon (CheckCircle2, XCircle, Loader2)
  - [ ] Show subdomain preview: `{slug}.customerdeskai.com`
  - [ ] Show availability status: "Available" (green) or "Already taken" (red)
  - [ ] Render suggestion buttons when `suggestions.length > 0`
  - [ ] Style with Tailwind CSS (border color based on availability)
- [ ] Add keyboard navigation:
  - [ ] Tab through suggestions
  - [ ] Enter key selects highlighted suggestion
  - [ ] Escape closes suggestions
  - [ ] Arrow up/down navigates suggestions
- [ ] Add accessibility attributes:
  - [ ] `role="status"`, `aria-live="polite"` for availability status
  - [ ] `role="listbox"`, `aria-label` for suggestions list
  - [ ] `role="option"`, `aria-selected` for each suggestion
  - [ ] Screen reader announcements for state changes

### Task 5: Frontend - Debounced Availability Check (AC: 1)
- [ ] Install `use-debounce` package: `pnpm add use-debounce`
- [ ] Update onboarding page (`apps/web/src/app/onboarding/page.tsx`)
  - [ ] Add state: `slugInput`, `slugAvailable`, `slugSuggestions`, `isCheckingSlug`
  - [ ] Implement `checkSlugAvailability` with `useDebouncedCallback` (300ms)
  - [ ] Call `WorkspaceCheckAvailability` endpoint
  - [ ] If unavailable, call `WorkspaceGenerateSuggestions` endpoint
  - [ ] Update state with results
- [ ] Add `useEffect` to trigger check on `slugInput` change
- [ ] Implement abort controller for canceling previous requests

### Task 6: Frontend - Suggestion Selection Handler (AC: 3)
- [ ] Implement `onSelectSuggestion` handler in onboarding page
  - [ ] Update `slugInput` state with selected suggestion
  - [ ] Trigger immediate availability re-check
  - [ ] Focus input field after selection
  - [ ] Clear suggestions list after selection
- [ ] Test one-click selection flow:
  - [ ] Click suggestion → Input auto-filled
  - [ ] Availability re-checked automatically
  - [ ] Form can be submitted immediately

### Task 7: Race Condition Error Handling (AC: 4)
- [ ] Update `WorkspaceCreate` handler error handling
  - [ ] Catch PostgreSQL unique constraint violation (error code 23505)
  - [ ] Throw `WorkspaceCreationError` with code `error.slug_race_condition`
  - [ ] Include recovery steps: ["Try one of the suggested alternatives"]
- [ ] Frontend: Display race condition error
  - [ ] Show error message: "This URL was just taken. Please try another."
  - [ ] Auto-fetch suggestions for base slug
  - [ ] Preserve form state (don't clear other fields)

### Task 8: Frontend Slug Input Normalization (AC: 1)
- [ ] Implement real-time input normalization
  - [ ] Convert to lowercase on every keystroke
  - [ ] Strip invalid characters (keep only `a-z`, `0-9`, `-`)
  - [ ] Prevent leading/trailing hyphens
  - [ ] Prevent consecutive hyphens
- [ ] Add visual feedback for invalid input
  - [ ] Show helper text: "Only lowercase letters, numbers, and hyphens allowed"
  - [ ] Highlight input border red if invalid format

### Task 9: Suggestion Caching Hook (Performance)
- [ ] Create `use-slug-suggestions.ts` hook in `apps/web/src/hooks/`
  - [ ] Use TanStack Query `useQuery`
  - [ ] Cache key: `["slug-suggestions", baseSlug]`
  - [ ] Stale time: 5 minutes
  - [ ] Enabled only if `baseSlug.length >= 3`
- [ ] Update onboarding page to use caching hook
  - [ ] Reduce redundant API calls for same slug

### Task 10: I18n - Slug Validation Messages (AC: 1, 2, 3)
- [ ] Add i18n keys to `en.json`, `es.json`, `pt-BR.json`
  - [ ] `slug.available`, `slug.taken`, `slug.checking`
  - [ ] `slug.suggestions_prompt`, `slug.select_suggestion`
  - [ ] `error.slug_too_short`, `error.slug_too_long`
  - [ ] `error.slug_invalid_chars`, `error.slug_reserved`
  - [ ] `error.slug_invalid_format`, `error.slug_race_condition`
- [ ] Update SlugInput component to use i18n translations
  - [ ] Use `useTranslation()` hook from i18n library
  - [ ] Replace hardcoded strings with `t(key)` calls

### Task 11: Integration Tests - Slug Suggestions (AC: 2)
- [ ] Create `slug-suggestions.test.ts` in `packages/api/src/utils/__tests__/`
  - [ ] Test: Generates 3-5 suggestions for taken slug
  - [ ] Test: All suggestions verified as available (no false positives)
  - [ ] Test: Handles all patterns taken (falls back to numbered variants)
  - [ ] Test: Excludes soft-deleted tenants from availability check
  - [ ] Test: Excludes expired reservations from availability check
- [ ] Run tests: `pnpm test`

### Task 12: E2E Tests - Slug Conflict Resolution (AC: 1, 2, 3)
- [ ] Create `slug-conflict-resolution.spec.ts` in `apps/web/e2e/`
  - [ ] Test: Real-time availability check (debounced 300ms)
    - [ ] Type slug slowly → No immediate check
    - [ ] Stop typing → Check fires after 300ms
    - [ ] Show "Available" or "Already taken" status
  - [ ] Test: Smart suggestions on conflict
    - [ ] Enter taken slug → Show 3-5 suggestions
    - [ ] Verify suggestions follow naming patterns
  - [ ] Test: One-click suggestion selection
    - [ ] Click suggestion → Input auto-filled
    - [ ] Availability re-checked automatically
    - [ ] Submit form immediately (no additional validation needed)
- [ ] Run E2E tests: `pnpm run test:e2e`

### Task 13: Code Quality & Linting (AC: All)
- [ ] Run Ultracite: `npx ultracite fix`
- [ ] Run Oxlint: `pnpm run check`
- [ ] Run TypeScript check: `pnpm run check-types`
- [ ] Fix all linting errors and type errors

---

## Dev Notes

### Relationship to Previous Stories

**Story 1.1 (Single-Session Workspace Creation):**
- Implements `WorkspaceCheckAvailability` endpoint (foundation for this story)
- Creates database schema with unique constraint on `slug`

**Story 1.2 (Fail-Safe Atomic Provisioning):**
- Implements `slug_reservations` table with 5-minute expiration
- Provides race condition protection via reservation system

**Story 1.3 (Smart URL Conflict Resolution):**
- Adds intelligent suggestion generation algorithm
- Enhances UX with real-time validation and one-click selection
- Handles race conditions with clear error messages

### Critical Patterns

**Debouncing Strategy:**
- **300ms debounce** on slug input (prevents excessive API calls)
- **Abort previous requests** if new input arrives (performance optimization)
- **Leading: false, Trailing: true** (check after user stops typing)

**Suggestion Algorithm Priority:**
1. Business context suggestions (`-support`, `-cs`, `-help`)
2. Team context suggestions (`-team`, `-desk`)
3. Numeric suffixes (`2`, `3`, `4`, etc.)

**Accessibility Requirements:**
- Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader announcements for state changes (`aria-live="polite"`)
- Semantic HTML (`role="listbox"`, `role="option"`)

### Technology Stack

Same as Stories 1.1 & 1.2:
- Next.js 16.0.10, React 19.2.1
- TanStack Query 5.90.12 (caching)
- `use-debounce` library (debouncing)
- Drizzle ORM + PostgreSQL
- Tailwind CSS 4.1.10, shadcn/ui, Radix UI

### Performance Considerations

**API Call Reduction:**
- Debouncing reduces API calls by ~80% (300ms vs real-time)
- Caching prevents redundant suggestions fetch (5-minute TTL)
- Abort controller cancels in-flight requests (prevents stale responses)

**Database Query Optimization:**
- Suggestion generation: 1 query per pattern (max 7 queries)
- Early exit when 5 suggestions found (avoids unnecessary checks)
- Use database indexes on `slug` column (already exists from unique constraint)

### Security Considerations

**Input Sanitization:**
- Normalize input to lowercase (prevent case-sensitivity bypasses)
- Regex validation on backend (don't trust client-side validation)
- Reserved slugs list prevents collision with system routes

**Race Condition Handling:**
- Database unique constraint is ultimate source of truth
- Slug reservation provides soft lock (5-minute window)
- Clear error message guides user to alternatives

### References

- [Story 1.1: WorkspaceCheckAvailability Endpoint] _bmad-output/sprint/1-1-single-session-workspace-creation.md
- [Story 1.2: Slug Reservations Table] _bmad-output/sprint/1-2-fail-safe-atomic-provisioning.md
- [Project Context: TypeScript Standards] _bmad-output/project-context.md
- [Epic 1 Context] _bmad-output/epics.md:606-616

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
**Story:** 1.3 - Smart URL Conflict Resolution

**Next Steps:**
1. Review this comprehensive story context
2. Optional: Run `validate-create-story` for quality check
3. Run `dev-story` workflow to begin implementation
4. Run `code-review` when complete
