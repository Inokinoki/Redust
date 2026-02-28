import { useState, useEffect, useRef } from "react";

export function useEfficientUpdates<T>(
  initialData: T,
  updateFn: () => Promise<T>,
  interval: number = 2000,
  thresholdPercent: number = 5
): [T, boolean, () => void] {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const previousDataRef = useRef<T>(initialData);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const newData = await updateFn();

      // Check if data changed significantly (delta update)
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
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, interval);
    return () => clearInterval(interval);
  }, [interval]);

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
