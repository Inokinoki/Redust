import { describe, it, expect, beforeEach } from "vitest";
import { useSplitPaneStore } from "../stores/splitPaneStore";

describe("SplitPaneStore", () => {
  beforeEach(() => {
    useSplitPaneStore.setState({
      splitMode: "none",
      leftKey: null,
      rightKey: null,
    });
  });

  it("should initialize with none split mode", () => {
    const state = useSplitPaneStore.getState();
    expect(state.splitMode).toBe("none");
  });

  it("should initialize with null keys", () => {
    const state = useSplitPaneStore.getState();
    expect(state.leftKey).toBeNull();
    expect(state.rightKey).toBeNull();
  });

  it("should set horizontal split mode", () => {
    useSplitPaneStore.getState().setSplitMode("horizontal");
    const state = useSplitPaneStore.getState();
    expect(state.splitMode).toBe("horizontal");
  });

  it("should set vertical split mode", () => {
    useSplitPaneStore.getState().setSplitMode("vertical");
    const state = useSplitPaneStore.getState();
    expect(state.splitMode).toBe("vertical");
  });

  it("should set none split mode", () => {
    useSplitPaneStore.getState().setSplitMode("horizontal");
    useSplitPaneStore.getState().setSplitMode("none");
    const state = useSplitPaneStore.getState();
    expect(state.splitMode).toBe("none");
  });

  it("should set left key", () => {
    const leftKey = { key: "user:1", type: "hash" };
    useSplitPaneStore.getState().setLeftKey(leftKey);
    const state = useSplitPaneStore.getState();
    expect(state.leftKey).toEqual(leftKey);
  });

  it("should set right key", () => {
    const rightKey = { key: "user:2", type: "string" };
    useSplitPaneStore.getState().setRightKey(rightKey);
    const state = useSplitPaneStore.getState();
    expect(state.rightKey).toEqual(rightKey);
  });

  it("should set both left and right keys", () => {
    const leftKey = { key: "user:1", type: "hash" };
    const rightKey = { key: "user:2", type: "string" };
    useSplitPaneStore.getState().setLeftKey(leftKey);
    useSplitPaneStore.getState().setRightKey(rightKey);
    const state = useSplitPaneStore.getState();
    expect(state.leftKey).toEqual(leftKey);
    expect(state.rightKey).toEqual(rightKey);
  });

  it("should reset split state", () => {
    useSplitPaneStore.getState().setSplitMode("horizontal");
    useSplitPaneStore.getState().setLeftKey({ key: "user:1", type: "hash" });
    useSplitPaneStore.getState().setRightKey({ key: "user:2", type: "string" });

    useSplitPaneStore.getState().resetSplit();

    const state = useSplitPaneStore.getState();
    expect(state.splitMode).toBe("none");
    expect(state.leftKey).toBeNull();
    expect(state.rightKey).toBeNull();
  });

  it("should clear left key by setting to null", () => {
    useSplitPaneStore.getState().setLeftKey({ key: "user:1", type: "hash" });
    useSplitPaneStore.getState().setLeftKey(null);
    const state = useSplitPaneStore.getState();
    expect(state.leftKey).toBeNull();
  });

  it("should clear right key by setting to null", () => {
    useSplitPaneStore.getState().setRightKey({ key: "user:1", type: "hash" });
    useSplitPaneStore.getState().setRightKey(null);
    const state = useSplitPaneStore.getState();
    expect(state.rightKey).toBeNull();
  });

  it("should update left key", () => {
    useSplitPaneStore.getState().setLeftKey({ key: "user:1", type: "hash" });
    useSplitPaneStore.getState().setLeftKey({ key: "user:2", type: "string" });
    const state = useSplitPaneStore.getState();
    expect(state.leftKey).toEqual({ key: "user:2", type: "string" });
  });

  it("should update right key", () => {
    useSplitPaneStore.getState().setRightKey({ key: "user:1", type: "hash" });
    useSplitPaneStore.getState().setRightKey({ key: "user:2", type: "string" });
    const state = useSplitPaneStore.getState();
    expect(state.rightKey).toEqual({ key: "user:2", type: "string" });
  });
});
