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
| [#52](https://github.com/2addseap/toktickit/pull/52) | `feature/6-e2e-release` | `lab4-staging` | Approved & Merged |

### Reviewer comments I received:
• **Issue 1:** "I reviewed your Sprint 4 engineering contract. The documentation is clear and well-organized, thoroughly defining the rules for the new Actions Taken feature and the dashboard metrics. Your Acceptance Criteria and testing plan provide a solid foundation for the rest of the sprint. Everything looks great, so I am approving this pull request to be merged!"  
• **Issue 2:** "I reviewed your backend setup for the Actions Taken feature. The database changes and seed data look great, and the new APIs work exactly as expected. You did a great job securing the endpoints so only permitted IT Staff can make edits, and the conflict handling to prevent accidental overwrites is a very important safety addition. Your tests are solid and passing perfectly. Everything is ready to go, so I am approving this pull request to be merged!"  
• **Issue 3:** "I reviewed your updates to the Ticket Detail screen and the new Actions Taken UI. The interface for adding and editing actions looks clean and correctly captures all the necessary fields. Your role-based restrictions are working perfectly, correctly preventing Requesters from making unauthorized edits. The updated status dropdowns effectively guide users through the permitted workflow transitions, and the automatic UI refresh makes it feel very responsive. The tests are thorough and passing, so I am approving this pull request to be merged!"  
• **Issue 4:** "I reviewed the new Requester and IT Staff dashboards. The metric cards provide a great operational overview, and the drill-down links make navigating to specific queues very intuitive. You did an excellent job securing the backend queries so Requesters only see their own tickets, and the empty states handle edge cases gracefully. The tests confirming the dashboard calculations look solid and are passing perfectly. I am approving this pull request to be merged!"  
• **Issue 5:** "I reviewed your final hardening updates and regression tests. The application looks incredibly polished now that the temporary UI elements and console errors have been cleared out. It is great to see that all of our previous work, like the admin user management and file attachments, is still functioning flawlessly without any conflicts from the new features. Your regression tests provide excellent peace of mind that the legacy data is safe. Everything is running smoothly, so I am approving this pull request to be merged!"  
• **Issue 6:** "I reviewed your final E2E tests and release integration steps. The automated tests perfectly capture the new Actions Taken workflows and dashboard navigation, ensuring the whole system works together seamlessly from start to finish. Your visual and accessibility checks confirm that the Zen Green design looks great and functions correctly across all screen sizes. The final PDF and submission files are complete and well-organized. Outstanding work on completing this final lab! I am approving this pull request to be merged."  

### How I responded:
• **Issue 1:** "Thanks for the review. I'll continue to the next issue!"  
• **Issue 2:** "Thanks for the good review. I'll keep this up and continue till I finish this lab."  
• **Issue 3:** "Thanks for the review. I'll resume editing TockTickIT and complete this assignment."  
• **Issue 4:** "Thanks for the review. Let me continue to issue 5. More than halfway done!!!."  
• **Issue 5:** "Thanks for the review. I'll proceed to the last issue now."  
• **Issue 6:** "Thanks for all the help and all the review you did for me. I'll merge to main in the final step soon."  

---

## Pull Requests I reviewed for my partner

### My comments:
• **Issue 1:** "Reviewed the Sprint 4 engineering contract and test plan files across docs/lab-04/. The specification is comprehensive and aligns with the Lab 4 handout requirements. Everything looks solid and complies with the Spec-DD requirement. Approved to merge into lab4-staging!"  
• **Issue 2:** "I’ve reviewed the backend updates for Issue 2, and everything looks good. The ActionTaken model and indexes were cleanly added to Prisma without affecting existing lab data, and the seed script runs smoothly. The API endpoints handle role permissions correctly—restricting requesters to read-only access on their own tickets—and the follow-up note validation works as expected. All Lab 4 tests pass with zero regressions, so this is approved to merge into lab4-staging!"  
• **Issue 3:** "Reviewed the frontend changes for Issue 3. The ActionsTakenSection follows the Zen Green design with responsive desktop table and mobile card layouts. Role-based access works correctly, keeping Requesters in read-only mode. Add/Edit modals enforce all required validations, including conditional follow-up notes.
Successfully integrated into both Staff and Requester ticket details with live count updates. All 5 component tests and 43 client tests pass with zero regressions.
Approved to merge into lab4-staging!"  
• **Issue 4:** "Reviewed feature/4-ticket-workflow against Lab 4 specifications. Verified that status transitions, role-based permissions, resolution handling, and concurrency controls work as expected.
All backend and frontend tests pass with no regressions. The implementation follows the requirements and Zen Green design system.
Merge Summary: Workflow is complete, tested, and ready for integration. Approved to merge into lab4-staging!"  
• **Issue 5:** "Verified that requester dashboards correctly isolate user data, staff dashboards enforce role-based access and display accurate operational metrics, and administrator dashboards include additional user statistics. Metric cards also navigate correctly to their respective filtered ticket lists. The tests passing overall and no regressions. The implementation meets the requirements and follows the Zen Green design system. Approved to merge into lab4-staging!"  
• **Issue 6:** "All Playwright E2E tests and screenshot capture suites passed successfully. Responsive screenshots across Desktop, Tablet, and Mobile confirm consistent UI quality and adherence to the Zen Green design system.
All 154 automated tests pass with zero regressions across Labs 1–4. Documentation (reviewer.md and ai-use.md) and screenshot evidence are complete and verified."  

### Partner's response:
• **Issue 1:** "Thank you for the review! All feedback is noted. Merging PR into lab4-staging now, and I will strictly follow this contract and test plan as we begin implementation with Issue 2"  
• **Issue 2:** "Thank you for verifying the backend APIs, authorization checks, and database seeds! Merging into lab4-staging now. Moving on to Issue 3 to integrate the Actions Taken UI and responsive Zen Green controls on Ticket Detail."  
• **Issue 3:** "Thank you for verifying the Actions Taken UI and responsive behavior! Merging PR #3 into lab4-staging now. Ready to proceed with Issue 4 to implement the formal Ticket status transition matrix, resolution gate, and concurrency protection"  
• **Issue 4:** "Thank you for the review! All status transition invariants and concurrency collision handlers are verified. Merging feature/4-ticket-workflow into lab4-staging. Moving forward to Issue 5: Role Dashboards."  
• **Issue 5:** "Thank you for the thorough review! All role dashboard metrics, access controls, and drill-down filters are verified and passing. Merging feature/5-role-dashboards into lab4-staging. Proceeding to Issue 6: E2E Playwright Verification, Responsive Evidence & Final Release Hardening."  
• **Issue 6:** "Thank you for the verification and great teamwork throughout Sprint 4! All 154 automated tests pass and responsive screenshot evidence is captured. Preparing the final release PR to main!"  
