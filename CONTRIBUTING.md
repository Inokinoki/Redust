# Contributing to Redust

Thank you for your interest in contributing to Redust! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Welcome contributors of all backgrounds and experience levels

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/redust.git`
3. **Add upstream remote**: `git remote add upstream https://github.com/your-org/redust.git`
4. **Create a branch**: `git checkout -b feature/your-feature-name`

---

## Development Setup

### Prerequisites

- Rust 1.70+
- Node.js 18+
- Redis instance (for integration testing)

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install system dependencies (Ubuntu/Debian)
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Run Development Mode

```bash
npm run tauri dev
```

### Run Tests

```bash
# Unit and integration tests
npm test

# Tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests** and ensure they pass:
   ```bash
   npm test
   npm run test:e2e
   ```

3. **Run linting and type checking**:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

4. **Create a pull request** with:
   - Clear title describing the change
   - Description of what was changed and why
   - Reference to any related issues
   - Screenshots for UI changes

5. **Request review** from maintainers

6. **Address feedback** and update your PR

---

## Coding Standards

### Rust (Backend)

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `clippy` for linting: `cargo clippy --all-targets`
- Format with `rustfmt`: `cargo fmt`
- Document public APIs with doc comments

```rust
/// Creates a new Redis connection.
///
/// # Arguments
///
/// * `host` - The Redis server hostname
/// * `port` - The Redis server port
///
/// # Returns
///
/// A `Connection` struct on success, or an error message on failure.
#[tauri_command]
pub async fn connect(host: String, port: u16) -> Result<Connection, String> {
    // Implementation
}
```

### TypeScript/React (Frontend)

- Use TypeScript for all new code
- Follow ESLint rules: `npm run lint`
- Format with Prettier: `npm run format`
- Use functional components with hooks
- Keep components small and focused

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ isOpen, onClose, title }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {/* Content */}
      </div>
    </div>
  );
}
```

### File Naming

- **Rust**: `snake_case.rs` (e.g., `connection_manager.rs`)
- **TypeScript/React**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Tests**: `*.test.ts` or `*.test.tsx`

---

## Testing

### Types of Tests

1. **Unit Tests**: Test individual functions and utilities
2. **Integration Tests**: Test API endpoints and Redis operations
3. **Component Tests**: Test React components in isolation
4. **E2E Tests**: Test complete user flows with Playwright

### Writing Tests

```typescript
// Example: Unit test
describe("connectionStore", () => {
  it("should add a new connection", () => {
    const { addConnection } = useConnectionStore.getState();
    const connection = {
      id: "test-1",
      name: "Test Connection",
      host: "localhost",
      port: 6379,
    };

    addConnection(connection);

    const state = useConnectionStore.getState();
    expect(state.connections).toContainEqual(connection);
  });
});
```

### Running Specific Tests

```bash
# Run a specific test file
npm test src/test/connectionStore.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="connection"

# Run E2E tests for a specific feature
npm run test:e2e -- connection.spec.ts
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

### Examples

```
feat(vector-search): Add hybrid search support

Implemented hybrid search combining vector similarity with Redis filters.
Adds new FT.SEARCH command builder with filter support.

Closes #123
```

```
fix(console): Prevent command history duplicate entries

Fixed issue where pressing Enter multiple times would add
duplicate commands to the history.

Fixes #456
```

```
chore(deps): Update react to 18.3.0

Bumps react from 18.2.0 to 18.3.0. Includes security patches
and performance improvements.
```

---

## Architecture Overview

### Frontend (`src/`)

- **Components**: React UI components
- **Hooks**: Custom React hooks for reusable logic
- **Stores**: Zustand state management
- **Lib**: Utility functions and API wrappers

### Backend (`src-tauri/`)

- **Commands**: Tauri command handlers (one per feature)
- **Models**: Data structures and DTOs
- **Redis Client**: Redis connection and operations

---

## Questions?

- Open an issue for bugs or feature requests
- Join discussions in GitHub Discussions
- Check existing issues before creating new ones

---

## License

By contributing to Redust, you agree that your contributions will be licensed under the AGPL-3.0 license.
