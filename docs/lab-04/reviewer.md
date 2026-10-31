# Lab 4 — Peer Review Record

**Author:** Kawinpob Amnuaywittayakul — Student ID: 67070503403 — GitHub: @2addseap  
**Peer reviewer:** Korapin Manoprasertkoon — Student ID: 67070503458 — GitHub: @alwaysbt

---

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Base Branch | Reviewer verdict |
|:---|:-------|:------------|:-----------------|
| [#47](https://github.com/2addseap/toktickit/pull/47) | `feature/1-sprint4-contract` | `lab4-staging` | Approved & Merged |
| [#48](https://github.com/2addseap/toktickit/pull/48) | `feature/2-actions-foundation` | `lab4-staging` | Approved & Merged |
| [#49](https://github.com/2addseap/toktickit/pull/49) | `feature/3-ticket-workflow-actions-ui` | `lab4-staging` | Approved & Merged |
| [#50](https://github.com/2addseap/toktickit/pull/50) | `feature/4-role-dashboards` | `lab4-staging` | Approved & Merged |
| [#51](https://github.com/2addseap/toktickit/pull/51) | `feature/5-final-hardening` | `lab4-staging` | Approved & Merged |
| [#52](https://github.com/2addseap/toktickit/pull/52) | `feature/6-e2e-release` | `lab4-staging` | Pending Review |

### Reviewer comments I received:
• **Issue 1:** "I reviewed your Sprint 4 engineering contract and specification files. The documentation is exceptionally detailed and clear. The business rules for Actions Taken, the Finite State Machine transition matrix, dashboard query specifications, and the test traceability matrix completely align with Lab 4 requirements. Approved and ready to merge!"  
• **Issue 2:** "I reviewed the Actions Taken foundation implementation. The database migration and seed data with multi-action scenarios work cleanly without data loss. The REST APIs enforce proper role authorization, automatic performer attribution, and follow-up co-dependency validation. All automated tests pass without issues. Approved to merge into lab4-staging!"  
• **Issue 3:** "I reviewed the Ticket Workflow and Actions Taken UI components. The Actions Taken area in Staff Ticket Detail allows creating and editing technical interventions with clear follow-up indicators and optimistic concurrency conflict handling. Requester view properly enforces read-only visibility without edit buttons. The status transition dropdown accurately follows the FSM rules. Approved to merge!"  
• **Issue 4:** "I reviewed the role dashboards. The Requester Dashboard provides clear KPI cards and recent ticket list with strict requester data isolation. The IT Staff Dashboard provides comprehensive operational metrics and urgent ticket lists, with admin-only user stats. Drill-down filtering into My Tickets and Ticket Queue works smoothly. All test suites pass. Approved to merge!"  
• **Issue 5:** "I reviewed the final hardening and regression pass. Legacy tickets with zero actions are handled gracefully without errors. Form inputs are preserved during recoverable network/validation errors, and the entire regression test suite across Labs 1 through 3 passes cleanly. Approved to merge!"  
• **Issue 6:** "I reviewed your final end-to-end test suites, visual accessibility verification, and release documentation. All cross-role workflows, dashboard drill-downs, and lifecycle transitions are fully covered and verified. The Zen Green design system is consistent across breakpoints. Excellent work on completing Lab 4! Approved to merge!"  

### How I responded:
• **Issue 1:** "Thanks for the review! Moving on to Issue 2 to implement the database increment and foundational APIs."  
• **Issue 2:** "Thank you for the verification. Proceeding to Issue 3 to build the Actions Taken UI and ticket workflow transitions."  
• **Issue 3:** "Thanks for the thorough review. Moving forward to Issue 4 to implement the role dashboards and metrics."  
• **Issue 4:** "Thank you for reviewing the dashboards! Starting Issue 5 for final hardening, error protection, and legacy regression."  
• **Issue 5:** "Thanks for the quick review. Proceeding to Issue 6 to finalize E2E release integration and verification."  
• **Issue 6:** "Thank you for all your valuable reviews throughout Sprint 4! Merging into lab4-staging and preparing the final release to main."  

---

## Pull Requests I reviewed for my partner

### My comments:
• **Issue 1:** "LGTM! The Sprint 4 engineering contract covers all required sections: business rules BR-01 to BR-16, FSM status transitions, optimistic concurrency strategy, and test traceability for AC-01 through AC-19. Approved to merge into lab4-staging."  
• **Issue 2:** "Reviewed and verified the changes for Issue 2:
1. Prisma migration adds `actions_taken` table with proper foreign keys and indexes.
2. Idempotent seed populates tickets with zero, one, and multi-staff actions.
3. API endpoints (`POST /api/tickets/:id/actions`, `PATCH /api/actions/:id`, `GET /api/tickets/:id/actions`) enforce RBAC and follow-up co-dependency.
4. All automated unit and API tests pass cleanly.
Approved to merge into lab4-staging."  
• **Issue 3:** "Verified the Actions Taken UI and workflow status transitions:
1. Staff Ticket Detail displays Actions Taken table with date, description, result, performer, follow-up flags, and attachment notes.
2. Add/Edit action forms validate co-dependency and handle 409 conflict.
3. Requester Ticket Detail enforces read-only access.
4. Status dropdown restricts transitions strictly to permitted FSM targets.
5. All UI tests pass. Approved to merge into lab4-staging."  
• **Issue 4:** "Verified role dashboards and drill-down navigation:
1. `GET /api/dashboards/requester` and `GET /api/dashboards/staff` calculate metrics authoritatively from the database.
2. Requester isolation prevents cross-account data leaks.
3. KPI cards drill down into pre-filtered list views seamlessly.
4. All dashboard API and component tests pass. Approved to merge into lab4-staging!"  
• **Issue 5:** "Verified final hardening and legacy regression:
1. Legacy tickets without Actions Taken render cleanly without runtime exceptions.
2. Form protection preserves entered data upon submission failure.
3. Full regression tests for Labs 1-3 (auth, attachments, comments, user management) pass 100%.
Approved to merge into lab4-staging!"  
• **Issue 6:** "Final release integration verified! E2E workflow tests cover Actions Taken multi-staff collaboration, requester advisory resolution, FSM status enforcement, and dashboard drill-down. Visual consistency and responsive design under Zen Green language verified on desktop, tablet, and mobile. Ready for final staging merge and main release."  

### Partner's response:
• **Issue 1:** "Thank you for the detailed feedback! I will strictly follow this engineering specification during the implementation sprints."  
• **Issue 2:** "Thanks for verifying! Proceeding to implement the frontend Actions Taken UI and status transitions."  
• **Issue 3:** "Appreciate the review! Starting work on the Requester and IT Staff role dashboards for Issue 4."  
• **Issue 4:** "Thank you for the review! All dashboard metrics and drill-down links confirmed working. Starting Issue 5."  
• **Issue 5:** "Thanks for confirming the hardening passes and legacy test suites! Moving on to Issue 6 to finalize the release."  
• **Issue 6:** "Thank you for the thorough verification and collaboration across all sprints! Preparing final submission."  
