import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette, Command } from "../../components/CommandPalette";

// Mock UI components
vi.mock("../../components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, autoFocus, className }: unknown) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      data-testid="command-input"
    />
  ),
}));

vi.mock("../../components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="command-card">
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

const mockCommands: Command[] = [
  {
    id: "test-1",
    label: "Test Command 1",
    description: "First test command",
    icon: "🧪",
    shortcut: "Cmd+K",
    category: "Test",
    action: vi.fn(),
  },
  {
    id: "test-2",
    label: "Test Command 2",
    description: "Second test command",
    icon: "🔧",
    shortcut: "Cmd+L",
    category: "Test",
    action: vi.fn(),
  },
  {
    id: "other-1",
    label: "Other Command",
    description: "Other category command",
    icon: "🚀",
    category: "Other",
    action: vi.fn(),
  },
];

describe("CommandPalette Component", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import without errors", () => {
    expect(CommandPalette).toBeDefined();
    expect(typeof CommandPalette).toBe("function");
  });

  it("should not render when isOpen is false", () => {
    render(<CommandPalette isOpen={false} onClose={mockOnClose} commands={mockCommands} />);
    expect(screen.queryByTestId("command-card")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);
    expect(screen.getByTestId("command-card")).toBeInTheDocument();
    expect(screen.getByTestId("command-input")).toBeInTheDocument();
  });

  it("should render all commands grouped by category", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Test Command 1")).toBeInTheDocument();
    expect(screen.getByText("Test Command 2")).toBeInTheDocument();
    expect(screen.getByText("Other Command")).toBeInTheDocument();
  });

  it("should filter commands by search term", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "Test Command 1" } });

    await waitFor(() => {
      expect(screen.getByText("Test Command 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Command 2")).not.toBeInTheDocument();
      expect(screen.queryByText("Other Command")).not.toBeInTheDocument();
    });
  });

  it("should show no results message when search matches nothing", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No commands found matching/)).toBeInTheDocument();
    });
  });

  it("should filter by description", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "First test" } });

    await waitFor(() => {
      expect(screen.getByText("Test Command 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Command 2")).not.toBeInTheDocument();
    });
  });

  it("should filter case-insensitively", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "test command" } });

    await waitFor(() => {
      expect(screen.getByText("Test Command 1")).toBeInTheDocument();
      expect(screen.getByText("Test Command 2")).toBeInTheDocument();
    });
  });

  it("should execute command on click", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const command1Button = screen.getByText("Test Command 1").closest("button");
    fireEvent.click(command1Button!);

    expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should show command icons", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    expect(screen.getByText("🧪")).toBeInTheDocument();
    expect(screen.getByText("🔧")).toBeInTheDocument();
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("should show command descriptions", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    expect(screen.getByText("First test command")).toBeInTheDocument();
    expect(screen.getByText("Second test command")).toBeInTheDocument();
  });

  it("should show keyboard shortcuts", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    expect(screen.getByText("Cmd+K")).toBeInTheDocument();
    expect(screen.getByText("Cmd+L")).toBeInTheDocument();
  });

  it("should highlight first command by default", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const command1Button = screen.getByText("Test Command 1").closest("button");
    expect(command1Button).toHaveClass("bg-zinc-800", "text-zinc-100");
  });

  it("should close on Escape key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should navigate down with ArrowDown key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const command1Button = screen.getByText("Test Command 1").closest("button");
    const command2Button = screen.getByText("Test Command 2").closest("button");

    expect(command1Button).toHaveClass("bg-zinc-800", "text-zinc-100");

    fireEvent.keyDown(window, { key: "ArrowDown" });

    expect(command2Button).toHaveClass("bg-zinc-800", "text-zinc-100");
    expect(command1Button).not.toHaveClass("bg-zinc-800", "text-zinc-100");
  });

  it("should navigate up with ArrowUp key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const command1Button = screen.getByText("Test Command 1").closest("button");
    const command2Button = screen.getByText("Test Command 2").closest("button");

    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(command2Button).toHaveClass("bg-zinc-800", "text-zinc-100");

    fireEvent.keyDown(window, { key: "ArrowUp" });

    expect(command1Button).toHaveClass("bg-zinc-800", "text-zinc-100");
    expect(command2Button).not.toHaveClass("bg-zinc-800", "text-zinc-100");
  });

  it("should execute selected command on Enter key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    fireEvent.keyDown(window, { key: "Enter" });

    expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should execute second command after navigating", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(mockCommands[1].action).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should reset selected index when filtering changes", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");

    fireEvent.keyDown(window, { key: "ArrowDown" });

    const command2Button = screen.getByText("Test Command 2").closest("button");
    expect(command2Button).toHaveClass("bg-zinc-800", "text-zinc-100");

    fireEvent.change(input, { target: { value: "Other" } });

    await waitFor(() => {
      const otherButton = screen.getByText("Other Command").closest("button");
      expect(otherButton).toHaveClass("bg-zinc-800", "text-zinc-100");
    });
  });

  it("should prevent default on Arrow navigation", () => {
    const preventDefaultSpy = vi
      .spyOn(KeyboardEvent.prototype, "preventDefault")
      .mockImplementation(() => {});

    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    fireEvent.keyDown(window, { key: "ArrowDown" });

    expect(preventDefaultSpy).toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
  });

  it("should not navigate ArrowDown beyond last command", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const lastButton = screen.getByText("Other Command").closest("button");

    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowDown" });

    expect(lastButton).toHaveClass("bg-zinc-800", "text-zinc-100");
  });

  it("should not navigate ArrowUp beyond first command", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const firstButton = screen.getByText("Test Command 1").closest("button");

    fireEvent.keyDown(window, { key: "ArrowUp" });

    expect(firstButton).toHaveClass("bg-zinc-800", "text-zinc-100");
  });

  it("should not respond to keyboard events when closed", () => {
    render(<CommandPalette isOpen={false} onClose={mockOnClose} commands={mockCommands} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should clear search on command execution", async () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "test" } });

    const command1Button = screen.getByText("Test Command 1").closest("button");
    fireEvent.click(command1Button!);

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });
});
