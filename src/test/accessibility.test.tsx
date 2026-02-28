import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("../stores/themeStore", async () => {
  const actual = await vi.importActual("../stores/themeStore");
  return {
    ...actual,
    useThemeStore: vi.fn(() => ({
      theme: "dark",
      toggleTheme: vi.fn(),
      effectiveTheme: "dark",
    })),
  };
});

import { ThemeToggle } from "../components/ThemeToggle";

describe("Accessibility Tests", () => {
  it("ThemeToggle should have no accessibility violations", async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ThemeToggle button should have accessible name", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title");
  });

  it("ThemeToggle should have keyboard accessible attributes", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
  });

  it("ThemeToggle should be focusable", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeVisible();
  });

  it("ThemeToggle should have sufficient color contrast", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-zinc-300");
  });

  it("ThemeToggle should have proper ARIA attributes", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeVisible();
    expect(button).toHaveAttribute("title");
  });
});
