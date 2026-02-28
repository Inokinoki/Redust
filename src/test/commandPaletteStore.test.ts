import { describe, it, expect, beforeEach } from "vitest";
import { useCommandPalette } from "../stores/commandPaletteStore";

describe("CommandPaletteStore", () => {
  beforeEach(() => {
    useCommandPalette.setState({
      isOpen: false,
    });
  });

  it("should initialize with closed state", () => {
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(false);
  });

  it("should open command palette", () => {
    useCommandPalette.getState().open();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(true);
  });

  it("should open command palette when already closed", () => {
    useCommandPalette.getState().open();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(true);
  });

  it("should close command palette", () => {
    useCommandPalette.getState().open();
    useCommandPalette.getState().close();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(false);
  });

  it("should toggle command palette from closed to open", () => {
    useCommandPalette.getState().toggle();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(true);
  });

  it("should toggle command palette from open to closed", () => {
    useCommandPalette.getState().open();
    useCommandPalette.getState().toggle();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(false);
  });

  it("should handle multiple toggles correctly", () => {
    useCommandPalette.getState().toggle();
    expect(useCommandPalette.getState().isOpen).toBe(true);

    useCommandPalette.getState().toggle();
    expect(useCommandPalette.getState().isOpen).toBe(false);

    useCommandPalette.getState().toggle();
    expect(useCommandPalette.getState().isOpen).toBe(true);
  });

  it("should stay open when open is called multiple times", () => {
    useCommandPalette.getState().open();
    useCommandPalette.getState().open();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(true);
  });

  it("should stay closed when close is called multiple times", () => {
    useCommandPalette.getState().open();
    useCommandPalette.getState().close();
    useCommandPalette.getState().close();
    const state = useCommandPalette.getState();
    expect(state.isOpen).toBe(false);
  });

  it("should reset to closed state via close after being opened", () => {
    useCommandPalette.getState().open();
    expect(useCommandPalette.getState().isOpen).toBe(true);

    useCommandPalette.getState().close();
    expect(useCommandPalette.getState().isOpen).toBe(false);
  });
});
