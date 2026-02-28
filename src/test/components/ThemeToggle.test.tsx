import { describe, it, expect } from "vitest";
import { ThemeToggle } from "../../components/ThemeToggle";

describe("ThemeToggle Component - Basic", () => {
  it("should import without errors", () => {
    expect(ThemeToggle).toBeDefined();
    expect(typeof ThemeToggle).toBe("function");
  });
});
