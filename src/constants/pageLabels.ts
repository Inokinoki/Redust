import type { PageId } from "../stores/dashboardStore";

export const PAGE_LABELS: Record<PageId, string> = {
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

export function getPageLabel(pageId: PageId): string {
  return PAGE_LABELS[pageId];
}
