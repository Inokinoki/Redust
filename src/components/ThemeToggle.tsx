import { useThemeStore } from "../stores/themeStore";

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  const themes = [
    { value: "dark" as const, label: "Dark", icon: "🌙" },
    { value: "light" as const, label: "Light", icon: "☀️" },
    { value: "system" as const, label: "System", icon: "💻" },
  ];

  const currentTheme = themes.find((t) => t.value === theme);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
      title={`Current theme: ${currentTheme?.label}`}
    >
      <span>{currentTheme?.icon}</span>
      <span className="hidden sm:inline">{currentTheme?.label}</span>
    </button>
  );
}
