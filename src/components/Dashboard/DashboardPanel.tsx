import { ReactNode } from "react";
import { Button } from "../ui/button";

interface DashboardPanelProps {
  children: ReactNode;
  title: string;
  visible: boolean;
  collapsed?: boolean;
  position?: "left" | "right" | "bottom";
  onClose?: () => void;
  onToggleCollapse?: () => void;
  headerActions?: ReactNode;
  className?: string;
}

export function DashboardPanel({
  children,
  title,
  visible,
  collapsed = false,
  position = "right",
  onClose,
  onToggleCollapse,
  headerActions,
  className = "",
}: DashboardPanelProps) {
  if (!visible) return null;

  const isBottom = position === "bottom";

  return (
    <div
      className={`flex flex-col border-l border-zinc-800 bg-zinc-950 ${className} ${
        isBottom ? "border-t border-l-0" : ""
      }`}
    >
      {/* Panel Header */}
      <div className="flex h-12 min-h-[3rem] items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
            >
              {collapsed ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!collapsed && (
        <div className={`flex-1 overflow-auto ${isBottom ? "" : "h-[calc(100%-3rem)]"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
