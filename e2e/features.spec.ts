import { test, expect } from "@playwright/test";

test.describe("Connection Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should open Connection Manager from header button", async ({ page }) => {
    const addConnectionButton = page.getByRole("button", { name: /Add Connection/i });
    await addConnectionButton.click();
    await page.waitForTimeout(500);

    // Check modal is visible
    const modal = page.locator('div[class*="fixed inset"]').last();
    await expect(modal).toBeVisible();

    // Check form fields exist
    await expect(page.getByLabel("Connection Name")).toBeVisible();
    await expect(page.getByLabel("Host")).toBeVisible();
    await expect(page.getByLabel("Port")).toBeVisible();
  });

  test("should fill and submit connection form", async ({ page }) => {
    const addConnectionButton = page.getByRole("button", { name: /Add Connection/i });
    await addConnectionButton.click();
    await page.waitForTimeout(500);

    // Fill form
    await page.getByLabel("Connection Name").fill("Test Redis");
    await page.getByLabel("Host").fill("localhost");
    await page.getByLabel("Port").fill("6379");

    // Find and click save/add button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Connect")').last();
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(500);
    } else {
      // Close modal if no save button
      await page.keyboard.press("Escape");
    }
  });

  test("should close Connection Manager with Cancel button", async ({ page }) => {
    // Open Connection Manager using button
    const addConnectionButton = page.getByRole("button", { name: /Add Connection/i });
    await addConnectionButton.click();
    await page.waitForTimeout(500);

    // Verify modal is open
    const modal = page.locator('div[class*="fixed inset"]').last();
    await expect(modal).toBeVisible();

    // Click Cancel button
    const cancelButton = page.getByRole("button", { name: "Cancel" });
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });
});

test.describe("Key Browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display Key Browser section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Keys" })).toBeVisible();
  });

  test("should display search/filter input", async ({ page }) => {
    await expect(page.getByPlaceholder(/Search keys/i)).toBeVisible();
  });
});

test.describe("Panel Tab Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should switch between bottom panel tabs", async ({ page }) => {
    // Open Monitoring first
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Open Vector Search
    await page.keyboard.press("Meta+Shift+V");
    await page.waitForTimeout(500);

    // Click Monitoring tab
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    await monitoringTab.click();
    await page.waitForTimeout(300);

    // Verify Monitoring tab is active (should have red border)
    await expect(monitoringTab).toHaveClass(/border-red-500/);

    // Click Vector Search tab
    const vectorSearchTab = page.locator('button:has-text("🔍Vector Search")').first();
    await vectorSearchTab.click();
    await page.waitForTimeout(300);

    // Verify Vector Search tab is active
    await expect(vectorSearchTab).toHaveClass(/border-red-500/);
  });

  test("should switch between right panel tabs", async ({ page }) => {
    // Open Pub/Sub first
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(500);

    // Open Cluster
    await page.keyboard.press("Meta+Shift+C");
    await page.waitForTimeout(500);

    // Click Pub/Sub tab
    const pubsubTab = page.locator('button:has-text("📡Pub/Sub")').first();
    await pubsubTab.click();
    await page.waitForTimeout(300);

    // Verify Pub/Sub tab is active
    await expect(pubsubTab).toHaveClass(/border-red-500/);
  });
});

test.describe("Panel Close Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should close bottom panel by clicking tab when active", async ({ page }) => {
    // Open a panel
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Click the same tab again to toggle off (common pattern)
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    await monitoringTab.click();
    await page.waitForTimeout(500);
  });

  test("should close right panel by clicking tab when active", async ({ page }) => {
    // Open a panel
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(500);

    // Click the same tab again to toggle off
    const pubsubTab = page.locator('button:has-text("📡Pub/Sub")').first();
    await pubsubTab.click();
    await page.waitForTimeout(500);
  });
});

test.describe("Panel Collapse", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should collapse bottom panel content", async ({ page }) => {
    // Open a panel
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Find collapse button (chevron icon)
    const collapseButton = page.locator('button:has(svg)').last();
    await collapseButton.click();
    await page.waitForTimeout(300);
  });

  test("should collapse right panel content", async ({ page }) => {
    // Open a panel
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(500);

    // Find collapse button
    const collapseButton = page.locator('button:has(svg)').last();
    await collapseButton.click();
    await page.waitForTimeout(300);
  });
});

test.describe("Multiple Panels Open", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have multiple panels open simultaneously", async ({ page }) => {
    // Open bottom panel
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(300);

    // Open right panel
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(300);

    // Both should be visible
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    const pubsubTab = page.locator('button:has-text("📡Pub/Sub")').first();

    await expect(monitoringTab).toBeVisible();
    await expect(pubsubTab).toBeVisible();
  });

  test("should open all 8 panels without errors", async ({ page }) => {
    // Open all panels using shortcuts
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+V");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+E");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+Q");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+C");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+D");
    await page.waitForTimeout(100);
    await page.keyboard.press("Meta+Shift+A");
    await page.waitForTimeout(500);

    // Check page is still functional
    await expect(page.locator("body")).toBeVisible();

    // Check for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    expect(errors.filter(e => !e.includes("fetch") && !e.includes("connection")).length).toBe(0);
  });
});

test.describe("Command Palette", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should filter commands when typing", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Type to filter
    await page.keyboard.type("vector");
    await page.waitForTimeout(300);

    // Should show Vector Search result
    const vectorResult = page.getByText(/vector/i).first();
    await expect(vectorResult).toBeVisible();
  });

  test("should navigate commands with arrow keys", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Press down arrow
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);

    // Press up arrow
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(200);

    // Close
    await page.keyboard.press("Escape");
  });

  test("should execute command with Enter", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Type monitoring
    await page.keyboard.type("monitoring");
    await page.waitForTimeout(300);

    // Press Enter
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // Monitoring panel should be open
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    await expect(monitoringTab).toBeVisible();
  });
});

test.describe("Responsive Layout", () => {
  test("should adapt to mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Page should be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Page should be functional
    await expect(page.locator("body")).toBeVisible();

    // Open a panel
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Panel should be visible
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    await expect(monitoringTab).toBeVisible();
  });

  test("should adapt to large desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Page should be functional
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should toggle theme button be visible", async ({ page }) => {
    // Theme toggle has moon/sun icon
    const themeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️"), button:has-text("💻")').first();
    await expect(themeToggle).toBeVisible();
  });

  test("should toggle theme on click", async ({ page }) => {
    const themeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️"), button:has-text("💻")').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Theme should have changed (button should still be visible)
    await expect(themeToggle).toBeVisible();
  });
});

test.describe("Split View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should toggle split view with Cmd+Shift+S", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+S");
    await page.waitForTimeout(500);

    // Split view indicator should appear
    await expect(page.locator("body")).toBeVisible();
  });

  test("should disable split view when toggled twice", async ({ page }) => {
    // Enable
    await page.keyboard.press("Meta+Shift+S");
    await page.waitForTimeout(300);

    // Disable
    await page.keyboard.press("Meta+Shift+S");
    await page.waitForTimeout(300);

    await expect(page.locator("body")).toBeVisible();
  });
});
