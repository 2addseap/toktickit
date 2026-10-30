import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 4 — Issue 2: Actions Taken Foundation API Tests", () => {
  const prisma = getPrisma();
  let requesterOwner: any;
  let requesterOther: any;
  let itStaffA: any;
  let itStaffB: any;
  let adminUser: any;

  let requesterOwnerToken: string;
  let requesterOtherToken: string;
  let itStaffAToken: string;
  let itStaffBToken: string;
  let adminToken: string;

  let testTicket: any;
  let testCategory: any;
  let testSystem: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    requesterOwner = await prisma.user.upsert({
      where: { email: "lab4.req.owner@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Lab4 Requester Owner",
        email: "lab4.req.owner@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterOther = await prisma.user.upsert({
      where: { email: "lab4.req.other@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Lab4 Requester Other",
        email: "lab4.req.other@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaffA = await prisma.user.upsert({
      where: { email: "lab4.staff.a@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Lab4 Staff A",
        email: "lab4.staff.a@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaffB = await prisma.user.upsert({
      where: { email: "lab4.staff.b@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Lab4 Staff B",
        email: "lab4.staff.b@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "lab4.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Lab4 Admin",
        email: "lab4.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterOwnerToken = generateToken({
      id: requesterOwner.id,
      email: requesterOwner.email,
      role: requesterOwner.role,
      mustChangePassword: false,
    });

    requesterOtherToken = generateToken({
      id: requesterOther.id,
      email: requesterOther.email,
      role: requesterOther.role,
      mustChangePassword: false,
    });

    itStaffAToken = generateToken({
      id: itStaffA.id,
      email: itStaffA.email,
      role: itStaffA.role,
      mustChangePassword: false,
    });

    itStaffBToken = generateToken({
      id: itStaffB.id,
      email: itStaffB.email,
      role: itStaffB.role,
      mustChangePassword: false,
    });

    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: false,
    });

    // Clean up any stray test categories/systems from previous runs
    await prisma.actionTaken.deleteMany({ where: { ticket: { ticketNumber: "TKT-LAB4-ACT-001" } } });
    await prisma.ticket.deleteMany({ where: { ticketNumber: "TKT-LAB4-ACT-001" } });
    await prisma.relatedSystem.deleteMany({ where: { name: "Lab4 Test System" } });
    await prisma.category.deleteMany({ where: { name: "Lab4 Test Category" } });

    // Use standard existing category and system
    testCategory = await prisma.category.findUnique({
      where: { name: "Hardware" },
    });

    testSystem = await prisma.relatedSystem.findUnique({
      where: { name: "Corporate Laptop" },
    });

    testTicket = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-LAB4-ACT-001" },
      update: {
        requesterId: requesterOwner.id,
        assignedToId: itStaffA.id,
        status: "In Progress",
      },
      create: {
        ticketNumber: "TKT-LAB4-ACT-001",
        requesterId: requesterOwner.id,
        assignedToId: itStaffA.id,
        categoryId: testCategory.id,
        relatedSystemId: testSystem.id,
        summary: "Lab 4 Actions Taken Test Ticket",
        description: "Testing parent-child work tracking under tickets.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        status: "In Progress",
      },
    });
  });

  describe("1. Action Taken Creation & Authorization (AC-01, AC-02, BR-01..03, BR-05)", () => {
    it("AC-01: IT Staff creates a valid Action Taken with auto performer attribution", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Replaced faulty RAM stick in slot 2.",
          result: "Memory diagnostics passed 100% with no page faults.",
          followUpRequired: false,
          attachmentNotes: "memtest-results.log",
        });

      expect(res.status).toBe(201);
      expect(res.body.ticketId).toBe(testTicket.id);
      expect(res.body.performedById).toBe(itStaffA.id);
      expect(res.body.performedBy.name).toBe("Lab4 Staff A");
      expect(res.body.actionDescription).toBe("Replaced faulty RAM stick in slot 2.");
      expect(res.body.result).toBe("Memory diagnostics passed 100% with no page faults.");
      expect(res.body.followUpRequired).toBe(false);
      expect(res.body.followUpNote).toBeNull();
      expect(res.body.attachmentNotes).toBe("memtest-results.log");
    });

    it("AC-02: Requesters are blocked from creating Actions Taken with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterOwnerToken}`)
        .send({
          actionDescription: "Attempted to log action as requester.",
          result: "Should fail.",
        });

      expect(res.status).toBe(403);
    });

    it("requires authentication to create Actions Taken (401 Unauthorized)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .send({
          actionDescription: "Unauthenticated action attempt.",
          result: "Should fail with 401.",
        });

      expect(res.status).toBe(401);
    });

    it("returns 404 when adding an action to a non-existent ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/999999/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Valid description for missing ticket.",
          result: "Valid result.",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("2. Validation Rules (UNIT-02, AC-05, BR-04)", () => {
    it("UNIT-02 / AC-05: rejects action when followUpRequired is true but followUpNote is missing/empty", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Applied kernel patch to web server.",
          result: "System rebooted successfully.",
          followUpRequired: true,
          followUpNote: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.fieldErrors?.followUpNote).toBeDefined();
    });

    it("accepts action when followUpRequired is true and followUpNote is provided", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Applied kernel patch to web server.",
          result: "System rebooted successfully.",
          followUpRequired: true,
          followUpNote: "Monitor CPU load at 09:00 AM tomorrow.",
        });

      expect(res.status).toBe(201);
      expect(res.body.followUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("Monitor CPU load at 09:00 AM tomorrow.");
    });

    it("rejects action if actionDescription is under 3 characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "OK",
          result: "Valid result description.",
        });

      expect(res.status).toBe(400);
      expect(res.body.fieldErrors?.actionDescription).toBeDefined();
    });

    it("rejects action if result is under 3 characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Checked power cable connectivity.",
          result: "NO",
        });

      expect(res.status).toBe(400);
      expect(res.body.fieldErrors?.result).toBeDefined();
    });
  });

  describe("3. Collaborative Multi-Staff Execution (AC-06, BR-02)", () => {
    it("AC-06: Staff B records an action on a ticket assigned to Staff A, preserving primary owner", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffBToken}`)
        .send({
          actionDescription: "Assisted Staff A by running diagnostic network packet traces.",
          result: "Captured 10,000 packets without drops.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.performedById).toBe(itStaffB.id);
      expect(res.body.performedBy.name).toBe("Lab4 Staff B");

      // Verify ticket's primary assignment remained assigned to Staff A
      const ticketCheck = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      expect(ticketCheck?.assignedToId).toBe(itStaffA.id);
    });
  });

  describe("4. Reading Actions Taken & Ownership Isolation (AC-03, AC-04, BR-03)", () => {
    it("AC-03: Ticket owner (Requester) can read all Actions Taken on their owned ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterOwnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty("actionDescription");
      expect(res.body[0]).toHaveProperty("result");
      expect(res.body[0]).toHaveProperty("performedBy");
    });

    it("AC-04: Non-owner Requester receives 403 Forbidden when requesting other's Actions Taken", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterOtherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });

    it("IT Staff can read Actions Taken on any ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("5. Updating Actions Taken & Concurrency Conflict (AC-07, AC-08, FR-09)", () => {
    let createdActionId: number;
    let initialUpdatedAt: string;

    beforeAll(async () => {
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          performedById: itStaffA.id,
          actionDescription: "Initial description for update testing.",
          result: "Initial result description.",
          followUpRequired: false,
        },
      });
      createdActionId = action.id;
      initialUpdatedAt = action.updatedAt.toISOString();
    });

    it("AC-07: IT Staff successfully updates an Action Taken", async () => {
      const res = await request(app)
        .patch(`/api/actions/${createdActionId}`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Updated technical intervention description.",
          result: "Updated outcome: issue permanently resolved.",
          followUpRequired: true,
          followUpNote: "Re-verify after weekend.",
          clientUpdatedAt: initialUpdatedAt,
        });

      expect(res.status).toBe(200);
      expect(res.body.actionDescription).toBe("Updated technical intervention description.");
      expect(res.body.result).toBe("Updated outcome: issue permanently resolved.");
      expect(res.body.followUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("Re-verify after weekend.");
    });

    it("AC-08: Stale clientUpdatedAt returns 409 Conflict", async () => {
      // Simulate stale update by providing a timestamp in the past
      const staleTimestamp = new Date("2020-01-01T00:00:00Z").toISOString();

      const res = await request(app)
        .patch(`/api/actions/${createdActionId}`)
        .set("Authorization", `Bearer ${itStaffAToken}`)
        .send({
          actionDescription: "Concurrent overwrite attempt.",
          clientUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONCURRENT_UPDATE_CONFLICT");
    });

    it("Requesters are blocked from updating Actions Taken (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/actions/${createdActionId}`)
        .set("Authorization", `Bearer ${requesterOwnerToken}`)
        .send({
          actionDescription: "Requester edit attempt.",
        });

      expect(res.status).toBe(403);
    });
  });
});
