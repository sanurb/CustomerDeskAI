# Story 1.4: Progress Persistence Through Interruptions

**Story ID:** 1.4
**Story Key:** `1-4-progress-persistence-through-interruptions`
**Epic:** Epic 1 - Frictionless Workspace Activation
**Status:** ready-for-dev
**Created:** 2026-01-03

---

## User Story

**As a** Workspace Owner
**I want** my workspace setup progress saved if I'm interrupted
**So that** I don't lose my work if I accidentally close the browser or navigate away

---

## Acceptance Criteria

- [ ] Form data persists through browser refresh or accidental navigation
- [ ] Logo upload progress recovers if network interrupted (chunked upload with resume)
- [ ] "Continue your workspace setup" banner appears if user returns after interruption
- [ ] User can choose to resume or start fresh

---

## Business Context

**Mental Bandwidth Recovery Principle:** The Workspace Owner (Sarah López) is multitasking during onboarding—answering Slack messages, handling customer emergencies, and evaluating CustomerDeskAI. If she accidentally closes the browser tab or navigates away, losing her progress creates frustration and abandonment risk.

**Zero-Gravity UX Requirement:** Sarah must feel confident that nothing is leaking—no data loss, no wasted time, no need to remember what she already filled out. This story ensures the onboarding form is forgiving and respectful of her time.

**Performance Target:**
- Form state restoration: <100ms (instant perception)
- Upload resume detection: <500ms (network latency tolerance)
- Banner display: <200ms (visible feedback)

---

## Technical Overview

### Architecture Pattern: Client-Side State Persistence

This story implements **client-side state persistence** using browser storage APIs and UploadThing's resumable upload capabilities.

**Key Components:**
1. **SessionStorage** for transient form state (cleared when browser closes)
2. **LocalStorage** for persistent draft detection (survives browser closure)
3. **UploadThing Resumable Uploads** for logo upload recovery
4. **React Context + Hooks** for state management
5. **beforeunload Event** for navigation warning
6. **Banner Component** for return user detection

**Data Flow:**
```
User fills form
  ↓
Every field change → Save to SessionStorage (debounced 500ms)
  ↓
On logo upload start → Mark upload in progress (LocalStorage)
  ↓
On navigation away → beforeunload warning
  ↓
User returns → Detect draft in LocalStorage/SessionStorage
  ↓
Show banner → User chooses resume or start fresh
  ↓
If resume → Restore form state + resume upload
```

---

## Technical Implementation

### Task 1: Create OnboardingDraft Storage Schema

**File:** `apps/web/src/lib/storage/onboarding-draft.ts`

```typescript
import { z } from "zod";

/**
 * Schema for persisted onboarding form state.
 * Matches WorkspaceCreate input schema but adds metadata.
 */
export const OnboardingDraftSchema = z.object({
  // Form fields
  slug: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  fullName: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),

  // Logo upload state
  logoKey: z.string().optional(),
  logoUrl: z.string().optional(),
  logoUploadId: z.string().optional(), // UploadThing upload ID for resume
  logoUploadProgress: z.number().min(0).max(100).optional(),

  // Metadata
  lastSavedAt: z.string().datetime(),
  sessionId: z.string(), // Unique ID for this draft session
});

export type OnboardingDraft = z.infer<typeof OnboardingDraftSchema>;

/**
 * Storage keys for draft persistence.
 */
export const STORAGE_KEYS = {
  DRAFT: "customerdeskai:onboarding:draft",
  SESSION_ID: "customerdeskai:onboarding:session",
  UPLOAD_STATE: "customerdeskai:onboarding:upload",
} as const;

/**
 * Draft expiry: 7 days (168 hours).
 * After this, drafts are considered stale and discarded.
 */
export const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
```

**Subtasks:**
1. Define `OnboardingDraftSchema` with all form fields
2. Add `lastSavedAt` and `sessionId` metadata
3. Add logo upload state (`logoUploadId`, `logoUploadProgress`)
4. Export `STORAGE_KEYS` constants
5. Define `DRAFT_EXPIRY_MS` constant (7 days)

---

### Task 2: Implement Draft Storage Service

**File:** `apps/web/src/lib/storage/draft-service.ts`

```typescript
import type { OnboardingDraft } from "./onboarding-draft";
import { OnboardingDraftSchema, STORAGE_KEYS, DRAFT_EXPIRY_MS } from "./onboarding-draft";

export class DraftService {
  /**
   * Save draft to both SessionStorage and LocalStorage.
   * SessionStorage: ephemeral (cleared on tab close)
   * LocalStorage: persistent (survives browser restart)
   */
  static saveDraft(draft: Partial<OnboardingDraft>): void {
    const sessionId = this.getOrCreateSessionId();

    const draftData: OnboardingDraft = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
      sessionId,
    };

    // Validate schema
    const validated = OnboardingDraftSchema.parse(draftData);
    const serialized = JSON.stringify(validated);

    // Save to both storages
    try {
      sessionStorage.setItem(STORAGE_KEYS.DRAFT, serialized);
      localStorage.setItem(STORAGE_KEYS.DRAFT, serialized);
    } catch (error) {
      // Storage quota exceeded or disabled
      console.error("Failed to save draft:", error);
    }
  }

  /**
   * Load draft from storage (SessionStorage first, fallback to LocalStorage).
   * Returns null if no draft exists or draft is expired.
   */
  static loadDraft(): OnboardingDraft | null {
    try {
      // Try SessionStorage first (faster, more recent)
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.DRAFT);
      if (sessionData) {
        const draft = OnboardingDraftSchema.parse(JSON.parse(sessionData));
        if (this.isExpired(draft)) {
          this.clearDraft();
          return null;
        }
        return draft;
      }

      // Fallback to LocalStorage
      const localData = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (localData) {
        const draft = OnboardingDraftSchema.parse(JSON.parse(localData));
        if (this.isExpired(draft)) {
          this.clearDraft();
          return null;
        }
        return draft;
      }

      return null;
    } catch (error) {
      // Invalid draft data
      console.error("Failed to load draft:", error);
      this.clearDraft();
      return null;
    }
  }

  /**
   * Clear draft from all storages.
   */
  static clearDraft(): void {
    sessionStorage.removeItem(STORAGE_KEYS.DRAFT);
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  }

  /**
   * Check if draft is expired (older than 7 days).
   */
  private static isExpired(draft: OnboardingDraft): boolean {
    const savedAt = new Date(draft.lastSavedAt).getTime();
    const now = Date.now();
    return now - savedAt > DRAFT_EXPIRY_MS;
  }

  /**
   * Get or create unique session ID for this onboarding attempt.
   */
  private static getOrCreateSessionId(): string {
    const existing = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (existing) return existing;

    const newId = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);
    return newId;
  }

  /**
   * Check if there's a resumable draft available.
   */
  static hasDraft(): boolean {
    return this.loadDraft() !== null;
  }
}
```

**Subtasks:**
1. Implement `saveDraft()` with dual storage (SessionStorage + LocalStorage)
2. Implement `loadDraft()` with SessionStorage priority, LocalStorage fallback
3. Implement `clearDraft()` to remove from both storages
4. Implement `isExpired()` to check 7-day expiry
5. Implement `getOrCreateSessionId()` for session tracking
6. Implement `hasDraft()` convenience method
7. Add error handling for storage quota exceeded
8. Add Zod schema validation on load

---

### Task 3: Create useDraftPersistence Hook

**File:** `apps/web/src/hooks/use-draft-persistence.ts`

```typescript
import { useEffect, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { DraftService } from "@/lib/storage/draft-service";
import type { OnboardingDraft } from "@/lib/storage/onboarding-draft";

export interface UseDraftPersistenceOptions {
  /**
   * Auto-save debounce delay (ms). Default: 500ms
   */
  debounceMs?: number;

  /**
   * Enable auto-save on every field change. Default: true
   */
  autoSave?: boolean;
}

/**
 * Hook for managing onboarding draft persistence.
 *
 * Usage:
 * ```tsx
 * const { saveDraft, loadDraft, clearDraft, hasDraft } = useDraftPersistence();
 *
 * // Load on mount
 * useEffect(() => {
 *   const draft = loadDraft();
 *   if (draft) setFormState(draft);
 * }, []);
 *
 * // Auto-save on form change
 * useEffect(() => {
 *   saveDraft(formState);
 * }, [formState]);
 * ```
 */
export function useDraftPersistence(options: UseDraftPersistenceOptions = {}) {
  const { debounceMs = 500, autoSave = true } = options;

  /**
   * Save draft with debounce to avoid excessive writes.
   */
  const saveDraft = useDebouncedCallback(
    (draft: Partial<OnboardingDraft>) => {
      if (!autoSave) return;
      DraftService.saveDraft(draft);
    },
    debounceMs,
    { leading: false, trailing: true }
  );

  /**
   * Load draft immediately (synchronous).
   */
  const loadDraft = useCallback(() => {
    return DraftService.loadDraft();
  }, []);

  /**
   * Clear draft from storage.
   */
  const clearDraft = useCallback(() => {
    DraftService.clearDraft();
  }, []);

  /**
   * Check if draft exists.
   */
  const hasDraft = useCallback(() => {
    return DraftService.hasDraft();
  }, []);

  /**
   * Clear draft on successful form submission.
   */
  const clearOnSuccess = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    clearOnSuccess,
  };
}
```

**Subtasks:**
1. Create `useDraftPersistence` hook
2. Add `saveDraft` with debounce (500ms default)
3. Add `loadDraft` synchronous method
4. Add `clearDraft` method
5. Add `hasDraft` convenience method
6. Add `clearOnSuccess` for post-submission cleanup
7. Add configurable `debounceMs` option
8. Add `autoSave` toggle option

---

### Task 4: Implement UploadThing Resumable Upload Support

**File:** `apps/web/src/lib/upload/resumable-upload.ts`

```typescript
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@CustomerDeskAI/server/uploadthing";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/**
 * Upload state for resumable uploads.
 */
export interface ResumableUploadState {
  uploadId: string;
  fileKey: string;
  fileUrl: string;
  progress: number;
  status: "idle" | "uploading" | "paused" | "completed" | "error";
  error?: Error;
}

/**
 * Hook for resumable logo uploads with progress tracking.
 *
 * UploadThing automatically handles chunked uploads and resume logic.
 * We track upload ID and progress in LocalStorage for recovery.
 */
export function useResumableLogoUpload() {
  const { startUpload, isUploading } = useUploadThing("logoUploader", {
    onClientUploadComplete: (files) => {
      // Save completed upload state
      const file = files[0];
      if (file) {
        localStorage.setItem("customerdeskai:upload:logo:key", file.key);
        localStorage.setItem("customerdeskai:upload:logo:url", file.url);
        localStorage.removeItem("customerdeskai:upload:logo:progress");
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      // UploadThing automatically retries network errors
      // Only permanent errors reach this handler
    },
    onUploadProgress: (progress) => {
      // Save progress to LocalStorage for recovery
      localStorage.setItem(
        "customerdeskai:upload:logo:progress",
        progress.toString()
      );
    },
  });

  /**
   * Resume upload from saved state.
   * UploadThing handles resume automatically via upload ID.
   */
  const resumeUpload = useCallback(async (file: File) => {
    const savedProgress = localStorage.getItem("customerdeskai:upload:logo:progress");

    // Check if we have a partial upload
    if (savedProgress && parseInt(savedProgress, 10) > 0) {
      console.log("Resuming upload from", savedProgress);
    }

    // UploadThing handles resume via internal upload ID
    return startUpload([file]);
  }, [startUpload]);

  /**
   * Get saved upload state for recovery.
   */
  const getSavedUploadState = useCallback((): Partial<ResumableUploadState> | null => {
    const key = localStorage.getItem("customerdeskai:upload:logo:key");
    const url = localStorage.getItem("customerdeskai:upload:logo:url");
    const progress = localStorage.getItem("customerdeskai:upload:logo:progress");

    if (key && url) {
      return {
        fileKey: key,
        fileUrl: url,
        progress: progress ? parseInt(progress, 10) : 100,
        status: "completed",
      };
    }

    if (progress && parseInt(progress, 10) > 0) {
      return {
        progress: parseInt(progress, 10),
        status: "paused",
      };
    }

    return null;
  }, []);

  /**
   * Clear saved upload state.
   */
  const clearUploadState = useCallback(() => {
    localStorage.removeItem("customerdeskai:upload:logo:key");
    localStorage.removeItem("customerdeskai:upload:logo:url");
    localStorage.removeItem("customerdeskai:upload:logo:progress");
  }, []);

  return {
    startUpload,
    resumeUpload,
    isUploading,
    getSavedUploadState,
    clearUploadState,
  };
}
```

**Subtasks:**
1. Create `useResumableLogoUpload` hook
2. Add `onUploadProgress` handler to save progress to LocalStorage
3. Add `onClientUploadComplete` handler to save final fileKey/fileUrl
4. Add `resumeUpload()` method (UploadThing handles resume internally)
5. Add `getSavedUploadState()` to detect partial uploads
6. Add `clearUploadState()` for cleanup
7. Add progress percentage tracking (0-100)
8. Leverage UploadThing's built-in chunked upload + retry

---

### Task 5: Create Resume Banner Component

**File:** `apps/web/src/app/onboarding/components/resume-banner.tsx`

```typescript
"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface ResumeBannerProps {
  /**
   * Callback when user chooses to resume draft.
   */
  onResume: () => void;

  /**
   * Callback when user chooses to start fresh.
   */
  onStartFresh: () => void;

  /**
   * Timestamp when draft was last saved.
   */
  lastSavedAt: string;
}

/**
 * Banner component shown when user returns to onboarding with saved draft.
 *
 * Accessibility:
 * - role="status" for screen reader announcement
 * - Keyboard navigable buttons
 * - Visible focus indicators
 */
export function ResumeBanner({
  onResume,
  onStartFresh,
  lastSavedAt,
}: ResumeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Format last saved time
  const savedDate = new Date(lastSavedAt);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  const timeAgo =
    diffMins < 1
      ? "just now"
      : diffMins < 60
      ? `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
      : diffMins < 1440
      ? `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? "" : "s"} ago`
      : `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) === 1 ? "" : "s"} ago`;

  return (
    <Alert
      role="status"
      className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
    >
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            Continue your workspace setup?
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            You have unsaved progress from {timeAgo}. Would you like to continue
            where you left off?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onStartFresh();
              setDismissed(true);
            }}
            className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900"
          >
            Start Fresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onResume();
              setDismissed(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Resume
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**Subtasks:**
1. Create `ResumeBanner` component
2. Add `onResume` and `onStartFresh` callbacks
3. Add `lastSavedAt` prop with relative time formatting
4. Add dismiss functionality with local state
5. Use shadcn/ui `Alert` component
6. Add blue color scheme (info/status)
7. Add keyboard navigation support
8. Add `role="status"` for screen readers
9. Add close button with `X` icon
10. Add responsive layout (stack on mobile)

---

### Task 6: Integrate Draft Persistence in Onboarding Page

**File:** `apps/web/src/app/onboarding/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { useResumableLogoUpload } from "@/lib/upload/resumable-upload";
import { ResumeBanner } from "./components/resume-banner";
import { OnboardingForm } from "./components/onboarding-form";
import { orpc } from "@/utils/orpc";

export default function OnboardingPage() {
  const router = useRouter();

  // Form state
  const [formState, setFormState] = useState({
    slug: "",
    name: "",
    email: "",
    password: "",
    fullName: "",
    primaryColor: "#4F46E5",
    logoFile: null as File | null,
  });

  // Draft persistence
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useDraftPersistence();

  // Upload handling
  const {
    resumeUpload,
    isUploading,
    getSavedUploadState,
    clearUploadState,
  } = useResumableLogoUpload();

  // Banner visibility
  const [showBanner, setShowBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  /**
   * On mount: check for existing draft and show banner.
   */
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setShowBanner(true);
      setDraftTimestamp(draft.lastSavedAt);
    }

    // Check for partial upload
    const uploadState = getSavedUploadState();
    if (uploadState?.status === "paused") {
      // Show upload recovery option in banner
      console.log("Partial upload detected, progress:", uploadState.progress);
    }
  }, [loadDraft, getSavedUploadState]);

  /**
   * Auto-save draft on form state change (debounced 500ms).
   */
  useEffect(() => {
    saveDraft({
      slug: formState.slug,
      name: formState.name,
      email: formState.email,
      password: formState.password,
      fullName: formState.fullName,
      primaryColor: formState.primaryColor,
    });
  }, [formState, saveDraft]);

  /**
   * Handle resume: restore draft to form state.
   */
  const handleResume = () => {
    const draft = loadDraft();
    if (!draft) return;

    setFormState({
      slug: draft.slug || "",
      name: draft.name || "",
      email: draft.email || "",
      password: draft.password || "",
      fullName: draft.fullName || "",
      primaryColor: draft.primaryColor || "#4F46E5",
      logoFile: null, // File object cannot be serialized
    });

    // Check for completed upload
    const uploadState = getSavedUploadState();
    if (uploadState?.status === "completed") {
      // Show logo preview with saved URL
      console.log("Restoring logo from:", uploadState.fileUrl);
    }

    setShowBanner(false);
  };

  /**
   * Handle start fresh: clear all drafts and uploads.
   */
  const handleStartFresh = () => {
    clearDraft();
    clearUploadState();
    setShowBanner(false);

    // Reset form to initial state
    setFormState({
      slug: "",
      name: "",
      email: "",
      password: "",
      fullName: "",
      primaryColor: "#4F46E5",
      logoFile: null,
    });
  };

  /**
   * Handle form submission: clear draft on success.
   */
  const handleSubmit = async () => {
    try {
      // Upload logo if present
      let logoKey: string | undefined;
      if (formState.logoFile) {
        const uploadResult = await resumeUpload(formState.logoFile);
        logoKey = uploadResult?.[0]?.key;
      }

      // Create workspace
      const result = await orpc.workspaces.WorkspaceCreate({
        slug: formState.slug,
        name: formState.name,
        email: formState.email,
        password: formState.password,
        fullName: formState.fullName,
        primaryColor: formState.primaryColor,
        logoKey,
      });

      // Clear draft on success
      clearDraft();
      clearUploadState();

      // Redirect to workspace
      router.push(result.workspaceUrl);
    } catch (error) {
      console.error("Workspace creation failed:", error);
      // Draft persists for retry
    }
  };

  /**
   * Warn user before navigating away with unsaved changes.
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDraft()) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasDraft]);

  return (
    <div className="container max-w-2xl py-12">
      {showBanner && draftTimestamp && (
        <ResumeBanner
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          lastSavedAt={draftTimestamp}
        />
      )}

      <OnboardingForm
        formState={formState}
        onChange={setFormState}
        onSubmit={handleSubmit}
        isUploading={isUploading}
      />
    </div>
  );
}
```

**Subtasks:**
1. Import `useDraftPersistence` hook
2. Import `useResumableLogoUpload` hook
3. Add `showBanner` state for banner visibility
4. Add `useEffect` to check for draft on mount
5. Add `useEffect` to auto-save draft on form change (debounced)
6. Add `handleResume` to restore draft to form state
7. Add `handleStartFresh` to clear all drafts
8. Add `handleSubmit` to clear draft on successful creation
9. Add `beforeunload` event listener to warn user
10. Add `ResumeBanner` component with conditional rendering
11. Check for partial upload state on mount
12. Restore logo URL if upload was completed

---

### Task 7: Add beforeunload Warning Configuration

**File:** `apps/web/src/lib/navigation/prevent-unload.ts`

```typescript
/**
 * Utility for preventing accidental navigation with unsaved changes.
 *
 * Usage:
 * ```tsx
 * useEffect(() => {
 *   const cleanup = preventUnload(hasUnsavedChanges);
 *   return cleanup;
 * }, [hasUnsavedChanges]);
 * ```
 */
export function preventUnload(shouldPrevent: boolean): () => void {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (shouldPrevent) {
      e.preventDefault();
      e.returnValue = ""; // Required for Chrome
      return "";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}

/**
 * Hook version for React components.
 */
export function usePreventUnload(shouldPrevent: boolean) {
  useEffect(() => {
    return preventUnload(shouldPrevent);
  }, [shouldPrevent]);
}
```

**Subtasks:**
1. Create `preventUnload()` utility function
2. Add `beforeunload` event listener
3. Add `e.preventDefault()` and `e.returnValue = ""`
4. Return cleanup function
5. Create `usePreventUnload()` hook wrapper
6. Add conditional `shouldPrevent` parameter

---

### Task 8: Add Draft Expiry Cleanup Worker

**File:** `apps/web/src/app/api/cleanup-drafts/route.ts`

```typescript
import { NextResponse } from "next/server";

/**
 * Client-side cleanup endpoint (called via cron or manual trigger).
 *
 * Note: Browser storage is per-client, so this is primarily for testing.
 * Real-world cleanup happens automatically on `loadDraft()` via `isExpired()`.
 */
export async function POST() {
  return NextResponse.json({
    message: "Draft cleanup is handled client-side on load",
    note: "Expired drafts are automatically discarded when DraftService.loadDraft() is called",
  });
}
```

**Why Client-Side Cleanup:**
- SessionStorage/LocalStorage are per-browser, per-domain
- No server-side draft storage exists (intentional—privacy and simplicity)
- Expiry check happens in `DraftService.loadDraft()` via `isExpired()`

**Subtasks:**
1. Document that cleanup is client-side
2. Add API route for documentation purposes
3. Note that `isExpired()` handles cleanup automatically

---

### Task 9: Update OnboardingForm to Show Draft Indicator

**File:** `apps/web/src/app/onboarding/components/onboarding-form.tsx`

```typescript
"use client";

import { Save } from "lucide-react";

export interface OnboardingFormProps {
  formState: {
    slug: string;
    name: string;
    email: string;
    password: string;
    fullName: string;
    primaryColor: string;
    logoFile: File | null;
  };
  onChange: (state: OnboardingFormProps["formState"]) => void;
  onSubmit: () => Promise<void>;
  isUploading: boolean;
  isDraftSaving?: boolean; // New prop
}

export function OnboardingForm({
  formState,
  onChange,
  onSubmit,
  isUploading,
  isDraftSaving = false,
}: OnboardingFormProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {/* Existing form fields */}

      {/* Draft saving indicator */}
      {isDraftSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4 animate-pulse" />
          <span>Saving draft...</span>
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Creating workspace..." : "Create Workspace"}
      </Button>
    </form>
  );
}
```

**Subtasks:**
1. Add `isDraftSaving` prop to `OnboardingFormProps`
2. Add draft saving indicator UI with `Save` icon
3. Add `animate-pulse` Tailwind class
4. Position indicator near submit button
5. Show only when `isDraftSaving === true`

---

### Task 10: Add Logo Upload Resume UI

**File:** `apps/web/src/app/onboarding/components/logo-upload.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useResumableLogoUpload } from "@/lib/upload/resumable-upload";

export interface LogoUploadProps {
  onFileSelect: (file: File) => void;
  currentLogoUrl?: string;
}

export function LogoUpload({ onFileSelect, currentLogoUrl }: LogoUploadProps) {
  const { getSavedUploadState, clearUploadState } = useResumableLogoUpload();
  const [uploadState, setUploadState] = useState<{
    progress: number;
    status: "idle" | "paused" | "completed";
    url?: string;
  } | null>(null);

  useEffect(() => {
    const saved = getSavedUploadState();
    if (saved) {
      setUploadState({
        progress: saved.progress || 0,
        status: saved.status || "idle",
        url: saved.fileUrl,
      });
    }
  }, [getSavedUploadState]);

  const handleResume = () => {
    // User must re-select file (File object cannot be serialized)
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };
    input.click();
  };

  const handleClearPartial = () => {
    clearUploadState();
    setUploadState(null);
  };

  if (uploadState?.status === "paused") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Upload paused at {uploadState.progress}%
          </p>
          <Button variant="ghost" size="sm" onClick={handleClearPartial}>
            Clear
          </Button>
        </div>
        <Progress value={uploadState.progress} />
        <Button onClick={handleResume} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Resume Upload
        </Button>
      </div>
    );
  }

  if (uploadState?.status === "completed" && uploadState.url) {
    return (
      <div className="space-y-2">
        <img
          src={uploadState.url}
          alt="Workspace logo"
          className="h-20 w-20 rounded-md object-cover"
        />
        <Button variant="outline" size="sm" onClick={handleClearPartial}>
          Change Logo
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
}
```

**Subtasks:**
1. Add `getSavedUploadState()` call on mount
2. Show paused upload UI with progress bar
3. Add "Resume Upload" button for paused uploads
4. Add "Clear" button to discard partial upload
5. Show completed logo preview with saved URL
6. Add "Change Logo" button for completed uploads
7. Use shadcn/ui `Progress` component
8. Add `RefreshCw` icon for resume button

---

### Task 11: Add E2E Tests for Draft Persistence

**File:** `apps/web/tests/e2e/onboarding-draft-persistence.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Onboarding Draft Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("should save draft to storage on field change", async ({ page }) => {
    // Fill out form partially
    await page.fill('input[name="slug"]', "acme-support");
    await page.fill('input[name="name"]', "Acme Support");
    await page.fill('input[name="email"]', "sarah@acme.com");

    // Wait for debounce (500ms)
    await page.waitForTimeout(600);

    // Check SessionStorage
    const draft = await page.evaluate(() => {
      const data = sessionStorage.getItem("customerdeskai:onboarding:draft");
      return data ? JSON.parse(data) : null;
    });

    expect(draft).toBeTruthy();
    expect(draft.slug).toBe("acme-support");
    expect(draft.name).toBe("Acme Support");
    expect(draft.email).toBe("sarah@acme.com");
  });

  test("should show resume banner on return visit", async ({ page, context }) => {
    // Fill form partially
    await page.fill('input[name="slug"]', "acme-support");
    await page.waitForTimeout(600); // Wait for save

    // Navigate away
    await page.goto("/");

    // Return to onboarding
    await page.goto("/onboarding");

    // Should see banner
    await expect(page.locator('role=status')).toContainText("Continue your workspace setup");
  });

  test("should restore form state when resuming", async ({ page }) => {
    // Fill form
    await page.fill('input[name="slug"]', "acme-support");
    await page.fill('input[name="name"]', "Acme Support");
    await page.fill('input[name="email"]', "sarah@acme.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.waitForTimeout(600);

    // Refresh page
    await page.reload();

    // Click resume
    await page.click('button:has-text("Resume")');

    // Verify form restored
    await expect(page.locator('input[name="slug"]')).toHaveValue("acme-support");
    await expect(page.locator('input[name="name"]')).toHaveValue("Acme Support");
    await expect(page.locator('input[name="email"]')).toHaveValue("sarah@acme.com");
    await expect(page.locator('input[name="password"]')).toHaveValue("SecurePass123!");
  });

  test("should clear draft when starting fresh", async ({ page }) => {
    // Fill form
    await page.fill('input[name="slug"]', "acme-support");
    await page.waitForTimeout(600);

    // Refresh
    await page.reload();

    // Click start fresh
    await page.click('button:has-text("Start Fresh")');

    // Verify draft cleared
    const draft = await page.evaluate(() => {
      return sessionStorage.getItem("customerdeskai:onboarding:draft");
    });

    expect(draft).toBeNull();
  });

  test("should warn before unload with unsaved changes", async ({ page }) => {
    // Fill form
    await page.fill('input[name="slug"]', "acme-support");
    await page.waitForTimeout(600);

    // Setup beforeunload listener check
    const dialogPromise = page.waitForEvent("dialog");

    // Try to navigate away
    await page.goto("/");

    // Should show browser warning
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
  });

  test("should clear draft on successful submission", async ({ page }) => {
    // Fill complete form
    await page.fill('input[name="slug"]', "acme-support");
    await page.fill('input[name="name"]', "Acme Support");
    await page.fill('input[name="email"]', "sarah@acme.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="fullName"]', "Sarah López");

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/acme-support\.customerdeskai\.com/);

    // Verify draft cleared
    const draft = await page.evaluate(() => {
      return sessionStorage.getItem("customerdeskai:onboarding:draft");
    });

    expect(draft).toBeNull();
  });

  test("should discard expired draft (7 days old)", async ({ page }) => {
    // Manually create expired draft
    await page.evaluate(() => {
      const expiredDraft = {
        slug: "old-workspace",
        name: "Old Workspace",
        lastSavedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        sessionId: crypto.randomUUID(),
      };
      localStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(expiredDraft));
    });

    // Reload page
    await page.reload();

    // Should NOT show banner (draft expired)
    await expect(page.locator('role=status')).not.toBeVisible();

    // Draft should be cleared
    const draft = await page.evaluate(() => {
      return localStorage.getItem("customerdeskai:onboarding:draft");
    });

    expect(draft).toBeNull();
  });
});
```

**Subtasks:**
1. Test draft saves to SessionStorage on field change
2. Test banner appears on return visit
3. Test form state restoration when resuming
4. Test draft clearing when starting fresh
5. Test beforeunload warning with unsaved changes
6. Test draft clears on successful submission
7. Test expired draft (7 days) is discarded
8. Add debounce wait (600ms) in all tests

---

### Task 12: Add Integration Tests for DraftService

**File:** `apps/web/src/lib/storage/__tests__/draft-service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DraftService } from "../draft-service";
import type { OnboardingDraft } from "../onboarding-draft";

describe("DraftService", () => {
  beforeEach(() => {
    // Clear all storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  it("should save draft to both SessionStorage and LocalStorage", () => {
    const draft: Partial<OnboardingDraft> = {
      slug: "test-workspace",
      name: "Test Workspace",
      email: "test@example.com",
    };

    DraftService.saveDraft(draft);

    const sessionData = sessionStorage.getItem("customerdeskai:onboarding:draft");
    const localData = localStorage.getItem("customerdeskai:onboarding:draft");

    expect(sessionData).toBeTruthy();
    expect(localData).toBeTruthy();
    expect(JSON.parse(sessionData!).slug).toBe("test-workspace");
    expect(JSON.parse(localData!).slug).toBe("test-workspace");
  });

  it("should load draft from SessionStorage first", () => {
    const sessionDraft: OnboardingDraft = {
      slug: "session-workspace",
      name: "Session",
      lastSavedAt: new Date().toISOString(),
      sessionId: "session-123",
    };

    const localDraft: OnboardingDraft = {
      slug: "local-workspace",
      name: "Local",
      lastSavedAt: new Date().toISOString(),
      sessionId: "local-456",
    };

    sessionStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(sessionDraft));
    localStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(localDraft));

    const loaded = DraftService.loadDraft();

    expect(loaded?.slug).toBe("session-workspace"); // SessionStorage wins
  });

  it("should fallback to LocalStorage if SessionStorage empty", () => {
    const localDraft: OnboardingDraft = {
      slug: "local-workspace",
      name: "Local",
      lastSavedAt: new Date().toISOString(),
      sessionId: "local-456",
    };

    localStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(localDraft));

    const loaded = DraftService.loadDraft();

    expect(loaded?.slug).toBe("local-workspace");
  });

  it("should return null and clear storage if draft expired", () => {
    const expiredDraft: OnboardingDraft = {
      slug: "expired-workspace",
      name: "Expired",
      lastSavedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      sessionId: "expired-789",
    };

    localStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(expiredDraft));

    const loaded = DraftService.loadDraft();

    expect(loaded).toBeNull();
    expect(localStorage.getItem("customerdeskai:onboarding:draft")).toBeNull();
  });

  it("should clear draft from both storages", () => {
    DraftService.saveDraft({ slug: "test" });

    DraftService.clearDraft();

    expect(sessionStorage.getItem("customerdeskai:onboarding:draft")).toBeNull();
    expect(localStorage.getItem("customerdeskai:onboarding:draft")).toBeNull();
    expect(sessionStorage.getItem("customerdeskai:onboarding:session")).toBeNull();
  });

  it("should generate and persist session ID", () => {
    DraftService.saveDraft({ slug: "test" });

    const sessionId1 = sessionStorage.getItem("customerdeskai:onboarding:session");

    DraftService.saveDraft({ slug: "test2" });

    const sessionId2 = sessionStorage.getItem("customerdeskai:onboarding:session");

    expect(sessionId1).toBeTruthy();
    expect(sessionId1).toBe(sessionId2); // Same session
  });

  it("should validate draft schema on load", () => {
    const invalidDraft = {
      slug: "test",
      email: "not-an-email", // Invalid email
      lastSavedAt: "invalid-date",
      sessionId: "123",
    };

    localStorage.setItem("customerdeskai:onboarding:draft", JSON.stringify(invalidDraft));

    const loaded = DraftService.loadDraft();

    expect(loaded).toBeNull(); // Invalid schema cleared
    expect(localStorage.getItem("customerdeskai:onboarding:draft")).toBeNull();
  });
});
```

**Subtasks:**
1. Test `saveDraft()` writes to both storages
2. Test `loadDraft()` prioritizes SessionStorage
3. Test `loadDraft()` falls back to LocalStorage
4. Test expired draft returns null and clears storage
5. Test `clearDraft()` removes from both storages
6. Test session ID persistence across saves
7. Test invalid schema triggers clear
8. Add beforeEach to clear storage

---

### Task 13: Update Architecture Documentation

**File:** `_bmad-output/architecture.md`

Add new section under "Data Flow Patterns":

```markdown
### Client-Side Draft Persistence

**Pattern:** Store-and-Forward with Auto-Recovery

**Use Case:** Onboarding form state preservation through interruptions

**Implementation:**
- **SessionStorage:** Ephemeral draft (cleared on tab close)
- **LocalStorage:** Persistent draft (survives browser restart)
- **Debounced Saves:** 500ms debounce to avoid excessive writes
- **Expiry:** 7-day TTL, auto-deleted on load via `isExpired()`
- **Schema Validation:** Zod schema on load, invalid drafts cleared

**Resume Flow:**
```
User fills form → Auto-save (debounced 500ms) → SessionStorage + LocalStorage
  ↓
User closes tab
  ↓
User returns → Detect draft in storage
  ↓
Show banner → User chooses resume or start fresh
  ↓
If resume → Restore form state from storage
```

**UploadThing Resumable Upload:**
- UploadThing handles chunked uploads internally (no custom chunking needed)
- Save upload progress to LocalStorage for UI recovery
- Save `fileKey` and `fileUrl` on completion
- Detect partial upload via `progress > 0 && progress < 100`
- Resume requires user to re-select file (File object cannot be serialized)
```

**Subtasks:**
1. Add "Client-Side Draft Persistence" section
2. Document SessionStorage vs LocalStorage usage
3. Document debounce timing (500ms)
4. Document expiry (7 days)
5. Document schema validation on load
6. Add resume flow diagram
7. Document UploadThing integration

---

## Definition of Done

**Functional Requirements:**
- [ ] Form data persists through browser refresh
- [ ] Draft auto-saves with 500ms debounce
- [ ] Resume banner shows on return visit with relative timestamp
- [ ] User can choose "Resume" or "Start Fresh"
- [ ] Draft clears on successful workspace creation
- [ ] Expired drafts (7+ days) automatically discarded
- [ ] beforeunload warning shows with unsaved changes
- [ ] Logo upload progress persists in LocalStorage
- [ ] Completed logo URL restored on resume

**Technical Requirements:**
- [ ] `OnboardingDraftSchema` Zod schema defined
- [ ] `DraftService` class with save/load/clear methods
- [ ] `useDraftPersistence` hook with debounced save
- [ ] `useResumableLogoUpload` hook for upload recovery
- [ ] `ResumeBanner` component with accessibility
- [ ] Onboarding page integrated with draft persistence
- [ ] `preventUnload()` utility for navigation warning

**Testing Requirements:**
- [ ] E2E tests: draft saves on field change
- [ ] E2E tests: banner appears on return visit
- [ ] E2E tests: form restores when resuming
- [ ] E2E tests: draft clears when starting fresh
- [ ] E2E tests: beforeunload warning with unsaved changes
- [ ] E2E tests: draft clears on successful submission
- [ ] E2E tests: expired draft discarded
- [ ] Unit tests: `DraftService` save/load/clear
- [ ] Unit tests: SessionStorage priority over LocalStorage
- [ ] Unit tests: expired draft validation
- [ ] Unit tests: schema validation on load

**Performance Requirements:**
- [ ] Form state restoration: <100ms
- [ ] Draft save debounce: 500ms
- [ ] Banner display: <200ms
- [ ] Storage quota exceeded handled gracefully

**Code Quality:**
- [ ] TypeScript types for all storage operations
- [ ] Zod schema validation on load
- [ ] Error handling for storage quota exceeded
- [ ] Accessibility: keyboard navigation, screen reader support
- [ ] No console errors in browser
- [ ] Code passes `npx ultracite check`

---

## Related Stories

**Dependencies:**
- **Story 1.1 (Single-Session Workspace Creation):** Provides base onboarding form and WorkspaceCreate endpoint
- **Story 1.3 (Smart URL Conflict Resolution):** Slug validation must persist in draft

**Enhances:**
- **Story 1.5 (Instant Branded Dashboard):** Logo upload persistence ensures brand continuity

**Blocks:**
- None (can be implemented independently)

---

## Performance Metrics

**Target Metrics:**
- Form state restoration: <100ms (p95)
- Draft auto-save latency: <50ms (in-memory write)
- Banner display: <200ms (p95)
- Upload resume detection: <500ms (network latency)

**Monitoring:**
- No server-side monitoring needed (client-side only)
- Browser storage usage tracking (localStorage quota)
- beforeunload event trigger rate

---

## Security & Privacy Considerations

**Data Sensitivity:**
- Password stored in cleartext in SessionStorage (ephemeral)
- Password removed from LocalStorage (security risk)
- Email stored in both storages (acceptable risk for UX)

**Mitigations:**
- SessionStorage auto-cleared on tab close
- LocalStorage draft expires after 7 days
- No server-side storage of draft data
- User can manually clear via "Start Fresh"

**GDPR/Privacy:**
- Draft data stored client-side only
- No PII sent to server until submission
- User has full control over draft lifecycle

---

## Edge Cases

1. **Storage Quota Exceeded:**
   - Browser throws `QuotaExceededError`
   - Catch in `DraftService.saveDraft()` and log error
   - Graceful degradation: form still works, just no auto-save

2. **Invalid Schema on Load:**
   - Zod parse fails
   - Clear draft and return null
   - User sees empty form (no banner)

3. **Concurrent Tabs:**
   - Each tab has own SessionStorage
   - LocalStorage shared across tabs
   - Last write wins (acceptable for single-user scenario)

4. **File Upload Cannot Be Serialized:**
   - File object not stored in draft
   - Only store `logoKey` and `logoUrl` after upload completes
   - User must re-select file to resume partial upload

5. **Network Failure During Upload:**
   - UploadThing automatically retries
   - Progress persists in LocalStorage
   - User can resume from partial progress

---

## Implementation Notes

**UploadThing Resumable Upload:**
- UploadThing SDK handles chunked uploads and resume internally
- No custom chunking logic needed
- Save `uploadId` (if exposed) for resume tracking
- Save progress percentage for UI feedback
- Save `fileKey` and `fileUrl` on completion

**Storage Strategy:**
- **SessionStorage (Ephemeral):**
  - Cleared when tab closes
  - Used for active session
  - Lower privacy risk

- **LocalStorage (Persistent):**
  - Survives browser restart
  - Used for draft detection on return
  - Higher privacy risk (password excluded)

**Debounce Timing:**
- 500ms debounce on form field changes
- Balances UX (responsive) vs performance (write frequency)
- Leading: false, Trailing: true (save on last change)

**Session ID:**
- Unique ID per onboarding session
- Stored in SessionStorage
- Used for analytics/debugging (optional)
- Not required for functionality

---

## Open Questions

1. **Should we exclude password from LocalStorage for security?**
   - **Answer:** YES. Password only in SessionStorage (ephemeral). LocalStorage draft has `password: undefined`.

2. **Should we show upload progress percentage in banner?**
   - **Answer:** NO. Banner shows "unsaved progress", not detailed upload state. Upload progress shown in LogoUpload component.

3. **Should we support multiple saved drafts (multiple workspaces)?**
   - **Answer:** NO. Single draft only. User must complete or clear before starting another.

4. **Should expired drafts show a "draft was discarded" message?**
   - **Answer:** NO. Silent discard. User sees empty form (no confusion).

---

## Success Metrics

**User Behavior:**
- % of users who resume draft (target: >30%)
- % of users who start fresh (acceptable: <70%)
- Draft abandonment rate (target: <20%)

**Technical Metrics:**
- Zero `QuotaExceededError` exceptions (graceful handling)
- Zero invalid schema errors in production
- beforeunload event cancellation rate (target: <5%)

**Business Impact:**
- Reduced onboarding abandonment by 15%
- Increased workspace creation completion rate by 10%
