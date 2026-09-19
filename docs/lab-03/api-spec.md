# Lab 3 REST API Specification and Contract

## 1. Global API Standards

- **Base URL:** `/api`
- **Content-Type:** `application/json` (except multipart file uploads which use `multipart/form-data`)
- **Authentication Scheme:**
  - Token-based via HTTP Header: `Authorization: Bearer <session_token>` (or session cookie `auth_token`).
  - The server extracts and verifies the token, populating `req.user`:
    ```typescript
    interface AuthenticatedUser {
      id: number;
      name: string;
      email: string;
      role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
      mustChangePassword: boolean;
    }
    ```
- **Password Change Interception:**
  - If `req.user.mustChangePassword === true`, requests to all operational routes (except `/api/auth/change-password`, `/api/auth/me`, and `/api/auth/logout`) receive `403 Forbidden`:
    ```json
    {
      "error": "Password Change Required",
      "code": "PASSWORD_CHANGE_REQUIRED",
      "message": "You must change your temporary password before accessing the application."
    }
    ```
- **Standard Error Payload:**
  ```json
  {
    "error": "Error Title",
    "message": "Descriptive explanation of the failure.",
    "fieldErrors": {
      "fieldName": "Specific field validation message"
    }
  }
  ```

---

## 2. Authentication Endpoints

### 2.1 Authenticate User (Login)
- **Route:** `POST /api/auth/login`
- **Access:** Public (Unauthenticated)
- **Request Body:**
  ```json
  {
    "email": "jennifer.anderson@kmutt.ac.th",
    "password": "Password123!"
  }
  ```
- **Validation & Rules:**
  - `email` and `password` are required.
  - If account does not exist or password mismatch $\rightarrow$ `401 Unauthorized`.
  - If account has `isActive: false` $\rightarrow$ `401 Unauthorized` with generic message: `"Invalid email or password."` (BR-01, BR-06).
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@kmutt.ac.th",
      "role": "REQUESTER",
      "department": "Human Resources",
      "mustChangePassword": false
    }
  }
  ```

---

### 2.2 Terminate Session (Logout)
- **Route:** `POST /api/auth/logout`
- **Access:** Authenticated (Any role)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

---

### 2.3 Get Current Authenticated Profile
- **Route:** `GET /api/auth/me`
- **Access:** Authenticated (Any role)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@kmutt.ac.th",
    "role": "REQUESTER",
    "department": "Human Resources",
    "mustChangePassword": false
  }
  ```

---

### 2.4 Change Password (Mandatory or Voluntary)
- **Route:** `POST /api/auth/change-password`
- **Access:** Authenticated (Any role, including users with `mustChangePassword === true`)
- **Request Body:**
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "SecureZen2026!New",
    "confirmPassword": "SecureZen2026!New"
  }
  ```
- **Validation & Rules:**
  - `currentPassword` must match existing stored hash.
  - `newPassword` must satisfy complexity standards (BR-03: $\ge 8$ chars, 1 uppercase, 1 lowercase, 1 number/symbol).
  - `newPassword` must match `confirmPassword`.
  - `newPassword` must not equal `currentPassword` (BR-04).
- **Response (200 OK):**
  ```json
  {
    "message": "Password updated successfully.",
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@kmutt.ac.th",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
  ```

---

## 3. Requester Ticketing Endpoints (Lab 2 Continued with Auth)

### 3.1 List My Tickets
- **Route:** `GET /api/tickets`
- **Access:** Authenticated (Requester, or any role viewing their own submissions)
- **Behavior:** Strictly filters tickets where `requesterId === req.user.id` (BR-05, BR-07). Any client `requesterId` query param or header is ignored.
- **Query Parameters:** `search`, `categoryId`, `priority`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize`.
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "ticketNumber": "TKT-2026-000001",
        "summary": "Cannot connect to campus VPN",
        "requestedPriority": "HIGH",
        "itPriority": "HIGH",
        "status": "In Progress",
        "resolvedIndicated": false,
        "createdAt": "2026-09-04T10:00:00.000Z",
        "category": { "id": 4, "name": "Network" },
        "relatedSystem": { "id": 5, "name": "VPN" },
        "attachmentCount": 1
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

### 3.2 Create Support Ticket
- **Route:** `POST /api/tickets`
- **Access:** Authenticated (Any role)
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Behavior:** Automatically sets `requesterId = req.user.id`, `itPriority = requestedPriority`, `assignedToId = null`, `status = 'New'`.
- **Response (201 Created):** Created ticket object with relations.

---

### 3.3 Get Ticket Details
- **Route:** `GET /api/tickets/:id`
- **Access:** Authenticated.
  - If `req.user.role === 'REQUESTER'`, requires `ticket.requesterId === req.user.id`. If not owner $\rightarrow$ `403 Forbidden` (`{"error": "Access Denied"}`).
  - If `req.user.role` is `'IT_STAFF'` or `'ADMINISTRATOR'`, grants access to any ticket.
- **Response (200 OK):** Full ticket object including requester, category, relatedSystem, attachments, and `assignedTo`.

---

### 3.4 Requester Resolution Indication
- **Route:** `PATCH /api/tickets/:id/resolve-indication`
- **Access:** Authenticated Ticket Owner (`requesterId === req.user.id`).
- **Request Body:**
  ```json
  {
    "resolved": true
  }
  ```
- **Rules:**
  - Marks `resolvedIndicated = true` and `resolvedIndicatedAt = new Date()`.
  - Does NOT directly transition status to `Resolved` or `Closed` (BR-14).
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "ticketNumber": "TKT-2026-000001",
    "resolvedIndicated": true,
    "resolvedIndicatedAt": "2026-09-19T10:30:00.000Z"
  }
  ```

---

## 4. Collaboration: Public Comments & Internal Notes

### 4.1 Get Public Comments
- **Route:** `GET /api/tickets/:id/comments`
- **Access:** Authenticated (Requester Owner, IT Staff, Administrator).
- **Rules:** Non-owner Requesters receive `403 Forbidden`.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "ticketId": 1,
      "body": "We have checked the VPN gateway and reset your profile.",
      "type": "PUBLIC",
      "createdAt": "2026-09-19T11:00:00.000Z",
      "author": {
        "id": 5,
        "name": "Sarah IT",
        "role": "IT_STAFF"
      }
    }
  ]
  ```

---

### 4.2 Post Public Comment
- **Route:** `POST /api/tickets/:id/comments`
- **Access:** Authenticated (Requester Owner, IT Staff, Administrator).
- **Request Body:**
  ```json
  {
    "body": "Thank you! I am now able to connect to the VPN."
  }
  ```
- **Validation:** `body` required, trimmed, $1 - 2,000$ characters.
- **Response (201 Created):** Created comment with author profile.

---

### 4.3 Get Internal Notes (Role Restricted)
- **Route:** `GET /api/tickets/:id/notes`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR` only.
- **Rules:** Any Requester request returns `403 Forbidden` without revealing notes data (BR-18).
- **Response (200 OK):**
  ```json
  [
    {
      "id": 2,
      "ticketId": 1,
      "body": "User's Active Directory account was locked after 3 failed password attempts.",
      "type": "INTERNAL",
      "createdAt": "2026-09-19T10:45:00.000Z",
      "author": {
        "id": 5,
        "name": "Sarah IT",
        "role": "IT_STAFF"
      }
    }
  ]
  ```

---

### 4.4 Post Internal Note (Role Restricted)
- **Route:** `POST /api/tickets/:id/notes`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR` only.
- **Rules:** Any Requester request returns `403 Forbidden`.
- **Request Body:**
  ```json
  {
    "body": "Escalated to network infrastructure team on VLAN 10."
  }
  ```
- **Response (201 Created):** Created internal note object.

---

## 5. IT Staff Ticket Queue & Workflow Endpoints

### 5.1 Query Shared Ticket Queue
- **Route:** `GET /api/staff/tickets`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR`.
- **Query Parameters:**
  - `search`: Case-insensitive substring match on `ticketNumber` and `summary`.
  - `status`: Exact status filter (`New`, `Open`, `In Progress`, etc.).
  - `priority`: Exact `itPriority` filter (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `assignedTo`: User ID of assignee, or `"unassigned"` for unassigned tickets.
  - `categoryId`: Filter by category.
  - `sortBy`: `createdAt`, `ticketNumber`, `itPriority`, `status`, `updatedAt` (default: `createdAt`).
  - `sortOrder`: `asc` or `desc` (default: `desc`).
  - `page`: Integer $\ge 1$ (default: `1`).
  - `pageSize`: Integer between $1$ and $50$ (default: `10`).
- **Response (200 OK):** Paginated ticket queue array with ticket requester, category, related system, assignedTo, and attachment counts.

---

### 5.2 Claim or Assign Ticket Ownership
- **Route:** `PATCH /api/staff/tickets/:id/assign`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR`.
- **Request Body:**
  ```json
  {
    "assignedToId": 5
  }
  ```
- **Validation:** Target user must exist, be active (`isActive: true`), and have role `IT_STAFF` or `ADMINISTRATOR` (BR-12). Can pass `assignedToId: null` to unassign.
- **Response (200 OK):** Updated ticket with new `assignedTo` relation.

---

### 5.3 Update IT Priority
- **Route:** `PATCH /api/staff/tickets/:id/priority`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR`.
- **Request Body:**
  ```json
  {
    "itPriority": "URGENT"
  }
  ```
- **Validation:** Value must be one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **Response (200 OK):** Updated ticket with revised `itPriority`.

---

### 5.4 Update Ticket Status Lifecycle
- **Route:** `PATCH /api/staff/tickets/:id/status`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR`.
- **Request Body:**
  ```json
  {
    "status": "Resolved"
  }
  ```
- **Validation:** Must be a valid transition according to the Status Transition Matrix (BR-16). If illegal $\rightarrow$ `400 Bad Request` with message: `"Transition from '<Current>' to '<Requested>' is not permitted."`
- **Response (200 OK):** Updated ticket with new status.

---

### 5.5 List Assignable Staff Members
- **Route:** `GET /api/staff/assignees`
- **Access:** Restricted to `IT_STAFF` and `ADMINISTRATOR`.
- **Response (200 OK):**
  ```json
  [
    { "id": 5, "name": "Sarah IT", "email": "sarah.it@kmutt.ac.th", "role": "IT_STAFF" },
    { "id": 6, "name": "Mike IT", "email": "mike.it@kmutt.ac.th", "role": "IT_STAFF" },
    { "id": 10, "name": "System Admin", "email": "admin@kmutt.ac.th", "role": "ADMINISTRATOR" }
  ]
  ```

---

## 6. Administrator User Management Endpoints

### 6.1 List Users
- **Route:** `GET /api/admin/users`
- **Access:** Restricted to `ADMINISTRATOR` only.
- **Query Parameters:**
  - `search`: Substring match on `name` or `email`.
  - `role`: Filter by `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@kmutt.ac.th",
      "role": "REQUESTER",
      "department": "Human Resources",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T08:00:00.000Z"
    }
  ]
  ```

---

### 6.2 Create User
- **Route:** `POST /api/admin/users`
- **Access:** Restricted to `ADMINISTRATOR` only.
- **Request Body:**
  ```json
  {
    "name": "Alex Thompson",
    "email": "alex.thompson@kmutt.ac.th",
    "role": "IT_STAFF",
    "department": "IT Support",
    "isActive": true,
    "initialPassword": "Password123!"
  }
  ```
- **Validation & Rules:**
  - `name`, `email`, `role`, and `initialPassword` required.
  - `role` must be `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.
  - `email` must be unique (BR-25). If duplicate $\rightarrow$ `409 Conflict`.
  - Stored with `passwordHash` and `mustChangePassword: true`.
- **Response (201 Created):** Sanitized user profile (excluding `passwordHash`).

---

### 6.3 Update User
- **Route:** `PATCH /api/admin/users/:id`
- **Access:** Restricted to `ADMINISTRATOR` only.
- **Request Body:**
  ```json
  {
    "name": "Alex Thompson Updated",
    "email": "alex.thompson@kmutt.ac.th",
    "role": "IT_STAFF",
    "isActive": false
  }
  ```
- **Safety Invariant Validations:**
  - **Self-Deactivation:** If `targetUser.id === req.user.id && isActive === false`, return `400 Bad Request` with `"You cannot deactivate your own account."` (BR-22).
  - **Last Active Administrator:** If `targetUser.role === 'ADMINISTRATOR'` and system has only 1 active administrator, any attempt to set `isActive = false` or change `role` to non-admin returns `400 Bad Request` with `"Cannot deactivate or change role of the last active Administrator."` (BR-23).
- **Response (200 OK):** Updated user profile.

---

### 6.4 Reset User Password
- **Route:** `POST /api/admin/users/:id/reset-password`
- **Access:** Restricted to `ADMINISTRATOR` only.
- **Request Body:**
  ```json
  {
    "newInitialPassword": "TemporaryPass123!"
  }
  ```
- **Behavior:** Hashes new password, sets `mustChangePassword = true`.
- **Response (200 OK):** `{"message": "Initial password reset successfully."}`
