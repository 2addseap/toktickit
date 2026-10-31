# Lab 4 — AI Use and Reflection

**LLM/agent used:** Antigravity (Google Gemini / Advanced Agentic Assistant)

---

## Selected Key Prompts (6–10)

| # | Prompt (Summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 4 stakeholder requirements and compile the Sprint 4 Engineering Contract (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) covering Actions Taken, Ticket status rules, role dashboards, and final hardening. | Defined 19 Acceptance Criteria (AC-01 to AC-19), 16 Business Rules (BR-01 to BR-16), 2 database architecture decisions, and test traceability matrix before writing implementation code. |
| 2 | Model the Actions Taken Prisma schema, database migration, and idempotent seed data covering multi-action tickets and dashboard edge cases. | Defined `ActionTaken` model linked 1-to-many with `Ticket` and `User` performer. Applied migration `add_actions_taken` without data loss and populated realistic idempotent seed tickets covering 0, 1, and multiple collaborative actions. |
| 3 | Implement Actions Taken REST APIs with performer auto-attribution, follow-up validation, and concurrency conflict handling. | Built `GET /api/tickets/:id/actions`, `POST /api/tickets/:id/actions`, and `PATCH /api/actions/:id` in `server/src/app.ts`. Enforced 403 for requesters on mutations, auto-bound `performedById`, validated follow-up notes, and added 409 conflict detection. |
| 4 | Implement Ticket Detail Actions Taken UI (create/edit modes, timeline, follow-up badge) and strictly enforce permitted FSM status transitions on frontend and backend. | Added the Actions Taken section to `StaffTicketDetail.tsx` and read-only view to `TicketDetail.tsx`. Implemented dynamic status transition dropdown adhering to `STATUS_TRANSITIONS` matrix and wired optimistic concurrency error handling. |
| 5 | Implement Requester and IT Staff Dashboard backend aggregation endpoints and frontend views with drill-down links and empty state handling. | Created `GET /api/dashboards/requester` and `GET /api/dashboards/staff` with authoritative PostgreSQL calculations. Built `RequesterDashboard.tsx` and `StaffDashboard.tsx` with responsive KPI cards that drill down into `MyTickets` and `StaffTicketQueue` with pre-applied filters. |
| 6 | Execute full-stack hardening, input retention on submission failure, legacy ticket safe-rendering, and verify complete regression of Labs 1 to 3 features. | Tested legacy tickets with 0 actions, verified form data retention on network/validation errors, and wrote `legacy-regression.api.test.ts` and `RegressionHardening.test.tsx` to ensure all previous lab features (auth, user management, comments, attachments) operate without regressions. |
| 7 | Develop automated E2E test suites covering multi-staff Actions Taken collaboration, advisory resolution gate, and role dashboard navigation. | Authored Playwright E2E test suites in `e2e/lab-04/` (`actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts`, `dashboards.spec.ts`), updated `docs/lab-04/tests.md` traceability matrix, and verified UI responsiveness under Zen Green tokens. |

---

## My Reflection

### Specification-Agent Collaboration
Using an AI specification agent during Sprint 4 significantly improved architectural foresight. Rather than diving into implementation ad-hoc, the AI helped structure a comprehensive engineering contract that clearly mapped business rules (such as follow-up note co-dependency and the finite-state machine transition matrix) to concrete acceptance criteria. This prevented ambiguities in how Requesters and IT Staff should interact with Actions Taken. The AI also helped clarify edge cases early, such as ensuring that legacy tickets created in earlier labs without actions would render gracefully without runtime crashes, and ensuring optimistic concurrency control was designed into both status updates and action updates.

### Coding-Agent Collaboration & TDD
Collaborating with the coding agent while strictly following Test-Driven Development (TDD) provided a high degree of confidence. For every capability—from the Prisma migration and seed to the REST endpoints and React components—unit and integration tests were written alongside the implementation. The agent excelled at generating robust edge-case tests, such as unauthorized access attempts by Requesters and concurrency conflict simulations returning HTTP 409. By maintaining strict discipline and verifying test suites at every issue boundary, we achieved 100% test pass rates across both frontend and backend suites, ensuring zero regression across the features developed throughout Labs 1 to 3.
