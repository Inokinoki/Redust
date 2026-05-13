import { useThemeStore } from "../stores/themeStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  const themes = [
    { value: "dark" as const, label: "Dark", icon: "🌙" },
    { value: "light" as const, label: "Light", icon: "☀️" },
    { value: "system" as const, label: "System", icon: "💻" },
  ];

  const currentTheme = themes.find((t) => t.value === theme);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
      title={`Current theme: ${currentTheme?.label}`}
    >
      <span>{currentTheme?.icon}</span>
      <span className="hidden sm:inline">{currentTheme?.label}</span>
    </button>
  );
}
