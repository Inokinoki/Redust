import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.CI ? "http://localhost:4173" : "http://localhost:1420",
    trace: "on-first-retry",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  // In CI, the workflow starts the preview server, so don't start another one
  webServer: process.env.CI ? undefined : {
    command: "npm run dev",
    url: "http://localhost:1420",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox and WebKit tests disabled due to keyboard shortcut differences
    // Meta key (Cmd) is macOS-specific; Tauri uses system webview (Chromium-based)
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:1420",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
