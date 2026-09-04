# Lab 2 REST API Specification and Contract

## 1. Global API Standards

- **Base URL:** `/api`
- **Content-Type:** `application/json` (except multipart file uploads)
- **Requester Context Header:** Until Lab 3 introduces full authentication tokens, the frontend transmits the simulated active requester's ID via the HTTP header `x-requester-id: <number>`.
- **Standard Error Response Structure:**
  ```json
  {
    "error": "Short error title",
    "message": "Detailed description of the validation or business rule violation",
    "fieldErrors": {
      "summary": "Summary must be between 5 and 100 characters"
    }
  }
  ```

---

## 2. API Endpoints

### 2.1 Get Active Development Requesters
- **Route:** `GET /api/requesters`
- **Description:** Returns all active development requesters for selection in the simulated login screen. Inactive requesters are excluded.
- **Query Parameters:** None
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "department": "Human Resources",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael.brown@example.com",
      "department": "Finance",
      "isActive": true
    }
  ]
  ```

---

### 2.2 Get Active Categories
- **Route:** `GET /api/categories`
- **Description:** Returns all active ticket categories ordered by `id` ascending.
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
  ```

---

### 2.3 Get Active Related Systems
- **Route:** `GET /api/related-systems`
- **Description:** Returns all active IT related systems.
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Corporate Laptop", "category": "Hardware" },
    { "id": 2, "name": "Campus Wi-Fi", "category": "Network" },
    { "id": 3, "name": "Email", "category": "Software" },
    { "id": 4, "name": "LEB2 App", "category": "Software" },
    { "id": 5, "name": "VPN", "category": "Network" },
    { "id": 6, "name": "Printer", "category": "Hardware" }
  ]
  ```

---

### 2.4 Create Support Ticket
- **Route:** `POST /api/tickets`
- **Description:** Creates a new support ticket in `New` status with a generated Ticket Number (`TKT-YYYY-NNNNNN`). Can accept JSON or `multipart/form-data` with initial attachments.
- **Headers:** `x-requester-id: 1`
- **Request Body (JSON):**
  ```json
  {
    "categoryId": 1,
    "relatedSystemId": 1,
    "requestedPriority": "MEDIUM",
    "summary": "Cannot access HR portal after password reset",
    "description": "I updated my corporate password this morning but the HR portal continues to return an access denied error."
  }
  ```
- **Validation Rules:**
  - `requesterId`: Required, must correspond to an active `RequesterUser`.
  - `categoryId`: Required, must exist in `categories`.
  - `relatedSystemId`: Required, must exist in `related_systems`.
  - `requestedPriority`: Optional (default `MEDIUM`), one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `summary`: Required, trimmed, 5 to 100 characters.
  - `description`: Required, trimmed, 10 to 2000 characters.
  - Attachments (if multipart): Max 5 files, allowed types: JPEG, PNG, WEBP, PDF; Max 5 MB each.
- **Response (201 Created):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "requesterId": 1,
    "categoryId": 1,
    "relatedSystemId": 1,
    "summary": "Cannot access HR portal after password reset",
    "description": "I updated my corporate password this morning but the HR portal continues to return an access denied error.",
    "requestedPriority": "MEDIUM",
    "status": "New",
    "createdAt": "2026-09-04T12:00:00.000Z",
    "updatedAt": "2026-09-04T12:00:00.000Z",
    "attachments": []
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure on summary/description or missing required fields.
  - `422 Unprocessable Entity`: Invalid attachment file type or file $> 5\text{ MB}$.

---

### 2.5 Get Requester's Ticket List (Paginated, Search, Filter, Sort)
- **Route:** `GET /api/tickets`
- **Description:** Returns paginated tickets belonging exclusively to the requesting user.
- **Headers:** `x-requester-id: 1`
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `search` | string | `""` | Search query matching `ticketNumber` or `summary` (case-insensitive) |
  | `categoryId` | number | - | Filter by category ID |
  | `priority` | string | - | Filter by requested priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) |
  | `status` | string | - | Filter by status (`New`, `Open`, `In Progress`, `Resolved`, `Closed`) |
  | `sortBy` | string | `"createdAt"` | Sort field (`createdAt`, `ticketNumber`, `requestedPriority`, `updatedAt`) |
  | `sortOrder` | string | `"desc"` | Sort direction (`asc`, `desc`) |
  | `page` | number | `1` | 1-indexed page number |
  | `pageSize` | number | `10` | Items per page (min 1, max 50) |

- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 101,
        "ticketNumber": "TKT-2026-000101",
        "summary": "Cannot access HR portal after password reset",
        "category": { "id": 1, "name": "Account and Access" },
        "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
        "requestedPriority": "MEDIUM",
        "itPriority": null,
        "status": "New",
        "createdAt": "2026-09-04T12:00:00.000Z",
        "updatedAt": "2026-09-04T12:00:00.000Z",
        "attachmentCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

---

### 2.6 Get Owned Ticket Detail
- **Route:** `GET /api/tickets/:id`
- **Description:** Returns the complete detail of a single ticket. Enforces ownership check.
- **Headers:** `x-requester-id: 1`
- **Response (200 OK):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "requesterId": 1,
    "requester": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com"
    },
    "category": { "id": 1, "name": "Account and Access" },
    "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
    "summary": "Cannot access HR portal after password reset",
    "description": "I updated my corporate password this morning but the HR portal continues to return an access denied error.",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "status": "New",
    "createdAt": "2026-09-04T12:00:00.000Z",
    "updatedAt": "2026-09-04T12:00:00.000Z",
    "attachments": [
      {
        "id": 12,
        "fileName": "error_screenshot.png",
        "fileSize": 245000,
        "mimeType": "image/png",
        "isRemoved": false,
        "removalReason": null,
        "removedAt": null,
        "createdAt": "2026-09-04T12:00:00.000Z"
      }
    ]
  }
  ```
- **Error Responses:**
  - `403 Forbidden` or `404 Not Found`: If ticket belongs to another requester or does not exist.

---

### 2.7 Upload Attachment to Existing Ticket
- **Route:** `POST /api/tickets/:id/attachments`
- **Description:** Uploads a single file attachment to an existing owned ticket.
- **Headers:** `x-requester-id: 1`, `Content-Type: multipart/form-data`
- **Form Data:** `file` (Binary file)
- **Validation Rules:**
  - Ticket must belong to the active requester.
  - Active attachments must currently be $< 5$.
  - File MIME type must be JPEG, PNG, WEBP, or PDF.
  - File size must be $\le 5\text{ MB}$.
- **Response (201 Created):**
  ```json
  {
    "id": 13,
    "ticketId": 101,
    "fileName": "system_log.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "isRemoved": false,
    "createdAt": "2026-09-04T12:30:00.000Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Quota exceeded (already 5 active attachments) or no file uploaded.
  - `403 Forbidden`: Requester does not own this ticket.
  - `415 Unsupported Media Type`: File type not permitted.

---

### 2.8 Download Active Attachment
- **Route:** `GET /api/attachments/:id/download`
- **Description:** Streams the physical file to the requester if the attachment is active and belongs to an owned ticket.
- **Headers:** `x-requester-id: 1`
- **Response (200 OK):** Binary stream with `Content-Disposition: attachment; filename="original_name.pdf"`.
- **Error Responses:**
  - `403 Forbidden`: Requester does not own the parent ticket.
  - `404 Not Found`: Attachment record or file does not exist.
  - `410 Gone`: Attachment has been soft-removed.

---

### 2.9 Soft-Remove Attachment
- **Route:** `PATCH /api/attachments/:id/soft-remove`
- **Description:** Soft-removes an attachment. Sets `isRemoved = true`, saves removal reason, and disables download.
- **Headers:** `x-requester-id: 1`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "reason": "Uploaded incorrect log file containing personal data"
  }
  ```
- **Validation Rules:**
  - Requester must own the parent ticket.
  - `reason` is required and must be $\ge 3$ characters.
  - Cannot soft-remove an already removed attachment.
- **Response (200 OK):**
  ```json
  {
    "id": 12,
    "isRemoved": true,
    "removalReason": "Uploaded incorrect log file containing personal data",
    "removedAt": "2026-09-04T12:45:00.000Z",
    "removedBy": "Jennifer Anderson"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing or empty removal reason.
  - `403 Forbidden`: Requester does not own this attachment.
  - `404 Not Found`: Attachment not found.
