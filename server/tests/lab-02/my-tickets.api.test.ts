import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 — Issue 4: My Tickets List API Tests", () => {
  beforeAll(async () => {
    // Seed some test tickets for Requester 1 and Requester 2
    await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "LOW",
        summary: "Requester 1 First Account Issue",
        description: "Need help resetting my corporate account access.",
      });

    await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .send({
        categoryId: 2,
        relatedSystemId: 6,
        requestedPriority: "HIGH",
        summary: "Requester 1 Printer Jam on 2nd Floor",
        description: "Printer keeps throwing paper jam error codes.",
      });

    // Create a ticket for Requester 2
    await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "2")
      .send({
        categoryId: 3,
        relatedSystemId: 3,
        requestedPriority: "URGENT",
        summary: "Requester 2 Email Sync Failure",
        description: "Email client is not syncing incoming mail.",
      });
  });

  it("GET /api/tickets returns only tickets owned by the requesting user", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    // Verify all returned tickets belong to Requester 1 (no Requester 2 tickets)
    for (const ticket of res.body.data) {
      expect(ticket.summary).not.toContain("Requester 2");
    }
  });

  it("GET /api/tickets enforces isolation when switching to Requester 2", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", "2");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    for (const ticket of res.body.data) {
      expect(ticket.summary).toContain("Requester 2");
      expect(ticket.summary).not.toContain("Requester 1");
    }
  });

  it("GET /api/tickets supports keyword search on summary and ticket number", async () => {
    const res = await request(app)
      .get("/api/tickets?search=printer")
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const t of res.body.data) {
      const match =
        t.summary.toLowerCase().includes("printer") ||
        t.ticketNumber.toLowerCase().includes("printer");
      expect(match).toBe(true);
    }
  });

  it("GET /api/tickets filters by category and priority", async () => {
    const res = await request(app)
      .get("/api/tickets?categoryId=1&priority=LOW")
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.category.id).toBe(1);
      expect(ticket.requestedPriority).toBe("LOW");
    }
  });

  it("GET /api/tickets returns correct pagination structure", async () => {
    const res = await request(app)
      .get("/api/tickets?page=1&pageSize=1")
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination.hasNextPage).toBe(true);
  });
});
