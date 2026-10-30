import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 4 — Issue 4: IT Staff & Administrator Dashboard API Tests (API-14, API-15, API-16)", () => {
  const prisma = getPrisma();
  let itStaffA: any;
  let itStaffB: any;
  let adminUser: any;
  let requesterUser: any;

  let tokenStaffA: string;
  let tokenStaffB: string;
  let tokenAdmin: string;
  let tokenRequester: string;

  let category: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    itStaffA = await prisma.user.upsert({
      where: { email: "dash.staff.a@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Staff A",
        email: "dash.staff.a@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaffB = await prisma.user.upsert({
      where: { email: "dash.staff.b@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Staff B",
        email: "dash.staff.b@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "dash.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Admin",
        email: "dash.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "dash.normal.req@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Normal Requester",
        email: "dash.normal.req@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    tokenStaffA = generateToken({ id: itStaffA.id, email: itStaffA.email, role: itStaffA.role, mustChangePassword: false });
    tokenStaffB = generateToken({ id: itStaffB.id, email: itStaffB.email, role: itStaffB.role, mustChangePassword: false });
    tokenAdmin = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role, mustChangePassword: false });
    tokenRequester = generateToken({ id: requesterUser.id, email: requesterUser.email, role: requesterUser.role, mustChangePassword: false });

    category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: "Staff Dashboard Category" } });
    }

    let system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({ data: { name: "Staff Dashboard System" } });
    }

    // Clean up previous test tickets for staff tests
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TKT-2026-STAFF" } },
    });

    // 1 Unassigned New ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF01",
        summary: "Staff Unassigned New",
        description: "Staff unassigned test ticket",
        status: "New",
        requestedPriority: "MEDIUM",
        itPriority: "LOW",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: null,
      },
    });

    // 1 Unassigned Open ticket with URGENT IT priority
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF02",
        summary: "Staff Unassigned Open Urgent",
        description: "Staff urgent unassigned ticket",
        status: "Open",
        requestedPriority: "HIGH",
        itPriority: "URGENT",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: null,
      },
    });

    // 1 Ticket Assigned to Staff A: In Progress, URGENT
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF03",
        summary: "Staff A Assigned In Progress Urgent",
        description: "Assigned to Staff A",
        status: "In Progress",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: itStaffA.id,
      },
    });

    // 1 Ticket Assigned to Staff A: Waiting for Requester
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF04",
        summary: "Staff A Waiting for Requester",
        description: "Assigned to Staff A waiting",
        status: "Waiting for Requester",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: itStaffA.id,
      },
    });

    // 1 Ticket Assigned to Staff B: Open
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF05",
        summary: "Staff B Assigned Open",
        description: "Assigned to Staff B",
        status: "Open",
        requestedPriority: "LOW",
        itPriority: "LOW",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: itStaffB.id,
      },
    });

    // 1 Closed ticket (should NOT count in unassigned or myAssigned)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-STAFF06",
        summary: "Staff A Closed",
        description: "Assigned to Staff A but Closed",
        status: "Closed",
        requestedPriority: "LOW",
        itPriority: "LOW",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedToId: itStaffA.id,
      },
    });
  });

  it("API-14 (AC-14, FR-12): returns accurate operational metrics and recent urgent tickets for IT Staff", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${tokenStaffA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentUrgentTickets");

    const { metrics, recentUrgentTickets } = res.body;

    // unassignedTickets (not Closed/Cancelled and assignedToId IS NULL): STAFF01 (New), STAFF02 (Open) -> >= 2
    expect(metrics.unassignedTickets).toBeGreaterThanOrEqual(2);

    // myAssignedTickets for Staff A (assignedToId = itStaffA.id and not Closed/Cancelled): STAFF03 (In Progress), STAFF04 (Waiting) -> 2
    expect(metrics.myAssignedTickets).toBe(2);

    expect(metrics.newTickets).toBeGreaterThanOrEqual(1);
    expect(metrics.openTickets).toBeGreaterThanOrEqual(2);
    expect(metrics.inProgressTickets).toBeGreaterThanOrEqual(1);
    expect(metrics.waitingRequesterTickets).toBeGreaterThanOrEqual(1);
    expect(metrics.urgentTickets).toBeGreaterThanOrEqual(2);

    // Standard IT Staff should NOT see adminUserStats (or it should be null/omitted)
    expect(metrics.adminUserStats).toBeFalsy();

    // recentUrgentTickets should be an array with urgent or recent items
    expect(Array.isArray(recentUrgentTickets)).toBe(true);
    expect(recentUrgentTickets.length).toBeLessThanOrEqual(5);
    for (const t of recentUrgentTickets) {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("ticketNumber");
      expect(t).toHaveProperty("summary");
      expect(t).toHaveProperty("status");
      expect(t).toHaveProperty("itPriority");
    }
  });

  it("API-15 (AC-15, BR-12): blocks Requester from accessing staff dashboard with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${tokenRequester}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("API-16 (AC-16, FR-13): returns staff metrics plus adminUserStats for Administrator", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const { metrics } = res.body;

    expect(metrics).toHaveProperty("adminUserStats");
    expect(metrics.adminUserStats).not.toBeNull();
    expect(metrics.adminUserStats).toHaveProperty("totalUsers");
    expect(metrics.adminUserStats).toHaveProperty("activeUsers");
    expect(metrics.adminUserStats).toHaveProperty("inactiveUsers");

    expect(metrics.adminUserStats.totalUsers).toBeGreaterThanOrEqual(4);
    expect(metrics.adminUserStats.activeUsers).toBeGreaterThanOrEqual(4);
    expect(typeof metrics.adminUserStats.inactiveUsers).toBe("number");
  });

  it("requires authentication (returns 401 Unauthorized when unauthenticated)", async () => {
    const res = await request(app).get("/api/dashboards/staff");
    expect(res.status).toBe(401);
  });
});
