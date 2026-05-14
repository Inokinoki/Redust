/**
 * HTTP proxy that mimics Tauri invoke() calls by executing real Redis commands.
 * Usage: node scripts/redis-proxy.mjs
 */
import { createServer } from "http";
import { createClient } from "redis";

const REDIS_URL = "redis://localhost:6379";
let redis;

async function connect() {
  redis = createClient({ url: REDIS_URL });
  redis.on("error", (err) => console.error("Redis error:", err.message));
  await redis.connect();
  console.log("Connected to Redis at", REDIS_URL);
}

// ── Command handlers ──────────────────────────────────────────────────────────

async function handleGetMonitoringData(/* config */) {
  const info = await redis.info();
  const parsed = {};
  for (const line of info.split("\r\n")) {
    const [k, v] = line.split(":");
    if (k && v !== undefined) parsed[k] = v;
  }

  const usedMemory = parseInt(parsed.used_memory || "0", 10);
  const totalMemory = parseInt(parsed.total_system_memory || "1", 10);
  const cpuSys = parseFloat(parsed.used_cpu_sys || "0");
  const cpuUser = parseFloat(parsed.used_cpu_user || "0");
  const uptime = parseInt(parsed.uptime_in_seconds || "0", 10);
  const keysLine = Object.keys(parsed).find((k) => k.startsWith("db0"));
  let keys = 0;
  if (keysLine) {
    const m = parsed[keysLine].match(/keys=(\d+)/);
    if (m) keys = parseInt(m[1], 10);
  }

  // Use CPU per second (instantaneous) instead of cumulative
  const cpuSysSec = parseFloat(parsed.used_cpu_sys_main_thread || parsed.used_cpu_sys || "0");
  const cpuUserSec = parseFloat(parsed.used_cpu_user_main_thread || parsed.used_cpu_user || "0");
  const cpuPct = uptime > 0 ? Math.min(((cpuSysSec + cpuUserSec) / uptime) * 100, 100) : 0;

  return {
    cpu: Math.round(cpuPct * 10) / 10,
    memory: Math.round((usedMemory / totalMemory) * 1000) / 10,
    usedMemory,
    keys,
    connections: parseInt(parsed.connected_clients || "0", 10),
    commandsPerSecond: parseInt(parsed.instantaneous_ops_per_sec || "0", 10),
    redisVersion: parsed.redis_version || "unknown",
    uptime,
  };
}

async function handleGetKeys(config, { pattern = "*", count = 50 } = {}) {
  const keys = await redis.keys(pattern);
  const limited = keys.slice(0, count);
  const results = [];
  for (const k of limited) {
    let type = "string";
    try { type = await redis.type(k); } catch {}
    results.push({ key: k, type });
  }
  return results;
}

async function handleListVectorIndexes(/* config */) {
  try {
    const indexes = await redis.sendCommand(["FT._LIST"]);
    return indexes || [];
  } catch {
    return [];
  }
}

async function handleGetVectorIndexInfo(config, { indexName } = {}) {
  if (!indexName) return null;
  try {
    const info = await redis.sendCommand(["FT.INFO", indexName]);
    const result = {};
    for (let i = 0; i < info.length; i += 2) {
      result[info[i]] = info[i + 1];
    }
    return {
      indexName,
      numDocs: parseInt(result.num_docs || "0", 10),
      indexStatus: result.index_status || "OK",
      vectorField: null,
      vectorDimensions: null,
      fields: result.fields || [],
    };
  } catch {
    return { indexName, numDocs: 0, indexStatus: "ERROR", fields: [] };
  }
}

async function handleGetPublicChannels(/* config */) {
  try {
    const channels = await redis.sendCommand(["PUBSUB", "CHANNELS"]);
    return channels || [];
  } catch {
    return [];
  }
}

async function handleGetClusterInfo(/* config */) {
  try {
    const info = await redis.sendCommand(["CLUSTER", "INFO"]);
    const parsed = {};
    for (const line of info.split("\r\n")) {
      const [k, v] = line.split(":");
      if (k && v !== undefined) parsed[k] = v;
    }
    if (parsed.cluster_state !== "ok") {
      return {
        cluster_enabled: parsed.cluster_enabled === "1",
        cluster_state: parsed.cluster_state || "unknown",
        known_nodes: 0,
        nodes: [],
      };
    }
    return {
      cluster_enabled: true,
      cluster_state: parsed.cluster_state,
      known_nodes: 0,
      nodes: [],
    };
  } catch {
    // Standalone Redis, not cluster
    return {
      cluster_enabled: false,
      cluster_state: "standalone",
      known_nodes: 1,
      nodes: [
        { id: "standalone", role: "master", host: "localhost", port: 6379, master_id: null, connected: true, slots: "0-16383" },
      ],
    };
  }
}

async function handlePublishMessage(config, { channel, message } = {}) {
  return await redis.publish(channel || "test", message || "hello");
}

async function handleSearchIndex(config, { indexName, query, limit } = {}) {
  if (!indexName || !query) return { results: [] };
  try {
    const args = ["FT.SEARCH", indexName, query];
    if (limit) args.push("LIMIT", "0", String(limit));
    const result = await redis.sendCommand(args);
    return { results: result };
  } catch {
    return { results: [] };
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const COMMAND_MAP = {
  getMonitoringData: handleGetMonitoringData,
  get_keys: handleGetKeys,
  listVectorIndexes: handleListVectorIndexes,
  getVectorIndexInfo: handleGetVectorIndexInfo,
  getPublicChannels: handleGetPublicChannels,
  getClusterInfo: handleGetClusterInfo,
  publishMessage: handlePublishMessage,
  searchIndex: handleSearchIndex,
  vectorSearch: handleVectorSearch,
  llm_generate_embedding: handleGenerateEmbedding,
};

async function handleVectorSearch(config, { indexName, queryVector, vectorField, topK, returnFields } = {}) {
  if (!indexName || !queryVector) return [];
  try {
    const k = topK || 5;
    const vectorBlob = Buffer.from(new Float64Array(queryVector).buffer).toString("base64");
    const args = [
      "FT.SEARCH", indexName,
      `(*)=>[KNN ${k} @${vectorField || "embedding"} $query_vec]`,
      "PARAMS", "2", "query_vec", vectorBlob,
      "DIALECT", "2",
      "RETURN", String((returnFields || []).length + 1), "__key", ...(returnFields || []),
      "SORTBY", "__score",
    ];
    const result = await redis.sendCommand(args);
    // result: [total, key1, [field1, val1, ...], key2, ...]
    if (!result || result.length < 2) return [];
    const results = [];
    for (let i = 1; i < result.length; i += 2) {
      const key = result[i];
      const fieldsArr = result[i + 1];
      const fields = {};
      if (Array.isArray(fieldsArr)) {
        for (let j = 0; j < fieldsArr.length; j += 2) {
          if (fieldsArr[j] !== "__key") fields[fieldsArr[j]] = fieldsArr[j + 1];
        }
      }
      const scoreField = fieldsArr;
      let score = 0;
      if (Array.isArray(scoreField)) {
        const idx = scoreField.indexOf("__score");
        if (idx >= 0 && scoreField[idx + 1] != null) score = parseFloat(scoreField[idx + 1]);
      }
      results.push({ key, score, fields });
    }
    return results;
  } catch (e) {
    console.warn("vectorSearch error:", e.message);
    return [];
  }
}

async function handleGenerateEmbedding(/* request */) {
  // Return a random 128-dim vector for screenshot purposes
  const dim = 128;
  const embedding = Array.from({ length: dim }, () => Math.random());
  return { embedding, model: "screenshot-mock" };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Add CORS headers to all responses
  const writeHead = res.writeHead.bind(res);
  res.writeHead = (statusCode, headers) => {
    return writeHead(statusCode, { ...CORS_HEADERS, ...headers });
  };

  if (req.method === "POST" && req.url === "/invoke") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { cmd, args = {} } = JSON.parse(body);
      const handler = COMMAND_MAP[cmd];
      if (handler) {
        const result = await handler(args.config, args);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } else {
        // Unknown command — return empty default
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([]));
      }
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = 4175;
await connect();
server.listen(PORT, () => {
  console.log(`Redis proxy listening on http://localhost:${PORT}/invoke`);
});
