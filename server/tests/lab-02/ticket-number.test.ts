import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/upload.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 — UNIT-01: Ticket Number Generation Format & Sequencing", () => {
  it("generates ticket number matching format TKT-YYYY-NNNNNN", async () => {
    const prisma = getPrisma();
    const ticketNumber = await generateTicketNumber(prisma);
    const currentYear = new Date().getFullYear();

    const pattern = new RegExp(`^TKT-${currentYear}-\\d{6}$`);
    expect(ticketNumber).toMatch(pattern);
  });
});
