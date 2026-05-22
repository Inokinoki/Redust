import { test, expect } from "@playwright/test";

test.describe("Application", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should load the application", async ({ page }) => {
    await expect(page).toHaveTitle(/Redust/);
  });

  test("should display the Redust header", async ({ page }) => {
    const header = page.getByText("Redust").first();
    await expect(header).toBeVisible();
  });

  test("should display the Connection Manager button", async ({ page }) => {
    const addConnectionButton = page.getByRole("button", { name: /Add Connection/i }).first();
    await expect(addConnectionButton).toBeVisible();
  });

  test("should open command palette with Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Command palette has fixed inset div
    const commandPalette = page.locator('div[class*="fixed inset-0"]').first();
    await expect(commandPalette).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should open Connection Manager modal", async ({ page }) => {
    const addConnectionButton = page.getByRole("button", { name: /Add Connection/i }).first();
    await addConnectionButton.click();
    await page.waitForTimeout(500);

    // Check for modal with Redis connection form - look for dialog content
    const modal = page.locator('div[role="dialog"], div[class*="fixed inset"]').last();
    await expect(modal).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should toggle theme", async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀️")').first();
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await page.waitForTimeout(300);
  });

  test("should handle window resize gracefully", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should not have any critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Filter out expected errors (e.g., connection errors when no Redis is configured)
    const criticalErrors = errors.filter(
      (err) => !err.includes("Failed to fetch") &&
               !err.includes("connection") &&
               !err.includes("Redis")
    );

    expect(criticalErrors.length).toBe(0);
  });
});
