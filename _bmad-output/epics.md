---
stepsCompleted: []
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
  - '_bmad-output/integration-architecture.md'
  - '_bmad-output/ux-design-specification.md'
---

# CustomerDeskAI - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for CustomerDeskAI, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Workspace Onboarding & Creation (FR1-FR8):**

FR1: New users can create a workspace by providing workspace name, unique URL slug, admin full name, email, and password in a single form

FR2: Users can validate workspace URL availability in real-time during form input

FR3: System can provision a multi-tenant workspace with atomic transaction integrity (workspace creation and admin account creation succeed or fail together)

FR4: Users can receive smart suggestions for alternative workspace URLs when their preferred URL is unavailable

FR5: Users can resume incomplete workspace setup from where they left off if interrupted

FR6: Users can upload a workspace logo during initial setup

FR7: Users can be automatically authenticated and redirected to their branded dashboard immediately after workspace creation

FR8: Users can see step-by-step progress feedback during workspace provisioning

**User Authentication & Password Management (FR9-FR15):**

FR9: Users can log in to their workspace using email and password

FR10: Users can log in using Google OAuth as an alternative to email/password

FR11: Users can log in using Microsoft OAuth as an alternative to email/password

FR12: Users can request a password reset via email when they forget their password

FR13: Users can reset their password using a time-limited token sent via email

FR14: Users can log out of their current session

FR15: System can maintain user sessions for 30 days with optional "Remember me" extension to 90 days

**Team Management & Invitations (FR16-FR24):**

FR16: Workspace Owners can invite new team members by email with role assignment (Admin or Agent)

FR17: Workspace Admins can invite new Agents by email

FR18: Inviters can include a personal message with team invitations

FR19: Invited users can accept invitations via email link and create their account

FR20: System can enforce 7-day expiry on invitation links

FR21: Users can see clear role descriptions during invitation acceptance

FR22: Workspace Owners can resend expired invitations

FR23: System can prevent duplicate accounts when existing users receive invitations to additional workspaces

FR24: Users can access workspaces they belong to via a workspace switcher

**Role-Based Access Control (FR25-FR31):**

FR25: System can enforce a three-tier role hierarchy (Owner > Admin > Agent) for workspace access

FR26: Workspace Owners can delete the workspace

FR27: Workspace Owners and Admins can configure workspace branding

FR28: Workspace Owners and Admins can view and manage all workspace tickets

FR29: Workspace Agents can view only tickets they have personally picked

FR30: Workspace Owners and Admins can create and publish knowledge base articles

FR31: System can display role-appropriate navigation and features based on user permissions

**Workspace Branding & Customization (FR32-FR38):**

FR32: Workspace Owners and Admins can upload a workspace logo (SVG or PNG format)

FR33: Workspace Owners and Admins can define a primary brand color

FR34: Workspace Owners and Admins can define an accent brand color

FR35: Users can preview branding changes before saving

FR36: System can apply workspace branding to the dashboard, emails, and public-facing pages

FR37: Workspace Owners and Admins can configure workspace language (Spanish or English)

FR38: Workspace Owners and Admins can configure workspace timezone for timestamp display and SLA calculations

**Ticket Management (FR39-FR50):**

FR39: Users can create support tickets with title, description, and priority (Low/Medium/High)

FR40: Agents can view a queue of unassigned tickets in Open status

FR41: Agents can manually pick tickets from the unassigned queue to assign them to themselves

FR42: Agents can reply to tickets creating a threaded conversation

FR43: System can update ticket status to Pending when an agent replies

FR44: Agents can mark tickets as Resolved to close them

FR45: System can support three ticket statuses: Open (new/unassigned), Pending (awaiting customer response), and Resolved (closed)

FR46: Customers can reply to tickets via email with responses appended to the ticket thread

FR47: Agents can reference knowledge base articles in ticket replies

FR48: System can auto-save ticket reply drafts while agents are typing

FR49: System can restore unsaved drafts when agents return to a ticket

FR50: Workspace Owners and Admins can reassign tickets between agents

**Knowledge Base Management (FR51-FR58):**

FR51: Workspace Owners and Admins can create knowledge base articles with title and Markdown content

FR52: Workspace Owners and Admins can toggle article status between Draft and Published

FR53: Customers can view a public list of published knowledge base articles

FR54: Users can filter knowledge base articles using keyword search

FR55: Workspace Owners and Admins can archive knowledge base articles (soft delete)

FR56: System can preserve archived articles accessible via direct link for ticket history reference

FR57: Agents can copy knowledge base article URLs to reference in ticket replies

FR58: System can display article content with rendered Markdown formatting

**Email & Notifications (FR59-FR63):**

FR59: System can send branded invitation emails with workspace logo, colors, and custom sender message

FR60: System can send branded password reset emails with workspace branding

FR61: System can deliver transactional emails in the workspace's configured language (Spanish or English)

FR62: System can display invitation expiry timestamps in the workspace's configured timezone

FR63: Customers can receive ticket reply notifications via email when agents respond

**Onboarding & Guidance (FR64-FR68):**

FR64: New workspace owners can see a "Getting Started" checklist with three items: Set Branding, Invite an Agent, Publish First Article

FR65: System can automatically mark checklist items as complete when corresponding actions are taken

FR66: Users can dismiss the "Getting Started" checklist widget

FR67: Users can see workspace metadata including creator name, creation date, and team size

FR68: New Agents can see role-specific welcome messages explaining their capabilities and limitations

### NonFunctional Requirements

**Performance (NFR-P1 to NFR-P5):**

NFR-P1: 95th percentile workspace creation completes in <3 seconds (server-side)

NFR-P2: First Contentful Paint (FCP) ≤1.5s on 3G throttled connection, CSS variable injection via Next.js middleware <50ms

NFR-P3: Workspace URL availability check <300ms (debounced), form validation feedback instant (<100ms perceived latency)

NFR-P4: Invitation email delivery 95th percentile <30 seconds from send to inbox arrival

NFR-P5: Median RPC response time <500ms, 95th percentile <2 seconds, all tenant-scoped queries <200ms

**Security (NFR-S1 to NFR-S6):**

NFR-S1: All data encrypted in transit using TLS 1.3, passwords hashed with bcrypt (10 rounds minimum), session tokens encrypted HTTP-only cookies

NFR-S2: Subdomain-based security origins prevent cross-tenant cookie contamination, tenant ID validated on every RPC call, Nile Row-Level Security enforces database-level isolation

NFR-S3: Minimum password complexity 12 characters, password reset tokens 24-hour validity (single-use), session expiry 30 days (90 with "Remember me"), rate limiting 100 requests/minute per IP

NFR-S4: SameSite=Lax cookie policy for CSRF mitigation, cookie domain `.customerdeskai.com`

NFR-S5: All user input validated and sanitized server-side, Markdown sanitized to prevent XSS, file uploads validated (SVG/PNG, 500KB max)

NFR-S6: All RPC calls logged with `user_id + tenant_id + action + timestamp`, failed authentication attempts logged and monitored

**Scalability (NFR-SC1 to NFR-SC4):**

NFR-SC1: System supports unlimited tenant workspaces with isolated data, composite primary keys enable efficient tenant-scoped queries

NFR-SC2: System supports 10x user growth with <10% performance degradation (Phase 1: 1,000 workspaces, 5,000 users; Phase 2: 10,000 workspaces, 50,000 users)

NFR-SC3: All queries include `WHERE tenant_id = ?` filter (enforced via static analysis), database connection pooling with automatic scaling

NFR-SC4: Tenant logos and assets stored with CDN caching, CDN serves via `{slug}.customerdeskai.com/_assets/{file}` proxying

**Reliability & Availability (NFR-R1 to NFR-R5):**

NFR-R1: Phase 1: 99% uptime, Phase 2: 99.9% uptime, Phase 3: 99.95% for enterprise

NFR-R2: Zero zombie workspaces (100% atomicity for workspace creation via Compensating Transaction Pattern), workspace URL uniqueness via database constraint + transaction conflict detection

NFR-R3: Invitation email deliverability ≥98% for valid addresses, webhook tracking (delivered, bounced, complained), retry logic with exponential backoff

NFR-R4: Ticket reply drafts survive session expiry (stored in database, not session), form state persists through page refresh (localStorage + database), 15-minute grace period before hard session expiry

NFR-R5: Compensating transaction rollback completes within 5 seconds, clear error messages with actionable recovery steps, pre-filled retry forms

**Accessibility (NFR-A1 to NFR-A5):**

NFR-A1: WCAG 2.1 Level AA compliance, semantic HTML elements used, proper heading hierarchy maintained

NFR-A2: All interactive elements accessible via keyboard (Tab, Enter, Escape), visible focus indicators, documented keyboard shortcuts

NFR-A3: ARIA labels for all form inputs, ARIA live regions for dynamic content changes, image alt text for meaningful images

NFR-A4: Touch targets minimum 44px height, mobile email templates responsive (200px max logo width), mobile-optimized forms (48px input fields)

NFR-A5: `lang` attribute set correctly (es-LA, en-US), date/time formatting localized for LATAM (dd/mm/yyyy), timezone-aware timestamp display

**Usability (NFR-U1 to NFR-U4):**

NFR-U1: New users complete onboarding to functional dashboard in <60 seconds (90th percentile), first meaningful action in <5 minutes post-login (80th percentile)

NFR-U2: Validation errors display inline with specific guidance, loading states show progress feedback, error recovery paths clearly presented

NFR-U3: All core workflows functional on mobile devices, responsive design for 320px-1920px viewports, mobile email rendering tested across 5 major clients

NFR-U4: Role-scoped navigation shows only relevant features, "Getting Started" checklist guides without blocking, empty states provide clear next steps

**Data Privacy & Compliance (NFR-DP1 to NFR-DP5):**

NFR-DP1: LGPD compliance (Brazil) - data export/deletion via support, clear privacy policy during workspace creation, data minimization

NFR-DP2: GDPR-aligned privacy - right to access (JSON export), right to erasure (30-day soft delete + hard delete), data portability

NFR-DP3: Phase 1: Nile US-West-2 (AWS Oregon), Phase 2: LATAM data residency option (AWS São Paulo)

NFR-DP4: Session cookies only (exempt from consent - strictly necessary), SameSite Lax, no third-party tracking cookies

NFR-DP5: Active workspace data retained indefinitely while active, deleted workspaces 30-day soft delete then hard delete, invitation tokens auto-expired after 7 days, drafts retained 30 days or until ticket resolved

**Integration & Interoperability (NFR-I1 to NFR-I4):**

NFR-I1: Google OAuth flow completes in <5 seconds (95th percentile), Microsoft OAuth flow <5 seconds, account linking by email prevents duplicates

NFR-I2: PostHog event tracking (client + server-side), custom events tracked, session replay with GDPR-compliant anonymization, works across varying connectivity

NFR-I3: Resend API integration with <10s delivery SLA (95th percentile), webhook handling for email events, branded email templates with tenant logo/colors via React Email

NFR-I4: REST API architecture designed for Phase 2, webhook infrastructure prepared, API rate limiting 1000 requests/hour per workspace (Phase 2)

### Additional Requirements

**From Architecture:**

**Starter Template:**
- Project uses custom Better-T-Stack foundation (production-grade multi-tenant architecture)
- Combines Better-Auth, Turborepo, Next.js 16, Elysia, oRPC, and Drizzle ORM with Nile integration
- Already initialized - no new starter command needed
- Focus on architectural patterns (RBAC middleware, compensating transactions, optimistic UI, white-label theming)

**Testing Strategy:**
- Frontend: Vitest 1.x + MSW 2.x + Testing Library
- Backend: Bun test (native runtime) + Testcontainers 10.x (PostgreSQL + Nile SDK)
- E2E: Playwright 1.x (Chromium, Firefox, WebKit) for subdomain testing
- Contract Testing: oRPC schema validation to prevent monorepo API drift

**Multi-Tenant Infrastructure:**
- Compensating Transaction Pattern for atomic workspace creation (zero zombie workspaces - NFR-R2)
- Subdomain-based tenant isolation (`{slug}.customerdeskai.com`)
- Middleware extracts tenant_id from subdomain on every request
- Cookie domain `.customerdeskai.com` with SameSite `Lax` for CSRF protection
- All queries require `WHERE tenant_id = ?` filter (ESLint rule enforcement)

**White-Label Theming:**
- CSS variable injection via Next.js middleware (<50ms before FCP)
- Edge caching (Vercel Edge Config) for middleware performance
- Fallback to minimal platform branding if tenant lookup fails
- All tenant assets proxied through CDN (`{slug}.customerdeskai.com/_assets/{file}`)
- Zero direct S3 bucket URLs exposed to browser (automated crawl verification)

**RBAC Enforcement:**
- Middleware validates `tenant_id + role` before all RPC calls
- oRPC middleware queries `tenant_users` for role, injects into context
- Prevents cross-tenant privilege elevation (Admin in Tenant A cannot access Tenant B)
- UI conditional rendering based on role (progressive disclosure on role promotion)

**Email Infrastructure:**
- Resend API with <10s SLA (95th percentile - NFR-I3)
- React Email templates with dynamic tenant data injection
- Webhook tracking (delivered, bounced, complained)
- Synthetic monitoring (send test invites every 15 minutes)
- Retry logic with exponential backoff for transient failures

**From UX Design:**

**Core UX Principles:**
- Mental Bandwidth Recovery: Users close tab with confidence that nothing is leaking
- <60-second time-to-value North Star metric (evidence-based: 20% drop-off per 30s)
- Interaction-First MVP: Prioritize core support loop (ticket creation → agent response → resolution)

**Critical Design Patterns:**
- 3-Pane Spatial Layout (Navigation Rail | List View | Focused Detail) - eliminates pogo-sticking, maintains mental map
- Optimistic UI with <200ms perceived latency target (UX NFR-1) - UI updates immediately, background sync confirms
- Auto-save everywhere (500ms keystroke pause debounce) - "Draft saved 5 seconds ago" timestamp for confidence
- WhatsApp Visual Metaphors (CSS-based, no API integration) - chat bubbles, "visto" checkmarks, "last seen" timestamps

**Keyboard-First Interaction:**
- CMD+Enter: Send & Resolve with auto-advance (muscle memory, no mouse)
- CMD+K: Command palette (universal action launcher, fuzzy search)
- /kb: Slash commands for KB insertion (progressive proficiency: sidebar → keyboard)
- Full keyboard navigation with skip links and focus indicators (NFR-A2)

**Role-Scoped Contextual Calm:**
- Agents see only their assigned tickets (not workspace noise)
- Owners see workspace overview (all agents, all tickets)
- Admins see admin-scoped data (invitations, settings, not billing)
- No red badges, no artificial urgency - green checkmark ("caught up"), blue dot ("needs attention")

**Localization & LATAM-Specific:**
- Languages: Spanish (es-LA) + English (en-US) in Phase 1
- Warm Minimalism: "Marcus is helping with this ticket" (not "Assigned to Marcus")
- WhatsApp-style status receipts: "enviado", "visto" (not "Sent", "Read")
- Workspace timezone for all timestamp displays and SLA calculations (NFR-A5)
- Date/time formatting localized for LATAM (dd/mm/yyyy format)

**Component Architecture:**
- shadcn/ui + Radix UI (copy-paste component ownership, no vendor lock-in)
- Tailwind CSS 4 with CSS variable-based theming for white-label
- Zero runtime CSS-in-JS (eliminates Emotion/styled-components overhead for NFR-P2)
- Tree-shakeable components (~10KB per component vs 80-100KB for MUI/Chakra)

**Mobile Strategy:**
- Mobile for consumption, not production (invitation acceptance, workspace switcher, ticket queue triage)
- Desktop-optimized for ticket resolution (3-pane layout, Markdown editor, keyboard shortcuts)
- Sheet-based mobile navigation (swipe-through), 44px touch targets (NFR-A4)
- Asymmetric responsive design (reorient interaction model per device, not just stack elements)

### FR Coverage Map

This section maps each Functional Requirement (FR) and Non-Functional Requirement (NFR) to the specific user stories that implement them, ensuring 100% traceability.

#### Workspace Onboarding & Creation (FR1-FR8)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR1 | New users can create a workspace by providing workspace name, unique URL slug, admin full name, email, and password in a single form | Epic 1 | US1.1 |
| FR2 | Users can validate workspace URL availability in real-time during form input | Epic 1 | US1.3 |
| FR3 | System can provision a multi-tenant workspace with atomic transaction integrity | Epic 1, Epic 6 | US1.2, US6.1 |
| FR4 | Users can receive smart suggestions for alternative workspace URLs when their preferred URL is unavailable | Epic 1 | US1.3 |
| FR5 | Users can resume incomplete workspace setup from where they left off if interrupted | Epic 1 | US1.4 |
| FR6 | Users can upload a workspace logo during initial setup | Epic 1, Epic 4 | US1.5, US4.1 |
| FR7 | Users can be automatically authenticated and redirected to their branded dashboard immediately after workspace creation | Epic 1 | US1.1, US1.5 |
| FR8 | Users can see step-by-step progress feedback during workspace provisioning | Epic 1 | US1.2 |

#### User Authentication & Password Management (FR9-FR15)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR9 | Users can log in to their workspace using email and password | Epic 7 | US7.1 |
| FR10 | Users can log in using Google OAuth as an alternative to email/password | Epic 7 | US7.2 |
| FR11 | Users can log in using Microsoft OAuth as an alternative to email/password | Epic 7 | US7.2 |
| FR12 | Users can request a password reset via email when they forget their password | Epic 7 | US7.4 |
| FR13 | Users can reset their password using a time-limited token sent via email | Epic 7 | US7.4 |
| FR14 | Users can log out of their current session | Epic 7 | US7.3 |
| FR15 | System can maintain user sessions for 30 days with optional "Remember me" extension to 90 days | Epic 7 | US7.1, US7.5 |

#### Team Management & Invitations (FR16-FR24)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR16 | Workspace Owners can invite new team members by email with role assignment (Admin or Agent) | Epic 5 | US5.1 |
| FR17 | Workspace Admins can invite new Agents by email | Epic 5 | US5.1 |
| FR18 | Inviters can include a personal message with team invitations | Epic 5 | US5.1 |
| FR19 | Invited users can accept invitations via email link and create their account | Epic 5 | US5.2 |
| FR20 | System can enforce 7-day expiry on invitation links | Epic 5 | US5.1 |
| FR21 | Users can see clear role descriptions during invitation acceptance | Epic 5 | US5.2 |
| FR22 | Workspace Owners can resend expired invitations | Epic 5 | US5.5 |
| FR23 | System can prevent duplicate accounts when existing users receive invitations to additional workspaces | Epic 5, Epic 7 | US5.2, US7.2 |
| FR24 | Users can access workspaces they belong to via a workspace switcher | Epic 5, Epic 9 | US5.4, US9.11 |

#### Role-Based Access Control (FR25-FR31)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR25 | System can enforce a three-tier role hierarchy (Owner > Admin > Agent) for workspace access | Epic 5 | US5.3 |
| FR26 | Workspace Owners can delete the workspace | Epic 5 | US5.3 |
| FR27 | Workspace Owners and Admins can configure workspace branding | Epic 4 | US4.1 |
| FR28 | Workspace Owners and Admins can view and manage all workspace tickets | Epic 2, Epic 5 | US2.4, US5.3 |
| FR29 | Workspace Agents can view only tickets they have personally picked | Epic 2, Epic 5 | US2.4, US5.3 |
| FR30 | Workspace Owners and Admins can create and publish knowledge base articles | Epic 3 | US3.1 |
| FR31 | System can display role-appropriate navigation and features based on user permissions | Epic 5 | US5.3 |

#### Workspace Branding & Customization (FR32-FR38)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR32 | Workspace Owners and Admins can upload a workspace logo (SVG or PNG format) | Epic 4 | US4.1 |
| FR33 | Workspace Owners and Admins can define a primary brand color | Epic 4 | US4.1 |
| FR34 | Workspace Owners and Admins can define an accent brand color | Epic 4 | US4.1 |
| FR35 | Users can preview branding changes before saving | Epic 4 | US4.1 |
| FR36 | System can apply workspace branding to the dashboard, emails, and public-facing pages | Epic 4, Epic 8 | US4.1, US4.3, US4.4 |
| FR37 | Workspace Owners and Admins can configure workspace language (Spanish or English) | Epic 4 | US4.2 |
| FR38 | Workspace Owners and Admins can configure workspace timezone for timestamp display and SLA calculations | Epic 4 | US4.2 |

#### Ticket Management (FR39-FR50)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR39 | Users can create support tickets with title, description, and priority (Low/Medium/High) | Epic 2 | US2.4 |
| FR40 | Agents can view a queue of unassigned tickets in Open status | Epic 2 | US2.4 |
| FR41 | Agents can manually pick tickets from the unassigned queue to assign them to themselves | Epic 2 | US2.4 |
| FR42 | Agents can reply to tickets creating a threaded conversation | Epic 2 | US2.5 |
| FR43 | System can update ticket status to Pending when an agent replies | Epic 2 | US2.1 |
| FR44 | Agents can mark tickets as Resolved to close them | Epic 2 | US2.3 |
| FR45 | System can support three ticket statuses: Open (new/unassigned), Pending (awaiting customer response), and Resolved (closed) | Epic 2 | US2.1, US2.3 |
| FR46 | Customers can reply to tickets via email with responses appended to the ticket thread | Epic 2 | US2.5 |
| FR47 | Agents can reference knowledge base articles in ticket replies | Epic 3 | US3.3 |
| FR48 | System can auto-save ticket reply drafts while agents are typing | Epic 2 | US2.2 |
| FR49 | System can restore unsaved drafts when agents return to a ticket | Epic 2 | US2.2 |
| FR50 | Workspace Owners and Admins can reassign tickets between agents | Epic 2, Epic 5 | US2.4, US5.3 |

#### Knowledge Base Management (FR51-FR58)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR51 | Workspace Owners and Admins can create knowledge base articles with title and Markdown content | Epic 3 | US3.1 |
| FR52 | Workspace Owners and Admins can toggle article status between Draft and Published | Epic 3 | US3.1 |
| FR53 | Customers can view a public list of published knowledge base articles | Epic 3 | US3.2 |
| FR54 | Users can filter knowledge base articles using keyword search | Epic 3 | US3.2 |
| FR55 | Workspace Owners and Admins can archive knowledge base articles (soft delete) | Epic 3 | US3.4 |
| FR56 | System can preserve archived articles accessible via direct link for ticket history reference | Epic 3 | US3.4 |
| FR57 | Agents can copy knowledge base article URLs to reference in ticket replies | Epic 3 | US3.3 |
| FR58 | System can display article content with rendered Markdown formatting | Epic 3 | US3.2 |

#### Email & Notifications (FR59-FR63)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR59 | System can send branded invitation emails with workspace logo, colors, and custom sender message | Epic 8 | US8.2 |
| FR60 | System can send branded password reset emails with workspace branding | Epic 8 | US8.2 |
| FR61 | System can deliver transactional emails in the workspace's configured language (Spanish or English) | Epic 8 | US8.2 |
| FR62 | System can display invitation expiry timestamps in the workspace's configured timezone | Epic 8 | US8.3 |
| FR63 | Customers can receive ticket reply notifications via email when agents respond | Epic 8 | US8.1 |

#### Onboarding & Guidance (FR64-FR68)

| Requirement ID | Requirement Description | Epic | User Stories |
|----------------|------------------------|------|--------------|
| FR64 | New workspace owners can see a "Getting Started" checklist with three items: Set Branding, Invite an Agent, Publish First Article | Epic 1 | US1.5 |
| FR65 | System can automatically mark checklist items as complete when corresponding actions are taken | Epic 1 | US1.5 |
| FR66 | Users can dismiss the "Getting Started" checklist widget | Epic 1 | US1.5 |
| FR67 | Users can see workspace metadata including creator name, creation date, and team size | Epic 5 | US5.3 |
| FR68 | New Agents can see role-specific welcome messages explaining their capabilities and limitations | Epic 5 | US5.2 |

#### User Profile & Account Management (Additional Features)

| Feature Category | Feature Description | Epic | User Stories |
|------------------|---------------------|------|--------------|
| Profile Management | View and update name, email, profile image | Epic 9 | US9.1 |
| Profile Management | Change email with verification flow | Epic 9 | US9.1 |
| Profile Management | Delete account with confirmation and 30-day grace period | Epic 9 | US9.2 |
| Password Management | Change password (requires current password) | Epic 9 | US9.3 |
| Password Management | Sign out all devices on password change | Epic 9 | US9.5 |
| Session Management | View all active sessions (device, IP, location, last active) | Epic 9 | US9.4 |
| Session Management | Sign out from specific device remotely | Epic 9 | US9.4 |
| Session Management | Sign out all devices / Sign out all OTHER devices | Epic 9 | US9.4 |
| Linked Accounts | Link social account (Google, GitHub) | Epic 9 | US9.6 |
| Linked Accounts | Unlink social account | Epic 9 | US9.6 |
| Linked Accounts | View all linked accounts | Epic 9 | US9.6 |
| Two-Factor Authentication | Enable 2FA with QR code (TOTP authenticator app) | Epic 9 | US9.7 |
| Two-Factor Authentication | Verify with authenticator code on login | Epic 9 | US9.8 |
| Two-Factor Authentication | Generate and use backup codes (recovery) | Epic 9 | US9.9 |
| Two-Factor Authentication | Trust this device (skip 2FA for 30 days) | Epic 9 | US9.8 |
| Two-Factor Authentication | Disable 2FA | Epic 9 | US9.10 |
| Organizations | View my workspaces | Epic 9 | US9.11 |
| Organizations | Switch active workspace | Epic 9 | US9.11 |
| Organizations | Accept invitation to workspace | Epic 9 | US9.12 |
| Organizations | Leave workspace | Epic 9 | US9.13 |
| Security Settings | View security status (2FA enabled, email verified) | Epic 9 | US9.14 |
| Security Settings | Email verification with resend option | Epic 9 | US9.15 |

#### Non-Functional Requirements Coverage

| NFR Category | NFR ID | Requirement Description | Epic | User Stories |
|--------------|--------|------------------------|------|--------------|
| **Performance** | NFR-P1 | 95th percentile workspace creation completes in <3 seconds | Epic 1 | US1.1, US1.2 |
| **Performance** | NFR-P2 | First Contentful Paint (FCP) ≤1.5s, CSS variable injection <50ms | Epic 4 | US4.1 |
| **Performance** | NFR-P3 | Workspace URL availability check <300ms (debounced) | Epic 1 | US1.3 |
| **Performance** | NFR-P4 | Invitation email delivery 95th percentile <30 seconds | Epic 8 | US8.1 |
| **Performance** | NFR-P5 | Median RPC response time <500ms, 95th percentile <2s | Epic 2 | US2.1 |
| **Security** | NFR-S1 | All data encrypted in transit (TLS 1.3), passwords hashed (bcrypt), session tokens encrypted | Epic 6, Epic 7 | US6.2, US7.1 |
| **Security** | NFR-S2 | Subdomain-based security origins, tenant ID validated on every RPC call | Epic 6 | US6.2 |
| **Security** | NFR-S3 | Minimum password complexity 12 chars, password reset tokens 24-hour validity | Epic 7, Epic 9 | US7.4, US9.3 |
| **Security** | NFR-S4 | SameSite=Lax cookie policy for CSRF mitigation | Epic 6 | US6.2 |
| **Security** | NFR-S5 | All user input validated server-side, Markdown sanitized, file uploads validated | Epic 3, Epic 4 | US3.1, US4.1 |
| **Security** | NFR-S6 | All RPC calls logged with user_id + tenant_id + action + timestamp | Epic 6 | US6.3 |
| **Scalability** | NFR-SC1 | System supports unlimited tenant workspaces with isolated data | Epic 6 | US6.2 |
| **Scalability** | NFR-SC2 | System supports 10x user growth with <10% performance degradation | Epic 6 | US6.2 |
| **Scalability** | NFR-SC3 | All queries include tenant_id filter (enforced via static analysis) | Epic 6 | US6.2 |
| **Scalability** | NFR-SC4 | Tenant logos/assets stored with CDN caching | Epic 4 | US4.4 |
| **Reliability** | NFR-R1 | Phase 1: 99% uptime, Phase 2: 99.9% uptime | Epic 6 | US6.1, US6.2 |
| **Reliability** | NFR-R2 | Zero zombie workspaces (100% atomicity via Compensating Transaction Pattern) | Epic 1, Epic 6 | US1.2, US6.1 |
| **Reliability** | NFR-R3 | Invitation email deliverability ≥98% for valid addresses | Epic 8 | US8.1, US8.4 |
| **Reliability** | NFR-R4 | Ticket reply drafts survive session expiry | Epic 2, Epic 7 | US2.2, US7.6 |
| **Reliability** | NFR-R5 | Compensating transaction rollback completes within 5 seconds | Epic 1, Epic 6 | US1.2, US6.1 |
| **Accessibility** | NFR-A1 | WCAG 2.1 Level AA compliance, semantic HTML | All Epics | All Stories |
| **Accessibility** | NFR-A2 | All interactive elements accessible via keyboard, visible focus indicators | Epic 2 | US2.3, US2.6 |
| **Accessibility** | NFR-A3 | ARIA labels for all form inputs, ARIA live regions | All Epics | All Stories |
| **Accessibility** | NFR-A4 | Touch targets minimum 44px height | Epic 5 | US5.2 |
| **Accessibility** | NFR-A5 | Timezone-aware timestamp display | Epic 4, Epic 8 | US4.2, US8.3 |
| **Usability** | NFR-U1 | New users complete onboarding to functional dashboard in <60 seconds | Epic 1 | US1.1, US1.5 |
| **Usability** | NFR-U2 | Validation errors display inline with specific guidance | All Epics | All Stories |
| **Usability** | NFR-U3 | All core workflows functional on mobile devices | Epic 5 | US5.2 |
| **Usability** | NFR-U4 | Role-scoped navigation shows only relevant features | Epic 5 | US5.3 |
| **Data Privacy** | NFR-DP1 | LGPD compliance (Brazil) - data export/deletion | Epic 9 | US9.2 |
| **Data Privacy** | NFR-DP2 | GDPR-aligned privacy - right to access, erasure, portability | Epic 9 | US9.2 |
| **Data Privacy** | NFR-DP3 | Phase 1: Nile US-West-2, Phase 2: LATAM data residency | Epic 6 | US6.2 |
| **Data Privacy** | NFR-DP4 | Session cookies only (strictly necessary), no third-party tracking | Epic 7 | US7.5 |
| **Data Privacy** | NFR-DP5 | 30-day soft delete then hard delete for deleted workspaces | Epic 9 | US9.2 |
| **Integration** | NFR-I1 | OAuth flow completes in <5 seconds (95th percentile) | Epic 7 | US7.2 |
| **Integration** | NFR-I2 | PostHog event tracking (client + server-side) | All Epics | All Stories |
| **Integration** | NFR-I3 | Resend API integration with <10s delivery SLA | Epic 8 | US8.1, US8.4 |
| **Integration** | NFR-I4 | REST API architecture designed for Phase 2 | Epic 6 | US6.2 |

### Coverage Summary

✅ **68 Functional Requirements** → Mapped to **48 user stories** across **8 epics**
✅ **29 Non-Functional Requirements** → Validated across **all 9 epics**
✅ **Additional User Management Features** → Mapped to **15 user stories** in **Epic 9**
✅ **100% Coverage** → Every requirement traceable to at least one user story

## Epic List

### Epic Summary Table

| Epic | Business Value | High-Level Success Metric | Phase |
|------|----------------|---------------------------|-------|
| Epic 1: Frictionless Workspace Activation | Revenue Capture | <60s Creation-to-Login | Phase 1 |
| Epic 2: High-Velocity Support Workflow | Cost Reduction | +30% Tickets per Hour | Phase 1 |
| Epic 3: Knowledge Base for Self-Service | Efficiency & Scaling | >50% Reduction in Repetitive Queries | Phase 1 |
| Epic 4: Institutional Brand Sovereignty | Client Retention | 100% Brand Consistency | Phase 1 |
| Epic 5: Team Collaboration & Access Control | Governance & Scaling | Secure Multi-User Workspaces | Phase 1 |
| Epic 6: Platform Reliability & Multi-Tenant Trust | Platform Trust | Zero Zombie Workspaces, Zero Data Leakage | Phase 1 |
| Epic 7: Seamless Authentication & Identity | User Access | Frictionless Login, Secure Sessions | Phase 1 |
| Epic 8: Timely Customer Communication | Engagement & Retention | <30s Email Delivery, Branded Touchpoints | Phase 1 |
| Epic 9: User Account Management & Security | User Control & Trust | Self-Service Account Management, Advanced Security | Phase 1 |

---

## Epic 1: Frictionless Workspace Activation

**Business Outcome:** Minimize user friction and abandonment during onboarding to drive immediate product adoption and revenue capture.

**Business Value:** Time-to-Value (Revenue Capture)

**High-Level Success Metric:** <60 seconds from landing page to functional, branded dashboard

**Persona:** Workspace Owner (Sarah Chen - Head of Customer Success)

**User Journey Context:** Sarah arrives exhausted at 11 PM, burned by complex tools. She needs something that works "tonight" with zero friction. Every additional 30 seconds increases abandonment risk by 20% (Zendesk data). This epic enables her to create a workspace, upload her logo, and invite her first teammate within 60 seconds total.

**Key User Stories:**

**US1.1: Single-Session Workspace Creation**
- **As a** Workspace Owner
- **I want to** create a unique, branded workspace in a single form submission
- **So that** I can begin serving my customers immediately without multi-step wizards

**Acceptance Criteria:**
- Workspace creation completes in one session without manual retries or confirmation emails
- User provides only essential data: workspace name, URL slug, admin name, email, password (6 fields maximum)
- Real-time URL validation prevents submission conflicts (debounced <300ms)
- Initial branding (logo upload optional) is applied and visible across all views instantly
- Admin is automatically authenticated into the new workspace upon creation
- Total time from form submission to functional dashboard: <60 seconds (90th percentile)

**US1.2: Fail-Safe Atomic Provisioning**
- **As a** Workspace Owner
- **I want** an automated, fail-safe setup process
- **So that** I don't encounter "partially created" workspaces that require support intervention

**Acceptance Criteria:**
- Workspace provisioning succeeds completely or rolls back entirely (zero "zombie workspaces")
- If any step fails (user creation, branding setup, session initialization), all progress is reversed
- Workspace URL is freed for retry if provisioning fails
- User receives clear error message with actionable recovery steps (not generic "Error occurred")
- User can resume with pre-filled form data after recoverable failures

**US1.3: Smart URL Conflict Resolution**
- **As a** Workspace Owner
- **I want** intelligent suggestions when my preferred workspace URL is taken
- **So that** I don't waste time guessing alternatives or feel frustrated

**Acceptance Criteria:**
- Real-time URL availability check during form input (debounced 300ms)
- Smart suggestions provided when URL is taken (e.g., "acme" → "acme-support", "acme-cs")
- User can select suggested alternative with one click (auto-fills form)
- Race condition protection prevents two users reserving same URL simultaneously

**US1.4: Progress Persistence Through Interruptions**
- **As a** Workspace Owner
- **I want** my workspace setup progress saved if I'm interrupted
- **So that** I don't lose my work if I accidentally close the browser or navigate away

**Acceptance Criteria:**
- Form data persists through browser refresh or accidental navigation
- Logo upload progress recovers if network interrupted (chunked upload with resume)
- "Continue your workspace setup" banner appears if user returns after interruption
- User can choose to resume or start fresh

**US1.5: Instant Branded Dashboard**
- **As a** Workspace Owner
- **I want** to see my brand (logo, colors) applied immediately upon workspace creation
- **So that** I feel ownership and see tangible progress instantly

**Acceptance Criteria:**
- Workspace logo appears in navigation header immediately after creation
- Primary and accent colors applied to dashboard UI (buttons, links, headers)
- Branded empty state shows clear next steps (not generic platform branding)
- "Getting Started" checklist visible with 3 high-impact items

---

## Epic 2: High-Velocity Support Workflow

**Business Outcome:** Maximize agent productivity and reduce Mean Time to Resolve (MTTR) by maintaining an uninterrupted flow state during ticket resolution.

**Business Value:** Operational Excellence (Cost Reduction)

**High-Level Success Metric:** +30% increase in tickets handled per agent per hour

**Persona:** Support Agent (Priya Patel - Junior Agent with impostor syndrome)

**User Journey Context:** Priya handles 50-100 tickets per day. Every mouse click, page load, or context switch breaks her flow state and increases cognitive fatigue. This epic enables her to resolve tickets using only keyboard shortcuts, with instant UI feedback and zero perceived latency.

**Key User Stories:**

**US2.1: Instant UI Feedback for All Actions**
- **As a** Support Agent
- **I want** my workspace to respond instantly to every action
- **So that** I can handle high ticket volumes without cognitive fatigue or waiting for spinners

**Acceptance Criteria:**
- UI feedback for state changes (e.g., "Resolve ticket") appears in <200ms perceived latency
- No loading spinners for primary actions (ticket resolution, status updates, navigation)
- Optimistic UI shows result immediately, background sync confirms
- Network failures display inline retry button (not full-page error or blocking modal)

**US2.2: Permanent Draft Persistence**
- **As a** Support Agent
- **I want** my work-in-progress saved automatically as I type
- **So that** I never lose a draft due to browser crashes, accidental closures, or session expiry

**Acceptance Criteria:**
- Drafts persist even if browser tab closed abruptly (localStorage + database dual-write)
- Auto-save triggered 500ms after typing pause (not timer-based)
- "Draft saved 5 seconds ago" timestamp visible below editor for confidence
- Draft recovery banner appears if agent returns to ticket: "Restore unsaved draft from 10 minutes ago?"
- Drafts survive session expiry (stored in database, not session)

**US2.3: Keyboard-Only Resolution Flow**
- **As a** Support Agent
- **I want** to resolve tickets using only keyboard shortcuts
- **So that** I can maintain flow state without reaching for the mouse

**Acceptance Criteria:**
- CMD+Enter resolves ticket AND loads next ticket atomically (auto-advance)
- /kb triggers knowledge base insertion menu (fuzzy search with arrow keys navigation)
- CMD+K opens command palette for universal action launcher
- Full keyboard navigation with visible focus indicators (skip links for accessibility)
- Keyboard-only workflow allows resolving ticket in <3 keystrokes

**US2.4: Manual Ticket Picking from Queue**
- **As a** Support Agent
- **I want** to manually pick tickets from an unassigned queue
- **So that** I have agency over my workload and can prioritize based on my expertise

**Acceptance Criteria:**
- Agents see queue of unassigned Open tickets (not auto-assigned)
- "Pick Ticket" button assigns ticket to agent and loads in detail view
- Agent can view only tickets they've picked (role-scoped view reduces noise)
- Queue updates via short polling (15-30s intervals) with optimistic UI

**US2.5: Threaded Conversation Clarity**
- **As a** Support Agent
- **I want** ticket conversations displayed as chat bubbles
- **So that** I can quickly understand the conversation flow with LATAM-familiar patterns

**Acceptance Criteria:**
- Customer messages displayed as left-aligned chat bubbles
- Agent replies displayed as right-aligned chat bubbles
- "visto" (read) checkmarks on agent replies (WhatsApp-style status receipts)
- Markdown rendering for agent replies (formatting preserved)
- Customer history visible in right sidebar (3 most recent tickets)

**US2.6: Spatial Consistency (3-Pane Layout)**
- **As a** Support Agent
- **I want** a fixed, predictable layout where elements never move
- **So that** I can operate the tool "eyes-closed" after ticket #30 and reduce cognitive load

**Acceptance Criteria:**
- Navigation Rail (left, 60px fixed width) never moves or collapses
- Ticket List View (center, 320px) always visible with scrollable queue
- Ticket Detail View (right, flexible width) shows active ticket
- No page reloads, no modals for core flows, no nested tabs
- Eye-tracking shows <10% fixation time on navigation after ticket #30

---

## Epic 3: Knowledge Base for Self-Service

**Business Outcome:** Lower the cost per ticket by leveraging institutional knowledge for self-service and assisted resolutions.

**Business Value:** Efficiency & Scaling

**High-Level Success Metric:** >50% reduction in repetitive customer questions

**Persona:** Support Agent (for authoring) / Workspace Admin (for governance) / Customer (for self-service)

**User Journey Context:** Agents repeatedly answer the same questions ("How do I reset my password?"). Admins want a centralized knowledge base that agents can reference in ticket replies and customers can self-serve. This epic enables rapid KB authoring with Markdown and seamless insertion into ticket conversations.

**Key User Stories:**

**US3.1: Rapid Knowledge Base Authoring**
- **As a** Workspace Admin
- **I want** to create help articles quickly using a simple Markdown editor
- **So that** I can publish institutional knowledge without learning complex WYSIWYG tools

**Acceptance Criteria:**
- Simple Markdown editor with syntax highlighting and live preview toggle
- Publish toggle switches article between Draft and Published status instantly
- Auto-save every 10 seconds after typing pause (prevents data loss)
- Article creation flow completes in <2 minutes from "New Article" to "Publish"

**US3.2: Knowledge Base Discovery via Search**
- **As a** Customer
- **I want** to search the knowledge base using keywords
- **So that** I can find answers without creating a support ticket

**Acceptance Criteria:**
- Public list view shows all published articles (not drafts)
- Keyword search filters articles by title and content (basic text matching)
- Search results display article title, excerpt, and author
- Articles render with Markdown formatting (headings, lists, code blocks, links)

**US3.3: KB Insertion in Ticket Replies**
- **As a** Support Agent
- **I want** to insert knowledge base articles into my ticket replies using keyboard shortcuts
- **So that** I can provide consistent, accurate answers in seconds

**Acceptance Criteria:**
- /kb slash command triggers KB insertion menu in reply editor
- Fuzzy search shows matching articles with arrow keys navigation
- Enter key inserts article link at cursor position
- Recently used articles appear first in auto-complete (progressive proficiency)

**US3.4: Safe Article Archiving (Soft Delete)**
- **As a** Workspace Admin
- **I want** to archive outdated articles without breaking ticket history
- **So that** I can maintain a clean knowledge base without destroying references

**Acceptance Criteria:**
- Archive button marks article as archived (soft delete, not hard delete)
- Archived articles remain accessible via direct link for 30 days (ticket history preserved)
- Warning appears when deleting article referenced in open tickets: "3 tickets link to this article. Archive instead?"
- Archived articles hidden from public list view and search results

---

## Epic 4: Institutional Brand Sovereignty

**Business Outcome:** Enable B2B clients to maintain their brand identity, increasing perceived value and white-label quality of the service for client retention.

**Business Value:** Trust & Identity (Client Retention)

**High-Level Success Metric:** 100% brand consistency across web and email communications

**Persona:** Workspace Owner / Admin (Sarah Chen - Head of Customer Success)

**User Journey Context:** Sarah's customers must perceive they're interacting with "ZenithSupport," not a generic platform. Every pixel must reflect her brand identity. This epic enables instant branding application (logo, colors) visible across dashboard and emails within <50ms of page load.

**Key User Stories:**

**US4.1: Instant Visual Brand Identity**
- **As a** Workspace Owner
- **I want** the portal to reflect my brand's exact visual identity
- **So that** my customers feel they are interacting directly with my company

**Acceptance Criteria:**
- Visual themes (logo, primary color, accent color) remain consistent across web dashboard and email communications
- Logo upload (SVG/PNG, max 500KB) displays in navigation header immediately after upload
- Color picker applies primary and accent colors to buttons, links, headers in real-time
- Preview mode shows branding changes before saving (IKEA effect: ownership emotion)
- Branding visible before First Contentful Paint (<50ms CSS injection via middleware)

**US4.2: Localized Regional Settings (LATAM)**
- **As a** Workspace Owner in LATAM
- **I want** timezone and language settings for my specific region
- **So that** our communications feel personal and professional to our customers

**Acceptance Criteria:**
- All timestamps displayed in workspace-configured timezone (e.g., America/Sao_Paulo for Brazil)
- Date formatting follows LATAM conventions (dd/mm/yyyy format, not mm/dd/yyyy)
- Language toggle supports Spanish (es-LA) and English (en-US) for entire workspace
- Invitation emails and transactional emails render in workspace's configured language
- Time-sensitive features (e.g., "invitation expires in 2 days") respect workspace timezone

**US4.3: Branded Email Communications**
- **As a** Workspace Owner
- **I want** all emails sent from my workspace to include my logo and colors
- **So that** my brand identity is consistent across all customer touchpoints

**Acceptance Criteria:**
- Invitation emails display workspace logo (200px max width, responsive)
- Email templates use workspace primary and accent colors for headers and buttons
- "From" name shows workspace name (e.g., "ZenithSupport Team" not "CustomerDeskAI")
- Email footer includes workspace branding (logo + name)
- Mobile email rendering tested across 5 major clients (Apple Mail, Gmail, Outlook, Yahoo, ProtonMail)

**US4.4: Zero Platform Branding Leakage**
- **As a** Workspace Owner
- **I want** zero visible references to the platform brand
- **So that** my customers perceive this as my company's native support portal

**Acceptance Criteria:**
- All tenant assets served via workspace subdomain (e.g., `zenithsupport.customerdeskai.com/_assets/logo.png`)
- Zero direct cloud storage URLs exposed to browser (no `s3.amazonaws.com` links)
- Error pages (404, 500) display workspace branding (not platform defaults)
- Favicon uses workspace logo (not platform favicon)

---

## Epic 5: Team Collaboration & Access Control

**Business Outcome:** Enable workspace owners to scale their support teams securely with role-based access control and frictionless team invitations.

**Business Value:** Governance & Scaling

**High-Level Success Metric:** Secure multi-user workspaces with <5-minute invite-to-active timeline

**Persona:** Workspace Owner (Sarah - invites team) / Invited Admin (Marcus - accepts invitation) / Invited Agent (Priya - joins team)

**User Journey Context:** Sarah invites Marcus (Admin) at 11:12 PM. Marcus accepts invitation on mobile at 11:54 PM and immediately invites Priya (Agent) at 12:00 AM. Priya accepts at 9:00 AM and resolves her first ticket by 10:11 AM. This epic enables rapid team scaling with role-scoped permissions.

**Key User Stories:**

**US5.1: Email-Based Team Invitations**
- **As a** Workspace Owner
- **I want** to invite team members by email with clear role assignment
- **So that** I can rapidly scale my support team without manual account creation

**Acceptance Criteria:**
- Owner can invite Admins or Agents by email address with role selection
- Admin can invite Agents only (not other Admins or Owners)
- Personal message field allows context: "Marcus, setting up our new support platform. -Sarah"
- Invitation email delivered within <30 seconds (95th percentile)
- Invitation expires after 7 days with exact expiry timestamp in workspace timezone

**US5.2: One-Click Invitation Acceptance**
- **As an** Invited Team Member
- **I want** to accept invitations with one click and minimal friction
- **So that** I can join the workspace immediately without complex signup flows

**Acceptance Criteria:**
- Invitation acceptance page pre-fills name and email (user enters only password)
- Mobile-responsive design with 44px touch targets for mobile acceptance
- Role description visible: "You're joining as Admin - you can invite team members..."
- Automatic authentication upon account creation (no separate login step)
- Idempotent invitation links (multi-click tolerance, device-agnostic)

**US5.3: Role-Scoped Workspace Views**
- **As a** Support Agent
- **I want** to see only data relevant to my role
- **So that** I'm not overwhelmed by workspace noise or features I can't use

**Acceptance Criteria:**
- Agents see only tickets they've picked (not all workspace tickets)
- Admins see all workspace tickets and can reassign between agents
- Owners see workspace overview (all agents, all tickets, billing)
- Navigation menu shows only role-appropriate features (Agents don't see "Invite Team" button)
- Progressive disclosure on role promotion: "New: Invite Team" badge appears if Agent promoted to Admin

**US5.4: Multi-Workspace Switching**
- **As a** User belonging to multiple workspaces
- **I want** to switch between workspaces seamlessly
- **So that** I can manage multiple clients or organizations without separate logins

**Acceptance Criteria:**
- Workspace switcher visible in navigation header
- Switching workspaces redirects to new subdomain (e.g., `acme.customerdeskai.com` → `zenith.customerdeskai.com`)
- User's role can differ per workspace (Admin in Workspace A, Agent in Workspace B)
- Last active workspace stored in user preferences
- No cross-tenant data contamination (subdomain-based security origins)

**US5.5: Invitation Resend for Expired Links**
- **As a** Workspace Owner
- **I want** to resend expired invitations without re-entering all details
- **So that** I don't waste time when team members miss the 7-day expiry window

**Acceptance Criteria:**
- Expiry page shows self-service resend flow: "This invitation expired. Request new invitation?"
- Email sent to workspace owner: "Marcus tried to join but invitation expired. Resend?"
- Owner can resend invitation with one click (pre-fills previous data)
- New invitation link sent with fresh 7-day expiry

---

## Epic 6: Platform Reliability & Multi-Tenant Trust

**Business Outcome:** Build trust in the platform through zero-failure workspace provisioning and absolute data isolation between tenants.

**Business Value:** Platform Trust (Retention & Reputation)

**High-Level Success Metric:** Zero zombie workspaces, zero data leakage between tenants

**Persona:** All users (trust in platform reliability) / Workspace Owner (data sovereignty)

**User Journey Context:** Sarah trusts CustomerDeskAI with her company's support data. If workspace provisioning partially fails or data leaks to another tenant, she churns immediately. This epic ensures atomic workspace creation and absolute tenant isolation.

**Key User Stories:**

**US6.1: Zero Zombie Workspaces**
- **As a** Workspace Owner
- **I want** workspace creation to succeed completely or fail gracefully
- **So that** I never encounter "partially created" workspaces that block my URL or require support cleanup

**Acceptance Criteria:**
- Workspace provisioning is atomic: all steps succeed or all steps roll back
- If user creation fails, workspace URL is freed for retry (not locked)
- If session initialization fails, user and workspace are deleted (clean rollback)
- Clear error messages guide recovery: "Email already registered. Please login or use different email."
- Integration tests verify rollback at each failure point

**US6.2: Absolute Tenant Data Isolation**
- **As a** Workspace Owner
- **I want** absolute certainty that my data is isolated from other workspaces
- **So that** I trust the platform with sensitive customer support conversations

**Acceptance Criteria:**
- Subdomain-based tenant isolation prevents cross-tenant cookie contamination
- All database queries validated to include tenant filter (prevents accidental cross-tenant queries)
- Security audit confirms zero data leakage between tenants
- Attack scenario testing: Admin in Tenant A cannot access Tenant B data even with privilege escalation attempts

**US6.3: Transparent Audit Trail**
- **As a** Workspace Owner
- **I want** visibility into who did what in my workspace
- **So that** I can maintain accountability and troubleshoot issues

**Acceptance Criteria:**
- All state-changing actions logged with user_id + tenant_id + action + timestamp
- Failed authentication attempts logged and monitored
- Security event detection for suspicious activity patterns
- Workspace owners can access audit logs (Phase 2 feature, infrastructure prepared in Phase 1)

---

## Epic 7: Seamless Authentication & Identity

**Business Outcome:** Enable frictionless, secure access to workspaces with multiple authentication methods and persistent sessions.

**Business Value:** User Access (Conversion & Retention)

**High-Level Success Metric:** Frictionless login with <5-second OAuth flows, 30/90-day session persistence

**Persona:** All users (Workspace Owners, Admins, Agents)

**User Journey Context:** Marcus receives invitation on mobile, clicks Google OAuth, authenticates in 3 seconds, and is immediately active in workspace. Priya forgets password, clicks "Forgot Password," receives reset email in 10 seconds, and regains access in 2 minutes total.

**Key User Stories:**

**US7.1: Email/Password Sign Up & Sign In**
- **As a** New User
- **I want** to create an account using email and password
- **So that** I can access the platform without requiring a social provider account

**Acceptance Criteria:**
- Sign up form validates email format and password complexity (min 12 chars)
- Sign up completes in <3 seconds with automatic authentication
- Sign in with email/password functional with clear error messages ("Invalid credentials")
- "Remember me" checkbox extends session from 30 days to 90 days
- Account creation sends verification email (optional verification, not blocking login)

**US7.2: Social Provider Authentication**
- **As a** User
- **I want** to sign in using Google or GitHub
- **So that** I can access the platform quickly without managing another password

**Acceptance Criteria:**
- Google OAuth flow completes in <5 seconds (95th percentile)
- GitHub OAuth flow completes in <5 seconds (95th percentile)
- Account linking by email prevents duplicate accounts (user@acme.com via Google = same user as email/password)
- Social sign-in redirects to last active workspace or workspace selector
- Clear error handling for OAuth failures ("Google authentication failed. Try again or use email/password.")

**US7.3: Sign Out**
- **As a** User
- **I want** to sign out of my current session
- **So that** I can secure my account when using shared devices

**Acceptance Criteria:**
- Sign out button visible in user profile menu
- Sign out clears session cookie and redirects to login page
- Signed-out users cannot access protected pages (redirect to login)
- Option to "Sign out from all devices" available in security settings (see Epic 9)

**US7.4: Forgot Password Flow**
- **As a** User who forgot my password
- **I want** to receive a password reset link via email
- **So that** I can regain access without contacting support

**Acceptance Criteria:**
- "Forgot Password" link on login page triggers email flow
- Password reset email delivered in <10 seconds with workspace branding
- Reset token valid for 24 hours (single-use)
- Reset page validates new password complexity (min 12 chars)
- User redirected to login page after successful reset with success message

**US7.5: Persistent Sessions with Activity Renewal**
- **As a** User
- **I want** my login session to persist for 30 days
- **So that** I don't have to re-authenticate every time I return

**Acceptance Criteria:**
- Default session expiry: 30 days from last activity
- "Remember me" checkbox extends session to 90 days
- Session renewal on user activity (session doesn't expire if user is active)
- 15-minute grace period before hard session expiry with persistent warning banner
- "Session expiring soon" warning allows one-click session renewal

**US7.6: Graceful Session Expiry Handling**
- **As a** User working on a ticket
- **I want** my drafts to persist if my session expires
- **So that** I don't lose work due to session timeout

**Acceptance Criteria:**
- Drafts stored in database (not session), survive session expiry
- "Session expiring in 15 minutes. Save work and re-login." banner appears
- Seamless re-auth with redirect back to original page after login
- No data loss if session expires while typing (drafts recoverable)

---

## Epic 8: Timely Customer Communication

**Business Outcome:** Enable timely, branded customer engagement through transactional emails with <30-second delivery SLA.

**Business Value:** Engagement & Retention

**High-Level Success Metric:** <30-second email delivery (95th percentile), 100% branded touchpoints

**Persona:** All users (receive emails) / Customers (receive ticket notifications)

**User Journey Context:** Sarah sends invitation to Marcus at 11:10 PM. Marcus receives email at 11:10:08 PM (8 seconds later) with ZenithSupport branding. He clicks "Accept Invitation" and joins immediately. This epic enables rapid, branded email delivery for all transactional communications.

**Key User Stories:**

**US8.1: Rapid Email Delivery**
- **As a** User receiving transactional emails
- **I want** emails delivered within 30 seconds
- **So that** I can act on invitations, password resets, and notifications immediately

**Acceptance Criteria:**
- Invitation emails delivered in <30 seconds (95th percentile) from send to inbox arrival
- Password reset emails delivered in <10 seconds (95th percentile)
- Ticket notification emails delivered in <30 seconds
- Webhook tracking confirms delivery (delivered, bounced, complained events)
- Synthetic monitoring sends test invites every 15 minutes to validate SLA

**US8.2: Branded Email Templates**
- **As a** Workspace Owner
- **I want** all emails sent from my workspace to include my branding
- **So that** customers perceive emails as coming from my company, not a platform

**Acceptance Criteria:**
- Invitation emails display workspace logo (200px max width, responsive)
- Email templates use workspace primary and accent colors
- Email content rendered in workspace's configured language (Spanish or English)
- "From" name shows workspace name (e.g., "ZenithSupport Team")
- Mobile email rendering tested across 5 major clients

**US8.3: Timezone-Aware Email Content**
- **As a** User receiving invitation or notification emails
- **I want** timestamps displayed in my workspace's timezone
- **So that** expiry dates and event times are clear and unambiguous

**Acceptance Criteria:**
- Invitation emails show exact expiry with timezone: "Expires Dec 22, 2025 at 11:10 PM PST"
- Countdown timers respect workspace timezone: "Expires in 6 days, 23 hours"
- DST-aware using IANA timezone identifiers (e.g., "America/Sao_Paulo")
- All timestamps in email match workspace timezone (not UTC)

**US8.4: Email Deliverability Monitoring**
- **As a** Platform Administrator
- **I want** visibility into email delivery success rates
- **So that** I can maintain the <30-second SLA and troubleshoot failures

**Acceptance Criteria:**
- Webhook tracking for all email events (delivered, bounced, complained)
- Bounce rate monitored and alerted (target <2% for valid addresses)
- Retry logic with exponential backoff for transient failures
- Manual fallback: support can manually send invitation links if delivery fails

---

## Epic 9: User Account Management & Security

**Business Outcome:** Enable users to manage their accounts securely with self-service profile management, advanced session control, and two-factor authentication for enhanced security.

**Business Value:** User Control & Trust (Retention & Security)

**High-Level Success Metric:** Self-service account management reduces support burden, 2FA adoption >30% for security-conscious users

**Persona:** All users (Workspace Owners, Admins, Agents) managing their personal accounts

**User Journey Context:** Priya wants to update her profile photo and enable 2FA for security. Marcus needs to see which devices are logged into his account and remotely sign out a suspicious session. Sarah wants to link her GitHub account for faster login. This epic enables comprehensive self-service account management.

**Key User Stories:**

**US9.1: Profile Management**
- **As a** User
- **I want** to view and update my profile information
- **So that** my account reflects my current details and preferences

**Acceptance Criteria:**
- Profile page displays current name, email, profile image, and account creation date
- Users can update their name with instant save (optimistic UI)
- Users can upload profile image (max 2MB, JPG/PNG/WEBP, auto-crop to square)
- Profile image displays in navigation header and ticket threads
- Users can change email with verification flow (email sent to new address, link to confirm)
- Email change requires current password for security

**US9.2: Account Deletion with Confirmation**
- **As a** User
- **I want** to delete my account permanently
- **So that** I can remove my data if I no longer use the platform

**Acceptance Criteria:**
- "Delete Account" button visible in security settings (destructive action styling)
- Multi-step confirmation required: Type "DELETE" to confirm, then enter password
- Warning message explains consequences: "This will remove you from all workspaces and delete your data permanently"
- 30-day grace period for data recovery (soft delete), then hard delete
- User receives confirmation email after deletion
- If user is the only Owner of a workspace, account deletion blocked (must transfer ownership first)

**US9.3: Password Change (Requires Current Password)**
- **As a** User
- **I want** to change my password securely
- **So that** I can maintain account security if I suspect compromise

**Acceptance Criteria:**
- "Change Password" form requires current password + new password + confirm new password
- Password complexity validated (min 12 chars)
- Password change triggers confirmation email ("Your password was changed")
- Option to "Sign out all other devices" after password change (recommended for security)
- Clear error messages: "Current password incorrect" or "New passwords don't match"

**US9.4: Session Management Dashboard**
- **As a** User
- **I want** to view all my active sessions with device and location details
- **So that** I can monitor account access and detect suspicious activity

**Acceptance Criteria:**
- Session management page lists all active sessions with: Device type, Browser, IP address, Approximate location (city/country), Last active timestamp, "Current session" badge
- Users can sign out from a specific session remotely ("Sign out" button per session)
- "Sign out all devices" button signs out all sessions except current
- "Sign out from all OTHER devices" button keeps current session active
- Session list auto-refreshes every 30 seconds (short polling)

**US9.5: Sign Out All Devices on Password Change**
- **As a** User who changed my password
- **I want** the option to sign out all devices automatically
- **So that** I can ensure no unauthorized sessions remain active

**Acceptance Criteria:**
- Password change form includes checkbox: "Sign out all other devices (recommended)"
- Checkbox pre-selected by default for security
- If selected, all sessions except current are invalidated immediately
- Confirmation message: "Password changed. All other devices signed out."
- Other devices show "Session expired. Please sign in again." on next request

**US9.6: Linked Social Accounts Management**
- **As a** User
- **I want** to link and manage social provider accounts
- **So that** I can use multiple login methods and switch providers easily

**Acceptance Criteria:**
- "Linked Accounts" page shows all connected providers (Google, GitHub) with connection status
- "Link Google Account" button triggers OAuth flow, links account by email
- "Link GitHub Account" button triggers OAuth flow
- Users can unlink social accounts (requires at least one login method remains active)
- Warning before unlinking: "You'll need email/password or another linked account to sign in"
- Account linking prevents duplicate accounts (email-based matching)

**US9.7: Two-Factor Authentication (2FA) Setup**
- **As a** User
- **I want** to enable two-factor authentication
- **So that** my account is protected even if my password is compromised

**Acceptance Criteria:**
- "Enable 2FA" button in security settings triggers setup flow
- QR code generated for authenticator app (Google Authenticator, Authy, 1Password)
- User scans QR code and enters 6-digit TOTP code to verify
- Backup codes generated (10 single-use codes) and displayed for download/print
- 2FA enabled only after successful TOTP verification
- Warning: "Save backup codes in a secure location. You'll need them if you lose access to your authenticator app."

**US9.8: Two-Factor Authentication Verification**
- **As a** User with 2FA enabled
- **I want** to verify my identity with authenticator code on login
- **So that** my account remains secure

**Acceptance Criteria:**
- After email/password login, 2FA prompt appears: "Enter code from authenticator app"
- 6-digit TOTP code input with 30-second validity window
- "Use backup code instead" link available if authenticator unavailable
- Backup codes are single-use (marked as used after verification)
- "Trust this device for 30 days" checkbox skips 2FA on trusted devices
- Failed 2FA attempts logged (security monitoring)

**US9.9: 2FA Backup Codes and Recovery**
- **As a** User with 2FA enabled
- **I want** backup codes for account recovery
- **So that** I can access my account if I lose my authenticator device

**Acceptance Criteria:**
- 10 backup codes generated during 2FA setup (single-use, random 8-digit codes)
- Users can regenerate backup codes (invalidates previous codes)
- "Download backup codes" button saves as .txt file
- Backup code verification on login: Enter code, single-use validation, redirect to account
- Warning when only 3 backup codes remain: "Generate new backup codes soon"

**US9.10: Disable Two-Factor Authentication**
- **As a** User with 2FA enabled
- **I want** to disable 2FA if I no longer need it
- **So that** I can simplify my login process

**Acceptance Criteria:**
- "Disable 2FA" button in security settings (requires current password + 2FA code)
- Confirmation dialog: "Are you sure? This will make your account less secure."
- 2FA disabled after password + TOTP verification
- Backup codes invalidated when 2FA disabled
- Confirmation email sent: "Two-factor authentication was disabled on your account"

**US9.11: Organization/Workspace Switcher**
- **As a** User belonging to multiple workspaces
- **I want** to view all my workspaces and switch between them
- **So that** I can manage multiple client accounts or teams efficiently

**Acceptance Criteria:**
- "My Workspaces" dropdown in navigation header lists all workspaces
- Each workspace shows: Workspace name, Logo thumbnail, User's role (Owner/Admin/Agent)
- Clicking workspace redirects to new subdomain (e.g., `acme.customerdeskai.com` → `zenith.customerdeskai.com`)
- Last active workspace stored in user preferences (auto-select on login)
- "Accept Invitation" notification badge appears for pending invitations

**US9.12: Accept Workspace Invitation**
- **As a** User who received a workspace invitation
- **I want** to accept invitations from the workspace switcher
- **So that** I can join teams without clicking email links

**Acceptance Criteria:**
- Pending invitations appear in workspace switcher with "Pending" badge
- "Accept Invitation" button visible for pending workspaces
- Acceptance requires email verification (link sent to email, click to confirm)
- After acceptance, workspace added to "My Workspaces" list
- User can switch to newly joined workspace immediately

**US9.13: Leave Workspace**
- **As a** User
- **I want** to leave a workspace I no longer use
- **So that** I can declutter my workspace list

**Acceptance Criteria:**
- "Leave Workspace" button in workspace settings (not visible to Workspace Owners)
- Confirmation dialog: "Are you sure? You'll lose access to all tickets and data in this workspace."
- Workspace removed from user's workspace list after confirmation
- Workspace Owner notified via email: "Marcus left your workspace"
- Cannot leave if user is the only Owner (must transfer ownership or delete workspace)

**US9.14: Security Status Dashboard**
- **As a** User
- **I want** to see my account security status at a glance
- **So that** I know which security measures are enabled

**Acceptance Criteria:**
- Security dashboard shows status indicators: Email verified (✓ or ✗), 2FA enabled (✓ or ✗), Password strength (Weak/Medium/Strong), Linked accounts count, Active sessions count
- "Improve Security" recommendations if 2FA disabled: "Enable 2FA for better protection"
- "Resend Verification Email" button if email unverified
- Last password change timestamp displayed
- Link to session management dashboard

**US9.15: Email Verification**
- **As a** User who signed up with email
- **I want** to verify my email address
- **So that** I can prove account ownership and receive important notifications

**Acceptance Criteria:**
- Verification email sent immediately after sign up (non-blocking - user can access account before verification)
- "Resend Verification Email" button in security settings if not verified
- Verification link valid for 7 days
- Clicking verification link marks email as verified and shows success message
- Verified badge appears in security dashboard
- Some features (e.g., password reset) require verified email

---

## Epic Breakdown Summary

### Total Epic Count: 9 Epics

### Total Story Count: 56 User Stories

**Story Distribution by Epic:**

- **Epic 1: Frictionless Workspace Activation** - 5 stories (US1.1 - US1.5)
- **Epic 2: High-Velocity Support Workflow** - 6 stories (US2.1 - US2.6)
- **Epic 3: Knowledge Base for Self-Service** - 4 stories (US3.1 - US3.4)
- **Epic 4: Institutional Brand Sovereignty** - 4 stories (US4.1 - US4.4)
- **Epic 5: Team Collaboration & Access Control** - 5 stories (US5.1 - US5.5)
- **Epic 6: Platform Reliability & Multi-Tenant Trust** - 3 stories (US6.1 - US6.3)
- **Epic 7: Seamless Authentication & Identity** - 6 stories (US7.1 - US7.6)
- **Epic 8: Timely Customer Communication** - 4 stories (US8.1 - US8.4)
- **Epic 9: User Account Management & Security** - 15 stories (US9.1 - US9.15)

### Requirements Coverage

**All 68 Functional Requirements + 29 Non-Functional Requirements mapped to business value streams:**

✅ **FR1-FR8** → Epic 1 (Workspace Activation)
✅ **FR39-FR50** → Epic 2 (Support Workflow)
✅ **FR51-FR58, FR47** → Epic 3 (Knowledge Base)
✅ **FR32-FR38** → Epic 4 (Brand Sovereignty)
✅ **FR16-FR31** → Epic 5 (Team Collaboration & RBAC)
✅ **NFR-R2, NFR-S2, NFR-S6** → Epic 6 (Platform Reliability)
✅ **FR9-FR15** → Epic 7 (Basic Authentication)
✅ **FR59-FR63, NFR-I3, NFR-P4** → Epic 8 (Communication)
✅ **User Management Features** → Epic 9 (Advanced Account Management & Security)

### Phase 1 Priorities

All 9 epics are targeted for **Phase 1** delivery with the following suggested implementation order:

**Foundation (Week 1-2):**
1. Epic 7: Seamless Authentication & Identity (enables user access)
2. Epic 6: Platform Reliability & Multi-Tenant Trust (critical infrastructure)

**Core Workspace Features (Week 3-4):**
3. Epic 1: Frictionless Workspace Activation (onboarding)
4. Epic 4: Institutional Brand Sovereignty (white-label theming)

**Team Collaboration (Week 5-6):**
5. Epic 5: Team Collaboration & Access Control (invitations, RBAC)
6. Epic 8: Timely Customer Communication (email infrastructure)

**Support Workflow (Week 7-8):**
7. Epic 2: High-Velocity Support Workflow (ticket management)
8. Epic 3: Knowledge Base for Self-Service (KB management)

**Advanced Features (Week 9-10):**
9. Epic 9: User Account Management & Security (profile, 2FA, sessions)

### Next Steps

1. ✅ **FR Coverage Map**: Create detailed mapping of each FR/NFR to specific user stories (COMPLETE)
2. **Story Refinement**: Break down complex stories into smaller tasks if needed (IN PROGRESS - See Epic 9 refinement below)
3. **Technical Specification**: For each epic, create implementation plans (separate from this business value document)
4. **Acceptance Criteria Validation**: Review with stakeholders to ensure completeness
5. **Story Sizing**: Estimate story points for sprint planning

---

## Epic 9: Story Refinement & Task Breakdown

This section breaks down Epic 9's 15 user stories into concrete, sprint-ready tasks. Each story is decomposed into implementation tasks that can be assigned, estimated, and tracked during sprint execution.

### Story Refinement Principles

- **Tasks are ordered by implementation dependencies** (database → API → UI → integration)
- **Each task is independently testable** (unit tests, integration tests, E2E tests)
- **Acceptance criteria validation** is the final task for each story
- **Tasks sized for 2-4 hour completion** (optimal for daily standup granularity)

---

### US9.1: Profile Management

**Business Value:** Users can view and update their personal information to keep accounts current

**Implementation Tasks:**

**Task 9.1.1: Profile Data Model**
- Define user profile schema fields (name, email, profile_image_url, created_at, updated_at)
- Add profile_image_url column to users table (nullable, string, max 500 chars)
- Add email_verified_at column to users table (nullable, timestamp)
- Create database migration for new columns
- **Acceptance:** Migration runs successfully, rollback tested

**Task 9.1.2: Profile View API Endpoint**
- Create GET /api/user/profile endpoint returning current user profile
- Include fields: id, name, email, profile_image_url, email_verified, created_at
- Protect with authentication middleware (requires valid session)
- **Acceptance:** API returns 200 with user profile data, 401 if unauthenticated

**Task 9.1.3: Profile Update Name API**
- Create PATCH /api/user/profile/name endpoint accepting { name: string }
- Validate name (min 2 chars, max 100 chars, no special chars except spaces/hyphens)
- Update user name in database with optimistic locking (handle race conditions)
- **Acceptance:** Name updates successfully, validation errors return 400 with clear messages

**Task 9.1.4: Profile Image Upload API**
- Create POST /api/user/profile/image endpoint accepting multipart/form-data
- Validate file type (JPG, PNG, WEBP only), max size 2MB
- Auto-crop/resize to 256x256 square (maintain aspect ratio, center crop)
- Store in CDN-backed storage with tenant-scoped path
- Return CDN URL in response
- **Acceptance:** Image uploads successfully, returns CDN URL, invalid files rejected with 400

**Task 9.1.5: Email Change Request API**
- Create POST /api/user/profile/email/request endpoint accepting { new_email: string, password: string }
- Validate current password for security
- Check new email not already in use (case-insensitive)
- Generate email verification token (secure random, 32 bytes, 24-hour expiry)
- Send verification email to NEW email address with confirmation link
- **Acceptance:** Verification email sent, token stored, current password validated

**Task 9.1.6: Email Change Confirmation API**
- Create POST /api/user/profile/email/confirm endpoint accepting { token: string }
- Validate token not expired, not already used
- Update user email to new email
- Invalidate all sessions except current (security: prevent session hijacking)
- Mark email as verified (email_verified_at = now)
- **Acceptance:** Email updated, sessions invalidated, token becomes single-use

**Task 9.1.7: Profile Settings UI Page**
- Create /settings/profile route with profile form
- Display current name, email, profile image
- Name field with inline save (optimistic UI)
- Profile image upload with preview before save
- Email change button opens modal with password confirmation
- **Acceptance:** UI renders profile data, updates reflect immediately (optimistic), errors shown inline

**Task 9.1.8: Profile Image Display**
- Update navigation header to display profile image (32px circle avatar)
- Update ticket thread to show agent profile image (40px circle avatar)
- Fallback to initials if no image uploaded (name → "SC" for "Sarah Chen")
- **Acceptance:** Profile images visible in navigation and ticket threads, fallbacks work

**Task 9.1.9: Integration Testing**
- Test complete email change flow (request → verify → update)
- Test profile image upload with invalid files (size, type)
- Test concurrent name updates (optimistic locking)
- **Acceptance:** All flows work end-to-end, edge cases handled

---

### US9.2: Account Deletion with Confirmation

**Business Value:** Users can permanently delete their accounts to comply with GDPR/LGPD right to erasure

**Implementation Tasks:**

**Task 9.2.1: Account Deletion Data Model**
- Add deleted_at column to users table (nullable, timestamp for soft delete)
- Create account_deletion_requests table (user_id, requested_at, scheduled_deletion_at, deletion_reason)
- Add constraint: if user is sole Owner of workspace, block deletion
- **Acceptance:** Schema supports soft delete, 30-day grace period tracking

**Task 9.2.2: Pre-Deletion Validation API**
- Create GET /api/user/account/deletion/validate endpoint
- Check if user is sole Owner of any workspace
- Return blockers: list of workspaces where user is sole Owner
- Return warnings: list of workspaces user will be removed from
- **Acceptance:** API returns validation result, identifies blockers accurately

**Task 9.2.3: Account Deletion Request API**
- Create POST /api/user/account/deletion/request endpoint accepting { confirmation: "DELETE", password: string }
- Validate confirmation string matches "DELETE" exactly
- Validate current password
- Check pre-deletion validation passes (no blockers)
- Create deletion request with scheduled_deletion_at = now + 30 days
- Mark user as deleted_at = now (soft delete, immediate effect)
- Send confirmation email: "Account deletion scheduled for [date]. Cancel anytime before then."
- **Acceptance:** User soft-deleted, scheduled for hard delete in 30 days, email sent

**Task 9.2.4: Account Deletion Cancellation API**
- Create POST /api/user/account/deletion/cancel endpoint
- Require authentication (user must still have valid session)
- Clear deleted_at timestamp
- Delete account_deletion_requests record
- Send confirmation email: "Account deletion cancelled. Your account is active."
- **Acceptance:** Deletion cancelled, user account restored, email sent

**Task 9.2.5: Hard Delete Background Job**
- Create scheduled job (runs daily) to process hard deletes
- Query account_deletion_requests where scheduled_deletion_at <= now
- For each user: Remove from all tenant_users, Delete user sessions, Delete user profile data, Delete user record
- Log deletion for audit trail (user_id, deletion_date, triggered_by)
- **Acceptance:** Job runs successfully, hard deletes execute after 30 days

**Task 9.2.6: Account Deletion UI**
- Create /settings/account/delete route with deletion flow
- Step 1: Show pre-deletion validation (blockers, warnings)
- Step 2: Type "DELETE" confirmation input
- Step 3: Enter current password
- Step 4: Confirm deletion with destructive styling (red button)
- Success state: "Account deletion scheduled. You have 30 days to cancel."
- **Acceptance:** Multi-step flow prevents accidental deletion, clear warnings shown

**Task 9.2.7: Ownership Transfer Flow (Blocker Resolution)**
- If user is sole Owner, show "Transfer Ownership" modal
- List workspaces where user is sole Owner
- For each workspace: dropdown to select new Owner (must be existing Admin)
- Transfer ownership API: PATCH /api/workspace/{id}/owner accepting { new_owner_id: string }
- **Acceptance:** Ownership transferred, blocker removed, deletion can proceed

**Task 9.2.8: Integration Testing**
- Test deletion with sole Owner blocker (transfer ownership flow)
- Test deletion cancellation (restore account)
- Test hard delete job (30-day expiry)
- **Acceptance:** All flows work, data properly deleted after 30 days

---

### US9.3: Password Change (Requires Current Password)

**Business Value:** Users can change passwords securely to maintain account security

**Implementation Tasks:**

**Task 9.3.1: Password Change API**
- Create POST /api/user/password/change endpoint accepting { current_password: string, new_password: string, confirm_password: string }
- Validate current password matches (prevent unauthorized changes)
- Validate new password complexity (min 12 chars, max 128 chars)
- Validate new_password === confirm_password
- Hash new password with bcrypt (10 rounds)
- Update user password in database
- Send confirmation email: "Your password was changed on [device] at [time]"
- **Acceptance:** Password updated, current password validated, email sent

**Task 9.3.2: Password Strength Indicator**
- Create client-side password strength validator
- Check length (weak: <12, medium: 12-15, strong: 16+)
- Check character variety (lowercase, uppercase, numbers, special chars)
- Real-time feedback as user types: "Weak / Medium / Strong"
- **Acceptance:** Strength indicator updates in real-time, accurate scoring

**Task 9.3.3: Password Change UI**
- Create /settings/security/password route with password change form
- Three fields: Current Password, New Password, Confirm New Password
- Show password strength indicator below New Password field
- Show/hide password toggle for all fields (eye icon)
- Option checkbox: "Sign out all other devices" (pre-checked)
- **Acceptance:** Form validates inputs, shows strength feedback, clear error messages

**Task 9.3.4: Integration Testing**
- Test password change with invalid current password (401 error)
- Test password change with weak new password (400 error)
- Test password mismatch (new !== confirm) (400 error)
- **Acceptance:** All validation works, clear error messages

---

### US9.4: Session Management Dashboard

**Business Value:** Users can monitor active sessions and remotely sign out suspicious devices

**Implementation Tasks:**

**Task 9.4.1: Session Data Model Enhancement**
- Extend sessions table with: device_type (desktop/mobile/tablet), browser (Chrome/Firefox/Safari/etc), ip_address, city, country, last_active_at
- Add is_current_session boolean (identifies session making the request)
- Create index on user_id + last_active_at for fast queries
- **Acceptance:** Schema supports rich session metadata

**Task 9.4.2: Session Metadata Capture Middleware**
- Create middleware to extract device/browser from User-Agent header
- Use GeoIP lookup for approximate location (city, country) from IP address
- Update session record on every authenticated request with: last_active_at = now, ip_address, device_type, browser, city, country
- **Acceptance:** Session metadata captured accurately on every request

**Task 9.4.3: List Sessions API**
- Create GET /api/user/sessions endpoint returning all active sessions
- Include fields: session_id, device_type, browser, ip_address, city, country, last_active_at, is_current_session
- Sort by last_active_at DESC (most recent first)
- Mark current session (is_current_session = true)
- **Acceptance:** API returns all sessions with metadata, current session identified

**Task 9.4.4: Sign Out Specific Session API**
- Create DELETE /api/user/sessions/{session_id} endpoint
- Validate session_id belongs to authenticated user (prevent cross-user session termination)
- Delete session from database (immediate effect)
- **Acceptance:** Session deleted, target device signed out on next request

**Task 9.4.5: Sign Out All Devices API**
- Create DELETE /api/user/sessions/all endpoint
- Delete all sessions for authenticated user EXCEPT current session
- **Acceptance:** All other sessions deleted, current session remains active

**Task 9.4.6: Sign Out All OTHER Devices API**
- Create DELETE /api/user/sessions/others endpoint
- Delete all sessions for authenticated user EXCEPT current session
- Return count of deleted sessions in response
- **Acceptance:** All other sessions deleted, current session active, count accurate

**Task 9.4.7: Session Management UI**
- Create /settings/security/sessions route with session list
- Display each session as card: Device icon (desktop/mobile), Browser name + version, IP address, Location (City, Country), Last active timestamp (relative: "5 minutes ago"), "Sign Out" button (red, destructive)
- Current session badge: "This device (current session)"
- Bulk actions: "Sign Out All Devices" button, "Sign Out All Other Devices" button
- Auto-refresh every 30 seconds (short polling)
- **Acceptance:** UI shows all sessions, actions work, auto-refresh updates list

**Task 9.4.8: Integration Testing**
- Test sign out specific session (verify device signed out)
- Test sign out all devices (current session remains)
- Test concurrent session updates (last_active_at)
- **Acceptance:** All flows work, no session leakage

---

### US9.5: Sign Out All Devices on Password Change

**Business Value:** Ensures no unauthorized sessions remain active after password change

**Implementation Tasks:**

**Task 9.5.1: Enhanced Password Change API**
- Extend POST /api/user/password/change endpoint with query param: ?sign_out_all_devices=true
- If sign_out_all_devices=true: Delete all sessions EXCEPT current after password update
- If sign_out_all_devices=false: Keep all sessions active
- Default: true (recommended for security)
- **Acceptance:** Password change invalidates other sessions if requested

**Task 9.5.2: Password Change UI Enhancement**
- Add checkbox to password change form: "Sign out all other devices (recommended)"
- Pre-check checkbox by default
- Show tooltip: "Removes access from any devices where you're currently signed in"
- **Acceptance:** Checkbox controls session invalidation behavior

**Task 9.5.3: Session Invalidation Confirmation**
- After password change success, show confirmation message: "Password changed successfully. X other devices signed out." (if checkbox checked)
- Or: "Password changed successfully. All devices remain signed in." (if checkbox unchecked)
- **Acceptance:** User receives clear feedback on session invalidation

---

### US9.6: Linked Social Accounts Management

**Business Value:** Users can link multiple authentication methods for flexible login options

**Implementation Tasks:**

**Task 9.6.1: Linked Accounts Data Model**
- Create user_accounts table: user_id, provider (google/github), provider_account_id, email, linked_at
- Add unique constraint on (provider, provider_account_id) to prevent duplicate links
- Add foreign key user_id → users.id
- **Acceptance:** Schema supports multiple linked accounts per user

**Task 9.6.2: List Linked Accounts API**
- Create GET /api/user/accounts endpoint returning linked accounts
- Include fields: provider, email, linked_at
- Exclude sensitive data (provider_account_id, tokens)
- **Acceptance:** API returns linked accounts for authenticated user

**Task 9.6.3: Link Social Account API**
- Create POST /api/user/accounts/link/{provider} endpoint (provider = google|github)
- Initiate OAuth flow, redirect to provider authorization page
- On callback: Exchange auth code for provider account details (email, provider_account_id)
- Check email matches user's primary email (prevent account hijacking)
- Create user_accounts record
- **Acceptance:** OAuth flow links account, email validated, duplicate links prevented

**Task 9.6.4: Unlink Social Account API**
- Create DELETE /api/user/accounts/{provider} endpoint
- Validate user has at least one remaining login method (email/password OR another linked account)
- Delete user_accounts record for provider
- Return error if unlinking would leave account with zero login methods
- **Acceptance:** Account unlinked, validation prevents lockout

**Task 9.6.5: Linked Accounts UI**
- Create /settings/security/linked-accounts route
- Display each provider as card: Provider logo (Google/GitHub), Linked email address, Linked timestamp ("Linked 2 months ago"), "Unlink" button (destructive, disabled if only login method)
- "Link Google Account" button (if not linked)
- "Link GitHub Account" button (if not linked)
- Warning modal before unlink: "You'll need email/password or another linked account to sign in"
- **Acceptance:** UI shows linked accounts, link/unlink actions work

**Task 9.6.6: Integration Testing**
- Test linking account with mismatched email (should fail)
- Test unlinking last login method (should fail with error)
- Test signing in with newly linked account
- **Acceptance:** All flows work, edge cases handled

---

### US9.7: Two-Factor Authentication (2FA) Setup

**Business Value:** Users can enable 2FA to protect accounts from password compromise

**Implementation Tasks:**

**Task 9.7.1: 2FA Data Model**
- Add columns to users table: two_factor_enabled (boolean, default false), two_factor_secret (encrypted string, TOTP secret), two_factor_recovery_codes (encrypted JSON array)
- Create two_factor_trusted_devices table: user_id, device_id (hash of User-Agent + IP), trusted_at, expires_at
- **Acceptance:** Schema supports TOTP and trusted devices

**Task 9.7.2: 2FA Enable API - Generate Secret**
- Create POST /api/user/2fa/setup endpoint
- Generate TOTP secret (32-byte base32 encoded random string)
- Generate QR code data URL (otpauth:// URI with secret)
- Return: qr_code_data_url, secret (for manual entry fallback)
- Do NOT enable 2FA yet (requires verification first)
- **Acceptance:** QR code generated, secret stored temporarily (not enabled)

**Task 9.7.3: 2FA Enable API - Verify and Activate**
- Create POST /api/user/2fa/enable endpoint accepting { totp_code: string }
- Verify TOTP code against generated secret (30-second window, allow ±1 period drift)
- If valid: Enable 2FA (two_factor_enabled = true), Generate 10 backup codes (random 8-digit, single-use), Return backup codes in response
- If invalid: Return 400 error "Invalid code. Please try again."
- **Acceptance:** 2FA enabled only after valid TOTP verification, backup codes generated

**Task 9.7.4: 2FA Setup UI Flow**
- Create /settings/security/2fa/setup route with multi-step wizard
- Step 1: Display QR code, instruction: "Scan with Google Authenticator, Authy, or 1Password"
- Step 2: Manual entry fallback (show secret as text)
- Step 3: Verify code input (6-digit TOTP code)
- Step 4: Success → Display 10 backup codes with download button
- Warning: "Save these codes in a secure location. You'll need them if you lose access to your authenticator app."
- **Acceptance:** Setup wizard completes, backup codes downloadable as .txt file

**Task 9.7.5: Backup Codes Download**
- Generate .txt file format: "CustomerDeskAI Backup Codes\nGenerated: [timestamp]\n\n12345678\n87654321\n..." (one code per line)
- Trigger browser download (Content-Disposition: attachment)
- **Acceptance:** Backup codes download as human-readable text file

---

### US9.8: Two-Factor Authentication Verification

**Business Value:** Users with 2FA enabled must verify identity on login for enhanced security

**Implementation Tasks:**

**Task 9.8.1: 2FA Verification API - TOTP**
- Create POST /api/auth/2fa/verify endpoint accepting { totp_code: string, trust_device: boolean }
- Called after successful email/password login (before session created)
- Verify TOTP code against user's two_factor_secret
- If valid + trust_device=true: Create trusted device record (expires in 30 days), Create session, Return session token
- If invalid: Return 401 "Invalid code"
- **Acceptance:** TOTP verification works, trusted devices bypass 2FA for 30 days

**Task 9.8.2: 2FA Verification API - Backup Code**
- Extend POST /api/auth/2fa/verify to accept { backup_code: string }
- Verify backup code exists in two_factor_recovery_codes array
- If valid: Mark code as used (remove from array), Create session, Warning: "Backup code used. X codes remaining."
- If invalid: Return 401 "Invalid backup code"
- **Acceptance:** Backup codes work as single-use fallback, count decrements

**Task 9.8.3: Trusted Device Check**
- Create middleware to check if current device is trusted
- Hash User-Agent + IP → device_id
- Query two_factor_trusted_devices where device_id matches AND expires_at > now
- If trusted device found: Skip 2FA verification
- **Acceptance:** Trusted devices bypass 2FA, non-trusted devices require verification

**Task 9.8.4: 2FA Verification UI**
- Create /auth/2fa/verify route (shown after email/password login)
- Primary input: 6-digit TOTP code (auto-focus, auto-submit on 6 digits)
- Checkbox: "Trust this device for 30 days"
- Link: "Use backup code instead" (shows alternate input)
- Backup code input: 8-digit code
- Error handling: "Invalid code. Please try again." (inline, no page reload)
- **Acceptance:** UI prompts for TOTP or backup code, trust device option works

**Task 9.8.5: Integration Testing**
- Test TOTP verification with valid/invalid codes
- Test backup code verification (single-use enforcement)
- Test trusted device bypass (skip 2FA for 30 days)
- **Acceptance:** All flows work, trusted devices persisted correctly

---

### US9.9: 2FA Backup Codes and Recovery

**Business Value:** Users can recover account access if authenticator device is lost

**Implementation Tasks:**

**Task 9.9.1: Regenerate Backup Codes API**
- Create POST /api/user/2fa/backup-codes/regenerate endpoint
- Require current password + valid TOTP code (double verification for security)
- Generate new 10 backup codes (random 8-digit)
- Invalidate all previous backup codes (replace two_factor_recovery_codes array)
- Return new codes in response
- **Acceptance:** New codes generated, old codes invalidated, requires authentication

**Task 9.9.2: View Remaining Backup Codes API**
- Create GET /api/user/2fa/backup-codes endpoint
- Return count of unused backup codes (not the codes themselves for security)
- Return warning if count < 3: "Only X backup codes remaining. Generate new codes."
- **Acceptance:** API returns count only (not codes), warning threshold works

**Task 9.9.3: Backup Codes Management UI**
- Create /settings/security/2fa/backup-codes route
- Display: "X of 10 backup codes remaining"
- If count < 3: Warning banner "Generate new backup codes soon"
- "Regenerate Backup Codes" button (requires password + TOTP code)
- Modal: Enter password → Enter TOTP code → Display new codes with download option
- **Acceptance:** UI shows remaining count, regeneration flow works

**Task 9.9.4: Integration Testing**
- Test backup code usage decrements count
- Test regeneration invalidates old codes
- Test warning threshold (count < 3)
- **Acceptance:** Count accurate, regeneration secure

---

### US9.10: Disable Two-Factor Authentication

**Business Value:** Users can disable 2FA if workflow needs change

**Implementation Tasks:**

**Task 9.10.1: 2FA Disable API**
- Create POST /api/user/2fa/disable endpoint accepting { password: string, totp_code: string }
- Validate current password
- Validate TOTP code (ensure user has access to authenticator)
- If valid: Set two_factor_enabled = false, Clear two_factor_secret, Clear two_factor_recovery_codes, Delete all trusted devices
- Send confirmation email: "Two-factor authentication was disabled on your account"
- **Acceptance:** 2FA disabled, all related data cleared, email sent

**Task 9.10.2: 2FA Disable UI**
- Create /settings/security/2fa/disable route
- Warning dialog: "Are you sure? This will make your account less secure."
- Form: Enter current password, Enter current TOTP code, Confirm button (red, destructive)
- Success message: "2FA disabled. Your account is now less secure."
- **Acceptance:** UI shows warnings, requires password + TOTP for safety

---

### US9.11: Organization/Workspace Switcher

**Business Value:** Users can easily navigate between multiple workspaces they belong to

**Implementation Tasks:**

**Task 9.11.1: User Workspaces Query API**
- Create GET /api/user/workspaces endpoint returning all workspaces user belongs to
- Include fields: workspace_id, workspace_name, workspace_slug, workspace_logo_url, user_role (Owner/Admin/Agent)
- Sort by last_active_at DESC (most recently used first)
- **Acceptance:** API returns all user workspaces with role information

**Task 9.11.2: Set Active Workspace API**
- Create POST /api/user/workspaces/active accepting { workspace_id: string }
- Validate user belongs to workspace
- Update user preferences: active_workspace_id = workspace_id
- Redirect to workspace subdomain: {slug}.customerdeskai.com
- **Acceptance:** Active workspace set, redirect works

**Task 9.11.3: Workspace Switcher UI Component**
- Create workspace switcher dropdown in navigation header
- Display current workspace: Logo (24px), Name
- Dropdown shows all workspaces: Logo (32px), Name, Role badge (Owner/Admin/Agent)
- Click workspace → redirect to subdomain
- "Pending Invitations" section if any pending (see US9.12)
- **Acceptance:** Dropdown shows all workspaces, switching redirects correctly

**Task 9.11.4: Last Active Workspace Persistence**
- On workspace switch, update user preferences: last_active_workspace_id
- On login (no active workspace set), redirect to last_active_workspace_id subdomain
- If no last_active_workspace_id, show workspace selector page
- **Acceptance:** Last active workspace remembered across sessions

---

### US9.12: Accept Workspace Invitation

**Business Value:** Users can accept pending workspace invitations without email links

**Implementation Tasks:**

**Task 9.12.1: Pending Invitations API**
- Create GET /api/user/invitations/pending endpoint
- Return all invitations where invited_email matches user email AND status = pending
- Include fields: invitation_id, workspace_name, workspace_logo_url, invited_by_name, invited_role, expires_at
- **Acceptance:** API returns pending invitations for logged-in user

**Task 9.12.2: Accept Invitation API**
- Create POST /api/user/invitations/{invitation_id}/accept endpoint
- Validate invitation not expired (expires_at > now)
- Add user to workspace via tenant_users table (user_id, tenant_id, role)
- Mark invitation as accepted (status = accepted)
- **Acceptance:** User added to workspace, invitation marked accepted

**Task 9.12.3: Pending Invitations UI**
- Add "Pending Invitations" section to workspace switcher dropdown
- Show badge count on switcher if pending invitations exist
- Each pending invitation shows: Workspace logo, Workspace name, "Invited by [name]" text, Role badge, "Accept" button (green)
- Click "Accept" → add to workspace → show success toast
- **Acceptance:** Pending invitations visible, accept action works

**Task 9.12.4: Integration Testing**
- Test accepting invitation (user added to workspace)
- Test expired invitation (should fail with error)
- Test invitation for different email (should not appear)
- **Acceptance:** All flows work, invitation lifecycle correct

---

### US9.13: Leave Workspace

**Business Value:** Users can remove themselves from workspaces they no longer use

**Implementation Tasks:**

**Task 9.13.1: Leave Workspace Validation API**
- Create GET /api/workspaces/{workspace_id}/leave/validate endpoint
- Check if user is sole Owner of workspace
- If sole Owner: Return error "Cannot leave - you're the only Owner. Transfer ownership or delete workspace."
- If not sole Owner: Return success "You can leave this workspace"
- **Acceptance:** API validates leave eligibility, blocks sole Owners

**Task 9.13.2: Leave Workspace API**
- Create POST /api/workspaces/{workspace_id}/leave endpoint
- Validate user not sole Owner (call validation logic)
- Remove user from tenant_users table (user_id, tenant_id)
- Unassign all tickets assigned to user (set assigned_to = null, status = Open)
- Send email to workspace Owners: "[User] left your workspace"
- **Acceptance:** User removed, tickets unassigned, Owners notified

**Task 9.13.3: Leave Workspace UI**
- Add "Leave Workspace" button to workspace settings page
- Confirmation dialog: "Are you sure? You'll lose access to all tickets and data in this workspace."
- Show list of tickets user currently has assigned (count)
- "Leave Workspace" button (red, destructive)
- If sole Owner: Show error modal "Transfer ownership first"
- **Acceptance:** Confirmation required, sole Owner blocked, clear warnings

---

### US9.14: Security Status Dashboard

**Business Value:** Users can see account security posture at a glance

**Implementation Tasks:**

**Task 9.14.1: Security Status API**
- Create GET /api/user/security/status endpoint
- Return: email_verified (boolean), two_factor_enabled (boolean), password_strength (weak/medium/strong based on length), linked_accounts_count (integer), active_sessions_count (integer), password_last_changed_at (timestamp)
- **Acceptance:** API returns comprehensive security status

**Task 9.14.2: Password Strength Calculation**
- Calculate password strength: weak (<12 chars), medium (12-15 chars), strong (16+ chars)
- Store password_strength_score on password change
- Return score in security status API
- **Acceptance:** Password strength accurately calculated

**Task 9.14.3: Security Status Dashboard UI**
- Create /settings/security route (overview page)
- Display status cards: Email Verification (✓ Verified / ✗ Not Verified + "Resend Email" button), Two-Factor Authentication (✓ Enabled / ✗ Disabled + "Enable 2FA" button), Password Strength (Strong/Medium/Weak + "Change Password" link), Linked Accounts (count + "Manage Accounts" link), Active Sessions (count + "View All Sessions" link)
- Security score summary: "Your account is [Secure/Moderately Secure/At Risk]" based on status
- Recommendations: "Enable 2FA for better protection" if 2FA disabled
- **Acceptance:** Dashboard shows all status indicators, recommendations actionable

**Task 9.14.4: Security Score Calculation**
- Calculate overall security score: email_verified (25%), 2FA enabled (50%), password strong (25%)
- Score ranges: 0-40% = At Risk, 41-75% = Moderately Secure, 76-100% = Secure
- **Acceptance:** Score calculation accurate, displayed correctly

---

### US9.15: Email Verification

**Business Value:** Users can verify email ownership to enable security features

**Implementation Tasks:**

**Task 9.15.1: Email Verification Token Generation**
- On sign up, generate email verification token (secure random, 32 bytes, 7-day expiry)
- Store in email_verification_tokens table (user_id, token, expires_at)
- Send verification email immediately (non-blocking)
- **Acceptance:** Token generated, email sent, user can access account before verification

**Task 9.15.2: Resend Verification Email API**
- Create POST /api/user/email/verify/resend endpoint
- Check user email not already verified (email_verified_at IS NULL)
- Generate new verification token (invalidate previous)
- Send verification email
- Rate limit: max 3 emails per hour (prevent abuse)
- **Acceptance:** Email resent, rate limiting works

**Task 9.15.3: Email Verification Confirmation API**
- Create GET /api/user/email/verify?token={token} endpoint
- Validate token not expired, not already used
- Mark email as verified (email_verified_at = now)
- Invalidate token (prevent reuse)
- Redirect to dashboard with success message: "Email verified successfully"
- **Acceptance:** Email verified, token single-use, redirect works

**Task 9.15.4: Email Verification UI**
- Show banner on dashboard if email not verified: "Verify your email to enable all features" + "Resend Email" button
- Verification success page (after clicking email link): Checkmark icon, "Email Verified!" message, "Continue to Dashboard" button
- **Acceptance:** Banner shown until verified, success page clear

**Task 9.15.5: Email Verification Requirements**
- Require verified email for: Password reset (prevent account takeover), Email change (prove ownership), Workspace invitations sent (prevent spam)
- Block these features with error: "Please verify your email first" + "Resend verification email" link
- **Acceptance:** Features gated behind email verification, clear messaging

---

### Epic 9 Task Summary

**Total Stories:** 15
**Total Tasks:** 92 implementation tasks

**Task Distribution:**
- US9.1 (Profile Management): 9 tasks
- US9.2 (Account Deletion): 8 tasks
- US9.3 (Password Change): 4 tasks
- US9.4 (Session Management): 8 tasks
- US9.5 (Sign Out on Password Change): 3 tasks
- US9.6 (Linked Accounts): 6 tasks
- US9.7 (2FA Setup): 5 tasks
- US9.8 (2FA Verification): 5 tasks
- US9.9 (Backup Codes): 4 tasks
- US9.10 (Disable 2FA): 2 tasks
- US9.11 (Workspace Switcher): 4 tasks
- US9.12 (Accept Invitation): 4 tasks
- US9.13 (Leave Workspace): 3 tasks
- US9.14 (Security Dashboard): 4 tasks
- US9.15 (Email Verification): 5 tasks

**Sprint Planning Estimates:**
- **Sprint 1 (Foundation):** US9.1, US9.3, US9.15 (Profile + Password + Email Verification) - 18 tasks
- **Sprint 2 (Sessions + Linked Accounts):** US9.4, US9.5, US9.6 (Session Management + Linked Accounts) - 17 tasks
- **Sprint 3 (2FA):** US9.7, US9.8, US9.9, US9.10 (Complete 2FA flow) - 16 tasks
- **Sprint 4 (Workspaces + Security):** US9.11, US9.12, US9.13, US9.14 (Workspace Management + Security Dashboard) - 15 tasks
- **Sprint 5 (Account Lifecycle):** US9.2 (Account Deletion with ownership transfer) - 8 tasks

**Dependencies:**
- US9.15 (Email Verification) must complete BEFORE US9.3 (password reset requires verified email)
- US9.1 (Profile) must complete BEFORE US9.2 (account deletion references profile)
- US9.7 (2FA Setup) must complete BEFORE US9.8, US9.9, US9.10 (dependent on 2FA infrastructure)
- US9.11 (Workspace Switcher) recommended BEFORE US9.12, US9.13 (UI dependency)
