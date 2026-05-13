/**
 * Screenshot script for Redust dashboard.
 * Usage: npx tsx scripts/screenshot.ts
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import path from "path";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");

async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  // Start Vite dev server
  const server = await createServer({
    root: path.join(__dirname, ".."),
    server: { port: 4173 },
    logLevel: "silent",
  });
  await server.listen();
  console.log("Vite dev server started on http://localhost:4173");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Main dashboard layout
  await page.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-dashboard.png"), fullPage: false });
  console.log("1. Dashboard layout");

  // 2. Sidebar expanded - AI group
  const aiGroupBtn = page.locator('button').filter({ hasText: /🧠.*AI/ });
  if (await aiGroupBtn.count() > 0) {
    await aiGroupBtn.first().click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-sidebar-ai.png"), fullPage: false });
  console.log("2. Sidebar AI group expanded");

  // 3. Sidebar - Monitor group
  const monitorGroupBtn = page.locator('button').filter({ hasText: /📈.*Monitor/ });
  if (await monitorGroupBtn.count() > 0) {
    await monitorGroupBtn.first().click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-sidebar-monitor.png"), fullPage: false });
  console.log("3. Sidebar Monitor group expanded");

  // 4. Open bottom panel (Monitoring)
  await page.keyboard.press("Meta+Shift+M");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-monitoring-panel.png"), fullPage: false });
  console.log("4. Monitoring panel open");

  // 5. Open Vector Search panel
  await page.keyboard.press("Meta+Shift+V");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05-vector-search.png"), fullPage: false });
  console.log("5. Vector Search panel open");

  // 6. Open right panel (Pub/Sub)
  await page.keyboard.press("Meta+Shift+P");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06-pubsub-panel.png"), fullPage: false });
  console.log("6. Pub/Sub panel open");

  // 7. Open AI Chat panel
  await page.keyboard.press("Meta+Shift+A");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07-ai-chat.png"), fullPage: false });
  console.log("7. AI Chat panel open");

  // 8. Command Palette
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("vector");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-command-palette.png"), fullPage: false });
  console.log("8. Command Palette");
  await page.keyboard.press("Escape");

  // 9. Connection Manager modal
  await page.waitForTimeout(300);
  const addConnBtn = page.getByRole("button", { name: /Add Connection/i });
  if (await addConnBtn.count() > 0) {
    await addConnBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09-connection-manager.png"), fullPage: false });
    console.log("9. Connection Manager modal");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  // 10. Collapsed sidebar
  const collapseBtn = page.locator('button[title="Collapse sidebar"]');
  if (await collapseBtn.count() > 0) {
    await collapseBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10-collapsed-sidebar.png"), fullPage: false });
    console.log("10. Collapsed sidebar");
  }

  await browser.close();
  await server.close();
  console.log(`\nDone! Screenshots saved to ${SCREENSHOTS_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
