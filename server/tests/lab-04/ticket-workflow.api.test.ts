import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, STATUS_TRANSITION_MATRIX } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 4 — Issue 3: Ticket Workflow, Permitted Transitions & Conflict Resolution API Tests", () => {
  const prisma = getPrisma();
  let requesterOwner: any;
  let requesterOther: any;
  let itStaff: any;
  let adminUser: any;

  let requesterOwnerToken: string;
  let requesterOtherToken: string;
  let itStaffToken: string;
  let adminToken: string;

  let testCategory: any;
  let testSystem: any;
  let testTicket: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    requesterOwner = await prisma.user.upsert({
      where: { email: "wf.owner@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Workflow Requester Owner",
        email: "wf.owner@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterOther = await prisma.user.upsert({
      where: { email: "wf.other@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Workflow Requester Other",
        email: "wf.other@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaff = await prisma.user.upsert({
      where: { email: "wf.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Workflow IT Staff",
        email: "wf.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "wf.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Workflow Admin",
        email: "wf.admin@kmutt.ac.th",
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
    itStaffToken = generateToken({
      id: itStaff.id,
      email: itStaff.email,
      role: itStaff.role,
      mustChangePassword: false,
    });
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: false,
    });

    testCategory = await prisma.category.findUnique({
      where: { name: "Hardware" },
    });
    testSystem = await prisma.relatedSystem.findUnique({
      where: { name: "Corporate Laptop" },
    });

    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `T-WF-${Date.now()}`,
        summary: "Workflow Ticket Lifecycle Test",
        description: "Testing state transitions, conflict detection, and resolution signals.",
        status: "New",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        categoryId: testCategory.id,
        relatedSystemId: testSystem?.id || null,
        requesterId: requesterOwner.id,
        assignedToId: itStaff.id,
      },
    });
  });

  // -------------------------------------------------------------------------
  // UNIT-01: Status Transition Matrix Validator (BR-08, AC-10)
  // -------------------------------------------------------------------------
  describe("UNIT-01: Status Transition Matrix Finite State Machine Validation", () => {
    it("strictly defines allowed transitions matching specification BR-08", () => {
      expect(STATUS_TRANSITION_MATRIX["New"]).toEqual(["Open", "In Progress", "Cancelled"]);
      expect(STATUS_TRANSITION_MATRIX["Open"]).toEqual(["In Progress", "Waiting for Requester", "Resolved", "Cancelled"]);
      expect(STATUS_TRANSITION_MATRIX["In Progress"]).toEqual(["Waiting for Requester", "Resolved", "Cancelled"]);
      expect(STATUS_TRANSITION_MATRIX["Waiting for Requester"]).toEqual(["In Progress", "Resolved", "Cancelled"]);
      expect(STATUS_TRANSITION_MATRIX["Resolved"]).toEqual(["Closed", "Reopened"]);
      expect(STATUS_TRANSITION_MATRIX["Closed"]).toEqual(["Reopened"]);
      expect(STATUS_TRANSITION_MATRIX["Reopened"]).toEqual(["In Progress", "Waiting for Requester", "Resolved", "Cancelled"]);
      expect(STATUS_TRANSITION_MATRIX["Cancelled"]).toEqual([]);
    });

    it("verifies Cancelled is a terminal state with no outgoing transitions", () => {
      expect(STATUS_TRANSITION_MATRIX["Cancelled"]).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // API-08: Permitted Status Transition to Resolved (AC-09, BR-09)
  // -------------------------------------------------------------------------
  describe("API-08: Permitted Status Transition to Resolved (AC-09)", () => {
    it("progresses ticket from New -> In Progress -> Resolved successfully by IT Staff", async () => {
      // Step 1: New -> In Progress
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "In Progress" });

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe("In Progress");

      // Step 2: In Progress -> Resolved
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Resolved" });

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe("Resolved");

      // Check DB persistence
      const fresh = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      expect(fresh?.status).toBe("Resolved");
    });
  });

  // -------------------------------------------------------------------------
  // API-09: Illegal Status Jump Rejection (AC-10, BR-08)
  // -------------------------------------------------------------------------
  describe("API-09: Illegal Status Jump Rejection (AC-10)", () => {
    it("rejects invalid jump from Resolved to In Progress with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "In Progress" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid Status Transition");
      expect(res.body.allowedTransitions).toEqual(["Closed", "Reopened"]);
    });

    it("rejects invalid jump directly from New to Closed on a fresh ticket", async () => {
      const freshTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `T-WF-NEW-${Date.now()}`,
          summary: "New Ticket For Invalid Jump Test",
          description: "Attempting to jump from New directly to Closed.",
          status: "New",
          requestedPriority: "LOW",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterOwner.id,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Closed" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid Status Transition");
      expect(res.body.allowedTransitions).toEqual(["Open", "In Progress", "Cancelled"]);
    });

    it("rejects any transition attempt from Cancelled terminal state", async () => {
      const cancelledTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `T-WF-CNC-${Date.now()}`,
          summary: "Cancelled Ticket Test",
          description: "Cancelled tickets cannot change state.",
          status: "Cancelled",
          requestedPriority: "LOW",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterOwner.id,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${cancelledTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "Reopened" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid Status Transition");
      expect(res.body.allowedTransitions).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // API-10: Advisory Requester Resolution Signal (AC-11, BR-10)
  // -------------------------------------------------------------------------
  describe("API-10: Advisory Requester Resolution Indication (AC-11)", () => {
    let activeTicket: any;

    beforeAll(async () => {
      activeTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `T-WF-RES-${Date.now()}`,
          summary: "Advisory Resolution Ticket",
          description: "Requester indicates resolution without mutating status.",
          status: "In Progress",
          requestedPriority: "HIGH",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterOwner.id,
        },
      });
    });

    it("allows ticket owner to mark problem appears resolved without altering ticket status", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${activeTicket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterOwnerToken}`)
        .send({ resolved: true });

      expect(res.status).toBe(200);
      expect(res.body.resolvedIndicated).toBe(true);
      expect(res.body.resolvedIndicatedAt).toBeDefined();

      // Check DB: resolvedIndicated is true, but status is still In Progress!
      const fresh = await prisma.ticket.findUnique({ where: { id: activeTicket.id } });
      expect(fresh?.resolvedIndicated).toBe(true);
      expect(fresh?.status).toBe("In Progress");
    });

    it("blocks non-owner requester from indicating resolution on another user's ticket", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${activeTicket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterOtherToken}`)
        .send({ resolved: true });

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // Concurrency & Role Guards (AC-08, FR-09, FR-07)
  // -------------------------------------------------------------------------
  describe("Optimistic Concurrency Control & Role Authorization on Status Updates", () => {
    it("returns 409 Conflict when clientUpdatedAt is older than ticket.updatedAt", async () => {
      const concurTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `T-WF-CONC-${Date.now()}`,
          summary: "Concurrency Status Test",
          description: "Testing stale clientUpdatedAt rejection.",
          status: "Open",
          requestedPriority: "MEDIUM",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterOwner.id,
        },
      });

      // Pass a stale timestamp (1 hour ago)
      const staleTime = new Date(Date.now() - 3600 * 1000).toISOString();

      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: "In Progress",
          clientUpdatedAt: staleTime,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONCURRENT_UPDATE_CONFLICT");
      expect(res.body.error).toBe("Conflict");
    });

    it("succeeds when clientUpdatedAt matches or is newer than ticket.updatedAt", async () => {
      const concurTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `T-WF-CONC2-${Date.now()}`,
          summary: "Fresh Concurrency Status Test",
          description: "Testing valid clientUpdatedAt acceptance.",
          status: "Open",
          requestedPriority: "MEDIUM",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterOwner.id,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: "In Progress",
          clientUpdatedAt: concurTicket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("In Progress");
    });

    it("rejects status transition attempt by Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${requesterOwnerToken}`)
        .send({ status: "Reopened" });

      expect(res.status).toBe(403);
    });

    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket.id}/status`)
        .send({ status: "Reopened" });

      expect(res.status).toBe(401);
    });
  });
});
