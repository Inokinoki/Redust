/**
 * Quick test: dump the panel DOM and take a panel screenshot to see what's rendering.
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
  const proxyProc = spawn("node", [path.join(__dirname, "redis-proxy.mjs")], { stdio: [/*pipe*/"pipe", "pipe", "pipe"] });
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

  // 1. Check what variant is rendering by looking at the panel DOM structure
  const panelInfo = await page.evaluate(() => {
    // Find the 320px container
    const container = [...document.querySelectorAll('[style]')].find(el => el.style.height === '320px');
    if (!container) return { error: "No 320px container found" };
    return {
      containerClass: container.className,
      childCount: container.children.length,
      childClasses: [...container.children].map(c => ({ tag: c.tagName, class: c.className, childCount: c.children.length })),
      // Check if it has the panel variant (compact layout with "flex h-full flex-col overflow-auto")
      hasPanelVariant: !!container.querySelector('.flex.h-full.flex-col.overflow-auto'),
      // Check if it has the tabs variant
      hasTabs: !!container.querySelector('[role="tablist"]'),
      // Full innerHTML truncated
      innerHTML: container.innerHTML.slice(0, 500),
    };
  });
  console.log("\n=== Panel Container Info ===");
  console.log(JSON.stringify(panelInfo, null, 2));

  // 2. Select index, type query, search
  const indexSelect = page.locator('select').first();
  if (await indexSelect.count() > 0) {
    const options = await indexSelect.locator('option').allTextContents();
    console.log("\nIndex select options:", options);
    await indexSelect.selectOption({ value: "redust-docs-idx" }).catch(() => console.log("Failed to select index"));
    await page.waitForTimeout(1000);
  }

  const queryInput = page.locator('textarea').first();
  if (await queryInput.count() > 0) {
    await queryInput.fill("Redis vector search");
    await page.waitForTimeout(300);
  }

  const searchBtn = page.getByRole("button", { name: "Search", exact: true });
  if (await searchBtn.count() > 0) {
    const isDisabled = await searchBtn.isDisabled();
    console.log("Search button disabled:", isDisabled);
    if (!isDisabled) {
      await searchBtn.click();
      console.log("Clicked search, waiting 8s...");
      await page.waitForTimeout(8000);
    }
  }

  // 3. Check results
  const resultsInfo = await page.evaluate(() => {
    const container = [...document.querySelectorAll('[style]')].find(el => el.style.height === '320px');
    if (!container) return { error: "No 320px container" };

    // Find results in panel variant
    const panelDiv = container.querySelector('.flex.h-full.flex-col.overflow-auto');
    if (!panelDiv) return { error: "No panel div", containerHTML: container.innerHTML.slice(0, 300) };

    // Get all text content
    const textContent = panelDiv.textContent;

    // Count result cards
    const resultCards = panelDiv.querySelectorAll('.rounded.border.p-2');

    return {
      panelTextContent: textContent?.slice(0, 1000),
      resultCardCount: resultCards.length,
      resultCards: [...resultCards].map(c => c.textContent?.slice(0, 100)).slice(0, 5),
      panelChildrenCount: panelDiv.children.length,
      panelChildrenTags: [...panelDiv.children].map(c => ({ tag: c.tagName, text: c.textContent?.slice(0, 50), display: getComputedStyle(c).display })),
    };
  });
  console.log("\n=== Results Info ===");
  console.log(JSON.stringify(resultsInfo, null, 2));

  // 4. Take screenshots
  // Full page
  await page.screenshot({ path: path.join(__dirname, "..", "screenshots-integration", "debug-fullpage.png") });

  // Panel (like screenshotPanel does)
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
    await el.screenshot({ path: path.join(__dirname, "..", "screenshots-integration", "debug-panel.png") });
    console.log("\nPanel screenshot saved");
  } else {
    console.log("\nPanel target not found");
  }

  // 5. Now hide form elements and take another screenshot
  await page.evaluate(() => {
    const panel = document.querySelector('.flex.h-full.flex-col.overflow-auto');
    if (!panel) return;
    for (const child of panel.children) {
      if (child.querySelector('textarea')) { child.style.display = 'none'; continue; }
      if (child.querySelector('input[type="number"]')) { child.style.display = 'none'; continue; }
    }
  });
  await el.screenshot({ path: path.join(__dirname, "..", "screenshots-integration", "debug-panel-hidden.png") });
  console.log("Panel screenshot with hidden form saved");

  await browser.close();
  await server.close();
  proxyProc.kill();
}

main().catch((err) => { console.error(err); process.exit(1); });
