import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 — Issue 5: IT Staff Operational Detail, Status, Priority & Assignment API Tests", () => {
  const prisma = getPrisma();
  let requester1: any;
  let requester2: any;
  let itStaff1: any;
  let adminUser: any;
  let requester1Token: string;
  let requester2Token: string;
  let itStaffToken: string;
  let adminToken: string;
  let ticket1: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    requester1 = await prisma.user.upsert({
      where: { email: "detail.requester1@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Detail Requester 1",
        email: "detail.requester1@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requester2 = await prisma.user.upsert({
      where: { email: "detail.requester2@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Detail Requester 2",
        email: "detail.requester2@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaff1 = await prisma.user.upsert({
      where: { email: "detail.staff1@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Detail Staff 1",
        email: "detail.staff1@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "detail.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Detail Admin",
        email: "detail.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requester1Token = generateToken({
      id: requester1.id,
      email: requester1.email,
      role: requester1.role,
      mustChangePassword: false,
    });

    requester2Token = generateToken({
      id: requester2.id,
      email: requester2.email,
      role: requester2.role,
      mustChangePassword: false,
    });

    itStaffToken = generateToken({
      id: itStaff1.id,
      email: itStaff1.email,
      role: itStaff1.role,
      mustChangePassword: false,
    });

    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: false,
    });

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: "Network Services" } });
    }

    let system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({ data: { name: "VPN Gateway", category: "Network" } });
    }

    // Create a base ticket
    ticket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-OP-${Date.now()}`,
        requesterId: requester1.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: "Intermittent VPN disconnects",
        description: "VPN session drops every 10 minutes",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "New",
        assignedToId: null,
      },
    });
  });

  // -------------------------------------------------------------------------
  // API-14 (AC-13, BR-12): Assign & Reassign Ticket Ownership
  // -------------------------------------------------------------------------
  describe("API-14: PATCH /api/staff/tickets/:id/assign", () => {
    it("returns 403 Forbidden for Requester", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/assign`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ assignedToId: itStaff1.id });

      expect(res.status).toBe(403);
    });

    it("assigns ticket to active IT Staff member", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/assign`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ assignedToId: itStaff1.id });

      expect(res.status).toBe(200);
      expect(res.body.assignedTo).toBeDefined();
      expect(res.body.assignedTo.id).toBe(itStaff1.id);
      expect(res.body.assignedTo.name).toBe("Detail Staff 1");
    });

    it("allows reassigning ticket to Administrator", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/assign`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ assignedToId: adminUser.id });

      expect(res.status).toBe(200);
      expect(res.body.assignedTo.id).toBe(adminUser.id);
    });

    it("allows unassigning ticket by setting assignedToId to null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/assign`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ assignedToId: null });

      expect(res.status).toBe(200);
      expect(res.body.assignedTo).toBeNull();
    });

    it("rejects assigning ticket to a Requester user with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/assign`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ assignedToId: requester1.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid Assignee");
    });
  });

  // -------------------------------------------------------------------------
  // API-15 (AC-14, BR-13): Update IT Priority
  // -------------------------------------------------------------------------
  describe("API-15: PATCH /api/staff/tickets/:id/priority", () => {
    it("returns 403 Forbidden when Requester attempts to update itPriority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/priority`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ itPriority: "URGENT" });

      expect(res.status).toBe(403);
    });

    it("updates itPriority while preserving requestedPriority intact", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/priority`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ itPriority: "URGENT" });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("URGENT");
      expect(res.body.requestedPriority).toBe("MEDIUM");
    });

    it("rejects invalid itPriority values with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/priority`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // API-16 (AC-15, BR-16): Ticket Status Lifecycle & Transition Matrix
  // -------------------------------------------------------------------------
  describe("API-16: PATCH /api/staff/tickets/:id/status", () => {
    it("returns 403 Forbidden for Requester", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ status: "Open" });

      expect(res.status).toBe(403);
    });

    it("permits valid status transition: New -> Open", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Open" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Open");
    });

    it("permits valid status transition: Open -> In Progress", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("In Progress");
    });

    it("rejects invalid status jump: In Progress -> New with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "New" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid Status Transition");
      expect(res.body.message).toContain("Transition from 'In Progress' to 'New' is not permitted");
    });

    it("permits valid status transition: In Progress -> Resolved -> Closed", async () => {
      const resResolved = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Resolved" });

      expect(resResolved.status).toBe(200);
      expect(resResolved.body.status).toBe("Resolved");

      const resClosed = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Closed" });

      expect(resClosed.status).toBe(200);
      expect(resClosed.body.status).toBe("Closed");
    });
  });

  // -------------------------------------------------------------------------
  // API-08 (AC-07, BR-14): Requester Resolution Indication
  // -------------------------------------------------------------------------
  describe("API-08: PATCH /api/tickets/:id/resolve-indication", () => {
    it("returns 403 when non-owner requester attempts to indicate resolution", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket1.id}/resolve-indication`)
        .set("Authorization", `Bearer ${requester2Token}`)
        .send({ resolved: true });

      expect(res.status).toBe(403);
    });

    it("sets resolvedIndicated to true without changing ticket status", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket1.id}/resolve-indication`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ resolved: true });

      expect(res.status).toBe(200);
      expect(res.body.resolvedIndicated).toBe(true);
      expect(res.body.resolvedIndicatedAt).toBeDefined();

      const ticketCheck = await prisma.ticket.findUnique({ where: { id: ticket1.id } });
      expect(ticketCheck?.status).toBe("Closed"); // Status remains unmodified
    });
  });

  // -------------------------------------------------------------------------
  // Comments & Internal Notes (API-09, API-10, API-11, AC-08, AC-09, AC-10)
  // -------------------------------------------------------------------------
  describe("Public Comments and Internal Notes", () => {
    it("allows Requester owner and IT Staff to post and read Public Comments", async () => {
      // Requester posts public comment
      const postRes = await request(app)
        .post(`/api/tickets/${ticket1.id}/comments`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ body: "Can someone check this urgently?" });

      expect(postRes.status).toBe(201);
      expect(postRes.body.type).toBe("PUBLIC");
      expect(postRes.body.author.name).toBe("Detail Requester 1");

      // Staff reads public comments
      const getRes = await request(app)
        .get(`/api/tickets/${ticket1.id}/comments`)
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.some((c: any) => c.body === "Can someone check this urgently?")).toBe(true);
    });

    it("rejects non-owner requester from posting or reading public comments", async () => {
      const getRes = await request(app)
        .get(`/api/tickets/${ticket1.id}/comments`)
        .set("Authorization", `Bearer ${requester2Token}`);

      expect(getRes.status).toBe(403);

      const postRes = await request(app)
        .post(`/api/tickets/${ticket1.id}/comments`)
        .set("Authorization", `Bearer ${requester2Token}`)
        .send({ body: "Intruder comment" });

      expect(postRes.status).toBe(403);
    });

    it("strictly blocks Requester from reading or posting Internal Notes (API-10, BR-18)", async () => {
      // Requester read notes -> 403 Forbidden
      const getRes = await request(app)
        .get(`/api/tickets/${ticket1.id}/notes`)
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(getRes.status).toBe(403);

      // Requester post notes -> 403 Forbidden
      const postRes = await request(app)
        .post(`/api/tickets/${ticket1.id}/notes`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ body: "Confidential inquiry" });

      expect(postRes.status).toBe(403);
    });

    it("allows IT Staff and Admin to post and read Internal Notes (API-11, BR-18)", async () => {
      const postRes = await request(app)
        .post(`/api/tickets/${ticket1.id}/notes`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ body: "Escalated to ISP support ticket #88412." });

      expect(postRes.status).toBe(201);
      expect(postRes.body.type).toBe("INTERNAL");
      expect(postRes.body.author.name).toBe("Detail Staff 1");

      const getRes = await request(app)
        .get(`/api/tickets/${ticket1.id}/notes`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.some((n: any) => n.body === "Escalated to ISP support ticket #88412.")).toBe(true);
    });
  });
});
