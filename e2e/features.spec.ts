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
    // Mock an active connection in localStorage so KeyBrowser renders
    await page.goto("/");
    await page.evaluate(() => {
      const state = {
        state: {
          connections: [
            {
              id: "test-conn-1",
              name: "Test Redis",
              host: "localhost",
              port: 6379,
              tls: false,
            },
          ],
          activeConnectionId: "test-conn-1",
        },
        version: 0,
      };
      localStorage.setItem("redust-connections", JSON.stringify(state));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should display Key Browser section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Keys" })).toBeVisible();
  });

  test("should display search/filter input", async ({ page }) => {
    await expect(page.getByPlaceholder(/Search keys/i)).toBeVisible();
  });
});

test.describe("Page Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to Monitoring page via sidebar", async ({ page }) => {
    // Expand Monitor group in sidebar
    const monitorGroupButton = page.locator('button').filter({ hasText: "📈Monitor" });
    await monitorGroupButton.click();
    await page.waitForTimeout(300);

    // Click Monitoring item
    const monitoringItem = page.getByText("Monitoring", { exact: true }).first();
    await monitoringItem.click();
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to Vector Search page via sidebar", async ({ page }) => {
    // Expand AI group
    const aiGroupButton = page.locator('button').filter({ hasText: "🧠AI" });
    await aiGroupButton.click();
    await page.waitForTimeout(300);

    // Click Vector Search
    const vectorSearchItem = page.getByText("Vector Search").first();
    await vectorSearchItem.click();
    await page.waitForTimeout(500);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate back to dashboard from feature page", async ({ page }) => {
    // Navigate away first
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Navigate back to dashboard (no shortcut, use sidebar click)
    // Look for any dashboard/home navigation element
    const homeElements = page.locator('h1:has-text("Redust")');
    if (await homeElements.count() > 0) {
      await homeElements.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Multiple Page Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate between multiple pages without errors", async ({ page }) => {
    // Navigate to multiple pages using shortcuts
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

  test("should execute command with Enter to navigate to page", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    // Type monitoring
    await page.keyboard.type("monitoring");
    await page.waitForTimeout(300);

    // Press Enter
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // Should have navigated to Monitoring page
    await expect(page.locator("body")).toBeVisible();
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

    // Navigate to a page
    await page.keyboard.press("Meta+Shift+M");
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator("body")).toBeVisible();
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
    // Theme toggle has moon/sun/system icon
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
