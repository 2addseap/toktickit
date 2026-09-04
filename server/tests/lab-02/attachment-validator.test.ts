import { describe, it, expect } from "vitest";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../../src/upload.js";

describe("Lab 2 — UNIT-02: Attachment MIME and File Size Constants", () => {
  it("enforces 5 MB file size limit", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("permits only JPEG, PNG, WEBP, and PDF MIME types", () => {
    expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES).toContain("image/png");
    expect(ALLOWED_MIME_TYPES).toContain("image/webp");
    expect(ALLOWED_MIME_TYPES).toContain("application/pdf");

    expect(ALLOWED_MIME_TYPES).not.toContain("application/x-msdownload");
    expect(ALLOWED_MIME_TYPES).not.toContain("application/zip");
    expect(ALLOWED_MIME_TYPES).not.toContain("text/javascript");
  });
});
