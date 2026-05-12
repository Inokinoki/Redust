import { useState } from "react";
import { Button } from "../ui/button";
import { useDashboardStore } from "../../stores/dashboardStore";
import { MonitoringDashboard } from "../MonitoringDashboard";
import { VectorSearch } from "../VectorSearch";
import { EmbeddingCache } from "../EmbeddingCache";
import { QueryOptimizer } from "../QueryOptimizer";
import { PubSubMonitor } from "../PubSubMonitor";
import { ClusterTopology } from "../ClusterTopology";
import { ClusterVisualization } from "../ClusterVisualization";
import { LLMConversation } from "../LLMConversation";

interface BottomPanelTab {
  id: string;
  label: string;
  icon: string;
  panelId: string;
}

const BOTTOM_PANEL_TABS: BottomPanelTab[] = [
  { id: "monitoring", label: "Monitoring", icon: "📊", panelId: "monitoring" },
  { id: "vectorSearch", label: "Vector Search", icon: "🔍", panelId: "vectorSearch" },
  { id: "embeddingCache", label: "Embedding Cache", icon: "📦", panelId: "embeddingCache" },
  { id: "queryOptimizer", label: "Query Optimizer", icon: "⚡", panelId: "queryOptimizer" },
];

interface RightPanelTab {
  id: string;
  label: string;
  icon: string;
  panelId: string;
}

const RIGHT_PANEL_TABS: RightPanelTab[] = [
  { id: "pubsub", label: "Pub/Sub", icon: "📡", panelId: "pubsub" },
  { id: "cluster", label: "Cluster", icon: "🔗", panelId: "cluster" },
  { id: "clusterVis", label: "Clusters", icon: "🎯", panelId: "clusterVis" },
  { id: "llmChat", label: "AI Chat", icon: "🤖", panelId: "llmChat" },
];

export function BottomPanelGroup() {
  const [activeTab, setActiveTab] = useState<string>("monitoring");
  const { panels, setPanelVisible, togglePanelCollapse } = useDashboardStore();

  // Check if any bottom panel is visible
  const visiblePanels = BOTTOM_PANEL_TABS.filter(
    (tab) => panels[tab.panelId]?.visible
  );

  if (visiblePanels.length === 0) {
    return null;
  }

  // If active tab is not visible, switch to first visible tab
  const isActiveVisible = visiblePanels.some((tab) => tab.id === activeTab);
  const effectiveTab = isActiveVisible ? activeTab : visiblePanels[0]?.id;

  const handleClose = () => {
    setPanelVisible(effectiveTab, false);
  };

  const handleToggleCollapse = () => {
    togglePanelCollapse(effectiveTab);
  };

  const activePanel = panels[effectiveTab];

  // Render the content for the active panel
  const renderPanelContent = () => {
    switch (effectiveTab) {
      case "monitoring":
        return <MonitoringDashboard variant="panel" isOpen={activePanel?.visible} />;
      case "vectorSearch":
        return <VectorSearch variant="panel" isOpen={activePanel?.visible} />;
      case "embeddingCache":
        return <EmbeddingCache variant="panel" isOpen={activePanel?.visible} />;
      case "queryOptimizer":
        return <QueryOptimizer variant="panel" isOpen={activePanel?.visible} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-2">
          <div className="flex">
            {BOTTOM_PANEL_TABS.map((tab) => {
              const isVisible = panels[tab.panelId]?.visible;
              const isActive = effectiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (!isVisible) {
                      setPanelVisible(tab.panelId, true);
                    }
                  }}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                    isActive && isVisible
                      ? "border-red-500 text-zinc-200"
                      : isVisible
                      ? "border-transparent text-zinc-300 hover:text-zinc-200"
                      : "border-transparent text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCollapse}
              className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
            >
              {activePanel?.collapsed ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        {!activePanel?.collapsed && (
          <div className="flex-1 overflow-auto">{renderPanelContent()}</div>
        )}
      </div>
  );
}

export function RightPanelGroup() {
  const [activeTab, setActiveTab] = useState<string>("pubsub");
  const { panels, setPanelVisible, togglePanelCollapse } = useDashboardStore();

  // Check if any right panel is visible
  const visiblePanels = RIGHT_PANEL_TABS.filter(
    (tab) => panels[tab.panelId]?.visible
  );

  if (visiblePanels.length === 0) {
    return null;
  }

  // If active tab is not visible, switch to first visible tab
  const isActiveVisible = visiblePanels.some((tab) => tab.id === activeTab);
  const effectiveTab = isActiveVisible ? activeTab : visiblePanels[0]?.id;

  const handleClose = () => {
    setPanelVisible(effectiveTab, false);
  };

  const handleToggleCollapse = () => {
    togglePanelCollapse(effectiveTab);
  };

  const activePanel = panels[effectiveTab];

  // Render the content for the active panel
  const renderPanelContent = () => {
    switch (effectiveTab) {
      case "pubsub":
        return <PubSubMonitor variant="panel" isOpen={activePanel?.visible} />;
      case "cluster":
        return <ClusterTopology variant="panel" isOpen={activePanel?.visible} />;
      case "clusterVis":
        return <ClusterVisualization variant="panel" isOpen={activePanel?.visible} />;
      case "llmChat":
        return <LLMConversation variant="panel" isOpen={activePanel?.visible} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-t border-zinc-800">
      {/* Tab Bar - vertical for right panel */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-2">
        {RIGHT_PANEL_TABS.map((tab) => {
          const isVisible = panels[tab.panelId]?.visible;
          const isActive = effectiveTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (!isVisible) {
                  setPanelVisible(tab.panelId, true);
                }
              }}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive && isVisible
                  ? "border-red-500 text-zinc-200"
                  : isVisible
                  ? "border-transparent text-zinc-300 hover:text-zinc-200"
                  : "border-transparent text-zinc-500 hover:text-zinc-400"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden lg:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Header with actions */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="text-sm font-medium text-zinc-200">
          {RIGHT_PANEL_TABS.find((t) => t.id === effectiveTab)?.label}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="h-6 px-2 text-zinc-400 hover:text-zinc-200"
          >
            {activePanel?.collapsed ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      {!activePanel?.collapsed && (
        <div className="flex-1 overflow-auto">{renderPanelContent()}</div>
      )}
    </div>
  );
}
