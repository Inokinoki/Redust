/**
 * LLM API Tests
 *
 * Tests for LLM functionality including RAG pipeline, chat completion,
 * and embedding generation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../lib/api";

// Mock Tauri invoke function
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("LLM API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
  });

  describe("llmChat", () => {
    it("should send chat completion request", async () => {
      const mockResponse = {
        content: "Hello! How can I help you today?",
        model: "gpt-4-turbo",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const request: api.LLMRequest = {
        model: "gpt-4-turbo",
        messages: [
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      };

      const response = await api.llmChat(request);

      expect(response.content).toBe("Hello! How can I help you today?");
      expect(response.model).toBe("gpt-4-turbo");
      expect(response.usage?.total_tokens).toBe(30);
    });

    it("should handle different providers", async () => {
      const providers: api.LLMProvider[] = ["OpenAI", "Anthropic", "Ollama"];
      const models: api.LLMModel[] = ["gpt-4", "claude-3-sonnet", "llama2"];

      for (let i = 0; i < providers.length; i++) {
        const mockResponse = {
          content: `Response from ${providers[i]}`,
          model: models[i],
        };

        mockInvoke.mockResolvedValue(mockResponse);

        const request: api.LLMRequest = {
          model: models[i],
          messages: [{ role: "user", content: "Test" }],
          api_key: "test-key",
        };

        const response = await api.llmChat(request);
        expect(response.model).toBe(models[i]);
      }
    });

    it("should handle streaming requests", async () => {
      const mockResponse = {
        content: "Streaming response",
        model: "gpt-4-turbo",
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const request: api.LLMRequest = {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: "Test" }],
        stream: true,
      };

      const response = await api.llmChat(request);
      expect(response.content).toBe("Streaming response");
    });
  });

  describe("llmRAG", () => {
    it("should perform RAG query with sources", async () => {
      const mockResponse: api.RAGResponse = {
        answer: "Based on the documents, Redis is a key-value store.",
        sources: [
          {
            key: "doc:1",
            score: 0.95,
            snippet: "Redis is an open-source key-value store...",
          },
          {
            key: "doc:2",
            score: 0.87,
            snippet: "Key-value stores are known for fast performance...",
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 50,
          total_tokens: 200,
        },
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const mockConnection: api.ConnectionConfig = {
        id: "test-conn",
        name: "Test Connection",
        host: "localhost",
        port: 6379,
        tls: false,
      };

      const request: api.RAGRequest = {
        query: "What is Redis?",
        model: "gpt-4-turbo",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 5,
        temperature: 0.7,
      };

      const response = await api.llmRAG(mockConnection, request);

      expect(response.answer).toContain("Redis");
      expect(response.sources).toHaveLength(2);
      expect(response.sources[0].score).toBe(0.95);
      expect(response.sources[0].key).toBe("doc:1");
      expect(response.usage?.total_tokens).toBe(200);
    });

    it("should include conversation history in RAG requests", async () => {
      const mockResponse: api.RAGResponse = {
        answer: "Follow-up answer",
        sources: [],
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const mockConnection: api.ConnectionConfig = {
        id: "test-conn",
        name: "Test Connection",
        host: "localhost",
        port: 6379,
        tls: false,
      };

      const request: api.RAGRequest = {
        query: "Tell me more",
        model: "claude-3-sonnet",
        index_name: "docs_index",
        vector_field: "embedding",
        top_k: 3,
        conversation_history: [
          { role: "user", content: "What is Redis?" },
          { role: "assistant", content: "Redis is a key-value store." },
        ],
      };

      const response = await api.llmRAG(mockConnection, request);
      expect(response.answer).toBe("Follow-up answer");
    });

    it("should handle empty search results gracefully", async () => {
      const mockResponse: api.RAGResponse = {
        answer: "I couldn't find any relevant information in the documents.",
        sources: [],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const mockConnection: api.ConnectionConfig = {
        id: "test-conn",
        name: "Test Connection",
        host: "localhost",
        port: 6379,
        tls: false,
      };

      const request: api.RAGRequest = {
        query: "Some obscure query",
        model: "gpt-4-turbo",
        index_name: "empty_index",
        vector_field: "embedding",
        top_k: 5,
      };

      const response = await api.llmRAG(mockConnection, request);
      expect(response.sources).toHaveLength(0);
      expect(response.answer).toContain("couldn't find");
    });
  });

  describe("llmGenerateEmbedding", () => {
    it("should generate embeddings for text", async () => {
      const mockResponse: api.EmbeddingResponse = {
        embedding: Array.from({ length: 1536 }, () => Math.random()),
        model: "text-embedding-ada-002",
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const request: api.EmbeddingRequest = {
        text: "Hello, world!",
        model: "text-embedding-ada-002",
        provider: "OpenAI",
        api_key: "test-key",
      };

      const response = await api.llmGenerateEmbedding(request);

      expect(response.embedding).toHaveLength(1536);
      expect(response.model).toBe("text-embedding-ada-002");
    });

    it("should handle different embedding providers", async () => {
      const providers: api.LLMProvider[] = ["OpenAI", "Ollama"];

      for (const provider of providers) {
        const mockResponse: api.EmbeddingResponse = {
          embedding: Array.from({ length: 768 }, () => Math.random()),
          model: provider === "OpenAI" ? "text-embedding-ada-002" : "llama2",
        };

        mockInvoke.mockResolvedValue(mockResponse);

        const request: api.EmbeddingRequest = {
          text: "Test text",
          provider,
        };

        const response = await api.llmGenerateEmbedding(request);
        expect(response.embedding.length).toBeGreaterThan(0);
      }
    });

    it("should handle API errors gracefully", async () => {
      mockInvoke.mockRejectedValue(new Error("API key invalid"));

      const request: api.EmbeddingRequest = {
        text: "Test",
        provider: "OpenAI",
        api_key: "invalid-key",
      };

      await expect(api.llmGenerateEmbedding(request)).rejects.toThrow("API key invalid");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct types for LLM models", () => {
      const validModels: api.LLMModel[] = [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-3.5-turbo",
        "claude-3-opus",
        "claude-3-sonnet",
        "claude-3-haiku",
        "llama2",
        "mistral",
      ];

      expect(validModels).toHaveLength(8);
    });

    it("should enforce correct types for LLM providers", () => {
      const validProviders: api.LLMProvider[] = ["OpenAI", "Anthropic", "Ollama"];

      expect(validProviders).toHaveLength(3);
    });

    it("should have correct RAG response structure", () => {
      const response: api.RAGResponse = {
        answer: "Test answer",
        sources: [
          {
            key: "test:1",
            score: 0.9,
            snippet: "Test snippet",
          },
        ],
      };

      expect(response.answer).toBe("Test answer");
      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].score).toBeLessThanOrEqual(1.0);
      expect(response.sources[0].score).toBeGreaterThanOrEqual(0.0);
    });
  });
});
