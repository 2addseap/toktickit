# Lab 3 Test Plan and Traceability Matrix

## 1. Test Strategy

To guarantee the integrity of real authentication, multi-role authorization, IT Staff operational workflows, communication segregation, and Administrator safeguards in Sprint 3, testing is structured across four rigorous layers:

1. **Unit Tests (Vitest):** Validate standalone domain logic, including password complexity evaluation, status transition matrix compliance, and role permission resolution.
2. **API & Authorization Integration Tests (Supertest):** Verify all REST endpoints against the live PostgreSQL database, ensuring strict enforcement of authentication tokens, password-change interception, role boundaries (403 Forbidden without data leaking), ticket queue queries, and administrator safety guardrails.
3. **UI Component Tests (Vitest + React Testing Library):** Validate client rendering, form input validation, field-level error messages, role-specific navigation, password checklists, and feedback states.
4. **End-to-End Tests (Playwright):** Verify full multi-role workflows in real browser environments, covering mandatory initial password changes, IT Staff queue and ticket lifecycle management, and Administrator user provisioning.

---

## 2. Planned Tests Table

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Planned Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-03, AC-04 | Password complexity validation | Requires $\ge 8$ chars, upper, lower, number/symbol | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **UNIT-02** | Unit | BR-16, AC-15 | Status transition matrix validator | Permits valid transitions; rejects disallowed jumps | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-01** | API | AC-01, FR-01 | `POST /api/auth/login` valid credentials | Returns 200 with JWT token and sanitized user profile | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **API-02** | API | AC-02, BR-01 | `POST /api/auth/login` inactive user | Returns 401 with generic `"Invalid email or password."` | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **API-03** | API | AC-03, BR-02 | User with `mustChangePassword = true` | Login returns flag; non-auth APIs return 403 `PASSWORD_CHANGE_REQUIRED` | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **API-04** | API | AC-04, BR-03 | `POST /api/auth/change-password` valid | Hashes new password, sets flag to false, restores normal access | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **API-05** | API | FR-03, BR-06 | `POST /api/auth/logout` | Returns 200 and invalidates current session | `server/tests/lab-03/auth.api.test.ts` | **Passed** |
| **API-06** | API | AC-05, BR-07 | Session-derived requester identity | `POST /api/tickets` ignores client `requesterId` and binds to session user | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-07** | API | AC-06, BR-09 | Requester cross-ticket access | Returns 403 when Requester A accesses Requester B's ticket | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-08** | API | AC-07, BR-14 | `PATCH /api/tickets/:id/resolve-indication` | Records `resolvedIndicated = true` without modifying ticket status | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-09** | API | AC-08, BR-17 | Public Comments access | Requester owner and IT Staff can retrieve and post public comments | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-10** | API | AC-09, BR-18 | Internal Notes blocked for Requester | Returns 403 Forbidden; zero note content leaked to Requester | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-11** | API | AC-10, BR-18 | Internal Notes for IT Staff / Admin | Returns 200/201; notes saved and retrieved with author attribution | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-12** | API | AC-11, FR-09 | `GET /api/staff/tickets` queue query | Supports search, status/priority filters, sort, and pagination | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| **API-13** | API | AC-12, BR-10 | Ticket Queue blocked for Requester | Returns 403 Forbidden when Requester accesses `/api/staff/tickets` | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-14** | API | AC-13, BR-12 | `PATCH /api/staff/tickets/:id/assign` | Assigns ticket to active IT Staff/Admin; rejects non-staff assignees | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-15** | API | AC-14, BR-13 | `PATCH /api/staff/tickets/:id/priority` | Updates operational `itPriority` while keeping `requestedPriority` intact | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-16** | API | AC-15, BR-16 | `PATCH /api/staff/tickets/:id/status` | Enforces transition matrix; rejects disallowed jumps with 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-17** | API | AC-16, FR-15 | `GET /api/admin/users` directory | Returns users with search and role filter for Administrator | `server/tests/lab-03/users-admin.api.test.ts` | **Passed** |
| **API-18** | API | AC-17, FR-16 | `POST /api/admin/users` create user | Provisions user with role and initial password (`mustChangePassword: true`) | `server/tests/lab-03/users-admin.api.test.ts` | **Passed** |
| **API-19** | API | AC-18, BR-25 | Duplicate email rejection | Returns 409 Conflict when creating/editing user with existing email | `server/tests/lab-03/users-admin.api.test.ts` | **Passed** |
| **API-20** | API | AC-19, BR-22 | Self-deactivation prevention | Returns 400 Bad Request if admin attempts to deactivate self | `server/tests/lab-03/users-admin.api.test.ts` | **Passed** |
| **API-21** | API | AC-20, BR-23 | Last active admin protection | Returns 400 Bad Request if deactivating the last active administrator | `server/tests/lab-03/users-admin.api.test.ts` | **Passed** |
| **API-22** | API | AC-21, BR-10 | Admin routes blocked for non-Admin | Returns 403 Forbidden when Requester or IT Staff access `/api/admin/*` | `server/tests/lab-03/authorization.api.test.ts` | **Passed** |
| **UI-01** | UI | AC-01, AC-02 | Login screen rendering & validation | Validates required email/password, shows spinner, renders errors | `client/tests/lab-03/Login.test.tsx` | **Passed** |
| **UI-02** | UI | AC-03, AC-04 | Change Password screen & checklist | Validates rules dynamically, submits new password, redirects | `client/tests/lab-03/ChangePassword.test.tsx` | **Passed** |
| **UI-03** | UI | AC-11 | Staff Ticket Queue data grid | Renders queue table, filter chips, search input, and pagination | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| **UI-04** | UI | AC-13, AC-14 | Staff Ticket Detail operational panel | Handles claim, reassign dropdown, IT Priority selector, status update | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-05** | UI | AC-08, AC-10 | Public Comments vs Internal Notes | Separate tabs, amber background for internal notes, append forms | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-06** | UI | AC-16, AC-19 | Admin User Management screen | Directory table, role filter, Add User modal, self-deactivation guard | `client/tests/lab-03/UserManagement.test.tsx` | **Passed** |
| **E2E-01** | E2E | AC-01, FR-03 | Full Authentication & Logout flow | Login with valid credentials, verify navbar identity, logout cleanly | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-02** | E2E | AC-03, AC-04 | Mandatory first-login password change | Initial password prompts change screen; new password enters app | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-03** | E2E | AC-11, AC-15 | IT Staff operational ticket workflow | Queue discovery, claim ticket, set priority, post notes, resolve ticket | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-04** | E2E | AC-16, AC-20 | Administrator user management lifecycle | Create user, verify in list, edit user, guardrail check, reset password | `e2e/lab-03/user-administration.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Mapped Automated Tests | Planned Status |
|---|---|---|---|
| **AC-01** | Valid credentials establish authenticated session and return user profile | `API-01`, `UI-01`, `E2E-01` | **Passed** (API & UI) |
| **AC-02** | Inactive accounts rejected with generic 401 Unauthorized | `API-02`, `UI-01` | **Passed** |
| **AC-03** | First-login password change intercepted on protected endpoints | `API-03`, `UI-02`, `E2E-02` | **Passed** (API & UI) |
| **AC-04** | Successful password change clears flag and restores normal access | `UNIT-01`, `API-04`, `UI-02`, `E2E-02` | **Passed** (API & UI) |
| **AC-05** | Requester operations strictly bound to session identity | `API-06` | Planned |
| **AC-06** | Cross-requester ticket and attachment access rejected (403/404) | `API-07` | Planned |
| **AC-07** | Requester can signal "Problem Appears Resolved" without mutating status | `API-08` | Planned |
| **AC-08** | Public Comments accessible to Requester owner, IT Staff, and Admin | `API-09`, `UI-05` | Planned |
| **AC-09** | Internal Notes strictly forbidden and hidden from Requester | `API-10` | Planned |
| **AC-10** | Internal Notes accessible only to IT Staff and Admin | `API-11`, `UI-05`, `E2E-03` | Planned |
| **AC-11** | IT Staff Ticket Queue with search, filters, sort, and pagination | `API-12`, `UI-03`, `E2E-03` | Planned |
| **AC-12** | Ticket Queue forbidden for Requester role (403 Forbidden) | `API-13` | Planned |
| **AC-13** | Ticket claim and reassignment to active staff | `API-14`, `UI-04`, `E2E-03` | Planned |
| **AC-14** | IT Priority management independent of Requested Priority | `API-15`, `UI-04`, `E2E-03` | Planned |
| **AC-15** | Strict status transition lifecycle enforcement | `UNIT-02`, `API-16`, `UI-04`, `E2E-03` | Planned |
| **AC-16** | Admin user directory with search and role filter | `API-17`, `UI-06`, `E2E-04` | **Passed** (API & UI) |
| **AC-17** | Admin user creation with initial password and forced reset flag | `API-18`, `UI-06`, `E2E-04` | **Passed** (API & UI) |
| **AC-18** | Duplicate email rejection on user creation and edit | `API-19`, `UI-06` | **Passed** |
| **AC-19** | Admin self-deactivation prevented | `API-20`, `UI-06`, `E2E-04` | **Passed** (API & UI) |
| **AC-20** | Last active administrator cannot be deactivated or demoted | `API-21`, `UI-06`, `E2E-04` | **Passed** (API & UI) |
| **AC-21** | Admin endpoints strictly forbidden for Requester and IT Staff | `API-22` | **Passed** |

---

## 4. Visual and Responsive Inspection Checklist

- [ ] **Desktop Viewport ($\ge 992\text{px}$):**
  - Navigation bar displays TokTickIT logo, role-specific nav items, user name, role badge, and Sign Out button.
  - IT Staff Ticket Queue displays full data table with sortable columns and filter bar.
  - IT Staff Ticket Detail shows operational panel and clearly distinguished Public Comments and Internal Notes tabs.
  - Admin User Management displays directory table and action buttons.
- [ ] **Tablet Viewport ($768\text{px} - 991\text{px}$):**
  - Tables adapt with horizontal overflow management or column condensing.
  - Filters wrap cleanly into a secondary row without layout breaking.
- [ ] **Mobile Viewport ($< 768\text{px}$):**
  - IT Staff Ticket Queue renders stacked card view with visible status and priority badges.
  - Forms stack vertically with $\ge 40\text{px}$ touch targets.
  - Modals adapt to full width with clear top close icons and sticky action buttons.
  - Zero horizontal page scrolling at $375\text{px}$ viewport width.
- [ ] **Design Token Consistency:**
  - Standard Zen Green colors used across buttons, links, and alerts.
  - Role badges: Requester (Blue `#E8F0FE`), IT Staff (Green `#EAF6EF`), Administrator (Amber `#FEF3D6`).
  - Internal Notes card utilizes soft-amber background (`#FFF9E6`) and gold border (`#F0C050`) to eliminate risk of posting confidential operational notes into public channels.

---

## 5. Test Execution Commands

```bash
# 1. Run all Server Unit, API, and Authorization Tests
npm --prefix server test

# 2. Run all Client Unit and UI Component Tests
npm --prefix client test

# 3. Run End-to-End Playwright Tests (when applicable)
npx playwright test
```
