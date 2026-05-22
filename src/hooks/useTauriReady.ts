import { useState, useEffect } from "react";

// Lazy-load Tauri API with fallback for browser/dev environments
let appWindow: {
  isMaximized: () => Promise<boolean>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  close: () => Promise<void>;
  onFocusChanged: (cb: (e: { payload: boolean }) => void) => Promise<() => void>;
} | null = null;
let isTauriReady = false;
let tauriReadyListeners: Array<() => void> = [];

// Init asynchronously — avoids top-level await which breaks esbuild
import("@tauri-apps/api/window")
  .then(({ getCurrentWindow }) => {
    appWindow = getCurrentWindow();
    isTauriReady = true;
    tauriReadyListeners.forEach((fn) => fn());
    tauriReadyListeners = [];
  })
  .catch(() => {
    // Not running in Tauri — window controls will be hidden
    isTauriReady = true;
    tauriReadyListeners.forEach((fn) => fn());
    tauriReadyListeners = [];
  });

export function useTauriReady() {
  const [ready, setReady] = useState(isTauriReady);

  useEffect(() => {
    if (isTauriReady) return;
    const listener = () => setReady(true);
    tauriReadyListeners.push(listener);
    return () => {
      const idx = tauriReadyListeners.indexOf(listener);
      if (idx !== -1) tauriReadyListeners.splice(idx, 1);
    };
  }, []);

  return ready;
}

export { appWindow };
