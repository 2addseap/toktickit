# Lab 4 REST API Specification and Contract

## 1. Global API Standards

- **Base URL:** `/api`
- **Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)
- **Authentication Scheme:**
  - Token-based via HTTP Header: `Authorization: Bearer <session_token>` (or session cookie `toktickit_auth_token`).
  - Populates authenticated user context:
    ```typescript
    interface AuthenticatedUser {
      id: number;
      name: string;
      email: string;
      role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
      department?: string;
      isActive: boolean;
      mustChangePassword: boolean;
    }
    ```
- **Error Response Standard:**
  ```json
  {
    "error": "Error Category / Title",
    "message": "Clear explanation of the error condition.",
    "fieldErrors": {
      "fieldName": "Specific validation failure message"
    }
  }
  ```
- **Optimistic Concurrency & Conflict Handling (409 Conflict):**
  - Mutating operations (`PATCH /api/actions/:id` and `PATCH /api/staff/tickets/:id/status`) accept an optional/recommended `clientUpdatedAt` ISO timestamp.
  - If the database record's `updatedAt` is more recent than `clientUpdatedAt`, the server rejects the modification:
    ```json
    {
      "error": "Conflict",
      "code": "CONCURRENT_UPDATE_CONFLICT",
      "message": "This record has been updated by another user. Please refresh and review before saving."
    }
    ```

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken for a Ticket
- **Route:** `GET /api/tickets/:id/actions`
- **Access:** Authenticated Users
  - **Requester:** Permitted only if `ticket.requesterId === req.user.id`. Otherwise returns `403 Forbidden`.
  - **IT Staff / Administrator:** Permitted for all accessible tickets.
- **Path Parameters:**
  - `id`: Ticket ID (integer).
- **Response (200 OK):**
  ```json
  [
    {
      "id": 12,
      "ticketId": 105,
      "performedById": 15,
      "performedBy": {
        "id": 15,
        "name": "Sarah IT",
        "email": "sarah.it@kmutt.ac.th",
        "role": "IT_STAFF"
      },
      "actionDateTime": "2026-10-30T09:15:00.000Z",
      "actionDescription": "Checked Cisco switch port 12 and reset physical link connection.",
      "result": "Link light restored to green; network packet drops dropped to 0%.",
      "followUpRequired": true,
      "followUpNote": "Monitor bandwidth utilization over next 24 hours.",
      "attachmentNotes": "switch-logs-port12.txt",
      "createdAt": "2026-10-30T09:20:00.000Z",
      "updatedAt": "2026-10-30T09:20:00.000Z"
    }
  ]
  ```

---

### 2.2 Create Action Taken
- **Route:** `POST /api/tickets/:id/actions`
- **Access:** IT Staff and Administrator only.
  - **Requester:** Returns `403 Forbidden` (`"Requesters are not permitted to record Actions Taken."`).
- **Path Parameters:**
  - `id`: Ticket ID (integer).
- **Request Body:**
  ```json
  {
    "actionDateTime": "2026-10-30T09:15:00.000Z",
    "actionDescription": "Inspected internal power supply and fan connectors.",
    "result": "Fan 2 replaced with spare unit. Operating temperature normalized.",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "photo-replaced-fan.png"
  }
  ```
- **Validation Rules:**
  - `actionDescription`: Required, string, length $3 - 2,000$ characters.
  - `result`: Required, string, length $3 - 2,000$ characters.
  - `actionDateTime`: Optional string (ISO format). Defaults to `now()` if omitted.
  - `followUpRequired`: Boolean, defaults to `false`.
  - `followUpNote`:
    - If `followUpRequired === true`: Required, non-empty string, length $\ge 3$ characters. If missing, returns `400 Bad Request` with `fieldErrors: { followUpNote: "Follow-up note is required when follow-up is marked as needed." }`.
    - If `followUpRequired === false`: Ignored or set to `null`.
  - `attachmentNotes`: Optional string up to $500$ characters.
  - `performedById`: Auto-attributed to `req.user.id` (ignoring any client-supplied ID).
- **Response (201 Created):** Returns the persisted Action Taken object with full `performedBy` relations.

---

### 2.3 Update Action Taken
- **Route:** `PATCH /api/actions/:id`
- **Access:** IT Staff and Administrator only.
- **Path Parameters:**
  - `id`: Action Taken ID (integer).
- **Request Body:**
  ```json
  {
    "actionDescription": "Inspected internal power supply and replaced fan.",
    "result": "Fan 2 replaced; sound and temperature within normal range.",
    "followUpRequired": true,
    "followUpNote": "Check again during tomorrow's scheduled maintenance.",
    "attachmentNotes": "photo-replaced-fan.png",
    "clientUpdatedAt": "2026-10-30T09:20:00.000Z"
  }
  ```
- **Conflict Handling:**
  - Compares `clientUpdatedAt` with stored `updatedAt`. If database is newer $\rightarrow$ `409 Conflict`.
- **Response (200 OK):** Returns the updated Action Taken object.

---

## 3. Role Dashboard Endpoints

### 3.1 Requester Dashboard
- **Route:** `GET /api/dashboards/requester`
- **Access:** Authenticated Requesters (and Staff/Admin viewing their personal requester view).
- **Query Rules:** Strictly filtered to `requesterId === req.user.id`.
- **Response (200 OK):**
  ```json
  {
    "metrics": {
      "myOpenTickets": 3,
      "inProgressTickets": 2,
      "waitingForRequesterTickets": 1,
      "recentlyResolvedTickets": 4
    },
    "recentTickets": [
      {
        "id": 108,
        "ticketNumber": "TKT-2026-00108",
        "summary": "VPN connection drops after 10 minutes",
        "status": "In Progress",
        "itPriority": "HIGH",
        "createdAt": "2026-10-29T10:00:00.000Z",
        "updatedAt": "2026-10-30T08:30:00.000Z"
      }
    ]
  }
  ```

---

### 3.2 IT Staff & Administrator Operational Dashboard
- **Route:** `GET /api/dashboards/staff`
- **Access:** IT Staff and Administrator only.
  - **Requester:** Returns `403 Forbidden`.
- **Response (200 OK):**
  ```json
  {
    "metrics": {
      "unassignedTickets": 6,
      "myAssignedTickets": 4,
      "newTickets": 5,
      "openTickets": 8,
      "inProgressTickets": 12,
      "waitingRequesterTickets": 3,
      "urgentTickets": 2,
      "adminUserStats": {
        "totalUsers": 45,
        "activeUsers": 42,
        "inactiveUsers": 3
      }
    },
    "recentUrgentTickets": [
      {
        "id": 102,
        "ticketNumber": "TKT-2026-00102",
        "summary": "Core ERP Database connection latency high",
        "status": "In Progress",
        "itPriority": "URGENT",
        "assignedTo": {
          "id": 15,
          "name": "Sarah IT"
        },
        "requester": {
          "id": 24,
          "name": "Jennifer Anderson"
        },
        "updatedAt": "2026-10-30T09:45:00.000Z"
      }
    ]
  }
  ```
  *(Note: `adminUserStats` is populated when `req.user.role === 'ADMINISTRATOR'`, and null/omitted for standard IT Staff).*

---

## 4. Ticket Status Workflow Endpoints

### 4.1 Update Ticket Status
- **Route:** `PATCH /api/staff/tickets/:id/status`
- **Access:** IT Staff and Administrator only.
- **Request Body:**
  ```json
  {
    "status": "Resolved",
    "clientUpdatedAt": "2026-10-30T09:00:00.000Z"
  }
  ```
- **FSM Matrix Enforcement:**
  - Validates current state $\rightarrow$ target state transition.
  - If transition is illegal (e.g. `New` $\rightarrow$ `Closed`) $\rightarrow$ returns `400 Bad Request` with message: `"Cannot transition ticket from New to Closed. Permitted transitions are: Open, In Progress, Cancelled."`
  - If `clientUpdatedAt` is stale $\rightarrow$ returns `409 Conflict`.
- **Response (200 OK):** Returns updated ticket object with current status.

---

### 4.2 Requester Problem Appears Resolved Indication
- **Route:** `PATCH /api/tickets/:id/resolve-indication`
- **Access:** Ticket Owner (Requester), IT Staff, Administrator.
- **Request Body:**
  ```json
  {
    "resolvedIndicated": true
  }
  ```
- **Rules:**
  - Sets `resolvedIndicated = true` and `resolvedIndicatedAt = now()`.
  - **Does not mutate** `ticket.status`.
- **Response (200 OK):** Returns updated ticket summary.
