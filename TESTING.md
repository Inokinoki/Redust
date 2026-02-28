# Testing Guide

This document provides guidance for running and writing tests in the Redust project.

## Running Tests

### Unit & Integration Tests

```bash
# Run all unit and integration tests
npm test

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

E2E tests use Playwright and require the dev server to be running.

```bash
# Start dev server in one terminal
npm run dev

# Run E2E tests in another terminal
npm run test:e2e
```

## Test Structure

### Unit Tests

Location: `src/test/`

Tests individual units of code:

- **Store Tests**: State management for theme, connections, keys, split pane, command palette
- **Hook Tests**: Custom React hooks (useDebounce, useEfficientUpdates)
- **Utility Tests**: Helper functions and utilities

### Integration Tests

Location: `src/test/integration/`

Tests API integration with mocked Tauri backend:

- **API Tests**: All Redis data type operations (String, Hash, List, Set, ZSet, Streams, TimeSeries, Search, Vector)

### Component Tests

Location: `src/test/components/`

Tests React components with mocked stores:

- **ThemeToggle**: Theme switching functionality
- More component tests can be added following this pattern

### E2E Tests

Location: `e2e/`

End-to-end tests with Playwright:

- Application loads correctly
- UI elements render properly
- Responsive behavior
- Cross-browser testing (Chrome, Firefox, Safari)

## Test Coverage

Current coverage: 100% lines, 100% functions (for tested modules)

Run `npm run test:coverage` to generate coverage reports in `coverage/` directory.

## Writing Tests

### Unit Test Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("FunctionName", () => {
  beforeEach(() => {
    // Setup before each test
  });

  it("should do something", () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Hook Test Pattern

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("HookName", () => {
  it("should behave correctly", () => {
    const { result } = renderHook(() => useHook());

    act(() => {
      // Trigger hook updates
    });

    expect(result.current).toBe(expected);
  });
});
```

### Component Test Pattern

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  it("should render and handle interaction", () => {
    render(<Component />);

    // Query elements
    const button = screen.getByRole("button");

    // Interact with component
    await userEvent.click(button);

    // Assert results
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

### E2E Test Pattern

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("should complete user flow", async ({ page }) => {
    // Navigate to page
    await page.goto("http://localhost:5173");

    // Perform actions
    await page.click("button");
    await page.fill("input", "value");

    // Verify results
    await expect(page).toHaveTitle("Expected Title");
  });
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly with setup, action, and assertion phases
2. **Descriptive Names**: Use test names that clearly describe what is being tested
3. **Mock External Dependencies**: Use Vitest mocks for external APIs (Tauri, localStorage, etc.)
4. **Test Edge Cases**: Include tests for error states, empty inputs, and boundary conditions
5. **Avoid Test Flakiness**: Use proper async/await handling and timers for debounced operations
6. **Keep Tests Focused**: Each test should verify one specific behavior

## CI/CD

Tests are configured to run on CI/CD via GitHub Actions. See `.github/workflows/` for workflow configuration.
