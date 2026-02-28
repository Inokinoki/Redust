import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ThemeStore", () => {
  let useThemeStore: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock document.documentElement
    const mockElement = {
      classList: {
        classes: [] as string[],
        add: vi.fn(function (this: any, className: string) {
          this.classes.push(className);
        }),
        remove: vi.fn(function (this: any, className: string) {
          this.classes = this.classes.filter((c: string) => c !== className);
        }),
      },
    };

    Object.defineProperty(document, "documentElement", {
      value: mockElement,
      writable: true,
      configurable: true,
    });

    // Mock window.matchMedia
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    // Import themeStore after mocks are set up
    const themeModule = await import("../stores/themeStore");
    useThemeStore = themeModule.useThemeStore;
  });

  it("should initialize with dark theme by default", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("dark");
  });

  it("should set theme to light", () => {
    useThemeStore.getState().setTheme("light");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
  });

  it("should set theme to dark", () => {
    useThemeStore.getState().setTheme("dark");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("dark");
  });

  it("should set theme to system", () => {
    useThemeStore.getState().setTheme("system");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("system");
  });

  it("should toggle theme", () => {
    const initialTheme = useThemeStore.getState().theme;
    useThemeStore.getState().toggleTheme();
    const newTheme = useThemeStore.getState().theme;
    expect(newTheme).not.toBe(initialTheme);
  });

  it("should cycle through themes on toggle", () => {
    useThemeStore.getState().setTheme("dark");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("system");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("should save theme to localStorage", () => {
    (window.localStorage.getItem as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mockClear();
    useThemeStore.getState().setTheme("light");
    expect(window.localStorage.setItem).toHaveBeenCalledWith("redust-theme", "light");
  });

  it("should set effective theme to dark when theme is dark", () => {
    useThemeStore.getState().setTheme("dark");
    const state = useThemeStore.getState();
    expect(state.effectiveTheme).toBe("dark");
  });

  it("should set effective theme to light when theme is light", () => {
    useThemeStore.getState().setTheme("light");
    const state = useThemeStore.getState();
    expect(state.effectiveTheme).toBe("light");
  });

  it("should set effective theme based on system preference (dark)", () => {
    (window.matchMedia as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    useThemeStore.getState().setTheme("system");
    const state = useThemeStore.getState();
    expect(state.effectiveTheme).toBe("dark");
  });

  it("should set effective theme based on system preference (light)", () => {
    (window.matchMedia as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    useThemeStore.getState().setTheme("system");
    const state = useThemeStore.getState();
    expect(state.effectiveTheme).toBe("light");
  });

  it("should add effective theme class to document", () => {
    useThemeStore.getState().setTheme("light");
    const addCalls = (document.documentElement.classList.add as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mock.calls;
    const removeCalls = (document.documentElement.classList.remove as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mock.calls;

    const hasAddedLight = addCalls.some((call: any[]) => call.includes("light"));
    const hasRemovedDark = removeCalls.some((call: any[]) => call.includes("dark"));

    expect(hasAddedLight).toBe(true);
    expect(hasRemovedDark).toBe(true);
  });

  it("should remove previous theme class when changing themes", () => {
    useThemeStore.getState().setTheme("dark");
    const removeCalls = (document.documentElement.classList.remove as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mock.calls;

    const hasRemovedLight = removeCalls.some((call: any[]) => call.includes("light"));
    expect(hasRemovedLight).toBe(true);

    useThemeStore.getState().setTheme("system");
    const removeCalls2 = (document.documentElement.classList.remove as any // eslint-disable-next-line @typescript-eslint/no-explicit-any
.mock.calls;
    const hasRemovedDark2 = removeCalls2.some((call: any[]) => call.includes("dark"));
    expect(hasRemovedDark2).toBe(true);
  });
});
