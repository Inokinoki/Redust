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
      selectedKey: null,
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

  it("should update existing keys", () => {
    const initialKeys: KeyInfo[] = [{ key: "user:1", type: "hash", ttl: -1 }];

    useKeyStore.getState().setKeys(initialKeys);

    const updatedKeys: KeyInfo[] = [
      { key: "user:1", type: "hash", ttl: -1 },
      { key: "user:2", type: "string", ttl: 3600 },
    ];

    useKeyStore.getState().setKeys(updatedKeys);

    const keys = useKeyStore.getState().keys;
    expect(keys).toEqual(updatedKeys);
  });

  it("should clear keys", () => {
    const testKeys: KeyInfo[] = [{ key: "user:1", type: "hash", ttl: -1 }];

    useKeyStore.getState().setKeys(testKeys);

    useKeyStore.getState().setKeys([]);

    const keys = useKeyStore.getState().keys;
    expect(keys).toEqual([]);
  });

  it("should set selected key", () => {
    useKeyStore.getState().setSelectedKey("user:1");

    const selectedKey = useKeyStore.getState().selectedKey;
    expect(selectedKey).toBe("user:1");
  });

  it("should clear selected key", () => {
    useKeyStore.getState().setSelectedKey("user:1");
    useKeyStore.getState().setSelectedKey(null);

    const selectedKey = useKeyStore.getState().selectedKey;
    expect(selectedKey).toBeNull();
  });

  it("should update selected key", () => {
    useKeyStore.getState().setSelectedKey("user:1");
    useKeyStore.getState().setSelectedKey("user:2");

    const selectedKey = useKeyStore.getState().selectedKey;
    expect(selectedKey).toBe("user:2");
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

  it("should toggle loading state", () => {
    useKeyStore.getState().setIsLoading(true);
    expect(useKeyStore.getState().isLoading).toBe(true);

    useKeyStore.getState().setIsLoading(false);
    expect(useKeyStore.getState().isLoading).toBe(false);

    useKeyStore.getState().setIsLoading(true);
    expect(useKeyStore.getState().isLoading).toBe(true);
  });

  it("should reset search pattern to *", () => {
    useKeyStore.getState().setSearchPattern("user:*");
    useKeyStore.getState().setSearchPattern("*");

    const pattern = useKeyStore.getState().searchPattern;
    expect(pattern).toBe("*");
  });
});
