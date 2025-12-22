---
stepsCompleted: [1, 2, 3]
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
lastStep: 3
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
