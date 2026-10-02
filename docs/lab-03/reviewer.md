# Lab 3 — Peer Review Record

**Author:** Kawinpob Amnuaywittayakul — Student ID: 67070503403 — GitHub: @2addseap  
**Peer reviewer:** Korapin Manoprasertkoon — Student ID: 67070503458 — GitHub: @alwaysbt

---

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Base Branch | Reviewer verdict |
|:---|:-------|:------------|:-----------------|
| [#33](https://github.com/2addseap/toktickit/pull/33) | `feature/1-sprint3-contract` | `lab3-staging` | Approved & Merged |
| [#34](https://github.com/2addseap/toktickit/pull/34) | `feature/2-auth-foundation` | `lab3-staging` | Approved & Merged |
| [#35](https://github.com/2addseap/toktickit/pull/35) | `feature/3-admin-user-management` | `lab3-staging` | Approved & Merged |
| [#36](https://github.com/2addseap/toktickit/pull/36) | `feature/4-it-staff-ticket-queue` | `lab3-staging` | Approved & Merged |
| [#37](https://github.com/2addseap/toktickit/pull/37) | `feature/5-staff-ticket-detail-workflow` | `lab3-staging` | Approved & Merged |
| [#38](https://github.com/2addseap/toktickit/pull/38) | `feature/6-release-integration` | `lab3-staging` | Approved & Merged |

### Reviewer comments I received:
• **Issue 1:** "I reviewed your Sprint 3 engineering contract. The documents are clear and well-organized. You did a great job defining the rules for user roles, your testing plan, and the database changes. This completely covers the requirements for this issue. I am approving this pull request, and it is ready to merge!"  
• **Issue 2:** "I reviewed your login features and database changes. The new authentication setup works well, and the forced password change for first-time users is running smoothly. Your server-side security checks and user roles are set up correctly, keeping the data safe. The code is clean and all tests pass. Everything looks great, so I am approving this pull request to be merged!"  
• **Issue 3:** "I reviewed the new Administrator User Management screen and APIs. The layout is clean, and the user list, search, and edit features work perfectly. It is great to see that the safety rules are working, especially the checks that stop non-admins from accessing the page and prevent admins from locking themselves out. Your tests look solid and the code is very easy to read. Everything works exactly as expected, so I am approving this pull request to be merged!"  
• **Issue 4:** "I reviewed the updates to the Requester screens. It is great to see the old test selector removed and the real user accounts working perfectly for tickets and files. The new Public Comments and the action to mark a problem as resolved are working exactly as expected. Your regression tests prove that user data is properly protected. Great work! I am approving this pull request to be merged."  
• **Issue 5:** "I reviewed the new IT Staff screens. The Ticket Queue looks great, and the search, sorting, and pagination make it very easy to navigate. The Ticket Detail page works perfectly for claiming tickets and updating statuses. Good job making sure the Internal Notes are kept strictly private from Requesters. The code is clean and your tests look solid. Everything works as expected, so I am approving this pull request to be merged!"  
• **Issue 6:** "I reviewed your final E2E tests and the visual checks. The automated tests work perfectly and prove that all the user roles work together from start to finish. The design looks great and works well on all screen sizes. Your final files and PDF are complete and ready to turn in. Excellent work on finishing the lab! I am approving this pull request to be merged!"  

### How I responded:
• **Issue 1:** "Thanks for the review. I'll move on to the next issue."  
• **Issue 2:** "Thanks for your review, I'll move on to the next issue."  
• **Issue 3:** "Thanks for the lightning review. I will move on to issue 4."  
• **Issue 4:** "Thanks for the great review as always. I will continue to the next issue and finish this lab."  
• **Issue 5:** "Thanks for the review. I'll move on to the last issue and finish this lab."  
• **Issue 6:** "Thanks for all the reviews you've done for me."  

---

## Pull Requests I reviewed for my partner

### My comments:
• **Issue 1:** "Looks exceptional! The Sprint 3 specification files are thorough and perfectly aligned with the Lab 3 handout. The role authorization matrix, status transitions, and safety rules are well-defined, and the test traceability covers 100% of the acceptance criteria. Approved and ready to merge."  
• **Issue 2:** "Reviewed and verified the changes for Issue 2 as below:

Authentication & JWT session handling are implemented securely.
Mandatory first-login password change and validation rules work as expected.
Requester ticket isolation is preserved using authenticated user session.
UI adheres to Zen Green styling, and all 52 automated tests pass cleanly.
Approved abd you can able to merge into lab3-staging."  
• **Issue 3:** "LGTM! Reviewed the changes for Issue #3:
Staff queue API (GET /api/staff/tickets) is properly secured (403 for Requesters).
Search, status/priority filters, sorting, and pagination work seamlessly.
Responsive Zen Green UI correctly renders desktop table and mobile cards.
All 62 automated tests pass with no regressions.
Approved to merge into lab3-staging."  
• **Issue 4:** "Verified the Staff Ticket Detail UI, operational controls (claim, priority, status workflow), and comments/internal notes isolation. All 84 tests are passing (52 server, 32 client). Approved to merge into lab3-staging!"  
• **Issue 5:** "Verified ! Administrator User Management UI & table work smoothly. User creation, password policy checklist, and initial password reset verified. Safety guards (self-deactivation & last active admin protection) enforced properly. All 98 tests passing. Approved to merge into lab3-staging!"  
• **Issue 6:** "Everything has been checked and approved! All 3 Playwright E2E test suites passed successfully, with 7/7 tests passing. Responsive screenshots were also created for Desktop, Tablet, and Mobile views for all roles. In total, 105 tests are now passing: 60 server tests, 38 client tests, and 7 E2E tests. The AI usage log and test documentation are also complete and well organized. The changes are approved to be merged into lab3-staging."  

### Partner's response:
• **Issue 1:** "Thank you for the review! I will follow this specification and test plan strictly for the upcoming implementation issues."  
• **Issue 2:** "Thanks for verifying! Proceeding to implement the IT Staff Ticket Queue with Zen Green design system."  
• **Issue 3:** "Thank you for the review! All tests passed and responsive criteria were verified. Merging into lab3-staging now."  
• **Issue 4:** "Thank you! Confirmed that Requester attempts to query notes return HTTP 403 without leaking note existence or ticket context. Starting Issue 5."  
• **Issue 5:** "Appreciate the verification! Confirmed that active admin count safety checks and reset password workflows prevent lockouts. Starting Issue 6."  
• **Issue 6:** "Thank you for the review and verification! All automated tests and responsive UI evidence are confirmed. Merging PR into lab3-staging now, and preparing the final release PR to main!"  
