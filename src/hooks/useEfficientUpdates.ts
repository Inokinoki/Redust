/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";

export function useEfficientUpdates<T>(
  initialData: T,
  updateFn: () => Promise<T>,
  interval: number = 2000,
  thresholdPercent: number = 5
): [T, boolean, () => void] {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const previousDataRef = useRef<T>(initialData);
  const intervalRef = useRef<number | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newData = await updateFn();
      const hasSignificantChange = hasSignificantDifference(
        previousDataRef.current,
        newData,
        thresholdPercent
      );

      if (hasSignificantChange) {
        setData(newData);
        previousDataRef.current = newData;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [thresholdPercent, updateFn]);

  useEffect(() => {
    refreshData();
    intervalRef.current = window.setInterval(refreshData, interval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, refreshData]);

  return [data, isLoading, refreshData];
}

function hasSignificantDifference<T>(prev: T, current: T, thresholdPercent: number): boolean {
  // For numbers, check percentage change
  if (typeof prev === "number" && typeof current === "number") {
    const change = Math.abs(current - prev);
    const percentChange = prev !== 0 ? (change / Math.abs(prev)) * 100 : change;
    return percentChange > thresholdPercent;
  }

  // For objects, check numeric properties
  if (typeof prev === "object" && typeof current === "object") {
    const prevObj = prev as Record<string, any>;
    const currObj = current as Record<string, any>;

    for (const key in currObj) {
      const prevValue = prevObj[key];
      const currValue = currObj[key];

      if (typeof prevValue === "number" && typeof currValue === "number") {
        const change = Math.abs(currValue - prevValue);
        const percentChange = prevValue !== 0 ? (change / Math.abs(prevValue)) * 100 : change;
        if (percentChange > thresholdPercent) {
          return true;
        }
      }
    }
    return false;
  }

  // For other types, always update
  return prev !== current;
}
