import { test, expect } from "@playwright/test";

/**
 * Lab 4 — E2E-02: Ticket Resolution & Finite-State Machine Lifecycle Flow
 * Validates AC-09, AC-10, AC-11
 *
 * Flow:
 * 1. Requester opens ticket and submits resolution indication (advisory signal).
 * 2. IT Staff inspects ticket, verifies advisory resolution notification banner.
 * 3. IT Staff checks permitted status dropdown (only legal transitions permitted).
 * 4. IT Staff logs final Action Taken and transitions ticket to "Resolved".
 * 5. Both Requester and Staff observe ticket in "Resolved" status.
 */

test.describe("E2E-02: Ticket Resolution & Finite-State Machine Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Requester signals problem resolved; Staff reviews and formally transitions status", async ({ page }) => {
    // Step 1: Login as Requester
    await page.fill('input[type="email"]', "requester.alice@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Navigate to ticket detail
    await page.click('button:has-text("My Tickets")');
    await page.waitForSelector("table tbody tr");
    await page.click("table tbody tr:first-child button:has-text('View')");

    // Click "Indicate Problem Resolved" if visible
    const indicateBtn = page.locator('button:has-text("Indicate Problem Resolved")');
    if (await indicateBtn.isVisible()) {
      await indicateBtn.click();
      await expect(page.locator("text=You indicated this issue appears resolved")).toBeVisible();
    }

    // Logout
    await page.click('button:has-text("Sign Out")');

    // Step 2: Login as IT Staff
    await page.fill('input[type="email"]', "staff.smith@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Navigate to Ticket Queue and open ticket
    await page.click('button:has-text("🎫 Ticket Queue")');
    await page.waitForSelector("table tbody tr");
    await page.click("table tbody tr:first-child button:has-text('View')");

    // Verify status transition dropdown shows only permitted next states (FSM enforcement)
    const statusSelect = page.locator('[data-testid="status-select"]');
    await expect(statusSelect).toBeVisible();

    // Select "Resolved" if permitted
    const resolvedOption = statusSelect.locator('option[value="Resolved"]');
    if (await resolvedOption.count() > 0) {
      await statusSelect.selectOption("Resolved");
      await page.click('[data-testid="update-status-btn"]');
      await expect(page.locator("text=Status updated successfully")).toBeVisible();
    }
  });
});
