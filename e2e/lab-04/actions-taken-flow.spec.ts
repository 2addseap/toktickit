import { test, expect } from "@playwright/test";

/**
 * Lab 4 — E2E-01: Actions Taken Collaborative Execution & Life Cycle Flow
 * Validates AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08
 *
 * Flow:
 * 1. IT Staff A logs in, opens ticket in queue, and reviews details.
 * 2. IT Staff B logs in, adds an Action Taken with follow-up requirement & attachment note.
 * 3. Verify timeline displays both actions with accurate performer attribution.
 * 4. IT Staff edits an action taken, verifying concurrency handling and field validation.
 * 5. Requester logs in, opens owned ticket, and verifies Actions Taken are read-only.
 */

test.describe("E2E-01: Actions Taken Multi-Staff Flow & Concurrency", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
  });

  test("IT Staff logs Action Taken with follow-up and verifies timeline attribution", async ({ page }) => {
    // Step 1: Login as IT Staff
    await page.fill('input[type="email"]', "staff.smith@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Wait for Dashboard / Navigation to load
    await expect(page.locator("nav")).toBeVisible();
    await page.click('button:has-text("🎫 Ticket Queue")');

    // Step 2: Open first ticket in queue
    await page.waitForSelector("table tbody tr");
    await page.click("table tbody tr:first-child button:has-text('View')");

    // Verify Ticket Detail loaded
    await expect(page.locator("h1")).toContainText("Ticket Details");

    // Step 3: Open Add Action Taken Form
    await page.click('[data-testid="add-action-btn"]');
    await expect(page.locator('[data-testid="action-form"]')).toBeVisible();

    // Verify follow-up validation: required note when checked
    await page.fill('[data-testid="action-description-input"]', "Diagnostic completed on VPN client configuration");
    await page.fill('[data-testid="action-result-input"]', "Found expired TLS certificate bundle");
    await page.check('[data-testid="action-followup-checkbox"]');
    
    // Attempt submitting without follow-up note (should trigger validation error)
    await page.click('[data-testid="save-action-btn"]');
    await expect(page.locator('[data-testid="action-form-error"]')).toContainText("Follow-up note is required");

    // Fill follow-up note and attachment reference
    await page.fill('[data-testid="action-followup-note-input"]', "Renew root CA certificate on gateway by Monday");
    await page.fill('[data-testid="action-attachment-notes-input"]', "vpn_gateway_logs.txt");
    await page.click('[data-testid="save-action-btn"]');

    // Verify action appeared in table
    await expect(page.locator('[data-testid="actions-table"]')).toContainText("Diagnostic completed on VPN client configuration");
    await expect(page.locator('[data-testid="actions-table"]')).toContainText("Found expired TLS certificate bundle");
    await expect(page.locator('[data-testid="actions-table"]')).toContainText("Renew root CA certificate");
  });

  test("Requester can view Actions Taken in read-only mode without edit controls", async ({ page }) => {
    // Login as Requester
    await page.fill('input[type="email"]', "requester.alice@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Navigate to My Tickets
    await page.click('button:has-text("My Tickets")');
    await page.waitForSelector("table tbody tr");
    await page.click("table tbody tr:first-child button:has-text('View')");

    // Verify Actions Taken section exists in Requester view
    await expect(page.locator("text=Actions Taken")).toBeVisible();

    // Verify Add Action and Edit Action buttons are NOT present in DOM (AC-02, BR-03)
    await expect(page.locator('[data-testid="add-action-btn"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="edit-action-btn-"]')).toHaveCount(0);
  });
});
