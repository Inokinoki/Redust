import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../../components/ThemeToggle";

// Mock theme store
const mockToggleTheme = vi.fn();

vi.mock("../../stores/themeStore", () => ({
  useThemeStore: () => ({
    theme: "dark",
    toggleTheme: mockToggleTheme,
  }),
}));

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark", "light");
  });

  it("should import without errors", () => {
    expect(ThemeToggle).toBeDefined();
    expect(typeof ThemeToggle).toBe("function");
  });

  it("should render theme toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should call toggleTheme when button is clicked", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("should apply correct styling classes", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "rounded-md",
      "border",
      "px-3",
      "py-2"
    );
  });
});
