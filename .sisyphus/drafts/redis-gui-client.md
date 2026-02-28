# Draft: Next-Gen Redis GUI Client - **Redust**

## Project Vision
Building a next-generation, cross-platform GUI client for Redis with first-class support for Redis Enterprise features including vector search, embedding caching, and LLM conversation interfaces.

## Decisions Made

### Technology Stack
✅ **Framework:** Tauri 2.x (Rust + Web frontend)
✅ **Frontend:** React + TypeScript + shadcn/ui
✅ **Backend Language:** Rust (redis-rs client)
✅ **Platforms:** Desktop only (Windows/Mac/Linux)
✅ **Licensing:** Dual-license (Open Source AGPL-3.0 + Commercial)

### Platform Support
✅ **Desktop only**: Windows, macOS, Linux

### Feature Scope - v1.0 MVP
✅ **Core Features:**
- Multi-connection management
- Key browser with virtual scrolling (100k+ keys)
- CRUD for all Redis data types
- CLI console with autocomplete
- Real-time monitoring dashboard

✅ **Redis Enterprise Features:**
- RedisSearch with Vector similarity search
- Embedding cache management
- LLM conversation UI (RAG pipeline)
- Vector search query builder
- Hybrid search (vector + filters)

✅ **Advanced Features:**
- Cluster & Sentinel support
- Pub/Sub monitoring
- Import/export
- Lua script editor

### Target Users
✅ **Primary:** Developers and Database Administrators
✅ **Secondary:** Data scientists (for vector search/LLM features)

### Timeline
✅ **Target:** 4 months for v1.0 MVP

## Open Questions (For Stakeholders)

1. Should we prioritize performance or feature completeness for v1.0?
2. Budget allocation for development team and tooling?
3. Should we include specific enterprise-only features in commercial license?
