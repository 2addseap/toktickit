# Sprint 3 Engineering Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Deliver an enterprise-grade identity, authorization, and operational workflow increment for TokTickIT. This sprint replaces the simulated Development Requester selector with secure credentials-based authentication and role-based access control across three distinct roles: **Requester**, **IT Staff**, and **Administrator**. It introduces mandatory first-login password changes, a shared IT Staff Ticket Queue with lifecycle management (assignment, IT priority, status transitions), dual-tier communication (Public Comments vs. restricted Internal Notes), and a minimalist Administrator User Management console, while preserving full regression compatibility for all Lab 2 Requester functions.

---

## 2. Stakeholder Request Interpretation
The IT Service Desk has moved beyond the MVP validation stage and requires production-like operational controls:
1. **Authentication & Identity:** Simulated user dropdowns must be removed. All actors must authenticate via email and secure password. Users issued initial/temporary passwords must be forced into a password change workflow before reaching application features.
2. **Role Boundaries & Protection:** Every screen and API must be strictly protected on the server. IT Staff manage operational tickets, Administrators manage accounts, and Requesters manage only their own service requests. An Administrator does not automatically handle ticket triage unless explicitly permitted.
3. **Operational Ticketing:** IT Staff require a centralized Ticket Queue to discover unassigned work, claim tickets, adjust IT Priority, record private Internal Notes, communicate with Requesters via Public Comments, and advance tickets through an audited status lifecycle.
4. **Requester Continuity & Resolution Collaboration:** Requesters must continue submitting and viewing their tickets seamlessly. Requesters can post Public Comments to converse with IT Staff and indicate when an issue appears resolved, while leaving formal ticket resolution and closure to IT Staff.
5. **Minimalist Administration:** Administrators require a streamlined directory interface to provision accounts, update basic profile data, set initial passwords, and toggle account activation—with safety guardrails preventing lockout of the final active administrator.

---

## 3. Scope

### Included in Lab 3
- **Authentication Foundation:** Email and password login, secure session token/cookie management, logout, current authenticated user profile (`/api/auth/me`), and mandatory first-login password change.
- **Role-Based Authorization (RBAC):** Server-side middleware enforcing three distinct roles: `Requester`, `IT Staff`, and `Administrator`.
- **Database & Data Migration:** Evolution of Prisma schema from `RequesterUser` to unified `User` model with password hashes, roles, and status flags; preservation of all existing Lab 2 tickets, categories, systems, and attachments; idempotent seed data.
- **Requester Experience & Regression:** Removal of Development Requester selector; automatic binding of ticket operations to the authenticated session; Public Comments timeline; Requester "Problem Appears Resolved" indication.
- **IT Staff Ticket Queue:** Multi-column queue table (desktop) and stacked cards (mobile) with search, status/priority/assignment filtering, column sorting, and server-side pagination.
- **IT Staff Ticket Detail & Lifecycle:** Primary ticket ownership assignment/claim, IT Priority adjustment, formal status workflow transitions, and tabbed Public Comments vs. Internal Notes.
- **Public Comments & Internal Notes:** Append-only timeline entries; strict visibility partition (Internal Notes strictly forbidden and hidden from Requesters).
- **Administrator User Management:** Searchable user directory with role filter; user creation modal with initial password; edit user modal; account activation toggle; initial password reset; last-active-admin protection rules.
- **Design System Consistency:** Zen Green UI extensions, accessible forms, status/priority/role badges, mobile-responsive layouts, and standardized feedback states.
- **Comprehensive Verification:** Unit, API/integration, UI component, regression, and End-to-End (E2E) automated tests.

### Explicitly Excluded from Lab 3
- Outbound email delivery (invitation emails, password reset links, notification alerts).
- Self-registration and public sign-up workflows.
- Multi-Factor Authentication (MFA), OAuth2, Social Login, and Single Sign-On (SSO).
- Actions Taken by IT Staff (explicitly deferred to Lab 4).
- Formal SLA calculations, automated escalation timers, and KPI analytics dashboards.
- Multi-tenant organizations, departments hierarchy, and customer account structures.
- User deletion, bulk import/export, and multi-role assignments per user.
- Account lockouts, approval workflows, and profile image uploads.

---

## 4. Functional Requirements

### Authentication & Account Security
- **FR-01 (Authentication):** An active user must authenticate with a valid email address and password to establish an authenticated session.
- **FR-02 (Mandatory Password Change):** If a user is flagged with `mustChangePassword = true`, the system must intercept all protected routes and restrict access solely to the Change Password screen until a valid new password is saved.
- **FR-03 (Session Retrieval & Invalidation):** The client must be able to retrieve current user identity and permissions via `/api/auth/me`. Logging out must invalidate the session on both client and server.
- **FR-04 (Inactive Account Rejection):** Inactive accounts (`isActive = false`) must be rejected at login with a generic, safe failure message that does not leak account metadata.

### Requester Ticketing & Continuity
- **FR-05 (Authenticated Requester Context):** All ticket creation, listing, detail, and attachment endpoints must derive requester ownership exclusively from the authenticated session, ignoring any client-supplied `requesterId`.
- **FR-06 (Public Comments by Requester):** An authenticated ticket owner can submit and view Public Comments on their owned ticket.
- **FR-07 (Resolution Indication):** The authenticated ticket owner can toggle or submit a "Problem Appears Resolved" signal on their ticket to inform IT Staff that service is restored.

### IT Staff Operations & Ticket Queue
- **FR-08 (Shared Ticket Queue):** IT Staff and Administrators can view a global ticket queue displaying all tickets across the organization.
- **FR-09 (Queue Querying):** The Ticket Queue must support full-text search (ticket number, summary), multi-facet filtering (status, priority, assigned owner), column sorting, and pagination.
- **FR-10 (Ticket Assignment):** IT Staff and Administrators can claim an unassigned ticket or reassign primary ticket ownership to any active IT Staff or Administrator.
- **FR-11 (IT Priority Management):** IT Staff and Administrators can adjust the operational `itPriority` independently of the Requester's original `requestedPriority`.
- **FR-12 (Status Lifecycle Workflow):** IT Staff and Administrators can transition ticket statuses in accordance with the defined status transition rules.
- **FR-13 (Internal Notes):** IT Staff and Administrators can create and view private Internal Notes attached to a ticket. Requesters are strictly barred from reading or creating Internal Notes.

### Administrator User Management
- **FR-14 (User Directory):** Administrators can view all user accounts in a centralized list displaying Name, Email, Role, Status, and action triggers.
- **FR-15 (User Search & Filter):** The user directory must allow searching by name or email, with an optional role filter.
- **FR-16 (User Creation):** Administrators can create new accounts by specifying Full Name, Email, exactly one permitted Role, Activation State, and an Initial Password.
- **FR-17 (User Account Editing):** Administrators can update an existing user's Name, Email, Role, and Activation State.
- **FR-18 (Password Reset by Admin):** Administrators can generate or set a new initial password for any user, automatically setting `mustChangePassword = true`.

---

## 5. Business Rules (BR)

### Authentication & Credential Rules
- **BR-01 (Active Account Prerequisite):** Only accounts with `isActive = true` and valid credentials may authenticate. Deactivated accounts receive `401 Unauthorized` with `"Invalid email or password."`
- **BR-02 (Forced Password Change):** Users with `mustChangePassword = true` are prohibited from executing normal business endpoints. Requests to non-auth APIs return `403 Forbidden` with code `PASSWORD_CHANGE_REQUIRED`.
- **BR-03 (Password Complexity Standards):** New passwords must be at least 8 characters in length and contain at least one uppercase letter, one lowercase letter, and at least one number or special character.
- **BR-04 (Password Distinctness):** When completing a mandatory password change, the new password must not match the current temporary/initial password.
- **BR-05 (Secure Password Storage):** Passwords must never be stored, logged, or transmitted in plaintext. All stored passwords must be hashed using `bcrypt` with a work factor $\ge 10$.
- **BR-06 (Safe Error Feedback):** Authentication failure responses must be generic (`"Invalid email or password."`) to prevent account enumeration attacks.

### Identity & Authorization Rules
- **BR-07 (Session-Derived Identity):** Server-side operations must identify the caller via session context. The client-provided `x-requester-id` header or body parameters are ignored for authorization.
- **BR-08 (Single Permitted Role):** Each user must be assigned exactly one role from: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.
- **BR-09 (Requester Data Boundary):** Requesters are strictly confined to tickets where `ticket.requesterId == session.userId`. Any attempt to access another requester's ticket or attachment returns `403 Forbidden` (or `404 Not Found`).
- **BR-10 (Administrative Separation of Concerns):** Administrators have exclusive access to User Management (`/api/admin/users*`). IT Staff cannot access administrative endpoints.

### Ticket Ownership, Priority & Lifecycle
- **BR-11 (Initial Ownership & Priority):**
  - Newly created tickets have `assignedToId = null` (Unassigned).
  - Upon creation, `itPriority` automatically initializes to the value of `requestedPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **BR-12 (Ownership Assignment Eligibility):** Ticket ownership can only be assigned to an active user whose role is `IT_STAFF` or `ADMINISTRATOR`.
- **BR-13 (Priority Modification Restriction):** Only `IT_STAFF` and `ADMINISTRATOR` can update `itPriority`. Requesters can never modify `itPriority` or alter `requestedPriority` post-creation.
- **BR-14 (Requester Resolution Boundary):** A Requester can indicate that a problem appears resolved (`resolvedIndicated = true`, `resolvedIndicatedAt = now()`), but cannot directly transition the ticket status to `Resolved` or `Closed`.
- **BR-15 (Permitted Status Values):** Valid ticket statuses are: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
- **BR-16 (Status Transition Matrix):**
  - `New` $\rightarrow$ `Open`, `In Progress`, `Cancelled`
  - `Open` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `In Progress` $\rightarrow$ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` $\rightarrow$ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` $\rightarrow$ `Closed`, `Reopened`
  - `Closed` $\rightarrow$ `Reopened`
  - `Reopened` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Cancelled` is terminal.
  - Transitions to `Resolved` and `Closed` require `IT_STAFF` or `ADMINISTRATOR` role.

### Public Comments & Internal Notes
- **BR-17 (Public Comments Visibility):** Public Comments are visible to the ticket's Requester, all IT Staff, and Administrators.
- **BR-18 (Internal Notes Confidentiality):** Internal Notes are operational entries visible **strictly** to IT Staff and Administrators. Requesters are blocked from viewing, querying, or submitting Internal Notes.
- **BR-19 (Append-Only Immutability):** Both Public Comments and Internal Notes are append-only. Editing and deletion are disabled in Lab 3.
- **BR-20 (Comment Validation):** Content must be trimmed and contain between 1 and 2,000 characters. Empty or whitespace-only submissions are rejected with `400 Bad Request`.
- **BR-21 (Author Attribution):** The author of a comment or note is permanently bound to `session.userId` and the creation timestamp is assigned by the server.

### Administrator Safety Rules
- **BR-22 (Self-Deactivation Prevention):** An Administrator is strictly forbidden from deactivating their own currently authenticated account.
- **BR-23 (Last Active Administrator Invariant):** The system must guarantee at least one active Administrator at all times. Any action that would deactivate or demote the last remaining active Administrator must be rejected with `400 Bad Request` or `409 Conflict`.
- **BR-24 (No Hard Deletion):** User records are deactivated (`isActive = false`) rather than physically deleted, preserving historical ticket and comment audit trails.
- **BR-25 (Email Uniqueness):** User email addresses must be unique across the system (case-insensitive).

---

## 6. Authorization Matrix

| Endpoint / Operation | Method | Unauthenticated | Requester (Owner) | Requester (Non-Owner) | IT Staff | Administrator |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/auth/login` | POST | Allow | Allow | Allow | Allow | Allow |
| `POST /api/auth/logout` | POST | 401 | Allow | Allow | Allow | Allow |
| `GET /api/auth/me` | GET | 401 | Allow | Allow | Allow | Allow |
| `POST /api/auth/change-password` | POST | 401 | Allow | Allow | Allow | Allow |
| `GET /api/tickets` (My Tickets) | GET | 401 | Allow (Own) | Forbidden | Allow (Own) | Allow (Own) |
| `POST /api/tickets` (Create Ticket) | POST | 401 | Allow | Allow | Allow | Allow |
| `GET /api/tickets/:id` (Ticket Detail) | GET | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `POST /api/tickets/:id/attachments` | POST | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `GET /api/attachments/:id/download` | GET | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `PATCH /api/attachments/:id/soft-remove` | PATCH | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `PATCH /api/tickets/:id/resolve-indication` | PATCH | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `GET /api/tickets/:id/comments` (Public) | GET | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `POST /api/tickets/:id/comments` (Public) | POST | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `GET /api/tickets/:id/notes` (Internal) | GET | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `POST /api/tickets/:id/notes` (Internal) | POST | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `GET /api/staff/tickets` (Queue) | GET | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/staff/tickets/:id/assign` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/staff/tickets/:id/priority` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/staff/tickets/:id/status` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `GET /api/admin/users` | GET | 401 | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Allow |
| `POST /api/admin/users` | POST | 401 | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Allow |
| `PATCH /api/admin/users/:id` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Allow |
| `POST /api/admin/users/:id/reset-password` | POST | 401 | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Allow |

---

## 7. Data Changes & Migration Strategy

### Prisma Schema Evolution
The database schema evolves from the Lab 2 state by migrating `RequesterUser` into an enterprise `User` model, establishing ticket assignment relationships, and adding communication entities:

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

model User {
  id                 Int       @id @default(autoincrement())
  name               String
  email              String    @unique
  passwordHash       String
  role               Role      @default(REQUESTER)
  department         String?
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  submittedTickets   Ticket[]  @relation("TicketRequester")
  assignedTickets    Ticket[]  @relation("TicketAssignee")
  comments           Comment[]

  @@map("users")
}

model Ticket {
  id                  Int          @id @default(autoincrement())
  ticketNumber        String       @unique
  requesterId         Int
  requester           User         @relation("TicketRequester", fields: [requesterId], references: [id])
  assignedToId        Int?
  assignedTo          User?        @relation("TicketAssignee", fields: [assignedToId], references: [id])
  categoryId          Int
  category            Category     @relation(fields: [categoryId], references: [id])
  relatedSystemId     Int
  relatedSystem       RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  summary             String
  description         String
  requestedPriority   String       @default("MEDIUM")
  itPriority          String       @default("MEDIUM")
  status              String       @default("New")
  resolvedIndicated   Boolean      @default(false)
  resolvedIndicatedAt DateTime?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  attachments         Attachment[]
  comments            Comment[]

  @@index([requesterId])
  @@index([assignedToId])
  @@index([status])
  @@index([itPriority])
  @@index([createdAt])
  @@map("tickets")
}

enum CommentType {
  PUBLIC
  INTERNAL
}

model Comment {
  id        Int         @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket      @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User        @relation(fields: [authorId], references: [id])
  body      String
  type      CommentType @default(PUBLIC)
  createdAt DateTime    @default(now())

  @@index([ticketId, type])
  @@map("comments")
}
```

### Migration Steps from Lab 2
1. **Table Renaming & Column Additions:** Transform `requester_users` table into `users`, adding `passwordHash`, `role`, and `mustChangePassword`.
2. **Backfilling Existing Requesters:** Set default `passwordHash` (e.g. for initial password `Password123!`), set `mustChangePassword = true`, and assign `role = 'REQUESTER'`.
3. **Ticket Evolution:** Populate `itPriority` from `requestedPriority` for existing tickets; add `assignedToId` foreign key and resolution indication columns.
4. **Idempotent Seeding:** Upsert standard accounts:
   - 4 active Requesters, 1 inactive Requester (`alex.inactive@kmutt.ac.th`).
   - 3 active IT Staff (e.g. `it.support@kmutt.ac.th`, `sarah.it@kmutt.ac.th`, `mike.it@kmutt.ac.th`), 1 inactive IT Staff.
   - 1 active Administrator (`admin@kmutt.ac.th`).

---

## 8. UI Specification Summary
Full visual and interaction specifications are detailed in [ui-spec.md](file:///Users/kan/Working%20Space/KMUTT/Year%203/CPE334%20Software%20Engineering/toktickit/docs/lab-03/ui-spec.md).
- **Application Shell:** Navbar updates to display authenticated user's name, role badge (`REQUESTER`, `IT STAFF`, `ADMIN`), and accessible Logout button. Navigation links dynamically render based on role:
  - Requester: *My Tickets*, *Create Ticket*.
  - IT Staff: *Ticket Queue*.
  - Administrator: *User Management*, *Ticket Queue*.
- **Screen 1 (Login & First-Login Password Change):** Centered card layout with Zen Green header, validation states, and password criteria checklist during forced password resets.
- **Screen 2 (IT Staff Ticket Queue):** High-density desktop table with sortable headers, multi-select status/priority filters, quick unassigned toggle, pagination controls, and responsive stacked cards for mobile viewports.
- **Screen 3 (IT Staff Ticket Detail):** Operational sidebar for Claim/Assign dropdown, IT Priority selector, and status transition buttons. Dedicated tabbed timeline clearly separating Public Comments (green accent) from Internal Notes (amber card container).
- **Screen 4 (Requester Ticket Detail Extension):** Public Comments timeline and "Problem Appears Resolved" banner.
- **Screen 5 (Administrator User Management):** Minimalist user directory with search, role dropdown filter, Add User modal, and Edit User modal with self-deactivation safeguards.

---

## 9. API Contract Summary
Full endpoint specifications and payload schemas are documented in [api-spec.md](file:///Users/kan/Working%20Space/KMUTT/Year%203/CPE334%20Software%20Engineering/toktickit/docs/lab-03/api-spec.md).
- **Session Transport:** HTTP Bearer token or signed session cookie (`auth_token`).
- **Protected Endpoints:** Automatically inspect session context. If unauthenticated $\rightarrow$ `401 Unauthorized`. If authenticated but insufficient role $\rightarrow$ `403 Forbidden`. If `mustChangePassword = true` $\rightarrow$ `403 Forbidden` with `{ code: "PASSWORD_CHANGE_REQUIRED" }`.

---

## 10. Acceptance Criteria (AC)

- **AC-01 (Valid Login):** Given an active user with valid credentials, when authenticating via `POST /api/auth/login`, then the backend issues a session token and returns the user's profile and role.
- **AC-02 (Inactive Account Rejection):** Given an account with `isActive = false`, when authenticating with valid credentials, then the backend rejects the login with `401 Unauthorized` and message `"Invalid email or password."`
- **AC-03 (Forced Password Change Interception):** Given a user with `mustChangePassword = true`, when authenticating, then `POST /api/auth/login` returns `mustChangePassword: true`, and any subsequent access to non-auth endpoints returns `403 Forbidden` (`PASSWORD_CHANGE_REQUIRED`).
- **AC-04 (Successful Password Change):** Given a user requiring a password change, when submitting a valid new password meeting complexity criteria, then the password hash is updated, `mustChangePassword` is set to `false`, and normal application access is restored.
- **AC-05 (Authenticated Requester Ownership):** Given an authenticated Requester, when calling `GET /api/tickets` or `POST /api/tickets`, the backend strictly uses the session identity, disregarding any external `requesterId` parameter.
- **AC-06 (Cross-Requester Ticket Access Blocked):** Given Requester A and Requester B, when Requester A requests `GET /api/tickets/:id` belonging to Requester B, the backend returns `403 Forbidden` without leaking ticket metadata.
- **AC-07 (Requester Resolution Indication):** Given the owner of a ticket, when submitting a resolution indication, then `resolvedIndicated = true` and `resolvedIndicatedAt` are recorded on the ticket.
- **AC-08 (Public Comments Access):** Given an active Requester, IT Staff, or Administrator, when posting to `POST /api/tickets/:id/comments`, a public comment is created and immediately visible to all authorized parties.
- **AC-09 (Internal Notes Isolation):** Given an authenticated Requester, when sending `GET` or `POST` to `/api/tickets/:id/notes`, the server returns `403 Forbidden` and does not return any internal notes.
- **AC-10 (Internal Notes for IT Staff):** Given an authenticated IT Staff member, when calling `/api/tickets/:id/notes`, internal notes are successfully retrieved and persisted.
- **AC-11 (IT Staff Ticket Queue Query):** Given an IT Staff user, when fetching `GET /api/staff/tickets` with search, filter, sort, and pagination parameters, the backend returns the matching paginated ticket collection with metadata.
- **AC-12 (Queue Forbidden for Requester):** Given an authenticated Requester, when calling `GET /api/staff/tickets`, the backend responds with `403 Forbidden`.
- **AC-13 (Ticket Claiming & Reassignment):** Given an IT Staff user, when patching `/api/staff/tickets/:id/assign` with a valid `assignedToId`, the ticket assignee is updated.
- **AC-14 (IT Priority Adjustment):** Given an IT Staff user, when updating `itPriority` via `/api/staff/tickets/:id/priority`, the operational priority is updated while `requestedPriority` remains unchanged.
- **AC-15 (Status Transition Enforcement):** Given a ticket in `New` status, when an IT Staff user transitions status to `In Progress`, the update succeeds. When attempting an illegal transition (e.g. `New` to `Closed`), the server rejects the request with `400 Bad Request`.
- **AC-16 (Admin User Listing):** Given an Administrator, when calling `GET /api/admin/users`, all registered users are returned with optional search and role filtering.
- **AC-17 (Admin User Creation):** Given an Administrator, when posting valid user payload to `POST /api/admin/users`, a new user record is created with hashed initial password and `mustChangePassword = true`.
- **AC-18 (Duplicate Email Rejection):** Given an Administrator, when attempting to create or edit a user with an email that already exists, the server responds with `400 Bad Request` or `409 Conflict`.
- **AC-19 (Self-Deactivation Prevention):** Given an Administrator, when attempting to update their own account with `isActive = false`, the server rejects the request with `400 Bad Request`.
- **AC-20 (Last Active Admin Protection):** Given a system with only one active Administrator, when attempting to deactivate or change the role of that Administrator, the server rejects the request with `400 Bad Request`.
- **AC-21 (Non-Admin Access to Admin APIs):** Given an IT Staff or Requester user, when requesting any `/api/admin/users*` endpoint, the server responds with `403 Forbidden`.

---

## 11. Definition of Done (DoD)

- [x] Sprint 3 Engineering Contract approved (`docs/lab-03/specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`).
- [x] Database evolved via Prisma migration preserving Lab 2 tickets and attachments; idempotent seed data executed.
- [x] Secure authentication, session management, and mandatory first-login password change implemented and verified.
- [x] All Lab 2 Requester workflows pass regression tests using session-derived identity.
- [x] IT Staff Ticket Queue and Ticket Detail workflows (claim, reassign, IT priority, status lifecycle) operational.
- [x] Dual-tier commenting implemented (Public Comments accessible to owner/staff/admin; Internal Notes strictly isolated to staff/admin).
- [x] Administrator User Management screen and APIs functional with safety guardrails (self-deactivation and last-admin protections).
- [x] Responsive Zen Green UI implemented across Desktop, Tablet, and Mobile viewports without layout clipping or horizontal overflow.
- [x] 100% of planned automated tests passing (Unit, Supertest API, Vitest UI, Playwright E2E).
- [x] Release integration completed via GitHub PR workflow: `feature/*` $\rightarrow$ `lab3-staging` $\rightarrow$ `main`.
- [x] Traceable evidence artifacts compiled for PDF submission (`reviewer.md`, `ai-use.md`, test logs, screenshots).

---

## 12. Technical Assumptions & Decisions

1. **Authentication Token Mechanism:** We will utilize signed JSON Web Tokens (JWT) or secure session tokens delivered via `Authorization: Bearer <token>` or HTTP-only cookies. Bearer tokens allow clean, reliable integration across automated API tests (Supertest) and frontend state management.
2. **Password Hashing Library:** Standard `bcryptjs` will be employed for compatibility across environments without external native compilation dependencies.
3. **Idempotent Seed Credentials:** Seed accounts will be provisioned with standard development passwords (e.g. `Password123!`) marked with `mustChangePassword = true` for initial login testing, with a designated pre-configured admin account for immediate testing.
4. **Resolution Indication vs. Status Transition:** A Requester signaling "Problem Appears Resolved" does not prematurely mutate `status = 'Resolved'`. Instead, it sets `resolvedIndicated = true` and triggers a visible banner on the IT Staff Ticket Detail screen so IT Staff can verify and formally close the ticket.
