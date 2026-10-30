# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy

To guarantee the reliability, security, and regression resilience of Lab 4, testing is organized into four complementary tiers practicing strict **Test-Driven Development (TDD)**:

1. **Unit & Domain Rule Tests (Vitest):** Validate isolated business logic, including the Ticket Finite-State Machine transition validator, follow-up note co-dependency rules, and dashboard metric mathematical aggregation functions.
2. **API & Integration Tests (Supertest + Live PostgreSQL):** Verify all REST endpoints against the migrated database. Test coverage includes role authorization barriers (Requesters blocked from staff dashboards and Action Taken mutations), automatic performer attribution, optimistic concurrency conflicts (`409 Conflict`), and query accuracy.
3. **UI Component Tests (Vitest + React Testing Library):** Validate interactive React components: Requester Dashboard, IT Staff Dashboard, Actions Taken panel (list, create, edit forms), status transition dropdown filtering, validation feedback, and empty states.
4. **End-to-End Tests (Playwright):** Verify full cross-role workflows in real browsers: creating an action taken, multi-staff collaboration, status progression through resolution gate, dashboard KPI updates, and full Labs 1-3 regression.

---

## 2. Planned Tests Table

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Planned Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-08, AC-10 | Status transition matrix validator | Permits valid transitions; rejects invalid jumps with detailed error | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **UNIT-02** | Unit | BR-04, AC-05 | Follow-up note co-dependency | Rejects `followUpRequired=true` with empty note; allows when false | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-01** | API | AC-01, FR-02 | `POST /api/tickets/:id/actions` by IT Staff | Persists Action Taken with `performedById` bound to caller, returns 201 | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-02** | API | AC-02, BR-03 | `POST /api/tickets/:id/actions` by Requester | Returns 403 Forbidden; prevents non-staff from logging actions | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-03** | API | AC-03, FR-04 | `GET /api/tickets/:id/actions` for owned ticket | Requester successfully reads all Actions Taken on owned ticket | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-04** | API | AC-04, BR-03 | `GET /api/tickets/:id/actions` for other's ticket | Requester receives 403 Forbidden; zero action data leaked | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-05** | API | AC-06, BR-02 | Collaborative execution by multiple staff | Staff B logs Action Taken on ticket owned by Staff A; both preserved | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-06** | API | AC-07, FR-03 | `PATCH /api/actions/:id` update action | Updates description, result, follow-up flags; returns 200 | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-07** | API | AC-08, FR-09 | Concurrency conflict on Action update | Stale `clientUpdatedAt` returns 409 Conflict | `server/tests/lab-04/actions-taken.api.test.ts` | **Passed** |
| **API-08** | API | AC-09, BR-09 | Permitted status transition to `Resolved` | IT Staff transitions `In Progress` $\rightarrow$ `Resolved`; status updated | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-09** | API | AC-10, BR-08 | Illegal status jump rejection | Staff attempting `New` $\rightarrow$ `Closed` receives 400 Bad Request | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-10** | API | AC-11, BR-10 | Advisory Requester resolution signal | Sets `resolvedIndicated = true` without altering `ticket.status` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-11** | API | AC-12, FR-10 | `GET /api/dashboards/requester` metrics | Returns exact counts for open, in-progress, waiting, and resolved | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-12** | API | AC-12, FR-11 | Requester dashboard isolation boundary | Never counts tickets of other requesters | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-13** | API | AC-13, FR-10 | Requester dashboard empty state | Returns 0 for all metrics and empty recent list when no tickets exist | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-14** | API | AC-14, FR-12 | `GET /api/dashboards/staff` metrics | Returns unassigned, assigned, and status counts matching database | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-15** | API | AC-15, BR-12 | Staff dashboard blocked for Requester | Requester calling `/api/dashboards/staff` receives 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-16** | API | AC-16, FR-13 | Administrator dashboard user stats | Admin receives staff operational metrics plus user directory counts | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **UI-01** | UI | AC-01, AC-05 | Actions Taken list & create form | Renders existing actions; validates follow-up requirement; submits | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-02** | UI | AC-03, AC-04 | Requester Actions Taken read-only | Displays actions but hides Add/Edit action buttons from DOM | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-03** | UI | AC-09, AC-10 | Permitted status transition dropdown | Dropdown shows only valid transitions based on current status | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-04** | UI | AC-12, AC-13 | Requester Dashboard view | Renders 4 KPI cards, recent tickets list, and empty state cleanly | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-05** | UI | AC-14, AC-17 | IT Staff Dashboard view & drill-down | Renders 5 KPI cards, urgent tickets list, and triggers drill-downs | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-06 | Actions Taken multi-staff flow | Staff A claims, Staff B logs action, verify timeline displays both | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-09, AC-11 | Ticket resolution & lifecycle flow | Requester indicates resolution; staff formally transitions to Resolved | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-03** | E2E | AC-12, AC-14 | Role dashboard and drill-down navigation | Verify dashboard KPI cards update after tickets are created/updated | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **REG-01** | Regression| AC-19 | Labs 1-3 full regression suite | All previous unit, API, UI, and auth test suites pass with 0 errors | `server/tests/` & `client/tests/` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Mapped Tests |
|---|---|---|
| **AC-01** | Create Action Taken by IT Staff | `API-01`, `UI-01`, `E2E-01` | **Passed (API)** |
| **AC-02** | Requester Blocked from Creating Action Taken | `API-02` | **Passed (API)** |
| **AC-03** | Requester View Permitted Actions Taken | `API-03`, `UI-02` | **Passed (API)** |
| **AC-04** | Requester Blocked from Other's Actions Taken | `API-04`, `UI-02` | **Passed (API)** |
| **AC-05** | Action Taken Follow-Up Validation | `UNIT-02`, `UI-01` | **Passed (Unit/API)** |
| **AC-06** | Action Taken Collaborative Multi-Staff Execution | `API-05`, `E2E-01` | **Passed (API)** |
| **AC-07** | Update Existing Action Taken | `API-06` | **Passed (API)** |
| **AC-08** | Action Taken Concurrency Conflict Handling | `API-07` | **Passed (API)** |
| **AC-09** | Permitted Ticket Status Transition to Resolved | `API-08`, `UI-03`, `E2E-02` |
| **AC-10** | Illegal Ticket Status Transition Rejection | `UNIT-01`, `API-09`, `UI-03` |
| **AC-11** | Advisory Requester Resolution Indication | `API-10`, `E2E-02` |
| **AC-12** | Requester Dashboard Isolation & Accuracy | `API-11`, `API-12`, `UI-04`, `E2E-03` |
| **AC-13** | Requester Dashboard Empty State | `API-13`, `UI-04` |
| **AC-14** | IT Staff Dashboard Operational Metrics | `API-14`, `UI-05`, `E2E-03` |
| **AC-15** | Staff Dashboard Blocked for Requester | `API-15` |
| **AC-16** | Administrator Dashboard Access & User Stats | `API-16` |
| **AC-17** | Dashboard Drill-Down Integrity | `UI-05`, `E2E-03` |
| **AC-18** | Responsive Design Compliance across Breakpoints | `UI-04`, `UI-05`, Visual Inspection |
| **AC-19** | Full Regression of Labs 1-3 Features | `REG-01` |
