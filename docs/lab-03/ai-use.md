# Lab 3 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash)

---

## Selected Key Prompts (6–10)

| # | Prompt (Summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 3 requirements and generate Sprint 3 Engineering Contract (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) covering authentication, roles, IT staff workflow, and user administration. | Established the formal engineering contract, 21 Acceptance Criteria (AC-01 to AC-21), 25 Business Rules (BR-01 to BR-25), and comprehensive test traceability before writing application code. |
| 2 | Design the Zen Green Design System extensions and responsive layout specifications for Login, Password Change, Queue, Staff Ticket Detail, and User Management. | Specified token values, component layouts across Desktop, Tablet, and Mobile viewports, and visual segregation rules for internal operational notes. |
| 3 | Plan and implement database migration from Lab 2 Requester model to unified `User` model with roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) and password credentials while preserving all existing tickets and attachments. | Generated and applied Prisma schema changes and executed idempotent seed provisioning for active/inactive accounts across all three roles. |
| 4 | Implement enterprise authentication endpoints (`/api/auth/login`, `logout`, `me`, `change-password`) with bcrypt hashing, JWT issuance, and mandatory first-login password change interception. | Developed secure authentication middleware and frontend AuthContext enforcing password change guardrail before accessing any application screen. |
| 5 | Implement Administrator User Management API and UI (`UserManagement.tsx`) with search, role filters, user creation, account editing, and initial password reset. | Added server-side safety invariants preventing administrator self-deactivation and demotion/deactivation of the last active administrator. |
| 6 | Implement IT Staff Shared Ticket Queue (`GET /api/staff/tickets`) with real-time text search, multi-criteria filtering, sortable columns, and pagination. | Created `StaffTicketQueue.tsx` with responsive desktop data table and mobile card view, with 403 Forbidden enforcement against Requester access. |
| 7 | Implement IT Staff Operational Controls on Ticket Detail: status lifecycle transition matrix (`STATUS_TRANSITION_MATRIX`), IT Priority adjustment, and ticket claiming/reassignment. | Developed `StaffTicketDetail.tsx` allowing staff to claim/reassign tickets, adjust operational priority independently of requested priority, and enforce strict status transition rules. |
| 8 | Implement Dual-Tier Commenting: Public Comments visible to Requester and Staff, and confidential Internal Notes strictly restricted to IT Staff and Administrators. | Enforced 403 Forbidden on Requester access to `/api/tickets/:id/notes`, and created distinct visual interfaces (green for public comments vs. amber card `#FFF9E6` with gold border `#F0C050` and warning header for internal notes). |
| 9 | Implement Requester Resolution Indication flow ("Problem Appears Resolved") on Requester Ticket Detail and prominent verification callout banner on IT Staff Ticket Detail. | Added `PATCH /api/tickets/:id/resolve-indication` and connected notification banner to ensure IT staff formally verify and transition status to Resolved/Closed. |
| 10 | Execute complete automated test suites (Server Supertest + Client Vitest/RTL) and verify 100% test coverage with zero regressions on Lab 1 and Lab 2 functionality. | Validated all 89 server tests and 47 client tests (136 total tests) passing cleanly, ensuring robust quality and contract compliance. |

---

## My Reflection

Sprint 3 presented a substantial leap in software complexity compared to previous sprints. By transitioning from a simulated development requester switcher to a real multi-role identity and access management system, we had to strictly enforce server-side security invariants rather than relying on frontend view restrictions.

### Specification-Agent Use
Utilizing the AI specification agent at the outset (Spec-DD) was critical. It enabled us to carefully define the 25 business rules and 21 acceptance criteria prior to any coding. In particular, formalizing the Status Transition Matrix (`STATUS_TRANSITION_MATRIX`), the Last Active Administrator protection rule, and the dual-tier commenting boundary upfront prevented architectural rework during implementation. The AI helped clarify ambiguous edge cases, such as ensuring that a Requester indicating problem resolution does not prematurely mutate ticket status to `Resolved` without IT Staff verification.

### Coding-Agent Use
Pair programming with the AI coding agent accelerated both Test-Driven Development (Test-DD) and component implementation. The agent generated precise Supertest integration suites for role-based authorization, testing boundary conditions (e.g., self-deactivation attempts, cross-requester data access, and unauthorized internal note fetching). On the frontend, the agent adhered closely to the established Zen Green design tokens and responsive standards, creating desktop tables and mobile card layouts without visual clipping or horizontal overflow.

In conclusion, combining Spec-Driven Development with AI-assisted test automation allowed us to deliver a secure, robust, and accessible multi-role IT service desk with 100% automated test coverage and zero regressions.
