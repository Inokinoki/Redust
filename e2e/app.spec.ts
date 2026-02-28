import { test, expect } from "@playwright/test";

test.describe("Application", () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto("http://localhost:5173");
  });

  test("should load the application", async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Redust/);
  });

  test("should render the main UI", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that main elements are present
    // These are basic checks that the app renders without errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle window resize", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Test responsive behavior
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
  });
});
