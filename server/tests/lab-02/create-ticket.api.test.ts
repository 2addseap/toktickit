import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 — Issue 2: Development Requester & Reference Data APIs", () => {
  it("GET /api/requesters returns only active development requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    // Verify inactive requester (e.g. Alex Inactive) is excluded
    const inactive = res.body.find(
      (r: { name: string; isActive: boolean }) => !r.isActive || r.name === "Alex Inactive"
    );
    expect(inactive).toBeUndefined();

    // Verify required fields
    const first = res.body[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("email");
    expect(first).toHaveProperty("department");
    expect(first.isActive).toBe(true);
  });

  it("GET /api/related-systems returns the seeded IT related systems", async () => {
    const res = await request(app).get("/api/related-systems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);

    const names = res.body.map((s: { name: string }) => s.name);
    expect(names).toContain("Corporate Laptop");
    expect(names).toContain("Campus Wi-Fi");
    expect(names).toContain("Email");
    expect(names).toContain("LEB2 App");
    expect(names).toContain("VPN");
    expect(names).toContain("Printer");
  });

  it("GET /api/categories returns the 4 seeded categories in id order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ]);
  });
});
