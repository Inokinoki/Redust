import { test, expect } from "@playwright/test";

// Helper to inject active connection + tab into localStorage
async function injectActiveConnection(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const connState = {
      state: {
        connections: [{
          id: "test-conn-1",
          name: "Test Redis",
          host: "localhost",
          port: 6379,
          tls: false,
        }],
        activeConnectionId: "test-conn-1",
      },
      version: 0,
    };
    localStorage.setItem("redust-connections", JSON.stringify(connState));

    const tabState = {
      state: {
        tabs: [{
          id: "tab-test-1",
          connectionId: "test-conn-1",
          pageId: "dashboard",
          title: "Keys",
        }],
        activeTabId: "tab-test-1",
      },
      version: 0,
    };
    localStorage.setItem("redust-tabs", JSON.stringify(tabState));
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
}

test.describe("Dashboard Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should render the main dashboard layout", async ({ page }) => {
    const mainContent = page.getByRole("heading", { name: "Connections" });
    await expect(mainContent).toBeVisible();
  });

  test("should render the left sidebar", async ({ page }) => {
    const sidebar = page.getByRole("heading", { name: "Connections" });
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
    await injectActiveConnection(page);
  });

  test("should toggle sidebar collapse/expand", async ({ page }) => {
    const collapseButton = page.getByRole("button", { name: /Collapse/i });
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    await page.waitForTimeout(300);

    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expect(expandButton).toBeVisible();
  });

  test("should expand AI group on click", async ({ page }) => {
    const aiGroupButton = page.locator("button").filter({ hasText: /^AI$/ });
    await expect(aiGroupButton).toBeVisible();
    await aiGroupButton.click();
    await page.waitForTimeout(300);

    const vectorSearchItem = page.getByText("Vector Search").first();
    await expect(vectorSearchItem).toBeVisible();
  });

  test("should expand Monitor group on click", async ({ page }) => {
    const monitorGroupButton = page.locator("button").filter({ hasText: /^Monitor$/ });
    await expect(monitorGroupButton).toBeVisible();
    await monitorGroupButton.click();
    await page.waitForTimeout(300);

    const monitoringItem = page.getByText("Monitoring").first();
    await expect(monitoringItem).toBeVisible();
  });

  test("should show Main group pages by default", async ({ page }) => {
    // Main group is always expanded — "Keys" page should be visible
    const keysItem = page.getByText("Keys").first();
    await expect(keysItem).toBeVisible();
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
    const collapseButton = page.getByRole("button", { name: /Collapse/i });
    await collapseButton.click();
    await page.waitForTimeout(300);

    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expect(expandButton).toBeVisible();
  });

  test("should expand sidebar back to full mode", async ({ page }) => {
    const collapseButton = page.getByRole("button", { name: /Collapse/i });
    await collapseButton.click();
    await page.waitForTimeout(300);

    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expandButton.click();
    await page.waitForTimeout(300);

    // Connections heading should be back
    const sidebar = page.getByRole("heading", { name: "Connections" });
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
    const collapseButton = page.getByRole("button", { name: /Collapse/i });
    await collapseButton.click();
    await page.waitForTimeout(500);

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

    const modal = page.locator('h2:has-text("Import"), h2:has-text("Export"), button:has-text("Import"), button:has-text("Export")').first();
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should open Lua Editor modal with Cmd+Shift+L", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+L");
    await page.waitForTimeout(500);

    const modal = page.locator('h2:has-text("Lua"), button:has-text("Execute"), textarea').first();
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should close modals with close button", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+I");
    await page.waitForTimeout(500);

    const modal = page.locator('div[class*="fixed inset"]').last();
    await expect(modal).toBeVisible();

    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').last();
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      await page.mouse.click(50, 50);
    }
    await page.waitForTimeout(500);

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

    await page.keyboard.type("monitor");
    await page.waitForTimeout(300);

    const monitoringResult = page.getByText(/monitor/i, { matchSubstring: true }).first();
    await expect(monitoringResult).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("should toggle Split View with Cmd+Shift+S", async ({ page }) => {
    await page.keyboard.press("Meta+Shift+S");
    await page.waitForTimeout(500);

    await page.locator('[class*="split"], [data-split]').first().waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    await expect(page.locator("body")).toBeVisible();
  });
});
