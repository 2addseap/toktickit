import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 — Issue 3: Create Ticket Endpoint Tests", () => {
  // Test Reference APIs
  it("GET /api/requesters returns active requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body.find((r: { name: string }) => r.name === "Alex Inactive")).toBeUndefined();
  });

  it("POST /api/tickets creates a valid ticket with official Ticket Number and status New", async () => {
    const payload = {
      categoryId: 1,
      relatedSystemId: 1,
      requestedPriority: "HIGH",
      summary: "Cannot connect to corporate VPN after password update",
      description: "My VPN client keeps dropping connection every 2 minutes with error code 800.",
    };

    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.status).toBe("New");
    expect(res.body.requestedPriority).toBe("HIGH");
    expect(res.body.summary).toBe(payload.summary);
    expect(res.body.requester.name).toBe("Jennifer Anderson");
    expect(res.body.category.name).toBe("Account and Access");
    expect(res.body.relatedSystem.name).toBe("Corporate Laptop");
  });

  it("POST /api/tickets returns 400 with fieldErrors on invalid inputs", async () => {
    const invalidPayload = {
      categoryId: "",
      relatedSystemId: "",
      summary: "Bad", // < 5 chars
      description: "Short", // < 10 chars
    };

    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("fieldErrors");
    expect(res.body.fieldErrors).toHaveProperty("summary");
    expect(res.body.fieldErrors).toHaveProperty("description");
    expect(res.body.fieldErrors).toHaveProperty("categoryId");
    expect(res.body.fieldErrors).toHaveProperty("relatedSystemId");
  });

  it("POST /api/tickets supports multipart file attachments", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .field("categoryId", "2")
      .field("relatedSystemId", "6")
      .field("requestedPriority", "MEDIUM")
      .field("summary", "Office printer displaying paper jam error constantly")
      .field("description", "Printer on 3rd floor shows error 50.1 paper jam despite clearing all paper trays.")
      .attach("attachments", Buffer.from("dummy pdf content"), {
        filename: "printer_error.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.attachments).toHaveLength(1);
    expect(res.body.attachments[0].fileName).toBe("printer_error.pdf");
    expect(res.body.attachments[0].mimeType).toBe("application/pdf");
    expect(res.body.attachments[0].isRemoved).toBe(false);
  });

  it("POST /api/tickets rejects unsupported file types with 400", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("summary", "Testing invalid file upload rejection")
      .field("description", "Attempting to attach an unsupported file extension and mime type.")
      .attach("attachments", Buffer.from("binary data"), {
        filename: "script.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid file type/i);
  });
});
