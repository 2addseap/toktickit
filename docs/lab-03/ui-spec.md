# Lab 3 Zen Green UI Specification and Visual Design System

## 1. Design Philosophy & Zen Green Theme Tokens

The **Zen Green Design System** provides a calm, professional, accessible, and responsive visual language for TokTickIT. In Lab 3, this design language extends to accommodate multi-role operations across **Requester**, **IT Staff**, and **Administrator** interfaces.

### 1.1 Color Palette Tokens
| Token Name | Hex Value | Intended Usage |
|---|---|---|
| `--color-primary-green` | `#006B3C` | App header background, primary action buttons, strong brand emphasis. |
| `--color-secondary-green` | `#0B7A46` | Active navigation tabs, focus rings, interactive links, hover accents. |
| `--color-pale-green` | `#EAF6EF` | Selected rows, subtle card accents, success alert backgrounds. |
| `--color-page-bg` | `#F5F7F6` | Global page background (quiet, near-white neutral). |
| `--color-surface` | `#FFFFFF` | Card surfaces, modals, dropdown menus, table bodies. |
| `--color-border-subtle` | `#E0E6E3` | Card borders, table dividers, input borders. |
| `--color-text-main` | `#1C2826` | Primary body text and headings (dark charcoal-green, high contrast). |
| `--color-text-muted` | `#5C6B66` | Helper text, breadcrumbs, placeholder text, secondary timestamps. |
| `--color-readonly-bg` | `#EDF2EE` | Soft gray-green shading for read-only / system-generated fields. |
| `--color-error` | `#B3261E` | Validation messages, input error borders, destructive actions. |
| `--color-error-bg` | `#FDF2F2` | Error alert banners and rejected state cards. |
| `--color-warning` | `#B78103` | Medium/High priority badges, quota alerts, status indicators. |
| `--color-warning-bg` | `#FEF9E7` | Warning notification banners. |
| `--color-success` | `#137333` | Success banners, resolved badges, checkmark icons. |
| `--color-internal-note-bg` | `#FFF9E6` | Distinct soft-amber background for restricted Internal Notes. |
| `--color-internal-note-border`| `#F0C050` | Distinct golden border for restricted Internal Notes cards. |
| `--color-internal-note-badge` | `#8A5800` | Text/accent color for Internal Note tags. |

### 1.2 Typography & Spacing
- **Font Family:** Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Scale:**
  - `h1` (Page Title): `1.75rem` ($28\text{px}$), Bold ($700$)
  - `h2` (Section Header): `1.25rem` ($20\text{px}$), Semi-bold ($600$)
  - `h3` (Card Subheader): `1.0rem` ($16\text{px}$), Semi-bold ($600$)
  - `body-1` (Inputs & Labels): `0.875rem` ($14\text{px}$), Regular ($400$) / Medium ($500$)
  - `caption` (Helper & Metadata): `0.75rem` ($12\text{px}$), Regular ($400$)
- **Spacing Units:** $4\text{px}$ (xs), $8\text{px}$ (sm), $16\text{px}$ (md), $24\text{px}$ (lg), $32\text{px}$ (xl).

---

## 2. Component Design & Behavior Rules

### 2.1 Form Controls & Field States
- **Label Placement:** Top-aligned directly above input controls (`margin-bottom: 4px`).
- **Required Fields:** Marked with red asterisk `<span className="text-danger">*</span>`.
- **Input Heights:** Standard inputs and selects use $40\text{px}$ height, $8\text{px}$ horizontal padding, and $6\text{px}$ border radius.
- **Editable vs. Read-Only:**
  - *Editable:* Background `#FFFFFF`, border `#CED4DA`, crisp text `#1C2826`.
  - *Read-Only / Disabled:* Shaded background `#EDF2EE`, border `#D5DCD7`, text `#33413C`, cursor `not-allowed`.
- **Focus Indicator:** $2\text{px}$ solid `#0B7A46` outline with `#EAF6EF` glow.
- **Validation Messages:** Red border (`#B3261E`) with inline error text beneath (`0.8rem`).

### 2.2 Button Hierarchy
| Button Type | Background | Text Color | Hover / Focus | Use Case |
|---|---|---|---|---|
| **Primary** | `#006B3C` | `#FFFFFF` | `#00502D` | Login, Submit, Save User, Claim Ticket, Post Comment |
| **Secondary** | `#FFFFFF` | `#006B3C` | `#EAF6EF` | Cancel, Back navigation, Filter reset, Indicate Resolved |
| **Destructive** | `#FFFFFF` | `#B3261E` | `#FDF2F2` (border `#B3261E`) | Deactivate User, Soft-remove attachment |
| **Disabled** | `#E0E6E3` | `#8C9B95` | No change, cursor `not-allowed` | Inactive submit, self-deactivation prohibited |
| **Busy State** | `#006B3C` | `#FFFFFF` | Spinner + "Processing…" text | In-flight asynchronous mutations |

### 2.3 Badges (Role, Status & Priority)

#### Role Badges
- **Requester:** Background `#E8F0FE`, Text `#174EA6`, Border `#D2E3FC`
- **IT Staff:** Background `#EAF6EF`, Text `#0B7A46`, Border `#C6E7D2`
- **Administrator:** Background `#FEF3D6`, Text `#7C4A00`, Border `#FEE199`

#### Status Badges
- `New`: Background `#E8F0FE`, Text `#1A73E8`
- `Open`: Background `#EAF6EF`, Text `#0B7A46`
- `In Progress`: Background `#FEF9E7`, Text `#B78103`
- `Waiting for Requester`: Background `#F3E8FD`, Text `#7B1FA2`
- `Resolved`: Background `#E6F4EA`, Text `#137333`
- `Closed`: Background `#F1F3F4`, Text `#5F6368`
- `Reopened`: Background `#FCE8E6`, Text `#C5221F`
- `Cancelled`: Background `#E8EAED`, Text `#80868B`

#### Priority Badges
- `LOW`: Light Gray (`#F1F3F4`), Text `#3C4043`
- `MEDIUM`: Light Yellow (`#FEF9E7`), Text `#996500`
- `HIGH`: Light Orange (`#FCE8E6`), Text `#C5221F`
- `URGENT`: Bold Crimson (`#B3261E`), Text `#FFFFFF`

---

## 3. Screen Layout Specifications

### 3.1 Application Shell & Navigation
- **Header Bar:** Deep green (`#006B3C`) full-width bar.
- **Brand Identity:** Left-aligned TokTickIT brand mark with white icon and typography.
- **Dynamic Role-Based Navigation:**
  - **Requester:** `My Tickets` | `Create Ticket`
  - **IT Staff:** `Ticket Queue`
  - **Administrator:** `User Management` | `Ticket Queue`
  - Active tab indicated with bold text and bottom white/pale-green bar ($3\text{px}$).
- **User Profile & Session Controls (Top Right):**
  - Displays authenticated user's Name.
  - Role pill badge (e.g., `IT STAFF` or `ADMIN`).
  - **Sign Out** button (outline or text button with logout icon), executing immediate session teardown.

---

### 3.2 Screen 1: Login & Mandatory Password Change Screen

#### Mode A: Sign In
- **Container:** Centered card, max-width $440\text{px}$, centered vertically on page background (`#F5F7F6`).
- **Header:** TokTickIT logo, title "Sign in to TokTickIT", subtitle "Enter your KMUTT credentials to continue".
- **Fields:**
  - Email Address input (`type="email"`, autofocus, placeholder `user@kmutt.ac.th`).
  - Password input (`type="password"`, eye toggle icon to reveal/hide characters).
- **Feedback:**
  - Inline error alert box if credentials invalid or account inactive: *"Invalid email or password. Please try again."*
  - Primary button: *"Sign In"* with spinner during loading.

#### Mode B: First-Login Change Password
- **Trigger:** Rendered immediately if authenticated user has `mustChangePassword === true`.
- **Container:** Centered card, max-width $480\text{px}$.
- **Notice Alert:** Informational banner: *"You must change your initial password before accessing the system."*
- **Fields:**
  - Current (Temporary) Password (`type="password"`).
  - New Password (`type="password"`).
  - Confirm New Password (`type="password"`).
- **Password Complexity Checklist:**
  - Displays dynamic green checkmarks as requirements are met:
    - [x] At least 8 characters
    - [x] At least 1 uppercase & 1 lowercase letter
    - [x] At least 1 number or special character
    - [x] Must not match temporary password
- **Actions:** *"Save New Password"* primary button.

---

### 3.3 Screen 2: IT Staff Ticket Queue Screen
- **Layout:** Full-width container with responsive data grid.
- **Header Controls:**
  - Title: *"IT Staff Ticket Queue"* with total ticket counter badge.
  - Search Input: Real-time search across Ticket Number and Summary ($300\text{px}$ width).
  - Filters Bar:
    - Status Filter dropdown (All, New, Open, In Progress, Waiting for Requester, Resolved, Closed).
    - Priority Filter dropdown (All, Low, Medium, High, Urgent).
    - Assignment Toggle: Button chip for *"Unassigned Only"* or filter by assignee.
    - Category Filter dropdown.
- **Desktop Table View ($\ge 992\text{px}$):**
  - Columns: Ticket No. | Created Date | Summary | Category | Req. Priority | IT Priority | Status | Assigned To | Actions.
  - Sortable headers on Ticket No., Created Date, IT Priority, and Status.
  - Unassigned tickets show a muted gray pill *"Unassigned"* or quick *"Claim"* link.
- **Mobile Card View ($< 768\text{px}$):**
  - Stacked cards with Ticket No. and Status badge in header.
  - Summary in bold with Category and Priority badges.
  - Assignee indicator in footer with a full-width tap target to open details.
- **Pagination Footer:** Current page display, page size selector (10, 25, 50), and Prev/Next buttons.

---

### 3.4 Screen 3: IT Staff Ticket Detail Screen
- **Header:** Breadcrumb navigation `Ticket Queue > TKT-YYYY-NNNNNN` with *"← Back to Queue"* button.
- **Operational Management Strip (Top Card):**
  - **Ticket Status Selector:** Dropdown displaying only permitted next statuses per transition matrix, with *"Update Status"* button.
  - **IT Priority Selector:** Dropdown (Low, Medium, High, Urgent) with *"Update Priority"* button.
  - **Owner Assignment:** Displays current owner avatar/name; dropdown listing active IT Staff / Admins with *"Reassign"* and quick *"Claim for Myself"* button.
  - **Requester Resolution Banner:** If Requester indicated problem is resolved, display a prominent green callout:
    > 💡 **Requester indicated this issue is resolved.** Please verify with the requester and transition ticket status to Resolved or Closed.
- **Ticket Core Details Card:**
  - Read-only metadata: Category, Related System, Requester Name & Department, Created Date, Requested Priority.
  - Summary & Description blocks.
  - Attachments section (with download and soft-removal indicators).
- **Communication & Timeline Tabs:**
  - Tab 1: **Public Comments** (Visible to Requester and Staff).
    - Form to add new public comment (textarea + *"Post Public Comment"* button in primary green).
    - Timeline entries showing author name, role badge, timestamp, and message body.
  - Tab 2: **Internal Notes** (Staff and Admin ONLY).
    - Card styled with `--color-internal-note-bg` (`#FFF9E6`) and gold border (`#F0C050`).
    - Prominent warning badge: *"🔒 Internal Note — Visible only to IT Staff and Administrators"*.
    - Form to record new internal operational note (textarea + *"Add Internal Note"* button).
    - Internal note timeline items clearly bordered with amber accent.

---

### 3.5 Screen 4: Requester Ticket Detail Extensions
- **Preserved Lab 2 Features:** Ticket metadata, description, active attachments list, upload attachment modal, soft-removal modal with required reason.
- **New Lab 3 Additions:**
  - **Public Comments Timeline:** Displays all public comments exchanged with IT Staff, plus form to append new comments.
  - **"Problem Appears Resolved" Action:**
    - If ticket is active (`Open`, `In Progress`, `Waiting for Requester`) and `resolvedIndicated === false`:
      - Button: `[✓ Problem Appears Resolved]` (secondary green button).
      - Clicking opens confirmation dialog explaining: *"This notifies IT Staff that your issue is resolved so they can complete the ticket closure."*
    - Once submitted, shows green badge: `[✓ You indicated this issue appears resolved]`.

---

### 3.6 Screen 5: Administrator User Management Screen
- **Header:** Title *"User Management"* with total user count badge and `+ Add User` primary button.
- **Filter Bar:**
  - Search input: *"Search by name or email..."*
  - Role Filter: Dropdown `All Roles | Requester | IT Staff | Administrator`
- **Users Data Table:**
  - Columns: Name | Email | Role | Status (Active/Inactive) | Created Date | Actions.
  - Status Pills: Active (`#E6F4EA`, green) / Inactive (`#FDF2F2`, red).
  - Action Column: `[Edit]` button.
- **Create User Modal:**
  - Inputs: Full Name (`*`), Email (`*`), Role dropdown (`*`), Active checkbox (`default: true`).
  - Initial Password input (`*`) or auto-generate initial password option with checkbox *"User must change password on first login"* (checked and disabled).
  - Actions: `Cancel` and `Create User` (with loading spinner).
- **Edit User Modal:**
  - Inputs: Full Name (`*`), Email (`*`), Role dropdown (`*`), Active toggle switch.
  - **Safety Guardrail:** If editing current administrator account, the Active toggle is disabled with tooltip: *"You cannot deactivate your own account."*
  - **Safety Guardrail:** If editing the last active administrator in the system, deactivation and role demotion are prevented with explicit alert: *"System must have at least one active Administrator."*
  - **Reset Password Section:** Button `[Set New Initial Password]` which generates/inputs a temporary password and flags `mustChangePassword = true`.

---

## 4. Responsive Breakpoints & Visual Inspection Checklist

### 4.1 Breakpoint Standards
- **Desktop ($\ge 992\text{px}$):** Full multi-column data tables, multi-pane detail views, inline filters.
- **Tablet ($768\text{px} - 991\text{px}$):** Collapsible filters, compact table cells with ellipsis on long summaries.
- **Mobile ($< 768\text{px}$):** Stacked card view instead of tables, full-width modal dialogs, wrapped navigation with hamburger menu or tab scroll.

### 4.2 Visual Inspection Checklist
- [x] Consistent Zen Green token application across buttons, cards, and navigation.
- [x] Zero horizontal scrolling on 375px mobile viewport.
- [x] Strict visual partition between Public Comments (green accent) and Internal Notes (amber card).
- [x] Required inputs have red asterisk and field-level inline error styling.
- [x] Read-only inputs maintain shaded backgrounds and dark readable text.
- [x] Role badges cleanly distinguish Requester, IT Staff, and Administrator.
