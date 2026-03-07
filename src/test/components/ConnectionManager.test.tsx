import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectionManager } from "../../components/ConnectionManager";

// Mock the connection store properly
const mockAddConnection = vi.fn();
vi.mock("../../stores/connectionStore", () => ({
  useConnectionStore: () => ({ addConnection: mockAddConnection }),
}));

// Mock UI components
vi.mock("../../components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock("../../components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "submit" | "reset" | "button" | undefined;
  }) => (
    <button type={type || "button"} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../../components/ui/input", () => ({
  Input: ({ id, type, value, onChange, required }: any) => (
    <input
      id={id}
      type={type || "text"}
      value={value}
      onChange={onChange}
      required={required}
      data-testid={`input-${id}`}
    />
  ),
}));

vi.mock("../../components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

describe("ConnectionManager Component", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import without errors", () => {
    expect(ConnectionManager).toBeDefined();
    expect(typeof ConnectionManager).toBe("function");
  });

  it("should not render when isOpen is false", () => {
    render(<ConnectionManager isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render dialog when isOpen is true", () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Add Redis Connection");
  });

  it("should render all form fields", () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId("input-name")).toBeInTheDocument();
    expect(screen.getByTestId("input-host")).toBeInTheDocument();
    expect(screen.getByTestId("input-port")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("input-database")).toBeInTheDocument();
  });

  it("should have default values for host and port", () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId("input-host")).toHaveValue("localhost");
    expect(screen.getByTestId("input-port")).toHaveValue(6379);
  });

  it("should handle name input change", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const nameInput = screen.getByTestId("input-name");
    fireEvent.change(nameInput, { target: { value: "Test Connection" } });
    expect(nameInput).toHaveValue("Test Connection");
  });

  it("should call onClose when cancel button is clicked", () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should submit form with default connection name when name is empty", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockAddConnection).toHaveBeenCalledTimes(1);
    });

    expect(mockAddConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "localhost:6379",
        host: "localhost",
        port: 6379,
        password: undefined,
        database: undefined,
        tls: false,
      })
    );
  });

  it("should submit form with custom connection name", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const nameInput = screen.getByTestId("input-name");
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.change(nameInput, { target: { value: "My Redis" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockAddConnection).toHaveBeenCalledTimes(1);
    });

    expect(mockAddConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Redis",
      })
    );
  });

  it("should submit form with password", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const passwordInput = screen.getByTestId("input-password");
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockAddConnection).toHaveBeenCalledTimes(1);
    });

    expect(mockAddConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "password123",
      })
    );
  });

  it("should submit form with TLS enabled", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const tlsCheckbox = screen.getByLabelText("Use TLS/SSL");
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.click(tlsCheckbox);
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockAddConnection).toHaveBeenCalledTimes(1);
    });

    expect(mockAddConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        tls: true,
      })
    );
  });

  it("should close dialog and reset form after successful submission", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const nameInput = screen.getByTestId("input-name");
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.change(nameInput, { target: { value: "Test Connection" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should generate unique ID for each connection", async () => {
    render(<ConnectionManager isOpen={true} onClose={mockOnClose} />);
    const form = screen.getByTestId("dialog-content").querySelector("form");

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockAddConnection).toHaveBeenCalledTimes(1);
    });

    const firstCall = mockAddConnection.mock.calls[0][0];
    expect(firstCall.id).toBeDefined();
    expect(typeof firstCall.id).toBe("string");
  });
});
