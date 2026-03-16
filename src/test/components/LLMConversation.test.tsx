/**
 * LLMConversation Component Tests
 *
 * Tests for the LLM Conversation component including RAG integration,
 * UI interactions, and source display.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LLMConversation } from "../../components/LLMConversation";

// Mock the API
vi.mock("../../lib/api", () => ({
  llmRAG: vi.fn(),
  llmChat: vi.fn(),
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

vi.mock("../../stores/connectionStore", () => ({
  useConnectionStore: vi.fn((selector) => {
    const state = mockConnectionStore.getState();
    return selector ? selector(state) : state;
  }),
}));

import * as api from "../../lib/api";

describe("LLMConversation Component", () => {
  const mockRAGResponse: api.RAGResponse = {
    answer: "Based on the documents, Redis is a high-performance key-value store.",
    sources: [
      {
        key: "doc:redis:intro",
        score: 0.95,
        snippet: "Redis is an open-source, networked, in-memory key-value data store...",
      },
      {
        key: "doc:redis:performance",
        score: 0.87,
        snippet: "Redis is known for its high performance and low latency...",
      },
    ],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 50,
      total_tokens: 200,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render when isOpen is true", () => {
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText("RAG Configuration")).toBeInTheDocument();
      expect(screen.getByText("AI Chat")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(
        <LLMConversation
          isOpen={false}
          onClose={() => {}}
        />
      );

      expect(screen.queryByText("RAG Configuration")).not.toBeInTheDocument();
      expect(screen.queryByText("AI Chat")).not.toBeInTheDocument();
    });

    it("should display all configuration fields", () => {
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByLabelText(/Vector Index/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Top-K Chunks/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/LLM Provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Vector Field Name/i)).toBeInTheDocument();
    });

    it("should show placeholder text in chat area", () => {
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText("Start a conversation with Redis RAG")).toBeInTheDocument();
    });
  });

  describe("Configuration", () => {
    it("should allow selecting different LLM providers", async () => {
      const user = userEvent.setup();
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const providerSelect = screen.getByLabelText(/LLM Provider/i);
      await user.selectOptions(providerSelect, "Anthropic");

      expect(providerSelect).toHaveValue("Anthropic");
    });

    it("should update model options based on provider", async () => {
      const user = userEvent.setup();
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const providerSelect = screen.getByLabelText(/LLM Provider/i);
      const modelSelect = screen.getByLabelText(/Model/i);

      // Switch to Anthropic
      await user.selectOptions(providerSelect, "Anthropic");
      expect(modelSelect).toHaveValue("claude-3-sonnet");

      // Switch to Ollama
      await user.selectOptions(providerSelect, "Ollama");
      expect(modelSelect).toHaveValue("llama2");
    });

    it("should allow configuring vector index name", async () => {
      const user = userEvent.setup();
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "my_docs_index");

      expect(indexInput).toHaveValue("my_docs_index");
    });

    it("should allow configuring top-k value", async () => {
      const user = userEvent.setup();
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const topKInput = screen.getByLabelText(/Top-K Chunks/i);
      await user.clear(topKInput);
      await user.type(topKInput, "10");

      expect(topKInput).toHaveValue(10);
    });
  });

  describe("Chat Functionality", () => {
    it("should send message and display response", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue(mockRAGResponse);

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Configure the index
      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      // Type a message
      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "What is Redis?");

      // Send the message
      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Wait for the response
      await waitFor(() => {
        expect(api.llmRAG).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "test-conn",
          }),
          expect.objectContaining({
            query: "What is Redis?",
            index_name: "test_index",
          })
        );
      });

      // Check if user message is displayed
      await waitFor(() => {
        expect(screen.getByText("What is Redis?")).toBeInTheDocument();
      });

      // Check if assistant response is displayed
      await waitFor(() => {
        expect(screen.getByText(/high-performance key-value store/i)).toBeInTheDocument();
      });
    });

    it("should display sources from RAG response", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue(mockRAGResponse);

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Configure and send
      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "What is Redis?");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Wait for sources to appear
      await waitFor(() => {
        expect(screen.getByText(/Sources:/i)).toBeInTheDocument();
        expect(screen.getByText(/doc:redis:intro/i)).toBeInTheDocument();
        expect(screen.getByText(/95.0%/i)).toBeInTheDocument();
      });
    });

    it("should show loading state during request", async () => {
      const user = userEvent.setup();
      // Mock a delayed response
      vi.mocked(api.llmRAG).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockRAGResponse), 100);
          })
      );

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Check loading state
      expect(sendButton).toHaveTextContent("...");
    });

    it("should handle errors gracefully", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockRejectedValue(new Error("API Error"));

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Error: API Error/i)).toBeInTheDocument();
      });
    });

    it("should require vector index name to send message", async () => {
      const user = userEvent.setup();
      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Should not call API without index name
      expect(api.llmRAG).not.toHaveBeenCalled();

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Please specify a vector index name/i)).toBeInTheDocument();
      });
    });

    it("should allow sending message with Enter key", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue(mockRAGResponse);

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test message");

      await user.keyboard("{Enter}");

      expect(api.llmRAG).toHaveBeenCalled();
    });
  });

  describe("Message Display", () => {
    it("should show message timestamps", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue({
        answer: "Response",
        sources: [],
      });

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it("should show user and assistant message styles", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue({
        answer: "Assistant response",
        sources: [],
      });

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "User message");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("You")).toBeInTheDocument();
        expect(screen.getByText("AI Assistant")).toBeInTheDocument();
      });
    });
  });

  describe("Source Display", () => {
    it("should limit displayed sources to top 3", async () => {
      const user = userEvent.setup();
      const responseWithManySources: api.RAGResponse = {
        answer: "Answer",
        sources: Array.from({ length: 10 }, (_, i) => ({
          key: `doc:${i}`,
          score: 0.9 - i * 0.05,
          snippet: `Snippet ${i}`,
        })),
      };

      vi.mocked(api.llmRAG).mockResolvedValue(responseWithManySources);

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      await waitFor(() => {
        // Should only show 3 sources
        const sources = screen.getAllByText(/doc:\d/);
        expect(sources.length).toBe(3);
      });
    });

    it("should show score percentages", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockResolvedValue(mockRAGResponse);

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("95.0%")).toBeInTheDocument();
        expect(screen.getByText("87.0%")).toBeInTheDocument();
      });
    });
  });

  describe("Controls", () => {
    it("should call onClose when Close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <LLMConversation
          isOpen={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByRole("button", { name: /Close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should disable input while loading", async () => {
      const user = userEvent.setup();
      vi.mocked(api.llmRAG).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockRAGResponse), 100);
          })
      );

      render(
        <LLMConversation
          isOpen={true}
          onClose={() => {}}
        />
      );

      const indexInput = screen.getByLabelText(/Vector Index/i);
      await user.type(indexInput, "test_index");

      const input = screen.getByPlaceholderText(/Ask about your Redis data/i);
      await user.type(input, "Test");

      const sendButton = screen.getByRole("button", { name: /Send/i });
      await user.click(sendButton);

      // Input should be disabled during loading
      expect(input).toBeDisabled();
    });
  });
});
