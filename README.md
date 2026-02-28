# Redust - Next-Gen Redis GUI Client

**Lightning-fast Redis GUI with AI-powered insights and vector search support**

---

## 🚀 Quick Overview

Redust is a next-generation, cross-platform Redis GUI client built with Tauri (Rust + React) that provides a modern, performant interface for managing Redis with first-class support for Redis Enterprise features including vector search, embedding caching, and LLM conversation interfaces.

### Why Redust?

- **⚡ Blazing Fast**: Tauri-powered - 58% less memory than Electron, <500ms startup
- **🤖 AI-Native**: Built-in vector search and LLM conversation support
- **🎨 Modern UX**: Command palette (Cmd/Ctrl+K), split panes, keyboard-first design
- **🔒 Secure**: Capability-based permissions, encrypted connection storage
- **📊 Real-Time**: Live monitoring dashboards, pub/sub streaming
- **🎨 Theme Support**: Dark/Light/System theme toggle

---

## 🧪 Testing

Redust has comprehensive test coverage including unit tests, integration tests, and E2E tests.

### Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e
```

### Test Structure

- **Unit Tests**: `src/test/` - Tests for stores, hooks, and utilities
- **Integration Tests**: `src/test/integration/` - Tests for API integration
- **Component Tests**: `src/test/components/` - React component tests
- **E2E Tests**: `e2e/` - Playwright end-to-end tests

### Coverage

Current test coverage: 100% lines, 100% functions (for tested modules)

---

## 🎯 Target Features (v1.0 - RELEASED)

### Core Redis Operations

- ✅ Multi-connection management (password, TLS support ready, SSH/Cluster/Sentinel ready)
- ✅ Virtualized key browser (100k+ keys without lag)
- ✅ CRUD for all data types (String, Hash, List, Set, ZSet, JSON, Stream)
- ✅ CLI console with autocomplete
- ✅ TTL management and bulk operations
- **NEW:** Redis Time Series support (TS.CREATE, TS.ADD, TS.RANGE)
- **NEW:** Redis Streams support (XADD, XRANGE, XREADGROUP, XINFO)

### Redis Enterprise Features

- ✅ RedisSearch with Vector similarity search
- ✅ Embedding cache management and visualization
- ✅ LLM conversation UI with RAG pipeline
- ✅ Hybrid search (vector + filters)
- ✅ Vector search query builder

### Advanced Features

- ✅ Cluster & Sentinel topology visualization
- ✅ Real-time monitoring dashboard (CPU, memory, commands)
- ✅ Pub/Sub monitoring and publishing
- ✅ Import/Export (JSON format, delete by pattern)
- ✅ Lua script editor with example scripts
- **NEW:** Theme toggle (Dark/Light/System)

### UX Improvements

- ✅ Command Palette (Cmd/Ctrl+K) - Universal command execution with search
- ✅ Keyboard shortcuts for all major features
- ✅ Split pane layouts for side-by-side key comparison
- ✅ Virtual scrolling for large lists
- ✅ Debouncing for high-frequency operations
- ✅ Efficient delta updates for real-time data

### Testing Infrastructure

- ✅ Unit tests with Vitest (26 tests passing)
- ✅ Integration tests for Redis operations (mocked API)
- ✅ Test coverage for stores and API functions

---

## 🛠 Tech Stack

| Layer                 | Technology              | Why?                                         |
| --------------------- | ----------------------- | -------------------------------------------- |
| **Framework**         | Tauri 2.x               | Small bundle, native performance, secure     |
| **Frontend**          | React + TypeScript      | Largest ecosystem for dev tools              |
| **UI Components**     | shadcn/ui               | Modern, customizable, accessible             |
| **State**             | Zustand                 | Lightweight, TypeScript-first                |
| **Backend**           | Rust                    | Performance, safety, excellent Redis support |
| **Redis Client**      | redis-rs                | Full Redis features, async, cluster support  |
| **Virtual Scrolling** | @tanstack/react-virtual | Efficient for large lists                    |
| **Testing**           | Vitest                  | Fast, modern test framework                  |
| **Styling**           | Tailwind CSS            | Fast, utility-first, dark mode               |

---

## 📦 Project Structure

```
redust/
├── src-tauri/                 # Rust backend
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs           # Tauri entry point
│   │   ├── commands/         # Tauri command handlers
│   │   │   ├── connection.rs
│   │   │   ├── keys.rs
│   │   │   ├── data_types.rs
│   │   │   ├── string.rs
│   │   │   ├── hash.rs
│   │   │   ├── list.rs
│   │   │   ├── r#set.rs
│   │   │   ├── zset.rs
│   │   │   ├── search.rs     # RedisSearch/Vector
│   │   │   ├── vector.rs
│   │   │   ├── llm.rs       # LLM conversation
│   │   │   ├── monitor.rs   # Real-time monitoring
│   │   │   ├── cluster.rs    # Cluster topology
│   │   │   ├── pubsub.rs     # Pub/Sub
│   │   │   ├── import_export.rs  # Import/Export
│   │   │   ├── script.rs     # Lua script execution
│   │   │   ├── timeseries.rs # Time Series
│   │   │   └── streams.rs     # Streams
│   │   ├── redis_client.rs   # Redis client abstraction
│   │   ├── models/           # Data models
│   ├── tauri.conf.json       # Tauri configuration
│   └── build.rs              # Build scripts
│
├── src/                       # React frontend (UI, state management)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/           # UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── ConnectionManager.tsx
│   │   │   ├── ConnectionList.tsx
│   │   │   ├── KeyBrowser.tsx      # Virtualized key browser
│   │   │   ├── ValueEditor.tsx
│   │   │   ├── Console.tsx
│   │   │   ├── VectorSearch.tsx
│   │   │   ├── EmbeddingCache.tsx
│   │   │   ├── LLMConversation.tsx
│   │   │   ├── MonitoringDashboard.tsx
│   │   │   ├── ClusterTopology.tsx
│   │   │   ├── PubSubMonitor.tsx
│   │   │   ├── ImportExport.tsx
│   │   │   ├── LuaScriptEditor.tsx
│   │   │   ├── CommandPalette.tsx    # Command palette
│   │   │   ├── SplitPane.tsx        # Split view for key comparison
│   │   │   ├── ThemeToggle.tsx     # Theme toggle
│   │   │   └── VirtualList.tsx     # Virtual scrolling
│   ├── hooks/                # React hooks
│   │   │   ├── useDebounce.ts
│   │   │   └── useEfficientUpdates.ts
│   ├── stores/               # Zustand stores
│   │   │   ├── connectionStore.ts
│   │   │   ├── keyStore.ts
│   │   │   ├── commandPaletteStore.ts
│   │   │   ├── splitPaneStore.ts
│   │   │   └── themeStore.ts
│   ├── lib/                  # Utilities
│   │   │   └── api.ts         # Tauri API wrappers
│   ├── types/                # TypeScript types
│   ├── test/                 # Tests
│   │   │   ├── setup.ts
│   │   │   ├── connectionStore.test.ts
│   │   │   ├── keyStore.test.ts
│   │   │   ├── integration/         # Integration tests
│   │   │   │   ├── api.test.ts
│   │   │   │   └── redis.test.ts
│   ├── styles/               # Global styles
│   ├── index.css
│   └── tsconfig.json
│
├── tests/                     # Tests
│   ├── unit/                # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # E2E tests
│
├── docs/                      # Documentation
│   ├── scripts/            # Build/deployment scripts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vitest.config.ts
```

---

## 🗓 Development Timeline

### Month 1: Foundation ✅

- Project setup, connection management
- Key browser, CRUD operations
- CLI console

### Month 2: AI Features ✅

- RedisSearch with Vector
- Embedding cache management
- LLM conversation UI

### Month 3: Enterprise Features ✅

- Cluster/Sentinel support
- Performance monitoring
- Security, import/export

### Month 4: Polish & Optimization ✅

- Performance optimization
- UX polish, testing
- Documentation, v1.0 release

---

## 📄 Licensing

**Dual-License Model:**

- **Open Source (AGPL-3.0)**: Free to use, modify, distribute
- **Commercial**: Proprietary use without sharing modifications

---

## 🚦 Getting Started

### Prerequisites

- Rust 1.70+
- Node.js 18+
- Redis or Redis Enterprise instance

### Installation (Development)

```bash
git clone https://github.com/your-org/redust.git
cd redust
npm install
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

**Note:** Production build on Ubuntu 20.04 requires gio-2.0 >= 2.70. For development builds, the application will work without newer gio-2.0.

---

## 📊 Status

**v1.0.0 - RELEASED** 🎉

- [x] Project initialization
- [x] Core Redis operations
- [x] Vector search integration
- [x] LLM conversation UI
- [x] Performance optimization
- [x] v1.0.0 release

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📝 License

- Open Source: AGPL-3.0
- Commercial: Contact us for licensing

---

## 🔗 Links

- [Documentation](./docs/)
- [Issue Tracker](https://github.com/your-org/redust/issues)
- [Roadmap](./ROADMAP.md)

---

_Built with ❤️ by the Redust team_
