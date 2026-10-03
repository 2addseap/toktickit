import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 — Issue 4: IT Staff Ticket Queue API Tests", () => {
  const prisma = getPrisma();
  let requesterToken: string;
  let itStaffToken: string;
  let adminToken: string;
  let staffUser: any;
  let testTicket1: any;
  let testTicket2: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Requester
    const requester = await prisma.user.upsert({
      where: { email: "queue.requester@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Queue Requester",
        email: "queue.requester@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // IT Staff
    staffUser = await prisma.user.upsert({
      where: { email: "queue.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Queue Staff",
        email: "queue.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // Administrator
    const admin = await prisma.user.upsert({
      where: { email: "queue.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Queue Admin",
        email: "queue.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterToken = generateToken({
      id: requester.id,
      email: requester.email,
      role: requester.role,
      mustChangePassword: false,
    });

    itStaffToken = generateToken({
      id: staffUser.id,
      email: staffUser.email,
      role: staffUser.role,
      mustChangePassword: false,
    });

    adminToken = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      mustChangePassword: false,
    });

    // Ensure category and system exist
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: "Network Services" } });
    }

    let system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({ data: { name: "VPN Gateway", category: "Network" } });
    }

    // Seed test tickets for queue testing
    testTicket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-QUEUE-1-${Date.now()}`,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: "Staff Queue Network Issue 1",
        description: "Network dropped in building A",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "Open",
        assignedToId: null, // Unassigned
      },
    });

    testTicket2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-QUEUE-2-${Date.now()}`,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: "Staff Queue Software Issue 2",
        description: "Need license renewal",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "In Progress",
        assignedToId: staffUser.id, // Assigned to staffUser
      },
    });
  });

  // -------------------------------------------------------------------------
  // API-13 (AC-12, BR-10): Ticket Queue Access Control
  // -------------------------------------------------------------------------
  describe("API-13: Access Control for Ticket Queue", () => {
    it("returns 401 Unauthorized when unauthenticated request accesses queue", async () => {
      const res = await request(app).get("/api/staff/tickets");
      expect(res.status).toBe(401);
    });

    it("returns 403 Forbidden when Requester accesses ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access Denied");
    });

    it("grants access (200 OK) when IT Staff accesses ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
    });

    it("grants access (200 OK) when Administrator accesses ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
    });
  });

  // -------------------------------------------------------------------------
  // API-12 (AC-11, FR-09): Staff Ticket Queue Query, Filtering, Sorting
  // -------------------------------------------------------------------------
  describe("API-12: Staff Ticket Queue Query & Filters", () => {
    it("returns paginated tickets with required relational fields and attachment count", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const ticket = res.body.data[0];
      expect(ticket).toHaveProperty("ticketNumber");
      expect(ticket).toHaveProperty("summary");
      expect(ticket).toHaveProperty("requestedPriority");
      expect(ticket).toHaveProperty("itPriority");
      expect(ticket).toHaveProperty("status");
      expect(ticket).toHaveProperty("requester");
      expect(ticket).toHaveProperty("category");
      expect(ticket).toHaveProperty("relatedSystem");
      expect(ticket).toHaveProperty("attachmentCount");
      expect(typeof ticket.attachmentCount).toBe("number");
    });

    it("filters tickets by search query across ticketNumber and summary", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?search=${encodeURIComponent("Network Issue 1")}`)
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((t: any) => t.id === testTicket1.id)).toBe(true);
      expect(res.body.data.some((t: any) => t.id === testTicket2.id)).toBe(false);
    });

    it("filters tickets by status", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?status=In%20Progress")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.status === "In Progress")).toBe(true);
    });

    it("filters tickets by itPriority", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?priority=HIGH")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.itPriority === "HIGH")).toBe(true);
    });

    it("filters unassigned tickets when assignedTo=unassigned", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?assignedTo=unassigned")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.assignedTo === null)).toBe(true);
      expect(res.body.data.some((t: any) => t.id === testTicket1.id)).toBe(true);
    });

    it("filters assigned tickets by specific assignee ID", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?assignedTo=${staffUser.id}`)
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.assignedTo?.id === staffUser.id)).toBe(true);
      expect(res.body.data.some((t: any) => t.id === testTicket2.id)).toBe(true);
    });

    it("supports sorting and pagination metadata", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=1&pageSize=2&sortBy=ticketNumber&sortOrder=asc")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.pageSize).toBe(2);
      expect(res.body.pagination).toHaveProperty("totalItems");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/staff/assignees (BR-12)
  // -------------------------------------------------------------------------
  describe("GET /api/staff/assignees", () => {
    it("returns 403 Forbidden for Requester", async () => {
      const res = await request(app)
        .get("/api/staff/assignees")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
    });

    it("returns list of active IT Staff and Admin users", async () => {
      const res = await request(app)
        .get("/api/staff/assignees")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify each user is IT_STAFF or ADMINISTRATOR
      for (const u of res.body) {
        expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(u.role);
        expect(u.passwordHash).toBeUndefined();
      }
    });
  });
});
