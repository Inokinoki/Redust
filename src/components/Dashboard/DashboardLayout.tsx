import { ReactNode, useCallback } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Sidebar } from "./Sidebar";
import { MetricsBar } from "./MetricsBar";
import { BottomPanelGroup, RightPanelGroup } from "./BottomPanelGroup";
import { useDashboardStore } from "../../stores/dashboardStore";

interface DashboardLayoutProps {
  children: ReactNode;
}

const PANEL_LAYOUT_STORAGE_KEY = "redust-panel-layout";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useDashboardStore();

  // Load saved layout from localStorage
  const loadLayout = useCallback(() => {
    try {
      const saved = localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load panel layout:", e);
    }
    return undefined;
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((layout: { [key: string]: number }) => {
    try {
      localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error("Failed to save panel layout:", e);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col">
      {/* Main horizontal layout: Left Sidebar | Main Content | Right Panels */}
      <Group
        orientation="horizontal"
        className="flex-1 overflow-hidden"
        id="dashboard-layout"
        onLayoutChange={saveLayout}
      >
        {/* Left Sidebar */}
        <Panel
          id="left-sidebar"
          defaultSize={loadLayout()?.["left-sidebar"] || 15}
          minSize={10}
          collapsible={true}
          className={`${leftSidebarCollapsed ? "w-12" : ""}`}
        >
          <Sidebar collapsed={leftSidebarCollapsed} onToggle={toggleLeftSidebar} />
        </Panel>

        <Separator className="w-1 bg-zinc-200 transition-colors hover:bg-red-600 dark:bg-zinc-800" />

        {/* Main Content Area (Key Browser) */}
        <Panel id="main-content" defaultSize={loadLayout()?.["main-content"] || 65} minSize={40} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">{children}</div>

          {/* Bottom Panels with tabs */}
          <BottomPanelGroup />
        </Panel>

        <Separator className="w-1 bg-zinc-200 transition-colors hover:bg-red-600 dark:bg-zinc-800" />

        {/* Right Sidebar - Metrics + Panels */}
        <Panel
          id="right-sidebar"
          defaultSize={loadLayout()?.["right-sidebar"] || 20}
          minSize={15}
          collapsible={true}
          className="flex flex-col overflow-hidden"
        >
          <MetricsBar collapsed={rightSidebarCollapsed} onToggle={toggleRightSidebar} />
          <RightPanelGroup />
        </Panel>
      </Group>
    </div>
  );
}
