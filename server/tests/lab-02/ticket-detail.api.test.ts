import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../../src/app.js";

describe("Lab 2 — Issue 5: Ticket Detail and Attachment Lifecycle API Tests", () => {
  let requester1TicketId: number;
  let requester2TicketId: number;
  let sampleAttachmentId: number;
  const tempTestFilePath = path.resolve(__dirname, "../../uploads/attachments/test_sample_doc.pdf");

  beforeAll(async () => {
    // Ensure test directory and a temporary sample file exist
    const dir = path.dirname(tempTestFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tempTestFilePath, "%PDF-1.4 dummy test pdf binary content");

    // 1. Create a ticket for Requester 1 with 1 attachment
    const res1 = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "HIGH")
      .field("summary", "Requester 1 Detailed Hardware Investigation")
      .field("description", "Laptop screen is flickering intermittently during heavy load.")
      .attach("attachments", tempTestFilePath);

    expect(res1.status).toBe(201);
    requester1TicketId = res1.body.id;
    if (res1.body.attachments && res1.body.attachments.length > 0) {
      sampleAttachmentId = res1.body.attachments[0].id;
    }

    // 2. Create a ticket for Requester 2
    const res2 = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "2")
      .send({
        categoryId: 2,
        relatedSystemId: 2,
        requestedPriority: "MEDIUM",
        summary: "Requester 2 Confidential Performance Issue",
        description: "Network throughput drops significantly on VPN gateway.",
      });

    expect(res2.status).toBe(201);
    requester2TicketId = res2.body.id;
  });

  it("GET /api/tickets/:id returns full ticket detail for the ticket owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${requester1TicketId}`)
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(requester1TicketId);
    expect(res.body.summary).toBe("Requester 1 Detailed Hardware Investigation");
    expect(res.body.requester.id).toBe(1);
    expect(res.body.category).toBeDefined();
    expect(res.body.relatedSystem).toBeDefined();
    expect(Array.isArray(res.body.attachments)).toBe(true);
    expect(res.body.attachments.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/tickets/:id returns 403 Forbidden when accessed by another requester", async () => {
    // Requester 2 trying to access Requester 1's ticket
    const res = await request(app)
      .get(`/api/tickets/${requester1TicketId}`)
      .set("x-requester-id", "2");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access Denied");
  });

  it("POST /api/tickets/:id/attachments uploads a new attachment to an existing owned ticket", async () => {
    const res = await request(app)
      .post(`/api/tickets/${requester1TicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", tempTestFilePath);

    expect(res.status).toBe(201);
    expect(res.body.ticketId).toBe(requester1TicketId);
    expect(res.body.fileName).toBe("test_sample_doc.pdf");
    expect(res.body.isRemoved).toBe(false);
  });

  it("POST /api/tickets/:id/attachments blocks upload when active attachment quota (5) is reached", async () => {
    // Current ticket already has 2 attachments. Add until 5.
    await request(app)
      .post(`/api/tickets/${requester1TicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", tempTestFilePath);

    await request(app)
      .post(`/api/tickets/${requester1TicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", tempTestFilePath);

    await request(app)
      .post(`/api/tickets/${requester1TicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", tempTestFilePath);

    // 6th upload should be rejected with 400
    const res = await request(app)
      .post(`/api/tickets/${requester1TicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", tempTestFilePath);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Quota Exceeded");
  });

  it("GET /api/attachments/:id/download streams active attachment binary", async () => {
    const res = await request(app)
      .get(`/api/attachments/${sampleAttachmentId}/download`)
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("GET /api/attachments/:id/download blocks download if requested by another requester", async () => {
    const res = await request(app)
      .get(`/api/attachments/${sampleAttachmentId}/download`)
      .set("x-requester-id", "2");

    expect(res.status).toBe(403);
  });

  it("PATCH /api/attachments/:id/soft-remove soft-removes attachment with mandatory reason", async () => {
    const res = await request(app)
      .patch(`/api/attachments/${sampleAttachmentId}/soft-remove`)
      .set("x-requester-id", "1")
      .send({
        reason: "File contains sensitive personal identification information.",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sampleAttachmentId);
    expect(res.body.isRemoved).toBe(true);
    expect(res.body.removalReason).toBe("File contains sensitive personal identification information.");
    expect(res.body.removedBy).toBeDefined();
  });

  it("GET /api/attachments/:id/download returns 410 Gone for soft-removed attachment", async () => {
    const res = await request(app)
      .get(`/api/attachments/${sampleAttachmentId}/download`)
      .set("x-requester-id", "1");

    expect(res.status).toBe(410);
    expect(res.body.error).toBe("Attachment Gone");
    expect(res.body.removalReason).toBe("File contains sensitive personal identification information.");
  });
});
