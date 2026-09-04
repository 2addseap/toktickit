# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver a robust, responsive, and secure Requester Ticketing MVP using the Zen Green design system. This increment enables end-user Requesters to select a temporary Development Requester identity, submit IT support tickets with permitted attachments, receive a system-generated Ticket Number, browse and search their own tickets in a paginated list, view ticket details in read-only mode, and manage attachments with soft-removal rules.

---

## 2. Stakeholder Request Interpretation
The IT department requires a complete, self-service Requester experience before full authentication and IT staff workflows are introduced in later sprints. The system must allow users to create tickets with classification (Category, Related System, Priority), descriptions, and attachments (up to 5 active files, max 5 MB each). To simulate multi-user ownership before Lab 3, a Development Requester selector acts as the session identity. The system must strictly isolate requester data so that no requester can view, search, or alter another requester's tickets or attachments.

---

## 3. Scope

### Included in Lab 2:
- **Development Requester Context:** Simulated user selector for active seeded requesters; session state management; header identity display with a Change Requester action.
- **Ticket Creation (Create Mode):** Form with system-generated ticket metadata, Category and Related System dropdowns, Requested Priority selection, Summary, Description, and initial attachment uploads.
- **My Tickets (List View):** Requester-owned ticket listing, search across ticket number/summary, filter by Category/Priority/Status, column sorting, pagination controls, desktop table layout, and mobile card layout.
- **Ticket Detail (View Mode):** Read-only ticket overview, attachment section with upload modal/control, download of active files, and soft-removal of attachments with a required reason.
- **Zen Green UI Theme & Reusability:** Cohesive color palette, accessible form controls, input heights, button hierarchy, field-level validation messages, badges, and responsive layouts.
- **Quality & Automated Testing:** Unit tests, Supertest API tests, Vitest UI component tests, and Playwright E2E tests.

### Explicitly Excluded from Lab 2:
- Real authentication, login/logout, password hashing, JWT sessions, and RBAC security (deferred to Lab 3).
- IT Staff workflow (queues, claiming tickets, assigning ticket owners, changing IT Priority).
- Ticket collaboration features (Public Comments, Internal Notes, Actions Taken).
- Ticket lifecycle status changes beyond the initial `New` state (e.g., resolving, closing, reopening).
- Administrative functions (user CRUD, reference data management).

---

## 4. Functional Requirements

- **FR-01 (Requester Context):** The user must select an active Development Requester before accessing ticketing screens. The active requester name must be visible in the application shell with a "Change Requester" action.
- **FR-02 (Requester Reference Data):** The system must fetch active Categories and active Related Systems from PostgreSQL to populate selection controls.
- **FR-03 (Ticket Creation):** The system must validate and save a new Ticket associated with the currently selected Requester, starting in `New` status with a unique generated Ticket Number (`TKT-YYYY-NNNNNN`).
- **FR-04 (Initial Attachment Upload):** During ticket creation, the requester may attach up to 5 valid files (JPG, JPEG, PNG, WEBP, PDF; $\le 5\text{ MB}$ each).
- **FR-05 (My Tickets Retrieval):** The system must retrieve only the tickets owned by the current Requester, supporting keyword search on Ticket Number and Summary.
- **FR-06 (My Tickets Filtering & Sorting):** The list must support filtering by Category, Requested Priority, and Status, as well as sorting by Created Date, Ticket Number, Priority, or Last Updated.
- **FR-07 (My Tickets Pagination):** The list must support server-side pagination with configurable page size (default 10) and total count metadata.
- **FR-08 (Responsive Ticket Listing):** Desktop view ($\ge 992\text{px}$) renders an interactive data table; mobile view ($< 768\text{px}$) renders stacked ticket cards.
- **FR-09 (Ticket Detail View):** The system must render the full, read-only header and body information for an owned ticket.
- **FR-10 (Post-Creation Attachment Upload):** The requester may add new attachments to an existing owned ticket as long as active attachments do not exceed 5.
- **FR-11 (Attachment Download):** Active attachments can be downloaded via an authenticated/ownership-verified endpoint.
- **FR-12 (Attachment Soft Removal):** The owner may soft-remove an attachment by providing a mandatory removal reason. Soft-removed attachments remain visible as metadata but cannot be downloaded or previewed.
- **FR-13 (Ownership Isolation):** If a user attempts to view, download, or alter a ticket or attachment belonging to another requester, the system must return HTTP 403/404.

---

## 5. Business Rules (BR)

- **BR-01 (Ticket Number Uniqueness):** The official Ticket Number is generated by the backend in the format `TKT-YYYY-NNNNNN` (e.g., `TKT-2026-000001`). It is immutable and globally unique.
- **BR-02 (Initial Status):** Every newly created ticket begins with `Current Status = New`.
- **BR-03 (Testing Context Limitation):** The Development Requester selector is solely for multi-user simulation during development and is not secure authentication.
- **BR-04 (Requester Association):** Tickets and attachments must permanently record the `requesterId` of the creating requester.
- **BR-05 (Data Isolation):** A requester can only view, search, and manage tickets where `ticket.requesterId == currentRequesterId`.
- **BR-06 (Inactive Requester Exclusion):** Inactive Development Requesters (`isActive = false`) must not appear in the selector and cannot initiate requests.
- **BR-07 (Summary Validation):** Ticket Summary is required, trimmed of leading/trailing whitespace, and must be between 5 and 100 characters.
- **BR-08 (Description Validation):** Description is required, trimmed, and must be between 10 and 2000 characters.
- **BR-09 (Priority Defaults):** Requested Priority must be one of `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. Default is `MEDIUM`.
- **BR-10 (Attachment Allowed MIME Types):** Only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf` are accepted.
- **BR-11 (Attachment File Size Limit):** Maximum file size is 5 MB ($5,242,880\text{ bytes}$) per attachment.
- **BR-12 (Active Attachment Quota):** A ticket may have at most 5 active (`isRemoved = false`) attachments at any time.
- **BR-13 (Soft-Removal Rule):** Removal of an attachment must never delete the database record or physical file immediately. It sets `isRemoved = true`, records `removedAt = now()`, `removedBy = requesterName`, and requires a non-empty `removalReason` ($\ge 3$ chars).
- **BR-14 (Removed File Access):** Soft-removed attachments must display metadata and removal reason in UI but must return HTTP 410 Gone / 404 on download/preview endpoints.
- **BR-15 (Form Preservation on Error):** If ticket creation or attachment upload fails, entered form fields must be preserved on the frontend to prevent data loss.

---

## 6. UI Specification Summary
The interface adheres strictly to the **Zen Green Design Language** documented in `ui-spec.md`:
- **Color Hierarchy:** Primary Green (`#006B3C`), Secondary Green (`#0B7A46`), Pale Green (`#EAF6EF`), Page Background (`#F5F7F6`), Surface (`#FFFFFF`), Text (`#1C2826`), Error (`#B3261E`), Warning (`#B78103`).
- **Layouts & Breakpoints:** Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), Mobile ($< 768\text{px}$).
- **Application Shell:** Top navigation bar displaying TokTickIT brand, active tabs (My Tickets, Create Ticket), and active Requester badge with switch modal.
- **Form Standards:** Top-aligned labels, red asterisk (`*`) on required fields, 40px input height, field-level inline error text, and busy spinner on submit buttons.

---

## 7. Data Changes (Prisma Schema)

### Models & Schema Design
```prisma
model RequesterUser {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  department String?
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  tickets   Ticket[]

  @@map("requester_users")
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  createdAt DateTime  @default(now())
  tickets   Ticket[]

  @@map("categories")
}

model RelatedSystem {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  category  String?
  createdAt DateTime  @default(now())
  tickets   Ticket[]

  @@map("related_systems")
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  summary           String
  description       String
  requestedPriority String        @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  itPriority        String?       // Populated by IT Staff in later labs
  status            String        @default("New")    // New, Open, In Progress, Resolved, Closed
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  attachments       Attachment[]

  @@index([requesterId])
  @@index([status])
  @@index([createdAt])
  @@map("tickets")
}

model Attachment {
  id            Int       @id @default(autoincrement())
  ticketId      Int
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  fileName      String
  storedPath    String
  fileSize      Int
  mimeType      String
  isRemoved     Boolean   @default(false)
  removalReason String?
  removedAt     DateTime?
  removedBy     String?
  createdAt     DateTime  @default(now())

  @@index([ticketId, isRemoved])
  @@map("attachments")
}
```

### Justification of Database Decisions:
- **`RequesterUser` Model:** Separates development requester mock profiles from future Lab 3 system authentication while enabling true relational foreign key integrity on `ticket.requesterId`.
- **Soft-Removal Flags on `Attachment`:** Retaining `isRemoved`, `removalReason`, `removedAt`, and `removedBy` satisfies compliance auditing while preventing orphaned references.
- **Indexes:** Indexes on `requesterId`, `status`, `createdAt`, and `[ticketId, isRemoved]` optimize sorting, requester filtering, and active attachment quota checks.

---

## 8. API Contract Summary (See `api-spec.md` for full details)

| Method | Path | Description | Expected Status |
|---|---|---|---|
| `GET` | `/api/requesters` | List active development requesters | 200 |
| `GET` | `/api/categories` | List active ticket categories | 200 |
| `GET` | `/api/related-systems` | List active related IT systems | 200 |
| `POST` | `/api/tickets` | Create a new ticket (with optional file uploads) | 201 |
| `GET` | `/api/tickets` | Paginated ticket list for current requester (search/filter/sort) | 200 |
| `GET` | `/api/tickets/:id` | Get owned ticket detail (enforces ownership) | 200 / 403 / 404 |
| `POST` | `/api/tickets/:id/attachments` | Add attachment to existing owned ticket | 201 / 400 / 403 |
| `GET` | `/api/attachments/:id/download` | Download active attachment binary | 200 / 404 / 410 |
| `PATCH` | `/api/attachments/:id/soft-remove` | Soft-remove attachment with mandatory reason | 200 / 400 / 403 |

---

## 9. Acceptance Criteria (Given-When-Then)

- **AC-01 (Requester Selection):** Given the user opens the application with no requester selected, when the page loads, then the Development Requester Selection screen is displayed with active requesters loaded from PostgreSQL.
- **AC-02 (Valid Ticket Submission):** Given an active Requester is selected and valid ticket fields (Category, Related System, Priority, Summary, Description) are entered, when the Requester clicks Submit, then a new Ticket is created with status `New`, an official Ticket Number (`TKT-YYYY-NNNNNN`) is generated, and a success confirmation is displayed.
- **AC-03 (Validation Errors):** Given the Create Ticket form is submitted with an empty Summary or Description $< 10$ characters, when submitted, then submission is blocked, the API is not called, and field-level error messages appear directly below invalid controls.
- **AC-04 (Initial Attachment Upload):** Given a valid ticket with 2 valid image attachments ($\le 5\text{ MB}$), when submitted, then the ticket and attachment records are saved and linked.
- **AC-05 (Invalid Attachment Type Rejection):** Given an unsupported file format (e.g., `.exe` or `.zip`), when attached, then the UI displays an error and disables submission.
- **AC-06 (Attachment Size Limit):** Given an attachment exceeding 5 MB, when selected, then a file size validation error is shown immediately.
- **AC-07 (Requester Ticket Isolation in Listing):** Given Requester A is active, when opening My Tickets, then only tickets where `requesterId == Requester A` are displayed.
- **AC-08 (My Tickets Search):** Given a list of tickets, when a query string is typed in the search bar, then tickets matching the number or summary are returned.
- **AC-09 (My Tickets Filtering):** Given a selected Category or Priority filter, when changed, then the list updates to reflect only matching tickets.
- **AC-10 (My Tickets Pagination):** Given a requester with 15 tickets and page size 10, when navigating to page 2, then the remaining 5 tickets are displayed with correct pagination indicators.
- **AC-11 (Owned Ticket Detail View):** Given Requester A opens a ticket owned by Requester A, when viewed, then all ticket header fields, dates, and attachment cards render in read-only mode.
- **AC-12 (Cross-Requester Ticket Access Blocked):** Given Requester B attempts to open `/api/tickets/:id` belonging to Requester A, when requested, then the API returns HTTP 403/404 and no ticket data is exposed.
- **AC-13 (Post-Creation Attachment Addition):** Given an owned ticket with 3 active attachments, when the owner uploads 1 valid attachment, then the attachment is saved and displayed in the attachment list.
- **AC-14 (Attachment Quota Limit):** Given a ticket with 5 active attachments, when the user attempts to add a 6th attachment, then upload is blocked with an explicit quota error.
- **AC-15 (Attachment Download):** Given an active attachment, when clicked by the ticket owner, then the browser downloads the file with the original filename.
- **AC-16 (Attachment Soft Removal):** Given an active attachment, when the owner confirms soft-removal with a valid reason, then the attachment status changes to removed, reason and timestamp are saved, and download/preview buttons are disabled.
- **AC-17 (Removed Attachment Download Prevention):** Given a soft-removed attachment, when a direct GET request is made to its download endpoint, then HTTP 410 Gone (or 404) is returned.
- **AC-18 (Switching Requester Context):** Given Requester A is selected and viewing My Tickets, when the user clicks "Change Requester" and selects Requester B, then all tickets and screens refresh immediately to show Requester B's context.

---

## 10. Definition of Done (DoD)

### Part 1: Product Completion
- [ ] All approved scope features (Requester context, Create Ticket, My Tickets, Ticket Detail, Attachment lifecycle) are fully implemented.
- [ ] All Acceptance Criteria (AC-01 through AC-18) are satisfied and linked to automated tests.
- [ ] All Unit, API (Supertest), UI (Vitest), and E2E (Playwright) tests pass with 0 failures and 0 skipped tests on the `main` branch.
- [ ] Conformance to Zen Green UI Specification (`ui-spec.md`) and REST API Contract (`api-spec.md`).
- [ ] Responsive layout verified at Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), and Mobile ($< 768\text{px}$).
- [ ] Form states (initial, loading/busy, validation errors, success, API failure recovery) verified.
- [ ] Database migrations and idempotent seed scripts run without error.

### Part 2: Course Delivery Requirements
- [ ] Work decomposed into 6 distinct GitHub Issues and feature branches.
- [ ] Git Flow staging integration: feature branches ➔ `lab2-staging` ➔ `main`.
- [ ] Peer reviews completed and documented in `docs/lab-02/reviewer.md`.
- [ ] AI prompt usage and reflections recorded in `docs/lab-02/ai-use.md`.
- [ ] Single concise PDF compiled with Answer Parts 1 through 9.

---

## 11. Assumptions and Technical Decisions

1. **Storage of Uploaded Attachments:** Files are stored locally in `server/uploads/attachments/` with UUID-prefixed filenames to prevent collisions, and their metadata is recorded in the PostgreSQL `attachments` table.
2. **Requester Identity in Headers/Query:** In absence of full JWT auth (Lab 3), frontend sends the active requester ID via the custom HTTP header `x-requester-id` (or query param) for backend authorization and ownership enforcement.
3. **Ticket Number Format:** `TKT-YYYY-NNNNNN` uses the current four-digit year and a 6-digit zero-padded sequential integer derived from a dedicated counter or primary key sequence.
