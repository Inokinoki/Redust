/**
 * Seeds a Redis vector index with real semantic embeddings.
 * Uses Xenova/all-MiniLM-L6-v2 (384-dim) via @huggingface/transformers.
 */
import { createClient } from "redis";
import { embed, EMBEDDING_DIM } from "./embed.mjs";

const INDEX_NAME = "redust-docs-idx";
const PREFIX = "redust:doc:";

const docs = [
  { title: "Getting Started with Redis", content: "Redis is an in-memory data structure store used as a database, cache, and message broker. It supports various data structures such as strings, hashes, lists, sets, and sorted sets." },
  { title: "Vector Search in Redis", content: "Redis Stack includes vector similarity search capabilities for building AI-powered applications. Use FT.SEARCH with KNN to find semantically similar documents." },
  { title: "Indexing Strategies", content: "Choose the right indexing strategy based on your data patterns and query requirements. Redis supports hash-based and JSON-based indexing with multiple field types." },
  { title: "Caching Best Practices", content: "Implement effective caching strategies to improve application performance and reduce latency. Redis TTL and eviction policies help manage memory usage." },
  { title: "Redis Pub/Sub Guide", content: "Use Redis pub/sub for real-time messaging between application components. Publishers send messages to channels and subscribers receive them in real-time." },
];

async function main() {
  console.log("Generating embeddings...");
  const embeddings = [];
  for (const doc of docs) {
    const vec = await embed(`${doc.title}: ${doc.content}`);
    embeddings.push(vec);
    console.log(`  Embedded: ${doc.title} (${vec.length}d)`);
  }

  console.log("Connecting to Redis...");
  const redis = createClient({ url: "redis://localhost:6379" });
  redis.on("error", (err) => console.error("Redis error:", err.message));
  await redis.connect();

  try {
    // Drop existing index
    try { await redis.sendCommand(["FT.DROPINDEX", INDEX_NAME]); } catch { /* ok */ }

    // Delete existing keys
    const keys = await redis.keys(`${PREFIX}*`);
    if (keys.length > 0) await redis.del(keys);

    // Create index
    await redis.sendCommand([
      "FT.CREATE", INDEX_NAME,
      "ON", "HASH",
      "PREFIX", "1", PREFIX,
      "SCHEMA",
      "title", "TEXT",
      "content", "TEXT",
      "text", "TEXT",
      "embedding", "VECTOR", "FLAT", "6",
      "TYPE", "FLOAT64",
      "DIM", String(EMBEDDING_DIM),
      "DISTANCE_METRIC", "COSINE",
    ]);
    console.log(`Created index ${INDEX_NAME} (${EMBEDDING_DIM}d COSINE)`);

    // Seed documents
    for (let i = 0; i < docs.length; i++) {
      await redis.hSet(`${PREFIX}${i + 1}`, {
        title: docs[i].title,
        content: docs[i].content,
        text: docs[i].content,
        embedding: Buffer.from(new Float64Array(embeddings[i]).buffer),
      });
    }
    console.log(`Seeded ${docs.length} documents`);
  } finally {
    await redis.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
