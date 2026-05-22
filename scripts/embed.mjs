/**
 * Local embedding helper using @huggingface/transformers.
 * Uses all-MiniLM-L6-v2 (384-dim, ~28MB) for fast semantic embeddings.
 */
import { pipeline } from "@huggingface/transformers";

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
    });
  }
  return embedder;
}

export async function embed(text) {
  const pipe = await getEmbedder();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export const EMBEDDING_DIM = 384;

// CLI mode: embed text passed as argument
if (process.argv[1] && process.argv[1].endsWith("embed.mjs") && process.argv[2]) {
  const text = process.argv.slice(2).join(" ");
  const vec = await embed(text);
  console.log(JSON.stringify(vec));
}
