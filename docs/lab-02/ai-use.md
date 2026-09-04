# Lab 2 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 2 instructions and generate Sprint Specification (`specification.md`) with 18 Acceptance Criteria and business rules. | Established the formal engineering contract for the Requester MVP including 13 FRs, 15 BRs, and DoD. |
| 2 | Design the Zen Green Design System and responsive UI specification (`ui-spec.md`) across Desktop, Tablet, and Mobile. | Specified exact color tokens (`#006B3C`, `#EAF6EF`, `#EDF2EE`), input heights, and 4 screen layouts. |
| 3 | Define REST API contract (`api-spec.md`) for requesters, tickets, pagination, and attachment soft-removal. | Created standardized endpoint request/response payloads, HTTP status codes, and security error formats. |
| 4 | Develop comprehensive Test Plan and Traceability Matrix (`tests.md`) mapping all ACs to Unit, API, UI, and E2E tests. | Structured test IDs and planned test file paths mapping 1-to-1 with acceptance criteria. |
| 5 | Implement Development Requester Context: Prisma schema models, idempotent seed data, and Selection modal screen. | Added `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, `Attachment` tables and header context switcher. |
| 6 | Implement Create Ticket screen, backend `POST /api/tickets`, Zen Green form validation, and multipart file uploads. | Generated unique Ticket Number (`TKT-YYYY-NNNNNN`), inline error text, and confirmation screen. |
| 7 | Implement My Tickets list with search, filter, sort, pagination, and strict cross-requester data isolation. | Built `GET /api/tickets`, responsive desktop table, mobile card layout, and 300ms search debounce. |
| 8 | Implement Ticket Detail view, attachment download, and soft-removal modal with mandatory reason. | Enforced HTTP 410 Gone on removed files, disabled downloads, and recorded removal reason/timestamp. |
| 9 | Perform responsive verification, visual inspection checklist, and automated test suite execution. | Verified 42 automated tests (23 server, 19 client) passing at 100% and finalized Lab 2 documentation. |

## Reflection
Applying Spec-Driven Development (Spec DD) at the beginning of Sprint 2 allowed us to establish clear business rules, relational database schemas, REST API contracts, and acceptance criteria before writing any application code. 

By decomposing the sprint into 6 modular GitHub issues and feature branches, each increment was built systematically—starting with development session identity, moving to ticket submission and paginated browsing, and culminating in secure attachment lifecycle management with soft removal. AI assistance accelerated test-driven verification across unit, API, and component testing layers, resulting in 42 automated tests with 100% pass rate and zero regressions.

