# UX/UI Wireframes: Epic 9 - User Account Management & Security

**Epic:** Epic 9: User Account Management & Security
**Business Outcome:** Self-service account management reduces support burden, 2FA adoption >30%
**Target Personas:** All users (Workspace Owners, Admins, Agents) managing personal accounts
**Success Metric:** 2FA adoption >30%, zero support tickets for account management tasks
**Author:** John (PM Agent)
**Date:** 2025-12-27

---

## Table of Contents

1. [Design Overview](#design-overview)
2. [Flow Architecture](#flow-architecture)
3. [Wireframe 1: Account Settings Overview](#wireframe-1-account-settings-overview)
4. [Wireframe 2: Profile Management](#wireframe-2-profile-management)
5. [Wireframe 3: Email Change Verification](#wireframe-3-email-change-verification)
6. [Wireframe 4: Security Settings Dashboard](#wireframe-4-security-settings-dashboard)
7. [Wireframe 5: Password Change](#wireframe-5-password-change)
8. [Wireframe 6: Session Management](#wireframe-6-session-management)
9. [Wireframe 7: 2FA Setup Flow](#wireframe-7-2fa-setup-flow)
10. [Wireframe 8: 2FA Verification on Login](#wireframe-8-2fa-verification-on-login)
11. [Wireframe 9: 2FA Disable Flow](#wireframe-9-2fa-disable-flow)
12. [Wireframe 10: Linked Accounts Management](#wireframe-10-linked-accounts-management)
13. [Wireframe 11: Workspace Switcher](#wireframe-11-workspace-switcher)
14. [Wireframe 12: Accept Workspace Invitation](#wireframe-12-accept-workspace-invitation)
15. [Wireframe 13: Leave Workspace](#wireframe-13-leave-workspace)
16. [Wireframe 14: Account Deletion](#wireframe-14-account-deletion)
17. [Interaction Specifications](#interaction-specifications)
18. [Technical Implementation Notes](#technical-implementation-notes)

---

## Design Overview

### Design Principles Applied

**1. Pre-Flight Safety (Critical for Destructive Actions)**
- Multi-step confirmations for account deletion (type "DELETE" + password)
- Clear warnings before unlinking last login method
- Password required for all security-sensitive operations
- 30-day grace period for account deletion (soft delete)

**2. Absolute Trust (Session Management Transparency)**
- All active sessions visible with device details (IP, location, browser)
- Remote sign-out capability for suspicious sessions
- Auto-refresh every 30s for real-time monitoring
- Clear "Current session" badge prevents accidental self-lockout

**3. Progressive Disclosure (Security Settings)**
- Security status overview shows high-level health (2FA enabled, email verified)
- Expandable sections for advanced features (backup codes, trusted devices)
- Contextual help text explains consequences ("Disabling 2FA makes account less secure")
- Recommended actions highlighted (checkbox pre-selected for "Sign out all devices")

**4. Warm Minimalism (LATAM-Friendly Copy)**
- "Your active sessions" not "Session tokens"
- "Link your Google account" not "OAuth provider integration"
- "Keep this device trusted for 30 days" not "Enable device fingerprinting"
- Human-centric error messages ("Current password incorrect" not "Authentication failed")

### User Stories Addressed

**Profile & Account (US9.1, US9.2, US9.15):**
- Profile Management - Name, email, image upload
- Email Change Verification - Confirmation link flow
- Account Deletion - Multi-step with 30-day grace period

**Security & Password (US9.3, US9.4, US9.5):**
- Password Change - Current password required
- Session Management - Active sessions dashboard
- Sign Out All Devices - Bulk session invalidation

**Two-Factor Authentication (US9.7, US9.8, US9.9, US9.10):**
- 2FA Setup - QR code + backup codes
- 2FA Verification - TOTP code + backup code fallback
- Trust Device - Skip 2FA for 30 days
- 2FA Disable - Password + TOTP confirmation

**Multi-Tenant (US9.6, US9.11, US9.12, US9.13, US9.14):**
- Linked Accounts - Google, GitHub OAuth
- Workspace Switcher - Dropdown with role badges
- Accept Invitation - Pending workspace list
- Leave Workspace - Confirmation dialog
- Security Status - Overview dashboard

### Technical Constraints

- **Better-Auth Integration:** All account operations use Better-Auth API
- **Session Tokens:** HTTP-only cookies, 30-day expiry (90-day with "Remember me")
- **2FA TOTP:** Time-based One-Time Password (30-second validity window)
- **Backup Codes:** 10 single-use 8-digit codes, regenerable
- **Soft Delete:** 30-day grace period before hard delete (GDPR/LGPD compliance)
- **OAuth Providers:** Google, GitHub (Microsoft deferred to Phase 2)

---

## Flow Architecture

### Account Management Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│ ACCOUNT SETTINGS NAVIGATION (Settings → Account)                │
└─────────────────────────────────────────────────────────────────┘

1. Account Settings Overview (Landing Page)
   ├─ Profile
   │  ├─ Update Name (optimistic UI)
   │  ├─ Change Email (verification flow)
   │  └─ Upload Profile Image (auto-crop square)
   │
   ├─ Security
   │  ├─ Security Status Dashboard
   │  ├─ Change Password
   │  ├─ Session Management
   │  ├─ Two-Factor Authentication
   │  │  ├─ Enable 2FA (QR code + backup codes)
   │  │  ├─ Disable 2FA (password + TOTP)
   │  │  └─ Regenerate Backup Codes
   │  └─ Email Verification
   │
   ├─ Linked Accounts
   │  ├─ Link Google Account (OAuth)
   │  ├─ Link GitHub Account (OAuth)
   │  └─ Unlink Account (confirmation)
   │
   ├─ Workspaces
   │  ├─ View My Workspaces (switcher dropdown)
   │  ├─ Accept Pending Invitation
   │  └─ Leave Workspace (confirmation)
   │
   └─ Danger Zone
      └─ Delete Account (multi-step confirmation)
```

### 2FA Setup Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│ TWO-FACTOR AUTHENTICATION SETUP JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

Security Settings → Enable 2FA
   ↓
Step 1: QR Code Generation
   ├─ Display QR code
   ├─ Manual secret key (fallback)
   └─ "Scan with authenticator app" instructions
   ↓
Step 2: TOTP Verification
   ├─ Enter 6-digit code
   ├─ Validate TOTP (30s window)
   └─ Error if code incorrect (retry)
   ↓
Step 3: Backup Codes Generation
   ├─ Generate 10 single-use codes
   ├─ Display codes (copyable)
   ├─ "Download backup codes" button
   └─ Warning: "Save in secure location"
   ↓
Step 4: Confirmation
   ├─ 2FA enabled successfully
   ├─ Confirmation email sent
   └─ Redirect to Security Settings

Total Time: ~2 minutes (median)
```

### Session Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ SESSION MANAGEMENT DASHBOARD                                    │
└─────────────────────────────────────────────────────────────────┘

Security → Sessions
   ↓
View Active Sessions (Auto-refresh 30s)
   ├─ Current Session (badge, cannot sign out)
   ├─ Other Sessions (remote sign-out enabled)
   │  ├─ Device: MacBook Pro, Chrome 120
   │  ├─ IP: 192.168.1.100
   │  ├─ Location: São Paulo, Brazil
   │  └─ Last Active: 5 minutes ago
   │
   ├─ Sign Out Specific Session
   │  ├─ Click "Sign out" button
   │  ├─ Confirm action (modal)
   │  └─ Session invalidated immediately
   │
   └─ Sign Out All Other Devices
      ├─ Click "Sign out all devices" button
      ├─ Confirm action (modal)
      └─ All sessions except current invalidated
```

---

## Wireframe 1: Account Settings Overview

**User Story:** Entry point for all account management flows
**Context:** User navigates to Settings → Account from navigation menu
**Goal:** Clear overview of all account sections with status indicators

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  Dashboard  Tickets  KB  Settings [⚙️]       [Priya Patel ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

┌──────┬──────────────────────────────────────────────────────────────────┐
│      │                                                                  │
│ [🏠] │  Settings → Account                                              │
│      │                                                                  │
│ [⚙️] │  ┌────────────────────────────────────────────────────────────┐ │
│  ◉   │  │  Profile                                          [View →]│ │
│      │  │  Priya Patel • priya@acme.com                             │ │
│ [🔒] │  │  [Profile Image Thumbnail]                                │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│ [🔗] │                                                                  │
│      │  ┌────────────────────────────────────────────────────────────┐ │
│ [🌐] │  │  Security                                         [View →]│ │
│      │  │  ✓ 2FA Enabled  ✓ Email Verified                          │ │
│ [☠️]  │  │  Last password change: 30 days ago                        │ │
│      │  │  Active sessions: 3 devices                               │ │
│ NAV  │  └────────────────────────────────────────────────────────────┘ │
│ RAIL │                                                                  │
│ 60px │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │  Linked Accounts                                  [View →]│ │
│      │  │  ✓ Google (priya@acme.com)                                │ │
│      │  │  ○ GitHub (not connected)                                 │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│      │                                                                  │
│      │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │  Workspaces                                       [View →]│ │
│      │  │  You're a member of 2 workspaces                          │ │
│      │  │  • Acme Support (Owner)                                   │ │
│      │  │  • Zenith Help (Agent)                                    │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│      │                                                                  │
│      │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │  ⚠ Danger Zone                                   [View →]│ │
│      │  │  Delete your account permanently                          │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│      │                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

### Settings Navigation Icons

**Left Navigation Rail (60px fixed width):**

- 🏠 Dashboard (top)
- ⚙️ Account Settings (active, filled circle indicator)
- 🔒 Security (sub-item, indented)
- 🔗 Linked Accounts (sub-item)
- 🌐 Workspaces (sub-item)
- ☠️ Danger Zone (sub-item, red icon)

**Active State:**
- Filled circle (◉) next to active item
- Background: --primary (brand color)
- Icon: white

### Section Cards (Overview)

**Profile Card:**
- **Header:** "Profile" + [View →] link
- **Content:** Name, email, profile image thumbnail (40px circle)
- **Styling:** --background (white), 1px --border, 16px padding

**Security Card:**
- **Header:** "Security" + [View →] link
- **Status Indicators:**
  - ✓ 2FA Enabled (green checkmark, --success)
  - ✓ Email Verified (green checkmark, --success)
  - Last password change: 30 days ago (--muted text)
  - Active sessions: 3 devices (--foreground text)
- **Styling:** Same as Profile Card

**Linked Accounts Card:**
- **Header:** "Linked Accounts" + [View →] link
- **Providers:**
  - ✓ Google (connected, green checkmark)
  - ○ GitHub (not connected, gray circle)
- **Styling:** Same as Profile Card

**Workspaces Card:**
- **Header:** "Workspaces" + [View →] link
- **Summary:** "You're a member of 2 workspaces"
- **List:**
  - • Acme Support (Owner) [bullet point]
  - • Zenith Help (Agent)
- **Styling:** Same as Profile Card

**Danger Zone Card:**
- **Header:** "⚠ Danger Zone" + [View →] link (destructive styling)
- **Description:** "Delete your account permanently"
- **Styling:** --destructive border (red-300), --background-destructive (red-50 tint)

### Design Specifications

**Typography:**
- Section headers: Inter, 16px (base), 600 weight, --foreground
- Status text: Inter, 14px (sm), 400 weight, --muted
- [View →] links: Inter, 14px (sm), 500 weight, --primary color

**Spacing:**
- Gap between cards: 16px (space-4)
- Card padding: 16px (space-4)
- Card rounded corners: 6px (rounded-md)

**Color Tokens:**
- Success indicators: --success (green-600)
- Inactive indicators: --muted (gray-400)
- Destructive: --destructive (red-600)
- Danger Zone background: hsl(var(--destructive) / 0.05)

**Accessibility:**
- Semantic HTML: `<nav>` for settings navigation, `<section>` for each card
- ARIA labels: "Account settings navigation", "Profile section"
- Keyboard navigation: Tab through [View →] links, Enter to navigate

### Mobile Optimization (375px - 768px)

```
┌─────────────────────────┐
│  [☰]  Settings  [▼]     │
├─────────────────────────┤
│                         │
│  Account                │
│                         │
│  ┌───────────────────┐  │
│  │  Profile          │  │
│  │  Priya Patel      │  │
│  │  priya@acme.com   │  │
│  │  [View →]         │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Security         │  │
│  │  ✓ 2FA  ✓ Email   │  │
│  │  3 active sessions│  │
│  │  [View →]         │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Linked Accounts  │  │
│  │  ✓ Google         │  │
│  │  ○ GitHub         │  │
│  │  [View →]         │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Workspaces       │  │
│  │  2 workspaces     │  │
│  │  [View →]         │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  ⚠ Danger Zone    │  │
│  │  Delete account   │  │
│  │  [View →]         │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Hamburger menu (☰) for navigation rail
- Full-width cards (no fixed sidebar)
- Condensed text (shorter descriptions)
- Stacked layout (single column)

---

## Wireframe 2: Profile Management

**User Story:** US9.1 (Profile Management)
**Context:** User clicked [View →] on Profile card from overview
**Goal:** Update name, email, profile image with optimistic UI

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Account → Profile                              [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Profile Information                              │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  [PROFILE IMAGE]                            │  │
          │  │     120px                                   │  │
          │  │    Circle                                   │  │
          │  │                                             │  │
          │  │  [Change Photo]                             │  │
          │  │  Max 2MB • JPG, PNG, WEBP                   │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  Your Name *                                      │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Priya Patel                                │  │
          │  └─────────────────────────────────────────────┘  │
          │  ✓ Saved (auto-save on blur)                      │
          │                                                   │
          │  Email Address *                                  │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  priya@acme.com                             │  │
          │  └─────────────────────────────────────────────┘  │
          │  [Change Email]                                   │
          │  Changing email requires verification             │
          │                                                   │
          │  Account Created                                  │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  January 15, 2025                           │  │
          │  └─────────────────────────────────────────────┘  │
          │  (Read-only field)                                │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Profile Image Upload Flow

**Step 1: Click [Change Photo]**
```
┌────────────────────────────────────────┐
│  Upload Profile Photo                  │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  Drop image here or click      │   │
│  │  [Browse Files]                │   │
│  └────────────────────────────────┘   │
│                                        │
│  Max 2MB • JPG, PNG, WEBP              │
│  Image will be cropped to square       │
│                                        │
│  [Cancel]  [Upload]                    │
└────────────────────────────────────────┘
```

**Step 2: Image Selected (Auto-Crop Preview)**
```
┌────────────────────────────────────────┐
│  Crop Your Photo                       │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  [IMAGE PREVIEW]               │   │
│  │  Draggable crop area           │   │
│  │  (Square crop overlay)         │   │
│  └────────────────────────────────┘   │
│                                        │
│  Drag to reposition                    │
│                                        │
│  [Cancel]  [Save]                      │
└────────────────────────────────────────┘
```

**Step 3: Upload Progress**
```
Uploading... ▓▓▓▓▓▓░░░░ 60%
```

**Step 4: Success State**
```
✓ Profile photo updated
(Auto-close modal after 1s)
```

### Email Change Flow

**Click [Change Email] → Modal Appears:**
```
┌────────────────────────────────────────────────────────────┐
│  Change Email Address                                      │
│                                                            │
│  Your current email: priya@acme.com                        │
│                                                            │
│  New Email Address *                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │  priya.patel@newdomain.com                         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Current Password (for security) *                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │  ••••••••••••                              [SHOW]  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ℹ We'll send a verification link to your new email.      │
│    Your current email will remain active until you         │
│    confirm the new one.                                    │
│                                                            │
│  [Cancel]  [Send Verification Email →]                     │
└────────────────────────────────────────────────────────────┘
```

**After Submission:**
```
┌────────────────────────────────────────────────────────────┐
│  Verification Email Sent                                   │
│                                                            │
│  ✓ We sent a verification link to:                        │
│    priya.patel@newdomain.com                               │
│                                                            │
│  Click the link in the email to confirm your new           │
│  email address.                                            │
│                                                            │
│  Didn't receive the email?                                 │
│  • Check your spam folder                                  │
│  • [Resend verification email]                             │
│                                                            │
│  [Close]                                                   │
└────────────────────────────────────────────────────────────┘
```

### Field Specifications

**Your Name (Editable, Auto-Save):**
- **Type:** Text input (2-100 characters)
- **Validation:** Required, min 2 chars, max 100 chars
- **Auto-Save:** On blur (500ms debounce)
- **Feedback:** "✓ Saved" appears below field (green checkmark, fade out after 2s)
- **Optimistic UI:** Name updates immediately in navigation header

**Email Address (Change via Modal):**
- **Display:** Current email (read-only in main form)
- **Action:** [Change Email] button opens modal
- **Modal Fields:**
  - New Email (email validation)
  - Current Password (security verification)
- **Flow:** Send verification email → User clicks link → Email updated

**Account Created (Read-Only):**
- **Display:** Date in "Month DD, YYYY" format
- **Styling:** Disabled input styling (gray background, no border focus)

### Design Specifications

**Profile Image:**
- **Size:** 120px diameter circle
- **Placeholder:** User initials if no image (e.g., "PP" for Priya Patel)
- **Border:** 2px --border (gray-300)
- **Hover:** Darken overlay + "Change Photo" text

**Typography:**
- Form labels: Inter, 14px (sm), 500 weight, --foreground
- Input text: Inter, 16px (base), 400 weight, --foreground
- Help text: Inter, 12px (xs), 400 weight, --muted
- Success feedback: Inter, 12px (xs), 500 weight, --success

**Spacing:**
- Form container: 600px max-width, 24px padding
- Vertical gap between fields: 20px (space-5)
- Label to input gap: 8px (space-2)

**Accessibility:**
- `<label for="name">` for all inputs
- `aria-describedby` for help text
- Image upload: `<input type="file" accept="image/jpeg,image/png,image/webp">`
- Auto-save feedback: `aria-live="polite"`

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Profile              │
├─────────────────────────┤
│                         │
│  [PROFILE IMAGE]        │
│     80px                │
│                         │
│  [Change Photo]         │
│  Max 2MB                │
│                         │
│  Your Name *            │
│  ┌───────────────────┐  │
│  │  Priya Patel      │  │
│  └───────────────────┘  │
│  ✓ Saved                │
│                         │
│  Email *                │
│  ┌───────────────────┐  │
│  │  priya@acme.com   │  │
│  └───────────────────┘  │
│  [Change Email]         │
│                         │
│  Account Created        │
│  Jan 15, 2025           │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Smaller profile image (80px vs 120px)
- Full-width form fields
- Shorter help text
- Modal becomes full-screen sheet

---

## Wireframe 3: Email Change Verification

**User Story:** US9.15 (Email Verification)
**Context:** User clicked verification link from email
**Goal:** Confirm new email address, update account

### Email Template (Sent to New Email Address)

```
┌────────────────────────────────────────────────────────────┐
│  [WORKSPACE LOGO]                    CustomerDeskAI        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Confirm Your New Email Address                           │
│                                                            │
│  Hi Priya,                                                 │
│                                                            │
│  You requested to change your email address to:            │
│  priya.patel@newdomain.com                                 │
│                                                            │
│  Click the button below to confirm this change:            │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Confirm Email Change                              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  This link expires in 24 hours.                            │
│                                                            │
│  If you didn't request this change, you can safely         │
│  ignore this email.                                        │
│                                                            │
│  Or copy this link into your browser:                      │
│  https://app.customerdeskai.com/verify-email?token=...     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  CustomerDeskAI | Privacy Policy | Contact Support        │
└────────────────────────────────────────────────────────────┘
```

### Verification Landing Page (After Clicking Link)

**Success State:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          ✓ Email Confirmed                              │
│                                                                         │
│  Your email address has been successfully updated to:                   │
│  priya.patel@newdomain.com                                              │
│                                                                         │
│  You can now use this email to sign in.                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Continue to Dashboard →                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Error State (Expired Token):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          ⚠ Link Expired                                 │
│                                                                         │
│  This verification link has expired (24-hour validity).                 │
│                                                                         │
│  Please request a new email change from your account settings.          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Go to Account Settings →                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Error State (Invalid Token):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          ⚠ Invalid Link                                 │
│                                                                         │
│  This verification link is invalid or has already been used.            │
│                                                                         │
│  If you need to change your email again, please go to your              │
│  account settings.                                                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Go to Account Settings →                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backend Flow (Email Verification)

**Database Schema:**
```typescript
// Table: email_verification_tokens
{
  token: string (UUID, primary key)
  user_id: uuid (FK to users table)
  new_email: string (pending email address)
  expires_at: timestamp (24 hours from creation)
  used_at: timestamp | null (null = unused)
}
```

**API Endpoint:**
```typescript
// POST /api/auth/verify-email
async function verifyEmailChange(token: string) {
  const verification = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.token, token),
  });

  if (!verification) {
    return { success: false, error: 'invalid_token' };
  }

  if (verification.usedAt) {
    return { success: false, error: 'already_used' };
  }

  if (new Date() > verification.expiresAt) {
    return { success: false, error: 'expired' };
  }

  // Update user email
  await db.update(users)
    .set({ email: verification.newEmail })
    .where(eq(users.id, verification.userId));

  // Mark token as used
  await db.update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.token, token));

  // Send confirmation email to old email
  await sendEmailChangeNotification(verification.userId);

  return { success: true };
}
```

### Design Specifications

**Email Template:**
- Use workspace branding (logo, colors)
- Responsive design (mobile-friendly)
- Plain text fallback version
- CTA button: --primary background, white text

**Verification Page:**
- Centered layout (600px max-width)
- Large icon (✓ or ⚠) 48px
- Heading: Inter, 24px (xl), 600 weight
- Body: Inter, 16px (base), 400 weight
- CTA button: --primary background, full width

**Accessibility:**
- Email subject: "Confirm your new email address"
- ARIA label on CTA: "Confirm email change"
- Screen reader announcement: "Email address successfully updated"

---

## Wireframe 4: Security Settings Dashboard

**User Story:** US9.14 (Security Status Overview)
**Context:** User clicked [View →] on Security card from overview
**Goal:** High-level security health dashboard with actionable items

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Account → Security                             [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Security Overview                                │
          │                                                   │
          │  Your account security status:                    │
          │                                                   │
          │  ✓ Two-Factor Authentication Enabled              │
          │  ✓ Email Verified                                 │
          │  ⚠ Password last changed 45 days ago              │
          │  ℹ 3 active sessions                              │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Password                                         │
          │                                                   │
          │  Last changed: 45 days ago                        │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Change Password →                          │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Two-Factor Authentication                        │
          │                                                   │
          │  ✓ Enabled                                        │
          │  Backup codes: 7 remaining (of 10)                │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Regenerate Backup Codes                    │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Disable 2FA                                │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Active Sessions                                  │
          │                                                   │
          │  You're currently signed in on 3 devices          │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Manage Sessions →                          │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Email Verification                               │
          │                                                   │
          │  ✓ Verified (priya@acme.com)                      │
          │  Verified on January 15, 2025                     │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Security Status Indicators

**Visual Hierarchy:**

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Enabled/Verified | ✓ | --success (green-600) | Secure |
| Warning | ⚠ | --warning (yellow-600) | Needs attention |
| Info | ℹ | --info (blue-600) | Informational |
| Disabled | ○ | --muted (gray-400) | Not secure |

**Status Logic (Security Overview Card):**

```typescript
function getSecurityStatus(user: User): SecurityStatus {
  const status = {
    twoFactorEnabled: user.twoFactorEnabled,
    emailVerified: user.emailVerifiedAt !== null,
    passwordAge: daysSincePasswordChange(user),
    activeSessions: user.sessions.length,
  };

  // Overall security score
  const warnings = [];
  if (!status.twoFactorEnabled) warnings.push('2FA disabled');
  if (!status.emailVerified) warnings.push('Email not verified');
  if (status.passwordAge > 90) warnings.push('Password outdated (>90 days)');

  return {
    ...status,
    securityScore: warnings.length === 0 ? 'excellent' : warnings.length === 1 ? 'good' : 'needs_improvement',
    warnings,
  };
}
```

### Security Card Specifications

**Password Card:**
- **Status:** Last changed timestamp (e.g., "45 days ago")
- **Warning:** If >90 days, show ⚠ "Consider changing your password"
- **Action:** [Change Password →] button

**Two-Factor Authentication Card:**
- **Status:** ✓ Enabled (green) or ○ Disabled (gray)
- **Backup Codes:** "7 remaining (of 10)" (show count if <10)
- **Warning:** If <3 backup codes, show ⚠ "Generate new backup codes soon"
- **Actions:**
  - [Regenerate Backup Codes] (enabled state)
  - [Disable 2FA] (enabled state, destructive styling)
  - [Enable 2FA →] (disabled state, primary CTA)

**Active Sessions Card:**
- **Summary:** "You're currently signed in on 3 devices"
- **Action:** [Manage Sessions →] button (navigates to Wireframe 6)

**Email Verification Card:**
- **Status:** ✓ Verified (green) or ○ Not Verified (gray)
- **Timestamp:** Verified on [date]
- **Action (if not verified):** [Resend Verification Email] button

### Design Specifications

**Typography:**
- Section headers: Inter, 18px (lg), 600 weight, --foreground
- Status text: Inter, 14px (sm), 400 weight, --muted
- Warning text: Inter, 14px (sm), 500 weight, --warning
- Action buttons: Inter, 14px (sm), 500 weight, --primary

**Spacing:**
- Gap between cards: 16px (space-4)
- Card padding: 20px (space-5)
- Vertical gap within card: 12px (space-3)

**Color Tokens:**
- Success: --success (green-600)
- Warning: --warning (yellow-600)
- Info: --info (blue-600)
- Muted: --muted (gray-600)

**Accessibility:**
- Security status: `role="status" aria-live="polite"`
- Warning icons: `aria-label="Warning: Password last changed 45 days ago"`
- Action buttons: Clear ARIA labels ("Change password", "Manage active sessions")

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Security             │
├─────────────────────────┤
│                         │
│  Security Overview      │
│  ✓ 2FA Enabled          │
│  ✓ Email Verified       │
│  ⚠ Password (45d ago)   │
│  3 active sessions      │
│                         │
│  ─────────────────────  │
│                         │
│  Password               │
│  Last changed 45d ago   │
│  [Change Password]      │
│                         │
│  ─────────────────────  │
│                         │
│  Two-Factor Auth        │
│  ✓ Enabled              │
│  7 backup codes left    │
│  [Regenerate Codes]     │
│  [Disable 2FA]          │
│                         │
│  ─────────────────────  │
│                         │
│  Sessions               │
│  3 devices signed in    │
│  [Manage Sessions]      │
│                         │
│  ─────────────────────  │
│                         │
│  Email Verification     │
│  ✓ Verified             │
│  Jan 15, 2025           │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Stack cards vertically (single column)
- Condensed status text
- Full-width buttons
- Shorter headings

---

## Wireframe 5: Password Change

**User Story:** US9.3, US9.5 (Password Change + Sign Out All Devices)
**Context:** User clicked [Change Password →] from Security Settings
**Goal:** Secure password change with optional bulk session invalidation

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Security → Change Password                     [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Change Password                                  │
          │                                                   │
          │  Current Password *                               │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ••••••••••••                       [SHOW]  │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  New Password *                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ••••••••••••                       [SHOW]  │  │
          │  └─────────────────────────────────────────────┘  │
          │  Minimum 12 characters                            │
          │                                                   │
          │  Confirm New Password *                           │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ••••••••••••                       [SHOW]  │  │
          │  └─────────────────────────────────────────────┘  │
          │  ✓ Passwords match                                │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  ☑ Sign out all other devices (recommended)       │
          │     This will sign you out of all devices          │
          │     except this one for security.                 │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  [Cancel]  [Change Password]                      │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Field Specifications

**Current Password (Required):**
- **Type:** Password input with toggle visibility
- **Validation:** Server-side verification against stored hash
- **Error:** "Current password incorrect" (inline, --destructive color)

**New Password (Required):**
- **Type:** Password input with toggle visibility
- **Validation:** Min 12 chars (Better-Auth default)
- **Real-Time:** Character count shown if <12 chars ("8/12 characters")
- **Error:** "Password must be at least 12 characters" (inline)

**Confirm New Password (Required):**
- **Type:** Password input with toggle visibility
- **Validation:** Must match New Password
- **Feedback:** ✓ Passwords match (green checkmark, --success)
- **Error:** "Passwords don't match" (inline, --destructive)

**Sign Out All Other Devices (Optional, Pre-Selected):**
- **Type:** Checkbox (checked by default)
- **Label:** "Sign out all other devices (recommended)"
- **Help Text:** "This will sign you out of all devices except this one for security."
- **Rationale:** Pre-selected for security best practice (US9.5)

### Password Change Success Flow

**Step 1: Form Submission**
```
[Change Password] button clicked
↓
Validate all fields client-side
↓
Submit to API: POST /api/auth/change-password
```

**Step 2: API Processing**
```typescript
async function changePassword(data: PasswordChangeInput) {
  // Verify current password
  const user = await auth.verifyPassword(data.currentPassword);
  if (!user) {
    return { success: false, error: 'Current password incorrect' };
  }

  // Update password
  await auth.updatePassword(user.id, data.newPassword);

  // Sign out all other devices if checkbox selected
  if (data.signOutAllDevices) {
    await auth.invalidateAllSessions(user.id, { exceptCurrent: true });
  }

  // Send confirmation email
  await sendPasswordChangeEmail(user.email);

  return { success: true };
}
```

**Step 3: Success Feedback**
```
┌────────────────────────────────────────────────────────────┐
│  ✓ Password Changed Successfully                          │
│                                                            │
│  Your password has been updated.                           │
│                                                            │
│  ✓ All other devices have been signed out.                │
│                                                            │
│  A confirmation email was sent to priya@acme.com           │
│                                                            │
│  [Return to Security Settings]                             │
└────────────────────────────────────────────────────────────┘
```

**Step 4: Confirmation Email Sent**
```
┌────────────────────────────────────────────────────────────┐
│  [WORKSPACE LOGO]                    CustomerDeskAI        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Password Changed                                          │
│                                                            │
│  Hi Priya,                                                 │
│                                                            │
│  Your password was recently changed.                       │
│                                                            │
│  If you made this change, no action is needed.             │
│                                                            │
│  If you didn't make this change, please secure your        │
│  account immediately:                                      │
│                                                            │
│  1. Use "Forgot Password" to reset your password           │
│  2. Review your active sessions and sign out               │
│     suspicious devices                                     │
│  3. Enable two-factor authentication                       │
│                                                            │
│  Changed from:                                             │
│  IP: 192.168.1.100                                         │
│  Location: São Paulo, Brazil                               │
│  Device: Chrome on MacBook Pro                             │
│  Date: December 27, 2025 at 10:45 AM                       │
│                                                            │
│  [Secure My Account]                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  CustomerDeskAI | Contact Support                          │
└────────────────────────────────────────────────────────────┘
```

### Error States

**Error 1: Current Password Incorrect**
```
Current Password *
┌─────────────────────────────────────────────┐
│  ••••••••••••                       [SHOW]  │
└─────────────────────────────────────────────┘
✗ Current password incorrect
```

**Error 2: New Passwords Don't Match**
```
Confirm New Password *
┌─────────────────────────────────────────────┐
│  ••••••••••••                       [SHOW]  │
└─────────────────────────────────────────────┘
✗ Passwords don't match
```

**Error 3: Password Too Short**
```
New Password *
┌─────────────────────────────────────────────┐
│  ••••••••                           [SHOW]  │
└─────────────────────────────────────────────┘
✗ Password must be at least 12 characters (currently 8)
```

### Design Specifications

**Typography:**
- Form labels: Inter, 14px (sm), 500 weight, --foreground
- Input text: Inter, 16px (base), 400 weight, --foreground
- Help text: Inter, 12px (xs), 400 weight, --muted
- Error text: Inter, 12px (xs), 500 weight, --destructive
- Success text: Inter, 12px (xs), 500 weight, --success

**Spacing:**
- Form container: 600px max-width, 24px padding
- Vertical gap between fields: 20px (space-5)
- Label to input gap: 8px (space-2)
- Checkbox label gap: 12px (space-3)

**Checkbox:**
- Size: 20px x 20px
- Border: 2px --border (gray-400)
- Checked: Filled --primary with white checkmark
- Label: Inter, 14px (sm), 400 weight, --foreground

**Buttons:**
- [Cancel]: Secondary (ghost variant, --muted color)
- [Change Password]: Primary (--primary background, white text)
- Disabled state: Opacity 50%, cursor not-allowed

**Accessibility:**
- Password show/hide: `aria-label="Show password"`
- Error messages: `aria-live="assertive" role="alert"`
- Checkbox: `<input type="checkbox" id="sign-out-all" checked>`

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Change Password      │
├─────────────────────────┤
│                         │
│  Current Password *     │
│  ┌───────────────────┐  │
│  │  ••••• [SHOW]     │  │
│  └───────────────────┘  │
│                         │
│  New Password *         │
│  ┌───────────────────┐  │
│  │  ••••• [SHOW]     │  │
│  └───────────────────┘  │
│  Min 12 characters      │
│                         │
│  Confirm New *          │
│  ┌───────────────────┐  │
│  │  ••••• [SHOW]     │  │
│  └───────────────────┘  │
│  ✓ Passwords match      │
│                         │
│  ─────────────────────  │
│                         │
│  ☑ Sign out all other   │
│     devices (recommended│
│                         │
│  ─────────────────────  │
│                         │
│  [Cancel]               │
│  [Change Password]      │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-width form fields
- Stack buttons vertically
- Shorter labels
- Condensed help text

---

## Wireframe 6: Session Management

**User Story:** US9.4 (Session Management Dashboard)
**Context:** User clicked [Manage Sessions →] from Security Settings
**Goal:** View all active sessions, remote sign-out capability, auto-refresh

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Security → Sessions                            [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Active Sessions                                  │
          │                                                   │
          │  You're signed in on 3 devices. Your current      │
          │  session is marked below.                         │
          │                                                   │
          │  Sessions auto-refresh every 30 seconds           │
          │  Last updated: Just now                           │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Sign Out All Other Devices                 │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │  ✓ CURRENT SESSION                                │
          │                                                   │
          │  💻 MacBook Pro • Chrome 120                      │
          │  🌍 São Paulo, Brazil                             │
          │  📍 IP: 192.168.1.100                             │
          │  🕐 Active now                                    │
          │                                                   │
          │  [This is your current session]                   │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  📱 iPhone 15 Pro • Safari 17                     │
          │  🌍 São Paulo, Brazil                             │
          │  📍 IP: 192.168.1.105                             │
          │  🕐 Active 5 minutes ago                          │
          │                                                   │
          │  [Sign Out]                                       │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  🖥️ Windows Desktop • Edge 119                    │
          │  🌍 Rio de Janeiro, Brazil                        │
          │  📍 IP: 201.45.123.89                             │
          │  🕐 Active 2 hours ago                            │
          │                                                   │
          │  [Sign Out]                                       │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Session Card Specifications

**Current Session Card (Top, Highlighted):**
- **Badge:** "✓ CURRENT SESSION" (green badge, --success background)
- **Device Icon:** 💻 (laptop), 📱 (mobile), 🖥️ (desktop) based on user-agent
- **Device Info:** Device model + Browser version
- **Location:** City, Country (from IP geolocation)
- **IP Address:** Full IP address (e.g., "192.168.1.100")
- **Last Active:** "Active now" (real-time)
- **Action:** [This is your current session] (disabled button, gray)
- **Styling:** Light green background tint (--success/10), green border (--success/30)

**Other Session Cards:**
- **Device Icon:** Based on user-agent parsing
- **Device Info:** Device model + Browser version
- **Location:** City, Country
- **IP Address:** Full IP address
- **Last Active:** Relative timestamp (e.g., "5 minutes ago", "2 hours ago")
- **Action:** [Sign Out] button (destructive styling, --destructive color)
- **Styling:** White background, gray border (--border)

### Sign Out Actions

**Individual Sign Out:**
```
User clicks [Sign Out] on specific session
↓
Confirmation Modal Appears:

┌────────────────────────────────────────────────────────────┐
│  Sign Out This Device?                                     │
│                                                            │
│  This will end the session on:                             │
│  📱 iPhone 15 Pro • Safari 17                              │
│  São Paulo, Brazil                                         │
│                                                            │
│  You'll need to sign in again on that device.              │
│                                                            │
│  [Cancel]  [Sign Out]                                      │
└────────────────────────────────────────────────────────────┘

User clicks [Sign Out] in modal
↓
Session invalidated
↓
Card removed from list with fade-out animation
↓
Toast notification: "✓ Device signed out successfully"
```

**Bulk Sign Out (All Other Devices):**
```
User clicks [Sign Out All Other Devices]
↓
Confirmation Modal Appears:

┌────────────────────────────────────────────────────────────┐
│  Sign Out All Other Devices?                               │
│                                                            │
│  This will end 2 sessions:                                 │
│  • 📱 iPhone 15 Pro (São Paulo, Brazil)                    │
│  • 🖥️ Windows Desktop (Rio de Janeiro, Brazil)            │
│                                                            │
│  Your current session will remain active.                  │
│                                                            │
│  [Cancel]  [Sign Out All]                                  │
└────────────────────────────────────────────────────────────┘

User clicks [Sign Out All] in modal
↓
All other sessions invalidated
↓
Only current session card remains
↓
Toast notification: "✓ All other devices signed out (2 sessions ended)"
```

### Auto-Refresh Mechanism

**Implementation:**
```typescript
// Frontend: Short polling every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    refetchSessions();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);

// Display last update timestamp
const [lastUpdated, setLastUpdated] = useState(new Date());
useEffect(() => {
  setLastUpdated(new Date());
}, [sessions]);

// Relative time display
"Last updated: Just now" (< 10s)
"Last updated: 15 seconds ago" (10-60s)
"Last updated: 1 minute ago" (> 60s)
```

**Visual Feedback:**
- Subtle pulse animation on refresh
- "Last updated: Just now" text updates
- No jarring page reloads (seamless)

### Device & Browser Detection

**User-Agent Parsing:**
```typescript
function parseUserAgent(ua: string): DeviceInfo {
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  return {
    deviceType: device.type || 'desktop', // mobile, tablet, desktop
    deviceModel: device.model || os.name, // iPhone 15 Pro, MacBook Pro
    browser: `${browser.name} ${browser.version}`, // Chrome 120
    icon: getDeviceIcon(device.type), // 💻 📱 🖥️
  };
}

function getDeviceIcon(type: string): string {
  const icons = {
    mobile: '📱',
    tablet: '📱',
    desktop: '🖥️',
    laptop: '💻',
  };
  return icons[type] || '🖥️';
}
```

**IP Geolocation:**
```typescript
// Use IP geolocation service (e.g., IPStack, GeoIP)
async function getLocationFromIP(ip: string): Promise<Location> {
  const response = await fetch(`https://ipapi.co/${ip}/json/`);
  const data = await response.json();

  return {
    city: data.city, // São Paulo
    country: data.country_name, // Brazil
    countryCode: data.country_code, // BR
  };
}
```

### Design Specifications

**Session Cards:**
- Background: --background (white)
- Border: 1px --border (gray-300)
- Padding: 16px (space-4)
- Rounded: 6px (rounded-md)
- Gap between cards: 12px (space-3)

**Current Session Card:**
- Background: hsl(var(--success) / 0.05) (light green tint)
- Border: 1px hsl(var(--success) / 0.3) (green)
- Badge: --success background, white text, 12px (xs) text

**Typography:**
- Session badge: Inter, 12px (xs), 600 weight, uppercase
- Device info: Inter, 16px (base), 500 weight, --foreground
- Location/IP: Inter, 14px (sm), 400 weight, --muted
- Last active: Inter, 12px (xs), 400 weight, --muted

**Icons:**
- Device icons: 20px, inline with device name
- Emoji fallback for older browsers

**Buttons:**
- [Sign Out]: Secondary destructive (--destructive color, transparent background)
- [Sign Out All Other Devices]: Primary destructive (--destructive background, white text)

**Accessibility:**
- Session list: `<ul role="list">` with `<li>` for each session
- Current session badge: `aria-label="Current session (cannot sign out)"`
- Sign out buttons: `aria-label="Sign out from iPhone 15 Pro in São Paulo"`
- Auto-refresh: `aria-live="polite" aria-atomic="true"` for session list

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Sessions             │
├─────────────────────────┤
│                         │
│  Active Sessions        │
│  3 devices signed in    │
│  Updated: Just now      │
│                         │
│  [Sign Out All Others]  │
│                         │
│  ─────────────────────  │
│                         │
│  ✓ CURRENT              │
│  💻 MacBook Pro         │
│  Chrome 120             │
│  São Paulo, Brazil      │
│  192.168.1.100          │
│  Active now             │
│                         │
│  ─────────────────────  │
│                         │
│  📱 iPhone 15 Pro       │
│  Safari 17              │
│  São Paulo, Brazil      │
│  192.168.1.105          │
│  5 minutes ago          │
│  [Sign Out]             │
│                         │
│  ─────────────────────  │
│                         │
│  🖥️ Windows Desktop     │
│  Edge 119               │
│  Rio de Janeiro, BR     │
│  201.45.123.89          │
│  2 hours ago            │
│  [Sign Out]             │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Smaller device icons (16px)
- Condensed location (city + country code)
- Full-width cards
- Stacked layout (single column)

---

## Wireframe 7: 2FA Setup Flow

**User Story:** US9.7, US9.9 (2FA Setup + Backup Codes)
**Context:** User clicked [Enable 2FA →] from Security Settings
**Goal:** QR code setup, TOTP verification, backup codes generation

### Step 1: Introduction & QR Code

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Security → Enable 2FA                          [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Enable Two-Factor Authentication                 │
          │                                                   │
          │  Add an extra layer of security to your account.  │
          │  You'll need a code from your authenticator app   │
          │  each time you sign in.                           │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  Step 1 of 3: Scan QR Code                        │
          │                                                   │
          │  Use an authenticator app like:                   │
          │  • Google Authenticator                           │
          │  • Authy                                          │
          │  • 1Password                                      │
          │  • Microsoft Authenticator                        │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │                                             │  │
          │  │       [QR CODE IMAGE]                       │  │
          │  │         200x200px                           │  │
          │  │                                             │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  Can't scan? Enter this code manually:            │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  ABCD 1234 EFGH 5678 IJKL 9012              │  │
          │  │  [Copy]                                     │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  [Cancel]  [Next: Verify Code →]                  │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Step 2: TOTP Verification

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Security → Enable 2FA                          [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Enable Two-Factor Authentication                 │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  Step 2 of 3: Verify Code                         │
          │                                                   │
          │  Enter the 6-digit code from your authenticator   │
          │  app to verify the setup.                         │
          │                                                   │
          │  Verification Code *                              │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  [_][_][_][_][_][_]                         │  │
          │  │  (6 individual input boxes, auto-advance)   │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  Code refreshes every 30 seconds in your app.     │
          │                                                   │
          │  ℹ Make sure your device time is accurate.        │
          │                                                   │
          │  [← Back]  [Verify & Continue →]                  │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

**TOTP Input Behavior:**
- 6 individual input boxes (1 digit each)
- Auto-advance on digit entry
- Auto-submit when 6th digit entered
- Paste support (splits pasted 6-digit code across boxes)
- Clear all on error

**Verification Error State:**
```
Verification Code *
┌─────────────────────────────────────────────┐
│  [1][2][3][4][5][6]                         │
└─────────────────────────────────────────────┘
✗ Code incorrect. Please try again.
[Clear and retry]
```

### Step 3: Backup Codes Generation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Security → Enable 2FA                          [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  ✓ Two-Factor Authentication Enabled              │
          │                                                   │
          │  ─────────────────────────────────────────────    │
          │                                                   │
          │  Step 3 of 3: Save Backup Codes                   │
          │                                                   │
          │  ⚠ Save these backup codes in a secure location.  │
          │    Each code can only be used once.               │
          │                                                   │
          │  You'll need these if you lose access to your     │
          │  authenticator app.                               │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  12345678    56781234                       │  │
          │  │  87654321    21436587                       │  │
          │  │  11223344    44332211                       │  │
          │  │  55667788    88776655                       │  │
          │  │  99887766    66778899                       │  │
          │  │                                             │  │
          │  │  (10 single-use 8-digit codes)              │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Download Backup Codes (.txt)               │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          │  ☑ I have saved my backup codes                   │
          │     (required to continue)                        │
          │                                                   │
          │  [Done]                                           │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

**Backup Codes Display:**
- 10 codes arranged in 2 columns (5 rows)
- Each code is 8 digits (monospace font)
- Copyable text area (select all on click)
- Download as .txt file with clear filename (`backup-codes-priya-patel-2025-12-27.txt`)

**Checkbox Requirement:**
- [Done] button disabled until checkbox checked
- Forces user acknowledgment (prevents accidental skip)

### Backup Codes Download File Format

```
CustomerDeskAI - Two-Factor Authentication Backup Codes
Generated: December 27, 2025
Account: priya@acme.com

⚠ IMPORTANT: Save these codes in a secure location.
Each code can only be used once to sign in if you lose
access to your authenticator app.

Backup Codes (10 codes):
─────────────────────────
12345678
87654321
11223344
55667788
99887766
56781234
21436587
44332211
88776655
66778899

Do NOT share these codes with anyone.
```

### Backend Implementation (2FA Setup)

**API Flow:**
```typescript
// Step 1: Generate QR Code
POST /api/auth/2fa/generate
Response: {
  qrCodeUrl: string, // Data URL for QR code image
  secret: string, // Manual entry fallback (ABCD1234...)
  userId: string,
}

// Step 2: Verify TOTP Code
POST /api/auth/2fa/verify
Request: { code: string }
Response: {
  success: boolean,
  backupCodes: string[], // 10 codes if success=true
}

// Step 3: Enable 2FA (after verification)
POST /api/auth/2fa/enable
Request: { confirmed: boolean } // User checked "I have saved codes"
Response: { success: boolean }
```

**Database Changes:**
```typescript
// Table: users (update existing)
{
  two_factor_enabled: boolean,
  two_factor_secret: text, // Encrypted TOTP secret
  two_factor_backup_codes: jsonb, // Array of hashed backup codes
  two_factor_enabled_at: timestamp,
}
```

### Design Specifications

**QR Code:**
- Size: 200x200px
- Background: white with 10px padding
- Border: 1px --border (gray-300)
- Centered in container

**Manual Secret:**
- Monospace font (e.g., `font-family: 'Courier New', monospace`)
- Letter-spaced for readability (letter-spacing: 2px)
- [Copy] button inline (copies to clipboard)

**TOTP Input Boxes:**
- Size: 48px x 48px each
- Gap: 8px between boxes
- Font size: 24px (2xl)
- Border: 2px --border (gray-400)
- Focus: 2px --ring (blue-500)
- Auto-focus on first box on load

**Backup Codes:**
- Monospace font
- Font size: 16px (base)
- Line height: 1.8 (generous spacing)
- Background: --muted (gray-100)
- Padding: 16px (space-4)
- Rounded: 4px (rounded-sm)

**Accessibility:**
- Step indicator: `role="progressbar" aria-valuenow="1" aria-valuemax="3"`
- QR code: `alt="Scan this QR code with your authenticator app"`
- TOTP inputs: `aria-label="Digit 1 of 6"` for each box
- Backup codes: `role="region" aria-label="Backup codes for account recovery"`

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Enable 2FA           │
├─────────────────────────┤
│                         │
│  Step 1 of 3            │
│  Scan QR Code           │
│                         │
│  Use authenticator app: │
│  • Google Authenticator │
│  • Authy                │
│  • 1Password            │
│                         │
│  ┌───────────────────┐  │
│  │   [QR CODE]       │  │
│  │   160x160px       │  │
│  └───────────────────┘  │
│                         │
│  Manual code:           │
│  ABCD 1234 EFGH 5678    │
│  [Copy]                 │
│                         │
│  [Cancel]               │
│  [Next: Verify Code]    │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Smaller QR code (160x160px vs 200x200px)
- Stacked buttons (vertical layout)
- Condensed instructions
- TOTP inputs: 40px x 40px (smaller touch targets)

---

## Wireframe 8: 2FA Verification on Login

**User Story:** US9.8 (Two-Factor Authentication Verification)
**Context:** User with 2FA enabled completed email/password login
**Goal:** TOTP code verification, backup code fallback, trust device option

### Login Flow (After Email/Password Success)

**Step 1: Email/Password Login Success**
```
User enters email + password on sign-in page
↓
Credentials verified (Better-Auth)
↓
Check if user has 2FA enabled:
  - If enabled → Redirect to 2FA verification page
  - If disabled → Create session, redirect to dashboard
```

### 2FA Verification Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CustomerDeskAI                                 │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────┐
                    │                                       │
                    │  Two-Factor Authentication            │
                    │                                       │
                    │  Enter the code from your             │
                    │  authenticator app                    │
                    │                                       │
                    │  Verification Code                    │
                    │  ┌─────────────────────────────────┐  │
                    │  │  [_][_][_][_][_][_]             │  │
                    │  │  (6 individual boxes)           │  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    │  Code refreshes every 30 seconds      │
                    │  in your authenticator app.           │
                    │                                       │
                    │  ─────────────────────────────────    │
                    │                                       │
                    │  ☐ Trust this device for 30 days      │
                    │     Skip 2FA on this device for        │
                    │     the next 30 days.                 │
                    │                                       │
                    │  ─────────────────────────────────    │
                    │                                       │
                    │  ┌─────────────────────────────────┐  │
                    │  │  Verify & Sign In               │  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    │  [Use backup code instead]            │
                    │                                       │
                    │  [← Back to sign in]                  │
                    │                                       │
                    └───────────────────────────────────────┘
```

### TOTP Code Input Specifications

**6-Digit Input Boxes:**
- Size: 48px x 48px each
- Gap: 8px between boxes
- Font size: 24px (2xl)
- Border: 2px --border (gray-400)
- Focus: 2px --ring (blue-500)
- Auto-advance on digit entry
- Auto-submit when 6th digit entered

**Paste Support:**
```typescript
// Handle paste of 6-digit code
onPaste = (e) => {
  const pastedText = e.clipboardData.getData('text').replace(/\s/g, '');
  if (/^\d{6}$/.test(pastedText)) {
    // Split into individual digits and fill boxes
    pastedText.split('').forEach((digit, index) => {
      inputRefs[index].value = digit;
    });
    // Auto-submit after paste
    submitCode(pastedText);
  }
};
```

**Trust This Device (Optional):**
- Checkbox (unchecked by default)
- Label: "Trust this device for 30 days"
- Help text: "Skip 2FA on this device for the next 30 days."
- Implementation: Device fingerprinting + encrypted cookie

### Backup Code Fallback

**User Clicks [Use backup code instead]:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CustomerDeskAI                                 │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────┐
                    │                                       │
                    │  Use Backup Code                      │
                    │                                       │
                    │  Enter one of your backup codes       │
                    │  to sign in.                          │
                    │                                       │
                    │  Backup Code                          │
                    │  ┌─────────────────────────────────┐  │
                    │  │  12345678                       │  │
                    │  │  (8-digit code)                 │  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    │  ⚠ Each backup code can only be       │
                    │    used once.                         │
                    │                                       │
                    │  ┌─────────────────────────────────┐  │
                    │  │  Verify & Sign In               │  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    │  [Use authenticator app instead]      │
                    │                                       │
                    │  [← Back to sign in]                  │
                    │                                       │
                    └───────────────────────────────────────┘
```

**Backup Code Input:**
- Single input field (8 digits)
- Monospace font
- Numeric keyboard on mobile
- Real-time validation (must be 8 digits)

### Verification Success Flow

**Step 1: Code Submitted**
```
User enters 6-digit TOTP code
↓
Submit to API: POST /api/auth/2fa/verify-login
↓
Validate code (30-second window)
```

**Step 2: Code Verification (Backend)**
```typescript
async function verify2FALogin(userId: string, code: string, trustDevice: boolean) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Verify TOTP code
  const isValid = verifyTOTP(user.twoFactorSecret, code);

  if (!isValid) {
    return { success: false, error: 'Invalid code' };
  }

  // Create authenticated session
  const session = await auth.createSession({ userId });

  // Set trust device cookie if requested
  if (trustDevice) {
    const deviceToken = await generateDeviceToken(userId);
    // Set encrypted cookie (30-day expiry)
    setCookie('trusted_device', deviceToken, { maxAge: 30 * 24 * 60 * 60 });
  }

  return { success: true, sessionToken: session.token };
}
```

**Step 3: Success Redirect**
```
Session created
↓
Redirect to workspace dashboard
↓
User fully authenticated
```

### Backup Code Verification Flow

**Backend Logic:**
```typescript
async function verifyBackupCode(userId: string, code: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Check if code exists in backup codes array
  const hashedCode = hashBackupCode(code);
  const codeIndex = user.twoFactorBackupCodes.findIndex(c => c === hashedCode);

  if (codeIndex === -1) {
    return { success: false, error: 'Invalid or already used backup code' };
  }

  // Mark code as used (remove from array)
  const updatedCodes = [...user.twoFactorBackupCodes];
  updatedCodes.splice(codeIndex, 1);

  await db.update(users)
    .set({ twoFactorBackupCodes: updatedCodes })
    .where(eq(users.id, userId));

  // Create session
  const session = await auth.createSession({ userId });

  // Warn if <3 codes remaining
  const remainingCodes = updatedCodes.length;
  const warning = remainingCodes < 3 ? `Only ${remainingCodes} backup codes remaining. Generate new codes.` : null;

  return { success: true, sessionToken: session.token, warning };
}
```

**Post-Login Warning (If <3 Backup Codes Remaining):**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠ Low Backup Codes                                        │
│                                                            │
│  You have only 2 backup codes remaining.                   │
│                                                            │
│  Generate new backup codes to ensure you can access        │
│  your account if you lose your authenticator app.          │
│                                                            │
│  [Generate New Codes Now]  [Remind Me Later]               │
└────────────────────────────────────────────────────────────┘
```

### Error States

**Error 1: Invalid TOTP Code**
```
Verification Code
┌─────────────────────────────────┐
│  [1][2][3][4][5][6]             │
└─────────────────────────────────┘
✗ Code incorrect. Please try again.
(Auto-clear input, refocus first box)
```

**Error 2: Invalid Backup Code**
```
Backup Code
┌─────────────────────────────────┐
│  12345678                       │
└─────────────────────────────────┘
✗ Invalid or already used backup code.
```

**Error 3: Too Many Failed Attempts (Rate Limiting)**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠ Too Many Attempts                                       │
│                                                            │
│  For security, your account has been temporarily locked.   │
│                                                            │
│  Please try again in 15 minutes, or reset your password    │
│  to regain access immediately.                             │
│                                                            │
│  [Reset Password]  [Contact Support]                       │
└────────────────────────────────────────────────────────────┘
```

### Design Specifications

**Typography:**
- Heading: Inter, 24px (xl), 600 weight, --foreground
- Body: Inter, 16px (base), 400 weight, --foreground
- Help text: Inter, 12px (xs), 400 weight, --muted
- Error text: Inter, 12px (xs), 500 weight, --destructive

**Spacing:**
- Form container: 480px max-width, centered
- Vertical gap between elements: 16px (space-4)
- Input boxes gap: 8px (space-2)

**Checkbox (Trust Device):**
- Size: 20px x 20px
- Border: 2px --border (gray-400)
- Label: Inter, 14px (sm), 400 weight, --foreground

**Buttons:**
- [Verify & Sign In]: Primary (--primary background, white text)
- [Use backup code instead]: Secondary (text link, --muted color)
- [Back to sign in]: Ghost (text link, --muted color)

**Accessibility:**
- TOTP inputs: `aria-label="Digit 1 of 6"` for each box
- Trust device checkbox: `<input type="checkbox" id="trust-device">`
- Error messages: `aria-live="assertive" role="alert"`
- Focus management: Auto-focus on first input on page load

### Mobile Optimization

```
┌─────────────────────────┐
│  CustomerDeskAI         │
├─────────────────────────┤
│                         │
│  Two-Factor Auth        │
│                         │
│  Enter code from your   │
│  authenticator app      │
│                         │
│  ┌───────────────────┐  │
│  │ [_][_][_][_][_][_]│  │
│  └───────────────────┘  │
│                         │
│  Code refreshes every   │
│  30 seconds             │
│                         │
│  ─────────────────────  │
│                         │
│  ☐ Trust device 30 days │
│                         │
│  ─────────────────────  │
│                         │
│  [Verify & Sign In]     │
│                         │
│  [Use backup code]      │
│                         │
│  [← Back to sign in]    │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Smaller TOTP boxes (40px x 40px)
- Numeric keyboard auto-opens
- Full-width buttons
- Condensed help text

---

## Wireframe 9: 2FA Disable Flow

**User Story:** US9.10 (Disable Two-Factor Authentication)
**Context:** User clicked [Disable 2FA] from Security Settings
**Goal:** Multi-step confirmation (password + TOTP) before disabling

### Disable 2FA Confirmation Modal

```
┌────────────────────────────────────────────────────────────────────────┐
│  Disable Two-Factor Authentication?                                   │
│                                                                        │
│  ⚠ This will make your account less secure.                           │
│                                                                        │
│  You'll only need your password to sign in. Anyone with                │
│  your password will be able to access your account.                    │
│                                                                        │
│  To disable 2FA, confirm your identity:                                │
│                                                                        │
│  Current Password *                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ••••••••••••                                            [SHOW]  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Authenticator Code *                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  [_][_][_][_][_][_]                                              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  Enter the 6-digit code from your authenticator app                   │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────    │
│                                                                        │
│  ℹ Backup codes will be deleted when 2FA is disabled.                 │
│                                                                        │
│  [Cancel]  [Disable 2FA]                                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Field Specifications

**Current Password (Required):**
- **Type:** Password input with toggle visibility
- **Validation:** Server-side verification against stored hash
- **Purpose:** Prevent unauthorized 2FA disabling (in case device left unlocked)

**Authenticator Code (Required):**
- **Type:** 6-digit TOTP input (same as login verification)
- **Validation:** 30-second validity window
- **Purpose:** Final proof of authenticator app access before removal

### Disable Flow (Backend)

```typescript
async function disable2FA(userId: string, password: string, totpCode: string) {
  // Step 1: Verify password
  const user = await auth.verifyPassword(userId, password);
  if (!user) {
    return { success: false, error: 'Current password incorrect' };
  }

  // Step 2: Verify TOTP code
  const isValidTOTP = verifyTOTP(user.twoFactorSecret, totpCode);
  if (!isValidTOTP) {
    return { success: false, error: 'Invalid authenticator code' };
  }

  // Step 3: Disable 2FA
  await db.update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null, // Delete secret
      twoFactorBackupCodes: null, // Delete backup codes
      twoFactorDisabledAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Step 4: Send confirmation email
  await sendEmail({
    to: user.email,
    subject: '2FA Disabled on Your Account',
    template: 'two-factor-disabled',
    data: { userName: user.name, timestamp: new Date() },
  });

  return { success: true };
}
```

### Success State

```
┌────────────────────────────────────────────────────────────┐
│  ✓ Two-Factor Authentication Disabled                     │
│                                                            │
│  Your account now uses password-only authentication.       │
│                                                            │
│  A confirmation email was sent to priya@acme.com           │
│                                                            │
│  You can re-enable 2FA anytime from Security Settings.     │
│                                                            │
│  [Return to Security Settings]                             │
└────────────────────────────────────────────────────────────┘
```

### Confirmation Email (2FA Disabled)

```
┌────────────────────────────────────────────────────────────┐
│  [WORKSPACE LOGO]                    CustomerDeskAI        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Two-Factor Authentication Disabled                        │
│                                                            │
│  Hi Priya,                                                 │
│                                                            │
│  Two-factor authentication was disabled on your account.   │
│                                                            │
│  ⚠ Your account is now less secure. Anyone with your       │
│    password can sign in.                                   │
│                                                            │
│  If you made this change, no action is needed.             │
│                                                            │
│  If you didn't make this change, secure your account       │
│  immediately:                                              │
│                                                            │
│  1. Change your password                                   │
│  2. Review active sessions and sign out suspicious devices │
│  3. Re-enable two-factor authentication                    │
│                                                            │
│  Disabled from:                                            │
│  IP: 192.168.1.100                                         │
│  Location: São Paulo, Brazil                               │
│  Device: Chrome on MacBook Pro                             │
│  Date: December 27, 2025 at 2:30 PM                        │
│                                                            │
│  [Secure My Account]                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  CustomerDeskAI | Contact Support                          │
└────────────────────────────────────────────────────────────┘
```

### Error States

**Error 1: Incorrect Password**
```
Current Password *
┌──────────────────────────────────────────────┐
│  ••••••••••••                        [SHOW]  │
└──────────────────────────────────────────────┘
✗ Current password incorrect
```

**Error 2: Invalid TOTP Code**
```
Authenticator Code *
┌──────────────────────────────────────────────┐
│  [1][2][3][4][5][6]                          │
└──────────────────────────────────────────────┘
✗ Invalid code. Please try again.
```

### Design Specifications

**Modal:**
- Width: 600px max-width
- Background: --background (white)
- Border: 1px --border (gray-300)
- Shadow: Large shadow
- Padding: 32px (space-8)

**Typography:**
- Heading: Inter, 20px (lg), 600 weight, --foreground
- Warning: Inter, 14px (sm), 500 weight, --warning
- Body: Inter, 14px (sm), 400 weight, --foreground
- Help text: Inter, 12px (xs), 400 weight, --muted

**Warning Callout:**
- Background: hsl(var(--warning) / 0.1) (light yellow tint)
- Border-left: 4px solid var(--warning)
- Icon: ⚠ (warning triangle, --warning color)
- Padding: 12px (space-3)

**Buttons:**
- [Cancel]: Secondary (ghost variant, --muted color)
- [Disable 2FA]: Destructive (--destructive background, white text)

**Accessibility:**
- Modal: `role="alertdialog" aria-labelledby="disable-2fa-title"`
- Warning: `role="alert" aria-live="polite"`
- Password field: `aria-label="Enter current password to confirm"`
- TOTP field: `aria-label="Enter authenticator code to confirm"`

### Mobile Optimization

```
┌─────────────────────────┐
│  Disable 2FA?           │
├─────────────────────────┤
│                         │
│  ⚠ Less secure          │
│                         │
│  Password-only login    │
│  will be used.          │
│                         │
│  Current Password *     │
│  ┌───────────────────┐  │
│  │  ••••• [SHOW]     │  │
│  └───────────────────┘  │
│                         │
│  Authenticator Code *   │
│  ┌───────────────────┐  │
│  │  [_][_][_][_][_]  │  │
│  └───────────────────┘  │
│  6-digit code           │
│                         │
│  ─────────────────────  │
│                         │
│  ℹ Backup codes will    │
│    be deleted           │
│                         │
│  [Cancel]               │
│  [Disable 2FA]          │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-screen modal on mobile
- Smaller TOTP inputs (40px x 40px)
- Stacked buttons (vertical layout)
- Condensed warning text

---

## Wireframe 10: Linked Accounts Management

**User Story:** US9.6 (Linked Social Accounts Management)
**Context:** User clicked [View →] on Linked Accounts card from overview
**Goal:** Connect/disconnect Google and GitHub accounts

### Layout (Desktop - 1440px optimized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings → Account → Linked Accounts                      [Priya ▼]    │
└─────────────────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  Linked Accounts                                  │
          │                                                   │
          │  Connect social accounts to sign in faster.       │
          │  You can link multiple providers.                 │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  [G] Google                           ✓ Connected │
          │                                                   │
          │  priya@acme.com                                   │
          │  Connected on January 15, 2025                    │
          │                                                   │
          │  You can use "Sign in with Google" to access      │
          │  your account.                                    │
          │                                                   │
          │  [Unlink Google Account]                          │
          │                                                   │
          └───────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │  [GitHub Logo] GitHub                 Not Connected│
          │                                                   │
          │  Link your GitHub account to sign in with GitHub. │
          │                                                   │
          │  ┌─────────────────────────────────────────────┐  │
          │  │  Link GitHub Account →                      │  │
          │  └─────────────────────────────────────────────┘  │
          │                                                   │
          └───────────────────────────────────────────────────┘
```

### Provider Card Specifications

**Connected Provider Card (Google):**
- **Status:** "✓ Connected" (green badge, --success background)
- **Provider Icon:** Google "G" logo (24px)
- **Email:** Email address linked to this provider
- **Timestamp:** Connected on [date]
- **Description:** "You can use 'Sign in with Google' to access your account."
- **Action:** [Unlink Google Account] button (destructive styling, --destructive color)

**Disconnected Provider Card (GitHub):**
- **Status:** "Not Connected" (gray text, --muted)
- **Provider Icon:** GitHub Octocat logo (24px)
- **Description:** "Link your GitHub account to sign in with GitHub."
- **Action:** [Link GitHub Account →] button (primary CTA, --primary background)

### Link Account Flow (OAuth)

**User Clicks [Link GitHub Account →]:**
```
Step 1: Initiate OAuth Flow
↓
POST /api/auth/oauth/github/link
↓
Redirect to GitHub OAuth consent page:

┌────────────────────────────────────────────────────────────┐
│  [GitHub Logo]                                             │
│                                                            │
│  Authorize CustomerDeskAI                                  │
│                                                            │
│  CustomerDeskAI would like permission to:                  │
│  ✓ Verify your GitHub identity                            │
│  ✓ Access your email address                              │
│                                                            │
│  By authorizing, you agree to CustomerDeskAI's             │
│  Terms of Service and Privacy Policy.                      │
│                                                            │
│  [Cancel]  [Authorize CustomerDeskAI]                      │
└────────────────────────────────────────────────────────────┘

Step 2: User Authorizes
↓
GitHub redirects to callback URL with authorization code
↓
Exchange code for access token
↓
Fetch GitHub user profile (email, id)
↓
Link GitHub account to existing CustomerDeskAI account
↓
Redirect to Linked Accounts page with success message
```

### OAuth Callback Success

```
┌────────────────────────────────────────────────────────────┐
│  ✓ GitHub Account Linked                                   │
│                                                            │
│  Your GitHub account (priya@acme.com) has been             │
│  successfully linked.                                      │
│                                                            │
│  You can now use "Sign in with GitHub" to access           │
│  your account.                                             │
│                                                            │
│  [Close]                                                   │
└────────────────────────────────────────────────────────────┘
```

### Unlink Account Confirmation

**User Clicks [Unlink Google Account]:**
```
┌────────────────────────────────────────────────────────────┐
│  Unlink Google Account?                                    │
│                                                            │
│  ⚠ Make sure you have another way to sign in.             │
│                                                            │
│  After unlinking, you won't be able to use                 │
│  "Sign in with Google" anymore.                            │
│                                                            │
│  You can still sign in with:                               │
│  ✓ Email & Password                                        │
│  ✓ GitHub (linked)                                         │
│                                                            │
│  [Cancel]  [Unlink Account]                                │
└────────────────────────────────────────────────────────────┘
```

**Validation (Prevent Last Login Method Removal):**
```typescript
async function unlinkProvider(userId: string, provider: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Check remaining login methods
  const hasPassword = user.passwordHash !== null;
  const linkedProviders = [user.googleId, user.githubId].filter(Boolean);

  if (!hasPassword && linkedProviders.length === 1) {
    // Cannot unlink last login method
    return {
      success: false,
      error: 'Cannot unlink last login method. Set a password first.',
    };
  }

  // Unlink provider
  if (provider === 'google') {
    await db.update(users).set({ googleId: null }).where(eq(users.id, userId));
  } else if (provider === 'github') {
    await db.update(users).set({ githubId: null }).where(eq(users.id, userId));
  }

  return { success: true };
}
```

**Error: Cannot Unlink Last Login Method**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠ Cannot Unlink Last Login Method                        │
│                                                            │
│  You must have at least one way to sign in.                │
│                                                            │
│  To unlink this account:                                   │
│  1. Set a password for email/password login, OR            │
│  2. Link another social account (GitHub)                   │
│                                                            │
│  Then you can unlink this account.                         │
│                                                            │
│  [Set Password]  [Link GitHub]  [Cancel]                   │
└────────────────────────────────────────────────────────────┘
```

### Backend Implementation (OAuth Linking)

**API Endpoints:**
```typescript
// Initiate OAuth flow
GET /api/auth/oauth/:provider/link
→ Redirects to provider consent page

// OAuth callback
GET /api/auth/oauth/:provider/callback
→ Exchanges code for token, links account

// Unlink provider
DELETE /api/auth/oauth/:provider/link
→ Removes provider linkage
```

**Database Schema:**
```typescript
// Table: users (add OAuth columns)
{
  google_id: string | null, // Google user ID
  github_id: string | null, // GitHub user ID
  google_linked_at: timestamp | null,
  github_linked_at: timestamp | null,
}
```

### Design Specifications

**Provider Cards:**
- Background: --background (white)
- Border: 1px --border (gray-300)
- Padding: 20px (space-5)
- Rounded: 6px (rounded-md)
- Gap between cards: 16px (space-4)

**Connected Card:**
- Status badge: --success background (green-100), --success text (green-700)
- Border color: hsl(var(--success) / 0.3) (subtle green tint)

**Provider Icons:**
- Size: 32px x 32px
- Inline with provider name
- SVG format (crisp at all sizes)

**Typography:**
- Provider name: Inter, 18px (lg), 600 weight, --foreground
- Status: Inter, 12px (xs), 600 weight, uppercase
- Email: Inter, 14px (sm), 400 weight, --muted
- Description: Inter, 14px (sm), 400 weight, --foreground

**Buttons:**
- [Link Account]: Primary (--primary background, white text)
- [Unlink Account]: Destructive secondary (--destructive color, transparent background)

**Accessibility:**
- Provider cards: `<article>` semantic HTML
- Status badges: `<span aria-label="Google account connected">`
- Link buttons: `aria-label="Link your GitHub account"`
- Unlink buttons: `aria-label="Unlink your Google account"`

### Mobile Optimization

```
┌─────────────────────────┐
│  ← Linked Accounts      │
├─────────────────────────┤
│                         │
│  Connect social         │
│  accounts to sign in    │
│  faster.                │
│                         │
│  ─────────────────────  │
│                         │
│  [G] Google             │
│  ✓ Connected            │
│                         │
│  priya@acme.com         │
│  Jan 15, 2025           │
│                         │
│  Use "Sign in with      │
│  Google"                │
│                         │
│  [Unlink Account]       │
│                         │
│  ─────────────────────  │
│                         │
│  [GitHub] GitHub        │
│  Not Connected          │
│                         │
│  Link GitHub to         │
│  sign in.               │
│                         │
│  [Link GitHub →]        │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Smaller provider icons (24px vs 32px)
- Condensed descriptions
- Full-width buttons
- Stacked layout (single column)

---

## Wireframe 11: Workspace Switcher (US9.11)

**User Story:** As a user, I want to easily switch between workspaces I belong to so that I can access different organizations' tickets without logging out.

### Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] CustomerDeskAI    [@] sarah.m@acme.com    [●●●]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Workspace Switcher Dropdown (Triggered by header click)  │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Current Workspace                               │     │
│  │                                                  │     │
│  │  ● Acme Corp                            [Admin] │     │
│  │    24 active tickets · Last active today        │     │
│  │                                                  │     │
│  │  ──────────────────────────────────────────────  │     │
│  │                                                  │     │
│  │  Your Workspaces                                │     │
│  │                                                  │     │
│  │  ○ Tech Support Inc                     [Agent] │     │
│  │    12 active tickets · Last active 2 days ago   │     │
│  │                                                  │     │
│  │  ○ Global Services                      [Admin] │     │
│  │    8 active tickets · Last active 1 week ago    │     │
│  │                                                  │     │
│  │  ──────────────────────────────────────────────  │     │
│  │                                                  │     │
│  │  Pending Invitations                      (2)   │     │
│  │                                                  │     │
│  │  📧 CustomerHelpDesk                   [View →] │     │
│  │     Invited by: john@chd.com                    │     │
│  │     Role: Agent · 3 days ago                    │     │
│  │                                                  │     │
│  │  📧 Enterprise Solutions               [View →] │     │
│  │     Invited by: admin@ent.com                   │     │
│  │     Role: Admin · 1 day ago                     │     │
│  │                                                  │     │
│  │  ──────────────────────────────────────────────  │     │
│  │                                                  │     │
│  │  [+ Create New Workspace]                       │     │
│  │                                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Visual Hierarchy:**
- **Current workspace:** Filled radio button (●), highlighted background (--accent-light)
- **Other workspaces:** Empty radio button (○), hover state
- **Pending invitations:** Distinct section with email icon (📧)
- **Role badges:** Color-coded (Admin: purple, Agent: blue, Viewer: gray)
- **Activity indicators:** Last active timestamp, ticket count

### Workspace Card Details

Each workspace card contains:

1. **Workspace Name** (h4, --foreground-bold, 16px)
2. **Role Badge** (--accent background for Admin, --muted for Agent/Viewer)
3. **Activity Metadata:**
   - Ticket count: "24 active tickets"
   - Last active: Relative time ("today", "2 days ago", "1 week ago")
4. **Selection Indicator:** Radio button (●/○)

### Pending Invitation Card

```
┌──────────────────────────────────────────────┐
│  📧 CustomerHelpDesk                [View →] │
│     Invited by: john@chd.com                 │
│     Role: Agent · 3 days ago                 │
└──────────────────────────────────────────────┘
```

**Click Behavior:**
- **[View →]:** Opens Wireframe 12 (Accept Invitation modal)
- **Card click:** Same as [View →] button

### Workspace Switching Flow

**User Action:** Click workspace card

**Steps:**
1. Show loading spinner overlay (--muted background)
2. Call API: `POST /api/workspaces/switch`
   ```typescript
   { workspaceId: "ws_abc123" }
   ```
3. Backend updates session context (HTTP-only cookie)
4. Refresh page to load new workspace data
5. Show toast: "Switched to {Workspace Name}"

**Backend Logic:**
```typescript
async function switchWorkspace(userId: string, workspaceId: string) {
  // Verify user has access to workspace
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.status, 'active'),
    ),
  });

  if (!membership) {
    return { success: false, error: 'Access denied' };
  }

  // Update session context
  await updateSessionWorkspace(userId, workspaceId);

  // Record last active timestamp
  await db.update(workspaceMembers)
    .set({ lastActiveAt: new Date() })
    .where(eq(workspaceMembers.id, membership.id));

  return { success: true, workspace: membership.workspace };
}
```

### Interactive States

**Workspace Cards:**
- **Default:** --muted border, transparent background
- **Hover:** --border color, --accent-light background (8% opacity)
- **Current:** Filled radio button, --accent-light background (12% opacity)
- **Loading:** Skeleton loader with pulse animation

**Invitation Cards:**
- **Default:** --accent-light background (6% opacity), --accent border
- **Hover:** --accent-light background (10% opacity)

### Typography

- Workspace name: 16px, font-weight-semibold, --foreground
- Role badge: 12px, font-weight-medium, all-caps
- Metadata: 14px, --muted-foreground
- Invitation sender: 13px, --muted-foreground

### Spacing

- Dropdown width: 420px (desktop), 100% (mobile)
- Card padding: 16px
- Card gap: 8px between cards
- Section gap: 24px between sections (Current / Your Workspaces / Pending)

### Accessibility

- Dropdown trigger: `<button aria-haspopup="true" aria-expanded="false">`
- Workspace cards: `<button role="radio" aria-checked="true">`
- Keyboard navigation: Arrow keys to navigate, Enter to select
- Screen reader: "Switch to Acme Corp, Admin role, 24 active tickets"
- Focus indicator: 2px outline, --ring color

### Mobile Optimization

```
┌─────────────────────────┐
│  [☰] CustomerDeskAI [@] │
├─────────────────────────┤
│                         │
│  Current Workspace      │
│                         │
│  ● Acme Corp            │
│  [Admin]                │
│  24 tickets · Today     │
│                         │
│  ───────────────────    │
│                         │
│  Your Workspaces        │
│                         │
│  ○ Tech Support Inc     │
│  [Agent]                │
│  12 tickets · 2d ago    │
│                         │
│  ○ Global Services      │
│  [Admin]                │
│  8 tickets · 1w ago     │
│                         │
│  ───────────────────    │
│                         │
│  Pending (2)            │
│                         │
│  📧 CustomerHelpDesk    │
│  Agent · 3d ago         │
│  [View →]               │
│                         │
│  📧 Enterprise Soln     │
│  Admin · 1d ago         │
│  [View →]               │
│                         │
│  ───────────────────    │
│                         │
│  [+ Create Workspace]   │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-screen overlay (z-index: 1000)
- Condensed metadata (abbreviated timestamps)
- Stacked layout for role badges
- Larger touch targets (48px minimum height)

### Error States

**No Active Workspaces:**
```
┌──────────────────────────────────────┐
│  No Workspaces Available             │
│                                      │
│  You haven't joined any workspaces   │
│  yet. Accept an invitation or create │
│  a new workspace to get started.     │
│                                      │
│  [+ Create Workspace]                │
└──────────────────────────────────────┘
```

**Network Error During Switch:**
```
┌──────────────────────────────────────┐
│  ⚠ Unable to Switch Workspace        │
│                                      │
│  Connection error. Please check your │
│  internet connection and try again.  │
│                                      │
│  [Retry]  [Cancel]                   │
└──────────────────────────────────────┘
```

---

## Wireframe 12: Accept Workspace Invitation (US9.12)

**User Story:** As a user, I want to accept workspace invitations from my account settings so that I can join new organizations.

### Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│  Workspace Invitation                              [×]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  CustomerHelpDesk                                          │
│  Invited you to join as an Agent                           │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Invitation Details                                        │
│                                                            │
│  From:           john@chd.com (Workspace Admin)            │
│  Workspace:      CustomerHelpDesk                          │
│  Your Role:      Agent                                     │
│  Invited On:     January 10, 2025                          │
│  Expires:        January 24, 2025 (13 days left)           │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Role Permissions                                          │
│                                                            │
│  As an Agent, you will be able to:                         │
│  ✓ View and respond to tickets                             │
│  ✓ Create new tickets                                      │
│  ✓ Add internal notes                                      │
│  ✓ Close tickets                                           │
│                                                            │
│  You will NOT be able to:                                  │
│  ✗ Manage workspace settings                               │
│  ✗ Invite or remove members                                │
│  ✗ View billing information                                │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Decline]                   [Accept Invitation]           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Modal Dimensions:**
- Width: 560px
- Max-height: 80vh (scrollable)
- Padding: 32px
- Background: --background, --border outline

### Invitation Metadata

**From:** john@chd.com (Workspace Admin)
- Shows inviter's email and role
- Helps users verify legitimate invitations

**Expires:** January 24, 2025 (13 days left)
- Invitations expire after 14 days
- Red text when <3 days remaining: `--destructive`

### Role Permissions Display

**Conditional Content:**
- **Agent Role:**
  - ✓ View/respond to tickets
  - ✓ Create tickets
  - ✓ Add internal notes
  - ✗ Manage settings
  - ✗ Invite members

- **Admin Role:**
  - ✓ Full workspace access
  - ✓ Manage all settings
  - ✓ Invite/remove members
  - ✓ View billing
  - ✓ Delete workspace

**Visual Design:**
- Green checkmark (✓): --success color
- Red X (✗): --muted-foreground color
- Left-aligned list with 8px spacing

### Accept Invitation Flow

**User Action:** Click [Accept Invitation]

**Steps:**
1. Show loading spinner on button
2. Call API: `POST /api/workspaces/invitations/{invitationId}/accept`
3. Backend creates workspace membership
4. Close modal
5. Show success toast: "Joined CustomerHelpDesk workspace"
6. Refresh workspace switcher dropdown (add new workspace)

**Backend Logic:**
```typescript
async function acceptInvitation(userId: string, invitationId: string) {
  const invitation = await db.query.workspaceInvitations.findFirst({
    where: eq(workspaceInvitations.id, invitationId),
  });

  // Validate invitation
  if (!invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.email !== user.email) {
    return { success: false, error: 'Invitation not for this email address' };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: 'Invitation expired' };
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: 'Invitation already processed' };
  }

  // Create workspace membership
  await db.insert(workspaceMembers).values({
    workspaceId: invitation.workspaceId,
    userId: userId,
    role: invitation.role,
    joinedAt: new Date(),
    status: 'active',
  });

  // Mark invitation as accepted
  await db.update(workspaceInvitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(workspaceInvitations.id, invitationId));

  // Send notification to workspace admins
  await notifyWorkspaceAdmins(invitation.workspaceId, {
    message: `${user.name} accepted workspace invitation`,
  });

  return { success: true };
}
```

### Decline Invitation Flow

**User Action:** Click [Decline]

**Steps:**
1. Show confirmation dialog:
   ```
   ┌──────────────────────────────────────┐
   │  Decline Invitation?                 │
   │                                      │
   │  You will not join CustomerHelpDesk  │
   │  workspace. You can request a new    │
   │  invitation from the workspace admin.│
   │                                      │
   │  [Cancel]  [Yes, Decline]            │
   └──────────────────────────────────────┘
   ```
2. Call API: `POST /api/workspaces/invitations/{invitationId}/decline`
3. Close modal
4. Show toast: "Invitation declined"
5. Remove invitation from pending list

**Backend Logic:**
```typescript
async function declineInvitation(invitationId: string) {
  await db.update(workspaceInvitations)
    .set({ status: 'declined', declinedAt: new Date() })
    .where(eq(workspaceInvitations.id, invitationId));

  return { success: true };
}
```

### Interactive States

**Buttons:**
- [Decline]: Secondary (transparent background, --border)
  - Hover: --accent-light background (8%)
- [Accept Invitation]: Primary (--primary background, white text)
  - Hover: --primary-dark background
  - Loading: Spinner + "Accepting..."

### Typography

- Modal title: 20px, font-weight-bold, --foreground
- Section headers: 14px, font-weight-semibold, --muted-foreground
- Metadata labels: 13px, --muted-foreground
- Metadata values: 14px, --foreground
- Permission items: 14px, --foreground

### Accessibility

- Modal: `role="dialog" aria-labelledby="invitation-title"`
- Close button: `aria-label="Close invitation"`
- Focus trap: Tab cycles through modal elements only
- Escape key: Closes modal

### Mobile Optimization

```
┌─────────────────────────┐
│  Invitation        [×]  │
├─────────────────────────┤
│                         │
│  CustomerHelpDesk       │
│  Invited you to join    │
│  as an Agent            │
│                         │
│  ─────────────────────  │
│                         │
│  From:                  │
│  john@chd.com           │
│  (Workspace Admin)      │
│                         │
│  Your Role: Agent       │
│                         │
│  Expires:               │
│  Jan 24, 2025           │
│  (13 days left)         │
│                         │
│  ─────────────────────  │
│                         │
│  As an Agent:           │
│                         │
│  ✓ View/respond         │
│  ✓ Create tickets       │
│  ✓ Add notes            │
│                         │
│  ✗ Manage settings      │
│  ✗ Invite members       │
│                         │
│  ─────────────────────  │
│                         │
│  [Decline]              │
│  [Accept Invitation]    │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-screen modal on small devices
- Condensed metadata (stacked labels/values)
- Full-width buttons
- Reduced padding (16px instead of 32px)

### Error States

**Expired Invitation:**
```
┌──────────────────────────────────────┐
│  ⚠ Invitation Expired                │
│                                      │
│  This invitation expired on          │
│  January 24, 2025.                   │
│                                      │
│  Contact john@chd.com to request a   │
│  new invitation.                     │
│                                      │
│  [Close]                             │
└──────────────────────────────────────┘
```

**Already Accepted:**
```
┌──────────────────────────────────────┐
│  ℹ Already a Member                  │
│                                      │
│  You're already a member of          │
│  CustomerHelpDesk workspace.         │
│                                      │
│  [Switch to Workspace]               │
└──────────────────────────────────────┘
```

---

## Wireframe 13: Leave Workspace (US9.13)

**User Story:** As a user, I want to leave workspaces I'm no longer part of so that I can manage my workspace list.

### Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│  Account Settings                                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  My Workspaces                                             │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Acme Corp                              [Admin]  │     │
│  │  24 active tickets · Last active today           │     │
│  │                                                  │     │
│  │  [Leave Workspace]                               │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Tech Support Inc                       [Agent]  │     │
│  │  12 active tickets · Last active 2 days ago      │     │
│  │                                                  │     │
│  │  [Leave Workspace]                               │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Leave Workspace Confirmation (Non-Owner)

**User Action:** Click [Leave Workspace] for "Tech Support Inc"

**Modal:**
```
┌────────────────────────────────────────────────────────────┐
│  Leave Workspace?                                   [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Are you sure you want to leave Tech Support Inc?          │
│                                                            │
│  ⚠ After leaving:                                          │
│                                                            │
│  • You will lose access to all tickets and conversations   │
│  • You will need a new invitation to rejoin                │
│  • Your activity history will be preserved                 │
│                                                            │
│  This action cannot be undone.                             │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Cancel]                            [Yes, Leave]          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Button States:**
- [Cancel]: Secondary (transparent)
- [Yes, Leave]: Destructive (--destructive background, white text)

### Leave Workspace Confirmation (Sole Owner)

**User Action:** Click [Leave Workspace] for "Acme Corp" (where user is the only Admin)

**Blocking Modal:**
```
┌────────────────────────────────────────────────────────────┐
│  Cannot Leave Workspace                             [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ⚠ You are the only admin of Acme Corp                     │
│                                                            │
│  Before leaving, you must either:                          │
│                                                            │
│  1. Transfer ownership                                     │
│     Promote another member to Admin                        │
│     → [Manage Members]                                     │
│                                                            │
│  2. Delete the workspace                                   │
│     Permanently delete Acme Corp and all data              │
│     → [Delete Workspace]                                   │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Close]                                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Link Behaviors:**
- **[Manage Members]:** Opens workspace members page in new tab
- **[Delete Workspace]:** Opens workspace deletion flow (different from account deletion)

### Leave Workspace Flow

**Backend Logic:**
```typescript
async function leaveWorkspace(userId: string, workspaceId: string) {
  // Check if user is sole admin
  const admins = await db.query.workspaceMembers.findMany({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.role, 'admin'),
      eq(workspaceMembers.status, 'active'),
    ),
  });

  const userMembership = admins.find(m => m.userId === userId);

  if (admins.length === 1 && userMembership) {
    return {
      success: false,
      error: 'Cannot leave workspace as sole admin',
      requiresAction: 'transfer_ownership_or_delete',
    };
  }

  // Remove user from workspace
  await db.update(workspaceMembers)
    .set({ status: 'left', leftAt: new Date() })
    .where(and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
    ));

  // If user's current workspace is the one they're leaving, switch to another
  const otherWorkspace = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.status, 'active'),
    ),
  });

  if (otherWorkspace) {
    await switchWorkspace(userId, otherWorkspace.workspaceId);
  }

  return { success: true };
}
```

### Post-Leave Behavior

**After Leaving:**
1. Close modal
2. Show toast: "Left Tech Support Inc workspace"
3. If leaving current workspace:
   - Auto-switch to another active workspace
   - If no other workspaces, redirect to "Create Workspace" page
4. Remove workspace from switcher dropdown
5. Refresh workspace list in account settings

### Interactive States

**Leave Button:**
- Default: Destructive secondary (--destructive color, transparent)
- Hover: --destructive-light background (8%)
- Loading: Spinner + "Leaving..."

**Confirmation Modal Buttons:**
- [Cancel]: Secondary, auto-focused by default
- [Yes, Leave]: Destructive, requires explicit click

### Typography

- Modal title: 20px, font-weight-bold, --foreground
- Warning text: 14px, --muted-foreground
- Warning icon (⚠): 16px, --warning color
- Bullet points: 14px, --foreground

### Accessibility

- Modal: `role="alertdialog" aria-labelledby="leave-title"`
- Focus on [Cancel] button by default (safer option)
- Escape key: Closes modal (same as [Cancel])
- Warning icon: `aria-label="Warning"`

### Mobile Optimization

```
┌─────────────────────────┐
│  Leave Workspace?  [×]  │
├─────────────────────────┤
│                         │
│  Are you sure you want  │
│  to leave Tech Support  │
│  Inc?                   │
│                         │
│  ⚠ After leaving:       │
│                         │
│  • Lose access to all   │
│    tickets              │
│  • Need new invitation  │
│    to rejoin            │
│  • History preserved    │
│                         │
│  Cannot be undone.      │
│                         │
│  ─────────────────────  │
│                         │
│  [Cancel]               │
│  [Yes, Leave]           │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-screen modal
- Stacked buttons (full-width)
- Condensed warning text
- Larger touch targets

### Error States

**Network Error:**
```
┌──────────────────────────────────────┐
│  ⚠ Unable to Leave Workspace         │
│                                      │
│  Connection error. Please check your │
│  internet connection and try again.  │
│                                      │
│  [Retry]  [Cancel]                   │
└──────────────────────────────────────┘
```

**Already Left:**
```
┌──────────────────────────────────────┐
│  ℹ Already Left                      │
│                                      │
│  You are no longer a member of this  │
│  workspace.                          │
│                                      │
│  [Close]                             │
└──────────────────────────────────────┘
```

---

## Wireframe 14: Account Deletion (US9.2)

**User Story:** As a user, I want to delete my account permanently so that I can remove all my personal data if I stop using the service.

### Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│  Account Settings → Delete Account                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Danger Zone                                               │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  ⚠ Delete Your Account                           │     │
│  │                                                  │     │
│  │  Permanently delete your CustomerDeskAI account  │     │
│  │  and all associated data. This cannot be undone. │     │
│  │                                                  │     │
│  │  [Delete Account...]                             │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Card Styling:**
- Border: --destructive (red)
- Background: --destructive-light (2% opacity)
- Warning icon (⚠): --destructive color
- Button: Destructive secondary

### Delete Account Modal (Step 1: Warnings)

**User Action:** Click [Delete Account...]

**Modal:**
```
┌────────────────────────────────────────────────────────────┐
│  Delete Account                                     [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ⚠ This action is permanent and cannot be undone           │
│                                                            │
│  Before deleting your account, please review:              │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  What will be deleted:                                     │
│                                                            │
│  ✓ Your profile and personal information                   │
│  ✓ All tickets you created (24 tickets)                    │
│  ✓ All conversations and messages                          │
│  ✓ 2FA settings and backup codes                           │
│  ✓ Linked social accounts (Google, GitHub)                 │
│  ✓ Session history and activity logs                       │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Workspace Ownership Issues:                               │
│                                                            │
│  ⚠ You are the only admin of 1 workspace:                  │
│                                                            │
│  • Acme Corp (24 active tickets)                           │
│    → Transfer ownership or delete workspace first          │
│    [Manage Acme Corp →]                                    │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Cancel]                            [Continue Deletion]   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Workspace Ownership Blocking:**
- If user is sole admin of ANY workspace, show warning section
- **[Continue Deletion]** button is DISABLED until ownership transferred
- **[Manage Acme Corp →]** opens workspace management page

### Delete Account Modal (Step 2: Confirmation)

**User Action:** Click [Continue Deletion] (only enabled if no workspace ownership issues)

**Modal:**
```
┌────────────────────────────────────────────────────────────┐
│  Confirm Account Deletion                           [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  To confirm, please:                                       │
│                                                            │
│  1. Type DELETE in the box below                           │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ DELETE                                             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  2. Enter your password                                    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ••••••••••••                                       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  After deletion:                                           │
│                                                            │
│  • You have 30 days to cancel and recover your account     │
│  • Log in within 30 days to restore your account           │
│  • After 30 days, all data is permanently deleted          │
│  • Your email address will be available for new signups    │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Cancel]                      [Delete My Account]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
1. **Confirmation text:** Must type exactly "DELETE" (case-sensitive)
2. **Password:** Must be correct password
3. **[Delete My Account]** button disabled until both validations pass

**Input Validation Feedback:**
- Confirmation text:
  - ❌ "delete" → Error: "Must type DELETE in all caps"
  - ✓ "DELETE" → Success indicator (green checkmark)
- Password:
  - ❌ Wrong password → Error: "Incorrect password"
  - ✓ Correct password → Success indicator

### Delete Account Flow

**Backend Logic:**
```typescript
async function deleteAccount(userId: string, confirmationText: string, password: string) {
  // Step 1: Verify password
  const user = await auth.verifyPassword(userId, password);
  if (!user) {
    return { success: false, error: 'Incorrect password' };
  }

  // Step 2: Verify confirmation text
  if (confirmationText !== 'DELETE') {
    return { success: false, error: 'Confirmation text must be exactly "DELETE"' };
  }

  // Step 3: Check workspace ownership
  const ownedWorkspaces = await db.query.workspaceMembers.findMany({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.role, 'admin'),
      eq(workspaceMembers.status, 'active'),
    ),
  });

  // Count admins for each workspace
  for (const membership of ownedWorkspaces) {
    const adminCount = await db.query.workspaceMembers.count({
      where: and(
        eq(workspaceMembers.workspaceId, membership.workspaceId),
        eq(workspaceMembers.role, 'admin'),
        eq(workspaceMembers.status, 'active'),
      ),
    });

    if (adminCount === 1) {
      return {
        success: false,
        error: 'Cannot delete account while sole admin of workspaces',
        blockingWorkspaces: [membership.workspaceId],
      };
    }
  }

  // Step 4: Soft delete account (30-day grace period)
  await db.update(users)
    .set({
      deletedAt: new Date(),
      deletionScheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      accountStatus: 'pending_deletion',
    })
    .where(eq(users.id, userId));

  // Step 5: Revoke all sessions
  await db.update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.userId, userId));

  // Step 6: Send confirmation email
  await sendEmail({
    to: user.email,
    subject: 'Account Deletion Scheduled',
    template: 'account-deletion-scheduled',
    data: {
      userName: user.name,
      cancellationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { success: true, gracePeriodEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
}
```

### Post-Deletion Screen

**After Clicking [Delete My Account]:**

```
┌────────────────────────────────────────────────────────────┐
│  Account Deletion Scheduled                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Your account has been scheduled for deletion.             │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  What happens next:                                        │
│                                                            │
│  • You will be signed out immediately                      │
│  • Your account is now inactive                            │
│  • All data will be permanently deleted on Feb 27, 2025    │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Changed your mind?                                        │
│                                                            │
│  You have 30 days to cancel deletion. Simply sign in       │
│  to restore your account before Feb 27, 2025.              │
│                                                            │
│  We've sent a confirmation email to:                       │
│  sarah.martinez@acme.com                                   │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Return to Homepage]                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Behavior:**
- User is immediately signed out
- Session cookies cleared
- Redirect to public homepage after 5 seconds (or click [Return to Homepage])

### Account Recovery Flow

**User Action:** Sign in during 30-day grace period

**Modal:**
```
┌────────────────────────────────────────────────────────────┐
│  Restore Your Account?                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Your account is scheduled for deletion on Feb 27, 2025.   │
│                                                            │
│  Would you like to cancel deletion and restore your        │
│  account?                                                  │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  If you restore:                                           │
│                                                            │
│  ✓ Your account will be fully reactivated                  │
│  ✓ All data will be preserved                              │
│  ✓ You can continue using CustomerDeskAI normally          │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  [Keep Deletion Scheduled]    [Restore My Account]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Backend Logic for Restoration:**
```typescript
async function restoreAccount(userId: string) {
  await db.update(users)
    .set({
      deletedAt: null,
      deletionScheduledFor: null,
      accountStatus: 'active',
    })
    .where(eq(users.id, userId));

  // Send confirmation email
  await sendEmail({
    to: user.email,
    subject: 'Account Restored',
    template: 'account-restored',
    data: { userName: user.name },
  });

  return { success: true };
}
```

### Interactive States

**Buttons:**
- [Delete Account...]: Destructive secondary
  - Default: --destructive color, transparent background
  - Hover: --destructive-light background (8%)
- [Delete My Account]: Destructive primary
  - Default: --destructive background, white text
  - Disabled: 50% opacity, cursor-not-allowed
  - Loading: Spinner + "Deleting..."

**Input Fields:**
- Confirmation text: Monospace font, centered text
- Password: Standard password input with visibility toggle

### Typography

- Modal title: 20px, font-weight-bold, --foreground
- Warning text: 14px, --destructive color
- Body text: 14px, --foreground
- Grace period info: 14px, --muted-foreground
- Email address: 14px, monospace, --accent color

### Accessibility

- Modal: `role="alertdialog" aria-labelledby="delete-title"`
- Warning icon: `aria-label="Danger: Permanent action"`
- Confirmation input: `aria-label="Type DELETE to confirm"`
- Password input: `aria-label="Enter password to confirm deletion"`
- Focus trap: Tab cycles through modal elements

### Mobile Optimization

```
┌─────────────────────────┐
│  Delete Account    [×]  │
├─────────────────────────┤
│                         │
│  ⚠ Permanent action     │
│  Cannot be undone       │
│                         │
│  ───────────────────    │
│                         │
│  Will be deleted:       │
│                         │
│  ✓ Profile data         │
│  ✓ 24 tickets           │
│  ✓ Conversations        │
│  ✓ 2FA settings         │
│  ✓ Linked accounts      │
│                         │
│  ───────────────────    │
│                         │
│  ⚠ Workspace Issues:    │
│                         │
│  • Acme Corp            │
│    (only admin)         │
│    Transfer first       │
│    [Manage →]           │
│                         │
│  ───────────────────    │
│                         │
│  [Cancel]               │
│  [Continue]             │
│                         │
└─────────────────────────┘
```

**Mobile Step 2:**
```
┌─────────────────────────┐
│  Confirm Deletion  [×]  │
├─────────────────────────┤
│                         │
│  1. Type DELETE         │
│                         │
│  ┌───────────────────┐  │
│  │ DELETE            │  │
│  └───────────────────┘  │
│                         │
│  2. Enter password      │
│                         │
│  ┌───────────────────┐  │
│  │ ••••••••••        │  │
│  └───────────────────┘  │
│                         │
│  ───────────────────    │
│                         │
│  After deletion:        │
│                         │
│  • 30-day recovery      │
│  • Sign in to restore   │
│  • Permanent after 30d  │
│                         │
│  ───────────────────    │
│                         │
│  [Cancel]               │
│  [Delete Account]       │
│                         │
└─────────────────────────┘
```

**Mobile Adaptations:**
- Full-screen modals
- Stacked buttons (full-width)
- Condensed warning lists
- Larger input fields (minimum 48px height)

### Error States

**Wrong Password:**
```
Password input shows error:
┌────────────────────────────────────┐
│ ••••••••••                         │
│ ❌ Incorrect password              │
└────────────────────────────────────┘
```

**Wrong Confirmation Text:**
```
Confirmation input shows error:
┌────────────────────────────────────┐
│ delete                             │
│ ❌ Must type DELETE in all caps    │
└────────────────────────────────────┘
```

**Network Error During Deletion:**
```
┌──────────────────────────────────────┐
│  ⚠ Deletion Failed                   │
│                                      │
│  Unable to delete account. Please    │
│  check your connection and try again.│
│                                      │
│  [Retry]  [Cancel]                   │
└──────────────────────────────────────┘
```

---

## Interaction Specifications

This section documents comprehensive interaction patterns, keyboard shortcuts, form validation timing, and auto-save behavior for all Epic 9 wireframes.

### Keyboard Shortcuts

**Global Shortcuts (Available on all screens):**

| Shortcut | Action | Scope |
|----------|--------|-------|
| `⌘K` / `Ctrl+K` | Open workspace switcher | All screens |
| `Esc` | Close modal/dropdown | Active modal |
| `Tab` | Navigate forward | Form fields, buttons |
| `Shift+Tab` | Navigate backward | Form fields, buttons |
| `Enter` | Submit form / Activate primary button | Forms |
| `Space` | Toggle checkbox / Activate focused button | Checkboxes, buttons |

**Workspace Switcher Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate workspace list |
| `Enter` | Switch to selected workspace |
| `1-9` | Quick switch to workspace by number |
| `N` | Create new workspace |
| `Esc` | Close switcher |

**2FA TOTP Input Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `⌘V` / `Ctrl+V` | Paste 6-digit code (auto-advances) |
| `Backspace` | Delete and move to previous digit |
| `Tab` | Skip to "Trust this device" checkbox |
| `Enter` | Submit code |

**Session Management Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `⌘R` / `Ctrl+R` | Refresh session list |
| `⌘A` / `Ctrl+A` | Select all sessions (except current) |
| `Delete` | Sign out selected sessions |

### Form Validation Timing

**Real-Time Validation (Immediate Feedback):**
- Email format validation (on blur)
- Password strength indicator (on input)
- Confirmation text matching (on input for "DELETE" confirmation)
- TOTP code format (6-digit numeric)

**Debounced Validation (500ms delay):**
- Email availability check (new email address)
- Username availability check (profile management)

**Submit-Time Validation (On form submit):**
- Password correctness (current password field)
- 2FA code verification
- Backup code verification

**Validation Error Display:**
- Inline errors: Below input field, --destructive color
- Form-level errors: Toast notification, top-right corner
- Network errors: Modal dialog with retry option

### Auto-Save Behavior

**Profile Management:**
- **Auto-save:** Disabled (explicit [Save Changes] button required)
- **Draft Persistence:** localStorage for unsaved changes
- **Restore Draft:** "You have unsaved changes. Restore?" prompt on page load

**2FA Setup:**
- **No auto-save:** Multi-step flow requires explicit confirmation
- **State Persistence:** QR code and secret stored in session until setup complete

**Session Management:**
- **Auto-refresh:** Every 30 seconds (short polling)
- **No user action required:** Silent background updates

### Loading States

**Optimistic UI Patterns:**
- **Session sign-out:** Immediately remove from UI, revert on error
- **Workspace switch:** Show loading overlay, instant navigation on success
- **Profile update:** Disable form, show inline spinner on [Save Changes]

**Skeleton Loaders:**
- Workspace switcher: 3 skeleton cards while loading
- Session list: 5 skeleton rows while loading
- Profile form: Skeleton inputs while loading user data

**Loading Spinners:**
- Button loading: Inline spinner + "Loading..." text
- Modal loading: Centered spinner with overlay
- Page loading: Full-page spinner (rare, only on initial auth check)

### Focus Management

**Modal Focus Traps:**
- On open: Focus first interactive element (usually [Cancel] button)
- Tab cycles: Only within modal elements
- On close: Return focus to trigger element

**Form Focus Flow:**
- Auto-focus first input on page load (profile name, email change)
- Auto-advance: TOTP input digits, moving to next on single-digit entry
- Error focus: Move focus to first field with validation error

**Keyboard-Only Navigation:**
- All interactive elements reachable via `Tab`
- Visual focus indicators: 2px outline, --ring color
- Skip links: "Skip to main content" for screen readers

### Toast Notifications

**Toast Types:**

| Type | Color | Icon | Duration |
|------|-------|------|----------|
| Success | --success | ✓ | 4s |
| Error | --destructive | ✗ | 6s |
| Warning | --warning | ⚠ | 5s |
| Info | --accent | ℹ | 4s |

**Toast Positions:**
- Desktop: Top-right corner, 24px from edges
- Mobile: Bottom center, 16px from edges, full-width with 16px margins

**Toast Behavior:**
- Max visible toasts: 3 (oldest dismissed automatically)
- Dismissible: Click [×] or swipe right (mobile)
- Hover pause: Pause auto-dismiss timer on hover

**Common Toast Messages:**

```typescript
// Success
toast.success('Profile updated successfully');
toast.success('Switched to Acme Corp workspace');
toast.success('2FA enabled');

// Error
toast.error('Current password incorrect');
toast.error('Invalid 2FA code');
toast.error('Network error. Please try again.');

// Warning
toast.warning('Only 2 backup codes remaining');
toast.warning('Session expires in 5 minutes');

// Info
toast.info('Verification email sent to new@email.com');
toast.info('Account deletion scheduled for Feb 27, 2025');
```

### Animation Timing

**Micro-Interactions:**
- Button hover: 150ms ease-in-out
- Input focus: 200ms ease-in-out
- Dropdown open: 200ms ease-out
- Modal open: 250ms ease-out
- Toast slide-in: 300ms ease-out

**Page Transitions:**
- Workspace switch: 300ms fade + slide
- Navigation: 200ms fade

**Loading Spinners:**
- Rotation: 1s linear infinite
- Pulse (skeleton): 1.5s ease-in-out infinite

### Error Recovery Patterns

**Network Errors:**
1. Show error toast: "Connection error. Check your internet."
2. Provide [Retry] button in toast
3. Auto-retry after 5 seconds (max 3 attempts)
4. If all retries fail, show modal with manual retry option

**Validation Errors:**
1. Show inline error below input (immediate)
2. Disable submit button until error resolved
3. Focus first error field
4. Allow user to fix and resubmit instantly

**Session Expiration:**
1. Detect expired session on API call
2. Show modal: "Your session expired. Please sign in again."
3. Preserve form state in localStorage
4. Redirect to sign-in page
5. After re-auth, redirect back with form state restored

### Responsive Breakpoints

**Desktop:** ≥1024px
- Full sidebar navigation
- Two-column layouts (settings + content)
- Inline error messages
- Hover states enabled

**Tablet:** 768px - 1023px
- Collapsible sidebar
- Single-column layouts
- Inline error messages
- Touch-optimized buttons (min 44px height)

**Mobile:** <768px
- Bottom navigation bar
- Full-screen modals
- Stacked layouts
- Touch targets min 48px height
- Swipe gestures enabled

---

## Technical Implementation Notes

This section provides complete database schema, API routes, authentication flows, and session management architecture for Epic 9.

### Database Schema

**Table: users**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,

  name TEXT NOT NULL,
  avatar_url TEXT,

  password_hash TEXT, -- bcrypt hash

  -- OAuth provider IDs
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  google_linked_at TIMESTAMP,
  github_linked_at TIMESTAMP,

  -- 2FA fields
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT, -- Encrypted TOTP secret (AES-256)
  two_factor_backup_codes JSONB, -- Array of hashed backup codes
  two_factor_enabled_at TIMESTAMP,
  two_factor_disabled_at TIMESTAMP,

  -- Account status
  account_status TEXT DEFAULT 'active', -- active | pending_deletion | deleted
  deleted_at TIMESTAMP,
  deletion_scheduled_for TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_account_status ON users(account_status);
```

**Table: sessions**

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token TEXT UNIQUE NOT NULL, -- Session token (stored in HTTP-only cookie)

  -- Device information
  user_agent TEXT,
  device_name TEXT, -- Parsed from user-agent
  device_type TEXT, -- desktop | mobile | tablet
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,

  -- Location information
  ip_address INET,
  country TEXT,
  city TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),

  -- Session lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,

  -- 2FA trust
  trusted_device_token TEXT UNIQUE,
  trusted_device_expires_at TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_trusted_device ON sessions(trusted_device_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Table: email_verification_tokens**

```sql
CREATE TABLE email_verification_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  new_email TEXT NOT NULL, -- Pending email address

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 24 hours
  used_at TIMESTAMP
);

CREATE INDEX idx_email_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_tokens_expires_at ON email_verification_tokens(expires_at);
```

**Table: workspace_invitations**

```sql
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  role TEXT NOT NULL, -- admin | agent | viewer

  invited_by UUID NOT NULL REFERENCES users(id),

  status TEXT DEFAULT 'pending', -- pending | accepted | declined | expired

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 14 days
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP
);

CREATE INDEX idx_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_invitations_status ON workspace_invitations(status);
```

**Table: workspace_members**

```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role TEXT NOT NULL, -- admin | agent | viewer

  status TEXT DEFAULT 'active', -- active | left | removed

  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  removed_at TIMESTAMP,

  last_active_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);
CREATE INDEX idx_members_status ON workspace_members(status);
```

### API Routes

**Profile Management:**

```typescript
// GET /api/user/profile
// Get current user profile
{
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

// PATCH /api/user/profile
// Update profile (name, avatar)
{
  name?: string;
  avatarUrl?: string;
}

// POST /api/user/email/change
// Initiate email change (sends verification email)
{
  newEmail: string;
}

// POST /api/user/email/verify
// Verify new email with token
{
  token: string;
}
```

**Password Management:**

```typescript
// POST /api/user/password/change
// Change password (requires current password)
{
  currentPassword: string;
  newPassword: string;
}
```

**Session Management:**

```typescript
// GET /api/user/sessions
// List all active sessions
[
  {
    id: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    location: string;
    ipAddress: string;
    lastActive: string; // ISO timestamp
    current: boolean;
  }
]

// DELETE /api/user/sessions/:sessionId
// Sign out specific session
{
  sessionId: string;
}

// DELETE /api/user/sessions/all
// Sign out all sessions except current
{
  excludeCurrent: true;
}
```

**2FA Management:**

```typescript
// POST /api/user/2fa/setup
// Generate TOTP secret and QR code
{
  secret: string;
  qrCodeUrl: string; // Data URL
}

// POST /api/user/2fa/enable
// Enable 2FA (verify TOTP code)
{
  totpCode: string;
}
// Returns backup codes:
{
  backupCodes: string[]; // 10 codes
}

// POST /api/user/2fa/verify
// Verify 2FA on login
{
  userId: string;
  totpCode?: string;
  backupCode?: string;
  trustDevice?: boolean;
}

// POST /api/user/2fa/disable
// Disable 2FA (requires password + TOTP)
{
  password: string;
  totpCode: string;
}

// POST /api/user/2fa/backup-codes/regenerate
// Generate new backup codes
{
  password: string; // Confirmation
}
```

**OAuth Management:**

```typescript
// GET /api/auth/google/initiate
// Redirect to Google OAuth consent

// GET /api/auth/google/callback
// Handle Google OAuth callback
{
  code: string; // Authorization code
}

// DELETE /api/user/oauth/google/unlink
// Unlink Google account

// DELETE /api/user/oauth/github/unlink
// Unlink GitHub account
```

**Workspace Management:**

```typescript
// GET /api/workspaces
// List user's workspaces
[
  {
    id: string;
    name: string;
    role: 'admin' | 'agent' | 'viewer';
    activeTickets: number;
    lastActiveAt: string;
  }
]

// POST /api/workspaces/switch
// Switch active workspace
{
  workspaceId: string;
}

// GET /api/workspaces/invitations
// List pending invitations
[
  {
    id: string;
    workspaceName: string;
    invitedBy: string;
    role: string;
    expiresAt: string;
  }
]

// POST /api/workspaces/invitations/:id/accept
// Accept workspace invitation
{
  invitationId: string;
}

// POST /api/workspaces/invitations/:id/decline
// Decline workspace invitation
{
  invitationId: string;
}

// POST /api/workspaces/:id/leave
// Leave workspace
{
  workspaceId: string;
}
```

**Account Deletion:**

```typescript
// POST /api/user/delete
// Schedule account deletion (30-day grace period)
{
  confirmationText: string; // Must be "DELETE"
  password: string;
}

// POST /api/user/restore
// Cancel deletion and restore account
// (Only available during grace period)
```

### Authentication Flows

**Password-Based Sign-In:**

```
1. User submits email + password
2. Backend verifies credentials
3. If 2FA enabled:
   a. Check trusted device cookie
   b. If trusted: Create session, skip 2FA
   c. If not trusted: Redirect to 2FA verification
4. If 2FA disabled:
   a. Create session immediately
5. Set HTTP-only session cookie
6. Redirect to dashboard
```

**2FA Verification Flow:**

```
1. User enters 6-digit TOTP code
2. Backend verifies code against secret
3. If valid:
   a. Create authenticated session
   b. If "Trust device" checked:
      - Generate device token
      - Set encrypted cookie (30-day expiry)
   c. Redirect to dashboard
4. If invalid:
   a. Increment failed attempt counter
   b. If >5 attempts: Lock account for 15 minutes
   c. Show error message
```

**OAuth Sign-In Flow:**

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent page
3. User authorizes
4. Google redirects to /api/auth/google/callback?code=xxx
5. Backend exchanges code for access token
6. Fetch Google user profile
7. Check if google_id exists in database:
   a. If yes: Sign in existing user
   b. If no: Create new user account
8. Create session
9. Set HTTP-only cookie
10. Redirect to dashboard
```

**Session Refresh Flow:**

```
1. Frontend: setInterval every 30 seconds
2. Call: POST /api/auth/refresh
3. Backend:
   a. Verify current session token
   b. Update last_active_at timestamp
   c. Extend expires_at by 30 days
4. Return: { success: true }
5. Frontend: Silent (no UI update needed)
```

### Session Management Architecture

**Session Storage:**
- **Cookie Name:** `session_token`
- **Cookie Attributes:**
  - `HttpOnly`: true (prevents XSS access)
  - `Secure`: true (HTTPS only)
  - `SameSite`: "Lax" (CSRF protection)
  - `Max-Age`: 2592000 (30 days)
  - `Path`: "/"

**Session Expiration Logic:**

```typescript
// Default: 30 days
const DEFAULT_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

// "Remember me": 90 days
const REMEMBER_ME_DURATION = 90 * 24 * 60 * 60 * 1000;

function createSession(userId: string, rememberMe: boolean = false) {
  const duration = rememberMe ? REMEMBER_ME_DURATION : DEFAULT_SESSION_DURATION;

  const session = {
    userId,
    token: generateSecureToken(), // 32-byte random string
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + duration),
    lastActiveAt: new Date(),
  };

  await db.insert(sessions).values(session);

  return session;
}
```

**Session Cleanup (Cron Job):**

```typescript
// Runs daily at 2 AM UTC
async function cleanupExpiredSessions() {
  await db.delete(sessions)
    .where(lt(sessions.expiresAt, new Date()));
}
```

**Trusted Device Storage:**

```typescript
// Cookie Name: trusted_device
// Cookie Attributes: Same as session_token
// Expiry: 30 days

function generateTrustedDeviceToken(userId: string, sessionId: string) {
  const payload = {
    userId,
    sessionId,
    createdAt: Date.now(),
  };

  // Encrypt with AES-256
  const encrypted = encrypt(JSON.stringify(payload), SECRET_KEY);

  return encrypted;
}

function verifyTrustedDevice(token: string, userId: string) {
  try {
    const decrypted = decrypt(token, SECRET_KEY);
    const payload = JSON.parse(decrypted);

    // Verify userId matches
    if (payload.userId !== userId) return false;

    // Verify token age (<30 days)
    const age = Date.now() - payload.createdAt;
    if (age > 30 * 24 * 60 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}
```

### Security Considerations

**Rate Limiting:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/signin` | 5 attempts | 15 minutes |
| `/api/user/2fa/verify` | 5 attempts | 15 minutes |
| `/api/user/password/change` | 3 attempts | 1 hour |
| `/api/user/email/change` | 3 attempts | 1 hour |

**Password Requirements:**
- Minimum length: 8 characters
- Must include: uppercase, lowercase, number, special character
- Cannot be common password (check against top 10k list)
- Cannot match email address

**TOTP Configuration:**
- Algorithm: SHA-1
- Period: 30 seconds
- Digits: 6
- Tolerance: ±1 period (allow 1 previous/next code)

**Backup Code Format:**
- Length: 8 digits
- Format: `XXXX-XXXX` (hyphen for readability)
- Storage: bcrypt hashed with cost factor 10

**Encryption:**
- TOTP secrets: AES-256-GCM encryption
- Trusted device tokens: AES-256-GCM encryption
- Encryption keys: Stored in environment variables, rotated quarterly

---

## Document Complete

This wireframe specification document covers all 14 wireframes for **Epic 9: User Account Management & Security**, providing comprehensive visual layouts, interaction patterns, technical implementations, and design specifications.

### Coverage Summary

**Wireframes:**
1. ✓ Account Settings Overview
2. ✓ Profile Management
3. ✓ Email Change Verification
4. ✓ Security Settings Dashboard
5. ✓ Password Change
6. ✓ Session Management
7. ✓ 2FA Setup Flow
8. ✓ 2FA Verification on Login
9. ✓ 2FA Disable Flow
10. ✓ Linked Accounts Management
11. ✓ Workspace Switcher
12. ✓ Accept Workspace Invitation
13. ✓ Leave Workspace
14. ✓ Account Deletion

**Additional Sections:**
- ✓ Interaction Specifications (keyboard shortcuts, validation, auto-save)
- ✓ Technical Implementation Notes (database schema, API routes, auth flows)

**User Stories Addressed:**
- ✓ US9.1: Profile Management
- ✓ US9.2: Account Deletion
- ✓ US9.3: Password Change
- ✓ US9.4: Session Management
- ✓ US9.5: Sign Out All Devices
- ✓ US9.6: Linked Accounts (OAuth)
- ✓ US9.7: 2FA Setup
- ✓ US9.8: 2FA Verification
- ✓ US9.9: 2FA Backup Codes
- ✓ US9.10: 2FA Disable
- ✓ US9.11: Workspace Switcher
- ✓ US9.12: Accept Workspace Invitation
- ✓ US9.13: Leave Workspace
- ✓ US9.14: Security Dashboard (covered in Wireframe 4)
- ✓ US9.15: Account Security Status (covered in Wireframe 4)

### Implementation Readiness

This document provides all information needed for development teams to implement Epic 9:

**For Frontend Developers:**
- Complete visual layouts (desktop + mobile)
- Interactive states and animations
- Keyboard shortcuts and accessibility requirements
- Error states and loading patterns

**For Backend Developers:**
- Database schema with indexes
- API route specifications
- Authentication flow logic
- Security requirements (rate limiting, encryption)

**For Product Managers:**
- User journey coverage
- Edge case handling
- Error recovery patterns
- Grace periods and safety mechanisms

**For QA Engineers:**
- Validation rules
- Error scenarios
- Multi-step flow testing
- Cross-browser/device requirements