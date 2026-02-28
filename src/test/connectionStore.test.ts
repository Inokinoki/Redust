import { describe, it, expect, beforeEach } from "vitest";
import { useConnectionStore } from "../stores/connectionStore";
import type { ConnectionConfig } from "../types";

describe("ConnectionStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useConnectionStore.setState({
      connections: [],
      activeConnectionId: null,
    });
  });

  it("should initialize with empty connections", () => {
    const connections = useConnectionStore.getState().connections;
    expect(connections).toEqual([]);
  });

  it("should add a connection", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);

    const connections = useConnectionStore.getState().connections;
    expect(connections).toHaveLength(1);
    expect(connections[0]).toEqual(testConnection);
  });

  it("should update a connection", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);

    useConnectionStore.getState().updateConnection("1", {
      name: "Updated Connection",
    });

    const connections = useConnectionStore.getState().connections;
    expect(connections[0].name).toBe("Updated Connection");
  });

  it("should delete a connection", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);
    useConnectionStore.getState().deleteConnection("1");

    const connections = useConnectionStore.getState().connections;
    expect(connections).toHaveLength(0);
  });

  it("should set active connection", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);
    useConnectionStore.getState().setActiveConnection("1");

    const activeId = useConnectionStore.getState().activeConnectionId;
    expect(activeId).toBe("1");
  });

  it("should get active connection", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);
    useConnectionStore.getState().setActiveConnection("1");

    const activeConnection = useConnectionStore.getState().getActiveConnection();
    expect(activeConnection).toEqual(testConnection);
  });

  it("should clear active connection when deleting it", () => {
    const testConnection: ConnectionConfig = {
      id: "1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    useConnectionStore.getState().addConnection(testConnection);
    useConnectionStore.getState().setActiveConnection("1");
    useConnectionStore.getState().deleteConnection("1");

    const activeId = useConnectionStore.getState().activeConnectionId;
    expect(activeId).toBeNull();
  });
});
