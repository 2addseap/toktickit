import { test, expect } from "@playwright/test";

/**
 * Lab 4 — E2E-03: Role Dashboards Navigation & KPI Drill-Down Flow
 * Validates AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
 *
 * Flow:
 * 1. Requester logs in, inspects Requester Dashboard KPI cards.
 * 2. Requester clicks KPI card (e.g. "Waiting for Your Input"), verifies drill-down to My Tickets with pre-filtered status.
 * 3. IT Staff logs in, inspects Staff Dashboard with 7 operational metrics and urgent queue table.
 * 4. IT Staff clicks metric card, verifies navigation to Ticket Queue with pre-filtered criteria.
 * 5. Administrator logs in, verifies access to staff dashboard plus User Directory summary widget.
 */

test.describe("E2E-03: Role Dashboards & Drill-Down Integrity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Requester views dashboard KPIs and drills down into filtered My Tickets view", async ({ page }) => {
    // Login as Requester
    await page.fill('input[type="email"]', "requester.alice@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Verify Requester Dashboard KPIs are visible
    await expect(page.locator('[data-testid="kpi-my-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-waiting-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-recently-resolved"]')).toBeVisible();

    // Click "Waiting for Your Input" KPI card
    await page.click('[data-testid="kpi-waiting-input"]');

    // Verify navigation to My Tickets and filter applied
    await expect(page.locator("h1")).toContainText("My Tickets");
    const statusSelect = page.locator('select[aria-label="Filter tickets by status"]');
    await expect(statusSelect).toHaveValue("Waiting for Requester");
  });

  test("IT Staff views operational metrics and drills down into filtered Ticket Queue", async ({ page }) => {
    // Login as IT Staff
    await page.fill('input[type="email"]', "staff.smith@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Verify Staff Dashboard KPI cards
    await expect(page.locator('[data-testid="kpi-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-my-assigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-status-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-status-in-progress"]')).toBeVisible();

    // Click "Unassigned Tickets" KPI card
    await page.click('[data-testid="kpi-unassigned"]');

    // Verify navigation to Ticket Queue and filter applied
    await expect(page.locator("h1")).toContainText("IT Staff Ticket Queue");
    const assigneeSelect = page.locator('select[aria-label="Filter tickets by assignee"]');
    await expect(assigneeSelect).toHaveValue("unassigned");
  });

  test("Administrator views operational metrics plus User Directory overview card", async ({ page }) => {
    // Login as Administrator
    await page.fill('input[type="email"]', "admin.boss@toktickit.local");
    await page.fill('input[type="password"]', "TokTickIT2026!");
    await page.click('button[type="submit"]');

    // Verify Staff Dashboard KPI cards and Admin-specific widget
    await expect(page.locator('[data-testid="kpi-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-user-stats-card"]')).toBeVisible();

    // Click "Manage Directory" button on the admin widget
    await page.click('[data-testid="btn-manage-users"]');

    // Verify navigation to User Management screen
    await expect(page.locator("h1")).toContainText("User Management");
  });
});
