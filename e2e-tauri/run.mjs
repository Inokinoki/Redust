/**
 * Tauri desktop E2E via WebDriver (tauri-driver + Selenium).
 * Drives the real WebView → JS → `invoke` → Rust → Redis.
 *
 * Linux only (CI / WSL2). macOS and Windows are skipped here — see https://v2.tauri.app/develop/tests/webdriver/
 *
 * Prereqs: `cargo install tauri-driver --locked`, Redis on E2E_REDIS_HOST:E2E_REDIS_PORT,
 * built binary at src-tauri/target/debug/redust.
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Builder, By, Capabilities, until } from "selenium-webdriver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const redisHost = process.env.E2E_REDIS_HOST ?? "127.0.0.1";
const redisPort = process.env.E2E_REDIS_PORT ?? "6379";

const exe = process.platform === "win32" ? "redust.exe" : "redust";
const application = path.join(root, "src-tauri", "target", "debug", exe);

let tauriDriverProc;
let exitClean = false;

async function shutdown(driver) {
  exitClean = true;
  try {
    tauriDriverProc?.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  if (driver) {
    try {
      await driver.quit();
    } catch {
      /* ignore */
    }
  }
}

if (process.platform === "darwin") {
  console.log(
    "[e2e-tauri] skip: Tauri WebDriver is not supported on macOS (WKWebView has no WebDriver server). Use Linux CI or WSL2."
  );
  process.exit(0);
}

if (process.platform === "win32") {
  console.log(
    "[e2e-tauri] skip: Windows needs msedgedriver setup (see Tauri WebDriver docs)."
  );
  process.exit(0);
}

const tauriDriverPath = path.join(os.homedir(), ".cargo", "bin", "tauri-driver");
if (!fs.existsSync(tauriDriverPath)) {
  console.error("[e2e-tauri] Missing tauri-driver. Install: cargo install tauri-driver --locked");
  process.exit(1);
}

if (!fs.existsSync(application)) {
  console.log("[e2e-tauri] Building frontend + Tauri debug binary…");
  const r1 = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (r1.status !== 0) process.exit(r1.status ?? 1);
  const r2 = spawnSync("npx", ["tauri", "build", "--debug", "--no-bundle"], { cwd: root, stdio: "inherit" });
  if (r2.status !== 0) process.exit(r2.status ?? 1);
}

if (!fs.existsSync(application)) {
  console.error("[e2e-tauri] Binary not found after build:", application);
  process.exit(1);
}

async function main() {
  tauriDriverProc = spawn(tauriDriverPath, [], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  tauriDriverProc.stdout?.on("data", (d) => process.stdout.write(d));
  tauriDriverProc.stderr?.on("data", (d) => process.stderr.write(d));
  tauriDriverProc.on("error", (err) => {
    console.error("[e2e-tauri] tauri-driver spawn error:", err);
    process.exit(1);
  });
  tauriDriverProc.on("exit", (code) => {
    if (!exitClean && code !== 0 && code !== null) {
      console.error("[e2e-tauri] tauri-driver exited:", code);
      process.exit(code ?? 1);
    }
  });

  await new Promise((r) => setTimeout(r, 2500));

  const caps = new Capabilities();
  caps.set("tauri:options", { application });
  caps.setBrowserName("wry");

  let driver;
  try {
    driver = await new Builder().withCapabilities(caps).usingServer("http://127.0.0.1:4444").build();
  } catch (e) {
    console.error("[e2e-tauri] Failed to start WebDriver session:", e);
    await shutdown(undefined);
    process.exit(1);
  }

  const connName = `wd-e2e-${Date.now()}`;

  try {
    await driver.wait(until.titleContains("Redust"), 45000);

    await driver.executeScript(`
      try { localStorage.removeItem('redust-connections'); } catch (e) {}
    `);
    await driver.navigate().refresh();
    await driver.wait(until.titleContains("Redust"), 30000);

    const addBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Add Connection')]")),
      15000
    );
    await addBtn.click();

    await driver.wait(until.elementLocated(By.css('[data-testid="e2e-connection-dialog"]')), 15000);
    await driver.wait(until.elementLocated(By.id("host")), 10000);

    const hostEl = await driver.findElement(By.id("host"));
    await hostEl.clear();
    await hostEl.sendKeys(redisHost);

    const portEl = await driver.findElement(By.id("port"));
    await portEl.clear();
    await portEl.sendKeys(redisPort);

    const nameEl = await driver.findElement(By.id("name"));
    await nameEl.clear();
    await nameEl.sendKeys(connName);

    await driver.findElement(By.css('[data-testid="e2e-save-connection"]')).click();

    await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,'rounded-lg') and .//h3[contains(normalize-space(.), '${connName}')]]//button[contains(.,'Test')]`)
      ),
      20000
    );
    const testBtn = await driver.findElement(
      By.xpath(`//div[contains(@class,'rounded-lg') and .//h3[contains(normalize-space(.), '${connName}')]]//button[contains(.,'Test')]`)
    );
    await testBtn.click();

    await driver.wait(until.alertIsPresent(), 20000);
    const alert = await driver.switchTo().alert();
    const text = await alert.getText();
    await alert.accept();
    if (!text.toLowerCase().includes("successful")) {
      throw new Error(`Expected success alert, got: ${text}`);
    }

    console.log("[e2e-tauri] OK — Tauri UI invoked Rust testConnection against live Redis.");
  } finally {
    await shutdown(driver);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  exitClean = true;
  tauriDriverProc?.kill("SIGTERM");
  process.exit(130);
});
