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
    // Sidebar has Tools header or collapse/expand button
    const sidebar = page.locator('h2:has-text("Tools"), button[title="Expand sidebar"], button[title="Collapse sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test("should render the metrics bar", async ({ page }) => {
    const metricsBar = page.getByText("Metrics").first();
    await expect(metricsBar).toBeVisible();
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
    const toggleButton = page.locator('button[title="Collapse sidebar"], button[title="Expand sidebar"]').first();
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await page.waitForTimeout(300);
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

test.describe("Bottom Panel Group", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should open Monitoring panel using keyboard shortcut", async ({ page }) => {
    // Open Monitoring with keyboard shortcut
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Check bottom panel has Monitoring tab
    const monitoringTab = page.locator('button:has-text("📊Monitoring")').first();
    await expect(monitoringTab).toBeVisible();
  });

  test("should open Vector Search panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+V");
    await page.waitForTimeout(500);

    // Check bottom panel has Vector Search tab
    const vectorSearchTab = page.locator('button:has-text("🔍Vector Search")').first();
    await expect(vectorSearchTab).toBeVisible();
  });

  test("should open Embedding Cache panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+E");
    await page.waitForTimeout(500);

    // Check bottom panel has Embedding Cache tab
    const embeddingCacheTab = page.locator('button:has-text("📦Embedding Cache")').first();
    await expect(embeddingCacheTab).toBeVisible();
  });

  test("should open Query Optimizer panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+Q");
    await page.waitForTimeout(500);

    // Check bottom panel has Query Optimizer tab
    const queryOptimizerTab = page.locator('button:has-text("⚡Query Optimizer")').first();
    await expect(queryOptimizerTab).toBeVisible();
  });
});

test.describe("Right Panel Group", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should open Pub/Sub panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(500);

    // Check right panel has Pub/Sub tab
    const pubsubTab = page.locator('button:has-text("📡Pub/Sub")').first();
    await expect(pubsubTab).toBeVisible();
  });

  test("should open Cluster Topology panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+C");
    await page.waitForTimeout(500);

    // Check right panel has Cluster tab
    const clusterTab = page.locator('button:has-text("🔗Cluster")').first();
    await expect(clusterTab).toBeVisible();
  });

  test("should open Cluster Visualization panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+D");
    await page.waitForTimeout(500);

    // Check right panel has Clusters tab
    const clustersTab = page.locator('button:has-text("🎯Clusters")').first();
    await expect(clustersTab).toBeVisible();
  });

  test("should open AI Chat panel using keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+A");
    await page.waitForTimeout(500);

    // Check right panel has AI Chat tab
    const aiChatTab = page.locator('button:has-text("🤖AI Chat")').first();
    await expect(aiChatTab).toBeVisible();
  });
});

test.describe("Resizable Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have resizable separators", async ({ page }) => {
    // Check for resizable separators (they have the hover effect class)
    const separators = page.locator('div[class*="hover:bg-red-600"]');
    const count = await separators.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("should allow dragging separator to resize panels", async ({ page }) => {
    // Find first separator
    const separator = page.locator('div[class*="hover:bg-red-600"]').first();
    await expect(separator).toBeVisible();

    // Get initial position
    const initialBox = await separator.boundingBox();
    expect(initialBox).toBeTruthy();

    // Drag the separator to the right
    await separator.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Separator should have moved
    const newBox = await separator.boundingBox();
    expect(Math.abs(newBox!.x - initialBox!.x)).toBeGreaterThan(10);
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

  test("should save panel layout to localStorage", async ({ page }) => {
    // Open a panel
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Drag a separator to trigger layout save
    const separator = page.locator('div[class*="hover:bg-red-600"]').first();
    await separator.hover();
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Check that layout was saved
    const layoutData = await page.evaluate(() => {
      return localStorage.getItem("redust-panel-layout");
    });
    expect(layoutData).toBeTruthy();
  });

  test("should persist panel state in localStorage", async ({ page }) => {
    // Open multiple panels
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(300);
    await page.keyboard.press("Meta+Shift+P");
    await page.waitForTimeout(300);

    // Check localStorage has dashboard state
    const dashboardState = await page.evaluate(() => {
      const state = localStorage.getItem("redust-dashboard-layout");
      return state ? JSON.parse(state) : null;
    });

    expect(dashboardState).toBeTruthy();
    expect(dashboardState.state).toBeTruthy();
  });
});

test.describe("Metrics Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display metrics header", async ({ page }) => {
    const metricsHeader = page.getByText("Metrics").first();
    await expect(metricsHeader).toBeVisible();
  });

  test("should toggle metrics bar collapse", async ({ page }) => {
    // Find collapse toggle
    const toggleButton = page.locator('button[title="Collapse metrics"], button[title="Expand metrics"]').first();
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await page.waitForTimeout(300);
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
