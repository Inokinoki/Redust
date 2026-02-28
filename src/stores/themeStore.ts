import { create } from "zustand";

export type Theme = "dark" | "light" | "system";

interface ThemeStore {
  theme: Theme;
  effectiveTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: (localStorage.getItem("redust-theme") as Theme) || "dark",
  effectiveTheme: "dark",
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("redust-theme", theme);

    // Determine effective theme
    const effective =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    set({ effectiveTheme: effective as "dark" | "light" });

    // Apply theme to document
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(effective);
  },
  toggleTheme: () => {
    const state = get();
    const themes: Theme[] = ["dark", "light", "system"];
    const currentIndex = themes.indexOf(state.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    get().setTheme(nextTheme);
  },
}));

// Initialize theme on load
if (typeof window !== "undefined") {
  const theme = (localStorage.getItem("redust-theme") as Theme) || "dark";
  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.add(effective);
  useThemeStore.setState({
    theme,
    effectiveTheme: effective as "dark" | "light",
  });

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (useThemeStore.getState().theme === "system") {
      const effective = e.matches ? "dark" : "light";
      useThemeStore.setState({ effectiveTheme: effective });
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(effective);
    }
  });
}
