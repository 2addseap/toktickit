# Lab 2 — Peer Review Record

**Author:** Kawinpob Amnuaywittayakul — Student ID: 66070501004 — GitHub: @2addseap  
**Peer reviewer:** Korapin Manoprasertkoon — Student ID: 66070501007 — GitHub: @KorapinMan

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#18](https://github.com/2addseap/toktickit/pull/18) | feature/1-spec-and-test-plan | Approved & Merged |
| [#20](https://github.com/2addseap/toktickit/pull/20) | feature/2-requester-context | Approved & Merged |
| [#21](https://github.com/2addseap/toktickit/pull/21) | feature/3-create-ticket | Approved & Merged |
| [#22](https://github.com/2addseap/toktickit/pull/22) | feature/4-my-tickets | Approved & Merged |
| [#23](https://github.com/2addseap/toktickit/pull/23) | feature/5-ticket-detail | Approved & Merged |
| [#24](https://github.com/2addseap/toktickit/pull/24) | feature/6-visual-responsive-release | Approved & Merged |

**Reviewer comment I received:**
• Issue 1: "Specification covers all 13 FRs, 15 BRs, and 18 ACs with clear Zen Green color palette tokens and REST API contracts."
• Issue 2: "Prisma schema migrations and seed data work smoothly. Requester switcher in navbar functions as expected."
• Issue 3: "Ticket creation form handles client-side and server-side validation nicely. Multipart file dropzone is responsive."
• Issue 4: "Search debounce and filter dropdowns work responsively. Server-side pagination and table layout look clean."
• Issue 5: "Soft-removal popup requires minimum 3-character reason and prevents removed files from downloading. All security checks pass."
• Issue 6: "All 42 automated test suites (23 server, 19 client) pass cleanly. Documentation and visual verification are complete."

**How I responded:**
• Issue 1: "Verified alignment with stakeholder requirements and standardized ticket number format `TKT-YYYY-NNNNNN`."
• Issue 2: "Ensured inactive requesters are properly filtered out and header profile badge reflects active context."
• Issue 3: "Added busy spinner state during submission and preserved form values on validation errors."
• Issue 4: "Implemented desktop table and mobile card views with active attachment counts."
• Issue 5: "Configured HTTP 410 Gone status for soft-removed file downloads and added strikethrough styling."
• Issue 6: "Executed full test suites, verified responsive breakpoints, and compiled final release documentation."

## Pull Requests I reviewed for my partner
**My comment:**
• Issue 1: "Specifications and test traceability matrix are well structured and comprehensively documented."
• Issue 2: "Database models and seed scripts run idempotently. Requester selector UI is intuitive."
• Issue 3: "Create ticket endpoint handles file type restrictions and payload validation accurately."
• Issue 4: "Pagination metadata and multi-field keyword searching operate efficiently on the database layer."
• Issue 5: "Attachment lifecycle adheres strictly to compliance guidelines with non-destructive soft removal."
• Issue 6: "Automated test coverage is comprehensive across unit, API, and component test levels."

**Partner's response:**
• Issue 1: "Confirmed all acceptance criteria map directly to planned automated test suites."
• Issue 2: "Added error handling for database connection drops during requester initialization."
• Issue 3: "Implemented character counters and field-level inline error text below form controls."
• Issue 4: "Added clear filters button and empty state illustrations when query results yield zero tickets."
• Issue 5: "Secured attachment download endpoint to ensure strict cross-requester ownership isolation."
• Issue 6: "Consolidated all release artifacts and finalized Lab 2 documentation."

