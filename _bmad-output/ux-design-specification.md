---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - '_bmad-output/prd.md'
workflowType: 'ux-design'
lastStep: 7
project_name: 'CustomerDeskAI'
user_name: 'Davidu'
date: '2025-12-22'
---

# UX Design Specification CustomerDeskAI

**Author:** Davidu
**Date:** 2025-12-22

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

**CustomerDeskAI** is a white-label, multi-tenant customer support platform designed for the LATAM market with a **<60-second time-to-value North Star metric**. This constraint is evidence-based: Zendesk data shows 20% user drop-off for every additional 30 seconds in onboarding flows. We treat this as an aspirational goal, not a hard technical constraint.

The product philosophy is **"Interaction-First MVP"**: prioritize the core support loop (ticket creation → agent response → resolution) over management features. The UX strategy moves **beyond SaaS standards** to focus on **intentionality, spatial consistency, and the elimination of cognitive friction**.

**Core UX Principle:** Mental Bandwidth Recovery  
Users aren't seeking features—they're seeking **clarity**. The ability to "close the tab" with confidence that nothing is leaking. The UI should feel like a calm workspace, not a notification dashboard.

**Phase 1 Strategic Scope:**
- **Languages**: Spanish (es-LA) + English (en-US). Brazil/Portuguese deferred to Phase 2 due to localization and fiscal complexity
- **Payment**: Stripe (international credit cards) + Mercado Pago (LATAM trust). No Pix/Boleto/OXXO in Phase 1
- **WhatsApp**: Visual UI patterns ONLY (chat bubbles, status checkmarks). No WhatsApp Business API integration (multi-month compliance overhead)
- **Real-Time Features**: Deferred to Phase 2. Use optimistic UI updates + short polling for "illusion of real-time" without WebSocket infrastructure

### Target Users

**Primary Personas (MVP Focus):**

**1. Workspace Owner - Sarah Chen (Sale)**
- **Context**: Head of Customer Success at 25-person SaaS startup, overwhelmed by scattered support channels
- **Emotional State**: Exhausted, skeptical, needs something that works "tonight"
- **Technical Ability**: Self-service capable, zero tolerance for complexity
- **Device Usage**: Desktop-first for setup, expects immediate branded results
- **Success Metric**: Create workspace, invite team, feel productive in <5 minutes
- **UX Priority**: Onboarding flow, branding settings, invitation system

**2. Invited Agent - Priya Patel (Retention)**
- **Context**: Junior Support Agent (2 months), impostor syndrome about breaking things
- **Emotional State**: Anxious, wants clear role boundaries
- **Technical Ability**: Needs role-scoped UI showing only safe actions
- **Device Usage**: Desktop-first for tickets, wants keyboard shortcuts
- **Success Metric**: Resolve first ticket confidently without fear
- **UX Priority**: Ticket resolution interface, auto-save, error prevention
- **Rationale**: If Priya's experience is poor, the product churns in 30 days regardless of Sarah's satisfaction

**Secondary Persona (Sarah-lite):**

**3. Invited Admin - Marcus Webb**
- **Context**: Senior Support Agent (3 years), burned by complex "enterprise tools"
- **Emotional State**: Skeptical but becomes internal champion if frictionless
- **Technical Ability**: Mobile-first power user (midnight invitation reviews)
- **Device Usage**: Mobile for triage/consumption, desktop for production
- **Success Metric**: Accept invitation on mobile, invite agents within 2 minutes
- **UX Treatment**: Treat as "Sarah with fewer permissions" - same onboarding patterns, just role-scoped

### Key Design Challenges

**1. Spatial Information Architecture (The 3-Pane Rule)**
- **Challenge**: <2-click access to any setting/ticket while maintaining hierarchy
- **Solution**: Persistent Navigation Rail | List View | Focused Detail layout
- **Settings Strategy**: Start with dedicated settings PAGE (not modal) for Phase 1. Modal slide-over is Phase 2 optimization after validating usage patterns
- **Principle**: Eliminate pogo-sticking, keep mental map anchored
- **Technical Validation**: Battle-tested email client pattern, low implementation risk

**2. Optimistic UI (Phase 1) → Real-Time Presence (Phase 2)**
- **Phase 1 Approach**: Short polling (15-30s intervals) + optimistic UI updates. When Priya picks a ticket, UI immediately shows "Assigned to Priya" without waiting for server confirmation
- **Phase 2 Evolution**: WebSocket-based "Ghost Avatar" presence (50% opacity avatars, gentle pulse when typing)
- **Rationale**: Avoid WebSocket infrastructure complexity × N tenants in MVP. Illusion of real-time is sufficient for validation
- **Principle**: Perceived responsiveness > actual real-time

**3. Safety via Pre-flight Design (Poka-yoke)**
- **Challenge**: Reduce Priya's anxiety without limiting capabilities
- **Solution**: State persistence + visual consequence preview. Button shakes if missing required field. Auto-save everywhere
- **Examples**:
  - Resolve ticket without replying? Button disabled + hint: "Add reply before resolving"
  - Delete article referenced in tickets? Warning: "3 tickets link to this article. Archive instead?"
  - Close tab with unsaved draft? Browser `beforeunload` warning + localStorage persistence
- **Principle**: Error-proofing through design, not error messages

**4. Warm Minimalism (The LATAM Tone)**
- **Challenge**: Bilingual UI (Spanish/English) maintaining relational heat
- **Solution**: High-quality typography (Inter/SF Pro) + generous whitespace + color as signal
- **Copy Examples**:
  - English: "Marcus is helping with this ticket"
  - Spanish: "Marcus está ayudando con este ticket" (not "Asignado a Marcus")
- **Status Indicators**: WhatsApp-style checkmarks ("enviado", "visto") instead of "Sent", "Read"
- **Principle**: LATAM conversational support over ticket processing
- **Phase 2**: Portuguese (pt-BR) with Brazilian fiscal compliance (Boleto, Pix)

**5. Asymmetric Responsive Design (Thumb-First Pivot)**
- **Challenge**: Mobile for triage, desktop for production
- **Mobile Optimization**: Invitation acceptance page, workspace switcher, ticket queue (list view)
- **Desktop Optimization**: Ticket resolution (threaded conversation + Markdown editor), branding settings, knowledge base authoring
- **Implementation**: Sheet-based mobile navigation (swipe-through), keyboard-optimized desktop (Cmd+K command palette)
- **Principle**: Reorient interaction model per device, not just stack elements

**6. Role-Based Conditional Rendering**
- **Challenge**: Make role promotion feel natural, not jarring
- **Solution**: Same layout structure, conditionally revealed features
- **Progressive Disclosure**: When Priya is promoted to Admin, she sees subtle "New: Invite Team" badge on previously hidden nav item
- **Principle**: Single codebase, progressive disclosure via role. No separate "Agent UI" vs "Admin UI"

### Design Opportunities

**1. WhatsApp Visual Metaphors (No API Integration)**
- **UI Patterns**: Chat-bubble ticket threads, "visto" checkmarks on replies, "last seen" timestamps
- **Implementation**: CSS-based visual design, no WhatsApp Business API connectivity
- **Rationale**: Leverage LATAM muscle memory without multi-month compliance overhead
- **Phase 2**: Evaluate actual WhatsApp integration based on customer demand

**2. Zero-Configuration Onboarding**
- **Smart Defaults**: Timezone from browser (not IP - VPN-safe), language from `navigator.language`
- **Workspace Creation**: Pre-fill workspace name from email domain (`sarah@acme.com` → "Acme Support")
- **Color Defaults**: Provide 6 curated color palettes instead of raw color picker (reduce decision fatigue)
- **Advanced Settings**: Link visible for power users ("Customize timezone manually"), but 90% never click it

**3. Anxiety-Reducing Agent UI (For Priya)**
- **No Destructive Confirmations**: Archive (not delete), soft delete with undo
- **Auto-save Everywhere**: Ticket drafts every 5s, article edits every 10s, settings on blur
- **Clear Recovery**: "Draft saved 5 seconds ago" timestamp, "Restore unsaved draft?" banner on return
- **Disabled State Hints**: Grayed-out "Delete Workspace" button with tooltip: "Owner-only action"
- **Success**: Priya resolves first ticket confidently Day 1 without fear of breaking workspace

**4. Mental Bandwidth Recovery Dashboard**
- **Sarah's View**: "You're caught up" (0 open tickets) or "3 tickets need attention" (with list)
- **Priya's View**: "Your tickets: 2 open, 1 pending customer" (role-scoped, no global workspace noise)
- **No Artificial Urgency**: No red badges, no notification counts, no "SLA breached" panic indicators
- **Calm Status Indicators**: Green checkmark for "caught up", subtle blue dot for "needs attention"
- **Principle**: Dashboard as reflection of control, not chaos. Sarah closes tab with confidence

### Payment Strategy (Phase 1)

**Stripe (International)**
- Credit card processing for US/EU/global customers
- Standard SaaS subscription billing
- No LATAM-specific optimizations in Phase 1

**Mercado Pago (LATAM Trust)**
- Local payment processor with high brand trust in Argentina, Mexico, Chile, Colombia
- Supports credit cards + local payment methods with single integration
- Handles currency conversion (USD → ARS, MXN, CLP, COP)

**Deferred to Phase 2:**
- Pix (Brazil instant payment)
- Boleto bancário (Brazil bank slip)
- OXXO (Mexico cash payment)
- Brazilian fiscal compliance (NF-e invoices)

---

## Core User Experience

### Defining Experience

**The Core Action: The Reply**

The absolute heartbeat of CustomerDeskAI is **Priya hitting "Send" and moving to the next ticket**. This happens 50-100 times per day. Every design decision serves this moment.

**Priority Distinction:**
- **Frictionless** (Onboarding): One-time tax, < 30 seconds, 4 fields maximum
- **Effortless** (Resolution): 50-100x/day, <2 seconds per action, zero cognitive overhead

**The Real MVP: Priya (Agent) for Retention**

Sarah (Owner) gets us the sale. Priya (Agent) determines if we keep the customer. If Priya's experience is poor, the product churns in 30 days regardless of Sarah's satisfaction.

### Platform Strategy

**Primary Platform: Desktop-First (1440px+ optimized)**
- Ticket resolution requires keyboard efficiency and screen real estate
- 3-pane layout (Navigation Rail | Ticket List | Resolution Detail)
- Keyboard shortcuts as first-class citizens (CMD+Enter, CMD+K, /kb)

**Mobile Strategy: Consumption, Not Production**
- Invitation acceptance (sheet-based navigation)
- Workspace switcher (swipe-through)
- Ticket queue triage (list view only)
- NOT optimized for: Ticket resolution, KB authoring, branding settings

### Effortless Interactions

**1. CMD+Enter: Send & Resolve with Auto-Advance**
- Single keyboard shortcut completes ticket and loads next from queue
- Optimistic UI shows resolution immediately (<200ms perceived latency)
- No confirmation dialogs, no page transitions, no loading states

**2. /kb Slash Commands for Knowledge Base**
- Type `/kb` to trigger KB insertion menu
- Progressive proficiency: Sidebar for discovery → /kb for experts
- Auto-complete with fuzzy search, arrow keys to select, Enter to insert

**3. Keystroke Pause Auto-Save (500ms debounce)**
- Save triggered 500ms after typing stops (not timer-based)
- "Draft saved 5 seconds ago" timestamp for confidence
- localStorage persistence prevents tab-close data loss

**4. Split Button Primary Actions**
- `[Send]` | `[Send & Resolve]` dropdown pattern
- Single-click for common action, dropdown for variants
- Clear visual hierarchy (primary button vs secondary options)

**5. Contextual Calm (Role-Scoped Views)**
- Priya sees only her assigned tickets (not workspace noise)
- Sarah sees workspace overview (all agents, all tickets)
- Marcus sees admin-scoped data (invitations, settings, not billing)

### Critical Success Moments

**Priya's First Ticket Resolution (Day 1)**
- Opens ticket → Sees clear customer question
- Types reply in Markdown editor
- Clicks /kb → Inserts KB article link
- Hits CMD+Enter → Ticket resolves, next ticket loads
- Sees "Draft saved 2 seconds ago" → Confidence established
- **Success Metric**: Priya resolves first ticket within 2 minutes without fear

**Sarah's First Agent Invitation (Onboarding)**
- Creates workspace (4 fields: name, email, timezone, language)
- Sees "Invite Your Team" as next action
- Enters Marcus's email → System sends invitation
- Sees "Invitation sent to marcus@acme.com" confirmation
- Closes tab with confidence (nothing leaking, checklist available)
- **Success Metric**: Sarah invites first agent within <60 seconds of workspace creation

**Marcus's Mobile Invitation Acceptance (Retention)**
- Receives email on mobile → Clicks "Accept Invitation"
- Sheet-based flow: Accept → Set password → Welcome
- Immediately sees workspace switcher (swipe between workspaces)
- Sees tablet-optimized ticket queue (triage view)
- **Success Metric**: Marcus accepts invitation on mobile within 2 minutes, feels productive Day 1

**Priya's 100th Ticket (Flow State Validation)**
- Opens ticket #100 → Muscle memory kicks in
- /kb auto-complete shows recent articles
- CMD+Enter → Auto-advance → Next ticket loaded
- Zero cognitive overhead, zero latency perception
- **Success Metric**: Priya resolves tickets at 50-100/day rate by Week 2

**Sarah's "Caught Up" Moment (Mental Bandwidth Recovery)**
- Opens dashboard → Sees "You're caught up" (0 open tickets)
- Green checkmark, calm color palette (no red badges)
- Closes tab with confidence → No anxiety about leaking tickets
- **Success Metric**: Sarah closes tab without FOMO, returns only when needed

### Experience Principles

**1. Zero-Latency Perception**
- Optimistic UI shows result immediately, sync in background
- <200ms perceived latency target for all user actions
- API failures handled gracefully with retry + manual sync option

**2. Keyboard-Centricity**
- CMD+Enter (Send & Resolve), CMD+K (command palette), /kb (KB insert)
- Mouse as backup, keyboard as default for production workflows
- Accessibility: Full keyboard navigation with skip links and focus indicators

**3. Contextual Calm**
- Role-scoped views reduce cognitive noise (Priya sees her tickets, not workspace chaos)
- No artificial urgency (no red badges, no SLA panic indicators)
- "You're caught up" dashboard vs "3 tickets need attention" (specific, not anxiety-inducing)

**4. Progressive Proficiency**
- Sidebar for discovery (KB browsing) → /kb for experts (keyboard flow)
- Auto-advance is default (can disable in settings for non-power users)
- Shortcuts discoverable via tooltips and command palette

**5. Pre-flight Safety (Poka-yoke)**
- Button disabled + hint: "Add reply before resolving"
- Auto-save everywhere (drafts every 500ms after pause, settings on blur)
- Browser `beforeunload` warning + localStorage persistence prevents data loss

**6. Warm Minimalism (LATAM Tone)**
- "Marcus is helping with this ticket" (not "Assigned to Marcus")
- WhatsApp-style "visto" checkmarks (not "Sent", "Read" technical labels)
- Color as signal not decoration (green = caught up, blue dot = needs attention)

---

## Desired Emotional Response

### Primary Emotional Goals (Engineering Neurological States)

**The Inverse Stress Curve Principle**

Legacy tools (Zendesk/Intercom) exhibit **linear stress escalation**: stress increases proportionally with ticket volume. CustomerDeskAI inverts this curve through **stress absorption architecture**. As ticket volume increases, the system's spatial consistency, optimistic UI, and auto-advance patterns reduce cognitive load, allowing users to enter flow state rather than panic mode.

**Core Emotional States (By Persona):**

1. **Priya (Agent): Mastery → Flow**
   - **Target State**: Expert competence, not confidence
   - **Neurological Mechanism**: Spatial consistency eliminates "where is it?" lookups, redirecting cognitive resources to "what to say?"
   - **UX Implementation**: Fixed 3-pane layout (Hick's Law), zero page reloads, persistent navigation
   - **Success Metric**: Tool becomes invisible after ticket #20-30

2. **Sarah (Owner): Relief → Clarity**
   - **Target State**: Visual honesty replacing operational blindness
   - **Neurological Mechanism**: High-signal metrics with whitespace prevent information overload
   - **UX Implementation**: "Caught up" (0 tickets) vs "3 tickets need attention" (specific, not red badges)
   - **Success Metric**: Closes tab without FOMO, returns only when needed

3. **Marcus (Admin): Instant Efficacy → Fluidity**
   - **Target State**: Mobile-native power (WhatsApp familiarity + terminal capability)
   - **Neurological Mechanism**: Sheet-based mobile navigation, role-scoped permissions
   - **UX Implementation**: Invitation acceptance on mobile <2 minutes, immediate workspace switching
   - **Success Metric**: Productive Day 1 without desktop dependency

### Emotional Journey Mapping (Neurological Checkpoints)

**Discovery → Skepticism to Curiosity**
- **State**: Sarah arrives exhausted, burned by complex tools
- **Intervention**: <60s TTV (evidence-based: 20% drop-off per 30s)
- **Emotion**: "This might actually work tonight"

**Core Experience → Anxiety to Flow**
- **State**: Priya's first ticket (impostor syndrome, fear of breaking workspace)
- **Intervention**: Pre-flight design (button disabled + hint, not error messages)
- **Emotion**: Confidence from safety rails, not restriction

**Post-Task → Drained to Unburdened**
- **State**: Priya after 50 tickets
- **Intervention**: Peak-End Rule optimization ("Caught Up" screen with physics-based settling animation)
- **Emotion**: Neuro-chemical reward replacing queue anxiety

**Error State → Panic to Trust**
- **State**: Network failure during auto-advance
- **Intervention**: Draft persistence (eliminate Zeigarnik Effect), optimistic UI with graceful retry
- **Emotion**: Absolute trust (nothing leaks, auto-save everywhere)

**Return Visit → FOMO to Calm**
- **State**: Sarah checking dashboard
- **Intervention**: Zero-Gravity UX (no red badges, no SLA countdowns)
- **Emotion**: Intentional calm, focus engine vs panic machine

### Micro-Emotions (Functional Constraints)

**Confidence ← Trust**
- **Source**: Draft Persistence (no "Save" button, saved 500ms after pause)
- **Implementation**: "Draft saved 5 seconds ago" timestamp
- **Avoids**: Zeigarnik Effect (anxiety of unfinished tasks)

**Accomplishment ← Closure**
- **Source**: Peak-End Rule (final interaction is most rewarding)
- **Implementation**: "Caught Up" screen with green checkmark, subtle settling animation
- **Avoids**: Infinite queue dread

**Mastery ← Spatial Safety**
- **Source**: Fixed 3-pane architecture (Hick's Law)
- **Implementation**: Navigation Rail | List View | Detail (never moves)
- **Avoids**: Cognitive load from "where did it go?" lookups

**Pride ← Ownership**
- **Source**: IKEA Effect (user customization = higher valuation)
- **Implementation**: Brand identity (logo/colors) instantly visible across platform
- **Avoids**: Generic SaaS feel

**Efficacy ← Fluidity**
- **Source**: Keyboard-first design for production workflows
- **Implementation**: CMD+Enter (Send & Resolve), /kb (insert KB), CMD+K (command palette)
- **Avoids**: Mouse-driven friction in high-volume contexts

**Serenity ← Visual Honesty**
- **Source**: High-signal metrics with generous whitespace
- **Implementation**: Role-scoped views (Priya sees her tickets, not workspace chaos)
- **Avoids**: Information overload, vanity metrics

### Design Implications (Non-Functional Requirements)

**NFR-1: Eliminate Uncertainty**
- **Constraint**: <200ms perceived latency for all user actions
- **Implementation**: Optimistic UI (show result immediately, sync in background)
- **Validation**: Network latency simulator shows <5% user-perceived failures

**NFR-2: Reward Closure**
- **Constraint**: Neuro-chemical reward via Peak-End Rule
- **Implementation**: "Caught Up" sequence (green checkmark, physics-based settling animation, calm color palette)
- **Validation**: A/B test shows 25% increase in return visit satisfaction

**NFR-3: Spatial Safety**
- **Constraint**: Fixed 3-pane architecture to minimize cognitive load (Hick's Law)
- **Implementation**: Navigation Rail | List View | Detail (persistent, no modals for core flows)
- **Validation**: Eye-tracking shows <10% fixation time on navigation after ticket #30

**NFR-4: Prioritize Serenity**
- **Constraint**: High-signal metrics with whitespace (Mental Bandwidth Recovery)
- **Implementation**: Role-scoped dashboards, no red badges, no artificial urgency
- **Validation**: User reports "ability to close tab with confidence"

**NFR-5: Absolute Trust**
- **Constraint**: Zero data loss perception (eliminate Zeigarnik Effect)
- **Implementation**: Auto-save every 500ms after pause, localStorage persistence, browser `beforeunload` warning
- **Validation**: User never sees "Are you sure?" dialogs, drafts always recoverable

### Emotional Design Principles (Engineering Guidelines)

**1. Zero-Gravity UX**
- **Definition**: Every interaction feels "light" (no heavy page reloads, no loading states, no confirmation dialogs)
- **Implementation**: Optimistic UI, auto-advance, split button primary actions
- **Measurement**: Time-to-action <2s for all core flows

**2. Relational Proximity (LATAM Factor)**
- **Definition**: Human-centric copy replaces robotic terminology
- **Implementation**: "Marcus is helping with this ticket" (not "Assigned to Marcus"), "visto" checkmarks (not "Read")
- **Measurement**: Copy A/B tests show 15% higher emotional resonance in LATAM markets

**3. Professional Pride (Referral Emotion)**
- **Definition**: Competitive advantage through calm (not delight from pretty icons)
- **Implementation**: 50-100 tickets/day flow state capability, keyboard-first efficiency
- **Measurement**: NPS question: "Does this tool make you better at your job?" (target >50)

**4. Visual Honesty**
- **Definition**: High-signal metrics, no vanity metrics
- **Implementation**: "0 open tickets" (not "98% satisfaction rate"), "3 tickets need attention" (not "247 total tickets")
- **Measurement**: Dashboard shows actionable data only, <5 metrics visible

**5. Intentional Calm**
- **Definition**: Focus engine vs panic machine
- **Implementation**: No red badges, no SLA countdowns, green checkmark for "caught up", blue dot for "needs attention"
- **Measurement**: User stress levels decrease as ticket volume increases (Inverse Stress Curve validation)

**6. Progressive Mastery**
- **Definition**: Tool becomes invisible as user gains expertise
- **Implementation**: Sidebar discovery → /kb slash commands, mouse backup → keyboard default
- **Measurement**: Keyboard shortcut usage increases 80% by Week 2

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Linear: Optimistic UI Architecture**

**Pattern Excellence:**
- **Instant feedback**: UI updates immediately before server confirmation
- **Perceived latency**: <50ms for all interactions, async sync in background
- **Error handling**: Graceful rollback with inline retry, no full-page errors
- **Success factor**: Users trust the tool because it never "hangs"

**Transferable to CustomerDeskAI:**
- Priya hits CMD+Enter → Ticket resolves instantly, next ticket loads
- Auto-advance shows optimistic state, background sync confirms
- Network failure → Draft persists, retry UI appears inline
- **Critical Constraint**: <200ms perceived latency target (NFR-1)

**Superhuman: Keyboard-Driven Flow State**

**Pattern Excellence:**
- **CMD+K command palette**: Universal entry point for all actions
- **Keyboard shortcuts as primary interface**: Mouse as backup, not default
- **Progressive disclosure**: Shortcuts visible in tooltips, discoverable via CMD+K
- **Muscle memory optimization**: Spatial consistency allows "eyes-closed" navigation

**Transferable to CustomerDeskAI:**
- CMD+Enter (Send & Resolve), CMD+K (command palette), /kb (KB insert)
- Keyboard-first design for 50-100 tickets/day production workflows
- Auto-complete with fuzzy search (arrow keys to select, Enter to insert)
- **Critical Constraint**: Keyboard shortcuts for all core flows (Experience Principle #2)

**WhatsApp: Relational Metaphors (LATAM Trust Factor)**

**Pattern Excellence:**
- **Chat bubbles**: Threaded conversations feel human, not transactional
- **Status receipts**: "enviado" (sent), "visto" (read) build confidence
- **Last seen timestamps**: Presence without real-time infrastructure
- **Familiar muscle memory**: LATAM users already know this interaction model

**Transferable to CustomerDeskAI:**
- Ticket threads as chat bubbles (not tables or lists)
- "visto" checkmarks on replies (not "Read" technical labels)
- "Marcus is helping with this ticket" (not "Assigned to Marcus")
- **Critical Constraint**: Warm Minimalism (LATAM Tone) - Emotional Design Principle #2

**Modern Mail Clients (Apple Mail, Superhuman): 3-Pane Spatial Layout**

**Pattern Excellence:**
- **Persistent navigation**: Navigation Rail never moves, always visible
- **Dual list/detail view**: Inbox list + focused email detail
- **Zero pogo-sticking**: <2 clicks to any email, no back-button navigation
- **Mental map stability**: Brain learns spatial positions, stops "looking"

**Transferable to CustomerDeskAI:**
- Navigation Rail | Ticket List | Resolution Detail (fixed positions)
- Priya's brain maps "tickets are always center-left, detail always right"
- Settings page (not modal) in Phase 1, modal slide-over in Phase 2
- **Critical Constraint**: Fixed 3-pane architecture (NFR-3: Spatial Safety)

### Transferable UX Patterns

**Navigation Patterns**

**1. Persistent 3-Pane Layout (from Mail Clients)**
- **Pattern**: Navigation Rail (left, 60px) | List View (center, 320px) | Focused Detail (right, flexible)
- **Problem it solves**: Eliminates pogo-sticking, maintains mental map
- **Implementation**: Fixed positions, no modals for core flows, settings page in Phase 1
- **Validation**: Eye-tracking shows <10% fixation time on navigation after ticket #30 (NFR-3)

**2. CMD+K Command Palette (from Superhuman)**
- **Pattern**: Universal search/action launcher via keyboard shortcut
- **Problem it solves**: Discovery of features, progressive proficiency (sidebar → keyboard)
- **Implementation**: Fuzzy search across tickets, KB articles, settings, actions
- **Validation**: Keyboard shortcut usage increases 80% by Week 2 (Emotional Design Principle #6)

**Interaction Patterns**

**3. Optimistic UI with Graceful Rollback (from Linear)**
- **Pattern**: Show result immediately, sync in background, rollback on failure
- **Problem it solves**: Eliminates perceived latency, builds trust
- **Implementation**: Auto-advance shows next ticket immediately, background sync confirms
- **Validation**: Network latency simulator shows <5% user-perceived failures (NFR-1)

**4. Slash Commands for Contextual Actions (from Slack, Notion)**
- **Pattern**: Type `/` to trigger action menu in text input
- **Problem it solves**: Keyboard flow for KB insertion, maintains typing context
- **Implementation**: `/kb` triggers KB insertion menu with fuzzy search
- **Validation**: Progressive proficiency (sidebar discovery → /kb experts)

**5. Keystroke Pause Auto-Save (from Google Docs)**
- **Pattern**: Save triggered 500ms after typing stops (not timer-based)
- **Problem it solves**: Eliminates Zeigarnik Effect (anxiety of unfinished tasks)
- **Implementation**: "Draft saved 5 seconds ago" timestamp, localStorage persistence
- **Validation**: User never sees "Are you sure?" dialogs (NFR-5: Absolute Trust)

**Visual Patterns**

**6. Chat Bubble Threaded Conversations (from WhatsApp, iMessage)**
- **Pattern**: Messages displayed as bubbles, visually grouped by sender
- **Problem it solves**: Human-centric ticket threads, LATAM muscle memory
- **Implementation**: Customer messages (left-aligned bubbles), agent replies (right-aligned)
- **Validation**: Copy A/B tests show 15% higher emotional resonance in LATAM markets

**7. Status Receipts as Trust Signals (from WhatsApp)**
- **Pattern**: Visual checkmarks ("enviado", "visto") for message status
- **Problem it solves**: Builds confidence, reduces "did it send?" anxiety
- **Implementation**: Single checkmark (sent), double checkmark (delivered), "visto" (read)
- **Validation**: User trust measured via "Does this tool make you better at your job?" NPS

**8. High-Signal Dashboard with Whitespace (from Linear, Height)**
- **Pattern**: <5 metrics visible, generous whitespace, calm color palette
- **Problem it solves**: Mental Bandwidth Recovery, Visual Honesty (no vanity metrics)
- **Implementation**: "0 open tickets" or "3 tickets need attention" (specific counts)
- **Validation**: User reports "ability to close tab with confidence" (NFR-4)

### Anti-Patterns to Avoid

**Information Density (Zendesk, Intercom)**
- **Anti-pattern**: 20+ UI elements per screen, dense tables, cramped spacing
- **Problem**: Cognitive overload, visual scanning fatigue
- **Our approach**: <5 dashboard metrics, generous whitespace, role-scoped views
- **Principle violated**: Serenity (Mental Bandwidth Recovery)

**Nested-Tab Fatigue (Zendesk Multi-Tab UI)**
- **Anti-pattern**: Tickets open in nested tabs, settings in sub-tabs
- **Problem**: Pogo-sticking, "where am I?" disorientation, lost mental map
- **Our approach**: Fixed 3-pane layout, settings page (not nested tabs) in Phase 1
- **Principle violated**: Spatial Safety (Hick's Law)

**Notification Anxiety (Red Badge Overload)**
- **Anti-pattern**: Red badges on every nav item, flashing SLA countdowns
- **Problem**: Artificial urgency, panic-driven UI, infinite todo list
- **Our approach**: Green checkmark ("caught up"), blue dot ("needs attention"), no red badges
- **Principle violated**: Intentional Calm (Focus Engine vs Panic Machine)

**Modal Hell (Intercom Settings)**
- **Anti-pattern**: Settings in stacked modals, 3-4 layers deep
- **Problem**: Lost context, "how do I get back?" confusion, slow load times
- **Our approach**: Dedicated settings PAGE in Phase 1, modal slide-over in Phase 2
- **Principle violated**: Zero-Gravity UX (lightweight interactions)

**Auto-Refresh Chaos (Zendesk Live Updates)**
- **Anti-pattern**: Full page reloads on ticket updates, scroll position lost
- **Problem**: Jarring interruptions, breaks flow state, cognitive reset
- **Our approach**: Optimistic UI + short polling (15-30s), no page reloads
- **Principle violated**: Progressive Mastery (tool becomes invisible)

**Generic SaaS Branding (Help Scout Default Theme)**
- **Anti-pattern**: No workspace customization, blue/gray generic palette
- **Problem**: No IKEA Effect, low perceived ownership
- **Our approach**: Brand identity (logo/colors) visible immediately, 6 curated palettes
- **Principle violated**: Professional Pride (Ownership emotion)

### Design Inspiration Strategy

**What to Adopt (Direct Implementation)**

1. **Linear's Optimistic UI**: Implement <200ms perceived latency target (NFR-1)
   - Auto-advance shows next ticket immediately, background sync confirms
   - Network failures handled with inline retry, no full-page errors

2. **Superhuman's CMD+K Palette**: Universal action launcher for all features
   - Fuzzy search across tickets, KB articles, settings, actions
   - Progressive proficiency: discoverable tooltips → muscle memory

3. **WhatsApp's Status Receipts**: "enviado", "visto" checkmarks for replies
   - Builds trust in LATAM markets (familiar muscle memory)
   - Human-centric copy ("Marcus is helping") over robotic labels

4. **Mail Client 3-Pane Layout**: Navigation Rail | List View | Detail
   - Fixed spatial positions, zero pogo-sticking
   - Mental map stability (Hick's Law)

**What to Adapt (Modify for Context)**

1. **WhatsApp Chat Bubbles → Ticket Threads**
   - Adapt: Ticket threads styled as chat bubbles (visual only, no WhatsApp API)
   - Reason: Leverage LATAM muscle memory without multi-month compliance
   - Phase 2: Evaluate actual WhatsApp Business API integration

2. **Superhuman Keyboard Shortcuts → LATAM Spanish Keyboards**
   - Adapt: Test CMD+Enter on Spanish (Spain) vs LATAM Spanish keyboards
   - Reason: Keyboard layout differences may affect ergonomics
   - Validation: User testing with LATAM agents

3. **Linear's Instant Updates → Short Polling (Phase 1)**
   - Adapt: Optimistic UI + 15-30s polling instead of WebSockets
   - Reason: Avoid WebSocket infrastructure complexity × N tenants
   - Phase 2: WebSocket-based real-time presence (Ghost Avatar)

**What to Avoid (Conflicts with Goals)**

1. **Zendesk's Information Density**: <5 dashboard metrics, generous whitespace
   - Conflicts with: Mental Bandwidth Recovery, Intentional Calm
   - Our approach: High-signal metrics only, role-scoped views

2. **Intercom's Modal Hell**: Settings page in Phase 1, not nested modals
   - Conflicts with: Zero-Gravity UX, Spatial Safety
   - Our approach: Dedicated page with fixed navigation

3. **Red Badge Overload**: No red badges, no SLA panic indicators
   - Conflicts with: Professional Pride (Calm as Competitive Advantage)
   - Our approach: Green checkmark ("caught up"), blue dot ("needs attention")

4. **Auto-Refresh Chaos**: Optimistic UI, no full page reloads
   - Conflicts with: Progressive Mastery (tool becomes invisible)
   - Our approach: Short polling + optimistic updates, scroll position preserved

**Strategic Implementation Roadmap**

**Phase 1 (MVP - Q1 2026):**
- Linear's Optimistic UI (NFR-1: <200ms perceived latency)
- Superhuman's CMD+K palette + keyboard shortcuts
- WhatsApp visual metaphors (CSS-based, no API)
- 3-pane layout (Navigation Rail | List View | Detail)
- Settings PAGE (not modal)

**Phase 2 (Growth - Q2-Q3 2026):**
- WhatsApp Business API integration (evaluate based on Phase 1 feedback)
- WebSocket-based real-time presence (Ghost Avatar)
- Modal slide-over settings (optimize based on Phase 1 usage patterns)
- Brazilian Portuguese + fiscal compliance (Pix, Boleto)

---

## Design System Foundation

### Design System Choice

**shadcn/ui + Radix UI (Component Ownership Architecture)**

CustomerDeskAI uses **shadcn/ui components** built on **Radix UI primitives**, styled with **Tailwind CSS 4**. This is the only architecture that provides the performance and ownership required for a multi-tenant SaaS platform.

**Core Principle: Copy-Paste Component Ownership**

Unlike traditional component libraries (MUI, Chakra), shadcn/ui components are **copied into the codebase**, not installed as npm dependencies. This provides:
- **Full component ownership**: Modify any component without library constraints
- **Zero vendor lock-in**: Components are yours, not a black box
- **Performance optimization**: Only bundle components you use (~10KB per component)
- **Customization freedom**: Adapt patterns for CustomerDeskAI's unique needs (chat bubbles, 3-pane layout)

### Rationale for Selection

**1. Performance (Critical for <200ms Perceived Latency - NFR-1)**
- **Minimal bundle overhead**: shadcn/ui adds ~10KB per component vs 80-100KB for MUI/Chakra base
- **Tailwind CSS 4**: Optimized CSS generation, removes unused styles at build time
- **No runtime CSS-in-JS**: Eliminates Emotion/styled-components overhead (MUI/Chakra)
- **Tree-shakeable**: Only bundle components actually used in production

**2. Component Ownership (Essential for White-Label SaaS)**
- **Copy-paste architecture**: Components live in `apps/web/src/components/ui/`, fully editable
- **Custom patterns**: Build WhatsApp chat bubbles, 3-pane layouts on Radix primitives
- **No upgrade conflicts**: Component updates are opt-in, not forced by npm
- **Workspace theming**: CSS variables for per-tenant branding (logo, colors)

**3. Accessibility (NFR Compliance)**
- **Radix UI primitives**: WAI-ARIA compliant by default (keyboard nav, screen reader, focus management)
- **Keyboard-first**: Full keyboard navigation built into primitives (Command Palette, Dialog, Dropdown)
- **Screen reader tested**: Radix components tested with NVDA, JAWS, VoiceOver
- **Focus management**: Automatic focus trapping (modals, dialogs, command palette)

**4. Tech Stack Alignment**
- **TypeScript-native**: Radix UI is TypeScript-first, full type safety
- **Tailwind CSS 4**: Matches existing stack (no CSS-in-JS paradigm shift)
- **React 19 compatible**: Uses modern patterns (ref as prop, no forwardRef)
- **Next.js optimized**: Server Components compatible, edge-ready

**5. White-Label Theming Architecture**
- **CSS variables for workspace colors**: `--primary`, `--background`, `--foreground` overridable per tenant
- **Logo injection**: Workspace logo replaces default in Navigation Rail
- **6 curated palettes**: Pre-defined color schemes for low-friction workspace setup
- **Real-time theme switching**: CSS variables update without page reload

### Implementation Approach

**Phase 1: Core Component Foundation (MVP - Q1 2026)**

**shadcn/ui Components to Install:**

1. **Navigation & Layout**
   - `command` (CMD+K command palette) - Superhuman-style universal launcher
   - `navigation-menu` (Navigation Rail) - 3-pane left sidebar
   - `separator` (Visual dividers) - 3-pane separators

2. **Forms & Input**
   - `input` (Text fields) - Ticket reply editor
   - `textarea` (Multi-line input) - Ticket description, KB articles
   - `button` (Primary actions) - "Send & Resolve", split button pattern
   - `select` (Dropdowns) - Workspace switcher, language toggle
   - `checkbox` (Boolean input) - Settings toggles
   - `label` (Form labels) - Accessibility-compliant labels

3. **Feedback & Status**
   - `toast` (Notifications) - "Draft saved 5 seconds ago", success/error messages
   - `badge` (Status indicators) - "visto" checkmarks, ticket status
   - `skeleton` (Loading states) - Optimistic UI placeholders
   - `progress` (Progress indicators) - Onboarding checklist

4. **Overlays & Modals**
   - `dialog` (Modals) - Confirmation dialogs (delete KB article)
   - `sheet` (Mobile slide-overs) - Mobile invitation acceptance flow
   - `tooltip` (Contextual hints) - Keyboard shortcut discovery
   - `dropdown-menu` (Context menus) - Ticket actions, split button dropdown

5. **Data Display**
   - `avatar` (User identity) - Agent avatars in ticket threads
   - `card` (Content containers) - Dashboard metric cards
   - `table` (Data grids) - Settings tables (limited use - prefer lists)

**Custom Components on Radix Primitives (Build from Scratch):**

1. **ChatBubbleThread** (Built on Radix Primitives)
   - WhatsApp-style threaded conversations
   - Customer messages (left-aligned bubbles), agent replies (right-aligned)
   - "enviado", "visto" status receipts
   - Markdown rendering for agent replies

2. **ThreePaneLayout** (Built on Radix Primitives)
   - Navigation Rail (60px fixed left)
   - List View (320px center, scrollable)
   - Detail View (flexible right, scrollable)
   - Resizable separators (Phase 2)

3. **AutoCompleteSlashCommand** (Built on `cmdk` primitive)
   - `/kb` slash command for KB insertion
   - Fuzzy search with keyboard navigation (arrow keys, Enter)
   - Progressive proficiency (sidebar discovery → /kb experts)

4. **OptimisticStatusIndicator** (Custom Component)
   - Green checkmark ("caught up"), blue dot ("needs attention")
   - No red badges, no artificial urgency
   - Physics-based settling animation (Peak-End Rule)

**Installation Command:**
```bash
# Install shadcn/ui CLI and add components
npx shadcn@latest init
npx shadcn@latest add command navigation-menu separator input textarea button select checkbox label toast badge skeleton progress dialog sheet tooltip dropdown-menu avatar card table
```

**Component Storage:**
- Location: `apps/web/src/components/ui/`
- Each component is a single file (e.g., `button.tsx`, `command.tsx`)
- Full TypeScript types included
- Modify freely without library constraints

### Customization Strategy

**1. White-Label Theming via CSS Variables**

**Design Tokens (Workspace-Specific):**
```css
:root {
  /* Workspace primary color (customizable per tenant) */
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 20% 98%;

  /* Workspace background (light/dark mode) */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Semantic colors (fixed for consistency) */
  --success: 142.1 76.2% 36.3%; /* Green checkmark "caught up" */
  --warning: 47.9 95.8% 53.1%; /* Blue dot "needs attention" */
  --destructive: 0 84.2% 60.2%; /* Error states only */
}
```

**Workspace Branding Implementation:**
- **Logo**: Workspace logo replaces default in Navigation Rail (`<WorkspaceLogo />` component)
- **Color Palette**: 6 curated palettes (pre-defined CSS variable sets)
- **Theme Switching**: Update CSS variables in real-time (no page reload)
- **Persistence**: Workspace theme stored in database, loaded on auth

**2. LATAM-Specific Customization**

**Typography (Warm Minimalism):**
- **Font Stack**: Inter (primary), system fallbacks
- **Font Sizes**: Generous (16px base, 18px for readability)
- **Line Height**: 1.6 (LATAM users prefer readable spacing)
- **Font Weight**: 400 (regular), 500 (medium), 600 (semibold) - no extremes

**Color Palette (Relational Proximity):**
- **Warm Neutrals**: Gray-700 text, Gray-400 borders (not stark black/white)
- **Success Green**: Calm green (#10B981) for "caught up" checkmark
- **Info Blue**: Subtle blue (#3B82F6) for "needs attention" dot
- **No Red Badges**: Destructive red (#EF4444) only for explicit errors

**Spacing (Generous Whitespace):**
- **Dashboard Cards**: 24px padding, 16px gap between cards
- **3-Pane Separators**: 1px border, 8px padding on each side
- **Chat Bubbles**: 12px padding, 8px gap between messages

**3. Accessibility Customization**

**Keyboard Navigation Enhancements:**
- **Skip Links**: "Skip to ticket list", "Skip to detail view"
- **Focus Indicators**: 2px blue outline (--ring color)
- **CMD+K Command Palette**: Global search, fuzzy matching
- **Keyboard Shortcuts**: Visible in tooltips, documented in command palette

**Screen Reader Optimization:**
- **ARIA Labels**: All interactive elements labeled
- **Live Regions**: Toast notifications as ARIA live regions
- **Semantic HTML**: `<nav>`, `<main>`, `<aside>` for 3-pane layout
- **Heading Hierarchy**: Proper h1-h6 structure

**4. Performance Customization**

**Optimistic UI Patterns:**
- **Skeleton Components**: Instant placeholders during async operations
- **Toast Notifications**: Non-blocking feedback ("Draft saved 5 seconds ago")
- **Inline Retry**: Network failures show retry button inline (not full-page error)

**Bundle Optimization:**
- **Tree Shaking**: Only bundle used components (~10KB per component)
- **Code Splitting**: Load command palette on CMD+K (lazy import)
- **CSS Purging**: Tailwind CSS 4 removes unused styles at build time

### Design Token Architecture

**Color Tokens (CSS Variables):**
```
--background: Workspace background color
--foreground: Primary text color
--primary: Workspace brand color (CTA buttons, links)
--primary-foreground: Text on primary color
--success: Green checkmark "caught up"
--warning: Blue dot "needs attention"
--destructive: Error states only
--muted: Secondary text (timestamps, hints)
--border: Separators, card borders
--ring: Focus indicator (keyboard navigation)
```

**Spacing Tokens (Tailwind CSS 4):**
```
space-1: 4px (tight spacing)
space-2: 8px (standard gap)
space-3: 12px (card padding)
space-4: 16px (section spacing)
space-6: 24px (generous padding)
```

**Typography Tokens:**
```
text-xs: 12px (timestamps, captions)
text-sm: 14px (secondary text)
text-base: 16px (body text)
text-lg: 18px (headings)
text-xl: 20px (page titles)
```

**Border Radius Tokens:**
```
rounded-sm: 4px (inputs, badges)
rounded-md: 6px (cards, buttons)
rounded-lg: 8px (modals, sheets)
```

### Component Customization Examples

**Example 1: WhatsApp Chat Bubble (Custom on Radix)**
```tsx
// apps/web/src/components/chat-bubble-thread.tsx
import { Avatar } from "@/components/ui/avatar";

export function ChatBubbleThread({ messages }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div className={msg.isAgent ? "flex justify-end" : "flex justify-start"}>
          <div className={cn(
            "rounded-lg p-3 max-w-[70%]",
            msg.isAgent ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {msg.content}
            <StatusReceipt status={msg.status} /> {/* "enviado", "visto" */}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Example 2: Split Button (shadcn Button + Dropdown)**
```tsx
// apps/web/src/components/split-button.tsx
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

export function SplitButton() {
  return (
    <div className="flex">
      <Button onClick={handleSend}>Send</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">▼</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleSendAndResolve}>
            Send & Resolve <kbd>CMD+Enter</kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

---

## Defining Core Experience (Interaction Mechanics)

### Defining Experience

**The Ticket Resolution Loop: CMD+Enter → Auto-Advance**

CustomerDeskAI's defining experience is the **Ticket Resolution Loop** - the moment Priya hits CMD+Enter to resolve a ticket and the system instantly loads the next one. This single interaction happens 50-100 times per day and must feel **effortless, not frictionless**.

**The Core Interaction Statement:**
"Hit CMD+Enter, and you're done with this ticket and ready for the next one - zero context switching, zero latency, zero anxiety."

**Why This Defines the Product:**
- **Establishes flow state**: Muscle memory replaces conscious thought after ticket #20-30
- **Eliminates pogo-sticking**: No navigation clicks, no back buttons, no "what's next?" decisions
- **Optimistic trust**: UI updates immediately, background sync confirms
- **Competitive moat**: This interaction pattern is CustomerDeskAI's unique advantage over Zendesk/Intercom

**Comparison to Famous Defining Experiences:**
- **Tinder's swipe**: Single gesture, immediate feedback, next item auto-loads
- **Instagram's double-tap like**: Instant gratification, no confirmation dialogs
- **Superhuman's CMD+E archive**: Keyboard shortcut, optimistic UI, inbox auto-advances
- **CustomerDeskAI's CMD+Enter**: Resolve ticket, instant next-load, flow state preservation

### User Mental Model

**How Users Currently Solve Ticket Resolution (Legacy Tools):**

**Zendesk/Intercom Mental Model (What We're Replacing):**
1. **Scan ticket queue** (table view, 20+ columns, visual scanning fatigue)
2. **Click ticket** (new page load, lose queue context)
3. **Read ticket** (nested tabs, customer history buried 3 clicks deep)
4. **Type reply** (rich text editor, formatting toolbar distraction)
5. **Click "Submit"** (no keyboard shortcut, mouse-driven)
6. **Wait for spinner** (2-3s page reload)
7. **Manually navigate back to queue** (breadcrumb or back button)
8. **Repeat from step 2**

**Cognitive Load Analysis:**
- **8 conscious decisions** per ticket (scan, click, read, type, submit, wait, navigate, repeat)
- **Context switching**: Queue → Detail → Queue (mental map resets each cycle)
- **Mouse dependency**: 4+ clicks per ticket (no keyboard flow)
- **Artificial latency**: 2-3s perceived wait time (spinners, page reloads)

**CustomerDeskAI's Mental Model (What We're Building):**
1. **See ticket in fixed Detail View** (3-pane layout, no page load)
2. **Read ticket** (customer history always visible in right panel)
3. **Type reply** (Markdown editor, /kb for KB insertion)
4. **Hit CMD+Enter** (muscle memory, no mouse)
5. **Next ticket auto-loads** (optimistic UI, <200ms perceived latency)
6. **Repeat from step 2**

**Cognitive Load Analysis:**
- **3 conscious decisions** per ticket (read, type, send)
- **Zero context switching**: Fixed 3-pane layout, mental map stable
- **Keyboard-first**: Single shortcut for primary action
- **Zero perceived latency**: Optimistic UI, background sync

**User Expectation Alignment:**
- **Spatial consistency**: Priya expects tickets to always be in the same place (center-left list, right detail)
- **Keyboard primacy**: Power users expect CMD+Enter to work universally (email clients, Slack, Superhuman)
- **Auto-save everywhere**: Users expect drafts to persist (Google Docs mental model)
- **WhatsApp familiarity**: LATAM users expect chat bubbles, "visto" checkmarks (muscle memory)

**Where Users Get Confused (Anti-Patterns to Avoid):**
- **Modal hell**: Users expect settings in a dedicated page, not stacked modals (Intercom anti-pattern)
- **Nested tabs**: Users lose mental map when tickets open in nested tabs (Zendesk anti-pattern)
- **Auto-assignment**: Users expect to pick tickets manually, not have them assigned automatically (agency over automation)

### Success Criteria

**What Makes Users Say "This Just Works":**

**1. Invisible Tool Syndrome (Tool Becomes Transparent)**
- **Metric**: After ticket #20-30, users stop "looking" for UI elements (spatial consistency achieved)
- **Validation**: Eye-tracking shows <10% fixation time on navigation after ticket #30
- **User Quote**: "I stopped thinking about the tool and just focused on helping customers"

**2. Flow State Entry (Mihaly Csikszentmihalyi's Flow)**
- **Metric**: Users can resolve 50-100 tickets/day without mental fatigue
- **Validation**: Session duration >2 hours without drop-off, keyboard shortcut usage >80% by Week 2
- **User Quote**: "I resolved 80 tickets today and my brain isn't fried"

**3. Zero-Latency Perception (Optimistic UI)**
- **Metric**: <200ms perceived latency for all actions (NFR-1)
- **Validation**: Network latency simulator shows <5% user-perceived failures
- **User Quote**: "It feels instant, like the tool knows what I want before I click"

**4. Absolute Trust (Zeigarnik Effect Eliminated)**
- **Metric**: Users close tab without checking "Did it save?" (NFR-5: Absolute Trust)
- **Validation**: "Draft saved 5 seconds ago" timestamp, localStorage persistence, zero "Are you sure?" dialogs
- **User Quote**: "I never worry about losing work, it just saves itself"

**5. Professional Pride (Referral Emotion)**
- **Metric**: NPS question: "Does this tool make you better at your job?" (target >50)
- **Validation**: Users refer tool because it gives competitive advantage through calm, not features
- **User Quote**: "This tool makes me look like a support ninja"

**Feedback That Tells Users They're Doing It Right:**
- **Visual**: Green checkmark on resolved ticket (instant, no spinner)
- **Auditory**: Subtle "swoosh" sound on auto-advance (optional, user-configurable)
- **Tactile**: Keyboard haptic feedback on CMD+Enter (macOS trackpad)
- **Temporal**: "Draft saved 5 seconds ago" timestamp (builds trust)
- **Spatial**: Next ticket loads in same Detail View position (no jarring movement)

**Speed Requirements:**
- **<200ms perceived latency**: Optimistic UI shows result before server confirms
- **500ms auto-save debounce**: Save triggered after typing pause, not timer
- **15-30s polling interval**: Short polling for queue updates (Phase 1, before WebSockets)

**What Should Happen Automatically (Zero Conscious Decisions):**
- **Draft persistence**: Every keystroke saved to localStorage
- **Ticket advance**: Next ticket loads automatically after CMD+Enter
- **Focus management**: Cursor automatically in reply editor when ticket loads
- **KB recent items**: /kb auto-complete shows recently used articles first

### Novel vs. Established Patterns

**Established Patterns (Leverage Existing Mental Models):**

**1. 3-Pane Email Client Layout (Apple Mail, Superhuman)**
- **Pattern**: Navigation Rail | List View | Detail View
- **Why Established**: Battle-tested for 20+ years, users understand spatial consistency
- **Our Innovation**: Apply to support tickets, not email (same mental model, different domain)

**2. CMD+K Command Palette (Superhuman, Raycast, Spotlight)**
- **Pattern**: Universal search/action launcher via keyboard
- **Why Established**: Mac users expect CMD+K for "do anything" launcher
- **Our Innovation**: Context-aware search (tickets, KB, settings, actions)

**3. Slash Commands (Slack, Notion, Linear)**
- **Pattern**: Type `/` to trigger contextual actions
- **Why Established**: Users know `/` = action shortcuts in modern tools
- **Our Innovation**: `/kb` for KB insertion (progressive proficiency: sidebar → keyboard)

**4. WhatsApp Chat Bubbles (WhatsApp, iMessage, Telegram)**
- **Pattern**: Threaded conversations as chat bubbles with status receipts
- **Why Established**: LATAM users already have muscle memory for WhatsApp
- **Our Innovation**: Apply to support tickets, not personal chat (visual metaphor, no API)

**Novel Patterns (Require User Education):**

**1. Auto-Advance After Resolution (CustomerDeskAI Innovation)**
- **Pattern**: CMD+Enter resolves ticket AND loads next one atomically
- **Why Novel**: Most support tools require manual navigation back to queue
- **How We Teach**: Tooltip on first use ("Press CMD+Enter to resolve and continue"), discoverable in command palette
- **Familiar Metaphor**: Like Superhuman's CMD+E (archive email, advance to next)

**2. Role-Scoped Contextual Calm (CustomerDeskAI Innovation)**
- **Pattern**: UI shows only data relevant to user's role (Priya sees her tickets, Sarah sees workspace)
- **Why Novel**: Most tools show global workspace data with manual filtering
- **How We Teach**: Onboarding checklist explains "Your dashboard shows only your tickets"
- **Familiar Metaphor**: Like Gmail's filtered inbox (Primary, Social, Promotions)

**3. Optimistic UI with Graceful Rollback (Linear-Inspired)**
- **Pattern**: UI updates immediately, background sync confirms, inline retry on failure
- **Why Novel**: Most SaaS tools show spinners and block user interaction
- **How We Teach**: Transparent (users don't "learn" it, they just experience zero latency)
- **Familiar Metaphor**: Like Instagram's like button (instant heart, background sync)

**Unique Twist on Established Patterns:**

**Keyboard-First with Mouse as Backup (Not Keyboard-Only):**
- **Established Pattern**: Superhuman is keyboard-only, Gmail is mouse-friendly
- **Our Twist**: Keyboard is default for production (CMD+Enter, /kb), mouse works for discovery (sidebar KB browsing)
- **Why Better**: Progressive proficiency (newcomers use mouse, experts use keyboard)

**Settings Page in Phase 1, Modal in Phase 2 (Data-Driven Evolution):**
- **Established Pattern**: Most tools use modal settings (Intercom) or dedicated page (Stripe)
- **Our Twist**: Start with page (validate usage patterns), optimize to modal slide-over in Phase 2
- **Why Better**: Avoid premature optimization, let user behavior guide design

### Experience Mechanics

**Core Experience Mechanics: The Ticket Resolution Loop**

**1. Initiation (How User Starts)**

**Trigger: Priya Opens CustomerDeskAI Dashboard**
- **Entry Point**: Direct URL (`app.customerdeskAI.com/workspaces/{slug}`)
- **Landing State**: 3-pane layout loads, first ticket auto-selected in Detail View
- **Visual Cue**: First ticket in List View has subtle blue highlight (focus indicator)
- **Keyboard Shortcut**: CMD+1 focuses ticket list, CMD+2 focuses detail view

**Invitation to Begin:**
- **Empty State**: If no tickets, show "You're caught up" with green checkmark (Peak-End Rule)
- **Loaded State**: Detail View shows customer question, reply editor cursor auto-focused
- **Onboarding**: First-time users see tooltip: "Press CMD+Enter to resolve and move to next ticket"

**2. Interaction (What User Does)**

**Step-by-Step Flow:**

**A. Read Ticket (Passive)**
- **Customer Question**: Chat bubble (left-aligned), markdown rendering, attachments visible
- **Customer History**: Right sidebar shows previous tickets from this customer (3 most recent)
- **Ticket Metadata**: Top bar shows ticket #, created date, customer name, status

**B. Type Reply (Active)**
- **Reply Editor**: Markdown editor, syntax highlighting, preview toggle
- **Auto-Save**: Keystroke pause (500ms debounce) triggers save
- **Feedback**: "Draft saved 5 seconds ago" timestamp below editor
- **KB Insertion**: `/kb` triggers autocomplete menu (fuzzy search, arrow keys navigate, Enter inserts)

**C. Resolve Ticket (Primary Action)**
- **Keyboard**: CMD+Enter (primary, muscle memory)
- **Mouse**: Click "Send & Resolve" button (backup, discoverable)
- **Split Button**: Dropdown shows "Send" option (for no-resolve scenarios)

**System Response (Optimistic UI):**
- **Immediate**: Ticket marked resolved in List View (green checkmark), Detail View loads next ticket
- **Background**: API call sends reply, resolves ticket, syncs to database
- **Failure Handling**: Inline retry button appears if network fails ("Retry" with error message)

**3. Feedback (How User Knows It's Working)**

**Visual Feedback:**
- **Ticket List**: Resolved ticket has green checkmark, fades to bottom of list
- **Detail View**: Next ticket loads instantly (<200ms perceived latency)
- **Status Receipt**: "visto" checkmark appears on sent reply (WhatsApp-style)

**Haptic Feedback (macOS):**
- **CMD+Enter**: Subtle trackpad haptic (optional, system-level)

**Temporal Feedback:**
- **Draft Saved**: Timestamp updates every 5s after typing stops
- **Optimistic UI**: No spinner, no "loading..." text (instant transition)

**Error Feedback:**
- **Network Failure**: Toast notification ("Network error, draft saved locally") + inline retry button
- **Missing Required Field**: Button shakes, tooltip appears ("Add reply before resolving")

**4. Completion (How User Knows They're Done)**

**Successful Outcome:**
- **Current Ticket**: Resolved, appears at bottom of List View with green checkmark
- **Next Ticket**: Loaded in Detail View, cursor auto-focused in reply editor
- **Mental State**: User immediately reads next customer question (zero cognitive pause)

**What's Next:**
- **Continue Flow**: Repeat loop (read → type → CMD+Enter)
- **Queue Empty**: "You're caught up" screen appears (Peak-End Rule, green checkmark, physics-based settling animation)
- **Break State**: User can close tab, drafts persist in localStorage (Absolute Trust - NFR-5)

**Edge Cases:**
- **Last Ticket in Queue**: "You're caught up" screen after resolution
- **Network Offline**: Drafts saved locally, "Retry when online" banner appears
- **Role Change**: If promoted from Agent to Admin, new nav items appear with "New" badge (progressive disclosure)
