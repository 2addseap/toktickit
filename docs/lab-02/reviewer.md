# Lab 2 — Peer Review Record

**Author:** Kawinpob Amnuaywittayakul — Student ID: 66070501004 — GitHub: @2addseap  
**Peer reviewer:** Korapin Manoprasertkoon — Student ID: 66070501007 — GitHub: @alwaysbt

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
• Issue 1: "Looking Good, Please Continue !"
• Issue 2: "Hey! I checked out your branch for Issue 2. The implementation looks great."
• Issue 3: "Great work on Issue 3! The backend creates unique ticket numbers in the correct format, defaults the status to New, checks all required inputs, and handles file attachments within the allowed size and type limits. The Zen Green form UI looks great. All backend and frontend automated tests are passing cleanly, so it's approved and ready to merge into lab2-staging!"
• Issue 4: "Great work on Issue 4! The backend correctly keeps each user's tickets private, and the search, filter, sort, and page controls work smoothly. The Zen Green screen looks clean with its desktop table, responsive mobile cards, nice badges, and helpful empty or no-result messages. All backend API tests and frontend component tests pass without any issues, so this PR is approved and ready to merge into lab2-staging!"
• Issue 5: "Great job on Issue 5! The ticket details view looks clean, and the attachment lifecycle is handled very well with proper security checks to make sure users can only view their own files. The soft-removal feature works smoothly by requiring a reason, saving the audit trail, and blocking downloads with a 410 status. The Zen Green design clearly separates active files from removed ones with strikethrough text and helpful notes. All 39 automated tests pass with no errors, so this PR is approved and ready to merge into lab2-staging!"
• Issue 6: "Excellent work on Issue 6! The Zen Green styling looks clean and consistent across all screens, and the responsive layouts adjust nicely from desktop tables down to mobile cards without horizontal scrolling. The documentation in docs/lab-02/ is thorough, with tests.md showing 100% test coverage for all acceptance criteria, and reviewer.md and ai-use.md clearly tracking our review process and AI usage. With all 42 automated tests passing cleanly, this PR is approved and ready to merge into lab2-staging!"

**How I responded:**
• Issue 1: "Thanks for the review! Proceeding with Issue 2 implementation."
• Issue 2: "Thank you for reviewing. Moving on to Issue 3."
• Issue 3: "Thanks for the feedback! Moving on to Issue 4."
• Issue 4: "Appreciate the thorough review! Starting Issue 5."
• Issue 5: "Thank you for verifying the security and soft-removal rules! Moving to Issue 6."
• Issue 6: "Thanks for the final review! Ready to create the release PR into main."

## Pull Requests I reviewed for my partner
**My comment:**
• Issue 1: "Looks great! All required documentation files and the test plan are cleanly structured according to the Spec DD guidelines. The addition of AGENTS.md is very helpful for the upcoming implementation tasks. Approved!"
• Issue 2: "The code looks fine for me, please continue the next issue. Great job!"
• Issue 3: "Great job on Issue 3! The backend creates official ticket numbers correctly, sets the starting status to New, checks form inputs, and handles file uploads safely. The Zen Green form looks clean with nice read-only fields, inline error text, a busy submit button, and a clear success screen. All backend and frontend tests pass, so this is approved and ready to merge into lab2-staging!"
• Issue 4: "Reviewed the changes. The data isolation between different requesterIds is properly enforced both in the Prisma query and in the UI when switching requesters in the header. Tested the live search and priority filter on http://localhost:5173/ — table updates quickly and the pagination counts are accurate. Approved!"
• Issue 5: "Great work on Issue 5! The ticket detail view looks clean, ownership checks are properly enforced, and the soft-removal lifecycle works smoothly. The Zen Green styling clearly distinguishes active from removed files. All tests pass—approved and ready to merge into lab2-staging"

**Partner's response:**
• Issue 1: "Thanks for your review, I will proceed follow this specification !"
• Issue 2: "Thank a lots. I'll proceed to next Issue."
• Issue 3: "Thanks, Got it. I will care fully continue the next issue based on your concerned!"
• Issue 4: "Thanks for reviewing! Confirmed that switching requesters immediately resets the pagination and re-fetches only the newly active requester's tickets. I will continue now."
• Issue 5: "Thanks for all the time you spend reviewing my task!"


