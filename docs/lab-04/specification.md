# Sprint 4 Engineering Specification: TokTickIT Actions Taken, Role Dashboards, Ticket Workflow, and Final Hardening

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by introducing a parent-child work-tracking structure (**Actions Taken** under each Ticket), enforcing authoritative Ticket status-transition and resolution lifecycle rules, delivering role-appropriate operational dashboards for **Requesters**, **IT Staff**, and **Administrators**, and hardening the end-to-end full-stack system across all capabilities built in Labs 1 through 3 to achieve complete production-grade readiness.

---

## 2. Stakeholder Request Interpretation
The IT Service Desk stakeholders require a dependable mechanism to plan, execute, and audit actual technical work performed on service tickets:
1. **Auditable Work Tracking (Actions Taken):** While tickets capture the problem description and comments provide user communication, actual technical interventions must be recorded systematically. Each action line must capture: Action Date/Time, Action Description, Result, Performed by (auto-attributed to authenticated staff), Follow-Up Required flag, Follow-up Note (mandatory whenever follow-up is needed), and Attachment Notes (referencing diagnostic logs, screenshots, or configuration files).
2. **Collaborative IT Ownership:** A primary Ticket Owner coordinates the ticket as a whole, but multiple distinct IT Staff members may record individual Actions Taken as team members collaborate on resolution.
3. **Formal Resolution Governance:** Although Requesters may indicate when a service appears restored, that signal remains advisory. IT Staff and Administrators remain the sole authorities to formally review the work and transition ticket status to `Resolved` or `Closed`.
4. **Role-Appropriate Operational Dashboards:** 
   - **Requesters** require a concise dashboard summarizing their own open requests, tickets awaiting their feedback, recent updates, and resolved issues, with fast drill-down to detailed records.
   - **IT Staff** require a high-level operational command center highlighting unassigned queue items, tickets assigned to themselves, counts across active statuses, and urgent issues needing attention.
   - **Administrators** reuse the IT Staff dashboard with optional high-level user-account metrics.
5. **System Hardening & Regression:** The final product must preserve all previous functionality (authentication, password changes, RBAC, attachments, public comments, internal notes, and user administration) while eliminating visual glitches, dead ends, and race conditions under the Zen Green design system.

---

## 3. Scope

### Included in Lab 4
- **Actions Taken Data Model & APIs:** Parent-child relationship (one `Ticket` has many `ActionTaken` records); timestamps, performer attribution, follow-up validation, and attachment notes.
- **Actions Taken UI:** Dynamic timeline/table integrated into the IT Staff Ticket Detail screen supporting list, create, and view/edit modes; read-only visibility for Requesters on their owned tickets.
- **Collaborative Execution:** Primary Ticket Owner coordination while any active IT Staff member can perform and append Actions Taken.
- **Complete Ticket Lifecycle & Status Transitions:** Strict finite-state machine enforcing allowed transitions across all 8 statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`); terminal states; backend as the ultimate authority.
- **Resolution Gate:** IT Staff formal review required for `Resolved`; Requester resolution indication treated as non-mutating advisory flag.
- **Role-Appropriate Dashboards:**
  - Requester Dashboard with metric cards (`My Open Tickets`, `In Progress`, `Waiting for Requester`, `Recently Resolved`), recent ticket list, and quick actions.
  - IT Staff Dashboard with operational metrics (`New`, `Open`, `In Progress`, `Waiting for Requester`, `My Assigned`), urgent/recent tickets, and quick actions.
  - Administrator Dashboard extending the Staff dashboard with concise user directory statistics.
  - Direct drill-down links from dashboard metric cards into pre-filtered list/queue views.
- **Concurrency & Stale-Update Protection:** Optimistic concurrency control using `updatedAt` / version stamps to prevent silent overwrites during concurrent edits.
- **Regression & Hardening:** 100% preservation of all features from Labs 1, 2, and 3; responsive layout across Desktop (1280px), Tablet (768px), and Mobile (390px); keyboard accessibility; robust error handling.

### Explicitly Excluded from Lab 4
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- Email, SMS, LINE, push, or external webhooks.
- Inventory consumption, spare-parts management, purchasing, or service cost accounting.
- Time-sheet billing, payroll, or labor-cost calculations.
- Multi-level approval workflows and electronic signatures.
- Advanced business-intelligence tools, custom report builders, or export data warehouses.
- Multi-tenant organizations and production-scale cloud operations.
- New unapproved product features not specified in this engineering contract.

---

## 4. Functional Requirements (FR)

### Actions Taken Management
- **FR-01 (Actions Taken Structure):** The system must record Actions Taken linked to a parent Ticket with the following attributes: `actionDateTime` (defaults to current timestamp), `actionDescription` (1-2000 chars), `result` (1-2000 chars), `performedById` (auto-bound to session user), `followUpRequired` (boolean), `followUpNote` (string, mandatory if follow-up required), and `attachmentNotes` (optional string up to 500 chars).
- **FR-02 (Actions Taken Creation):** An authenticated IT Staff member or Administrator can add a new Action Taken to any accessible ticket.
- **FR-03 (Actions Taken Update):** An authenticated IT Staff member or Administrator can edit an existing Action Taken record (description, result, follow-up flags, and attachment notes).
- **FR-04 (Requester Visibility):** An authenticated Requester can view all Actions Taken recorded on tickets they own, but is barred from creating, editing, or deleting Actions Taken.
- **FR-05 (Staff Multi-Actor Participation):** Multiple distinct IT Staff members can record Actions Taken on the same Ticket regardless of who is assigned as the primary Ticket Owner.

### Ticket Status Workflow & Resolution
- **FR-06 (Authoritative Status Transitions):** The backend must enforce valid status transitions according to the defined lifecycle matrix. Invalid transitions must be rejected with `400 Bad Request`.
- **FR-07 (Role-Restricted Transitions):** Only IT Staff and Administrators may transition tickets to `Resolved` or `Closed`. Requesters can only transition tickets to `Cancelled` (when allowed by state rules).
- **FR-08 (Advisory Requester Resolution):** When a Requester indicates a problem appears resolved, the ticket's `resolvedIndicated` flag is updated, but the ticket status remains unchanged until an IT Staff member formally transitions it.
- **FR-09 (Optimistic Concurrency Control):** Status updates and Action Taken edits must verify that the record has not been updated concurrently by another user; stale updates must return `409 Conflict`.

### Role Dashboards
- **FR-10 (Requester Dashboard Metrics):** The system must provide a dedicated dashboard endpoint for Requesters returning exact counts for: `myOpenTickets`, `inProgressTickets`, `waitingForRequesterTickets`, and `recentlyResolvedTickets`, along with up to 5 of their most recently updated tickets.
- **FR-11 (Requester Data Isolation):** The Requester dashboard must compute metrics exclusively from tickets where `ticket.requesterId == session.userId`.
- **FR-12 (IT Staff Dashboard Metrics):** The system must provide an operational dashboard endpoint for IT Staff returning counts for: `unassignedTickets`, `myAssignedTickets`, counts grouped by active status (`New`, `Open`, `In Progress`, `Waiting for Requester`), and up to 5 urgent or recently updated queue items.
- **FR-13 (Administrator Dashboard Extension):** The system must allow Administrators to access IT Staff operational metrics alongside system user counts (`totalUsers`, `activeUsers`, `inactiveUsers`).
- **FR-14 (Dashboard Drill-Down):** Clicking any metric card on a dashboard must navigate the user to the corresponding list view (My Tickets or Staff Ticket Queue) with the appropriate filter pre-applied.

### Application Hardening & Regression
- **FR-15 (Regression Preservation):** All Lab 1-3 features (login, logout, forced password change, user administration, ticket creation, attachments, public comments, internal notes, queue filters) must continue to function without degradation.
- **FR-16 (Safe Failure & Feedback):** All forms must retain user input upon recoverable validation or network errors, and display clear, non-intrusive feedback banners adhering to Zen Green tokens.

---

## 5. Business Rules (BR)

### Actions Taken Rules
- **BR-01 (Single Parent Ticket):** Each Action Taken record belongs to exactly one Ticket.
- **BR-02 (Separation of Coordination and Execution):** The primary Ticket Owner coordinates the ticket as a whole, but Actions Taken can be created and updated by any permitted IT Staff member or Administrator.
- **BR-03 (Requester Read-Only Access):** Requesters are strictly prohibited from creating or modifying Actions Taken. Read requests by a Requester for a ticket they do not own must return `403 Forbidden` or `404 Not Found`.
- **BR-04 (Follow-Up Note Co-dependency):** If `followUpRequired` is `true`, `followUpNote` must be provided as a non-empty string (trimmed, $\ge 3$ characters). If `followUpRequired` is `false`, `followUpNote` may be null or empty.
- **BR-05 (Automatic Performer Attribution):** The `performedById` attribute must be auto-populated from the authenticated user's session ID (`req.user.id`). Client requests cannot spoof performer attribution.
- **BR-06 (Inactive Performer Guard):** An Action Taken cannot be created or updated by an inactive user (`isActive == false`).

### Ticket Status & Lifecycle Rules
- **BR-07 (Permitted Ticket Statuses):** Valid ticket statuses are: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
- **BR-08 (State Transition Matrix):**
  - `New` $\rightarrow$ `Open`, `In Progress`, `Cancelled`
  - `Open` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `In Progress` $\rightarrow$ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` $\rightarrow$ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` $\rightarrow$ `Closed`, `Reopened`
  - `Closed` $\rightarrow$ `Reopened`
  - `Reopened` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Cancelled` is terminal (no transitions permitted).
- **BR-09 (Resolution Authority):** Transitions to `Resolved` or `Closed` require an authenticated user with role `IT_STAFF` or `ADMINISTRATOR`.
- **BR-10 (Advisory Requester Indication):** Setting `resolvedIndicated = true` by a Requester does not alter `ticket.status`. It serves as visual operational feedback for IT Staff.
- **BR-11 (Cancellation Rules):** Requesters may cancel their own ticket only if it is in `New` or `Open` status. IT Staff and Administrators may cancel tickets in `New`, `Open`, `In Progress`, `Waiting for Requester`, or `Reopened` status.

### Dashboard Calculation Rules
- **BR-12 (Authoritative Backend Computation):** All dashboard metrics must be computed dynamically by the server from authoritative database records. Clients must not calculate KPI counts locally.
- **BR-13 (Requester Metrics Formulation):**
  - `myOpenTickets`: Count of tickets where `requesterId = user.id` AND `status IN ('New', 'Open')`.
  - `inProgressTickets`: Count of tickets where `requesterId = user.id` AND `status = 'In Progress'`.
  - `waitingForRequesterTickets`: Count of tickets where `requesterId = user.id` AND `status = 'Waiting for Requester'`.
  - `recentlyResolvedTickets`: Count of tickets where `requesterId = user.id` AND `status IN ('Resolved', 'Closed')` AND `updatedAt >= (NOW() - INTERVAL '30 DAYS')`.
- **BR-14 (IT Staff Metrics Formulation):**
  - `unassignedTickets`: Count of tickets where `assignedToId IS NULL` AND `status NOT IN ('Closed', 'Cancelled')`.
  - `myAssignedTickets`: Count of tickets where `assignedToId = user.id` AND `status NOT IN ('Closed', 'Cancelled')`.
  - `newTickets`: Count of tickets where `status = 'New'`.
  - `openTickets`: Count of tickets where `status = 'Open'`.
  - `inProgressTickets`: Count of tickets where `status = 'In Progress'`.
  - `waitingRequesterTickets`: Count of tickets where `status = 'Waiting for Requester'`.
  - `urgentTickets`: Count of tickets where `itPriority = 'URGENT'` AND `status NOT IN ('Closed', 'Cancelled')`.
- **BR-15 (Administrator Metrics Formulation):**
  - In addition to all IT Staff metrics: `totalUsers` (all users in directory), `activeUsers` (`isActive = true`), `inactiveUsers` (`isActive = false`).

---

## 6. Authorization Matrix

| Endpoint / Action | HTTP Method | Public / Unauth | Requester (Owner) | Requester (Non-Owner) | IT Staff | Administrator |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/dashboards/requester` | GET | 401 | Allow (Own) | 401 / 403 | Allow (Own) | Allow (Own) |
| `GET /api/dashboards/staff` | GET | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `GET /api/tickets/:id/actions` | GET | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `POST /api/tickets/:id/actions` | POST | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/actions/:id` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/staff/tickets/:id/status` | PATCH | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `PATCH /api/tickets/:id/resolve-indication` | PATCH | 401 | Allow (Own) | 403 / 404 | Allow (All) | Allow (All) |
| `GET /api/staff/tickets` (Queue) | GET | 401 | **403 Forbidden** | **403 Forbidden** | Allow | Allow |
| `GET /api/admin/users` (Admin Directory) | GET | 401 | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Allow |

---

## 7. Data Changes & Migration Strategy

### Prisma Schema Increment
The Prisma schema extends the Lab 3 schema without dropping or altering existing tables. A new `ActionTaken` model is introduced, and `Ticket` is linked via a 1-to-many relationship:

```prisma
model ActionTaken {
  id                Int      @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedById     Int
  performedBy       User     @relation("ActionPerformer", fields: [performedById], references: [id])
  actionDateTime    DateTime @default(now())
  actionDescription String
  result            String
  followUpRequired  Boolean  @default(false)
  followUpNote      String?
  attachmentNotes   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
  @@map("actions_taken")
}
```

In the `User` model, the inverse relation is added:
```prisma
model User {
  ...
  actionsPerformed ActionTaken[] @relation("ActionPerformer")
}
```

In the `Ticket` model, the relation and an optimistic concurrency `version` (or `updatedAt` comparison) is maintained:
```prisma
model Ticket {
  ...
  actionsTaken ActionTaken[]
}
```

### Database Design Decisions & Justifications
1. **Decision 1: Dedicated `ActionTaken` Model vs. Overloading `Comment` Model:**
   - *Justification:* Actions Taken represent formal, structured technical interventions with strict schemas (mandatory result, co-dependent follow-up flags, attachment references), distinct operational lifecycles, and different auditing requirements compared to informal conversational comments. Storing them in a dedicated `actions_taken` table avoids nullable column pollution in `comments`, maintains clean relational integrity with indexed foreign keys, and prevents accidental leaks to conversational comment feeds.
2. **Decision 2: Optimistic Concurrency via Timestamp/Version Tracking vs. Pessimistic Row Locking:**
   - *Justification:* Service desk environments involve multiple staff reviewing queues simultaneously with low instantaneous write contention. Pessimistic database locks degrade queue responsiveness and risk deadlocks during extended staff reading sessions. Optimistic concurrency control (evaluating `updatedAt` / version stamps upon submission and returning `409 Conflict` on mismatch) guarantees safe updates while keeping the database connection pool non-blocking and highly available.

### Migration & Backfill Strategy
- **Migration:** Run `npx prisma migrate dev --name add_actions_taken` to apply the new table. No existing rows in `tickets`, `users`, or `comments` are deleted or mutated.
- **Legacy Ticket Handling:** Existing tickets created in Labs 1-3 simply have zero associated `actions_taken` records (`actionsTaken = []`). All queries handle empty relations cleanly without null-pointer exceptions.
- **Idempotent Seed Increment:** The seed script (`server/prisma/seed.ts`) will be enhanced to generate realistic tickets with:
  - 0 Actions Taken (e.g., brand new tickets).
  - 1 Action Taken (e.g., triage or initial diagnosis).
  - Multiple Actions Taken performed by different IT Staff members (e.g., hardware check followed by network reconfiguration).
  - Both zero and non-zero counts across all dashboard metrics.

---

## 8. UI Specification Summary
Refer to [ui-spec.md](file:///Users/kan/Working%20Space/KMUTT/Year%203/CPE334%20Software%20Engineering/toktickit/docs/lab-04/ui-spec.md) for full interactive component mockups and responsive token definitions.
- **Shell Navigation:**
  - Requester: *Dashboard*, *My Tickets*, *Create Ticket*.
  - IT Staff: *Dashboard*, *Ticket Queue*, *My Tickets*, *Create Ticket*.
  - Administrator: *Dashboard*, *Ticket Queue*, *User Management*, *My Tickets*, *Create Ticket*.
- **IT Staff Dashboard Screen:** KPI metrics grid (5 cards), Recent/Urgent Tickets widget with status badges, Quick Action shortcuts, responsive wrapping for mobile.
- **Requester Dashboard Screen:** KPI metrics grid (4 cards), My Recent Tickets widget, Quick Action buttons, drill-down links to filtered My Tickets list.
- **Ticket Detail Screen - Actions Taken Module:**
  - Card container positioned in IT Staff Ticket Detail.
  - Interactive table/list showing Date/Time, Description, Result, Performer, Follow-up badge, Attachment notes.
  - *Add Action* button toggling creation form.
  - *Edit* button opening modal/inline form with pre-populated data.
  - Read-only presentation in Requester Ticket Detail view.
- **Status Control Dropdown:** Dynamic filtering to only show valid transition targets according to current ticket status and user role.

---

## 9. API Contract Summary
Refer to [api-spec.md](file:///Users/kan/Working%20Space/KMUTT/Year%203/CPE334%20Software%20Engineering/toktickit/docs/lab-04/api-spec.md) for detailed JSON payloads and schema definitions.
- `GET /api/dashboards/requester` $\rightarrow$ `{ metrics: {...}, recentTickets: [...] }`
- `GET /api/dashboards/staff` $\rightarrow$ `{ metrics: {...}, recentTickets: [...] }`
- `GET /api/tickets/:id/actions` $\rightarrow$ `[{ id, actionDateTime, actionDescription, result, performedBy, followUpRequired, followUpNote, attachmentNotes }]`
- `POST /api/tickets/:id/actions` $\rightarrow$ Create Action Taken (staff/admin only).
- `PATCH /api/actions/:id` $\rightarrow$ Update Action Taken (staff/admin only, with conflict handling).
- `PATCH /api/staff/tickets/:id/status` $\rightarrow$ Permitted transition enforcement with `409 Conflict` on concurrent modification.

---

## 10. Acceptance Criteria (AC)

- **AC-01 (Create Action Taken by IT Staff):** Given an authenticated IT Staff member and a valid payload, when submitting `POST /api/tickets/:id/actions`, an Action Taken is persisted with `performedById` bound to the caller and returned with `201 Created`.
- **AC-02 (Requester Blocked from Creating Action Taken):** Given an authenticated Requester, when submitting `POST /api/tickets/:id/actions`, the request is rejected with `403 Forbidden`.
- **AC-03 (Requester View Permitted Actions Taken):** Given an authenticated Requester, when querying `GET /api/tickets/:id/actions` for a ticket they own, all recorded actions are returned.
- **AC-04 (Requester Blocked from Other's Actions Taken):** Given an authenticated Requester, when querying `GET /api/tickets/:id/actions` for a ticket owned by another user, the request returns `403 Forbidden` or `404 Not Found`.
- **AC-05 (Action Taken Follow-Up Validation):** Given an Action Taken payload with `followUpRequired: true` and an empty `followUpNote`, the server rejects the request with `400 Bad Request` and field error `followUpNote`.
- **AC-06 (Action Taken Collaborative Execution):** Given a ticket assigned to Staff Member A, when Staff Member B records an Action Taken, the action is successfully created with `performedById = Staff B`, preserving primary ticket assignment to Staff A.
- **AC-07 (Update Action Taken):** Given an existing Action Taken, when an authorized staff member submits updated fields via `PATCH /api/actions/:id`, the updated record is saved and returned.
- **AC-08 (Action Taken Concurrency Check):** Given an Action Taken update request with a stale `updatedAt` timestamp, the server responds with `409 Conflict`.
- **AC-09 (Permitted Ticket Status Transition):** Given an IT Staff member and a ticket in `In Progress` status, when requesting a transition to `Resolved`, the transition succeeds and updates `ticket.status`.
- **AC-10 (Illegal Ticket Status Transition Rejection):** Given an IT Staff member and a ticket in `New` status, when requesting a transition directly to `Closed`, the server rejects the change with `400 Bad Request`.
- **AC-11 (Requester Resolution Indication is Advisory):** Given a ticket owner submitting a resolution indication, `resolvedIndicated = true` is saved, while `ticket.status` remains unchanged.
- **AC-12 (Requester Dashboard Isolation & Accuracy):** Given an authenticated Requester, `GET /api/dashboards/requester` returns metrics and recent tickets reflecting solely their owned tickets.
- **AC-13 (Requester Dashboard Empty State):** Given an authenticated Requester with no tickets, the endpoint returns zero counts and an empty recent ticket list without errors.
- **AC-14 (IT Staff Dashboard Operational Metrics):** Given an IT Staff member, `GET /api/dashboards/staff` returns accurate aggregated counts for unassigned, assigned, and active statuses matching database records.
- **AC-15 (IT Staff Dashboard Forbidden to Requester):** Given an authenticated Requester, requesting `GET /api/dashboards/staff` returns `403 Forbidden`.
- **AC-16 (Administrator Dashboard Access):** Given an Administrator, requesting `GET /api/dashboards/staff` returns operational metrics along with user directory counts.
- **AC-17 (Dashboard Drill-Down Integrity):** Given a user clicking a dashboard metric card, the application navigates to the list view with the corresponding status/ownership filter pre-populated.
- **AC-18 (Responsive Design Compliance):** Given any Lab 4 screen viewed on Desktop (1280px), Tablet (768px), or Mobile (390px), no horizontal overflow or clipped controls occur.
- **AC-19 (Regression of Labs 1-3):** All authentication, attachment handling, public commenting, internal notes, and user administration features remain fully functional without regression.

---

## 11. Definition of Done (DoD)

- [ ] Sprint 4 Engineering Contract approved and published in `docs/lab-04/` (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`).
- [ ] Prisma schema migrated with `ActionTaken` model and relations without data loss.
- [ ] Idempotent seed data provisioned with multi-action tickets and verified non-zero/zero dashboard scenarios.
- [ ] Actions Taken backend APIs implemented with role authorization, performer attribution, and follow-up validation.
- [ ] Ticket lifecycle finite-state machine enforced on backend with safe conflict detection (`409 Conflict`).
- [ ] IT Staff and Requester Dashboards implemented with backend authoritative metric calculations and drill-down routing.
- [ ] IT Staff Ticket Detail UI updated with Actions Taken list, create, and edit modes; Requester Ticket Detail updated with read-only Actions Taken view.
- [ ] Full regression test suite passing across all Labs 1-3 capabilities.
- [ ] 100% of planned automated tests passing (Unit, API, UI, E2E).
- [ ] Zero horizontal overflow, high contrast focus states, and Zen Green design consistency verified across breakpoints.
- [ ] Code integrated via feature branch PRs into `lab4-staging` and documented in `reviewer.md`.

---

## 12. Technical Assumptions & Decisions

1. **Optimistic Locking via ISO Timestamp Matching:** To protect against concurrent edits without adding heavyweight locking servers, Action Taken updates and Ticket status transitions include the client's observed `updatedAt` ISO string. If the database `updatedAt` is more recent, a `409 Conflict` is returned with an actionable error message.
2. **Dashboard Query Performance:** Dashboard metrics utilize Prisma `groupBy` and `count` queries rather than loading full ticket entities into application memory. This ensures optimal performance even as ticket volume grows.
3. **Action Taken Date/Time Flexibility:** While `actionDateTime` defaults to the instant of entry (`now()`), staff may optionally specify an earlier time if recording work performed previously (e.g., earlier that morning during an onsite repair).
4. **Preservation of Append-Only Timeline Concept:** While individual Actions Taken can be edited to refine descriptions or log follow-up notes, deletion is prohibited (`DELETE` endpoint omitted) to guarantee an immutable audit trail of technical interventions.
