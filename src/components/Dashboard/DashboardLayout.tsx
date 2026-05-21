import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useDashboardStore } from "../../stores/dashboardStore";
import { useTabStore, type PageId } from "../../stores/tabStore";
import { MonitoringDashboard } from "../MonitoringDashboard";
import { VectorSearch } from "../VectorSearch";
import { EmbeddingCache } from "../EmbeddingCache";
import { QueryOptimizer } from "../QueryOptimizer";
import { PubSubMonitor } from "../PubSubMonitor";
import { ClusterTopology } from "../ClusterTopology";
import { ClusterVisualization } from "../ClusterVisualization";
import { LLMConversation } from "../LLMConversation";

interface DashboardLayoutProps {
  children: ReactNode;
  onAddConnection?: () => void;
}

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard":
      return null; // rendered as children
    case "vectorSearch":
      return <VectorSearch variant="page" />;
    case "embeddingCache":
      return <EmbeddingCache variant="page" />;
    case "clusterVis":
      return <ClusterVisualization variant="page" />;
    case "llmChat":
      return <LLMConversation variant="page" />;
    case "queryOptimizer":
      return <QueryOptimizer variant="page" />;
    case "monitoring":
      return <MonitoringDashboard variant="page" />;
    case "cluster":
      return <ClusterTopology variant="page" />;
    case "pubsub":
      return <PubSubMonitor variant="page" />;
    default:
      return null;
  }
}

export function DashboardLayout({ children, onAddConnection }: DashboardLayoutProps) {
  const { leftSidebarCollapsed, toggleLeftSidebar } = useDashboardStore();
  const activeTab = useTabStore((s) => s.getActiveTab());

  const currentPage = activeTab?.pageId || "dashboard";

  return (
    <div className="flex h-[calc(100vh-2.25rem)] w-full">
      {/* Left Sidebar: connection list + page index */}
      <Sidebar
        collapsed={leftSidebarCollapsed}
        onToggle={toggleLeftSidebar}
        onAddConnection={onAddConnection}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {currentPage === "dashboard" ? (
          <div className="p-6">{children}</div>
        ) : (
          <PageContent page={currentPage} />
        )}
      </div>
    </div>
  );
}
