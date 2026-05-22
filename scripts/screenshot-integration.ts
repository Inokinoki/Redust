/**
 * Integration screenshot script — connects to a real Redis Stack instance.
 * Mocks Tauri invoke calls so pages render with realistic data in the browser.
 * Prerequisites: docker run -d --name redust-redis -p 6379:6379 redis/redis-stack-server:latest
 * Usage: npx tsx scripts/screenshot-integration.ts
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn, spawnSync } from "child_process";
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

type PageId = "dashboard" | "vectorSearch" | "embeddingCache" | "clusterVis" | "llmChat" | "queryOptimizer" | "monitoring" | "cluster" | "pubsub";

function buildPageState(pageId: PageId) {
  return {
    // tabStore: open a tab for the requested page
    tabs: {
      state: {
        tabs: [{
          id: `tab-${pageId}`,
          connectionId: "conn-local-redis",
          pageId,
          title: PAGE_LABELS[pageId],
        }],
        activeTabId: `tab-${pageId}`,
      },
      version: 0,
    },
    // dashboardStore: sidebar state
    layout: { state: { leftSidebarCollapsed: false }, version: 0 },
  };
}

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Keys",
  vectorSearch: "Vector Search",
  embeddingCache: "Embedding Cache",
  clusterVis: "Clusters",
  llmChat: "AI Chat",
  queryOptimizer: "Query Optimizer",
  monitoring: "Monitoring",
  cluster: "Cluster Topology",
  pubsub: "Pub/Sub",
};

/** Unique suffix for screenshot filenames to bust CDN caches */
const RUN_ID = Date.now().toString(36);

/** JS to mock Tauri invoke — proxies to real Redis via HTTP, falls back to defaults */
const PROXY_TAURI_JS = `
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args) => {
    // Try real Redis proxy first
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
        return { embedding: new Array(384).fill(0).map(() => Math.random()), model: "mock" };
      case "vector_search":
        return {
          results: [
            { key: "redust:doc:1", score: 0.95, fields: { title: "Getting Started with Redis", content: "Redis is an in-memory data structure store." } },
            { key: "redust:doc:2", score: 0.87, fields: { title: "Vector Search in Redis", content: "Redis Stack includes vector similarity search." } },
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

/** Seed vector index with real semantic embeddings */
async function seedVectorData() {
  console.log("Seeding vector data with real embeddings...");
  const result = spawnSync("node", [path.join(__dirname, "seed-vector.mjs")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("Seed script failed, continuing without real embeddings");
  }
}

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

  // Seed vector index for realistic Vector Search screenshots
  await seedVectorData();

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
    colorScheme: "light",
  });

  // Pre-seed connection config + force light theme on every new page
  await context.addInitScript((state) => {
    localStorage.setItem("redust-connections", JSON.stringify(state));
    localStorage.setItem("redust-theme", "light");
  }, CONNECTION_STATE);

  await context.addInitScript(PROXY_TAURI_JS);

  /** Navigate to a specific page by setting localStorage and reloading */
  async function openPage(pageId: PageId) {
    const page = await context.newPage();
    const state = buildPageState(pageId);
    await page.goto("http://localhost:4174", { waitUntil: "networkidle" });
    await page.evaluate((s) => {
      localStorage.setItem("redust-tabs", JSON.stringify(s.tabs));
      localStorage.setItem("redust-dashboard-layout", JSON.stringify(s.layout));
    }, state);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    return page;
  }

  // 1. Main dashboard with sidebar expanded
  let page = await openPage("dashboard");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `01-dashboard-sidebar-${RUN_ID}.png`) });
  console.log("1. Dashboard + sidebar expanded");
  await page.close();

  // 2. Vector Search — select index, type query, run search
  page = await openPage("vectorSearch");
  await page.waitForTimeout(3000);
  const indexSelect = page.locator('select').first();
  if (await indexSelect.count() > 0) {
    await indexSelect.selectOption({ value: "redust-docs-idx" }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  const queryInput = page.locator('textarea').first();
  if (await queryInput.count() > 0) {
    await queryInput.fill("Redis vector search");
    await page.waitForTimeout(300);
  }
  const searchBtn = page.getByRole("button", { name: "Search", exact: true });
  if (await searchBtn.count() > 0) {
    await searchBtn.click().catch(() => {});
  }
  await page.waitForTimeout(8000); // wait for embedding model load + search
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02-vector-search-${RUN_ID}.png`) });
  console.log("2. Vector Search with query");
  // Switch to Results tab
  const resultsTab = page.getByRole("tab", { name: /Results/ });
  if (await resultsTab.count() > 0) {
    await resultsTab.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02b-vector-results-${RUN_ID}.png`) });
  console.log("2b. Vector Search Results tab");
  await page.close();

  // 3. Monitoring — real metrics from Redis
  page = await openPage("monitoring");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03-monitoring-${RUN_ID}.png`) });
  console.log("3. Monitoring metrics");
  await page.close();

  // 4. Embedding Cache
  page = await openPage("embeddingCache");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `04-embedding-cache-${RUN_ID}.png`) });
  console.log("4. Embedding Cache");
  await page.close();

  // 5. Pub/Sub — channels loaded from Redis
  page = await openPage("pubsub");
  await page.waitForTimeout(1000);
  const channelItem = page.getByText("notifications");
  if (await channelItem.count() > 0) {
    await channelItem.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `05-pubsub-${RUN_ID}.png`) });
  console.log("5. Pub/Sub with channels");
  await page.close();

  // 6. Cluster Topology — node table from Redis
  page = await openPage("cluster");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `06-cluster-topology-${RUN_ID}.png`) });
  console.log("6. Cluster Topology");
  await page.close();

  // 7. AI Chat — send a message to show chat bubbles
  page = await openPage("llmChat");
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
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `07-ai-chat-${RUN_ID}.png`) });
  console.log("7. AI Chat with message");
  await page.close();

  // 8. Command Palette
  page = await openPage("dashboard");
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("vector");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `08-command-palette-${RUN_ID}.png`) });
  console.log("8. Command Palette");
  await page.close();

  // 9. Connection Manager modal
  page = await openPage("dashboard");
  const addBtn = page.getByRole("button", { name: /Add Connection/i }).first();
  await addBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `09-connection-manager-${RUN_ID}.png`) });
  console.log("9. Connection Manager");
  await page.close();

  // 10. Cluster Visualization
  page = await openPage("clusterVis");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `10-cluster-visualization-${RUN_ID}.png`) });
  console.log("10. Cluster Visualization");
  await page.close();

  // 11. Query Optimizer
  page = await openPage("queryOptimizer");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `11-query-optimizer-${RUN_ID}.png`) });
  console.log("11. Query Optimizer");
  await page.close();

  await browser.close();
  await server.close();
  proxyProc.kill();
  console.log(`\nDone! ${SCREENSHOTS_DIR} (run: ${RUN_ID})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
