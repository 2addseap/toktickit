# Lab 4 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash)

---

## Selected Key Prompts (6–10)

| # | Prompt (Summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 4 stakeholder requirements and compile the Sprint 4 Engineering Contract (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) covering Actions Taken, Ticket status rules, role dashboards, and final hardening. | Defined 19 Acceptance Criteria (AC-01 to AC-19), 15 Business Rules (BR-01 to BR-15), 2 database architecture decisions, and test traceability matrix before writing implementation code. |
| 2 | Model the Actions Taken Prisma schema, database migration, and idempotent seed data covering multi-action tickets and dashboard edge cases. | Defined `ActionTaken` model linked 1-to-many with `Ticket` and `User` performer. Applied migration `add_actions_taken` without data loss and populated realistic idempotent seed tickets covering 0, 1, and multiple collaborative actions. |
| 3 | Implement Actions Taken REST APIs with performer auto-attribution, follow-up validation, and concurrency conflict handling. | Built `GET /api/tickets/:id/actions`, `POST /api/tickets/:id/actions`, and `PATCH /api/actions/:id` in `server/src/app.ts`. Enforced 403 for requesters on mutations, auto-bound `performedById`, validated follow-up notes, and added 409 conflict detection. |
| 4 | Implement Ticket Detail Actions Taken UI and strictly enforce permitted status transitions on the frontend. | To be updated in Issue 3. |
| 5 | Implement Requester and IT Staff Dashboard APIs and frontend views with drill-down links and empty state handling. | To be updated in Issue 4. |
| 6 | Execute full-stack hardening, remove unused artifacts, and verify complete regression of Labs 1 to 3 features. | To be updated in Issue 5. |
| 7 | Develop Playwright E2E suites for Actions Taken flow, status resolution, and dashboard metrics. | To be updated in Issue 6. |

---

## My Reflection

*To be finalized upon completion of Lab 4 implementation and regression testing.*
