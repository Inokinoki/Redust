import { useState, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import ThemeToggle from "./ThemeToggle";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    // Check if window is maximized
    appWindow.isMaximized().then(setMaximized);

    // Listen to focus changes
    const unlistenFocus = appWindow.onFocusChanged(({ payload: focused }) => {
      setIsFocused(focused);
    });

    return () => {
      unlistenFocus.then(fn => fn());
    };
  }, []);

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    if (maximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
    setMaximized(!maximized);
  };

  const handleClose = () => {
    appWindow.close();
  };

  // Platform-specific styles
  const isMac = navigator.userAgent.includes("Mac");

  return (
    <div
      className={`flex items-center justify-between select-none ${
        isMac ? "h-7 bg-zinc-100 dark:bg-zinc-900" : "h-8 bg-zinc-200 dark:bg-zinc-800"
      } ${isFocused ? "" : "opacity-80"}`}
      data-tauri-drag-region
    >
      {/* Left: App icon and title */}
      <div className="flex items-center gap-2 px-3">
        <div className={`font-semibold ${isMac ? "text-zinc-700 dark:text-zinc-300 text-xs" : "text-zinc-900 dark:text-zinc-100 text-sm"}`}>
          Redust
        </div>
        {!isMac && <span className="text-xs text-zinc-500">v0.1.0</span>}
      </div>

      {/* Center: Empty (title area on macOS) */}
      <div className="flex-1" />

      {/* Right: Controls */}
      <div className="flex items-center gap-2 px-2">
        <ThemeToggle />

        {!isMac && (
          <>
            {/* Window controls for Windows/Linux */}
            <button
              onClick={handleMinimize}
              className="h-6 w-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded transition-colors"
              title="Minimize"
            >
              <svg width="10" height="1" viewBox="0 0 10 1" className="fill-current text-zinc-600 dark:text-zinc-400">
                <rect width="10" height="1" />
              </svg>
            </button>

            <button
              onClick={handleMaximize}
              className="h-6 w-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded transition-colors"
              title={maximized ? "Restore" : "Maximize"}
            >
              {maximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current text-zinc-600 dark:text-zinc-400">
                  <rect x="2" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current text-zinc-600 dark:text-zinc-400">
                  <rect width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none"/>
                </svg>
              )}
            </button>

            <button
              onClick={handleClose}
              className="h-6 w-6 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
              title="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current text-zinc-600 dark:text-zinc-400">
                <path d="M0 0L10 10M10 0L0 10" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
