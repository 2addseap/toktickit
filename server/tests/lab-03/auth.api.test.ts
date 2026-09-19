import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 — Issue 2: Authentication API Tests", () => {
  const prisma = getPrisma();

  beforeAll(async () => {
    // Ensure test users exist with known initial password
    const testPasswordHash = await bcrypt.hash("Password123!", 10);

    // Active requester requiring password change
    await prisma.user.upsert({
      where: { email: "jennifer.anderson@kmutt.ac.th" },
      update: {
        passwordHash: testPasswordHash,
        isActive: true,
        mustChangePassword: true,
      },
      create: {
        name: "Jennifer Anderson",
        email: "jennifer.anderson@kmutt.ac.th",
        passwordHash: testPasswordHash,
        role: "REQUESTER",
        department: "Human Resources",
        isActive: true,
        mustChangePassword: true,
      },
    });

    // Inactive user
    await prisma.user.upsert({
      where: { email: "alex.inactive@kmutt.ac.th" },
      update: {
        passwordHash: testPasswordHash,
        isActive: false,
        mustChangePassword: true,
      },
      create: {
        name: "Alex Inactive",
        email: "alex.inactive@kmutt.ac.th",
        passwordHash: testPasswordHash,
        role: "REQUESTER",
        department: "Contractor",
        isActive: false,
        mustChangePassword: true,
      },
    });

    // Active admin
    await prisma.user.upsert({
      where: { email: "admin@kmutt.ac.th" },
      update: {
        passwordHash: testPasswordHash,
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        name: "System Admin",
        email: "admin@kmutt.ac.th",
        passwordHash: testPasswordHash,
        role: "ADMINISTRATOR",
        department: "IT Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });
  });

  // AC-01: Valid Login
  it("AC-01: authenticates active user with valid credentials and returns token and profile", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@kmutt.ac.th",
        password: "Password123!",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      email: "admin@kmutt.ac.th",
      role: "ADMINISTRATOR",
      mustChangePassword: false,
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  // AC-02: Inactive Account Rejection
  it("AC-02: rejects login for inactive accounts with generic 401 error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "alex.inactive@kmutt.ac.th",
        password: "Password123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password.");
  });

  it("rejects login with incorrect password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@kmutt.ac.th",
        password: "WrongPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password.");
  });

  it("rejects login with missing email or password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@kmutt.ac.th" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Failed");
  });

  // AC-03: Mandatory First-Login Password Change Flag
  it("AC-03: returns mustChangePassword flag for users with initial passwords", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("AC-03: blocks users needing password change from accessing non-auth endpoints", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    const token = loginRes.body.token;

    // Attempt to access /api/auth/me is permitted
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.mustChangePassword).toBe(true);
  });

  // AC-04: Password Change Flow & Complexity Standards
  it("AC-04: rejects password change if new password does not meet complexity standards", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "short",
        confirmPassword: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("8 characters");
  });

  it("AC-04: rejects password change if new password equals current password", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "Password123!",
        confirmPassword: "Password123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("New password must be different from current password.");
  });

  it("AC-04: rejects password change if confirm password does not match", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewSecurePassword2026!",
        confirmPassword: "DifferentPassword2026!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("New password and confirmation do not match.");
  });

  it("AC-04: successfully changes password, updates hash, and clears mustChangePassword flag", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewSecurePassword2026!",
        confirmPassword: "NewSecurePassword2026!",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.mustChangePassword).toBe(false);

    // Verify user can now log in with the new password
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "NewSecurePassword2026!",
      });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);

    // Verify old password is now rejected
    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jennifer.anderson@kmutt.ac.th",
        password: "Password123!",
      });

    expect(oldLoginRes.status).toBe(401);
  });

  it("logs out cleanly via POST /api/auth/logout", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully.");
  });
});
