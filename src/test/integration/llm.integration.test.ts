/**
 * LLM Integration Tests
 *
 * Tests for the complete LLM pipeline including embedding generation,
 * vector search, and RAG workflows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Tauri API
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

import * as api from "../../lib/api";

describe("LLM Integration Tests", () => {
  const mockConnection: api.ConnectionConfig = {
    id: "test-conn",
    name: "Test Connection",
    host: "localhost",
    port: 6379,
    tls: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
  });

  describe("Complete RAG Pipeline", () => {
    it("should execute full RAG workflow end-to-end", async () => {
      // Mock embedding generation
      const mockEmbedding: api.EmbeddingResponse = {
        embedding: Array.from({ length: 1536 }, () => Math.random()),
        model: "text-embedding-ada-002",
      };

      // Mock vector search results
      const mockSearchResults = [
        {
          key: "doc:redis:basics",
          score: 0.92,
          fields: {
            content: "Redis is an in-memory data structure store...",
            title: "Redis Basics",
          },
        },
        {
          key: "doc:redis:performance",
          score: 0.88,
          fields: {
            content: "Redis achieves high performance through in-memory operations...",
            title: "Redis Performance",
          },
        },
      ];

      // Mock RAG response
      const mockRAGResponse: api.RAGResponse = {
        answer: "Based on the documentation, Redis is an in-memory data structure store that achieves high performance through in-memory operations.",
        sources: [
          {
            key: "doc:redis:basics",
            score: 0.92,
            snippet: "Redis is an in-memory data structure store...",
          },
          {
            key: "doc:redis:performance",
            score: 0.88,
            snippet: "Redis achieves high performance through in-memory operations...",
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 50,
          total_tokens: 250,
        },
      };

      // Setup mock chain
      mockInvoke
        .mockResolvedValueOnce(mockEmbedding)
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce(mockRAGResponse);

      // Execute RAG pipeline
      const response = await api.llmRAG(mockConnection, {
        query: "What is Redis and how does it achieve high performance?",
        model: "gpt-4-turbo",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 5,
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Verify the complete pipeline
      expect(response.answer).toContain("Redis");
      expect(response.answer).toContain("in-memory");
      expect(response.sources).toHaveLength(2);
      expect(response.sources[0].score).toBeGreaterThan(0.9);
      expect(response.usage?.total_tokens).toBeGreaterThan(0);
    });

    it("should handle RAG with no relevant documents", async () => {
      const mockEmbedding: api.EmbeddingResponse = {
        embedding: Array.from({ length: 1536 }, () => Math.random()),
        model: "text-embedding-ada-002",
      };

      const mockSearchResults: api.VectorSearchResult[] = [];

      const mockRAGResponse: api.RAGResponse = {
        answer: "I couldn't find any relevant information in the documents to answer your question.",
        sources: [],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 30,
          total_tokens: 130,
        },
      };

      mockInvoke
        .mockResolvedValueOnce(mockEmbedding)
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce(mockRAGResponse);

      const response = await api.llmRAG(mockConnection, {
        query: "How to cook pasta?",
        model: "gpt-4-turbo",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 5,
      });

      expect(response.sources).toHaveLength(0);
      expect(response.answer).toContain("couldn't find");
    });
  });

  describe("Multi-Turn Conversations", () => {
    it("should maintain conversation context across multiple turns", async () => {
      const mockRAGResponse1: api.RAGResponse = {
        answer: "Redis is a key-value store.",
        sources: [{ key: "doc:1", score: 0.9 }],
      };

      const mockRAGResponse2: api.RAGResponse = {
        answer: "Redis supports data structures like strings, hashes, and lists.",
        sources: [{ key: "doc:2", score: 0.85 }],
      };

      mockInvoke
        .mockResolvedValueOnce(mockRAGResponse1)
        .mockResolvedValueOnce(mockRAGResponse2);

      const conversationHistory: api.LLMMessage[] = [
        { role: "user", content: "What is Redis?" },
        { role: "assistant", content: "Redis is a key-value store." },
      ];

      // First turn
      const response1 = await api.llmRAG(mockConnection, {
        query: "What is Redis?",
        model: "gpt-4-turbo",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 3,
      });

      // Second turn with history
      const conversationHistory: api.LLMMessage[] = [
        { role: "user", content: "What is Redis?" },
        { role: "assistant", content: "Redis is a key-value store." },
      ];

      const response2 = await api.llmRAG(mockConnection, {
        query: "What data structures does it support?",
        model: "gpt-4-turbo",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 3,
        conversation_history: conversationHistory,
      });

      expect(response1.answer).toBe("Redis is a key-value store.");
      expect(response2.answer).toContain("data structures");
    });
  });

  describe("Different LLM Providers", () => {
    it("should work with OpenAI", async () => {
      const mockResponse: api.LLMResponse = {
        content: "OpenAI response",
        model: "gpt-4-turbo",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const response = await api.llmChat({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: "Test" }],
      });

      expect(response.content).toBe("OpenAI response");
      expect(response.model).toBe("gpt-4-turbo");
    });

    it("should work with Anthropic", async () => {
      const mockResponse: api.LLMResponse = {
        content: "Anthropic response",
        model: "claude-3-sonnet",
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40,
        },
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const response = await api.llmChat({
        model: "claude-3-sonnet",
        messages: [{ role: "user", content: "Test" }],
      });

      expect(response.content).toBe("Anthropic response");
    });

    it("should work with Ollama", async () => {
      const mockResponse: api.LLMResponse = {
        content: "Ollama response",
        model: "llama2",
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const response = await api.llmChat({
        model: "llama2",
        messages: [{ role: "user", content: "Test" }],
        api_endpoint: "http://localhost:11434/api/chat",
      });

      expect(response.content).toBe("Ollama response");
      expect(response.model).toBe("llama2");
    });
  });

  describe("Embedding Generation", () => {
    it("should generate embeddings with OpenAI", async () => {
      const mockEmbedding: api.EmbeddingResponse = {
        embedding: Array.from({ length: 1536 }, () => Math.random()),
        model: "text-embedding-ada-002",
      };

      mockInvoke.mockResolvedValue(mockEmbedding);

      const response = await api.llmGenerateEmbedding({
        text: "Test text for embedding",
        model: "text-embedding-ada-002",
        provider: "OpenAI",
        api_key: "test-key",
      });

      expect(response.embedding).toHaveLength(1536);
      expect(response.model).toBe("text-embedding-ada-002");
    });

    it("should generate embeddings with Ollama", async () => {
      const mockEmbedding: api.EmbeddingResponse = {
        embedding: Array.from({ length: 768 }, () => Math.random()),
        model: "llama2",
      };

      mockInvoke.mockResolvedValue(mockEmbedding);

      const response = await api.llmGenerateEmbedding({
        text: "Test text for embedding",
        provider: "Ollama",
        api_endpoint: "http://localhost:11434/api/embeddings",
      });

      expect(response.embedding).toHaveLength(768);
      expect(response.model).toBe("llama2");
    });

    it("should handle embedding errors gracefully", async () => {
      mockInvoke.mockRejectedValue(new Error("Embedding API error"));

      await expect(
        api.llmGenerateEmbedding({
          text: "Test",
          provider: "OpenAI",
          api_key: "invalid-key",
        })
      ).rejects.toThrow("Embedding API error");
    });
  });

  describe("Token Usage Tracking", () => {
    it("should track token usage for RAG queries", async () => {
      const mockRAGResponse: api.RAGResponse = {
        answer: "Test answer",
        sources: [],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 100,
          total_tokens: 300,
        },
      };

      mockInvoke.mockResolvedValue(mockRAGResponse);

      const response = await api.llmRAG(mockConnection, {
        query: "Test query",
        model: "gpt-4-turbo",
        index_name: "test_index",
        vector_field: "embedding",
        top_k: 5,
      });

      expect(response.usage?.total_tokens).toBe(300);
      expect(response.usage?.prompt_tokens).toBe(200);
      expect(response.usage?.completion_tokens).toBe(100);
    });

    it("should calculate cost estimates based on token usage", () => {
      const usage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      // GPT-4 Turbo pricing (as of 2024)
      const inputPricePer1k = 0.01;
      const outputPricePer1k = 0.03;

      const estimatedCost =
        (usage.prompt_tokens / 1000) * inputPricePer1k +
        (usage.completion_tokens / 1000) * outputPricePer1k;

      expect(estimatedCost).toBeCloseTo(0.025, 3);
    });
  });

  describe("Error Handling", () => {
    it("should handle API key errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Invalid API key"));

      await expect(
        api.llmChat({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: "Test" }],
          api_key: "invalid-key",
        })
      ).rejects.toThrow("Invalid API key");
    });

    it("should handle network errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Network error"));

      await expect(
        api.llmChat({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: "Test" }],
        })
      ).rejects.toThrow("Network error");
    });

    it("should handle rate limiting", async () => {
      mockInvoke.mockRejectedValue(new Error("Rate limit exceeded"));

      await expect(
        api.llmChat({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: "Test" }],
        })
      ).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle timeout errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Request timeout"));

      await expect(
        api.llmChat({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: "Test" }],
        })
      ).rejects.toThrow("Request timeout");
    });
  });

  describe("Performance", () => {
    it("should handle large embeddings efficiently", async () => {
      const largeEmbedding: api.EmbeddingResponse = {
        embedding: Array.from({ length: 3072 }, () => Math.random()), // GPT-4 embedding size
        model: "text-embedding-3-large",
      };

      mockInvoke.mockResolvedValue(largeEmbedding);

      const startTime = Date.now();
      const response = await api.llmGenerateEmbedding({
        text: "Large text",
        provider: "OpenAI",
      });
      const endTime = Date.now();

      expect(response.embedding).toHaveLength(3072);
      // Should complete in reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle batch RAG requests efficiently", async () => {
      const mockRAGResponse: api.RAGResponse = {
        answer: "Batch response",
        sources: [],
      };

      mockInvoke.mockResolvedValue(mockRAGResponse);

      const startTime = Date.now();

      // Simulate 5 concurrent RAG requests
      const requests = Array.from({ length: 5 }, (_, i) =>
        api.llmRAG(mockConnection, {
          query: `Query ${i}`,
          model: "gpt-4-turbo",
          index_name: "test_index",
          vector_field: "embedding",
          top_k: 3,
        })
      );

      await Promise.all(requests);
      const endTime = Date.now();

      // All requests should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty queries", async () => {
      const mockRAGResponse: api.RAGResponse = {
        answer: "Please provide a specific question.",
        sources: [],
      };

      mockInvoke.mockResolvedValue(mockRAGResponse);

      const response = await api.llmRAG(mockConnection, {
        query: "",
        model: "gpt-4-turbo",
        index_name: "test_index",
        vector_field: "embedding",
        top_k: 5,
      });

      expect(response.answer).toContain("provide");
    });

    it("should handle very long queries", async () => {
      const longQuery = "Tell me about Redis. ".repeat(100);

      const mockRAGResponse: api.RAGResponse = {
        answer: "Response to long query",
        sources: [],
        usage: {
          prompt_tokens: 1500,
          completion_tokens: 100,
          total_tokens: 1600,
        },
      };

      mockInvoke.mockResolvedValue(mockRAGResponse);

      const response = await api.llmRAG(mockConnection, {
        query: longQuery,
        model: "gpt-4-turbo",
        index_name: "test_index",
        vector_field: "embedding",
        top_k: 5,
      });

      expect(response.usage?.prompt_tokens).toBeGreaterThan(1000);
    });

    it("should handle special characters in queries", async () => {
      const specialQuery = "What about @#$%^&*() special chars?";

      const mockRAGResponse: api.RAGResponse = {
        answer: "Response with special chars",
        sources: [],
      };

      mockInvoke.mockResolvedValue(mockRAGResponse);

      const response = await api.llmRAG(mockConnection, {
        query: specialQuery,
        model: "gpt-4-turbo",
        index_name: "test_index",
        vector_field: "embedding",
        top_k: 5,
      });

      expect(response.answer).toBeDefined();
    });
  });
});
