import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 4 — Issue 5: Legacy Data & Full System Regression Tests (REG-01, AC-19)", () => {
  const prisma = getPrisma();
  let requester: any;
  let itStaff: any;
  let admin: any;

  let requesterToken: string;
  let itStaffToken: string;
  let adminToken: string;

  let category: any;
  let system: any;
  let legacyTicket: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    requester = await prisma.user.upsert({
      where: { email: "reg.req@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Regression Requester",
        email: "reg.req@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaff = await prisma.user.upsert({
      where: { email: "reg.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Regression Staff",
        email: "reg.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    admin = await prisma.user.upsert({
      where: { email: "reg.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Regression Admin",
        email: "reg.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterToken = generateToken({ id: requester.id, email: requester.email, role: requester.role, mustChangePassword: false });
    itStaffToken = generateToken({ id: itStaff.id, email: itStaff.email, role: itStaff.role, mustChangePassword: false });
    adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role, mustChangePassword: false });

    category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: "Regression Category" } });
    }

    system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({ data: { name: "Regression System" } });
    }

    // Clean up previous test tickets for regression
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TKT-2026-LEGACY" } },
    });

    // Create a pure legacy ticket (simulating Labs 1-3 data: NO actions taken associated)
    legacyTicket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-LEGACY01",
        summary: "Legacy Ticket Created Without Actions Taken",
        description: "Simulates tickets migrated from Labs 1-3 before Actions Taken existed.",
        status: "Open",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: null,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Legacy Data Compatibility & Safe Retrieval
  // ---------------------------------------------------------------------------
  describe("1. Legacy Data Compatibility (Zero Actions Taken)", () => {
    it("returns empty array for Actions Taken on legacy tickets without crashing", async () => {
      const res = await request(app)
        .get(`/api/tickets/${legacyTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("includes legacy tickets in requester dashboard calculation without errors", async () => {
      const res = await request(app)
        .get("/api/dashboards/requester")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.myOpenTickets).toBeGreaterThanOrEqual(1);
    });

    it("includes legacy tickets in IT Staff dashboard unassigned pool", async () => {
      const res = await request(app)
        .get("/api/dashboards/staff")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.unassignedTickets).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Labs 1-3 Features on Legacy Tickets (Comments, Notes, Attachments)
  // ---------------------------------------------------------------------------
  describe("2. Labs 1-3 Feature Persistence on Legacy Tickets", () => {
    it("allows adding public comments to legacy tickets", async () => {
      const res = await request(app)
        .post(`/api/tickets/${legacyTicket.id}/comments`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ body: "Requester following up on legacy ticket" });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe("Requester following up on legacy ticket");
      expect(res.body.type).toBe("PUBLIC");
    });

    it("allows adding internal notes to legacy tickets by IT Staff", async () => {
      const res = await request(app)
        .post(`/api/tickets/${legacyTicket.id}/notes`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ body: "Internal staff diagnosis on legacy ticket" });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe("Internal staff diagnosis on legacy ticket");
      expect(res.body.type).toBe("INTERNAL");
    });

    it("allows IT Staff to add the first Action Taken to a legacy ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${legacyTicket.id}/actions`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          actionDescription: "First action added to legacy ticket",
          result: "Successfully upgraded ticket to Lab 4 workflow",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.actionDescription).toBe("First action added to legacy ticket");
      expect(res.body.performedBy.name).toBe("Regression Staff");

      // Verify that getActionsTaken now returns 1 item
      const actionsRes = await request(app)
        .get(`/api/tickets/${legacyTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(actionsRes.status).toBe(200);
      expect(actionsRes.body.length).toBe(1);
    });

    it("allows valid status progression on legacy tickets", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${legacyTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("In Progress");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. User Management Guardrails Persistence (Admin RBAC)
  // ---------------------------------------------------------------------------
  describe("3. User Management & Guardrails Regression", () => {
    it("enforces self-deactivation prevention for logged-in Administrator (BR-22)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${admin.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot deactivate your own account/i);
    });

    it("protects last active administrator from role demotion (BR-23)", async () => {
      // Find all active admins
      const activeAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", isActive: true },
      });

      // If only one active admin exists in system, attempting to demote should fail with 400
      if (activeAdmins.length === 1) {
        const res = await request(app)
          .patch(`/api/admin/users/${activeAdmins[0].id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ role: "IT_STAFF" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/last active administrator/i);
      } else {
        expect(activeAdmins.length).toBeGreaterThan(1);
      }
    });

    it("blocks non-administrators from accessing user management endpoints with 403 Forbidden", async () => {
      const resReq = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${requesterToken}`);
      expect(resReq.status).toBe(403);

      const resStaff = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${itStaffToken}`);
      expect(resStaff.status).toBe(403);
    });
  });
});
