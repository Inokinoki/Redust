/**
 * Debug script to test Vector Search flow in browser.
 * Starts proxy + Vite, opens browser, captures console logs during search.
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
      id: "conn-local-redis",
      name: "Local Redis Stack",
      host: "localhost",
      port: 6379,
      password: "",
      database: 0,
      tls: false,
    }],
    activeConnectionId: "conn-local-redis",
  },
  version: 0,
};

const PROXY_TAURI_JS = `
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args) => {
    console.log("[INVOKE]", cmd, JSON.stringify(args).slice(0, 200));
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
        if (res.ok) {
          const data = await res.json();
          console.log("[INVOKE OK]", cmd, "result type:", typeof data, Array.isArray(data) ? "array[" + data.length + "]" : JSON.stringify(data).slice(0, 200));
          return data;
        } else {
          console.warn("[INVOKE FAIL]", cmd, "status:", res.status);
        }
      } catch (e) {
        console.error("[INVOKE ERROR]", cmd, e.message);
      }
    }
    // Fallback
    switch (cmd) {
      case "uploadEmbeddings": return { success: true, count: 10 };
      case "getCachedEmbedding": return null;
      case "deleteVectorIndex": return { success: true };
      case "getEmbeddingClusters": return { clusters: [] };
      case "batchVectorSearch": return [];
      case "llm_chat": return { response: "Hello!" };
      case "llm_rag": return { response: "Based on docs..." };
      default:
        console.warn("[INVOKE FALLBACK]", cmd);
        return [];
    }
  }
};
if (!window.__TAURI__) window.__TAURI__ = {};
`;

const ALL_PANELS = [
  "monitoring", "pubsub", "cluster", "vectorSearch",
  "embeddingCache", "clusterVis", "llmChat", "queryOptimizer",
];
const BOTTOM_PANELS = ["monitoring", "vectorSearch", "embeddingCache", "queryOptimizer"];

function buildLayoutState(visiblePanel) {
  const panels = {};
  for (const p of ALL_PANELS) {
    panels[p] = { visible: visiblePanel === p, collapsed: false, position: BOTTOM_PANELS.includes(p) ? "bottom" : "right" };
  }
  return { state: { panels, leftSidebarCollapsed: false, rightSidebarCollapsed: false, bottomPanelHeight: 300 }, version: 0 };
}

async function main() {
  // Start proxy
  const proxyProc = spawn("node", [path.join(__dirname, "redis-proxy.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  proxyProc.stdout.on("data", (d) => process.stdout.write(d));
  proxyProc.stderr.on("data", (d) => process.stderr.write(d));
  await new Promise((r) => setTimeout(r, 2000));

  // Start Vite
  const server = await createServer({
    root: path.join(__dirname, ".."),
    server: { port: 4174 },
    logLevel: "silent",
  });
  await server.listen();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Pre-seed state
  await context.addInitScript((state) => {
    localStorage.setItem("redust-connections", JSON.stringify(state));
    localStorage.setItem("redust-theme", "light");
  }, CONNECTION_STATE);

  await context.addInitScript(PROXY_TAURI_JS);

  const page = await context.newPage();

  // Capture console messages
  const logs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push(text);
    if (text.includes("[INVOKE") || text.includes("error") || text.includes("Error") || text.includes("fail")) {
      console.log(`[BROWSER ${msg.type()}] ${text}`);
    }
  });

  // Set layout and navigate
  const layout = buildLayoutState("vectorSearch");
  await page.goto("http://localhost:4174", { waitUntil: "networkidle" });
  await page.evaluate((s) => {
    localStorage.setItem("redust-dashboard-layout", JSON.stringify(s));
  }, layout);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  console.log("\n=== After initial load ===");

  // Check index select
  const indexSelect = page.locator('select').first();
  const selectCount = await indexSelect.count();
  console.log(`Select elements found: ${selectCount}`);
  if (selectCount > 0) {
    const selectedValue = await indexSelect.inputValue();
    console.log(`Selected index value: "${selectedValue}"`);
    const options = await indexSelect.locator('option').allTextContents();
    console.log(`Available options: ${JSON.stringify(options)}`);
  }

  // Check textarea
  const textarea = page.locator('textarea').first();
  const taCount = await textarea.count();
  console.log(`Textarea elements found: ${taCount}`);

  // Check search button state
  const searchBtn = page.getByRole("button", { name: "Search", exact: true });
  const btnCount = await searchBtn.count();
  console.log(`Search buttons found: ${btnCount}`);
  if (btnCount > 0) {
    const isDisabled = await searchBtn.isDisabled();
    console.log(`Search button disabled: ${isDisabled}`);
  }

  // Fill query
  if (taCount > 0) {
    await textarea.fill("Redis vector search");
    console.log("Filled textarea with 'Redis vector search'");
    await page.waitForTimeout(300);
  }

  // Click search
  if (btnCount > 0 && !(await searchBtn.isDisabled())) {
    console.log("Clicking Search...");
    await searchBtn.click();
    console.log("Waiting 10s for search to complete...");
    await page.waitForTimeout(10000);
  } else {
    console.log("Cannot click Search - button not found or disabled");
  }

  // Check results
  const resultsText = page.locator('text=Results');
  const resultsCount = await resultsText.count();
  console.log(`\n=== After search ===`);
  console.log(`"Results" text elements: ${resultsCount}`);

  // Get all text from the panel
  const panelText = await page.evaluate(() => {
    const el = document.getElementById('screenshot-panel-target');
    if (el) return el.textContent;
    // Try bottom panel area
    const panels = document.querySelectorAll('[style*="height"]');
    for (const p of panels) {
      if (p.style.height === '320px') return p.textContent?.slice(0, 500);
    }
    return document.body.textContent?.slice(0, 500);
  });
  console.log(`Panel text (first 500): ${panelText}`);

  // Check for result elements
  const resultElements = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="rounded border"]');
    return Array.from(items).map(el => el.textContent?.slice(0, 100)).slice(0, 10);
  });
  console.log(`Result card elements: ${JSON.stringify(resultElements)}`);

  // Print all INVOKE logs
  console.log("\n=== All INVOKE logs ===");
  logs.filter(l => l.includes("[INVOKE")).forEach(l => console.log(l));

  await browser.close();
  await server.close();
  proxyProc.kill();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
