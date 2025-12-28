# UX/UI Wireframes: Epic 1 - Frictionless Workspace Activation

**Epic:** Epic 1: Frictionless Workspace Activation
**Business Outcome:** <60 seconds from landing page to functional, branded dashboard
**Target Persona:** Workspace Owner (Sarah Chen - Head of Customer Success, arrives at 11 PM exhausted)
**Success Metric:** 90th percentile completion time <60s, zero zombie workspaces
**Author:** John (PM Agent)
**Date:** 2025-12-27

---

## Table of Contents

1. [Design Overview](#design-overview)
2. [Flow Architecture](#flow-architecture)
3. [Wireframe 1: Landing Page (Pre-Auth)](#wireframe-1-landing-page-pre-auth)
4. [Wireframe 2: Workspace Creation Form](#wireframe-2-workspace-creation-form)
5. [Wireframe 3: Real-Time URL Validation States](#wireframe-3-real-time-url-validation-states)
6. [Wireframe 4: Smart Conflict Resolution](#wireframe-4-smart-conflict-resolution)
7. [Wireframe 5: Provisioning Progress Indicator](#wireframe-5-provisioning-progress-indicator)
8. [Wireframe 6: Error Recovery Flow](#wireframe-6-error-recovery-flow)
9. [Wireframe 7: Branded Dashboard First View](#wireframe-7-branded-dashboard-first-view)
10. [Wireframe 8: Getting Started Checklist](#wireframe-8-getting-started-checklist)
11. [Interaction Specifications](#interaction-specifications)
12. [Technical Implementation Notes](#technical-implementation-notes)

---

## Design Overview

### Design Principles Applied

**1. Zero-Gravity UX (Weightless Interactions)**
- No heavy page reloads between steps
- Optimistic UI shows progress instantly
- Form validation debounced 300ms (not blocking)
- Total perceived latency <200ms (NFR-1)

**2. Warm Minimalism (LATAM Tone)**
- Generous whitespace (24px card padding, 16px gaps)
- Relational copy ("Let's create your workspace" not "Create workspace")
- High-quality typography (Inter font, 16px base, 1.6 line height)
- Color as signal (green checkmark = success, blue dot = in progress)

**3. Pre-Flight Safety (Poka-yoke)**
- Real-time validation prevents submission errors
- Smart suggestions when URL conflicts arise
- Browser `beforeunload` warning if form has data
- localStorage persistence for interrupted sessions

**4. Absolute Trust (Zeigarnik Effect Elimination)**
- Form data auto-saved to localStorage every 500ms
- "Continue your workspace setup" banner on return
- All-or-nothing atomic provisioning (no zombie workspaces)
- Clear error messages with actionable recovery steps

### User Stories Addressed

- **US1.1: Single-Session Workspace Creation** - Wireframes 1, 2, 3
- **US1.2: Fail-Safe Atomic Provisioning** - Wireframe 5, 6
- **US1.3: Smart URL Conflict Resolution** - Wireframe 3, 4
- **US1.4: Progress Persistence Through Interruptions** - Wireframe 6
- **US1.5: Instant Branded Dashboard** - Wireframe 7, 8

### Technical Constraints

- **Subdomain Routing:** Form creates `{slug}.customerdeskai.com` subdomain
- **CSS Variable Injection:** Branding applied <50ms via middleware
- **Compensating Transactions:** Rollback on any provisioning step failure
- **Nile Multi-Tenancy:** Composite keys, no FK across tenants
- **Better-Auth Integration:** Automatic session creation post-onboarding

---

## Flow Architecture

### Complete User Journey (Happy Path)

```
┌─────────────────────────────────────────────────────────────────┐
│ SARAH'S 60-SECOND JOURNEY (Target: <60s Total Time)            │
└─────────────────────────────────────────────────────────────────┘

1. Landing Page (Pre-Auth)
   ↓ Click "Create Your Workspace" (5s)

2. Workspace Creation Form
   ├─ Fill: Workspace Name (8s)
   ├─ Fill: URL Slug (auto-suggested, 3s)
   │  └─ Real-time validation (debounced 300ms)
   ├─ Fill: Admin Name (5s)
   ├─ Fill: Email (5s)
   ├─ Fill: Password (8s)
   └─ Fill: Confirm Password (3s)
   ↓ Click "Create Workspace" (2s)

3. Provisioning (Optimistic UI)
   ├─ Step 1: Provision Tenant (Nile) - 2s
   ├─ Step 2: Create Admin User (Better-Auth) - 1s
   ├─ Step 3: Assign Ownership (tenant_users) - 1s
   └─ Step 4: Initialize Session - 1s
   ↓ Auto-redirect to workspace subdomain (1s)

4. Branded Dashboard (First View)
   ├─ Logo visible in Navigation Rail
   ├─ Primary colors applied to UI
   └─ "Getting Started" checklist displayed
   ↓ DONE (<60s elapsed) ✓

Total Time: ~44s (median), <60s (90th percentile)
```

### Error Recovery Paths

```
┌─────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING & RECOVERY FLOWS                                 │
└─────────────────────────────────────────────────────────────────┘

URL Conflict (Real-Time Validation Fails)
├─ Inline error message appears (no blocking modal)
├─ Smart suggestions shown (acme → acme-support, acme-cs)
└─ User clicks suggestion → form auto-fills → validation passes

Provisioning Failure (Step 1-4 Fails)
├─ All progress rolls back (compensating transaction)
├─ Workspace URL freed for retry
├─ Error toast with recovery steps
└─ Form data persisted (user can retry immediately)

Browser Interruption (Tab Close, Refresh)
├─ Form data saved to localStorage (500ms debounce)
├─ "Continue your workspace setup" banner on return
└─ User chooses: Resume (pre-filled form) or Start Fresh

Network Offline (Form Submission Fails)
├─ "Network error, please retry" toast appears
├─ Form data preserved (no data loss)
└─ Retry button visible (no page reload)
```

---

## Wireframe 1: Landing Page (Pre-Auth)

**User Story:** US1.1 (Entry Point)
**Context:** Sarah lands on `app.customerdeskai.com` (no subdomain = no workspace context)
**Goal:** Clear call-to-action to create workspace with zero friction

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          CustomerDeskAI                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                          [CENTERED CONTENT AREA]

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │              Create Your Workspace                │
          │                                                   │
          │   Support your customers with a branded,          │
          │   white-label help desk. Set up in 60 seconds.    │
          │                                                   │
          │   ┌─────────────────────────────────────────┐     │
          │   │   Create Your Workspace  →              │     │
          │   └─────────────────────────────────────────┘     │
          │              [PRIMARY CTA BUTTON]                 │
          │                                                   │
          │   ┌─────────────────────────────────────────┐     │
          │   │   Already have a workspace? Sign in →   │     │
          │   └─────────────────────────────────────────┘     │
          │              [SECONDARY TEXT LINK]                │
          │                                                   │
          └───────────────────────────────────────────────────┘

                   [TRUST INDICATORS - 3 ICONS]

        ✓ No credit card required  |  ✓ 2-minute setup  |  ✓ Free trial


┌─────────────────────────────────────────────────────────────────────────┐
│ Footer: Privacy Policy | Terms of Service | Contact Support             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Specifications

**Typography:**
- Heading: Inter, 32px (2xl), 600 weight, --foreground color
- Body: Inter, 18px (lg), 400 weight, --muted color
- CTA Button: Inter, 16px (base), 500 weight, --primary-foreground on --primary background

**Spacing:**
- Centered card: 600px max-width, 24px padding, 8px rounded corners
- Vertical gap between elements: 16px (space-4)
- Trust indicators: 12px gap between icons

**Color Tokens:**
- Background: --background (white in light mode)
- Foreground: --foreground (gray-900)
- Primary CTA: --primary (brand color, default blue)
- Muted Text: --muted (gray-600)

**Interaction:**
- CTA Button hover: Darken --primary by 10% (bg-primary hover:bg-primary/90)
- Focus state: 2px --ring outline (keyboard navigation)
- Click → Navigate to Wireframe 2 (Workspace Creation Form)

### Accessibility

- Skip link: "Skip to workspace creation form" (keyboard users)
- ARIA label on CTA: "Create your first workspace"
- Semantic HTML: `<main>`, `<button>`, `<a>`
- Contrast ratio: 4.5:1 minimum (WCAG AA)

### Mobile Optimization (375px - 768px)

```
┌─────────────────────────┐
│   CustomerDeskAI        │
├─────────────────────────┤
│                         │
│  Create Your Workspace  │
│                         │
│  Support customers with │
│  a branded help desk.   │
│  Set up in 60 seconds.  │
│                         │
│  ┌───────────────────┐  │
│  │ Create Workspace  │  │
│  └───────────────────┘  │
│                         │
│  Already have one?      │
│  [Sign in →]            │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Stack vertically (no horizontal layout)
- Reduce font sizes: Heading 24px, body 16px
- Full-width CTA button (no max-width)
- Trust indicators stacked 1 column (not 3)

---

## Wireframe 2: Workspace Creation Form

**User Story:** US1.1 (Single-Session Workspace Creation)
**Context:** Sarah clicked "Create Your Workspace" from landing page
**Goal:** 6 fields maximum, real-time validation, <60s total completion time

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Home                             CustomerDeskAI              │
└─────────────────────────────────────────────────────────────────────────┘

                    [PROGRESS INDICATOR - OPTIONAL]
                    Step 1 of 1: Workspace Details

┌─────────────────────────────────────────────────────────────────────────┐
│                      Create Your Workspace                              │
│                                                                         │
│  Let's set up your branded support workspace. This takes 60 seconds.   │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  WORKSPACE DETAILS                                │
          │                                                   │
          │  Workspace Name *                                 │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Acme Support                               │  │
          │  └─────────────────────────────────────────────┘  │
          │  This name appears in emails and your dashboard.  │
          │                                                   │
          │  Workspace URL *                                  │
          │  ┌──────────────────┬──────────────────────────┐  │
          │  │  acme            │.customerdeskai.com       │  │
          │  └──────────────────┴──────────────────────────┘  │
          │  ✓ Available                [Real-time check]    │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  ADMIN ACCOUNT                                    │
          │                                                   │
          │  Your Name *                                      │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Sarah Chen                                 │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  Email Address *                                  │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  sarah@acme.com                             │  │
          │  └─────────────────────────────────────────────┘  │
          │  You'll use this email to sign in.               │
          │                                                   │
          │  Password *                                       │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ••••••••••••                       [SHOW]  │  │
          │  └─────────────────────────────────────────────┘  │
          │  Minimum 12 characters                            │
          │                                                   │
          │  Confirm Password *                               │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ••••••••••••                       [SHOW]  │  │
          │  └─────────────────────────────────────────────┘  │
          │  ✓ Passwords match                                │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │   Create Workspace  →                       │  │
          │  └─────────────────────────────────────────────┘  │
          │               [PRIMARY CTA BUTTON]                │
          │                                                   │
          │  By creating a workspace, you agree to our        │
          │  [Terms of Service] and [Privacy Policy]          │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Field Specifications

**1. Workspace Name (Required)**
- **Type:** Text input (3-100 characters)
- **Placeholder:** "Acme Support"
- **Validation:** Required, min 3 chars, max 100 chars
- **Help Text:** "This name appears in emails and your dashboard."
- **Auto-save:** localStorage every 500ms after typing stops

**2. Workspace URL (Required)**
- **Type:** Split input (prefix editable, suffix static)
- **Format:** `{slug}.customerdeskai.com`
- **Placeholder:** "acme"
- **Validation:**
  - Required, lowercase, 3-50 chars
  - Alphanumeric + hyphens only (no spaces, special chars)
  - Real-time availability check (debounced 300ms)
- **Feedback States:**
  - ✓ Available (green checkmark, --success color)
  - ⚠ Checking... (blue spinner, --muted color)
  - ✗ Already taken (red X, --destructive color) → Triggers Wireframe 4 (Smart Suggestions)
- **Smart Pre-fill:** Auto-suggest from Workspace Name (e.g., "Acme Support" → "acme")

**3. Your Name (Required)**
- **Type:** Text input (2-100 characters)
- **Placeholder:** "Sarah Chen"
- **Validation:** Required, min 2 chars, max 100 chars
- **Help Text:** None (self-explanatory)

**4. Email Address (Required)**
- **Type:** Email input with HTML5 validation
- **Placeholder:** "sarah@acme.com"
- **Validation:** Required, valid email format
- **Help Text:** "You'll use this email to sign in."

**5. Password (Required)**
- **Type:** Password input with toggle visibility
- **Placeholder:** "Minimum 12 characters"
- **Validation:** Required, min 12 chars (Better-Auth default)
- **Strength Indicator:** None (Phase 1 - simplicity over features)
- **Show/Hide Toggle:** [SHOW] button appended to input (click to reveal)

**6. Confirm Password (Required)**
- **Type:** Password input with toggle visibility
- **Placeholder:** "Confirm your password"
- **Validation:** Required, must match Password field
- **Feedback:** ✓ Passwords match (green checkmark when valid)

### Form Behavior

**Real-Time Validation:**
- URL availability: Debounced 300ms after typing stops
- Password match: Immediate (on blur or keyup)
- Email format: HTML5 validation on blur
- All fields: Required validation on blur

**Auto-Save (Progress Persistence - US1.4):**
- Form data saved to localStorage every 500ms
- Key: `workspace-setup-draft-{email}` (unique per user attempt)
- Excluded from save: Password fields (security best practice)

**Submit Button State:**
- **Enabled:** All fields valid, URL available
- **Disabled:** Any field invalid or URL checking
- **Loading:** Submitting (shows spinner + "Creating...")

### Design Specifications

**Typography:**
- Heading: Inter, 24px (xl), 600 weight
- Body: Inter, 16px (base), 400 weight
- Labels: Inter, 14px (sm), 500 weight, --foreground color
- Help text: Inter, 12px (xs), 400 weight, --muted color
- Validation feedback: Inter, 12px (xs), 500 weight, context color (success/destructive)

**Spacing:**
- Form container: 600px max-width, 24px padding, 8px rounded
- Vertical gap between fields: 20px (space-5)
- Label to input gap: 8px (space-2)
- Help text margin-top: 4px (space-1)

**Color Tokens:**
- Background: --background
- Input border: --border (gray-300)
- Input focus: --ring (blue-500, 2px outline)
- Success: --success (green-600)
- Error: --destructive (red-600)
- Muted: --muted (gray-600)

**Interaction:**
- Input focus: 2px --ring outline, border color darkens
- URL validation spinner: Rotate animation, --muted color
- Submit button hover: Darken --primary by 10%
- Submit button disabled: Opacity 50%, cursor not-allowed

### Accessibility

**Semantic HTML:**
- `<form>` wrapper with proper ARIA labels
- `<label for="field-id">` for all inputs
- `<input id="field-id">` with proper type attributes
- `<button type="submit">` for primary action

**ARIA Attributes:**
- `aria-required="true"` on all required fields
- `aria-invalid="true"` when validation fails
- `aria-describedby="help-text-id"` for help text
- `aria-live="polite"` for URL validation feedback

**Keyboard Navigation:**
- Tab order: Workspace Name → URL → Admin Name → Email → Password → Confirm → Submit
- Enter key: Submit form (if all fields valid)
- Esc key: Clear current field (optional)

### Mobile Optimization (375px - 768px)

```
┌─────────────────────────────┐
│  ← Back   CustomerDeskAI    │
├─────────────────────────────┤
│                             │
│  Create Your Workspace      │
│                             │
│  Let's set up your branded  │
│  support workspace.         │
│                             │
│  WORKSPACE DETAILS          │
│                             │
│  Workspace Name *           │
│  ┌───────────────────────┐  │
│  │  Acme Support         │  │
│  └───────────────────────┘  │
│  Appears in emails          │
│                             │
│  Workspace URL *            │
│  ┌─────────────┬─────────┐  │
│  │  acme       │.custo...│  │
│  └─────────────┴─────────┘  │
│  ✓ Available                │
│                             │
│  ADMIN ACCOUNT              │
│                             │
│  Your Name *                │
│  ┌───────────────────────┐  │
│  │  Sarah Chen           │  │
│  └───────────────────────┘  │
│                             │
│  Email *                    │
│  ┌───────────────────────┐  │
│  │  sarah@acme.com       │  │
│  └───────────────────────┘  │
│                             │
│  Password *                 │
│  ┌───────────────────────┐  │
│  │  •••••••••   [SHOW]   │  │
│  └───────────────────────┘  │
│  Min 12 characters          │
│                             │
│  Confirm Password *         │
│  ┌───────────────────────┐  │
│  │  •••••••••   [SHOW]   │  │
│  └───────────────────────┘  │
│  ✓ Passwords match          │
│                             │
│  ┌───────────────────────┐  │
│  │ Create Workspace  →   │  │
│  └───────────────────────┘  │
│                             │
│  By creating, you agree to  │
│  [Terms] and [Privacy]      │
│                             │
└─────────────────────────────┘
```

**Mobile Adaptations:**
- Stack form into single column (no 2-column layout)
- Reduce font sizes: Heading 20px, labels 14px, body 14px
- Full-width inputs and buttons
- Truncate URL suffix with ellipsis (.custo...)
- Shorter help text ("Appears in emails" vs full sentence)

---

## Wireframe 3: Real-Time URL Validation States

**User Story:** US1.3 (Smart URL Conflict Resolution - Part 1)
**Context:** User typing in Workspace URL field
**Goal:** Prevent submission errors, provide instant feedback on availability

### State Machine: URL Validation

```
┌────────────────────────────────────────────────────────────┐
│  URL VALIDATION STATE MACHINE                              │
└────────────────────────────────────────────────────────────┘

1. IDLE (Initial State)
   ↓ User types in URL field

2. DEBOUNCING (300ms wait)
   ↓ 300ms elapsed without new keystrokes

3. CHECKING (API call in flight)
   ├─ → AVAILABLE (200 OK, URL free)
   ├─ → TAKEN (200 OK, URL exists)
   └─ → ERROR (Network failure, retry)

AVAILABLE → Form submittable
TAKEN → Smart suggestions shown (Wireframe 4)
ERROR → Retry button appears
```

### Visual States (In-Line with Input Field)

**State 1: IDLE (No Input Yet)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│                  │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
Enter a unique identifier (lowercase letters, numbers, hyphens)
```

**State 2: DEBOUNCING (User Typing)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme-su         │.customerdeskai.com       │ [Cursor blinking]
└──────────────────┴──────────────────────────┘
[No feedback yet - waiting for typing to stop]
```

**State 3: CHECKING (API Call In Flight)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme-support    │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
⚙ Checking availability...           [Spinner animation]
```

**State 4: AVAILABLE (Success)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme-support    │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
✓ Available                          [Green checkmark, --success color]
```

**State 5: TAKEN (Conflict - Triggers Wireframe 4)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme            │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
✗ Already taken. Try one of these:   [Red X, --destructive color]

  ┌──────────────────────────────────────────┐
  │  acme-support     [Click to use] →       │  [Suggestion chip]
  ├──────────────────────────────────────────┤
  │  acme-cs          [Click to use] →       │  [Suggestion chip]
  ├──────────────────────────────────────────┤
  │  acme-help        [Click to use] →       │  [Suggestion chip]
  └──────────────────────────────────────────┘
```

**State 6: ERROR (Network Failure)**

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme-support    │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
⚠ Couldn't check availability. [Retry] →    [Warning icon, retry link]
```

### Interaction Specifications

**Debounce Logic:**
- Trigger: `keyup` event on URL input field
- Delay: 300ms after last keystroke
- Cancel: New keystroke resets timer
- API Call: `GET /api/workspaces/check-url?slug={value}`

**API Response Handling:**

```typescript
// Response format
type URLCheckResponse =
  | { available: true }
  | { available: false, suggestions: string[] }
  | { error: string }

// Visual feedback mapping
if (response.available) {
  // State 4: Show green checkmark
  setValidationState("available");
  setSubmitEnabled(true);
} else if (response.suggestions) {
  // State 5: Show suggestions (Wireframe 4)
  setValidationState("taken");
  setSuggestions(response.suggestions);
  setSubmitEnabled(false);
} else if (response.error) {
  // State 6: Show retry
  setValidationState("error");
  setSubmitEnabled(false);
}
```

**Race Condition Protection (US1.3 Acceptance Criteria):**
- Each API call includes request ID
- Only latest request ID's response is processed
- Earlier responses discarded (prevents stale data showing)

### Design Specifications

**Visual Indicators:**

| State     | Icon | Color      | Message                    | Animation     |
|-----------|------|------------|----------------------------|---------------|
| IDLE      | None | --muted    | Help text only             | None          |
| DEBOUNCING| None | --muted    | No feedback                | None          |
| CHECKING  | ⚙    | --muted    | "Checking availability..." | Rotate 360°   |
| AVAILABLE | ✓    | --success  | "Available"                | Fade in 200ms |
| TAKEN     | ✗    | --destructive | "Already taken. Try one..." | None       |
| ERROR     | ⚠    | --warning  | "Couldn't check..."        | None          |

**Typography:**
- Feedback text: Inter, 12px (xs), 500 weight
- State AVAILABLE: 500 weight, --success color
- State TAKEN: 500 weight, --destructive color
- State ERROR: 500 weight, --warning color

**Accessibility:**
- ARIA live region for validation feedback (`aria-live="polite"`)
- Screen reader announces: "URL available" or "URL taken, suggestions provided"
- Spinner has `aria-label="Checking URL availability"`

---

## Wireframe 4: Smart Conflict Resolution

**User Story:** US1.3 (Smart URL Conflict Resolution - Part 2)
**Context:** User's preferred URL is taken, system shows intelligent suggestions
**Goal:** One-click alternative selection, zero frustration

### Layout (Suggestion Chips Below URL Input)

```
Workspace URL *
┌──────────────────┬──────────────────────────┐
│  acme            │.customerdeskai.com       │
└──────────────────┴──────────────────────────┘
✗ Already taken. Try one of these:

┌────────────────────────────────────────────────────────────┐
│  Suggested Alternatives (Click to use)                     │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │ acme-support  →  │  │ acme-cs       →  │  │ acme-help│ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
│                                                            │
│  Or create your own:                                       │
│  ┌──────────────────┬──────────────────────────┐          │
│  │                  │.customerdeskai.com       │          │
│  └──────────────────┴──────────────────────────┘          │
└────────────────────────────────────────────────────────────┘
```

### Suggestion Algorithm (Backend Logic)

**Input:** User's attempted URL slug (e.g., "acme")

**Output:** 3 smart suggestions prioritized by business context

```typescript
function generateSmartSuggestions(slug: string): string[] {
  const suggestions = [];

  // Priority 1: Common support suffixes (LATAM-relevant)
  suggestions.push(`${slug}-support`);  // acme-support
  suggestions.push(`${slug}-cs`);       // acme-cs (customer service)

  // Priority 2: Generic alternatives
  suggestions.push(`${slug}-help`);     // acme-help

  // Priority 3: Numbered alternatives (if all above taken)
  if (allTaken(suggestions)) {
    suggestions.push(`${slug}-1`);      // acme-1
  }

  // Filter out suggestions that are also taken
  return suggestions.filter(s => isAvailable(s)).slice(0, 3);
}
```

**Business Context Rationale:**
- **-support:** Most common B2B SaaS pattern (Zendesk, Intercom use this)
- **-cs:** Customer Service abbreviation, LATAM-friendly (servicio al cliente)
- **-help:** Generic, universally understood
- **-1:** Last resort, avoid if possible (feels impersonal)

### Interaction Specifications

**Suggestion Chip Behavior:**
- **Click:** Auto-fill URL input field with suggestion
- **Effect:** Trigger immediate availability check (debounced 300ms)
- **Feedback:** Green checkmark appears if suggestion available
- **Keyboard:** Tab to focus chip, Enter to select

**Custom Input Fallback:**
- User can ignore suggestions and type custom alternative
- Real-time validation continues (same State Machine as Wireframe 3)

### Design Specifications

**Suggestion Chips:**
- **Layout:** Horizontal row, 3 chips max, 8px gap between chips
- **Styling:**
  - Background: --muted (gray-100)
  - Border: 1px --border (gray-300)
  - Text: Inter, 14px (sm), 500 weight, --foreground color
  - Hover: Darken background to gray-200
  - Focus: 2px --ring outline
- **Arrow Icon:** → (right arrow, --primary color)

**Container:**
- Background: --background (white)
- Border: 1px --border (gray-300)
- Padding: 16px (space-4)
- Rounded: 6px (rounded-md)
- Margin-top: 8px (space-2) from URL input

**Accessibility:**
- ARIA label: "Suggested workspace URLs"
- Each chip: `<button role="button" aria-label="Use acme-support">`
- Keyboard navigation: Tab through chips, Enter to select

### Mobile Optimization

```
Workspace URL *
┌──────────────┬────────────┐
│  acme        │.custom...  │
└──────────────┴────────────┘
✗ Taken. Try these:

┌──────────────────────────┐
│  acme-support         →  │  [Full-width chip]
├──────────────────────────┤
│  acme-cs              →  │  [Full-width chip]
├──────────────────────────┤
│  acme-help            →  │  [Full-width chip]
└──────────────────────────┘

Or create your own:
┌──────────────┬────────────┐
│              │.custom...  │
└──────────────┴────────────┘
```

**Mobile Adaptations:**
- Stack chips vertically (no horizontal row)
- Full-width chips for easier tap targets (44px min height)
- Truncate suffix with ellipsis (.custom...)

---

## Wireframe 5: Provisioning Progress Indicator

**User Story:** US1.2 (Fail-Safe Atomic Provisioning)
**Context:** User clicked "Create Workspace", atomic provisioning in progress
**Goal:** Show transparent progress, build trust, perceived latency <200ms

### Layout (Overlay Modal - Optimistic UI)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        [SEMI-TRANSPARENT OVERLAY]                       │
│                                                                         │
│                                                                         │
│                  ┌───────────────────────────────────┐                  │
│                  │                                   │                  │
│                  │   Creating Your Workspace...      │                  │
│                  │                                   │                  │
│                  │   ⚙ Provisioning tenant           │  ✓ Done (1/4)   │
│                  │   ⚙ Creating admin account        │  [In Progress]  │
│                  │   ○ Assigning ownership           │  [Pending]      │
│                  │   ○ Initializing session          │  [Pending]      │
│                  │                                   │                  │
│                  │   ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░   │  50%            │
│                  │                                   │                  │
│                  │   This takes just a few seconds.  │                  │
│                  │                                   │                  │
│                  └───────────────────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Provisioning Steps (Compensating Transaction Pattern)

**Step 1: Provision Tenant (Nile)**
- **Action:** `POST /api/nile/tenants` with workspace metadata
- **Duration:** ~2s (database write + Nile replication)
- **Success:** Tenant ID returned, store in context
- **Failure:** Rollback (nothing to clean up, tenant creation atomic)

**Step 2: Create Admin User (Better-Auth)**
- **Action:** `POST /api/auth/sign-up` with user credentials
- **Duration:** ~1s (password hash + database write)
- **Success:** User ID returned, store in context
- **Failure:** Rollback Step 1 (delete tenant via `DELETE /api/nile/tenants/{id}`)

**Step 3: Assign Ownership (tenant_users linkage)**
- **Action:** `POST /api/tenant-users` with `{ tenant_id, user_id, role: "owner" }`
- **Duration:** ~1s (database write)
- **Success:** Ownership record created
- **Failure:** Rollback Step 1+2 (delete tenant, delete user)

**Step 4: Initialize Session (Better-Auth)**
- **Action:** `POST /api/auth/session` to create authenticated session
- **Duration:** ~1s (session token generation)
- **Success:** Session cookie set, redirect to workspace subdomain
- **Failure:** Rollback Step 1+2+3 (full cleanup, user can retry)

**Total Time:** ~5s (median), <8s (90th percentile)

### Visual Progress States

**Initial State (Step 1 Starting):**
```
⚙ Provisioning tenant           [In Progress - Spinning]
○ Creating admin account         [Pending - Gray]
○ Assigning ownership            [Pending - Gray]
○ Initializing session           [Pending - Gray]

▓░░░░░░░░░░░░░░░░░░░░░░░░░░░    0%
```

**Step 1 Complete (Step 2 Starting):**
```
✓ Provisioning tenant            [Done - Green checkmark]
⚙ Creating admin account         [In Progress - Spinning]
○ Assigning ownership            [Pending - Gray]
○ Initializing session           [Pending - Gray]

▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░    25%
```

**Step 2 Complete (Step 3 Starting):**
```
✓ Provisioning tenant            [Done - Green]
✓ Creating admin account         [Done - Green]
⚙ Assigning ownership            [In Progress - Spinning]
○ Initializing session           [Pending - Gray]

▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░    50%
```

**Step 3 Complete (Step 4 Starting):**
```
✓ Provisioning tenant            [Done - Green]
✓ Creating admin account         [Done - Green]
✓ Assigning ownership            [Done - Green]
⚙ Initializing session           [In Progress - Spinning]

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░    75%
```

**All Steps Complete (Success):**
```
✓ Provisioning tenant            [Done - Green]
✓ Creating admin account         [Done - Green]
✓ Assigning ownership            [Done - Green]
✓ Initializing session           [Done - Green]

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    100%

Redirecting to your workspace...
```

### Design Specifications

**Modal Container:**
- Width: 480px max-width (centered)
- Height: Auto (fits content)
- Background: --background (white)
- Border: 1px --border (gray-300)
- Shadow: Large shadow (0 10px 40px rgba(0,0,0,0.1))
- Padding: 32px (space-8)
- Rounded: 8px (rounded-lg)

**Progress Indicators:**
- **Icon States:**
  - Pending: ○ (gray circle, --muted color)
  - In Progress: ⚙ (spinning gear, --primary color, rotate animation)
  - Complete: ✓ (green checkmark, --success color)
- **Progress Bar:**
  - Width: 100% of modal
  - Height: 8px
  - Background: --muted (gray-200)
  - Fill: --primary (brand color)
  - Animation: Smooth width transition (ease-in-out 500ms)

**Typography:**
- Heading: Inter, 20px (lg), 600 weight, --foreground
- Step labels: Inter, 14px (sm), 400 weight, --foreground
- Help text: Inter, 12px (xs), 400 weight, --muted

**Overlay:**
- Background: rgba(0, 0, 0, 0.5) (semi-transparent black)
- Z-index: 50 (above form content)
- Non-dismissible: User cannot click outside or press Esc

### Accessibility

**ARIA Attributes:**
- Modal: `role="dialog" aria-labelledby="provisioning-title" aria-modal="true"`
- Progress bar: `role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"`
- Live region: `aria-live="polite"` for step updates

**Screen Reader:**
- Announces: "Creating your workspace, step 2 of 4: Creating admin account"
- Progress updates every step completion

### Mobile Optimization

```
┌─────────────────────────┐
│                         │
│  Creating Workspace...  │
│                         │
│  ✓ Provisioning         │
│  ⚙ Creating account     │
│  ○ Assigning owner      │
│  ○ Starting session     │
│                         │
│  ▓▓▓▓▓▓░░░░░░░░░░       │
│  50%                    │
│                         │
│  Just a few seconds.    │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Narrower modal (90% viewport width)
- Reduce font sizes (heading 18px, steps 13px)
- Shorter step labels ("Provisioning" vs "Provisioning tenant")

---

## Wireframe 6: Error Recovery Flow

**User Story:** US1.2 (Fail-Safe Atomic Provisioning), US1.4 (Progress Persistence)
**Context:** Provisioning fails at any step, or user interrupted during onboarding
**Goal:** Clear error messaging, one-click retry, no data loss

### Scenario 1: Provisioning Failure (Network Error, API Failure)

**Visual State (Modal Error State):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        [SEMI-TRANSPARENT OVERLAY]                       │
│                                                                         │
│                  ┌───────────────────────────────────┐                  │
│                  │                                   │                  │
│                  │   ⚠ Setup Interrupted            │                  │
│                  │                                   │                  │
│                  │   We couldn't create your         │                  │
│                  │   workspace due to a network      │                  │
│                  │   error.                          │                  │
│                  │                                   │                  │
│                  │   ✓ Provisioning tenant           │  [Completed]    │
│                  │   ✗ Creating admin account        │  [Failed Here]  │
│                  │   ○ Assigning ownership           │  [Not Started]  │
│                  │   ○ Initializing session          │  [Not Started]  │
│                  │                                   │                  │
│                  │   Your workspace URL "acme" has   │                  │
│                  │   been freed and is available.    │                  │
│                  │                                   │                  │
│                  │   ┌─────────────────────────────┐ │                  │
│                  │   │  Try Again  →               │ │  [Primary CTA]  │
│                  │   └─────────────────────────────┘ │                  │
│                  │                                   │                  │
│                  │   [Cancel and start over]         │  [Text link]    │
│                  │                                   │                  │
│                  └───────────────────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**User Action: Click "Try Again"**
- Form data restored from localStorage (pre-filled)
- Provisioning restarts from Step 1 (all-or-nothing)
- User does NOT need to re-enter data

### Scenario 2: Browser Interruption (Tab Close, Refresh During Form Fill)

**Visual State (Banner on Return to Page):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Home                             CustomerDeskAI              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ℹ Continue Your Workspace Setup                                        │
│                                                                         │
│  You have an unfinished workspace setup for "Acme Support"              │
│  (acme.customerdeskai.com). Would you like to continue?                 │
│                                                                         │
│  [Continue Setup →]     [Start Fresh]                                   │
└─────────────────────────────────────────────────────────────────────────┘

                    [WORKSPACE CREATION FORM BELOW]
          (Pre-filled if user clicks "Continue Setup")
```

**User Action: Click "Continue Setup"**
- Form auto-fills with saved data from localStorage
- Password fields remain empty (security best practice)
- User continues from where they left off

**User Action: Click "Start Fresh"**
- Clear localStorage draft
- Show empty form (clean slate)

### Scenario 3: Duplicate Email (User Already Exists)

**Visual State (Inline Error on Email Field):**

```
Email Address *
┌─────────────────────────────────────────────┐
│  sarah@acme.com                             │
└─────────────────────────────────────────────┘
✗ An account with this email already exists.
  [Sign in instead →] or use a different email.
```

**User Action: Click "Sign in instead"**
- Redirect to sign-in page
- Pre-fill email field with `sarah@acme.com`

### Error Messages (Tone & Copy Guidelines)

**General Principle:** Human-centric, actionable, blame-free

**Network Failure:**
> "We couldn't create your workspace due to a network error. Your workspace URL 'acme' has been freed and is available. [Try Again →]"

**Duplicate Email:**
> "An account with this email already exists. [Sign in instead →] or use a different email."

**Duplicate URL (Race Condition):**
> "Someone just claimed this URL. Try one of these alternatives: [acme-support] [acme-cs] [acme-help]"

**Generic Server Error:**
> "Something went wrong on our end. We've been notified and are investigating. Please try again in a few minutes. [Try Again →]"

**Validation Error (Client-Side):**
> "Password must be at least 12 characters." (Inline, below field, --destructive color)

### Design Specifications

**Error Banner (Browser Interruption Recovery):**
- Background: --info (blue-50, light blue tint)
- Border: 1px --info-border (blue-300)
- Icon: ℹ (info icon, --info-foreground blue-600)
- Padding: 16px (space-4)
- Rounded: 6px (rounded-md)
- Margin-bottom: 16px (space-4) from form

**Error Modal (Provisioning Failure):**
- Same modal design as Wireframe 5 (Provisioning Progress)
- Icon: ⚠ (warning triangle, --destructive color)
- Heading: "Setup Interrupted" (not "Error")
- Body text: Specific error message with recovery steps
- Primary CTA: "Try Again" (--primary background)
- Secondary action: "Cancel and start over" (text link, --muted)

**Inline Field Error:**
- Color: --destructive (red-600)
- Typography: Inter, 12px (xs), 500 weight
- Icon: ✗ (red X, prepended to message)
- Position: Below input field, margin-top 4px

**Accessibility:**
- Error banner: `role="alert" aria-live="assertive"`
- Inline errors: `aria-describedby="error-message-id"` on input
- Error modal: `role="alertdialog" aria-labelledby="error-title"`

### Rollback Transparency (US1.2 Acceptance Criteria)

**What Users See:**
- "Your workspace URL 'acme' has been freed and is available."
- Clear indication of which step failed (✗ Creating admin account)
- Completed steps shown (✓ Provisioning tenant)
- Not started steps grayed out (○ Assigning ownership)

**What Users Don't See (Backend Complexity Hidden):**
- Database transaction details
- API error codes (500, 503, etc.)
- Internal service names (Nile, Better-Auth)

**Design Philosophy:** Abstract technical complexity, show business impact

---

## Wireframe 7: Branded Dashboard First View

**User Story:** US1.5 (Instant Branded Dashboard)
**Context:** Provisioning complete, user auto-authenticated and redirected to workspace subdomain
**Goal:** Logo, colors visible immediately, "Getting Started" checklist displayed

### Layout (3-Pane Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [WORKSPACE LOGO]                                       [Sarah Chen ▼]  │
│                                                         [Sign Out]       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────┬──────────────────────────────────────┬──────────────────────────┐
│      │                                      │                          │
│  [🏠]│  Dashboard                           │  Getting Started         │
│  NAV │                                      │                          │
│  [🎫]│  ┌────────────────────────────────┐  │  Complete these steps    │
│      │  │                                │  │  to set up your          │
│  [📚]│  │  Welcome to Your Workspace     │  │  workspace:              │
│      │  │                                │  │                          │
│  [⚙️] │  │  You're all set up and ready   │  │  □ Set workspace         │
│      │  │  to support your customers.    │  │    branding              │
│  [👥]│  │                                │  │                          │
│      │  │  Your workspace "Acme Support" │  │  □ Invite your first     │
│      │  │  is live at:                   │  │    team member           │
│      │  │                                │  │                          │
│  60px│  │  acme.customerdeskai.com       │  │  □ Publish your first    │
│  FIXED  │  [Copy Link]                  │  │    knowledge base        │
│      │  │                                │  │    article               │
│      │  └────────────────────────────────┘  │                          │
│      │                                      │  [Dismiss Checklist]     │
│      │  ┌────────────────────────────────┐  │                          │
│      │  │  What's Next?                  │  └──────────────────────────┘
│      │  │                                │
│      │  │  → Customize your branding     │
│      │  │  → Invite team members         │
│      │  │  → Create KB articles          │
│      │  │                                │
│      │  └────────────────────────────────┘
│      │
│      │  320px                               Flexible Width
│      │  TICKET LIST                         DETAIL VIEW
│      │  (Empty State)                       (Onboarding Content)
│      │
└──────┴──────────────────────────────────────┴──────────────────────────┘
```

### Branding Visibility (Instant Application - US1.5)

**Logo Placement:**
- **Location:** Top-left of Navigation Rail (60px x 60px square)
- **Fallback:** If no logo uploaded, show workspace initials (e.g., "AS" for Acme Support)
- **Format:** SVG or PNG (uploaded during onboarding, optional field)
- **CDN URL:** `https://cdn.customerdeskai.com/workspaces/{tenant_id}/logo.svg`

**Color Application (CSS Variables):**
- **Primary Color:** Applied to CTA buttons, links, active nav items
- **Accent Color:** Applied to badges, secondary UI elements
- **Injection Timing:** <50ms via Next.js 16 middleware (NFR constraint)

**CSS Variable Structure:**
```css
/* Injected at <html> root via middleware */
:root {
  --primary: 220 90% 56%;           /* Workspace-specific brand color */
  --primary-foreground: 0 0% 100%;  /* Text on primary */
  --accent: 340 82% 52%;            /* Workspace accent color */
}

/* Applied to UI elements via Tailwind classes */
button.primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Navigation Rail (60px Fixed Left)

**Icons (Vertical Stack):**
- 🏠 Dashboard (active on first view)
- 🎫 Tickets (empty state)
- 📚 Knowledge Base (empty state)
- ⚙️ Settings (branding, team, etc.)
- 👥 Team (invite members)

**Design:**
- Width: 60px (fixed, never collapses)
- Background: --muted (gray-100)
- Active item: --primary background, white icon
- Hover: Darken background to gray-200
- Icon size: 24px (space-6)
- Padding: 12px vertical between icons

### Dashboard Content (Center Pane)

**Welcome Card:**
- **Heading:** "Welcome to Your Workspace" (Inter, 20px, 600 weight)
- **Body:** Personal message using workspace name ("Acme Support")
- **Workspace URL:** Displayed with [Copy Link] button
- **Styling:**
  - Background: --background (white)
  - Border: 1px --border (gray-300)
  - Padding: 24px (space-6)
  - Rounded: 6px (rounded-md)

**What's Next Card:**
- **3 Quick Actions (Bullet List):**
  - → Customize your branding (links to Settings → Branding)
  - → Invite team members (links to Team → Invite)
  - → Create KB articles (links to Knowledge Base → New Article)
- **Styling:** Same as Welcome Card

### Getting Started Checklist (Right Pane)

**Design:** See Wireframe 8 for detailed specifications

**Summary:**
- 3 high-impact checklist items (US1.5 Acceptance Criteria)
- Auto-complete when user completes action
- Dismissible (user can hide checklist)
- Persistent until dismissed (shows on every dashboard load)

### Design Specifications

**3-Pane Layout Constraints:**
- **Navigation Rail:** 60px fixed width (never collapses)
- **Ticket List:** 320px min-width (empty state in Phase 1)
- **Detail View:** Flexible width (100% - 60px - 320px)
- **Separators:** 1px --border (gray-300), no drag handles (Phase 1)

**Empty State (No Tickets Yet):**
- **Center Pane:** Welcome message + What's Next card
- **Detail View (Right):** Getting Started checklist
- **List Pane (Left):** Empty state ("No tickets yet. When customers contact you, they'll appear here.")

**Typography:**
- Workspace name: Inter, 20px (lg), 600 weight, --foreground
- Body text: Inter, 16px (base), 400 weight, --foreground
- Links: Inter, 16px (base), 500 weight, --primary color, underline on hover

**Spacing:**
- Card padding: 24px (space-6)
- Gap between cards: 16px (space-4)
- Vertical rhythm: 8px between paragraphs

**Accessibility:**
- Semantic HTML: `<nav>`, `<main>`, `<aside>` for 3-pane structure
- Skip links: "Skip to dashboard content" (keyboard users)
- Focus indicators: 2px --ring outline on interactive elements
- ARIA labels: "Navigation menu", "Dashboard content", "Getting started checklist"

### Mobile Optimization (375px - 768px)

**Mobile Layout (Single-Column Stack):**

```
┌─────────────────────────┐
│  [☰ Menu]  [Sarah ▼]    │
├─────────────────────────┤
│                         │
│  [WORKSPACE LOGO]       │
│                         │
│  Welcome to Your        │
│  Workspace              │
│                         │
│  You're all set up!     │
│                         │
│  acme.customerdeskai... │
│  [Copy Link]            │
│                         │
│  ─────────────────────  │
│                         │
│  Getting Started        │
│                         │
│  □ Set branding         │
│  □ Invite team member   │
│  □ Publish KB article   │
│                         │
│  [Dismiss]              │
│                         │
│  ─────────────────────  │
│                         │
│  What's Next?           │
│  → Customize branding   │
│  → Invite team          │
│  → Create KB articles   │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- **Navigation Rail:** Collapses to hamburger menu (☰)
- **Single-column:** Stack dashboard content vertically
- **Logo:** Full-width banner (not sidebar)
- **Workspace URL:** Truncate with ellipsis (acme.custo...)
- **Checklist:** Inline with dashboard (not separate pane)

---

## Wireframe 8: Getting Started Checklist

**User Story:** US1.5 (Instant Branded Dashboard - Checklist Component)
**Context:** Part of branded dashboard first view (right pane)
**Goal:** 3 high-impact actions, auto-complete tracking, dismissible

### Layout (Detailed Checklist Component)

```
┌────────────────────────────────────────────┐
│  Getting Started                           │
│                                            │
│  Complete these steps to set up your       │
│  workspace and start supporting customers: │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  □ Set Workspace Branding          │   │
│  │                                    │   │
│  │  Upload your logo and choose       │   │
│  │  brand colors to personalize       │   │
│  │  your workspace.                   │   │
│  │                                    │   │
│  │  [Customize Branding →]            │   │  [Action button]
│  └────────────────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  □ Invite Your First Team Member   │   │
│  │                                    │   │
│  │  Bring in agents and admins to     │   │
│  │  help you support customers.       │   │
│  │                                    │   │
│  │  [Invite Team →]                   │   │  [Action button]
│  └────────────────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  □ Publish Your First KB Article   │   │
│  │                                    │   │
│  │  Create a help article so          │   │
│  │  customers can self-serve.         │   │
│  │                                    │   │
│  │  [Create Article →]                │   │  [Action button]
│  └────────────────────────────────────┘   │
│                                            │
│  ─────────────────────────────────────     │
│                                            │
│  [Dismiss Checklist]                       │  [Text link]
│                                            │
└────────────────────────────────────────────┘
```

### Checklist Items (3 High-Impact Actions)

**Item 1: Set Workspace Branding**
- **Why Important:** Immediate visual ownership (IKEA Effect), white-label readiness
- **Action:** Click "Customize Branding" → Navigate to Settings → Branding
- **Auto-Complete Trigger:** Logo uploaded OR primary color changed
- **Completed State:** Checkbox checked (✓), card background subtle green tint (--success/10)

**Item 2: Invite Your First Team Member**
- **Why Important:** B2B "Aha!" moment (shared state validation), viral growth
- **Action:** Click "Invite Team" → Navigate to Team → Invite Member
- **Auto-Complete Trigger:** First invitation email sent (status: pending or accepted)
- **Completed State:** Checkbox checked (✓), card background subtle green tint

**Item 3: Publish Your First KB Article**
- **Why Important:** Self-service capability, reduces ticket volume
- **Action:** Click "Create Article" → Navigate to Knowledge Base → New Article
- **Auto-Complete Trigger:** First article status changed to "published"
- **Completed State:** Checkbox checked (✓), card background subtle green tint

### Auto-Complete Mechanism (Backend Logic)

**Database Tracking:**
```typescript
// Table: workspace_onboarding_checklist
{
  tenant_id: uuid (FK to tenants table)
  branding_completed: boolean (default false)
  team_invite_completed: boolean (default false)
  kb_article_completed: boolean (default false)
  dismissed_at: timestamp | null (null = visible, timestamp = hidden)
}

// Update triggers (examples)
ON branding.logo_url UPDATE OR colors.primary UPDATE:
  SET branding_completed = true WHERE tenant_id = {current_tenant}

ON tenant_users INSERT WHERE role IN ('admin', 'agent'):
  SET team_invite_completed = true WHERE tenant_id = {current_tenant}

ON kb_articles INSERT WHERE status = 'published':
  SET kb_article_completed = true WHERE tenant_id = {current_tenant}
```

**UI State Management:**
```typescript
// Frontend query (load checklist state)
const { data: checklist } = useQuery({
  queryKey: ['onboarding-checklist', tenantId],
  queryFn: () => client.workspace.getOnboardingChecklist(),
});

// Render logic
if (checklist.dismissed_at) {
  return null; // Don't show checklist
}

return (
  <ChecklistCard>
    {checklist.branding_completed ? <CheckedItem /> : <UncheckedItem />}
    {checklist.team_invite_completed ? <CheckedItem /> : <UncheckedItem />}
    {checklist.kb_article_completed ? <CheckedItem /> : <UncheckedItem />}
  </ChecklistCard>
);
```

### Dismissal Behavior

**User Action: Click "Dismiss Checklist"**
- **Confirmation:** No modal, immediate dismissal
- **Database:** `UPDATE workspace_onboarding_checklist SET dismissed_at = NOW()`
- **UI Effect:** Checklist card fades out (200ms fade animation), removed from DOM
- **Persistence:** Never shows again (user can manually navigate to actions)

**Re-Enable Checklist (Future Phase 2):**
- Settings → Onboarding → [Show Getting Started Checklist Again]
- Sets `dismissed_at = NULL`

### Design Specifications

**Checklist Card Container:**
- Width: 100% of right pane (flexible, min 280px)
- Background: --background (white)
- Border: 1px --border (gray-300)
- Padding: 24px (space-6)
- Rounded: 6px (rounded-md)

**Checklist Item Card:**
- Background: --muted (gray-50)
- Border: 1px --border (gray-300)
- Padding: 16px (space-4)
- Rounded: 4px (rounded-sm)
- Margin-bottom: 12px (space-3) between items

**Completed Item Card:**
- Background: hsl(var(--success) / 0.1) (subtle green tint)
- Border: 1px hsl(var(--success) / 0.3) (green border)
- Checkbox: ✓ (green checkmark, --success color)

**Typography:**
- Checklist heading: Inter, 18px (lg), 600 weight, --foreground
- Intro text: Inter, 14px (sm), 400 weight, --muted
- Item title: Inter, 16px (base), 500 weight, --foreground
- Item description: Inter, 14px (sm), 400 weight, --muted
- Action button: Inter, 14px (sm), 500 weight, --primary color

**Checkbox:**
- Size: 20px x 20px
- Border: 2px --border (gray-400)
- Unchecked: Empty square (□)
- Checked: Filled green with white checkmark (✓)

**Action Buttons:**
- Style: Text link with arrow (→)
- Color: --primary (brand color)
- Hover: Underline + darken by 10%
- Focus: 2px --ring outline

**Dismiss Link:**
- Style: Text link (no arrow)
- Color: --muted (gray-600)
- Font size: Inter, 12px (xs), 400 weight
- Hover: Underline

**Accessibility:**
- Semantic HTML: `<section role="complementary" aria-labelledby="checklist-heading">`
- Checkbox: `<input type="checkbox" disabled checked={completed}>`
- Action buttons: `<a href="/settings/branding" aria-label="Customize workspace branding">`
- Dismiss link: `<button onClick={dismissChecklist} aria-label="Dismiss getting started checklist">`

### Mobile Optimization

```
┌─────────────────────────┐
│  Getting Started        │
│                         │
│  Complete these steps:  │
│                         │
│  □ Set Branding         │
│  Upload logo and        │
│  choose colors.         │
│  [Customize →]          │
│                         │
│  □ Invite Team          │
│  Bring in agents to     │
│  help support.          │
│  [Invite →]             │
│                         │
│  □ Publish KB Article   │
│  Create help content    │
│  for self-service.      │
│  [Create →]             │
│                         │
│  [Dismiss]              │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Shorter intro text ("Complete these steps:" vs full sentence)
- Shorter item descriptions (1-2 lines max)
- Full-width action buttons (not inline links)
- Smaller font sizes (heading 16px, body 13px)

---

## Interaction Specifications

### Keyboard Shortcuts

**Global Shortcuts (Available Everywhere):**
- `Tab` - Navigate between form fields, buttons, links
- `Enter` - Submit form (when focused on submit button)
- `Esc` - Cancel modal (error modals only, not provisioning modal)

**Form Field Shortcuts:**
- `Tab` - Move to next field
- `Shift + Tab` - Move to previous field
- `Ctrl/Cmd + A` - Select all text in current field
- `Ctrl/Cmd + C/V` - Copy/paste (standard browser behavior)

**URL Suggestion Chips:**
- `Tab` - Focus next suggestion chip
- `Enter` - Select focused suggestion chip (auto-fill form)

**Getting Started Checklist:**
- No keyboard shortcuts (mouse/touch-driven for simplicity in Phase 1)

### Form Validation Timing

**Real-Time Validation (Async):**
- **URL Availability:** Debounced 300ms after last keystroke
- **API Endpoint:** `GET /api/workspaces/check-url?slug={value}`
- **Race Condition Protection:** Request ID tracking, only latest response processed

**On-Blur Validation (Sync):**
- **Email Format:** HTML5 email validation
- **Password Match:** Compare Password vs Confirm Password
- **Required Fields:** Check for non-empty value

**On-Submit Validation (Sync + Async):**
- **Client-Side:** All required fields filled, URL available, passwords match
- **Server-Side:** Final URL availability check (prevent race conditions)
- **Server-Side:** Email uniqueness check (prevent duplicate accounts)

### Auto-Save Behavior (Progress Persistence - US1.4)

**Trigger:**
- Keystroke pause (500ms debounce) on any form field

**Storage:**
```typescript
// localStorage key
const STORAGE_KEY = `workspace-setup-draft-${email || 'anonymous'}`;

// Saved data structure
interface DraftData {
  workspaceName: string;
  workspaceUrl: string;
  adminName: string;
  email: string;
  // Passwords excluded for security
  timestamp: number; // Last save timestamp
}
```

**Restore Logic:**
- On page load, check localStorage for `workspace-setup-draft-*`
- If found and `timestamp` < 24 hours old, show "Continue Setup" banner
- If user clicks "Continue Setup", auto-fill form (except passwords)
- If user clicks "Start Fresh", clear localStorage and show empty form

### Optimistic UI Patterns

**URL Validation:**
- **User Types:** Show instant feedback (no spinner initially)
- **Debounce Triggers:** Show "Checking..." spinner
- **API Response:** Update to "Available" or "Taken" (no page reload)

**Provisioning Progress:**
- **Submit Click:** Immediately show provisioning modal (no delay)
- **Step Completion:** Update progress bar and checkmarks in real-time
- **Final Step:** Show "Redirecting..." message (no spinner)
- **Redirect:** Browser navigates to `{slug}.customerdeskai.com` (perceived as instant)

**Total Perceived Latency:** <200ms from submit click to provisioning modal visible (NFR-1)

---

## Technical Implementation Notes

### Frontend Architecture (Next.js 16 + React 19)

**Page Structure:**
```
/app/onboarding/page.tsx                  # Wireframe 1: Landing Page
/app/onboarding/create/page.tsx           # Wireframe 2: Workspace Creation Form
/app/[tenant]/dashboard/page.tsx          # Wireframe 7: Branded Dashboard
/components/onboarding/                   # Shared components
  - WorkspaceForm.tsx                     # Form component with validation
  - URLInput.tsx                          # Split input with real-time check
  - SuggestionChips.tsx                   # Smart conflict resolution
  - ProvisioningModal.tsx                 # Progress indicator
  - ErrorModal.tsx                        # Error recovery
/components/dashboard/
  - GettingStartedChecklist.tsx           # Wireframe 8: Checklist
  - WelcomeCard.tsx                       # Dashboard welcome message
```

**State Management:**
- **Form State:** React Hook Form (uncontrolled components, validation)
- **URL Validation:** TanStack Query (async state, caching, race condition protection)
- **Provisioning Progress:** Zustand (global state, modal visibility, step tracking)
- **Checklist State:** TanStack Query (server state, auto-complete tracking)

**API Routes (oRPC Procedures):**
```typescript
// packages/api/src/routers/workspace.ts
export const workspaceRouter = {
  // US1.3: URL availability check
  checkUrl: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const exists = await db.query.tenants.findFirst({
        where: eq(tenants.slug, input.slug),
      });

      if (exists) {
        return {
          available: false,
          suggestions: generateSmartSuggestions(input.slug)
        };
      }

      return { available: true };
    }),

  // US1.1, US1.2: Atomic workspace creation
  create: publicProcedure
    .input(z.object({
      workspaceName: z.string().min(3).max(100),
      workspaceUrl: z.string().min(3).max(50),
      adminName: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(12),
    }))
    .handler(async ({ input }) => {
      // See Compensating Transaction Pattern below
    }),

  // US1.5: Checklist state query
  getOnboardingChecklist: protectedProcedure
    .handler(async ({ context }) => {
      return await db.query.workspaceOnboardingChecklist.findFirst({
        where: eq(workspaceOnboardingChecklist.tenantId, context.session.tenantId),
      });
    }),

  // US1.5: Dismiss checklist
  dismissChecklist: protectedProcedure
    .handler(async ({ context }) => {
      await db.update(workspaceOnboardingChecklist)
        .set({ dismissedAt: new Date() })
        .where(eq(workspaceOnboardingChecklist.tenantId, context.session.tenantId));
    }),
};
```

### Backend Architecture (Elysia + oRPC)

**Compensating Transaction Pattern (US1.2: Fail-Safe Atomic Provisioning):**

```typescript
// packages/api/src/routers/workspace.ts
async function createWorkspaceAtomic(input: WorkspaceCreateInput): Promise<CreateResult> {
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    // Step 1: Provision Tenant (Nile)
    const tenant = await nile.tenants.create({
      name: input.workspaceName,
      slug: input.workspaceUrl,
    });
    tenantId = tenant.id;

    // Step 2: Create Admin User (Better-Auth)
    const user = await auth.createUser({
      email: input.email,
      password: input.password,
      name: input.adminName,
    });
    userId = user.id;

    // Step 3: Assign Ownership (tenant_users linkage)
    await db.insert(tenantUsers).values({
      tenantId: tenantId,
      userId: userId,
      role: 'owner',
    });

    // Step 4: Initialize Session
    const session = await auth.createSession({ userId });

    return { success: true, tenantId, sessionToken: session.token };

  } catch (error) {
    // ROLLBACK LOGIC (Compensating Transaction)
    if (userId) {
      await auth.deleteUser(userId); // Rollback Step 2
    }
    if (tenantId) {
      await nile.tenants.delete(tenantId); // Rollback Step 1
    }

    throw new Error(`Workspace creation failed: ${error.message}`);
  }
}
```

**Smart URL Suggestion Algorithm:**

```typescript
function generateSmartSuggestions(slug: string): string[] {
  const suffixes = ['-support', '-cs', '-help'];
  const suggestions: string[] = [];

  for (const suffix of suffixes) {
    const candidate = `${slug}${suffix}`;
    const exists = await db.query.tenants.findFirst({
      where: eq(tenants.slug, candidate),
    });

    if (!exists) {
      suggestions.push(candidate);
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions;
}
```

### Database Schema (Drizzle ORM)

**New Tables Required:**

```typescript
// packages/db/src/schema/onboarding.ts

// Tracks checklist state per workspace
export const workspaceOnboardingChecklist = pgTable('workspace_onboarding_checklist', {
  tenantId: uuid('tenant_id').primaryKey(),
  brandingCompleted: boolean('branding_completed').default(false).notNull(),
  teamInviteCompleted: boolean('team_invite_completed').default(false).notNull(),
  kbArticleCompleted: boolean('kb_article_completed').default(false).notNull(),
  dismissedAt: timestamp('dismissed_at'), // null = visible, timestamp = hidden
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Triggers for auto-complete (PostgreSQL functions)
// 1. ON branding.logo_url UPDATE OR colors.primary UPDATE
//    → SET branding_completed = true
// 2. ON tenant_users INSERT WHERE role IN ('admin', 'agent')
//    → SET team_invite_completed = true
// 3. ON kb_articles INSERT WHERE status = 'published'
//    → SET kb_article_completed = true
```

### CSS Variable Injection (White-Label Theming)

**Next.js 16 Middleware (apps/web/src/middleware.ts):**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Fetch workspace branding from database
  const workspace = await db.query.tenants.findFirst({
    where: eq(tenants.slug, subdomain),
    columns: {
      id: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
    },
  });

  if (!workspace) {
    return NextResponse.next(); // Subdomain not found, serve default
  }

  // Inject CSS variables into response
  const response = NextResponse.next();
  response.headers.set('X-Tenant-ID', workspace.id);
  response.headers.set('X-Tenant-Slug', workspace.slug);

  // CSS injection happens in layout.tsx via server component
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Root Layout (apps/web/src/app/layout.tsx):**

```typescript
export default async function RootLayout({ children }) {
  const tenantId = headers().get('X-Tenant-ID');
  const workspace = await getWorkspaceBranding(tenantId);

  const cssVariables = `
    :root {
      --primary: ${workspace.primaryColor || '220 90% 56%'};
      --accent: ${workspace.accentColor || '340 82% 52%'};
    }
  `;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Performance Constraint:** CSS injection <50ms (NFR from architecture.md)

### Accessibility Implementation

**ARIA Live Regions:**
```tsx
// URL validation feedback (polite, non-blocking)
<div aria-live="polite" aria-atomic="true">
  {validationState === 'available' && '✓ Available'}
  {validationState === 'taken' && '✗ Already taken. Try one of these:'}
  {validationState === 'checking' && '⚙ Checking availability...'}
</div>

// Provisioning progress (assertive, interrupts screen reader)
<div role="status" aria-live="assertive" aria-atomic="true">
  Creating your workspace, step {currentStep} of 4: {stepName}
</div>

// Error messages (assertive, immediate announcement)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**Keyboard Navigation:**
- All interactive elements focusable via Tab
- Focus indicators: 2px --ring outline (blue-500)
- Skip links: "Skip to workspace creation form" (hidden until focused)
- Form submission: Enter key submits form (when valid)

**Screen Reader Testing Checklist:**
- [ ] NVDA (Windows) - Form navigation, validation feedback
- [ ] JAWS (Windows) - Error announcements, progress updates
- [ ] VoiceOver (macOS) - Checklist interaction, modal focus trap

---

## Appendix: Design Decisions Log

### Why 6 Fields Maximum? (US1.1)

**Research:** Zendesk data shows 20% drop-off per 30s in onboarding flows
**Calculation:** 6 fields × 5s avg fill time = 30s total input time + 15s validation/submit = 45s (under 60s target)
**Decision:** Remove timezone/language from onboarding form, use browser defaults (safer than IP geolocation)

### Why No Password Strength Meter? (Phase 1)

**Rationale:** Better-Auth enforces 12-char minimum server-side (adequate security)
**User Research:** Strength meters add cognitive load without improving actual security (users choose predictable patterns like "Password123!!")
**Phase 2 Consideration:** Add zxcvbn-based strength meter if user testing shows confusion

### Why Settings Page Instead of Modal? (Phase 1)

**Design Philosophy:** Validate usage patterns before optimizing (modal slide-over is premature optimization)
**Technical Constraint:** Dedicated page simpler to implement (no modal state management complexity)
**User Testing Plan:** Track settings page usage in Phase 1, migrate to modal slide-over in Phase 2 if justified by data

### Why 3-Pane Layout for Empty Dashboard?

**UX Principle:** Spatial Safety (Hick's Law) - users build mental map on Day 1, applies for 100+ days
**Research:** Email client pattern battle-tested for 20+ years (Apple Mail, Superhuman)
**Decision:** Show 3-pane structure even when empty, use empty states to explain future content ("No tickets yet...")

### Why Auto-Redirect After Provisioning? (No Success Page)

**Peak-End Rule:** Final interaction should be most rewarding (branded dashboard > generic "Success!" page)
**User Research:** Users expect to "land" in the product after signup, not see intermediary confirmation
**Technical:** Session cookie set during Step 4, redirect to `{slug}.customerdeskai.com` seamless (same domain, no re-auth)

---

**End of Wireframes Document**

This comprehensive wireframe specification covers all user stories in Epic 1: Frictionless Workspace Activation, with detailed visual layouts, interaction specifications, and technical implementation notes. All designs align with UX requirements (<60s time-to-value, warm minimalism, pre-flight safety, absolute trust) and technical constraints (subdomain routing, CSS variable injection <50ms, compensating transactions for atomic provisioning).
