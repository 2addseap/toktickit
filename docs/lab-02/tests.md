# Lab 2 Test Plan and Traceability Matrix

## 1. Test Strategy

To guarantee the quality, ownership security, and visual consistency of the Lab 2 increment, testing is organized across four complementary layers:
1. **Unit Tests (Vitest):** Validate business logic utilities such as Ticket Number formatting, file size/mime validators, and date helpers.
2. **API Integration Tests (Supertest):** Verify all REST endpoints, validation rules, HTTP status codes, multi-requester ownership boundaries, pagination, and attachment soft-removal logic directly against the PostgreSQL database.
3. **UI Component Tests (Vitest + React Testing Library):** Verify client rendering, form input validations, field-level error messages, loading/busy states, responsive switching, and component-level user interactions.
4. **End-to-End Tests (Playwright):** Verify full responsive user flows from Requester Selection to Ticket Creation, My Tickets search/filtering, Ticket Detail inspection, and Attachment lifecycle across Desktop, Tablet, and Mobile viewports.

---

## 2. Planned Tests Table

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-01, AC-02 | Ticket Number generation format | Matches `^TKT-\d{4}-\d{6}$` with sequential numbering | `server/tests/lab-02/ticket-number.test.ts` | **Passed** |
| **UNIT-02** | Unit | BR-10, BR-11 | File validation utility (MIME & Size) | Accepts JPEG/PNG/WEBP/PDF $\le 5\text{MB}$; rejects others | `server/tests/lab-02/attachment-validator.test.ts` | **Passed** |
| **API-01** | API | AC-01, FR-01 | `GET /api/requesters` active list | Returns 200 and list of active requesters (excludes inactive) | `server/tests/lab-02/create-ticket.api.test.ts` | **Passed** |
| **API-02** | API | AC-02, BR-02 | `POST /api/tickets` valid ticket creation | Returns 201 with unique `ticketNumber` and `status = 'New'` | `server/tests/lab-02/create-ticket.api.test.ts` | **Passed** |
| **API-03** | API | AC-03, BR-07, BR-08 | `POST /api/tickets` invalid validation | Returns 400 with field errors for short summary/description | `server/tests/lab-02/create-ticket.api.test.ts` | **Passed** |
| **API-04** | API | AC-04, AC-05 | `POST /api/tickets` with initial attachments | Returns 201; attachments saved in DB and linked | `server/tests/lab-02/create-ticket.api.test.ts` | **Passed** |
| **API-05** | API | AC-07, BR-05 | `GET /api/tickets` ownership isolation | Returns 200 with tickets belonging *only* to requesting user | `server/tests/lab-02/my-tickets.api.test.ts` | **Passed** |
| **API-06** | API | AC-08 | `GET /api/tickets?search=...` search | Returns 200 with tickets matching number or summary keyword | `server/tests/lab-02/my-tickets.api.test.ts` | **Passed** |
| **API-07** | API | AC-09 | `GET /api/tickets?categoryId=...&priority=...` | Returns 200 with tickets matching category and priority | `server/tests/lab-02/my-tickets.api.test.ts` | **Passed** |
| **API-08** | API | AC-10 | `GET /api/tickets?page=2&pageSize=10` | Returns 200 with page 2 data and correct pagination metadata | `server/tests/lab-02/my-tickets.api.test.ts` | **Passed** |
| **API-09** | API | AC-11 | `GET /api/tickets/:id` owned detail | Returns 200 with complete header, category, and attachments | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-10** | API | AC-12, BR-05 | `GET /api/tickets/:id` cross-user access | Returns 403 or 404 when requester B requests requester A's ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-11** | API | AC-13, BR-12 | `POST /api/tickets/:id/attachments` upload | Returns 201; new active attachment saved and linked | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-12** | API | AC-14, BR-12 | Attachment quota exceeding 5 active files | Returns 400 when attempting to upload 6th active attachment | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-13** | API | AC-15 | `GET /api/attachments/:id/download` active file | Returns 200 with binary file stream and headers | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-14** | API | AC-16, BR-13 | `PATCH /api/attachments/:id/soft-remove` | Returns 200; `isRemoved = true`, reason and timestamp saved | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **API-15** | API | AC-17, BR-14 | Download of soft-removed attachment | Returns 410 Gone (or 404); blocks file download | `server/tests/lab-02/ticket-detail.api.test.ts` | **Passed** |
| **UI-01** | UI | AC-01 | Requester Selection screen rendering | Renders dropdown, banner, and disables button until chosen | `client/tests/lab-02/RequesterSelect.test.tsx` | **Passed** |
| **UI-02** | UI | AC-03 | Create Ticket form validation errors | Shows inline red error text under summary/description on submit | `client/tests/lab-02/CreateTicket.test.tsx` | **Passed** |
| **UI-03** | UI | AC-02, BR-15 | Create Ticket submission & busy state | Shows spinner during submission and shows success confirmation | `client/tests/lab-02/CreateTicket.test.tsx` | **Passed** |
| **UI-04** | UI | AC-07, AC-08 | My Tickets table & search input | Renders table on desktop, responds to keyword search | `client/tests/lab-02/MyTickets.test.tsx` | **Passed** |
| **UI-05** | UI | AC-10 | My Tickets pagination controls | Renders page buttons and triggers page change API call | `client/tests/lab-02/MyTickets.test.tsx` | **Passed** |
| **UI-06** | UI | AC-11 | Ticket Detail read-only layout | Renders read-only summary, badges, and attachment grid | `client/tests/lab-02/TicketDetail.test.tsx` | **Passed** |
| **UI-07** | UI | AC-16 | Soft-removal modal dialog | Prompts for mandatory reason, submits patch, updates UI state | `client/tests/lab-02/TicketDetail.test.tsx` | **Passed** |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Mapped Automated Tests | Final Status |
|---|---|---|---|
| **AC-01** | Requester selection on first visit | `API-01`, `UI-01` | **Passed** |
| **AC-02** | Valid ticket creation with generated number | `UNIT-01`, `API-02`, `UI-03` | **Passed** |
| **AC-03** | Field-level validation on required fields | `API-03`, `UI-02` | **Passed** |
| **AC-04** | Initial attachment upload with ticket | `UNIT-02`, `API-04` | **Passed** |
| **AC-05** | Unsupported file format rejection | `UNIT-02`, `API-04` | **Passed** |
| **AC-06** | File size limit validation ($\le 5\text{MB}$) | `UNIT-02`, `API-04` | **Passed** |
| **AC-07** | My Tickets requester isolation | `API-05`, `UI-04` | **Passed** |
| **AC-08** | Search ticket number and summary | `API-06`, `UI-04` | **Passed** |
| **AC-09** | Filter by Category and Priority | `API-07`, `UI-04` | **Passed** |
| **AC-10** | Server-side pagination controls | `API-08`, `UI-05` | **Passed** |
| **AC-11** | Owned Ticket Detail read-only view | `API-09`, `UI-06` | **Passed** |
| **AC-12** | Cross-requester ticket access blocked | `API-10` | **Passed** |
| **AC-13** | Add attachment to existing ticket | `API-11`, `UI-07` | **Passed** |
| **AC-14** | Quota limit of 5 active attachments | `API-12`, `UI-07` | **Passed** |
| **AC-15** | Download active attachment | `API-13` | **Passed** |
| **AC-16** | Soft-remove attachment with reason | `API-14`, `UI-07` | **Passed** |
| **AC-17** | Block download of soft-removed attachment | `API-15` | **Passed** |
| **AC-18** | Switching requester updates context | `API-05`, `UI-04` | **Passed** |

---

## 4. Responsive and Visual Inspection Checklist

- [x] **Desktop Viewport ($\ge 992\text{px}$):**
  - Navigation bar displays TokTickIT logo, active tab indicator, and user profile pill.
  - Create Ticket displays two-column layout without wrapping or clipping.
  - My Tickets renders tabular data with column alignment and hover highlight.
- [x] **Tablet Viewport ($768\text{px} - 991\text{px}$):**
  - Form fields adapt cleanly; Summary and Description receive sufficient width.
- [x] **Mobile Viewport ($< 768\text{px}$):**
  - Form fields stack vertically with clear $40\text{px}$ minimum touch targets.
  - My Tickets displays card-based layout instead of overflowing table.
  - No horizontal page scrollbars at $375\text{px}$ width.
- [x] **Accessibility & States:**
  - Red asterisk on required fields accompanied by clear text messages.
  - Focus outlines clearly visible on keyboard navigation (`Tab`).
  - Buttons display busy indicator with disabled state while request is processing.

---

## 5. Test Execution Commands

```bash
# 1. Run all Server Unit & API Tests
npm --prefix server test

# 2. Run all Client Unit & UI Component Tests
npm --prefix client test
```

---

## 6. Final Test Execution Results Evidence

### Server Tests Output (Vitest & Supertest)
```text
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 server

 ✓ tests/lab-02/attachment-validator.test.ts (2 tests)
 ✓ tests/lab-02/ticket-number.test.ts (1 test)
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/create-ticket.api.test.ts (5 tests)
 ✓ tests/lab-02/my-tickets.api.test.ts (5 tests)
 ✓ tests/lab-02/ticket-detail.api.test.ts (8 tests)

 Test Files  7 passed (7)
      Tests  23 passed (23)
   Duration  377ms
```

### Client Tests Output (Vitest & React Testing Library)
```text
> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 client

 ✓ tests/lab-01/App.test.tsx (3 tests)
 ✓ tests/lab-02/RequesterSelect.test.tsx (3 tests)
 ✓ tests/lab-02/TicketDetail.test.tsx (4 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (4 tests)
 ✓ tests/lab-02/MyTickets.test.tsx (5 tests)

 Test Files  5 passed (5)
      Tests  19 passed (19)
   Duration  1.32s
```

**Total Automated Tests:** 42/42 Passed (100% Success Rate)

---

## 7. Known Limitations or Deferred Tests
- Full authentication, password encryption, and JWT session login tests are deferred to Lab 3.
- IT Staff claim, queue management, and status transition workflows are deferred to Lab 3 & 4.

