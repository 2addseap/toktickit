# Lab 4 Zen Green UI Specification and Visual Design System

## 1. Design Philosophy & Zen Green Theme Tokens

The **Zen Green Design System** provides a calm, professional, accessible, and responsive interface for TokTickIT. In Lab 4, this system extends to support analytical dashboards, parent-child work logging (Actions Taken), and streamlined lifecycle transitions across **Requester**, **IT Staff**, and **Administrator** interfaces.

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
| `--color-warning-bg` | `#FEF9E7` | Warning notification banners, follow-up required highlight. |
| `--color-success` | `#137333` | Success banners, resolved badges, checkmark icons. |
| `--color-action-taken-bg` | `#F0FDF4` | Background for Actions Taken cards and timeline rows. |
| `--color-action-taken-border`| `#86EFAC` | Subtle green accent border for Actions Taken container. |

### 1.2 Typography & Spacing
- **Primary Typeface:** `Inter`, system-ui, -apple-system, sans-serif.
- **Scale:**
  - H1 Page Titles: $1.75\text{rem}$ ($28\text{px}$), font-weight: 700.
  - H2 Section Titles / Metric Numbers: $1.5\text{rem}$ ($24\text{px}$), font-weight: 700.
  - H3 Card Titles: $1.15\text{rem}$ ($18.4\text{px}$), font-weight: 600.
  - Body Text: $0.95\text{rem}$ ($15.2\text{px}$), line-height: 1.5.
  - Captions / Metadata: $0.8\text{rem}$ ($12.8\text{px}$), font-weight: 500.
- **Elevation & Shadows:**
  - Standard card: `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);`
  - Floating modal: `box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);`
  - Metric Card Hover: `box-shadow: 0 4px 12px rgba(0, 107, 60, 0.12); transform: translateY(-2px);`

---

## 2. Responsive Breakpoints & Layout Grid

| Breakpoint | Target Viewport | Layout Strategy |
|---|---|---|
| **Desktop** | $\ge 1200\text{px}$ (tested at $1280\text{px}$) | Multi-column grid (5 metric cards per row on staff dashboard; 4 on requester); 2-column layout on Ticket Detail. |
| **Tablet** | $768\text{px} - 1199\text{px}$ (tested at $768\text{px}$) | 2 or 3 metric cards per row; stacked tables with horizontal scroll containers; single-column detail layout. |
| **Mobile** | $< 768\text{px}$ (tested at $390\text{px}$) | Single column full width; metric cards stacked 2-by-2 or 1-per-row; tables convert to stacked cards; zero horizontal overflow. |

---

## 3. Screen Specifications

### 3.1 Screen 1: IT Staff Dashboard
- **Header:**
  - Welcome greeting: *"Welcome back, [Staff Name]!"* with subtitle *"Here's what's happening with your queue today."*
  - Top-right refresh button and current timestamp indicator.
- **KPI Metric Cards (5 cards in a responsive row):**
  1. **New:** Count of unaddressed new tickets (`badge-status-new`).
  2. **Open:** Count of triaged tickets awaiting active work.
  3. **In Progress:** Count of tickets actively being investigated.
  4. **Waiting for Requester:** Count of tickets awaiting customer reply.
  5. **My Assigned:** Count of tickets assigned directly to the authenticated staff member.
  - *Interactivity:* Clicking any metric card acts as a drill-down link, redirecting to the IT Staff Ticket Queue with that status/assignee filter pre-applied.
- **Operational List: Recent & Urgent Tickets:**
  - Displays up to 5 urgent or recently updated tickets.
  - Columns: Ticket Number, Summary, Status Badge, IT Priority Badge, Last Updated, and Quick Open Action.
  - Empty state: Clean card with leaf illustration: *"No urgent tickets requiring attention. All queues are running smoothly."*
- **Quick Actions Panel:**
  - Shortcut buttons: *➕ Create Ticket*, *🔍 Search Tickets*, *🎫 Open Full Queue*.

---

### 3.2 Screen 2: Requester Dashboard
- **Header:**
  - Welcome greeting: *"Welcome, [Requester Name]!"* with subtitle *"Here's the latest on your service requests."*
- **KPI Metric Cards (4 cards in a responsive row):**
  1. **My Open Tickets:** Total active open requests (`New` + `Open`).
  2. **In Progress:** Tickets currently undergoing technical work.
  3. **Waiting for Your Input:** Tickets in `Waiting for Requester` status with an amber alert indicator prompting action.
  4. **Recently Resolved:** Tickets resolved within the last 30 days.
  - *Interactivity:* Clicking any card redirects to My Tickets filtered by the corresponding criteria.
- **Requester Recent Tickets List:**
  - Displays up to 5 of the Requester's recently updated tickets.
  - Columns: Ticket Number, Summary, Status Badge, Date Created, and Open Ticket action.
  - Empty state: *"You have not submitted any service tickets yet."* with prominent *Create Ticket* button.
- **Quick Actions:**
  - Shortcut buttons: *➕ Create Ticket*, *📋 View All My Tickets*.

---

### 3.3 Screen 3: IT Staff Ticket Detail (Actions Taken Module)
- **Placement:** Positioned prominently below the Ticket Description and adjacent to/above the Comments/Notes section.
- **Header & Controls:**
  - Header: *"🛠️ Actions Taken"* with count badge (e.g. `2 actions recorded`).
  - Action trigger: *"➕ Add Action Taken"* button opening the Action Entry form.
- **Actions Taken Data Table / Timeline:**
  - **Date/Time:** Formatted timestamp (e.g., `Oct 30, 2026, 14:15`).
  - **Action Description:** Detailed summary of the work performed.
  - **Result:** Specific outcome of the intervention.
  - **Performed By:** Name and role badge of the staff member who conducted the action.
  - **Follow-Up Badge:** 
    - If `followUpRequired == true`: Amber warning badge `⚠️ Follow-up Needed` with hover/visible follow-up note text.
    - If `followUpRequired == false`: Subtle gray badge `No Follow-up`.
  - **Attachment Notes:** Italicized reference note (e.g. *"Log file: /var/log/nginx/error.log"*), or muted dash if empty.
  - **Actions:** *"✏️ Edit"* button opening edit mode for that specific line.
- **Add/Edit Action Taken Form:**
  - Fields:
    - Action Date/Time (defaults to current date-time picker).
    - Action Description (textarea, required, placeholder: *"Describe the diagnostic step, repair, or test performed..."*).
    - Result (textarea, required, placeholder: *"What was the technical outcome of this action?..."*).
    - Follow-Up Required (checkbox / toggle switch).
    - Follow-Up Note (textarea, dynamically marked required with red asterisk when toggle is active).
    - Attachment Notes (text input, optional, placeholder: *"Reference log file names, screenshot filenames, or cable labels"*).
  - Actions: *"Save Action"* (Zen primary button) and *"Cancel"* (Zen secondary button).

---

### 3.4 Screen 4: Requester Ticket Detail (Actions Taken Read-Only View)
- **Visibility:** When a Requester views their owned ticket, the *"🛠️ Actions Taken"* section is visible.
- **Behavior:**
  - Displays the full list of actions taken with Date/Time, Description, Result, Performer Name, and Follow-Up status.
  - **Strictly Omits:** The *"➕ Add Action Taken"* button and *"✏️ Edit"* buttons are completely hidden from the DOM.
  - Helps Requesters understand technical progress transparently without exposing operational mutation tools.

---

### 3.5 Screen 5: Ticket Lifecycle & Permitted Status Transitions
- **Operational Status Control:**
  - Located within the IT Staff Ticket Detail sidebar.
  - Current status displayed with high-contrast badge.
  - Transition dropdown **only renders permitted next states** according to the finite state machine:
    - From `New`: options are `Open`, `In Progress`, `Cancelled`.
    - From `Open`: options are `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`.
    - From `In Progress`: options are `Waiting for Requester`, `Resolved`, `Cancelled`.
    - From `Waiting for Requester`: options are `In Progress`, `Resolved`, `Cancelled`.
    - From `Resolved`: options are `Closed`, `Reopened`.
    - From `Closed`: option is `Reopened`.
    - From `Reopened`: options are `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`.
    - From `Cancelled`: Disabled control with label *"Cancelled (Terminal State)"*.
  - *"Update Status"* button with optimistic locking protection.
- **Requester Resolution Indication:**
  - Informational alert box in Requester view: *"Does your issue appear to be resolved?"*
  - Button: *"Mark as Resolved"* setting `resolvedIndicated = true`.
  - Displays green badge on Staff view: *"Requester indicated resolution on [date]"* to prompt staff formal closure.

---

## 4. Accessibility & UI Consistency Checklist

| Requirement | Specification |
|---|---|
| **Color Contrast** | All text against backgrounds complies with WCAG 2.1 AA ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text). |
| **Visible Focus** | All interactive controls feature high-visibility focus rings using `--color-secondary-green` (`box-shadow: 0 0 0 0.2rem rgba(11, 122, 70, 0.15)`). |
| **Validation Placement** | Inline error messages render directly beneath the invalid input with red border and helper icon. |
| **No Horizontal Scroll** | Entire layout wrapped in `overflow-x: hidden` with tables wrapped in `.table-responsive` to prevent page-level horizontal overflow on mobile ($390\text{px}$). |
| **Safe Error Banners** | Dismissible alert banners render on network or conflict errors, retaining form inputs without clearing user data. |
