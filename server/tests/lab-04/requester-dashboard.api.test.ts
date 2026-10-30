import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 4 — Issue 4: Requester Dashboard API Tests (API-11, API-12, API-13)", () => {
  const prisma = getPrisma();
  let requesterA: any;
  let requesterB: any;
  let emptyRequester: any;
  let itStaff: any;

  let tokenA: string;
  let tokenB: string;
  let tokenEmpty: string;
  let tokenStaff: string;

  let category: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    requesterA = await prisma.user.upsert({
      where: { email: "dash.req.a@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Requester A",
        email: "dash.req.a@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterB = await prisma.user.upsert({
      where: { email: "dash.req.b@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Requester B",
        email: "dash.req.b@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    emptyRequester = await prisma.user.upsert({
      where: { email: "dash.empty.req@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Empty Requester",
        email: "dash.empty.req@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    itStaff = await prisma.user.upsert({
      where: { email: "dash.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Dashboard Staff",
        email: "dash.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    tokenA = generateToken({ id: requesterA.id, email: requesterA.email, role: requesterA.role, mustChangePassword: false });
    tokenB = generateToken({ id: requesterB.id, email: requesterB.email, role: requesterB.role, mustChangePassword: false });
    tokenEmpty = generateToken({ id: emptyRequester.id, email: emptyRequester.email, role: emptyRequester.role, mustChangePassword: false });
    tokenStaff = generateToken({ id: itStaff.id, email: itStaff.email, role: itStaff.role, mustChangePassword: false });

    category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Dashboard Test Category" },
      });
    }

    let system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({
        data: { name: "Dashboard Test System" },
      });
    }

    // Clean up previous test tickets for requesterA and requesterB
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [requesterA.id, requesterB.id, emptyRequester.id] } },
    });

    // Create tickets for Requester A:
    // 1 New ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH01`,
        summary: "Requester A New Ticket",
        description: "Testing new ticket metric calculation",
        status: "New",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // 1 Open ticket (Total myOpenTickets = 1 New + 1 Open = 2)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH02`,
        summary: "Requester A Open Ticket",
        description: "Testing open ticket metric calculation",
        status: "Open",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // 2 In Progress tickets
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH03`,
        summary: "Requester A In Progress Ticket 1",
        description: "Testing in progress metric calculation",
        status: "In Progress",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH04`,
        summary: "Requester A In Progress Ticket 2",
        description: "Testing in progress metric calculation 2",
        status: "In Progress",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // 1 Waiting for Requester ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH05`,
        summary: "Requester A Waiting Ticket",
        description: "Testing waiting for requester metric calculation",
        status: "Waiting for Requester",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // 1 Resolved ticket (within 30 days)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH06`,
        summary: "Requester A Resolved Ticket",
        description: "Testing resolved ticket metric calculation",
        status: "Resolved",
        requestedPriority: "LOW",
        itPriority: "LOW",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        updatedAt: new Date(),
      },
    });

    // 1 Cancelled ticket (should NOT count towards open, in progress, waiting, or resolved)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASH07`,
        summary: "Requester A Cancelled Ticket",
        description: "Testing cancelled ticket exclusion",
        status: "Cancelled",
        requestedPriority: "LOW",
        itPriority: "LOW",
        requesterId: requesterA.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    // Create tickets for Requester B to test boundary isolation:
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DASHB1`,
        summary: "Requester B In Progress Ticket",
        description: "Should not be counted for Requester A",
        status: "In Progress",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        requesterId: requesterB.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });
  });

  it("API-11 (AC-12, FR-10): returns accurate metric calculations and recent tickets for authenticated requester", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");

    const { metrics, recentTickets } = res.body;

    // myOpenTickets: 'New' (1) + 'Open' (1) = 2
    expect(metrics.myOpenTickets).toBe(2);
    // inProgressTickets: 2
    expect(metrics.inProgressTickets).toBe(2);
    // waitingForRequesterTickets: 1
    expect(metrics.waitingForRequesterTickets).toBe(1);
    // recentlyResolvedTickets: 1
    expect(metrics.recentlyResolvedTickets).toBe(1);

    // recentTickets should be capped at 5 and strictly owned by Requester A
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);
    for (const t of recentTickets) {
      expect(t.ticketNumber).toMatch(/^TKT-2026-DASH0/);
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("summary");
      expect(t).toHaveProperty("status");
      expect(t).toHaveProperty("itPriority");
    }
  });

  it("API-12 (AC-12, FR-11): enforces strict requester isolation boundary", async () => {
    const resB = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    const { metrics, recentTickets } = resB.body;

    // Requester B only has 1 In Progress ticket
    expect(metrics.myOpenTickets).toBe(0);
    expect(metrics.inProgressTickets).toBe(1);
    expect(metrics.waitingForRequesterTickets).toBe(0);
    expect(metrics.recentlyResolvedTickets).toBe(0);

    expect(recentTickets.length).toBe(1);
    expect(recentTickets[0].ticketNumber).toBe("TKT-2026-DASHB1");
  });

  it("API-13 (AC-13, FR-10): returns zero metrics and empty array for requester with no tickets", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${tokenEmpty}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      metrics: {
        myOpenTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        recentlyResolvedTickets: 0,
      },
      recentTickets: [],
    });
  });

  it("requires authentication (returns 401 Unauthorized when unauthenticated)", async () => {
    const res = await request(app).get("/api/dashboards/requester");
    expect(res.status).toBe(401);
  });
});
