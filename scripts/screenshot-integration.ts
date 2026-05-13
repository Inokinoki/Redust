/**
 * Integration screenshot script — connects to a real Redis Stack instance.
 * Mocks Tauri invoke calls so panels render with realistic data in the browser.
 * Prerequisites: docker run -d --name redust-redis -p 6379:6379 redis/redis-stack-server:latest
 * Usage: npx tsx scripts/screenshot-integration.ts
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn } from "child_process";
import path from "path";
import { mkdir, rm } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots-integration");

const CONNECTION_STATE = {
  state: {
    connections: [
      {
        id: "conn-local-redis",
        name: "Local Redis Stack",
        host: "localhost",
        port: 6379,
        password: "",
        database: 0,
        tls: false,
      },
    ],
    activeConnectionId: "conn-local-redis",
  },
  version: 0,
};

const ALL_PANELS = [
  "monitoring", "pubsub", "cluster", "vectorSearch",
  "embeddingCache", "clusterVis", "llmChat", "queryOptimizer",
] as const;

const BOTTOM_PANELS = ["monitoring", "vectorSearch", "embeddingCache", "queryOptimizer"];
const RIGHT_PANELS = ["pubsub", "cluster", "clusterVis", "llmChat"];

function buildLayoutState(visiblePanel: string | null, opts?: { collapseLeft?: boolean }) {
  const panels: Record<string, { visible: boolean; collapsed: boolean; position: string }> = {};
  for (const p of ALL_PANELS) {
    panels[p] = { visible: visiblePanel === p, collapsed: false, position: BOTTOM_PANELS.includes(p) ? "bottom" : "right" };
  }
  return { state: { panels, leftSidebarCollapsed: opts?.collapseLeft ?? false, rightSidebarCollapsed: false, bottomPanelHeight: 300 }, version: 0 };
}

function buildMultiPanelState(visiblePanels: string[]) {
  const panels: Record<string, { visible: boolean; collapsed: boolean; position: string }> = {};
  for (const p of ALL_PANELS) {
    panels[p] = { visible: visiblePanels.includes(p), collapsed: false, position: BOTTOM_PANELS.includes(p) ? "bottom" : "right" };
  }
  return { state: { panels, leftSidebarCollapsed: false, rightSidebarCollapsed: false, bottomPanelHeight: 300 }, version: 0 };
}

/** JS to mock Tauri invoke — proxies to real Redis via HTTP, falls back to defaults */
const PROXY_TAURI_JS = `
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args) => {
    // Try real Redis proxy first
    const proxyCommands = [
      "getMonitoringData", "get_keys", "listVectorIndexes",
      "getVectorIndexInfo", "getPublicChannels", "getClusterInfo",
      "publishMessage", "searchIndex"
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
          return data;
        } else {
          console.warn("[MOCK] proxy returned status", res.status, "for", cmd);
        }
      } catch (e) {
        console.warn("[MOCK] proxy failed for", cmd, e.message);
      }
    }
    // Fallback for commands not supported by proxy
    switch (cmd) {
      case "uploadEmbeddings":
        return { success: true, count: 10 };
      case "getCachedEmbedding":
        return null;
      case "deleteVectorIndex":
        return { success: true };
      case "getEmbeddingClusters":
        return { clusters: [] };
      case "batchVectorSearch":
        return [];
      case "llm_chat":
        return { response: "Hello! I can help you with Redis operations." };
      case "llm_rag":
        return { response: "Based on the documents, here is the answer..." };
      case "llm_generate_embedding":
        return { embedding: new Array(1536).fill(0).map(() => Math.random()) };
      case "vector_search":
        return {
          results: [
            { id: "doc:1", score: 0.95, fields: { text: "Redis vector search documentation", title: "Getting Started" } },
            { id: "doc:2", score: 0.87, fields: { text: "How to create vector indexes", title: "Indexing Guide" } },
          ],
        };
      default:
        console.warn("[MOCK] unhandled command:", cmd);
        return [];
    }
  }
};
if (!window.__TAURI__) {
  window.__TAURI__ = {};
}
`;

async function main() {
  await rm(SCREENSHOTS_DIR, { recursive: true, force: true });
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  // Start Redis proxy
  const proxyProc = spawn("node", [path.join(__dirname, "redis-proxy.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  proxyProc.stdout.on("data", (d: Buffer) => process.stdout.write(d));
  proxyProc.stderr.on("data", (d: Buffer) => process.stderr.write(d));
  await new Promise((r) => setTimeout(r, 2000)); // wait for proxy to connect

  const server = await createServer({
    root: path.join(__dirname, ".."),
    server: { port: 4174 },
    logLevel: "silent",
  });
  await server.listen();
  console.log("Vite dev server started on http://localhost:4174");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Pre-seed connection config + mock Tauri on every new page
  await context.addInitScript((state) => {
    localStorage.setItem("redust-connections", JSON.stringify(state));
    localStorage.setItem("redust-theme", "light");
  }, CONNECTION_STATE);

  await context.addInitScript(PROXY_TAURI_JS);

  /** Create a fresh page with specific panel visible */
  async function freshPage(panelId: string | null, opts?: { collapseLeft?: boolean }) {
    const page = await context.newPage();
    const layout = buildLayoutState(panelId, opts);
    await page.goto("http://localhost:4174", { waitUntil: "networkidle" });
    await page.evaluate((s) => {
      localStorage.setItem("redust-dashboard-layout", JSON.stringify(s));
    }, layout);
    // Set wider right panel for right-side panel screenshots
    if (RIGHT_PANELS.includes(panelId as any)) {
      await page.evaluate(() => {
        localStorage.setItem("redust-panel-layout", JSON.stringify({
          "left-sidebar": 0,
          "main-content": 40,
          "right-sidebar": 60,
        }));
      });
      // Collapse left sidebar and MetricsBar for right panel screenshots
      await page.evaluate((s) => {
        const current = JSON.parse(localStorage.getItem("redust-dashboard-layout") || "{}");
        current.state = { ...current.state, leftSidebarCollapsed: true, rightSidebarCollapsed: true };
        localStorage.setItem("redust-dashboard-layout", JSON.stringify(current));
      }, layout);
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    return page;
  }

  /** Screenshot only the panel content area — no tabs, no headers, no other panels */
  async function screenshotPanel(page: any, panelId: string, filePath: string) {
    const isBottom = BOTTOM_PANELS.includes(panelId);
    await page.evaluate((isBottom) => {
      if (isBottom) {
        // Bottom panel: find 320px container, hide its tab bar (first child with border-b)
        for (const el of document.querySelectorAll('[style]')) {
          if ((el as HTMLElement).style.height === '320px') {
            const tabBar = el.firstElementChild;
            if (tabBar) (tabBar as HTMLElement).style.display = 'none';
            (el as HTMLElement).id = 'screenshot-panel-target';
            break;
          }
        }
      } else {
        // Right panel: find RightPanelGroup (border-t), hide its tab bar and header
        const rs = document.getElementById('right-sidebar');
        if (rs) {
          const wrapper = rs.firstElementChild || rs;
          for (const child of wrapper.children) {
            if (child.classList.contains('border-t')) {
              // Hide all children that have border-b (tab bar + header)
              for (const gc of child.children) {
                if (gc.classList.contains('border-b')) {
                  (gc as HTMLElement).style.display = 'none';
                }
              }
              (child as HTMLElement).id = 'screenshot-panel-target';
              break;
            }
          }
        }
      }
    }, isBottom);

    const el = page.locator('#screenshot-panel-target');
    if (await el.count() > 0) {
      await el.screenshot({ path: filePath });
    } else {
      console.warn(`[SCREENSHOT] panel target not found, full page fallback`);
      await page.screenshot({ path: filePath });
    }
  }

  async function freshMultiPage(panelIds: string[]) {
    const page = await context.newPage();
    const layout = buildMultiPanelState(panelIds);
    await page.goto("http://localhost:4174", { waitUntil: "networkidle" });
    await page.evaluate((s) => {
      localStorage.setItem("redust-dashboard-layout", JSON.stringify(s));
    }, layout);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    return page;
  }

  // 1. Main dashboard with sidebar expanded
  let page = await freshPage(null);
  const aiGroup = page.locator('button').filter({ hasText: /🧠/ });
  await aiGroup.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-dashboard-sidebar.png") });
  console.log("1. Dashboard + sidebar expanded");
  await page.close();

  // 2. Vector Search panel — select index, switch to text mode, type query
  page = await freshPage("vectorSearch");
  // Select an index
  const indexSelect = page.locator('select').first();
  if (await indexSelect.count() > 0) {
    await indexSelect.selectOption({ label: "documents_idx" });
    await page.waitForTimeout(500);
  }
  // Switch to "Text to Vector" mode
  const textModeBtn = page.getByRole("button", { name: /Text to Vector/i });
  if (await textModeBtn.count() > 0) {
    await textModeBtn.click();
    await page.waitForTimeout(300);
  }
  // Type a query
  const queryInput = page.locator('textarea').first();
  if (await queryInput.count() > 0) {
    await queryInput.fill("Redis vector search best practices");
    await page.waitForTimeout(300);
  }
  await screenshotPanel(page, "vectorSearch", path.join(SCREENSHOTS_DIR, "02-vector-search.png"));
  console.log("2. Vector Search with query");
  await page.close();

  // 3. Monitoring panel — real metrics from Redis
  page = await freshPage("monitoring");
  await screenshotPanel(page, "monitoring", path.join(SCREENSHOTS_DIR, "03-monitoring.png"));
  console.log("3. Monitoring metrics");
  await page.close();

  // 4. Embedding Cache panel
  page = await freshPage("embeddingCache");
  await screenshotPanel(page, "embeddingCache", path.join(SCREENSHOTS_DIR, "04-embedding-cache.png"));
  console.log("4. Embedding Cache");
  await page.close();

  // 5. Pub/Sub panel — channels loaded from Redis
  page = await freshPage("pubsub");
  await page.waitForTimeout(1000);
  // Click a channel to select it
  const channelItem = page.getByText("notifications");
  if (await channelItem.count() > 0) {
    await channelItem.click();
    await page.waitForTimeout(300);
  }
  await screenshotPanel(page, "pubsub", path.join(SCREENSHOTS_DIR, "05-pubsub.png"));
  console.log("5. Pub/Sub with channels");
  await page.close();

  // 6. Cluster Topology panel — node table from Redis
  page = await freshPage("cluster");
  await page.waitForTimeout(1000);
  await screenshotPanel(page, "cluster", path.join(SCREENSHOTS_DIR, "06-cluster-topology.png"));
  console.log("6. Cluster Topology");
  await page.close();

  // 7. AI Chat panel — send a message to show chat bubbles
  page = await freshPage("llmChat");
  const chatInput = page.getByPlaceholder(/Ask about your Redis/i);
  if (await chatInput.count() > 0) {
    await chatInput.fill("How do I create a vector index in Redis?");
    await page.waitForTimeout(200);
  }
  const sendBtn = page.getByRole("button", { name: /Send/i });
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled()) {
    await sendBtn.click();
    await page.waitForTimeout(1000);
  }
  await screenshotPanel(page, "llmChat", path.join(SCREENSHOTS_DIR, "07-ai-chat.png"));
  console.log("7. AI Chat with message");
  await page.close();

  // 8. Command Palette
  page = await freshPage(null);
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("vector");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-command-palette.png") });
  console.log("8. Command Palette");
  await page.close();

  // 9. Connection Manager modal
  page = await freshPage(null);
  const addBtn = page.getByRole("button", { name: /Add Connection/i });
  await addBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09-connection-manager.png") });
  console.log("9. Connection Manager");
  await page.close();

  // 10. All panels open (bottom: Monitoring + right: Cluster)
  page = await freshMultiPage(["monitoring", "cluster"]);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10-all-panels.png") });
  console.log("10. Dual panels");
  await page.close();

  await browser.close();
  await server.close();
  proxyProc.kill();
  console.log(`\nDone! ${SCREENSHOTS_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
