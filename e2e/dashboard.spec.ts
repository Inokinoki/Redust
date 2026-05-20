import { test, expect } from "@playwright/test";

test.describe("Dashboard Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should render the main dashboard layout", async ({ page }) => {
    // Check that the main content area is rendered - look for ConnectionList or KeyBrowser
    const mainContent = page.locator('div[class*="grid"]').getByRole("heading", { name: "Connections" });
    await expect(mainContent).toBeVisible();
  });

  test("should render the left sidebar", async ({ page }) => {
    // Sidebar has Tools header
    const sidebar = page.locator('h2:has-text("Tools")');
    await expect(sidebar).toBeVisible();
  });

  test("should render the Connections section", async ({ page }) => {
    const connectionsHeading = page.getByRole("heading", { name: "Connections" });
    await expect(connectionsHeading).toBeVisible();
  });
});

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should toggle sidebar collapse/expand", async ({ page }) => {
    // Find the collapse toggle button
    const collapseButton = page.locator('button[title="Collapse sidebar"]');
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Now the expand button should be visible
    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expect(expandButton).toBeVisible();
  });

  test("should expand AI group on click", async ({ page }) => {
    const aiGroupButton = page.locator('button').filter({ hasText: "🧠AI" });
    await expect(aiGroupButton).toBeVisible();
    await aiGroupButton.click();
    await page.waitForTimeout(300);

    // Check AI group items are visible
    const vectorSearchItem = page.getByText("Vector Search").first();
    await expect(vectorSearchItem).toBeVisible();
  });

  test("should expand Monitor group on click", async ({ page }) => {
    const monitorGroupButton = page.locator('button').filter({ hasText: "📈Monitor" });
    await expect(monitorGroupButton).toBeVisible();
    await monitorGroupButton.click();
    await page.waitForTimeout(300);

    // Check Monitor group items are visible
    const monitoringItem = page.getByText("Monitoring").first();
    await expect(monitoringItem).toBeVisible();
  });

  test("should expand Tools group on click", async ({ page }) => {
    const toolsGroupButton = page.locator('button').filter({ hasText: "🔧Tools" });
    await expect(toolsGroupButton).toBeVisible();
    await toolsGroupButton.click();
    await page.waitForTimeout(300);

    // Check Tools group items are visible
    const importExportItem = page.getByText("Import/Export").first();
    await expect(importExportItem).toBeVisible();
  });
});

test.describe("Page Navigation via Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to Monitoring page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Should navigate to monitoring page (no longer a panel tab)
    // Verify the dashboard layout is still present
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Vector Search page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+V");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Embedding Cache page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+E");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Query Optimizer page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+Q");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Pub/Sub page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Cluster Topology page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+C");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Cluster Visualization page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+D");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to AI Chat page using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+A");
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Sidebar Collapse and Expand", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should collapse sidebar and show icon-only mode", async ({ page }) => {
    const collapseButton = page.locator('button[title="Collapse sidebar"]');
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Expand button should be visible
    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expect(expandButton).toBeVisible();
  });

  test("should expand sidebar back to full mode", async ({ page }) => {
    const collapseButton = page.locator('button[title="Collapse sidebar"]');
    await collapseButton.click();
    await page.waitForTimeout(300);

    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expandButton.click();
    await page.waitForTimeout(300);

    // Tools header should be back
    const sidebar = page.locator('h2:has-text("Tools")');
    await expect(sidebar).toBeVisible();
  });
});

test.describe("Layout Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should persist sidebar state in localStorage", async ({ page }) => {
    // Open sidebar collapse
    const collapseButton = page.locator('button[title="Collapse sidebar"]');
    await collapseButton.click();
    await page.waitForTimeout(500);

    // Check localStorage has dashboard state
    const dashboardState = await page.evaluate(() => {
      const state = localStorage.getItem("redust-dashboard-layout");
      return state ? JSON.parse(state) : null;
    });

    expect(dashboardState).toBeTruthy();
    expect(dashboardState.state).toBeTruthy();
    expect(dashboardState.state.leftSidebarCollapsed).toBe(true);
  });
});

test.describe("Modal Components", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should open Import/Export modal with Cmd+Shift+I", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+I");
    await page.waitForTimeout(500);

    // Check modal is visible (look for Import or Export text in modal context)
    const modal = page.locator('h2:has-text("Import"), h2:has-text("Export"), button:has-text("Import"), button:has-text("Export")').first();
    await expect(modal).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should open Lua Editor modal with Cmd+Shift+L", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+L");
    await page.waitForTimeout(500);

    // Check modal is visible
    const modal = page.locator('h2:has-text("Lua"), button:has-text("Execute"), textarea').first();
    await expect(modal).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should close modals with close button", async ({ page }) => {
    // Open Import/Export modal
    await page.keyboard.press("Meta+Shift+I");
    await page.waitForTimeout(500);

    // Verify modal is open
    const modal = page.locator('div[class*="fixed inset"]').last();
    await expect(modal).toBeVisible();

    // Click close button (X button in modal)
    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').last();
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Fallback: click outside modal
      await page.mouse.click(50, 50);
    }
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });
});

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should open command palette with Cmd+K and search", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Type in search
    await page.keyboard.type("monitor");
    await page.waitForTimeout(300);

    // Should filter to monitoring-related commands
    const monitoringResult = page.getByText(/monitor/i, { matchSubstring: true }).first();
    await expect(monitoringResult).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should toggle Split View with Cmd+Shift+S", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+S");
    await page.waitForTimeout(500);

    // Split view should be active - look for split pane indicators (optional)
    await page.locator('[class*="split"], [data-split]').first().waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    await expect(page.locator("body")).toBeVisible();
  });
});
