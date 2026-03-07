import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitPane, SplitButton } from "../../components/SplitPane";

// Mock stores
const mockSetSplitMode = vi.fn();
const mockSetLeftKey = vi.fn();
const mockSetRightKey = vi.fn();
const mockResetSplit = vi.fn();

vi.mock("../../stores/splitPaneStore", () => ({
  useSplitPaneStore: () => ({
    splitMode: "horizontal",
    leftKey: { key: "test:1", type: "string" },
    rightKey: { key: "test:2", type: "hash" },
    setSplitMode: mockSetSplitMode,
    setLeftKey: mockSetLeftKey,
    setRightKey: mockSetRightKey,
    resetSplit: mockResetSplit,
  }),
}));

// Mock UI components
vi.mock("../../components/ui/button", () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock("../../components/ValueEditor", () => ({
  ValueEditor: ({ isOpen, key, keyType, onClose }: any) =>
    isOpen ? (
      <div data-testid="value-editor" data-key={key} data-keytype={keyType}>
        <button onClick={onClose}>Close Editor</button>
      </div>
    ) : null,
}));

describe("SplitPane Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import without errors", () => {
    expect(SplitPane).toBeDefined();
    expect(typeof SplitPane).toBe("function");
  });

  it("should render when splitMode is 'horizontal'", () => {
    render(<SplitPane />);
    expect(screen.getByText("Split View - Key Comparison")).toBeInTheDocument();
  });

  it("should render both panes", () => {
    render(<SplitPane />);
    expect(screen.getByText("Left Pane")).toBeInTheDocument();
    expect(screen.getByText("Right Pane")).toBeInTheDocument();
  });

  it("should render ValueEditors when keys are set", () => {
    render(<SplitPane />);
    const editors = screen.getAllByTestId("value-editor");
    expect(editors).toHaveLength(2);
  });

  it("should show close buttons when keys are set", () => {
    render(<SplitPane />);
    const closeButtons = screen.getAllByText("✕");
    expect(closeButtons.length).toBeGreaterThan(0);
  });
});

describe("SplitButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import without errors", () => {
    expect(SplitButton).toBeDefined();
    expect(typeof SplitButton).toBe("function");
  });

  it("should show 'Close Split' when splitMode is not 'none'", () => {
    render(<SplitButton />);
    expect(screen.getByText("Close Split")).toBeInTheDocument();
  });
});
