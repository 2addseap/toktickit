# Lab 2 Zen Green UI Specification and Visual Design System

## 1. Design Philosophy & Zen Green Theme Tokens

The **Zen Green Design System** provides a calm, professional, accessible, and responsive visual language for all TokTickIT Requester-facing screens. All components must adhere strictly to these defined design tokens.

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
| `--color-error-bg` | `#FDF2F2` | Error alert banners and invalid attachment drop zones. |
| `--color-warning` | `#B78103` | Medium/High priority badges, quota limit alerts. |
| `--color-warning-bg` | `#FEF9E7` | Warning notification banners. |
| `--color-success` | `#137333` | Success banners, resolved badges, checkmark icons. |

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
- **Label Placement:** Labels always sit directly above their respective input control (`margin-bottom: 4px`).
- **Required Fields:** Marked with a red asterisk `<span className="text-danger">*</span>`. The asterisk serves as an indicator and does not replace field validation text.
- **Input Dimensions:** Standard single-line inputs and select dropdowns use a fixed height of $40\text{px}$ with $8\text{px}$ internal horizontal padding and a $6\text{px}$ border radius.
- **Multiline Inputs:** `Description` textarea is minimum $120\text{px}$ height, vertically resizable only.
- **Editable vs. Read-Only:**
  - *Editable:* White background (`#FFFFFF`), subtle border (`#CED4DA`), distinct dark text.
  - *Read-Only / Disabled:* Shaded background (`#EDF2EE`), neutral border (`#D5DCD7`), dark readable text (`#33413C`), cursor `not-allowed`.
- **Focus Indicator:** $2\text{px}$ solid `#0B7A46` outline with a subtle `#EAF6EF` box-shadow.
- **Validation Messages:** When invalid, the control receives a $1\text{px}$ `#B3261E` border, and the error message renders immediately below the input in dark red font (`0.8rem`).

### 2.2 Button Hierarchy
| Button Type | Background | Text Color | Hover / Focus | Use Case |
|---|---|---|---|---|
| **Primary** | `#006B3C` | `#FFFFFF` | `#00502D` | Form submit, Save, Continue, Create Ticket |
| **Secondary** | `#FFFFFF` | `#006B3C` | `#EAF6EF` | Filter reset, Cancel, Back navigation |
| **Destructive** | `#FFFFFF` | `#B3261E` | `#FDF2F2` (border `#B3261E`) | Soft-remove attachment action |
| **Disabled** | `#E0E6E3` | `#8C9B95` | No hover change, cursor `not-allowed` | Inactive submit, quota reached |
| **Busy State** | `#006B3C` | `#FFFFFF` | Spinner icon + "Processing…" text | While API request is in-flight |

### 2.3 Badges (Priority & Status)
- **Status Badges:**
  - `New`: Background `#E8F0FE`, Text `#1A73E8` (Blue)
  - `Open`: Background `#EAF6EF`, Text `#0B7A46` (Zen Green)
  - `In Progress`: Background `#FEF9E7`, Text `#B78103` (Amber)
  - `Resolved`: Background `#E6F4EA`, Text `#137333` (Success Green)
  - `Closed`: Background `#F1F3F4`, Text `#5F6368` (Muted Gray)
- **Priority Badges:**
  - `LOW`: Light Gray (`#F1F3F4`), Text `#3C4043`
  - `MEDIUM`: Light Yellow (`#FEF9E7`), Text `#996500`
  - `HIGH`: Light Orange (`#FCE8E6`), Text `#C5221F`
  - `URGENT`: Bold Crimson (`#B3261E`), Text `#FFFFFF`

---

## 3. Screen Layout Specifications

### 3.1 Application Shell & Navigation
- **Top Header Bar:** `#006B3C` background with TokTickIT brand logo/text in white.
- **Navigation Links:**
  - "My Tickets" (with count badge)
  - "Create Ticket" (with `+` icon)
  - Active navigation item has a bottom green highlight bar (`#0B7A46`, $3\text{px}$) and bold white text.
- **Requester Identity Pill (Top Right):**
  - Displays user avatar/icon, active Requester Name, and "Switch" button.
  - Clicking "Switch" opens the Development Requester selection modal.

---

### 3.2 Development Requester Selection Screen
- **Container:** Centered card, max-width $540\text{px}$ on `#F5F7F6` background.
- **Header:** TokTickIT branding with a prominent green avatar icon.
- **Notice Banner:** Amber/Blue callout box stating: *"Development Mode: Select a Requester profile to simulate user context. Authentication will be introduced in Lab 3."*
- **Controls:**
  - Dropdown listing all active requesters formatted as `[Name] - [Department] ([Email])`.
  - Primary button: **"Continue to TokTickIT →"** (disabled until selection made).
- **States:**
  - *Loading:* Skeleton loader / spinner while fetching `/api/requesters`.
  - *Empty State:* Warning card if no active requesters are found.
  - *API Error:* Red alert with "Retry" button.

---

### 3.3 Create Ticket Screen
- **Container:** Two-column card layout on desktop, max-width $960\text{px}$.
- **Top Metadata Section (Read-Only):**
  - Ticket Number: *"Generated automatically upon submission"*
  - Ticket Date: Current date/time (formatted `YYYY-MM-DD HH:mm`)
  - Requester Name: Active requester from context (read-only)
- **Classification Section:**
  - Category Select (Dropdown from `/api/categories` - Required)
  - Related System Select (Dropdown from `/api/related-systems` - Required)
  - Requested Priority (Pill selector or Dropdown: Low, Medium, High, Urgent - Default Medium)
- **Problem Details Section:**
  - Summary: Single line input, max 100 chars, character counter indicator.
  - Description: Multiline textarea, min 10 chars, max 2000 chars.
- **Attachments Dropzone:**
  - Drag-and-drop box with "Browse Files" button.
  - Supported format indicator: `JPG, PNG, WEBP, PDF up to 5MB (Max 5 files)`.
  - List of selected file pills with name, size in KB/MB, and remove `✕` button.
- **Actions:**
  - Primary: "Submit Ticket" (shows spinner when busy).
  - Secondary: "Cancel" (returns to My Tickets).
- **Success View:** Confirmation card showing the generated Ticket Number (`TKT-2026-XXXXXX`) with buttons "View in My Tickets" and "Create Another Ticket".

---

### 3.4 My Tickets Screen
- **Header Bar:** Title "My Tickets", subtitle showing ticket count, and top-right "Create Ticket" button.
- **Filter & Search Bar (Zen Green Card):**
  - Search Input: Real-time search by Ticket Number or Summary keyword.
  - Category Dropdown: "All Categories" + loaded categories.
  - Priority Dropdown: "All Priorities" + Low/Medium/High/Urgent.
  - Status Dropdown: "All Statuses" + New/Open/In Progress/Resolved/Closed.
  - Clear Filters Button: Resets all filters.
- **Desktop Table View ($\ge 992\text{px}$):**
  - Columns: `Ticket No.` (clickable link), `Created Date` (sortable), `Summary`, `Category`, `Priority` (badge), `Status` (badge), `Attachments` (icon + count).
  - Hover effect on rows (`#EAF6EF` highlight).
- **Mobile Card View ($< 768\text{px}$):**
  - Stacked cards with Ticket Number, Status/Priority badges at top, Summary, Category, and Date at bottom.
- **Pagination Footer:**
  - "Showing 1 to 10 of 42 tickets"
  - Page buttons: Previous, numbered page pills (`1`, `2`, `3`...), Next.
- **States:**
  - *Loading:* Table row skeletons.
  - *Empty State (No Tickets created yet):* Zen Green illustration + "You have not submitted any IT tickets yet" + "Create Ticket" button.
  - *No Results State (Filter/Search yield 0):* "No tickets match your search filters" + "Clear Filters" button.

---

### 3.5 Ticket Detail Screen (Read-Only + Attachment Lifecycle)
- **Breadcrumb:** `My Tickets > Ticket Details` with "← Back to My Tickets" button.
- **Header Summary Card:**
  - Prominent Ticket Number, Status Badge, Priority Badge, and Created Date.
  - Read-only fields: Requester Name, Category, Related System.
- **Description Card:** Full formatted problem description text in a white surface.
- **Attachment Section:**
  - Header showing active attachment counter (e.g., `Attachments (2/5)`).
  - "Add Attachment" button (disabled if active count $\ge 5$).
  - **Attachment Cards Grid:**
    - Active File: Icon (PDF/Image), Original Filename, File Size, Upload Date, "Download" button, "Remove" button.
    - Soft-Removed File: Grayed-out styling, Strikethrough filename, Badge `[Removed]`, removal timestamp, removal reason callout, download disabled.
- **Soft-Removal Modal Dialog:**
  - Prompts user: *"Are you sure you want to remove this attachment?"*
  - Mandatory Reason input: Textarea (min 3 chars) explaining why the file is being removed.
  - Buttons: "Confirm Removal" (Red) and "Cancel".

---

## 4. Responsive Breakpoint Rules

| Viewport | Screen Width | Layout Rules |
|---|---|---|
| **Desktop** | $\ge 992\text{px}$ | 2-column form grids; full data tables with sort headers; max-width $1140\text{px}$ centered container. |
| **Tablet** | $768\text{px} - 991\text{px}$ | 2-column classification; stacked attachment dropzone; condensed table columns. |
| **Mobile** | $< 768\text{px}$ | 1-column vertically stacked form controls; card-based ticket list; sticky mobile action bar; touch targets $\ge 44\text{px}$; no horizontal scroll. |

---

## 5. Visual Inspection Checklist & Screenshot Deliverables

For final submission evidence in Lab 2 (Part 9):
- [ ] **Color Fidelity:** Verify `#006B3C` on headers and `#EAF6EF` on selected states.
- [ ] **Read-Only Distinction:** System fields have distinct `#EDF2EE` background.
- [ ] **Validation Positioning:** Error text rendered directly under invalid inputs, never globally at top only.
- [ ] **Responsive Integrity:** No horizontal page overflow at $375\text{px}$ (mobile), $768\text{px}$ (tablet), and $1280\text{px}$ (desktop).
- [ ] **Screenshot Artifacts Directory:**
  - `artifacts/lab-02/screenshots/create-ticket/` (desktop, mobile, validation error, success)
  - `artifacts/lab-02/screenshots/my-tickets/` (desktop table, mobile cards, search/filter, requester switch)
  - `artifacts/lab-02/screenshots/ticket-detail/` (detail view, attachment add, soft-removal modal, removed state)
