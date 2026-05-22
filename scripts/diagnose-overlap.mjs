/**
 * Diagnose layout overlapping in Vector Search screenshot.
 * Takes full-page + panel screenshots and dumps DOM structure.
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn } from "child_process";
import path from "path";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "screenshots-integration");

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
  await mkdir(OUT, { recursive: true });

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

  // 1. Full-page BEFORE any interaction
  await page.screenshot({ path: path.join(OUT, "diag-fullpage-before.png") });
  console.log("1. Full-page BEFORE saved");

  // 2. Select index, type query, click search (same as screenshot-integration.ts)
  const indexSelect = page.locator('select').first();
  if (await indexSelect.count() > 0) {
    await indexSelect.selectOption({ value: "redust-docs-idx" }, { force: true }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  const queryInput = page.locator('textarea').first();
  if (await queryInput.count() > 0) {
    await queryInput.fill("Redis vector search", { force: true });
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => {
    const panel = document.querySelector('.flex.h-full.flex-col.overflow-auto');
    if (!panel) return;
    const btn = [...panel.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Search');
    if (btn) btn.click();
  });
  await page.waitForTimeout(8000);

  // 3. Full-page AFTER search (before hiding form elements)
  await page.screenshot({ path: path.join(OUT, "diag-fullpage-after-search.png") });
  console.log("2. Full-page AFTER search saved");

  // 4. Dump bounding rects of ALL elements in the page to find overlapping ones
  const overlapInfo = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('*');
    const rects = [];

    for (const el of elements) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      rects.push({
        tag: el.tagName,
        id: el.id || undefined,
        className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : undefined,
        text: el.textContent?.slice(0, 30),
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        zIndex: style.zIndex,
        position: style.position,
        overflow: style.overflow,
      });
    }

    // Check for overlapping pairs (bottom panel area, y > 500)
    const bottomElements = rects.filter(r => r.y > 400);
    const overlaps = [];
    for (let i = 0; i < bottomElements.length; i++) {
      for (let j = i + 1; j < bottomElements.length; j++) {
        const a = bottomElements[i];
        const b = bottomElements[j];
        // Check if they overlap (not parent-child, actual overlap)
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          const overlapArea = (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
                              (Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
          // Only report significant overlaps (not just parent-child)
          const minArea = Math.min(a.w * a.h, b.w * b.h);
          if (overlapArea > minArea * 0.3) {
            overlaps.push({
              a: { tag: a.tag, cls: a.className, text: a.text, x: a.x, y: a.y, w: a.w, h: a.h },
              b: { tag: b.tag, cls: b.className, text: b.text, x: b.x, y: b.y, w: b.w, h: b.h },
              overlapPct: Math.round(overlapArea / minArea * 100),
            });
          }
        }
      }
    }
    return { bottomElementCount: bottomElements.length, overlaps: overlaps.slice(0, 20) };
  });
  console.log("\n=== Overlap Analysis ===");
  console.log(`Bottom area elements: ${overlapInfo.bottomElementCount}`);
  console.log(`Overlaps found: ${overlapInfo.overlaps.length}`);
  for (const o of overlapInfo.overlaps) {
    console.log(`  ${o.a.tag}.${o.a.cls?.slice(0, 40)} [${o.a.x},${o.a.y} ${o.a.w}x${o.a.h}] overlaps ${o.b.tag}.${o.b.cls?.slice(0, 40)} [${o.b.x},${o.b.y} ${o.b.w}x${o.b.h}] by ${o.overlapPct}%`);
  }

  // 5. Check the 320px container and its children
  const containerInfo = await page.evaluate(() => {
    const container = [...document.querySelectorAll('[style]')].find(el => el.style.height === '320px');
    if (!container) return { error: "No 320px container" };

    const parent = container.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check all children of the container
    const children = [];
    for (const child of container.children) {
      const r = child.getBoundingClientRect();
      const style = getComputedStyle(child);
      children.push({
        tag: child.tagName,
        cls: (typeof child.className === 'string') ? child.className.slice(0, 60) : '',
        text: child.textContent?.slice(0, 40),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        display: style.display, overflow: style.overflow,
      });
    }

    // Get all direct children of the panel div
    const panelDiv = container.querySelector('.flex.h-full.flex-col.overflow-auto');
    const panelChildren = [];
    if (panelDiv) {
      for (const child of panelDiv.children) {
        const r = child.getBoundingClientRect();
        const style = getComputedStyle(child);
        panelChildren.push({
          tag: child.tagName,
          cls: (typeof child.className === 'string') ? child.className.slice(0, 80) : '',
          text: child.textContent?.slice(0, 50),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          display: style.display,
          hasTextarea: !!child.querySelector('textarea'),
          hasNumberInput: !!child.querySelector('input[type="number"]'),
          hasSelect: !!child.querySelector('select'),
          hasButton: !!child.querySelector('button'),
        });
      }
    }

    return {
      containerRect: { x: Math.round(containerRect.x), y: Math.round(containerRect.y), w: Math.round(containerRect.width), h: Math.round(containerRect.height) },
      parentRect: parentRect ? { x: Math.round(parentRect.x), y: Math.round(parentRect.y), w: Math.round(parentRect.width), h: Math.round(parentRect.height), tag: parent?.tagName, cls: parent?.className?.slice(0, 60) } : null,
      containerChildren: children,
      panelChildren,
    };
  });
  console.log("\n=== Container Info ===");
  console.log(JSON.stringify(containerInfo, null, 2));

  // 6. Now hide form elements (same as screenshot-integration.ts) and take screenshots
  await page.evaluate(() => {
    const panel = document.querySelector('.flex.h-full.flex-col.overflow-auto');
    if (!panel) return;
    for (const child of panel.children) {
      if (child.querySelector('textarea')) { child.style.display = 'none'; continue; }
      if (child.querySelector('input[type="number"]')) { child.style.display = 'none'; continue; }
    }
  });

  // Full-page after hiding
  await page.screenshot({ path: path.join(OUT, "diag-fullpage-after-hide.png") });
  console.log("\n3. Full-page AFTER hiding form saved");

  // Panel screenshot (same as screenshot-integration.ts)
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
    await el.screenshot({ path: path.join(OUT, "diag-panel-only.png") });
    console.log("4. Panel-only screenshot saved");
  }

  // 7. Final panel DOM analysis after hiding
  const finalPanelInfo = await page.evaluate(() => {
    const container = document.getElementById('screenshot-panel-target');
    if (!container) return { error: "No target" };
    const panelDiv = container.querySelector('.flex.h-full.flex-col.overflow-auto');
    if (!panelDiv) return { error: "No panel div" };
    return {
      panelChildren: [...panelDiv.children].map(child => ({
        tag: child.tagName,
        cls: (typeof child.className === 'string') ? child.className.slice(0, 80) : '',
        text: child.textContent?.slice(0, 50),
        display: getComputedStyle(child).display,
        rect: (() => {
          const r = child.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        })(),
      })),
    };
  });
  console.log("\n=== Final Panel State ===");
  console.log(JSON.stringify(finalPanelInfo, null, 2));

  await browser.close();
  await server.close();
  proxyProc.kill();
  console.log("\nDone!");
}

main().catch((err) => { console.error(err); process.exit(1); });
