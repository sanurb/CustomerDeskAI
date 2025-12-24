---
stepsCompleted: [1, 2, 3, 4, 7, 8, 9, 10, 11]
inputDocuments:
  - '_bmad-output/index.md'
  - '_bmad-output/project-overview.md'
  - '_bmad-output/api-contracts-server.md'
  - '_bmad-output/data-models.md'
  - 'User Story HU-ONB-001 (workspace onboarding)'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 4
  userStories: 1
workflowType: 'prd'
lastStep: 11
workflowComplete: true
completedDate: '2025-12-22'
project_name: 'CustomerDeskAI'
user_name: 'Davidu'
date: '2025-12-21'
initialUserStory: |
  HU-ONB-001: Create Support Workspace and Access as Administrator

  Key Requirements:
  - New user onboarding flow (no existing workspace)
  - Workspace creation with minimal friction
  - Automatic authentication upon creation
  - User assigned as Workspace Administrator
  - Redirect to Dashboard upon completion

  Workspace Data Required:
  - Workspace Name (3-100 chars)
  - Workspace URL (unique, lowercase, no spaces)
  - Language (ISO code)
  - Timezone

  Admin User Data Required:
  - Full Name (2-100 chars)
  - Email (valid format)
  - Password (min 12 chars)
  - Confirm Password

  Critical Business Rules:
  - Real-time validation of Workspace URL (async duplicate check)
  - Transactional integrity (all-or-nothing creation)
  - Data persistence on validation errors
  - No partially created workspaces on failure
  - Immediate authentication after success
---

# Product Requirements Document - CustomerDeskAI

**Author:** Davidu
**Date:** 2025-12-21

---

## Executive Summary

**CustomerDeskAI** is evolving from a technical foundation into a **production-ready, enterprise-grade customer support platform**. This PRD defines the critical onboarding and workspace management capabilities required to enable teams to adopt and use the platform with zero friction.

### The Product Vision

**What We're Building:**

A **white-label, multi-tenant customer support platform** that enables organizations to create isolated workspaces, manage team access, and deliver branded support experiences. The initial release focuses on **atomic workspace onboarding** and **basic team collaboration** - the minimum viable set of features that transforms our technical infrastructure into a usable product.

**The Problem We're Solving:**

New users face a **cold-start problem**: they cannot access the platform without a workspace context, yet cannot create a workspace without being authenticated. Traditional onboarding flows create friction through multi-step wizards, partial failures, and unclear error states. For B2B SaaS, the "Aha!" moment occurs when a lead invites their first teammate and sees shared state - but this is impossible without seamless onboarding and invitation workflows.

**Target Users:**

- **Primary:** Support team leaders creating their first workspace (Workspace Owners)
- **Secondary:** Team members accepting invitations to join existing workspaces (Agents/Admins)
- **Context:** B2B SaaS customers who need a white-labeled support solution with tenant isolation

### What Makes This Special

**1. Atomic Onboarding with Zero Orphans**

Unlike traditional SaaS platforms that use database-level foreign keys, CustomerDeskAI leverages **Nile's multi-tenant architecture** with **Better-Auth's identity layer** - two separate logical domains. This creates a critical risk: partial failures can produce "zombie workspaces" (tenant records exist but admin user creation failed), leaving the Workspace URL globally reserved but inaccessible.

**Our Solution:** Implement a **Compensating Transaction Pattern** that treats onboarding as a state machine:
- Step 1: Provision Tenant (Nile)
- Step 2: Create Admin User (Better-Auth)
- Step 3: Assign Ownership (tenant_users linkage)
- Step 4: Initialize Session

If any step fails, the entire transaction rolls back. Users can resume using their email as the key. **Zero zombie workspaces.**

**2. True White-Label Isolation**

Most multi-tenant platforms achieve "theming" through CSS swaps or configuration flags. CustomerDeskAI implements **subdomain-based isolation** (`slug.customerdeskai.com`) to ensure:

- **Cookie isolation:** Each tenant is a distinct browser security origin, preventing session hijacking cross-contamination
- **Asset origin masking:** All tenant assets served via CDN proxy (never `s3.amazonaws.com/logo.png`)
- **Dynamic theming:** CSS variables injected at the `<html>` root via Next.js 16 middleware, enabling zero-latency theme switching with Tailwind 4
- **Email branding:** Transactional emails render with tenant logo and colors via React Email + Resend

This isn't white-labeling as a feature - it's **architectural identity isolation**.

**3. Enterprise-Grade RBAC from Day One**

Tenant-scoped role-based access control (Owner > Admin > Agent) with capability-based permissions stored as `text[]`. A user can be an Admin in Tenant A and a Customer (or have no access) in Tenant B. Middleware validates `tenant_id + role` on every RPC call, ensuring zero permission leakage across workspace boundaries.

**The Zendesk Lesson:** Avoid hard-coded global roles. Start with a flexible array model that supports future granular permissions (can_invite, can_config_branding, can_manage_billing) without schema migrations.

---

## Project Classification

**Technical Type:** SaaS B2B Platform (Multi-tenant, White-label, RBAC)

**Domain:** Customer Support / Ticketing

**Complexity:** **High-Precision Multi-Tenant Platform**

**Why High Complexity:**
This is not "standard SaaS" - it's a **SaaS Factory**. The requirement for atomic onboarding + white-label isolation + Nile multi-tenancy means metadata management must be perfect. A single failure in the metadata layer breaks every tenant simultaneously. You're building infrastructure that supports multiple customer-facing brands, not a single product.

**Project Context:** Brownfield - Extending existing foundation

**Existing Architecture:**
- Frontend: Next.js 16, React 19, TailwindCSS 4
- Backend: Elysia (Bun runtime), oRPC for type-safe RPC
- Database: PostgreSQL with Drizzle ORM
- Auth: Better-Auth with custom Nile integration
- Multi-tenancy: Nile platform (tenant isolation via composite keys)
- Monorepo: Turborepo with pnpm workspaces

**New Capabilities Added by This PRD:**
- Workspace creation and atomic onboarding flow
- White-label theming engine (subdomain + CSS variables)
- Email-based team invitations with tenant branding
- Tenant-scoped RBAC with role management
- Session management foundations

---

## System Integrity & Security

### Critical Architectural Constraint: White-Label Isolation Policy

**Mandate:** No platform-level assets (CDN links, generic error pages, favicon) are ever served to end users. Everything must be dynamically resolved based on `tenant_id` extracted from the subdomain.

**Implementation Requirements:**

1. **Subdomain Architecture**
   - Pattern: `{workspace-slug}.customerdeskai.com`
   - Cookie Domain: `.customerdeskai.com` (allows cross-subdomain auth)
   - Security Origin: Each tenant is a distinct browser security context

2. **Asset Resolution**
   - Tenant assets (logo, favicon) stored with `tenant_id` foreign key
   - All assets proxied through CDN: `{slug}.customerdeskai.com/_assets/{file}`
   - Zero direct S3/R2 bucket URLs exposed to browser

3. **Dynamic Theming**
   - Database: `brand_config` JSON field in `tenants` table
   - Middleware: Next.js 16 middleware fetches config on request
   - Injection: CSS variables at `<html>` root element
   ```html
   <html style="--primary: #3490dc; --logo: url(...)">
   ```
   - Tailwind 4: Reads CSS variables for instant theme switching

4. **Email Branding**
   - Template Engine: React Email with dynamic tenant data
   - Sender: `no-reply@customerdeskai.com` (Phase 1)
   - Future: Custom domain mapping for tenant-owned senders
   - Content: Tenant logo, colors, and name injected at send time

5. **Error States**
   - Platform errors (500, 404) must inject tenant branding
   - Fallback: If tenant not resolved, show minimal platform branding (never happens in production with proper subdomain routing)

**Zero Exceptions:** Every pixel shown to an end user must reflect their tenant's identity.

---

## Phase 1 Scope - Time-to-Value Constraint

**Ship Now (MVP):**
1. ✅ Atomic Workspace Onboarding (HU-ONB-001)
2. ✅ Email-based Team Invitations (Admin-only, 7-day expiry)
3. ✅ Tenant-scoped RBAC (Owner, Admin, Agent roles)
4. ✅ Dynamic Branding (Logo, primary/accent colors)
5. ✅ Basic Session Management (Login/logout via Better-Auth)

**Deferred to Phase 2:**
- Advanced session management (revoke specific sessions, device tracking)
- Multi-device session visibility dashboard
- Security event notifications (new login alerts)
- Custom email domain mapping (DKIM/SPF for tenant domains)
- Granular permission flags beyond role hierarchy

**Rationale:** In B2B SaaS, the "Aha!" moment happens when a lead invites their first teammate and sees shared workspace state. Session revocation is an "Enterprise Checkbox" - crucial for SOC2 later, but a distraction from core value delivery.

---

## Success Criteria

### User Success Criteria

**Primary User (Workspace Owner) - Onboarding Experience:**

1. **Speed to Value - <60 Second Landing-to-Dashboard**
   - **Metric**: Time elapsed from landing page → functional, branded dashboard
   - **Target**: <60 seconds for 90th percentile
   - **Rationale**: High-conversion B2B plays require maintaining momentum. Any friction past 60 seconds triggers abandonment or "I'll come back later" (which means never).
   - **Measurement**: Client-side instrumentation tracking from landing page load → first dashboard render with tenant branding applied

2. **Functional Dashboard Definition - No Cold Start Problem**
   - **Success State**: User sees branded empty state with clear next steps, NOT:
     - Generic platform branding
     - Confusing sample data
     - Blank screen with no guidance
   - **Required Elements**:
     - Tenant logo and primary colors applied
     - 3-Step Setup Wizard visible:
       1. **Brand Check**: Preview of workspace branding (logo, colors)
       2. **First Article**: Create knowledge base article or FAQ
       3. **Test Ticket**: Simulate customer support ticket flow
   - **Anti-Pattern**: Zendesk's "40-page setup guide" - users need actionable next steps, not documentation

3. **Time to First Action - <5 Minutes Post-Login**
   - **Metric**: Time from successful workspace creation → completing any meaningful action (create article, send invite, customize branding)
   - **Target**: <5 minutes for 80th percentile
   - **Rationale**: B2B SaaS users evaluate tools by "doing," not reading. If they can't accomplish something valuable in their first session, they disengage.

**Secondary User (Invited Team Member) - Invite-to-Active Loop:**

4. **Invite-to-Active Timeline - <5 Minutes**
   - **Metric**: Time from admin clicking "Send Invite" → team member accessing workspace dashboard
   - **Target**: <5 minutes for 90th percentile
   - **Dependencies**:
     - Instant email delivery (Resend SLA: 95th percentile <10s)
     - Zero email bounces for valid addresses
     - One-click acceptance flow (no multi-step verification)
   - **Measurement**: Server-side tracking from invitation creation → first authenticated session by invitee

5. **Role Clarity - Immediate Capability Understanding**
   - **Success State**: Team member can answer "What can I do here?" within 30 seconds of login
   - **Implementation**:
     - Role badge visible on dashboard ("You are an Admin")
     - Contextual capabilities shown on first login (e.g., "As an Admin, you can invite team members, configure branding, and manage tickets")
   - **Anti-Pattern**: Hidden permissions that users discover by trial-and-error

**All Users - Session & Access Management:**

6. **Transparent Multi-Device Access**
   - **Success State**: Users can access workspace from multiple devices without confusion
   - **Phase 1**: Basic login/logout works across devices
   - **Phase 2** (Deferred): Session list shows "MacBook Pro (current)", "iPhone (2 hours ago)" with revoke capability

---

### Business Success Criteria

**3-Month Targets (Phase 1 Launch):**

1. **Workspace Activation Rate**
   - **Metric**: % of workspace creations that reach "functional dashboard" state
   - **Target**: ≥85% activation rate
   - **Definition**: Functional = branding applied + ≥1 team member invited OR ≥1 article created

2. **Team Collaboration Adoption ("Aha!" Moment)**
   - **Metric**: % of workspaces that invite ≥1 additional team member within first 7 days
   - **Target**: ≥40% of activated workspaces
   - **Rationale**: The "Aha!" moment for B2B support tools is seeing shared state. Single-user workspaces rarely convert to paid.

3. **Email Deliverability - Invitation Flow**
   - **Metric**: % of invitation emails successfully delivered (not bounced or marked spam)
   - **Target**: ≥98% deliverability for valid email addresses
   - **Measurement**: Resend webhook data (delivered, bounced, complained)

4. **Zero Zombie Workspaces**
   - **Metric**: % of workspace creation attempts that result in partial failures (Nile tenant created but admin user creation failed)
   - **Target**: 0% zombie workspaces
   - **Enforcement**: Compensating Transaction Pattern with automated rollback

**12-Month Targets (Phase 2 Maturity):**

5. **Multi-Workspace Adoption**
   - **Metric**: % of users who are members of ≥2 workspaces (agency/consultant pattern)
   - **Target**: ≥15% of active users
   - **Rationale**: Indicates platform stickiness and network effects

6. **Session Security Compliance**
   - **Metric**: % of enterprise customers (≥10 seats) actively using session revocation features
   - **Target**: ≥60% of enterprise customers
   - **Rationale**: SOC2/ISO compliance requires demonstrable session management

---

### Technical Success Criteria

**System Integrity - Atomic Operations:**

1. **Transactional Integrity - Zero Orphans**
   - **Requirement**: 100% atomicity for workspace creation flow
   - **Implementation**: Drizzle `db.transaction()` with rollback on any step failure:
     - Step 1: Create Nile tenant
     - Step 2: Create Better-Auth user
     - Step 3: Link via `tenant_users` (workspace-scoped role assignment)
     - Step 4: Initialize session
   - **Failure Handling**: If Steps 2-4 fail, Step 1 rollback must succeed, freeing the reserved Workspace URL
   - **Verification**: Integration tests simulate failure at each step and verify full rollback

2. **Workspace URL Uniqueness Guarantee**
   - **Requirement**: Real-time validation prevents duplicate reservations
   - **Implementation**: Async duplicate check via Nile tenant lookup during form input (debounced 300ms)
   - **Race Condition Protection**: Database-level unique constraint on `tenants.slug` + transaction-level conflict detection
   - **User Experience**: Instant feedback ("acme is taken, try acme-support") without form submission

**White-Label Isolation - Zero Leakage:**

3. **Subdomain-Based Security Origin**
   - **Requirement**: Every tenant accessed via `{slug}.customerdeskai.com` subdomain
   - **Cookie Domain**: `.customerdeskai.com` (cross-subdomain auth)
   - **Cookie SameSite**: `Lax` (CSRF protection)
   - **Verification**: Security audit confirms zero cross-tenant cookie contamination

4. **Dynamic Asset Resolution**
   - **Requirement**: 100% of tenant-visible assets (logo, favicon, email images) proxied through CDN
   - **Anti-Pattern**: Direct S3 bucket URLs (`s3.amazonaws.com/logo.png`) expose infrastructure
   - **Implementation**: All assets served via `{slug}.customerdeskai.com/_assets/{file}`
   - **Verification**: Automated crawl confirms zero direct storage URLs in rendered HTML/email

5. **CSS Variable Injection Performance**
   - **Requirement**: Theme application completes before First Contentful Paint (FCP)
   - **Target**: CSS variables injected at `<html>` root via Next.js middleware in <50ms
   - **Measurement**: Core Web Vitals tracking, FCP ≤1.5s on 3G throttled connection
   - **Fallback**: If tenant lookup fails, serve minimal platform branding (never happens in production with proper routing)

**Email Infrastructure - Transactional Reliability:**

6. **Invitation Email SLA**
   - **Requirement**: 95th percentile delivery time <30 seconds from admin click → inbox arrival
   - **Provider**: Resend with dedicated sending IP (prevents shared-pool reputation issues)
   - **Template Engine**: React Email with dynamic tenant data injection
   - **Verification**: Synthetic monitoring via Checkly (send test invite every 15 minutes, measure delivery time)

7. **Email Branding Consistency**
   - **Requirement**: 100% of transactional emails render with tenant logo and colors
   - **Templates**: Invitations, password resets, welcome emails
   - **Fallback**: If tenant branding not configured, use CustomerDeskAI default (acceptable for Phase 1)
   - **Verification**: Visual regression testing via Percy or Chromatic (screenshot emails in 10 email clients)

**Role-Based Access Control - Tenant Isolation:**

8. **Tenant-Scoped Role Validation**
   - **Requirement**: Every RPC call validates `tenant_id + role` before executing
   - **Implementation**: Middleware extracts `activeOrganizationId` from session, queries `tenant_users` for role, injects into context
   - **Enforcement**: Handlers cannot access `context.session` without tenant validation completing
   - **Attack Vector Prevention**: User who is Admin in Tenant A cannot elevate privileges in Tenant B

9. **Capability-Based Permissions (Future-Proof)**
   - **Requirement**: Roles stored as `text[]` array, not hard-coded enum
   - **Phase 1**: Owner > Admin > Agent hierarchy
   - **Phase 2**: Granular flags (`can_invite`, `can_config_branding`, `can_manage_billing`)
   - **Migration Path**: Adding new permissions does not require schema changes (just populate array)

**Performance & Scalability:**

10. **Onboarding Flow Performance**
    - **Requirement**: 95th percentile workspace creation completes in <3 seconds (server-side)
    - **Breakdown**:
      - Nile tenant creation: <800ms
      - Better-Auth user creation: <500ms
      - `tenant_users` linkage: <200ms
      - Session initialization: <300ms
      - Middleware overhead: <200ms
    - **Measurement**: OpenTelemetry distributed tracing with 100ms resolution

11. **Multi-Tenancy Query Isolation**
    - **Requirement**: All database queries include `WHERE tenant_id = ?` filter
    - **Enforcement**: Drizzle ORM wrapper intercepts queries, validates tenant context exists
    - **Verification**: Static analysis via custom ESLint rule (flag any raw SQL without tenant filter)

---

## Scope Definition - MVP vs Growth vs Vision

### MVP Scope (Phase 1) - Ship by Q1 2025

**User-Facing Features:**
1. ✅ **Atomic Workspace Onboarding** (HU-ONB-001)
   - Single-page form (workspace + admin user data)
   - Real-time URL validation
   - Transactional integrity (all-or-nothing creation)
   - Immediate authentication + redirect to dashboard

2. ✅ **Email-Based Team Invitations**
   - Admin-only capability (Owners can invite Admins or Agents)
   - 7-day expiry on invitation links
   - One-click acceptance flow
   - Transactional emails with tenant branding

3. ✅ **Tenant-Scoped RBAC**
   - 3 roles: Owner (workspace creator), Admin (can invite + config), Agent (can manage tickets)
   - Role assignment at invitation time
   - Workspace switcher (if user is member of multiple tenants)

4. ✅ **Dynamic Branding**
   - Logo upload (SVG/PNG, max 500KB)
   - Primary color picker (hex input)
   - Accent color picker (hex input)
   - CSS variable injection via Next.js middleware
   - Preview before save

5. ✅ **Basic Session Management**
   - Login/logout via Better-Auth
   - Session persistence (30-day expiry)
   - "Remember me" checkbox (extends to 90 days)
   - Logout on explicit user action

**Technical Foundations:**
- Compensating Transaction Pattern for atomic onboarding
- Subdomain routing with cookie isolation
- Resend + React Email integration
- Drizzle schema for `tenants`, `tenant_users`, `invitations`
- Better-Auth Nile plugin integration

**Out of Scope for MVP:**
- Password strength meter (use basic validation: min 12 chars)
- Multi-language support (English only)
- Advanced branding (custom fonts, CSS overrides)
- Billing/subscription management
- Audit logs
- API access for third-party integrations

---

### Growth Scope (Phase 2) - Q2 2025

**Advanced Session Management:**
1. **Session Dashboard**
   - List all active sessions with device fingerprint (MacBook Pro, iPhone, etc.)
   - Last active timestamp
   - IP address + approximate location (city-level)
   - "Revoke" button for individual sessions
   - "Revoke all other sessions" button (keeps current)

2. **Security Event Notifications**
   - Email alert on new login from unrecognized device
   - Optional: 2FA requirement for new device logins
   - Login history (last 90 days)

**Enhanced Team Management:**
3. **Granular Permissions**
   - Move from role hierarchy to capability flags
   - Custom role creation (e.g., "Billing Admin" = can manage billing but not invite users)
   - Permission templates (preset combinations)

4. **Invitation Management Dashboard**
   - List pending invitations with expiry countdown
   - Resend invitation (resets expiry)
   - Revoke invitation before acceptance
   - Invitation analytics (% accepted within 24 hours)

**White-Label Maturity:**
5. **Custom Email Domains**
   - Allow tenants to send emails from `support@their-company.com` instead of `no-reply@customerdeskai.com`
   - DKIM/SPF setup wizard
   - Domain verification flow

6. **Advanced Theming**
   - Custom font upload (WOFF2)
   - CSS class overrides for specific components
   - Light/dark mode toggle per workspace
   - Theme presets (Zendesk-like, Intercom-like, etc.)

**Technical Enhancements:**
- Redis session store (replace PostgreSQL sessions for performance)
- WebSocket support for real-time collaboration
- Audit log infrastructure (capture all state changes)
- Rate limiting per tenant (prevent abuse)

---

### Vision Scope (Phase 3+) - H2 2025 and Beyond

**Enterprise Features:**
1. **SSO Integration** (SAML, OIDC)
2. **Compliance** (SOC2 Type II, GDPR tooling)
3. **Advanced Analytics** (user behavior tracking, workspace health scores)
4. **API & Webhooks** (third-party integrations)
5. **White-Label Reseller Program** (agencies can rebrand and resell)

**Platform Maturity:**
6. **Self-Service Billing** (Stripe integration, usage-based pricing)
7. **Advanced AI Features** (auto-tagging tickets, sentiment analysis)
8. **Mobile Apps** (iOS/Android native apps)
9. **Marketplace** (third-party plugins and integrations)

---

**Success Criteria Summary:**

- **User Success**: <60s onboarding, <5 min invite-to-active, functional dashboard with 3-step wizard
- **Business Success**: ≥85% activation, ≥40% team collaboration, 0% zombie workspaces
- **Technical Success**: 100% atomic transactions, zero white-label leakage, <3s onboarding performance

**MVP Scope** focuses on delivering the "Aha!" moment (invite first teammate) with zero friction, deferring enterprise checkboxes to Phase 2.

---

## User Journeys

### Journey 1: Workspace Owner - Sarah Chen's Search for Simplicity

**Sarah Chen** is Head of Customer Success at a 25-person SaaS startup. Her team is drowning in support emails scattered across Gmail, Slack DMs, and a shared inbox. They just lost a major renewal because a support ticket got buried in the chaos. She needs to centralize support in a professional system that her team can actually use - but she has limited budget, no IT department, and a team that's already overwhelmed. She can't afford a failed rollout.

**The Journey:**

**11:00 PM - Skeptical Arrival**
Sarah lands on CustomerDeskAI's homepage at 11:03 PM, exhausted from manually tracking down a customer's question asked 3 days ago via Slack DM. She's tried Zendesk (too complex), Intercom (too expensive), and shared Gmail (chaos). She needs something that works *tonight*. She clicks "Create Workspace" - no sales call required.

**11:02 PM - Cautious Optimism**
She sees a clean, single-page form. No 14-day trial signup maze, no credit card wall - just "What should we call your workspace?" She types "ZenithSupport" and watches the URL auto-generate: `zenithsupport.customerdeskai.com`. The real-time validation shows it's available. She fills in her name, email, password - just 6 fields total.

**11:04 PM - Flow State**
She clicks "Upload Logo" and selects her company logo (450KB PNG). The progress bar shows real-time upload: 0% → 25% → 50% → 75% → 100% (takes 2 seconds). Preview renders immediately. She feels momentum.

**11:05 PM - Interruption Recovery (Critical Moment)**
A Slack notification interrupts her: "Production is down!" She accidentally clicks the browser back button. The browser shows: "Leave site? Changes may not be saved." She clicks "Cancel" and stays on the page. Her progress is preserved. **(Failure Scenario: If she had clicked "Leave," returning to the site would show: "You have an incomplete workspace setup from 2 minutes ago. [Continue] or [Start over]" - progress saved in localStorage.)**

**11:08 PM - Conflict Resolution (Edge Case)**
While Sarah was distracted by Slack, another user registered "zenithsupport." When she clicks "Create Workspace," she gets a clear error:
```
The workspace URL 'zenithsupport' was just taken.

Try these alternatives:
- zenith-support (with dash)
- zenithsupport-cs
- support-zenith

[Use suggestion] or [Try different URL]
```
She clicks "zenith-support" → Auto-fills → Clicks "Create Workspace" again.

**11:09 PM - Transaction Processing (Anxious Waiting)**
Loading screen shows step-by-step progress:
```
✓ Creating workspace 'zenith-support'...
✓ Setting up admin account...
✓ Preparing dashboard...
```
The artificial delay per step (800ms each) feels deliberate, not broken. **(Failure Scenario: If Better-Auth user creation fails due to email already registered, she sees: "✗ Setting up admin account... FAILED | ⏳ Rolling back workspace... | ✓ Rollback complete | Error: The email sarah@acme.com is already registered. Please [Login] or [Use different email]." - compensating transaction preserves data integrity.)**

**11:09 PM - The "Aha!" Moment**
Dashboard loads in 1.2 seconds. Sarah sees:
1. ✅ **Her logo** in the header (not CustomerDeskAI logo)
2. ✅ **Her primary color** (#3490dc) applied to buttons and links
3. ✅ **Welcome message**: "Welcome, Sarah! Your workspace is ready."
4. ✅ **3-Step Setup Wizard** prominently displayed:
   - ☐ **Brand Check**: Preview workspace branding
   - ☐ **First Article**: Create knowledge base article
   - ☐ **Test Ticket**: See how tickets work
5. ✅ **"Invite Team" button** bright and prominent in header

**Decision Point:** This is Sarah's commitment moment. She sees HER logo + HER colors + clear next steps = endorphin hit ("I built something!"). If she had seen generic empty state or platform branding, she would have bounced.

**11:12 PM - Team Invitation (Momentum)**
Sarah clicks "Invite Team" → Modal shows:
```
Invite Team Members

Email: marcus@example.com
Role:  [Admin ▼]

Personal message (optional):
Marcus, setting up our new support platform. Would love your input on the workflow. -Sarah

[Send Invitation]
```
Toast notification: "Invitation sent to marcus@example.com." The email arrives in Marcus's inbox at 11:52:08 PM with ZenithSupport's logo and branding.

**11:15 PM - Satisfied Completion**
Sarah completes 1/3 wizard steps and invites Marcus. She goes to bed feeling productive. Workspace state: ✓ Branding configured, ✗ No articles yet, ✗ No tickets yet, ✓ 1 pending invitation.

---

### Journey 2: Invited Admin - Marcus Webb's Seamless Entry

**Marcus Webb** is a Senior Support Agent with 3 years at the company. He's tired of switching between Gmail, Slack, and spreadsheets to track customer issues. He wants structure but has been burned by "enterprise tools" that take weeks to configure. He's skeptical - he's seen too many "simple" tools that turned out to be complicated disasters.

**The Journey:**

**11:52 PM - Interrupted Evening**
Marcus is brushing his teeth when his phone buzzes with an email. Subject: "Sarah Chen invited you to ZenithSupport." Preview text shows Sarah's personal message. He thinks: "Sarah wouldn't waste my time. Let me check."

**11:53 PM - Mobile Email Review (Critical UX Test)**
Email renders perfectly on his iPhone:
- ZenithSupport logo at top (200px width, responsive)
- Sarah's personal message: "Marcus, setting up our new support platform. Would love your input on the workflow. -Sarah"
- CTA button: "Accept Invitation" (bright blue, 44px height for easy tapping)
- Footer: "This invitation expires on Dec 22, 2025 at 11:10 PM PST"

**11:54 PM - One-Click Signup**
Marcus taps "Accept Invitation" → Redirected to signup page showing:
```
Join ZenithSupport

Sarah Chen invited you as an Admin.

Full Name:     Marcus Webb         (pre-filled)
Email:         marcus@example.com  (pre-filled, disabled)
Password:      ••••••••••••        (show/hide toggle)
Confirm:       ••••••••••••

[Join ZenithSupport]
```
Mobile UX optimized: 48px input fields, password manager autofill enabled, no captcha.

**11:55 PM - Toddler Interruption (Resilience Test)**
Marcus's toddler grabs the phone and swipes to home screen. Safari tab remains open. **(Critical: Invitation link remains valid - not consumed on first click.)** Marcus reopens Safari 2 minutes later → Form fields preserved (except password, cleared for security). He re-enters password and clicks "Join."

**11:58 PM - Seamless Dashboard Entry**
Redirected to dashboard (logged in automatically). Marcus sees:
1. ✅ **ZenithSupport branding** (logo, colors) - NOT CustomerDeskAI branding
2. ✅ **Welcome message**: "Welcome, Marcus! You're an Admin in ZenithSupport."
3. ✅ **Activity feed** showing Sarah's recent actions:
   ```
   Recent Activity:
   - Sarah Chen completed workspace branding (45 minutes ago)
   - Sarah Chen invited you (now)
   ```
4. ✅ **Admin Wizard** (different from Sarah's Owner wizard):
   ```
   Get Started as Admin:

   ☐ Review workspace branding
       See how Sarah configured the workspace

   ☐ Invite your first agent
       Add team members to help with tickets
   ```
5. ✅ **Navigation** shows Admin capabilities: Dashboard, Tickets, Knowledge Base, Team, Settings

**Decision Point:** Marcus sees Sarah's activity (social proof) and can act immediately (invite button active). He thinks: "This is slick. We're building this together."

**12:00 AM - The Trust Text**
Marcus texts Sarah at 11:58 PM: "This actually looks usable." The next morning, he invites two junior agents in 2 minutes. They're both active by 9:30 AM. No training session. No IT ticket. No 40-page setup guide. Marcus becomes the internal champion.

---

### Journey 3: Invited Agent - Priya Patel's First Day

**Priya Patel** is a Junior Support Agent who's been at the company for 2 months. She's handling customer emails manually and always worried she's going to miss something or break the system. She wants to handle support tickets confidently without fear of accidentally deleting important data or misconfiguring settings. She has impostor syndrome - she's new and doesn't want to mess up.

**The Journey:**

**9:00 AM - Nervous Invitation**
Priya receives Marcus's invitation email. Subject: "Join ZenithSupport as an Agent." She knows exactly what role she's being given. She clicks "Accept Invitation," slightly anxious about what permissions "Agent" means.

**9:03 AM - Simple Signup**
Signup page shows clear role communication:
```
Join ZenithSupport

Marcus Webb invited you as an Agent.

You're joining as an Agent - you can manage support tickets and view help articles.
You cannot invite new team members or change workspace settings.

Full Name:     Priya Patel
Password:      ••••••••••••

[Join ZenithSupport]
```
Priya thinks: "Perfect - I can't break anything important."

**9:05 AM - Agent-Scoped Dashboard (Anxiety Relief)**
Dashboard loads with simplified Agent view:
```
Welcome, Priya! You're an Agent in ZenithSupport.

As an Agent, you can manage tickets. Your work won't affect workspace settings.

Your Tickets (0)
You're all caught up! No tickets assigned to you yet.

[View Unassigned Tickets] or [Browse Knowledge Base]
```

**Navigation (Simplified for Agents):**
- ✅ Dashboard
- ✅ My Tickets (0)
- ✅ Unassigned Tickets (3)
- ✅ Knowledge Base (1 article)
- ❌ Team Management (hidden - Admin-only)
- ❌ Workspace Settings (hidden - Admin-only)

**Decision Point:** Priya sees only HER scope (not 47 tickets from everyone). She thinks: "Oh, I can only see MY tickets. That's way less scary."

**10:00 AM - First Ticket (Guided Success)**
Priya clicks "Unassigned Tickets" → Sees 3 tickets. Opens first: "How do I reset my password?"

Ticket view shows:
```
Ticket #101 - Customer: john@example.com
Status: Open | Priority: Medium

Customer Message:
"I forgot my password and can't login. Help!"

Suggested Articles:
📄 How to reset your password (by Sarah Chen)

[Assign to me] [Reply to customer]
```

**10:05 AM - Drafting with Auto-Save**
Priya writes a reply referencing Sarah's help article. **Auto-save indicator shows: "Draft saved 5 seconds ago."** **(Failure Protection: If Priya accidentally navigates away, browser warns: "Leave site? Changes may not be saved." If she leaves anyway, draft persists in database and is restored when she returns.)**

**10:11 AM - Resolution Success (Confidence Building)**
Priya clicks "Send & Resolve" → Celebration modal:
```
Great job! 🎉

You resolved your first ticket. The customer will receive your response within 5 minutes.

Your Stats:
- 1 ticket resolved today
- Average response time: 11 minutes
(Team average: 1 hour)

[Back to my tickets]
```

**Decision Point:** Priya gets private positive feedback (no public leaderboard). She thinks: "I did it! And nothing broke!" By end of day, she's handled 12 tickets and feels confident instead of anxious.

---

## Edge Cases & Failure Modes

### Critical Failure Points & Resolutions

**1. Logo Upload Interruption**
- **Scenario:** Upload fails at 87% due to network timeout
- **Resolution Required:**
  - Progress persistence in localStorage
  - Chunked file upload with resume capability (tus.io protocol)
  - "Skip for now" fallback option (workspace creation succeeds without logo)
  - Storage cleanup for abandoned uploads (1-hour TTL)

**2. Workspace URL Race Condition**
- **Scenario:** URL shows "available" but becomes taken during form completion
- **Resolution Required:**
  - Optimistic locking (5-minute soft reservation when validation passes)
  - Smart conflict suggestions (alternative slugs)
  - Form state preservation when showing conflict error
  - Re-validation before final submission

**3. Compensating Transaction Visibility**
- **Scenario:** Nile tenant created but Better-Auth user creation fails
- **Resolution Required:**
  - Step-by-step progress display during transaction
  - Specific error messages (not generic "Error occurred")
  - Pre-filled retry form with previous values
  - Email deduplication check BEFORE creating Nile tenant

**4. Expired Invitation Links**
- **Scenario:** User clicks invitation link 8 days after creation (7-day expiry passed)
- **Resolution Required:**
  - Expiry page with self-service resend flow
  - Email to workspace owner: "Marcus tried to join but invitation expired"
  - Exact expiry date/time in invitation email (not just "7 days")
  - Timezone-aware expiry calculation (workspace timezone, not UTC)

**5. Mobile Email Rendering Issues**
- **Scenario:** Invitation email renders poorly on iPhone (logo oversized, button untappable)
- **Resolution Required:**
  - Responsive email design (logo max-width: 200px, 44px touch targets)
  - Dark mode support via CSS media query
  - Testing across 5 major email clients (Apple Mail, Gmail, Outlook, Yahoo, ProtonMail)
  - Plain-text fallback version

**6. Mid-Signup Interruptions**
- **Scenario:** User navigates away while filling signup form
- **Resolution Required:**
  - Idempotent invitation links (multi-click tolerance)
  - Browser `beforeunload` warning for unsaved changes
  - Form state auto-save to localStorage every 5 seconds
  - Resume banner: "You have an incomplete signup. Continue?"

**7. Knowledge Base Article Deletion During Use**
- **Scenario:** Agent has article open while Admin deletes it
- **Resolution Required:**
  - Soft delete (mark as `archived`, not hard delete)
  - Archived articles remain accessible via direct link
  - Warning when deleting article referenced in open tickets
  - Version history for article updates

**8. Session Expiry During Active Work**
- **Scenario:** Session expires while user is typing ticket response
- **Resolution Required:**
  - 15-minute grace period after 30-day expiry
  - Persistent banner: "Session expiring in 15 minutes. Save work and re-login."
  - Drafts stored in database (survive session expiry)
  - Seamless re-auth with redirect back to original page

**9. Multi-Workspace Context Corruption**
- **Scenario:** User has two workspace tabs open, edits tickets in both
- **Resolution Required:**
  - Subdomain-based context isolation (each subdomain = separate security origin)
  - Tenant ID resolved from subdomain (not cookie)
  - Middleware injects `x-tenant-id` header per request
  - No cross-tab session hijacking

**10. Invitation from Different Device**
- **Scenario:** User receives email on iPhone, clicks link on MacBook
- **Resolution Required:**
  - Device-agnostic invitation links (no fingerprinting)
  - Single-use token consumed only after account creation completes
  - Multi-device login support (no device locking)
  - Deferred device tracking to Phase 2

**11. Timezone Confusion in Expiry**
- **Scenario:** Workspace owner (PST) invites user in different timezone (EST)
- **Resolution Required:**
  - Expiry calculated in workspace timezone
  - Email shows exact expiry with timezone abbreviation: "Dec 22, 2025 at 11:10 PM PST"
  - Countdown timer: "Expires in 6 days, 23 hours"
  - DST-aware using IANA timezone identifiers

**12. Agent Dashboard Overwhelm**
- **Scenario:** New agent sees 47 tickets on first login and panics
- **Resolution Required:**
  - Role-scoped dashboard (Agents see only their assigned tickets)
  - Empty state guidance: "No tickets assigned yet. [View Unassigned] or [Browse KB]"
  - Agent onboarding checklist (complete profile, read articles, claim first ticket)
  - Safety guardrails (agents cannot delete tickets, only resolve/close)

---

## Journey Requirements Summary

These three user journeys reveal the following capability areas needed for CustomerDeskAI Phase 1:

### Workspace Onboarding

**Core Flow:**
- Single-page workspace creation form with real-time URL validation
- Workspace slug generation and duplicate checking (debounced 300ms)
- Immediate branding application (logo upload during signup)
- Branded dashboard with 3-step setup wizard (Brand Check, First Article, Test Ticket)
- Automatic authentication and redirect to functional dashboard
- Help article creation capability (simple editor, instant publish)

**Resilience & Error Handling:**
- Progress persistence via localStorage + database sync
- Optimistic locking for workspace URL (5-minute reservation)
- Smart conflict resolution (suggest alternative slugs)
- Chunked file upload with resume capability for logo
- "Skip for now" fallback for optional steps
- Compensating transaction pattern with step-by-step visibility
- Email deduplication check before Nile tenant creation

### Team Invitation Flow

**Core Flow:**
- Admin-initiated invitation system with role selection (Admin vs Agent)
- Branded transactional emails with tenant logo and workspace name
- One-click invitation acceptance with mobile-responsive design
- Clear role communication in emails and acceptance pages
- Immediate workspace access upon invitation acceptance
- Role-appropriate dashboard views (features shown/hidden based on permissions)

**Resilience & Error Handling:**
- Idempotent invitation links (multi-click tolerance, device-agnostic)
- 7-day expiry with exact timestamp in workspace timezone
- Self-service resend flow for expired invitations
- Mobile-optimized email rendering (44px touch targets, dark mode)
- Progress persistence during signup interruptions
- Account linking for existing users (no duplicate accounts)

### Role-Based Access Control

**Core Permissions:**
- Owner → Admin → Agent hierarchy with enforced capability boundaries
- UI elements conditionally rendered based on role (invite buttons, settings)
- Role badges and capability descriptions shown on first login
- Permission boundaries enforced at UI and API levels
- Workspace switcher for users belonging to multiple tenants

**User Experience:**
- User-scoped wizard state (Owner/Admin/Agent each have different steps)
- Role-specific dashboard views (Agent sees only assigned tickets)
- Clear permission boundaries prevent "breaking" anxiety
- Contextual capability hints on hover (disabled features explain why)
- Private stats (no public leaderboards for junior agents)

### Functional Dashboard & Wizard

**Owner Wizard (3 Steps):**
1. **Brand Check** - Preview logo and color scheme
2. **First Article** - Create knowledge base content
3. **Test Ticket** - Simulate customer support workflow

**Admin Wizard (2 Steps):**
1. **Review Branding** - See workspace configuration
2. **Invite First Agent** - Add team members

**Agent Wizard (1 Step):**
1. **Resolve First Ticket** - Complete first support interaction

**Shared Features:**
- Branded empty state (tenant logo and colors, not generic platform)
- Progress tracking with completion badges
- Context-sensitive welcome messages based on user role
- Mobile-responsive design (iPhone/Android optimization)
- Activity feed showing recent team actions (social proof)

### Email Infrastructure

**Transactional Emails:**
- Full tenant branding (logo, workspace name, colors)
- Sub-10-second email delivery (Resend SLA: 95th percentile <10s)
- Clear role communication in subject and body
- One-click call-to-action buttons (44px height for mobile)
- Mobile-optimized templates (responsive, dark mode support)
- Plain-text fallback for terminal clients

**Email Content Requirements:**
- Personal message field for inviters (Sarah's note to Marcus)
- Exact expiry timestamp with timezone: "Expires Dec 22, 2025 at 11:10 PM PST"
- Role explanation: "You're joining as Admin - you can invite team members..."
- Sender: `no-reply@customerdeskai.com` (Phase 1), custom domain (Phase 2)

### Data Persistence & State Management

**Draft Auto-Save:**
- Ticket response drafts saved to database every 5 seconds
- Timestamp indicator: "Draft saved 5 seconds ago"
- Recovery after interruptions: "You have a draft from 10 minutes ago. [Restore]"
- Draft expiry: 30 days or when ticket resolved
- Offline support via IndexedDB

**Session Management:**
- 30-day expiry from last activity (90 days with "Remember me")
- 15-minute grace period with persistent warning banner
- Drafts survive session expiry (stored in database, not session)
- Seamless re-auth with redirect to original page
- Multi-device support (sessions not device-locked)

**Wizard State Tracking:**
- User-scoped progress stored in `user_onboarding_state` table
- Workspace-level milestones in `tenant_milestones` table
- Each role has independent wizard completion tracking
- Workspace milestones track FIRST occurrence (any user creating first article)

### Knowledge Base Management

**Article Lifecycle:**
- Simple editor with instant publish (no approval workflow)
- Soft delete (mark as `archived`, not hard delete)
- Version history for updates (snapshot previous versions)
- Reference tracking (which tickets link to which articles)
- Archived articles accessible via direct link for 30 days

**Update Notifications:**
- Real-time banner when article updated by another user
- "This article was updated 2 minutes ago by Marcus. [Reload] or [Continue]"
- Browser cache preserves content for copy/paste
- Visual regression testing for rendering consistency

### Performance Requirements

**Critical Timing Metrics:**
- <60-second onboarding flow (form submission → functional dashboard)
- <3-second dashboard load with tenant branding applied
- <300ms debounced URL validation
- <5-minute invite-to-active loop (send invite → invitee active in workspace)
- <50ms CSS variable injection via Next.js middleware
- <30-second email delivery (95th percentile)

**Server-Side Performance Breakdown:**
- Nile tenant creation: <800ms
- Better-Auth user creation: <500ms
- `tenant_users` linkage: <200ms
- Session initialization: <300ms
- Middleware overhead: <200ms
- **Total:** <3 seconds (95th percentile)

### Hidden Requirements (Discovered via Elicitation)

**Multi-Workspace Support:**
- Single Better-Auth user can belong to multiple tenants
- Workspace switcher in header shows all memberships
- Different roles per workspace (Owner in A, Admin in B, Agent in C)
- Subdomain-based context isolation (no cross-tenant contamination)
- Last active workspace stored in user preferences

**Invitation Edge Cases:**
- Invitations can be sent before workspace wizard complete (async collaboration)
- Existing users receive invitation to NEW tenant (no duplicate accounts)
- Invitation links work from any device (not locked to email recipient device)
- Self-service resend for expired invitations (owner approval required)

**Failure Recovery:**
- Compensating transactions preserve data integrity (zero zombie workspaces)
- Form state survives page refresh (localStorage + database sync)
- Workspace URL reservation prevents race conditions (5-minute soft lock)
- Draft preservation through session expiry and browser crashes

**Security & Compliance:**
- Cookie domain: `.customerdeskai.com` (cross-subdomain auth)
- Cookie SameSite: `Lax` (CSRF protection)
- Subdomain-based security origins (browser isolation)
- Tenant ID validated on every RPC call (middleware enforcement)
- API key support prepared (schema exists, Phase 2 feature)

---

## SaaS B2B Platform Requirements

### Multi-Tenancy Architecture

**Tenant Isolation Model:**
- Subdomain-based tenant routing (`{slug}.customerdeskai.com`)
- Nile platform for tenant management with Row-Level Security (RLS)
- Composite primary keys for tenant-scoped data (`tenant_id` + entity ID)
- No database-level foreign keys across tenants (Nile architectural constraint)
- Cookie domain: `.customerdeskai.com` with `SameSite=Lax` for CSRF protection

**Tenant Data Isolation:**
- Middleware validates `tenant_id` on every RPC call
- Tenant ID resolved from subdomain (not cookie) to prevent context corruption
- Zero cross-tenant data leakage via subdomain security origins
- Multi-workspace support: Users can belong to multiple tenants with different roles

**White-Label Capabilities:**
- Logo upload (SVG/PNG, max 500KB) with CDN proxying
- Primary and accent color customization via CSS variables
- Subdomain-based branding isolation (tenant A cannot see tenant B's assets)
- CSS variable injection via Next.js middleware in <50ms (before FCP)

---

### Role-Based Access Control (RBAC)

**Permission Matrix:**

| Capability | Owner | Admin | Agent |
|-----------|-------|-------|-------|
| **Workspace Management** | | | |
| Delete workspace | ✓ | ✗ | ✗ |
| Configure branding | ✓ | ✓ | ✗ |
| View workspace settings | ✓ | ✓ | ✗ |
| **Team Management** | | | |
| Invite Owner/Admin | ✓ | ✗ | ✗ |
| Invite Agent | ✓ | ✓ | ✗ |
| Remove team members | ✓ | ✓ (Agents only) | ✗ |
| Change user roles | ✓ | ✗ | ✗ |
| **Content Management** | | | |
| Create/edit KB articles | ✓ | ✓ | ✗ |
| Archive KB articles | ✓ | ✓ | ✗ |
| View KB articles | ✓ | ✓ | ✓ |
| **Ticket Management** | | | |
| Create tickets | ✓ | ✓ | ✓ |
| Resolve/close tickets | ✓ | ✓ | ✓ |
| Delete tickets | ✓ | ✓ | ✗ |
| View all tickets | ✓ | ✓ | ✗ (own only) |
| Reassign tickets | ✓ | ✓ | ✗ |
| **Billing & Subscription** (Phase 2) | | | |
| Manage billing | ✓ | ✗ | ✗ |
| View invoices | ✓ | ✗ | ✗ |
| Upgrade/downgrade plan | ✓ | ✗ | ✗ |

**Permission Storage:**
- Roles stored as `text[]` array in `tenant_users` table (future-proof for granular permissions)
- Phase 1: Simple hierarchy (Owner > Admin > Agent)
- Phase 2: Capability flags (`can_invite`, `can_config_branding`, `can_manage_billing`)

**Role Enforcement:**
- UI elements conditionally rendered based on role (invite buttons hidden for Agents)
- Middleware validates role before executing RPC handlers
- Handlers cannot access `context.session` without tenant + role validation

---

### Subscription Tiers & Pricing

**Phase 1: Single "Pro" Tier Strategy**

**LATAM-First Go-to-Market:**
- Target market: Brazil + LATAM corporate sector (SMBs with 5-50 employees)
- Launch with single "Pro" tier to maximize conversion velocity
- Per-seat pricing model (e.g., $12/seat/month, billed monthly)

**Trial & Conversion Flow:**
- **14-day credit-card-free trial** (supports <60s onboarding goal - no payment friction)
- Trial starts on workspace creation (no approval gate)
- Email reminders: Day 7 ("Trial halfway"), Day 12 ("2 days left"), Day 14 ("Trial ended")
- Grace period: 3 days read-only access after trial expiry (prevents hard cutoff frustration)

**Trial-to-Paid Conversion:**
- In-app upgrade prompts: Banner at Day 7, Modal at Day 12
- Self-service payment via Stripe (credit card + Pix for Brazil)
- Instant upgrade: Enter payment → workspace immediately activated
- No manual approval or sales calls for Pro tier

**Seat Counting:**
- Seat = active user in `tenant_users` table (Owner, Admin, or Agent)
- Removed users free up seats immediately (no proration in Phase 1)
- Overage handling (Phase 2): Block new invitations when seat limit reached

**Phase 2: Tiered Pricing (Deferred):**
- **Free Tier**: 1 workspace, 2 seats, basic features (freemium model)
- **Pro Tier**: Unlimited workspaces, unlimited seats, all Phase 1 features
- **Enterprise Tier**: SSO/SAML, advanced session management, SOC2 compliance, dedicated support

---

### Third-Party Integrations

**Phase 1: Table Stakes for LATAM Corporate Sector**

**Authentication Integrations:**
1. **Google OAuth** (frictionless access)
   - OAuth 2.0 flow via Better-Auth Google provider
   - Auto-link accounts by email (user@acme.com via Google = same user as email/password)
   - Workspace invitation acceptance via Google SSO (no password required)

2. **Microsoft OAuth** (frictionless access for corporate users)
   - OAuth 2.0 flow via Better-Auth Microsoft provider
   - Azure AD integration for corporate Microsoft 365 accounts
   - Auto-link accounts by email (same logic as Google)

**Analytics Integration:**
3. **PostHog** (granular UX observability)
   - Client-side + server-side event tracking
   - Custom events: workspace_created, invite_sent, ticket_resolved, wizard_step_completed
   - Feature flags for A/B testing (e.g., test different wizard flows)
   - Session replay for debugging user issues (GDPR-compliant, anonymized)
   - Works across varying connectivity environments (buffers events if offline)

**Email Integration:**
4. **Resend** (localized transactional delivery)
   - Already documented in Email Infrastructure section
   - Transactional emails with tenant branding
   - Webhook tracking (delivered, bounced, complained)

**Phase 2: Growth Integrations (Deferred)**

**Collaboration:**
- Slack notifications (new ticket alerts, assignment notifications)
- Microsoft Teams webhooks (ticket updates, workspace activity)

**Automation:**
- Zapier webhooks (trigger actions on ticket events)
- Make.com integration (workflow automation)

**CRM & Sales:**
- HubSpot sync (tickets → CRM contacts)
- Salesforce integration (enterprise customers)

**Migration Tools:**
- Zendesk import (CSV export → CustomerDeskAI import)
- Help Scout migration (API-based import)
- Intercom conversation export (ticket history preservation)

**API Access:**
- REST API with OpenAPI documentation (developer portal)
- API keys with rate limiting (1000 req/hour per workspace)
- Webhooks for custom integrations (ticket.created, ticket.resolved events)

---

### Compliance & Data Privacy

**Phase 1: Baseline Compliance for LATAM Launch**

**LGPD (Lei Geral de Proteção de Dados - Brazil):**
- **Data Subject Rights**: Users can request data export and deletion via support
- **Consent Management**: Clear privacy policy displayed during workspace creation
- **Data Minimization**: Only collect necessary data (no tracking cookies beyond session auth)
- **Data Processor Agreement**: Nile and Better-Auth are compliant sub-processors
- **Breach Notification**: 72-hour notification to ANPD (Brazilian data protection authority)

**GDPR-Aligned Privacy Standards (General):**
- **Right to Access**: Users can download their data (workspace export feature)
- **Right to Erasure**: Workspace owners can delete workspace + all data (hard delete after 30 days)
- **Data Portability**: Export format: JSON (tickets, articles, users, settings)
- **Privacy by Design**: No third-party tracking scripts (Google Analytics replaced by PostHog)
- **Cookie Consent**: Session cookies only (exempt from consent requirements - strictly necessary)

**Data Residency:**
- Nile: US-West-2 (AWS Oregon) for Phase 1
- Phase 2: LATAM data residency option (AWS São Paulo) for compliance-sensitive customers

**Security Baseline (Phase 1):**
- HTTPS-only (TLS 1.3)
- Password hashing: bcrypt (Better-Auth default, 10 rounds)
- Session tokens: Encrypted, HTTP-only cookies (XSS protection)
- CSRF protection: SameSite=Lax cookies
- Rate limiting: 100 req/min per IP (prevent brute-force)
- Nile RLS: Database-level tenant isolation (prevents SQL injection cross-tenant access)

**Phase 2: Enterprise Compliance (Deferred)**

**SOC2 Type II Audit:**
- Formal security audit process (6-12 months preparation)
- Penetration testing (annual third-party assessment)
- Incident response plan documentation
- Continuous monitoring and logging (CloudWatch, Datadog)

**SSO/SAML Integration:**
- Okta SAML integration (enterprise identity provider)
- Azure AD SAML (Microsoft enterprise customers)
- SCIM provisioning (auto-add/remove users from corporate directory)

**Advanced Security:**
- IP whitelisting (restrict workspace access to corporate IPs)
- 2FA/MFA requirement (enforce for Owner and Admin roles)
- Session revocation dashboard (already in Phase 2 roadmap)
- Audit logs (track all admin actions - who did what, when)

**Industry-Specific Compliance (On-Demand):**
- HIPAA: For healthcare customer support (encrypt PHI, BAA required)
- PCI-DSS: If handling payment data (use Stripe for compliance)
- ISO 27001: For European enterprise customers

---

### Implementation Considerations

**Multi-Tenancy Constraints:**
- Nile's architecture prohibits DB-level foreign keys across tenants
- Compensating Transaction Pattern required for atomic workspace creation
- All queries must include `WHERE tenant_id = ?` filter (enforced via Drizzle wrapper)
- Static analysis via ESLint rule to flag missing tenant filters

**RBAC Enforcement Layers:**
1. **UI Layer**: Conditional rendering (hide features based on role)
2. **Middleware Layer**: Validate `tenant_id + role` before RPC execution
3. **Database Layer**: Nile RLS enforces `tenant_id` at row level
4. **Future-Proofing**: Capability flags stored as `text[]` (no schema migration for new permissions)

**Subscription & Billing Integration Points:**
- Stripe webhook handler: `subscription.created`, `subscription.updated`, `subscription.canceled`
- Workspace status sync: Update `tenants.subscription_status` on webhook events
- Grace period logic: `trial_ends_at + 3 days` for read-only access
- Seat counting: Trigger on `tenant_users` insert/delete to update Stripe subscription quantity

**Integration Authentication:**
- OAuth tokens stored encrypted in `oauth_tokens` table (Better-Auth)
- PostHog API key in environment variables (server-side tracking)
- Resend API key in environment variables (email sending)
- Stripe webhook signing secret for security verification

**Compliance Automation:**
- Data export: Background job generates JSON dump of all tenant data
- Data deletion: Soft delete (30-day retention) → hard delete background job
- Audit trail: Every RPC call logged with `user_id + tenant_id + action + timestamp`
- GDPR compliance dashboard (Phase 2): Show data retention policies, export requests

**LATAM-Specific Considerations:**
- Portuguese (pt-BR) localization for UI (Phase 1 or Phase 2?)
- Spanish (es-LA) for broader LATAM expansion (Phase 2)
- Pix payment integration (Brazil's instant payment system - alternative to credit cards)
- Local timezone support (America/Sao_Paulo default for Brazilian workspaces)

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Interaction-First MVP**

CustomerDeskAI's Phase 1 launch is optimized for the LATAM corporate sector with a focus on the core support interaction loop (ticket creation → agent response → resolution) rather than advanced management features. This approach prioritizes time-to-value (<60s onboarding) and enables rapid validated learning with minimal architectural complexity.

**Guiding Principles:**
1. **Interaction Over Management**: Agents manually pick tickets from a queue (no auto-assignment logic)
2. **Simplicity Over Sophistication**: Markdown KB editor instead of WYSIWYG, basic keyword filter instead of advanced search
3. **Explicit Over Automatic**: Language toggle in settings (no flaky browser auto-detect)
4. **Lean Trust Signals**: Static metadata ("Workspace created by Sarah on Dec 22") instead of full activity feed event-sourcing

**Resource Requirements:**
- **Team Size**: 2-3 full-stack developers + 1 designer (part-time)
- **Timeline**: 8-10 weeks to production launch
- **Tech Stack**: Next.js 16, Elysia, PostgreSQL, Nile, Better-Auth, Resend

---

### MVP Feature Set (Phase 1) - LATAM Launch

**1. Atomic Workspace Onboarding**
- Single-page form (workspace name/URL + admin user credentials)
- Real-time workspace URL validation (debounced 300ms)
- Compensating Transaction Pattern (Nile tenant + Better-Auth user = atomic operation)
- Immediate authentication + redirect to branded dashboard
- **Success Metric**: <60s from landing page → functional dashboard

**2. Basic User Management**
- **Email-based invitations**: Admin/Owner can invite users with role selection (Admin or Agent)
- **Role hierarchy**: Owner > Admin > Agent (stored as `text[]` for Phase 2 capability flags)
- **7-day invitation expiry** with self-service resend flow
- **Role scoping**: Agents see only their picked tickets, Admins see all workspace tickets
- **Password reset flow** (non-negotiable for production):
  - "Forgot Password" link on login page
  - Email-based reset token (24-hour validity)
  - Resend transactional email with workspace branding
  - Password complexity: min 12 chars

**3. Simple Branding Settings**
- Settings form (not wizard): Logo upload (SVG/PNG, max 500KB) + Primary color + Accent color
- Logo preview on upload
- CSS variable injection via Next.js middleware (<50ms before FCP)
- Subdomain-based branding isolation (`{slug}.customerdeskai.com`)

**4. Core Ticketing - Threaded Conversation Loop**
- **Create ticket**: Title + description + priority (Low/Medium/High)
- **Threaded replies**: Agent can reply to ticket (creates conversation thread)
- **Customer replies**: Customer email responses appended to ticket thread
- **Status workflow**: 3 states only
  - **Open**: New ticket, not yet picked by agent
  - **Pending**: Agent replied, waiting for customer response
  - **Resolved**: Agent marked as resolved, ticket closed
- **Manual ticket picking**: Agent clicks "Pick Ticket" from common queue (no auto-assignment)
- **Ticket queue**: All agents see unassigned Open tickets, can self-assign by picking
- **Agent view**: Agents see only tickets they've picked (role-scoped)
- **Admin/Owner view**: See all workspace tickets regardless of assignment

**5. Knowledge Base - Simple Markdown Editor**
- **Create article**: Title + Markdown content editor (simple textarea with preview)
- **Publish toggle**: Draft/Published status
- **Public list view**: Customer-facing page showing published articles
- **Basic keyword filter**: Text search across article titles and content (no categories, no advanced search)
- **Article linking**: Agents can reference KB articles in ticket replies (copy article URL)
- **Soft delete**: Archived articles remain accessible via direct link for ticket history

**6. Localization - Spanish + English**
- **Explicit language toggle** in workspace settings (not auto-detect)
- **UI strings**: All interface text in Spanish (es-LA) and English (en-US)
- **Email templates**: Invitation and password reset emails in both languages
- **Workspace language setting**: Applied to all team members (not per-user)

**7. Local Timezone Support**
- **Workspace timezone setting**: Default based on signup location (e.g., America/Sao_Paulo for Brazil)
- **Timestamp display**: All ticket timestamps shown in workspace timezone
- **Ticket SLA calculations**: "Reply within 4 hours" respects workspace timezone (not UTC)
- **Time formatting**: Localized for LATAM (e.g., "22/12/2025 14:30" for dd/mm/yyyy format)

**8. "Getting Started" Checklist - Sidebar Widget**
- **Persistent sidebar widget** (visible until dismissed)
- **3 high-impact items**:
  1. ☐ **Set Branding**: Upload logo and choose colors
  2. ☐ **Invite an Agent**: Send first team invitation
  3. ☐ **Publish First Article**: Create and publish help article
- **Progress tracking**: Checkboxes auto-complete when action taken
- **Dismissible**: "Hide checklist" button (preference stored per user)
- **Non-blocking UX**: Dashboard is fully functional without completing checklist

**9. Trust Signal - Workspace Metadata Snippet**
- **Static sidebar snippet**: "Workspace created by [Owner Name] on [Date]"
- **Team size indicator**: "3 team members" (dynamic count)
- **Replaces activity feed**: No event-sourcing overhead, just basic metadata display

---

### Architectural Requirements (Non-Negotiable for Phase 1)

**1. Compensating Transaction Pattern**
- Atomic workspace creation (Nile tenant + Better-Auth user)
- Rollback logic if any step fails (prevent zombie workspaces)
- Step-by-step progress visibility for user ("Creating workspace...", "Setting up admin account...")

**2. Subdomain-Based Tenant Isolation**
- Tenant routing via subdomain (`{slug}.customerdeskai.com`)
- Cookie domain: `.customerdeskai.com` with `SameSite=Lax`
- Middleware validates `tenant_id` on every RPC call
- Tenant ID resolved from subdomain (not cookie) to prevent context corruption

**3. Middleware Tenant Validation**
- Every oRPC handler requires `tenant_id` context
- Static analysis via ESLint rule to flag missing `WHERE tenant_id = ?` filters
- Nile RLS enforces row-level isolation at database layer

**4. Local Timezone Storage & SLA Calculation**
- `tenants.timezone` column stores IANA identifier (e.g., "America/Sao_Paulo")
- All timestamp queries use `AT TIME ZONE` for display
- SLA calculations (e.g., "respond within 4 hours") use workspace timezone

---

### Phase 1 Cuts (Deferred to Phase 2)

**Advanced Features Removed from Launch Scope:**
- ❌ 3-step branding wizard (Brand Check, preview modals, Test Ticket) → Simple settings form
- ❌ Activity feed (full event-sourcing stream) → Static workspace metadata snippet
- ❌ Auto-assignment logic (rules-based ticket routing) → Manual pick from queue
- ❌ KB categories and advanced search → Basic keyword filter only
- ❌ Portuguese (pt-BR) localization → Spanish + English only
- ❌ Pix payment integration → Stripe credit card only
- ❌ Advanced session management (revoke, device tracking) → Basic login/logout
- ❌ Multi-device session visibility → Single active session
- ❌ Security event notifications (new login alerts) → Manual monitoring
- ❌ Custom email domain mapping → `no-reply@customerdeskai.com` sender only

**Architectural Simplifications:**
- ❌ Caching layer for middleware → Direct database queries (optimize in Phase 2 if needed)
- ❌ Chaos engineering / failure injection testing → Manual QA + integration tests
- ❌ Audit logs (full action history) → Basic RPC logging only

---

### Post-MVP Features (Phase 2) - Growth & Scale

**Phase 2A: Enhanced Ticketing (Q2 2025)**
- **Auto-assignment rules**: Route tickets by priority, agent availability, or skill tags
- **Ticket categories/tags**: Organize tickets by topic (Billing, Technical, General)
- **Internal notes**: Agent-to-agent private comments on tickets
- **Ticket merge**: Combine duplicate tickets
- **Canned responses**: Pre-written reply templates
- **Ticket SLA tracking**: Visual indicators for overdue tickets

**Phase 2B: Advanced Knowledge Base (Q2 2025)**
- **KB categories/folders**: Organize articles hierarchically
- **Advanced search**: Full-text search with filters (by category, tag, author)
- **Article versioning**: Track changes, restore previous versions
- **Article analytics**: View count, helpful/not helpful votes
- **Suggested articles**: AI-powered article suggestions based on ticket content

**Phase 2C: Team Collaboration (Q3 2025)**
- **Activity feed**: Real-time stream of workspace events (ticket created, article published)
- **Advanced session management**: Session revocation dashboard, device tracking
- **Security event notifications**: Email alerts on new login from unrecognized device
- **Granular permissions**: Capability flags (`can_invite`, `can_config_branding`, `can_manage_billing`)
- **Custom roles**: Create roles beyond Owner/Admin/Agent

**Phase 2D: Integrations & API (Q3 2025)**
- **Slack notifications**: New ticket alerts, assignment notifications
- **Microsoft Teams webhooks**: Ticket updates in Teams channels
- **Zapier webhooks**: Trigger Zaps on ticket events
- **REST API**: OpenAPI-documented endpoints for custom integrations
- **API keys**: Rate-limited access (1000 req/hour per workspace)

**Phase 2E: LATAM Expansion (Q4 2025)**
- **Portuguese (pt-BR) localization**: Full UI and email translation for Brazil
- **Pix payment integration**: Instant payment for Brazilian customers
- **LATAM data residency**: AWS São Paulo region option for compliance
- **Local business compliance**: Brazilian invoice generation (NF-e)

---

### Phase 3+ Vision - Enterprise & Platform (2026+)

**Enterprise Features:**
- SSO/SAML integration (Okta, Azure AD)
- SOC2 Type II compliance certification
- SCIM provisioning (auto-sync with corporate directory)
- IP whitelisting for workspace access
- Advanced analytics (ticket volume trends, agent performance, customer satisfaction)

**Platform Maturity:**
- Self-service billing dashboard (usage-based pricing, invoice history)
- Migration tools (Zendesk, Help Scout, Intercom import)
- White-label reseller program (agencies rebrand and resell)
- Mobile apps (iOS/Android native apps for agents)
- Marketplace (third-party plugins, custom integrations)

**AI & Automation:**
- Auto-tagging tickets by category (ML-based classification)
- Sentiment analysis (detect frustrated customers)
- AI-suggested replies (draft responses based on ticket content)
- Chatbot integration (deflect common questions to KB before creating ticket)

---

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation | Contingency |
|------|-----------|-------------|
| Compensating transaction failures (zombie workspaces) | Comprehensive integration tests, rollback verification | Manual cleanup script, monitoring dashboard |
| Nile API latency spikes (>800ms) | Retry logic with exponential backoff, timeout alerts | Fallback to synchronous user creation (accept slower onboarding) |
| Subdomain DNS propagation delays | Pre-warm subdomains on workspace creation, CDN caching | Show "Workspace is being set up" message with 30s retry |
| Email deliverability issues (Resend) | Webhook monitoring, bounce tracking, fallback SMTP | Manual email verification link sending via support |

**Market Risks:**

| Risk | Validation Approach | Contingency |
|------|---------------------|-------------|
| LATAM SMBs prefer phone support over tickets | Early adopter interviews, measure ticket volume vs phone calls | Add VoIP integration in Phase 2 |
| Spanish-only users reject English-first UI | A/B test Spanish-default onboarding | Accelerate Portuguese localization |
| $12/seat pricing too high for Brazil | Pricing experiments ($8, $10, $12), measure trial-to-paid conversion | Introduce freemium tier (2 seats free) |
| Low 14-day trial conversion | Extend to 30 days, offer migration assistance | Add "Book a Demo" for manual sales |

**Resource Risks:**

| Risk | Contingency | Minimum Viable Team |
|------|-------------|---------------------|
| Developer leaves mid-project | Knowledge sharing sessions, code documentation | 1 full-stack dev + 1 designer (slower pace) |
| Design bandwidth insufficient | Use Radix UI + shadcn/ui for 80% of components | Skip custom illustrations, use stock assets |
| QA time insufficient | Focus on critical path testing (onboarding, ticketing) | Defer edge case testing to Phase 2 |

---

### Success Criteria Alignment

**Phase 1 MVP Success = Validated Learning:**
- ✅ **User Success**: ≥80% of workspace creators complete "Getting Started" checklist within 7 days
- ✅ **Business Success**: ≥30% trial-to-paid conversion (acceptable for MVP, target 40% in Phase 2)
- ✅ **Technical Success**: <1% zombie workspace rate, <3s onboarding performance (95th percentile)

**Phase 2 Growth Success = Market Validation:**
- ✅ **User Success**: ≥50% of workspaces have ≥3 active agents (team collaboration)
- ✅ **Business Success**: ≥40% trial-to-paid conversion, <5% monthly churn
- ✅ **Technical Success**: <500ms median API response time, 99.9% uptime

**Phase 3 Enterprise Success = Platform Validation:**
- ✅ **User Success**: ≥10% of customers use SSO/SAML (enterprise adoption)
- ✅ **Business Success**: ≥$50K MRR, ≥20% of revenue from Enterprise tier
- ✅ **Technical Success**: SOC2 Type II certified, <100ms p50 API response

---

## Functional Requirements

### Workspace Onboarding & Creation

- FR1: New users can create a workspace by providing workspace name, unique URL slug, admin full name, email, and password in a single form
- FR2: Users can validate workspace URL availability in real-time during form input
- FR3: System can provision a multi-tenant workspace with atomic transaction integrity (workspace creation and admin account creation succeed or fail together)
- FR4: Users can receive smart suggestions for alternative workspace URLs when their preferred URL is unavailable
- FR5: Users can resume incomplete workspace setup from where they left off if interrupted
- FR6: Users can upload a workspace logo during initial setup
- FR7: Users can be automatically authenticated and redirected to their branded dashboard immediately after workspace creation
- FR8: Users can see step-by-step progress feedback during workspace provisioning

### User Authentication & Password Management

- FR9: Users can log in to their workspace using email and password
- FR10: Users can log in using Google OAuth as an alternative to email/password
- FR11: Users can log in using Microsoft OAuth as an alternative to email/password
- FR12: Users can request a password reset via email when they forget their password
- FR13: Users can reset their password using a time-limited token sent via email
- FR14: Users can log out of their current session
- FR15: System can maintain user sessions for 30 days with optional "Remember me" extension to 90 days

### Team Management & Invitations

- FR16: Workspace Owners can invite new team members by email with role assignment (Admin or Agent)
- FR17: Workspace Admins can invite new Agents by email
- FR18: Inviters can include a personal message with team invitations
- FR19: Invited users can accept invitations via email link and create their account
- FR20: System can enforce 7-day expiry on invitation links
- FR21: Users can see clear role descriptions during invitation acceptance
- FR22: Workspace Owners can resend expired invitations
- FR23: System can prevent duplicate accounts when existing users receive invitations to additional workspaces
- FR24: Users can access workspaces they belong to via a workspace switcher

### Role-Based Access Control

- FR25: System can enforce a three-tier role hierarchy (Owner > Admin > Agent) for workspace access
- FR26: Workspace Owners can delete the workspace
- FR27: Workspace Owners and Admins can configure workspace branding
- FR28: Workspace Owners and Admins can view and manage all workspace tickets
- FR29: Workspace Agents can view only tickets they have personally picked
- FR30: Workspace Owners and Admins can create and publish knowledge base articles
- FR31: System can display role-appropriate navigation and features based on user permissions

### Workspace Branding & Customization

- FR32: Workspace Owners and Admins can upload a workspace logo (SVG or PNG format)
- FR33: Workspace Owners and Admins can define a primary brand color
- FR34: Workspace Owners and Admins can define an accent brand color
- FR35: Users can preview branding changes before saving
- FR36: System can apply workspace branding to the dashboard, emails, and public-facing pages
- FR37: Workspace Owners and Admins can configure workspace language (Spanish or English)
- FR38: Workspace Owners and Admins can configure workspace timezone for timestamp display and SLA calculations

### Ticket Management

- FR39: Users can create support tickets with title, description, and priority (Low/Medium/High)
- FR40: Agents can view a queue of unassigned tickets in Open status
- FR41: Agents can manually pick tickets from the unassigned queue to assign them to themselves
- FR42: Agents can reply to tickets creating a threaded conversation
- FR43: System can update ticket status to Pending when an agent replies
- FR44: Agents can mark tickets as Resolved to close them
- FR45: System can support three ticket statuses: Open (new/unassigned), Pending (awaiting customer response), and Resolved (closed)
- FR46: Customers can reply to tickets via email with responses appended to the ticket thread
- FR47: Agents can reference knowledge base articles in ticket replies
- FR48: System can auto-save ticket reply drafts while agents are typing
- FR49: System can restore unsaved drafts when agents return to a ticket
- FR50: Workspace Owners and Admins can reassign tickets between agents

### Knowledge Base Management

- FR51: Workspace Owners and Admins can create knowledge base articles with title and Markdown content
- FR52: Workspace Owners and Admins can toggle article status between Draft and Published
- FR53: Customers can view a public list of published knowledge base articles
- FR54: Users can filter knowledge base articles using keyword search
- FR55: Workspace Owners and Admins can archive knowledge base articles (soft delete)
- FR56: System can preserve archived articles accessible via direct link for ticket history reference
- FR57: Agents can copy knowledge base article URLs to reference in ticket replies
- FR58: System can display article content with rendered Markdown formatting

### Email & Notifications

- FR59: System can send branded invitation emails with workspace logo, colors, and custom sender message
- FR60: System can send branded password reset emails with workspace branding
- FR61: System can deliver transactional emails in the workspace's configured language (Spanish or English)
- FR62: System can display invitation expiry timestamps in the workspace's configured timezone
- FR63: Customers can receive ticket reply notifications via email when agents respond

### Onboarding & Guidance

- FR64: New workspace owners can see a "Getting Started" checklist with three items: Set Branding, Invite an Agent, Publish First Article
- FR65: System can automatically mark checklist items as complete when corresponding actions are taken
- FR66: Users can dismiss the "Getting Started" checklist widget
- FR67: Users can see workspace metadata including creator name, creation date, and team size
- FR68: New Agents can see role-specific welcome messages explaining their capabilities and limitations

---

## Non-Functional Requirements

### Performance

**NFR-P1: Onboarding Flow Performance**
- 95th percentile workspace creation completes in <3 seconds (server-side)
- Total time from landing page to functional dashboard: <60 seconds (90th percentile)
- Breakdown targets:
  - Nile tenant creation: <800ms
  - Better-Auth user creation: <500ms
  - `tenant_users` linkage: <200ms
  - Session initialization: <300ms
  - Middleware overhead: <200ms

**NFR-P2: Dashboard Load Performance**
- First Contentful Paint (FCP): ≤1.5s on 3G throttled connection
- CSS variable injection via Next.js middleware: <50ms (before FCP)
- Dashboard fully interactive: <3 seconds (95th percentile)

**NFR-P3: Real-Time Validation**
- Workspace URL availability check: <300ms (debounced)
- Form validation feedback: instant (<100ms perceived latency)

**NFR-P4: Email Delivery Performance**
- Invitation email delivery: 95th percentile <30 seconds from send to inbox arrival
- Transactional email delivery: 95th percentile <10 seconds (Resend SLA)

**NFR-P5: API Response Times**
- Median RPC response time: <500ms (Phase 2 target)
- 95th percentile RPC response time: <2 seconds
- Database query performance: All tenant-scoped queries <200ms

### Security

**NFR-S1: Data Encryption**
- All data encrypted in transit using TLS 1.3
- Password hashing: bcrypt with 10 rounds minimum (Better-Auth default)
- Session tokens: Encrypted, HTTP-only cookies for XSS protection

**NFR-S2: Multi-Tenant Isolation**
- Subdomain-based security origins prevent cross-tenant cookie contamination
- Tenant ID validated on every RPC call via middleware
- Nile Row-Level Security (RLS) enforces database-level tenant isolation
- Zero cross-tenant data leakage verified via security audit

**NFR-S3: Authentication Security**
- Minimum password complexity: 12 characters
- Password reset tokens: 24-hour validity, single-use
- Session expiry: 30 days (90 days with "Remember me")
- Rate limiting: 100 requests/minute per IP to prevent brute-force attacks

**NFR-S4: CSRF Protection**
- SameSite=Lax cookie policy for CSRF mitigation
- Cookie domain: `.customerdeskai.com` for cross-subdomain auth

**NFR-S5: Input Validation & Sanitization**
- All user input validated and sanitized server-side
- Markdown content sanitized to prevent XSS attacks
- File upload validation: Type checking (SVG/PNG), size limits (500KB max)

**NFR-S6: Audit & Monitoring**
- All RPC calls logged with `user_id + tenant_id + action + timestamp`
- Failed authentication attempts logged and monitored
- Security event detection for suspicious activity patterns

### Scalability

**NFR-SC1: Multi-Tenant Architecture**
- System supports unlimited tenant workspaces with isolated data
- Composite primary keys enable efficient tenant-scoped queries
- Middleware validates and injects tenant context on every request

**NFR-SC2: User Growth Capacity**
- System supports 10x user growth with <10% performance degradation
- Phase 1 target: Support 1,000 workspaces with 5,000 total users
- Phase 2 target: Support 10,000 workspaces with 50,000 total users

**NFR-SC3: Database Scalability**
- All queries include `WHERE tenant_id = ?` filter (enforced via static analysis)
- Database connection pooling with automatic scaling
- Query performance monitored via OpenTelemetry distributed tracing

**NFR-SC4: Asset Storage Scalability**
- Tenant logos and assets stored with CDN caching
- CDN serves assets via `{slug}.customerdeskai.com/_assets/{file}` proxying
- Automatic storage cleanup for abandoned uploads (1-hour TTL)

### Reliability & Availability

**NFR-R1: System Uptime**
- Phase 1: 99% uptime (3.65 days downtime/year acceptable)
- Phase 2: 99.9% uptime (8.76 hours downtime/year)
- Phase 3: 99.95% uptime for enterprise customers

**NFR-R2: Data Integrity**
- Zero zombie workspaces: 100% atomicity for workspace creation via Compensating Transaction Pattern
- Workspace URL uniqueness: Database-level unique constraint + transaction-level conflict detection
- All state-changing operations wrapped in database transactions with rollback capability

**NFR-R3: Email Reliability**
- Invitation email deliverability: ≥98% for valid email addresses
- Webhook tracking for email events: delivered, bounced, complained
- Retry logic with exponential backoff for transient email failures

**NFR-R4: Session Resilience**
- Ticket reply drafts survive session expiry (stored in database, not session)
- Form state persists through page refresh (localStorage + database sync)
- 15-minute grace period before hard session expiry with persistent warning banner

**NFR-R5: Failure Recovery**
- Compensating transaction rollback completes within 5 seconds
- Clear error messages with actionable recovery steps (not generic "Error occurred")
- Pre-filled retry forms preserve user input after recoverable failures

### Accessibility

**NFR-A1: WCAG Compliance**
- WCAG 2.1 Level AA compliance for all user-facing interfaces
- Semantic HTML elements (button, nav, main, form) used instead of div + role
- Proper heading hierarchy (h1 → h2 → h3) maintained throughout

**NFR-A2: Keyboard Navigation**
- All interactive elements accessible via keyboard (Tab, Enter, Escape)
- Visible focus indicators on all focusable elements
- Keyboard shortcuts documented and consistent

**NFR-A3: Screen Reader Support**
- ARIA labels provided for all form inputs
- ARIA live regions announce dynamic content changes (e.g., validation errors)
- Image alt text provided for all meaningful images

**NFR-A4: Mobile Accessibility**
- Touch targets: Minimum 44px height for tappable elements (Apple HIG standard)
- Mobile email templates responsive with 200px max logo width
- Mobile-optimized forms: 48px input fields, password manager autofill enabled

**NFR-A5: Language & Localization Accessibility**
- `lang` attribute set correctly for Spanish (es-LA) and English (en-US)
- Date/time formatting localized for LATAM (dd/mm/yyyy format)
- Timezone-aware timestamp display in workspace timezone

### Usability

**NFR-U1: Time to Value**
- New users complete onboarding and reach functional dashboard in <60 seconds (90th percentile)
- New users complete first meaningful action in <5 minutes post-login (80th percentile)
- Invited users active in workspace in <5 minutes from invitation send (90th percentile)

**NFR-U2: Error Handling & User Feedback**
- Validation errors display inline with specific guidance (not generic messages)
- Loading states show progress feedback (not just spinners)
- Error recovery paths clearly presented (e.g., alternative workspace URL suggestions)

**NFR-U3: Mobile Experience**
- All core workflows functional on mobile devices (iPhone/Android)
- Responsive design for viewport widths 320px - 1920px
- Mobile email rendering tested across 5 major email clients (Apple Mail, Gmail, Outlook, Yahoo, ProtonMail)

**NFR-U4: Progressive Disclosure**
- Role-scoped navigation shows only relevant features (Agents don't see Admin settings)
- "Getting Started" checklist guides users without blocking core functionality
- Empty states provide clear next steps (not blank screens)

### Data Privacy & Compliance

**NFR-DP1: LGPD Compliance (Brazil)**
- Data subject rights: Users can request data export and deletion via support
- Consent management: Clear privacy policy displayed during workspace creation
- Data minimization: Only necessary data collected (no tracking cookies beyond session auth)
- Breach notification: 72-hour notification to ANPD (Brazilian data protection authority)

**NFR-DP2: GDPR-Aligned Privacy**
- Right to access: Users can download their workspace data (JSON export)
- Right to erasure: Workspace owners can delete workspace with 30-day soft delete + hard delete
- Data portability: Export format includes tickets, articles, users, settings in JSON
- Privacy by design: No third-party tracking scripts (PostHog for analytics only)

**NFR-DP3: Data Residency**
- Phase 1: Nile US-West-2 (AWS Oregon) for all data
- Phase 2: LATAM data residency option (AWS São Paulo) for compliance-sensitive customers
- Tenant data isolated at database level via Nile RLS

**NFR-DP4: Cookie Policy**
- Session cookies only (exempt from consent requirements - strictly necessary)
- Cookie SameSite: Lax for CSRF protection
- No third-party advertising or tracking cookies

**NFR-DP5: Data Retention**
- Active workspace data: Retained indefinitely while workspace active
- Deleted workspaces: 30-day soft delete (recovery possible) → hard delete (permanent)
- Invitation tokens: Auto-expired and purged after 7 days
- Draft data: Retained for 30 days or until ticket resolved

### Integration & Interoperability

**NFR-I1: OAuth Integration Reliability**
- Google OAuth flow completes in <5 seconds (95th percentile)
- Microsoft OAuth flow completes in <5 seconds (95th percentile)
- Account linking by email prevents duplicate accounts

**NFR-I2: Analytics Integration**
- PostHog event tracking: Client-side + server-side events
- Custom events tracked: workspace_created, invite_sent, ticket_resolved, wizard_step_completed
- Session replay available for debugging with GDPR-compliant anonymization
- Works across varying connectivity environments (buffers events if offline)

**NFR-I3: Email Service Integration**
- Resend API integration with <10s delivery SLA (95th percentile)
- Webhook handling for email events: delivered, bounced, complained
- Branded email templates with tenant logo and colors via React Email

**NFR-I4: Future Integration Extensibility**
- REST API architecture designed for Phase 2 (OpenAPI documentation)
- Webhook infrastructure prepared for Phase 2 (ticket.created, ticket.resolved events)
- API rate limiting: 1000 requests/hour per workspace (Phase 2)
