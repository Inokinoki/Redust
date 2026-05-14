/**
 * Quick test: take both full-page and panel screenshots of Vector Search
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONNECTION_STATE = {
  state: {
    connections: [{
      id: "conn-local-redis", name: "Local Redis Stack",
      host: "localhost", port: 6379, password: "", database: 0, tls: false,
    }],
    activeConnectionId: "conn-local-redis",
  },
  version: 0,
};

const PROXY_TAURI_JS = `
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args) => {
    const proxyCommands = [
      "getMonitoringData", "get_keys", "listVectorIndexes",
      "getVectorIndexInfo", "getPublicChannels", "getClusterInfo",
      "publishMessage", "searchIndex", "vectorSearch", "llm_generate_embedding"
    ];
    if (proxyCommands.includes(cmd)) {
      try {
        const res = await fetch("http://localhost:4175/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd, args: args || {} }),
        });
        if (res.ok) return await res.json();
      } catch (e) { console.error("[MOCK]", cmd, e.message); }
    }
    switch (cmd) {
      case "uploadEmbeddings": return { success: true, count: 10 };
      case "getCachedEmbedding": return null;
      case "deleteVectorIndex": return { success: true };
      case "getEmbeddingClusters": return { clusters: [] };
      case "batchVectorSearch": return [];
      case "llm_chat": return { response: "Hello!" };
      case "llm_rag": return { response: "Based on docs..." };
      default: return [];
    }
  }
};
if (!window.__TAURI__) window.__TAURI__ = {};
`;

const ALL_PANELS = ["monitoring", "pubsub", "cluster", "vectorSearch", "embeddingCache", "clusterVis", "llmChat", "queryOptimizer"];
const BOTTOM_PANELS = ["monitoring", "vectorSearch", "embeddingCache", "queryOptimizer"];

function buildLayoutState(visiblePanel) {
  const panels = {};
  for (const p of ALL_PANELS) {
    panels[p] = { visible: visiblePanel === p, collapsed: false, position: BOTTOM_PANELS.includes(p) ? "bottom" : "right" };
  }
  return { state: { panels, leftSidebarCollapsed: false, rightSidebarCollapsed: false, bottomPanelHeight: 300 }, version: 0 };
}

async function main() {
  const proxyProc = spawn("node", [path.join(__dirname, "redis-proxy.mjs")], { stdio: ["pipe", "pipe", "pipe"] });
  proxyProc.stdout.on("data", (d) => process.stdout.write(d));
  proxyProc.stderr.on("data", (d) => process.stderr.write(d));
  await new Promise((r) => setTimeout(r, 2000));

  const server = await createServer({ root: path.join(__dirname, ".."), server: { port: 4174 }, logLevel: "silent" });
  await server.listen();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  await context.addInitScript((state) => {
    localStorage.setItem("redust-connections", JSON.stringify(state));
    localStorage.setItem("redust-theme", "light");
  }, CONNECTION_STATE);
  await context.addInitScript(PROXY_TAURI_JS);

  const page = await context.newPage();
  const layout = buildLayoutState("vectorSearch");
  await page.goto("http://localhost:4174", { waitUntil: "networkidle" });
  await page.evaluate((s) => { localStorage.setItem("redust-dashboard-layout", JSON.stringify(s)); }, layout);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Fill and search
  const queryInput = page.locator('textarea').first();
  await queryInput.fill("Redis vector search");
  await page.waitForTimeout(300);
  const searchBtn = page.getByRole("button", { name: "Search", exact: true });
  await searchBtn.click();
  await page.waitForTimeout(8000);

  // Take FULL PAGE screenshot
  await page.screenshot({ path: path.join(__dirname, "..", "screenshots-integration", "test-fullpage.png") });

  // Take panel screenshot like the main script does
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[style]')) {
      if (el.style.height === '320px') {
        const tabBar = el.firstElementChild;
        if (tabBar) tabBar.style.display = 'none';
        el.id = 'screenshot-panel-target';
        break;
      }
    }
  });
  const el = page.locator('#screenshot-panel-target');
  if (await el.count() > 0) {
    await el.screenshot({ path: path.join(__dirname, "..", "screenshots-integration", "test-panel.png") });
  }

  // Also dump the DOM of the panel for debugging
  const dom = await page.evaluate(() => {
    const target = document.getElementById('screenshot-panel-target');
    return target ? target.innerHTML.slice(0, 3000) : 'NOT FOUND';
  });
  console.log("\nPanel DOM (first 3000 chars):\n", dom);

  await browser.close();
  await server.close();
  proxyProc.kill();
}

main().catch((err) => { console.error(err); process.exit(1); });
