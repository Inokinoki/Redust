import { describe, it, expect, beforeEach } from "vitest";
import { useKeyStore } from "../stores/keyStore";
import type { KeyInfo } from "../types";

describe("KeyStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useKeyStore.setState({
      keys: [],
      searchPattern: "*",
      isLoading: false,
    });
  });

  it("should initialize with empty keys", () => {
    const keys = useKeyStore.getState().keys;
    expect(keys).toEqual([]);
  });

  it("should set keys", () => {
    const testKeys: KeyInfo[] = [
      { key: "user:1", type: "hash", ttl: -1 },
      { key: "cache:1", type: "string", ttl: 3600 },
    ];

    useKeyStore.getState().setKeys(testKeys);

    const keys = useKeyStore.getState().keys;
    expect(keys).toEqual(testKeys);
  });

  it("should set search pattern", () => {
    useKeyStore.getState().setSearchPattern("user:*");

    const pattern = useKeyStore.getState().searchPattern;
    expect(pattern).toBe("user:*");
  });

  it("should set loading state", () => {
    useKeyStore.getState().setIsLoading(true);

    const isLoading = useKeyStore.getState().isLoading;
    expect(isLoading).toBe(true);

    useKeyStore.getState().setIsLoading(false);

    const notLoading = useKeyStore.getState().isLoading;
    expect(notLoading).toBe(false);
  });

  it("should reset search pattern to *", () => {
    useKeyStore.getState().setSearchPattern("user:*");
    useKeyStore.getState().setSearchPattern("*");

    const pattern = useKeyStore.getState().searchPattern;
    expect(pattern).toBe("*");
  });
});
