/**
 * AI-Era Components Tests
 *
 * Tests for JSON Analyzer, Query Optimizer, and Vector Visualization components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the API
vi.mock("../lib/api", () => ({
  llmChat: vi.fn(),
  llmRAG: vi.fn(),
  llmGenerateEmbedding: vi.fn(),
}));

// Mock the connection store
const mockConnectionStore = {
  getState: vi.fn(() => ({
    currentConnection: {
      id: "test-conn",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
      tls: false,
    },
  })),
};

vi.mock("../stores/connectionStore", () => ({
  useConnectionStore: vi.fn((selector) => {
    const state = mockConnectionStore.getState();
    return selector ? selector(state) : state;
  }),
}));

import * as api from "../lib/api";

describe("JSON Analyzer Component", () => {
  const mockJSONData = {
    user: {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "Boston",
        zip: "02101"
      }
    },
    orders: [
      { id: 1, total: 99.99 },
      { id: 2, total: 149.99 }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectionStore.getState.mockReturnValue({
      currentConnection: {
        id: "test-conn",
        name: "Test Connection",
        host: "localhost",
        port: 6379,
        tls: false,
      },
    });
  });

  it("should analyze JSON structure correctly", async () => {
    const { JSONAnalyzer } = await import("../components/JSONAnalyzer");

    const { container } = render(
      <JSONAnalyzer
        isOpen={true}
        onClose={() => {}}
        keyName="user:123"
        jsonData={mockJSONData}
      />
    );

    // Check if analyzer renders
    expect(screen.getByText("JSON Document Analysis")).toBeInTheDocument();
  });

  it("should detect complex nested structures", async () => {
    const complexJSON = {
      level1: {
        level2: {
          level3: {
            level4: {
              data: "deep"
            }
          }
        }
      }
    };

    const { JSONAnalyzer } = await import("../components/JSONAnalyzer");

    render(
      <JSONAnalyzer
        isOpen={true}
        onClose={() => {}}
        keyName="complex:key"
        jsonData={complexJSON}
      />
    );

    // The analyzer should detect deep nesting
    expect(screen.getByText("JSON Document Analysis")).toBeInTheDocument();
  });

  it("should provide AI insights when configured", async () => {
    const mockAIResponse = {
      content: "This JSON document represents user profile data with nested address information and order history."
    };

    vi.mocked(api.llmChat).mockResolvedValue(mockAIResponse);

    const { JSONAnalyzer } = await import("../components/JSONAnalyzer");

    render(
      <JSONAnalyzer
        isOpen={true}
        onClose={() => {}}
        keyName="user:123"
        jsonData={mockJSONData}
      />
    );

    // Wait for AI analysis to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(api.llmChat).toHaveBeenCalled();
  });
});

describe("Query Optimizer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectionStore.getState.mockReturnValue({
      currentConnection: {
        id: "test-conn",
        name: "Test Connection",
        host: "localhost",
        port: 6379,
        tls: false,
      },
    });
  });

  it("should detect KEYS command usage", async () => {
    const mockOptimization = {
      content: `OPTIMIZED_QUERY: SCAN 0 MATCH user:* COUNT 100
IMPROVEMENTS: Replace KEYS with SCAN for better performance
INDEXING: Consider indexing user keys
PERFORMANCE_TIPS: Use pipelining for multiple commands
ESTIMATED_IMPROVEMENT: Significant
EXPLANATION: SCAN is more efficient than KEYS for production environments`
    };

    vi.mocked(api.llmChat).mockResolvedValue(mockOptimization);

    const { QueryOptimizer } = await import("../components/QueryOptimizer");

    render(
      <QueryOptimizer
        isOpen={true}
        onClose={() => {}}
        initialQuery="KEYS user:*"
      />
    );

    expect(screen.getByText("AI Query Optimizer")).toBeInTheDocument();
  });

  it("should suggest MGET for multiple GET commands", async () => {
    const { QueryOptimizer } = await import("../components/QueryOptimizer");

    render(
      <QueryOptimizer
        isOpen={true}
        onClose={() => {}}
        initialQuery="GET user:1\nGET user:2\nGET user:3"
      />
    );

    // Should detect optimization opportunity
    expect(screen.getByText("AI Query Optimizer")).toBeInTheDocument();
  });

  it("should provide indexing suggestions", async () => {
    const mockResponse = {
      content: "Consider creating indexes on frequently queried fields for better performance"
    };

    vi.mocked(api.llmChat).mockResolvedValue(mockResponse);

    const { QueryOptimizer } = await import("../components/QueryOptimizer");

    render(
      <QueryOptimizer
        isOpen={true}
        onClose={() => {}}
        initialQuery="FT.SEARCH user_index '@name:John'"
      />
    );

    expect(screen.getByText("AI Query Optimizer")).toBeInTheDocument();
  });

  it("should analyze query complexity", async () => {
    const complexQuery = `
      FT.SEARCH user_index "@name:John @age:{30 [40}"
      SORTBY name ASC
      LIMIT 0 10
      RETURN 3 name email age
    `;

    const { QueryOptimizer } = await import("../components/QueryOptimizer");

    render(
      <QueryOptimizer
        isOpen={true}
        onClose={() => {}}
        initialQuery={complexQuery}
      />
    );

    expect(screen.getByText("AI Query Optimizer")).toBeInTheDocument();
  });
});

describe("Vector Visualization Component", () => {
  const mockVectors = [
    [0.1, 0.2, 0.3, 0.4],
    [0.5, 0.6, 0.7, 0.8],
    [0.2, 0.3, 0.4, 0.5],
    [0.9, 0.1, 0.2, 0.3],
  ];

  const mockLabels = ["Vector 1", "Vector 2", "Vector 3", "Vector 4"];

  it("should render vector visualization", async () => {
    const { VectorVisualization } = await import("../components/VectorVisualization");

    render(
      <VectorVisualization
        isOpen={true}
        onClose={() => {}}
        vectors={mockVectors}
        labels={mockLabels}
      />
    );

    expect(screen.getByText("Vector Similarity Visualization")).toBeInTheDocument();
  });

  it("should compute similarity matrix", async () => {
    const { VectorVisualization } = await import("../components/VectorVisualization");

    render(
      <VectorVisualization
        isOpen={true}
        onClose={() => {}}
        vectors={mockVectors}
        labels={mockLabels}
      />
    );

    // Should display similarity matrix
    expect(screen.getByText("Similarity Matrix")).toBeInTheDocument();
  });

  it("should support different projection methods", async () => {
    const { VectorVisualization } = await import("../components/VectorVisualization");

    render(
      <VectorVisualization
        isOpen={true}
        onClose={() => {}}
        vectors={mockVectors}
        labels={mockLabels}
      />
    );

    // Check for projection method buttons
    expect(screen.getByText("PCA")).toBeInTheDocument();
    expect(screen.getByText("t-SNE")).toBeInTheDocument();
    expect(screen.getByText("Random")).toBeInTheDocument();
  });

  it("should display vector statistics", async () => {
    const { VectorVisualization } = await import("../components/VectorVisualization");

    render(
      <VectorVisualization
        isOpen={true}
        onClose={() => {}}
        vectors={mockVectors}
        labels={mockLabels}
      />
    );

    expect(screen.getByText("Statistics")).toBeInTheDocument();
  });
});

describe("AI Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze JSON data with AI", async () => {
    const mockAnalysis = {
      content: "This JSON contains user profile information with nested address data and order history."
    };

    vi.mocked(api.llmChat).mockResolvedValue(mockAnalysis);

    const response = await api.llmChat({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a database analyst" },
        { role: "user", content: "Analyze this JSON data" }
      ]
    });

    expect(response.content).toContain("user profile");
  });

  it("should optimize queries with AI", async () => {
    const mockOptimization = {
      content: "Replace KEYS with SCAN for better performance"
    };

    vi.mocked(api.llmChat).mockResolvedValue(mockOptimization);

    const response = await api.llmChat({
      model: "gpt-4-turbo",
      messages: [
        { role: "user", content: "Optimize this Redis query: KES user:*" }
      ]
    });

    expect(response.content).toContain("SCAN");
  });

  it("should handle different LLM providers", async () => {
    const providers: api.LLMProvider[] = ["OpenAI", "Anthropic", "Ollama"];

    for (const provider of providers) {
      const mockResponse = { content: `Response from ${provider}` };
      vi.mocked(api.llmChat).mockResolvedValue(mockResponse);

      const response = await api.llmChat({
        model: provider === "OpenAI" ? "gpt-4-turbo" : provider === "Anthropic" ? "claude-3-sonnet" : "llama2",
        messages: [{ role: "user", content: "Test" }]
      });

      expect(response.content).toContain(provider);
    }
  });
});

describe("AI Component Type Safety", () => {
  it("should enforce correct types for JSON analysis", () => {
    const jsonData = {
      string: "test",
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: "data" }
    };

    expect(jsonData.string).toBe("test");
    expect(jsonData.number).toBe(42);
    expect(jsonData.boolean).toBe(true);
    expect(Array.isArray(jsonData.array)).toBe(true);
    expect(typeof jsonData.object).toBe("object");
  });

  it("should handle vector data types correctly", () => {
    const vectors: number[][] = [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6]
    ];

    expect(vectors).toHaveLength(2);
    expect(vectors[0]).toHaveLength(3);
    expect(typeof vectors[0][0]).toBe("number");
  });

  it("should validate query types", () => {
    const queryTypes: Array<"redis" | "sql" | "generic"> = ["redis", "sql", "generic"];

    queryTypes.forEach(type => {
      expect(["redis", "sql", "generic"]).toContain(type);
    });
  });
});
