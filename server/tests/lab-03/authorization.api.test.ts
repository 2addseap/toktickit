import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import { app } from "../../src/app.js";
import { authenticate, requireRole, generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 — Issue 2: Authorization & Session Security Tests", () => {
  const prisma = getPrisma();
  let requesterToken: string;
  let itStaffToken: string;
  let adminToken: string;
  let requesterUser: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const requester = await prisma.user.upsert({
      where: { email: "auth.requester@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Auth Requester",
        email: "auth.requester@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });
    requesterUser = requester;

    const itStaff = await prisma.user.upsert({
      where: { email: "auth.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Auth Staff",
        email: "auth.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    const admin = await prisma.user.upsert({
      where: { email: "auth.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Auth Admin",
        email: "auth.admin@kmutt.ac.th",
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
      id: itStaff.id,
      email: itStaff.email,
      role: itStaff.role,
      mustChangePassword: false,
    });

    adminToken = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      mustChangePassword: false,
    });
  });

  it("returns 401 Unauthorized when Authorization header is missing on protected routes", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Authentication token required");
  });

  it("returns 401 Unauthorized when token is invalid or malformed", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-tampered-token-123");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid or expired authentication token");
  });

  it("returns 200 OK and decoded user context when valid token is provided", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("auth.requester@kmutt.ac.th");
    expect(res.body.role).toBe("REQUESTER");
  });

  it("enforces role requirements using requireRole middleware", async () => {
    // Create a temporary test router testing requireRole
    const testApp = express();
    testApp.use(express.json());
    testApp.get("/test/admin-only", authenticate, requireRole("ADMINISTRATOR"), (_req, res) => {
      res.json({ secret: "admin-access-granted" });
    });
    testApp.get("/test/staff-only", authenticate, requireRole("IT_STAFF", "ADMINISTRATOR"), (_req, res) => {
      res.json({ secret: "staff-access-granted" });
    });

    // Requester accessing admin-only -> 403 Forbidden
    const reqToAdmin = await request(testApp)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${requesterToken}`);
    expect(reqToAdmin.status).toBe(403);
    expect(reqToAdmin.body.error).toBe("Access Denied");

    // Staff accessing admin-only -> 403 Forbidden
    const staffToAdmin = await request(testApp)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${itStaffToken}`);
    expect(staffToAdmin.status).toBe(403);

    // Admin accessing admin-only -> 200 OK
    const adminToAdmin = await request(testApp)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminToAdmin.status).toBe(200);
    expect(adminToAdmin.body.secret).toBe("admin-access-granted");

    // Staff accessing staff-only -> 200 OK
    const staffToStaff = await request(testApp)
      .get("/test/staff-only")
      .set("Authorization", `Bearer ${itStaffToken}`);
    expect(staffToStaff.status).toBe(200);
    expect(staffToStaff.body.secret).toBe("staff-access-granted");
  });

  it("API-06 (AC-05): binds GET /api/tickets to authenticated session identity, ignoring spoofed requesterId", async () => {
    const cat = await prisma.category.findFirst();
    const relSys = await prisma.relatedSystem.findFirst();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}`,
        requesterId: requesterUser.id,
        categoryId: cat!.id,
        relatedSystemId: relSys!.id,
        summary: "Session Identity Ticket",
        description: "Testing session binding",
        requestedPriority: "MEDIUM",
        status: "New",
      },
    });

    // Requester calls with token AND spoofed x-requester-id=99999
    const res = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .set("x-requester-id", "99999");

    expect(res.status).toBe(200);
    expect(res.body.data.some((t: any) => t.id === ticket.id)).toBe(true);
  });

  it("API-07 (AC-06): rejects cross-requester ticket access with 403 Forbidden", async () => {
    const otherRequester = await prisma.user.upsert({
      where: { email: "other.requester@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true },
      create: {
        name: "Other Requester",
        email: "other.requester@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: await bcrypt.hash("Password123!", 10),
      },
    });

    const cat = await prisma.category.findFirst();
    const relSys = await prisma.relatedSystem.findFirst();

    const otherTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${(Date.now() + 1).toString().slice(-6)}`,
        requesterId: otherRequester.id,
        categoryId: cat!.id,
        relatedSystemId: relSys!.id,
        summary: "Private Other Requester Ticket",
        description: "Confidential ticket",
        requestedPriority: "HIGH",
        status: "Open",
      },
    });

    // requester tries to access otherRequester's ticket
    const res = await request(app)
      .get(`/api/tickets/${otherTicket.id}`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access Denied");
  });
});
