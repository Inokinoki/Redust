# Redust - Next-Gen Redis GUI Client

**Lightning-fast Redis GUI with AI-powered insights and vector search support**

---

## 🚀 Quick Overview

Redust is a next-generation, cross-platform Redis GUI client built with Tauri (Rust + React) that provides a modern, performant interface for managing Redis with first-class support for Redis Enterprise features including vector search, embedding caching, and LLM conversation interfaces.

### Why Redust?

- **⚡ Blazing Fast**: Tauri-powered - 58% less memory than Electron, <500ms startup
- **🤖 AI-Native**: Built-in vector search and LLM conversation support
- **🎨 Modern UX**: Command palette, split panes, keyboard-first design
- **🔒 Secure**: Capability-based permissions, encrypted connection storage
- **📊 Real-Time**: Live monitoring dashboards, pub/sub streaming

---

## 🎯 Target Features (v1.0 MVP)

### Core Redis Operations
- ✅ Multi-connection management (SSH tunneling, SSL/TLS, Cluster, Sentinel)
- ✅ Virtualized key browser (100k+ keys without lag)
- ✅ CRUD for all data types (String, Hash, List, Set, ZSet, JSON, Stream)
- ✅ CLI console with autocomplete
- ✅ TTL management and bulk operations

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
- ✅ Import/Export (JSON, CSV, Redis dump)
- ✅ Lua script editor

---

## 🛠 Tech Stack

| Layer | Technology | Why? |
|-------|------------|------|
| **Framework** | Tauri 2.x | Small bundle, native performance, secure |
| **Frontend** | React + TypeScript | Largest ecosystem for dev tools |
| **UI Components** | shadcn/ui | Modern, customizable, accessible |
| **State** | Zustand | Lightweight, TypeScript-first |
| **Backend** | Rust | Performance, safety, excellent Redis support |
| **Redis Client** | redis-rs | Full Redis features, async, cluster support |
| **Styling** | Tailwind CSS | Fast, utility-first, dark mode |

---

## 📦 Project Structure

```
redust/
├── src-tauri/          # Rust backend (Redis operations, LLM integration)
├── src/                # React frontend (UI, state management)
├── tests/              # Unit, integration, E2E tests
├── docs/               # Documentation
└── scripts/            # Build/deployment scripts
```

---

## 🗓 Development Timeline

### Month 1: Foundation
- Project setup, connection management
- Key browser, CRUD operations
- CLI console

### Month 2: AI Features
- RedisSearch with Vector
- Embedding cache management
- LLM conversation UI

### Month 3: Enterprise
- Cluster/Sentinel support
- Performance monitoring
- Security, import/export

### Month 4: Polish
- Performance optimization
- UX polish, testing
- Documentation, v1.0 launch

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

---

## 📊 Status

- [x] Project initialization
- [ ] Core Redis operations
- [ ] Vector search integration
- [ ] LLM conversation UI
- [ ] Performance optimization
- [ ] v1.0 release
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

*Built with ❤️ by the Redust team*
