import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEfficientUpdates } from "../hooks/useEfficientUpdates";

describe("useEfficientUpdates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with initial data and loading state", () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 2000, 5));

    expect(result.current[0]).toBe(0);
    expect(result.current[1]).toBe(true);
  });

  it("should update data on initial mount", async () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 2000, 5));

    expect(result.current[1]).toBe(true);

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(100);
    expect(result.current[1]).toBe(false);
  });

  it("should not update when change is below threshold", async () => {
    const updateFn = vi.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(102);

    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(100);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe(100);
  });

  it("should update when change exceeds threshold", async () => {
    const updateFn = vi.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(110);

    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(100);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe(110);
  });

  it("should set loading state correctly during updates", async () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    expect(result.current[1]).toBe(true);

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[1]).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[1]).toBe(false);
  });

  it("should handle object data with threshold", async () => {
    const updateFn = vi
      .fn()
      .mockResolvedValueOnce({ count: 100, memory: 50 })
      .mockResolvedValueOnce({ count: 106, memory: 52 })
      .mockResolvedValueOnce({ count: 110, memory: 53 });

    const { result } = renderHook(() =>
      useEfficientUpdates({ count: 0, memory: 0 }, updateFn, 1000, 5)
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toEqual({ count: 100, memory: 50 });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toEqual({ count: 106, memory: 52 });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await updateFn.mock.results[2].value;
    });

    expect(result.current[0]).toEqual({ count: 106, memory: 52 });
  });

  it("should not update object when numeric changes are below threshold", async () => {
    const updateFn = vi
      .fn()
      .mockResolvedValueOnce({ count: 100, memory: 50 })
      .mockResolvedValueOnce({ count: 103, memory: 51 });

    const { result } = renderHook(() =>
      useEfficientUpdates({ count: 0, memory: 0 }, updateFn, 1000, 5)
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toEqual({ count: 100, memory: 50 });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toEqual({ count: 100, memory: 50 });
  });

  it("should update object with mixed numeric and non-numeric properties", async () => {
    const updateFn = vi
      .fn()
      .mockResolvedValueOnce({ count: 100, name: "test" })
      .mockResolvedValueOnce({ count: 110, name: "updated" });

    const { result } = renderHook(() =>
      useEfficientUpdates({ count: 0, name: "initial" }, updateFn, 1000, 5)
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toEqual({ count: 100, name: "test" });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toEqual({ count: 110, name: "updated" });
  });

  it("should handle zero value correctly", async () => {
    const updateFn = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(6);

    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe(6);
  });

  it("should provide refresh function", async () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(updateFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current[2]();
    });

    expect(updateFn).toHaveBeenCalledTimes(2);
    expect(result.current[0]).toBe(100);
  });

  it("should handle update errors gracefully", async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error("Update failed"));
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    try {
      await updateFn.mock.results[0].value;
    } catch {
      // Expected error for testing purposes
    }

    expect(console.error).toHaveBeenCalled();
    expect(result.current[1]).toBe(false);
    expect(result.current[0]).toBe(0);
  });

  it("should update for non-numeric types", async () => {
    const updateFn = vi.fn().mockResolvedValueOnce("initial").mockResolvedValueOnce("updated");

    const { result } = renderHook(() => useEfficientUpdates("test", updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe("initial");

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe("updated");
  });

  it("should not update for same string value", async () => {
    const updateFn = vi.fn().mockResolvedValue("same");

    const { result } = renderHook(() => useEfficientUpdates("test", updateFn, 1000, 5));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe("same");

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe("same");
  });

  it("should use default interval of 2000ms", async () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { result } = renderHook(() => useEfficientUpdates(0, updateFn));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(100);

    await act(async () => {
      vi.advanceTimersByTime(1999);
    });

    expect(updateFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await updateFn.mock.results[1].value;
    });

    expect(updateFn).toHaveBeenCalledTimes(2);
  });

  it("should use default threshold of 5 percent", async () => {
    const updateFn = vi.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(104);

    const { result } = renderHook(() => useEfficientUpdates(0, updateFn, 1000));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
    });

    await act(async () => {
      await updateFn.mock.results[0].value;
    });

    expect(result.current[0]).toBe(100);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await updateFn.mock.results[1].value;
    });

    expect(result.current[0]).toBe(100);
  });

  it("should cleanup interval on unmount", () => {
    const updateFn = vi.fn().mockResolvedValue(100);
    const { unmount } = renderHook(() => useEfficientUpdates(0, updateFn, 1000, 5));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(updateFn).toHaveBeenCalledTimes(1);
  });
});
