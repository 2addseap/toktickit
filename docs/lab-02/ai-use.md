# Lab 2 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 2 instructions and generate Sprint Specification (`specification.md`) with 18 Acceptance Criteria and business rules. | Established the formal engineering contract for the Requester MVP including FRs, BRs, and DoD. |
| 2 | Design the Zen Green Design System and responsive UI specification (`ui-spec.md`) across Desktop, Tablet, and Mobile. | Specified exact color tokens, input heights, button hierarchy, and screen layouts for all 4 screens. |
| 3 | Define REST API contract (`api-spec.md`) for requesters, tickets, pagination, and attachment soft-removal. | Created standardized endpoint request/response payloads, HTTP status codes, and error formats. |
| 4 | Develop comprehensive Test Plan and Traceability Matrix (`tests.md`) mapping all ACs to Unit, API, UI, and E2E tests. | Structured test IDs and planned test file paths matching the required repository increment. |
| 5 | Implement Development Requester Context (Database models, seed data, and Selection screen). | *(To be populated during Issue 2 implementation)* |
| 6 | Implement Create Ticket screen, backend endpoint, Zen Green form validation, and file uploads. | *(To be populated during Issue 3 implementation)* |
| 7 | Implement My Tickets list with search, filter, sort, pagination, and cross-requester isolation. | *(To be populated during Issue 4 implementation)* |
| 8 | Implement Ticket Detail view, attachment download, and soft-removal modal with mandatory reason. | *(To be populated during Issue 5 implementation)* |
| 9 | Perform responsive verification, visual inspection checklist, and Playwright screenshot capture. | *(To be populated during Issue 6 implementation)* |

## Reflection
Applying Spec-Driven Development (Spec DD) at the beginning of Sprint 2 allowed us to define clear business rules, data schemas, API contracts, and acceptance criteria before writing any application code. Having an explicit contract prevents scope creep and ensures that multi-requester ownership boundaries and attachment soft-removal rules are rigorously planned.
