import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getKeys, setString, getString } from "../lib/api";
import { mockKeyInfos, mockConnectionConfig, performanceTestScenarios } from "./mocks/mockData";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Large Dataset Operations", () => {
    it("should handle 100 keys efficiently", async () => {
      const config = mockConnectionConfig();
      const keys = mockKeyInfos(100);
      (invoke as any).mockResolvedValue(keys);

      const startTime = performance.now();
      const result = await getKeys(config, "*", 100);
      const endTime = performance.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("should handle 1000 keys efficiently", async () => {
      const config = mockConnectionConfig();
      const keys = mockKeyInfos(1000);
      (invoke as any).mockResolvedValue(keys);

      const startTime = performance.now();
      const result = await getKeys(config, "*", 1000);
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("should handle 10000 keys efficiently", async () => {
      const config = mockConnectionConfig();
      const keys = mockKeyInfos(10000);
      (invoke as any).mockResolvedValue(keys);

      const startTime = performance.now();
      const result = await getKeys(config, "*", 10000);
      const endTime = performance.now();

      expect(result).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe("String Value Performance", () => {
    it("should handle small strings efficiently", async () => {
      const config = mockConnectionConfig();
      const value = "small value";
      (invoke as any).mockResolvedValue(true);

      const startTime = performance.now();
      await setString(config, "test-key", value);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should handle large strings efficiently", async () => {
      const config = mockConnectionConfig();
      const largeValue = "a".repeat(10000);
      (invoke as any).mockResolvedValue(true);

      const startTime = performance.now();
      await setString(config, "test-key", largeValue);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("should handle JSON strings efficiently", async () => {
      const config = mockConnectionConfig();
      const jsonValue = JSON.stringify({ a: 1, b: { c: [1, 2, 3] } });
      (invoke as any).mockResolvedValue(true);

      const startTime = performance.now();
      await setString(config, "test-key", jsonValue);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Batch Operations", () => {
    it("should handle multiple sequential operations efficiently", async () => {
      const config = mockConnectionConfig();
      (invoke as any).mockResolvedValue(true);

      const startTime = performance.now();
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(setString(config, `key:${i}`, `value:${i}`));
      }
      await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should handle parallel operations efficiently", async () => {
      const config = mockConnectionConfig();
      (invoke as any).mockResolvedValue(true);

      const startTime = performance.now();
      const promises = Array.from({ length: 50 }, (_, i) =>
        setString(config, `parallel-key:${i}`, `value:${i}`)
      );
      await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe("Memory Usage", () => {
    it("should not leak memory on repeated operations", async () => {
      const config = mockConnectionConfig();
      (invoke as any).mockResolvedValue("value");

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 1000; i++) {
        await getString(config, `key:${i}`);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Response Time Benchmarks", () => {
    it("should meet performance targets for different operations", async () => {
      const config = mockConnectionConfig();
      const targets = {
        getKeys: 100,
        getString: 50,
        setString: 50,
      };

      const benchmarks: Record<string, number> = {};

      (invoke as any).mockResolvedValue("value");
      const start = performance.now();
      await getString(config, "test-key");
      benchmarks.getString = performance.now() - start;

      (invoke as any).mockResolvedValue([mockKeyInfos(100)]);
      const startKeys = performance.now();
      await getKeys(config, "*", 100);
      benchmarks.getKeys = performance.now() - startKeys;

      (invoke as any).mockResolvedValue(true);
      const startSet = performance.now();
      await setString(config, "test-key", "value");
      benchmarks.setString = performance.now() - startSet;

      for (const [operation, time] of Object.entries(benchmarks)) {
        expect(time).toBeLessThan((targets as any)[operation]);
      }
    });
  });

  describe("Performance Test Scenarios", () => {
    Object.entries(performanceTestScenarios).forEach(([name, scenario]) => {
      it(`should complete ${scenario.description}`, async () => {
        const config = mockConnectionConfig();
        const keys = mockKeyInfos((scenario as any).keyCount);
        (invoke as any).mockResolvedValue(keys);

        const startTime = performance.now();
        const result = await getKeys(config, "*", (scenario as any).keyCount);
        const endTime = performance.now();

        expect(result).toHaveLength((scenario as any).keyCount);

        const timeLimit =
          {
            smallDataset: 100,
            mediumDataset: 500,
            largeDataset: 2000,
            hugeDataset: 5000,
          }[name] || 1000;

        expect(endTime - startTime).toBeLessThan(timeLimit);
      });
    });
  });
});
