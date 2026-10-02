import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { generateToken } from "../../src/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 — Issue 3: Administrator User Management API Tests", () => {
  const prisma = getPrisma();
  let adminToken: string;
  let adminUser: any;
  let secondAdminToken: string;
  let secondAdminUser: any;
  let requesterToken: string;
  let staffToken: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Primary Admin
    adminUser = await prisma.user.upsert({
      where: { email: "primary.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Primary Admin",
        email: "primary.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // Secondary Admin for multi-admin testing
    secondAdminUser = await prisma.user.upsert({
      where: { email: "secondary.admin@kmutt.ac.th" },
      update: { role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Secondary Admin",
        email: "secondary.admin@kmutt.ac.th",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // Regular Requester
    const requester = await prisma.user.upsert({
      where: { email: "regular.requester@kmutt.ac.th" },
      update: { role: "REQUESTER", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Regular Requester",
        email: "regular.requester@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // Regular IT Staff
    const staff = await prisma.user.upsert({
      where: { email: "regular.staff@kmutt.ac.th" },
      update: { role: "IT_STAFF", isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Regular Staff",
        email: "regular.staff@kmutt.ac.th",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: false,
    });

    secondAdminToken = generateToken({
      id: secondAdminUser.id,
      email: secondAdminUser.email,
      role: secondAdminUser.role,
      mustChangePassword: false,
    });

    requesterToken = generateToken({
      id: requester.id,
      email: requester.email,
      role: requester.role,
      mustChangePassword: false,
    });

    staffToken = generateToken({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      mustChangePassword: false,
    });
  });

  // -------------------------------------------------------------------------
  // API-22 (AC-21, BR-10): Admin Endpoints Access Control
  // -------------------------------------------------------------------------
  describe("API-22: Access Control for Admin Endpoints", () => {
    it("returns 401 Unauthorized when unauthenticated request accesses admin routes", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 Forbidden when Requester accesses admin routes", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${requesterToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access Denied");
    });

    it("returns 403 Forbidden when IT Staff accesses admin routes", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access Denied");
    });
  });

  // -------------------------------------------------------------------------
  // API-17 (AC-16, FR-15): List Admin Users with Search & Filter
  // -------------------------------------------------------------------------
  describe("API-17: GET /api/admin/users (Directory & Search/Filter)", () => {
    it("returns 200 OK and list of users without exposing passwordHash", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify no password hash is leaked
      for (const u of res.body) {
        expect(u.passwordHash).toBeUndefined();
        expect(u).toHaveProperty("id");
        expect(u).toHaveProperty("name");
        expect(u).toHaveProperty("email");
        expect(u).toHaveProperty("role");
        expect(u).toHaveProperty("isActive");
      }
    });

    it("filters users by role correctly", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=REQUESTER")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((u: any) => u.role === "REQUESTER")).toBe(true);
    });

    it("filters users by search term matching name or email (case-insensitive)", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=primary.admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((u: any) => u.email === "primary.admin@kmutt.ac.th")).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // API-18 (AC-17, FR-16): Create User with Initial Password & Forced Change
  // -------------------------------------------------------------------------
  describe("API-18: POST /api/admin/users (Create User)", () => {
    it("rejects user creation with missing required fields with 400", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Incomplete User" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Failed");
    });

    it("rejects user creation with invalid role with 400", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Bad Role User",
          email: "badrole@kmutt.ac.th",
          role: "SUPERUSER",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(400);
    });

    it("rejects user creation with short initial password (< 8 chars) with 400", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Short Pass User",
          email: "shortpass@kmutt.ac.th",
          role: "REQUESTER",
          initialPassword: "short",
        });

      expect(res.status).toBe(400);
    });

    it("provisions new user with initial password and sets mustChangePassword to true", async () => {
      const testEmail = `new.staff.${Date.now()}@kmutt.ac.th`;
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New IT Member",
          email: testEmail,
          role: "IT_STAFF",
          department: "Infrastructure Support",
          isActive: true,
          initialPassword: "TemporaryPassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("New IT Member");
      expect(res.body.email).toBe(testEmail);
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.department).toBe("Infrastructure Support");
      expect(res.body.isActive).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body.passwordHash).toBeUndefined();

      // Test that the newly created user can log in with their initial password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "TemporaryPassword123!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // API-19 (AC-18, BR-25): Duplicate Email Rejection
  // -------------------------------------------------------------------------
  describe("API-19: Duplicate Email Rejection (409 Conflict)", () => {
    it("returns 409 Conflict when attempting to create a user with existing email", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate User",
          email: "PRIMARY.ADMIN@KMUTT.AC.TH", // Case-insensitive duplicate
          role: "REQUESTER",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Conflict");
      expect(res.body.message).toContain("already exists");
    });

    it("returns 409 Conflict when attempting to update user email to an existing email", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${secondAdminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "primary.admin@kmutt.ac.th",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Conflict");
    });
  });

  // -------------------------------------------------------------------------
  // API-20 (AC-19, BR-22): Self-Deactivation Prevention
  // -------------------------------------------------------------------------
  describe("API-20: Self-Deactivation Prevention (BR-22)", () => {
    it("returns 400 Bad Request when an Administrator attempts to deactivate their own account", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.message).toBe("You cannot deactivate your own account.");
    });
  });

  // -------------------------------------------------------------------------
  // API-21 (AC-20, BR-23): Last Active Administrator Protection
  // -------------------------------------------------------------------------
  describe("API-21: Last Active Administrator Protection (BR-23)", () => {
    it("allows deactivating a second administrator when multiple active administrators exist", async () => {
      // First ensure second admin is active
      await prisma.user.update({
        where: { id: secondAdminUser.id },
        data: { isActive: true, role: "ADMINISTRATOR" },
      });

      // Primary admin deactivates second admin
      const res = await request(app)
        .patch(`/api/admin/users/${secondAdminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });

    it("returns 400 Bad Request when attempting to demote or deactivate the last remaining active Administrator", async () => {
      // Temporarily store all active administrators except primary admin and deactivate them
      const otherAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", isActive: true, NOT: { id: adminUser.id } },
      });

      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((a) => a.id) } },
        data: { isActive: false },
      });

      try {
        // Now adminUser is the ONLY active Administrator in the entire database
        const res = await request(app)
          .patch(`/api/admin/users/${adminUser.id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            role: "IT_STAFF",
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Bad Request");
        expect(res.body.message).toBe("Cannot deactivate or change role of the last active Administrator.");
      } finally {
        // Restore active state for other admins
        await prisma.user.updateMany({
          where: { id: { in: otherAdmins.map((a) => a.id) } },
          data: { isActive: true },
        });

        // Ensure primary admin is still active and an ADMINISTRATOR
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { isActive: true, role: "ADMINISTRATOR" },
        });
      }
    });
  });

  // -------------------------------------------------------------------------
  // Reset User Password
  // -------------------------------------------------------------------------
  describe("POST /api/admin/users/:id/reset-password", () => {
    it("resets password, updates hash, and enforces mustChangePassword flag", async () => {
      // Reactivate second admin
      await prisma.user.update({
        where: { id: secondAdminUser.id },
        data: { isActive: true, mustChangePassword: false },
      });

      const res = await request(app)
        .post(`/api/admin/users/${secondAdminUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          newInitialPassword: "ResetPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Initial password reset successfully.");

      const updated = await prisma.user.findUnique({
        where: { id: secondAdminUser.id },
      });
      expect(updated?.mustChangePassword).toBe(true);

      // Verify login with new initial password works
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: secondAdminUser.email,
          password: "ResetPassword123!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
    });

    it("rejects password reset with invalid length (< 8 chars)", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${secondAdminUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          newInitialPassword: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Failed");
    });
  });
});
