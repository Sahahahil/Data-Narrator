# Data Storyteller & BI Studio — Main Plan & Current Status

> **Vision**: An AI-native BI platform that turns raw CSVs/SQL databases into live, interactive visual dashboards accompanied by AI-narrated data stories — all running client-side via WebAssembly.

---

## 1. Original Vision (The "North Star")

### Core Concept
A business intelligence platform that shifts analytics from **static dashboards** → **automated, exploratory data narratives**.

**Key Capabilities:**
| Pillar | Description |
|--------|-------------|
| **Data Discovery & Anomaly Detection** | AI auto-profiles uploaded data, detects outliers/trends, generates dynamic visual widgets |
| **Conversational Querying (Text-to-SQL + Visualizer)** | Plain-text → structured SQL + interactive React charts on the fly |
| **Privacy-First** | Zero data egress — raw data never leaves browser |
| **Self-Healing** | SQL errors auto-corrected via LLM feedback loop |

### Technology Stack (Target)
| Layer | Technology | Role |
|-------|------------|------|
| Frontend | React (Vite) / Next.js | Component lifecycle, UI layout |
| Local OLAP | **DuckDB-Wasm** (Web Worker) | Client-side analytical SQL execution |
| Visualization | **Recharts** (primary), D3.js | Flexible, composable React charting |
| State | TanStack Query + Zustand | Dynamic widget state, AI streaming |
| AI | Vercel AI SDK / direct LLM API | Structured JSON outputs, Text-to-SQL |

---

## 2. Theoretical Foundations

### Three Core Pillars
```
┌──────────────────────────────┐
│  Gestalt & Visual Semantics  │ ──► AI auto-selects visual encodings (Bertin's Semiology)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│    Cognitive Load Theory     │ ──► Progressive disclosure, reduces chart clutter
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Data Narrative Theory       │ ──► Data + Visuals + Contextual Narrative = Decision-ready
└──────────────────────────────┘
```

### Visual Encoding Theory (Bertin)
| Visual Variable | Best For | Example |
|-----------------|----------|---------|
| **Position/Length** | Quantities, continuous trends | Bar/Line charts |
| **Hue/Saturation** | Categorical groups, magnitude | Heatmaps, grouped bars |
| **Spatial Enclosure** | Hierarchical clusters | Treemaps |
| **Proximity** | Structural relationships | Scatter plots |

**AI's Job**: Evaluate dataset properties (cardinality, skewness, temporal ranges, variance) → map columns to optimal encodings automatically.

### Narrative Structure
Every visualization ships with three components:
1. **Data** — Exact metrics via deterministic SQL
2. **Visuals** — Auto-selected encodings
3. **Narrative** — Natural language explaining *why* metrics changed

---

## 3. Deep Technical Architecture

```
BROWSER RUNTIME (Client)
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  User Drop (CSV / Parquet)                                              │
│           │                                                             │
│           ▼                                                             │
│  ┌──────────────────────┐  Zero-Copy Arrow  ┌──────────────────────┐   │
│  │ DuckDB-Wasm Engine   │ ────────────────► │ Canvas/SVG           │   │
│  │ (Web Worker Thread)  │                   │ (Recharts/D3)        │   │
│  └──────────┬───────────┘                   └──────────────────────┘   │
│             │                                                             │
└─────────────┼────────────────────────────────────────────────────────────┘
              │ Sanitized Metadata (Schema + Stats)
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AI Orchestration Layer (LLM API)                                       │
│  - Schema Analysis  - Text-to-SQL Generation  - UI Component Synthesis  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Upload** → DuckDB-Wasm registers file in virtual FS (Web Worker)
2. **Profile** → Background scan: row counts, types, nulls, correlations, anomalies
3. **Query** → User asks question → LLM receives sanitized schema → returns `{sql, widgetType, chartConfig}`
4. **Execute** → SQL runs locally in DuckDB → Arrow table → JS objects
5. **Render** → Dynamic React component factory builds chart from `chartConfig`
6. **Narrate** → LLM-generated description embedded with chart

### Self-Healing Loop
```
User Query → LLM SQL → DuckDB Error → Refinement Prompt (with error) → Corrected SQL → Success
```

---

## 4. Current Project Status (as of 2026-11-05)

### ✅ What Exists

#### Configuration & Infrastructure
| File | Status |
|------|--------|
| `package.json` | ✅ Complete — deps: `react`, `@duckdb/duckdb-wasm`, `recharts`, `vitest`, `tailwind` |
| `tsconfig.json` | ✅ Complete — strict mode, ESNext, React JSX |
| `vitest.config.ts` | ✅ Complete — jsdom, globals, react plugin |
| `tailwind.config.js` | ✅ Complete — custom slate palette |
| `README.md` | ✅ Complete — documents vision, architecture, usage |

#### Data Layer (src/data/) — **Mock Implementations**
| File | Lines | Status |
|------|-------|--------|
| `duckdbManager.ts` | 40 | ⚠️ **Mock** — creates dummy Worker, returns fake connection |
| `fileRegistry.ts` | 14 | ⚠️ **Mock** — calls non-existent `registerFileHandle` |
| `queryExecutor.ts` | 10 | ⚠️ **Mock** — delegates to mock connection |
| `schemaInspector.ts` | 26 | ⚠️ **Mock** — assumes working connection |

#### AI Layer (src/ai/) — **Mock Implementations**
| File | Lines | Status |
|------|-------|--------|
| `llmClient.ts` | 75 | ⚠️ **Mock** — hardcoded responses, simulates timeout |
| `promptBuilder.ts` | 48 | ✅ **Real logic** — builds schema-aware prompts, truncates samples |
| `responseParser.ts` | 37 | ✅ **Real logic** — validates JSON schema strictly |
| `selfHealingController.ts` | 48 | ✅ **Real logic** — retry loop with error feedback |

#### Tests — **Comprehensive Coverage for Mocks**
- All data layer modules: `tests/data/*.test.ts` ✅
- All AI layer modules: `tests/ai/*.test.ts` ✅
- UI factory test exists but **imports non-existent modules**: `tests/ui/widgetFactory.test.ts`

### ❌ What's Missing (The Actual App)

| Category | Missing Files |
|----------|---------------|
| **Entry Point** | `src/main.tsx`, `src/App.tsx`, `src/index.css` |
| **HTML Template** | `public/index.html` |
| **Vite Config** | `vite.config.ts` (only `vitest.config.ts` exists) |
| **PostCSS Config** | `postcss.config.js` |
| **UI Layer** | `src/ui/widgetFactory.ts`, `src/ui/*` |
| **Widget Components** | `src/widgets/LineChart.tsx`, `BarChart.tsx`, `ScatterPlot.tsx`, `KPICard.tsx` |
| **Real DuckDB Integration** | Actual `@duckdb/duckdb-wasm` initialization in Worker |
| **Real LLM Integration** | Actual API calls (currently hardcoded mocks) |
| **File Upload UI** | Drag-drop, file picker, progress indicators |
| **Chat/Query UI** | Natural language input, streaming response display |
| **Dashboard Layout** | Grid system, widget containers, responsive design |

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Runnable dev server with real DuckDB-Wasm

| Task | Details |
|------|---------|
| 1.1 Create `vite.config.ts` | React + Tailwind + Worker plugin for DuckDB |
| 1.2 Create `public/index.html` | Basic HTML shell, CSP for WASM |
| 1.3 Create `src/main.tsx` + `src/App.tsx` + `src/index.css` | Entry point, root component, global styles |
| 1.4 Implement **real DuckDBManager** | Load `@duckdb/duckdb-wasm` in Web Worker, register files via `BROWSER_FILEREAD` |
| 1.5 Add file upload UI | Drag-drop zone, file validation (CSV/Parquet), progress |
| 1.6 Wire FileRegistry → real DuckDB | Replace mock with actual `registerFileHandle` |

**Verification**: `npm run dev` → upload CSV → see table registered in DevTools

---

### Phase 2: AI Integration (Week 2-3)
**Goal**: Natural language → SQL + chart config → rendered chart

| Task | Details |
|------|---------|
| 2.1 Replace `LLMClient` mock | Real API calls (OpenAI/Anthropic/Vercel AI SDK), streaming support |
| 2.2 Add `.env` for API keys | `VITE_LLM_API_KEY`, `VITE_LLM_ENDPOINT` |
| 2.3 Build **PromptBuilder** enhancements | Include full schema, sample values, distinct categories |
| 2.4 Implement **Dynamic Widget Factory** | `src/ui/widgetFactory.ts` → maps `widgetType` to chart components |
| 2.5 Create **Widget Components** | `LineChart`, `BarChart`, `ScatterPlot`, `KPICard` using Recharts |
| 2.6 Build **Query Input UI** | Text area, submit, loading state, error display |

**Verification**: Ask "Show revenue by month" → see line chart + narrative

---

### Phase 3: Self-Healing & Polish (Week 3-4)
**Goal**: Production-grade robustness

| Task | Details |
|------|---------|
| 3.1 Implement **SelfHealingController** fully | Catch DuckDB errors → send to LLM with error context → retry |
| 3.2 Add **Data Profiling** background job | Web Worker: row counts, null %, correlations, anomaly flags |
| 3.3 Build **Auto-Dashboard** on upload | AI generates 3-5 initial widgets from profile |
| 3.4 Add **Export** (PNG/CSV) | Recharts `toDataURL`, CSV download |
| 3.5 Polish UI/UX | Dark mode (slate palette), responsive grid, loading skeletons |
| 3.6 Add **TypeScript strictness** | Enable all strict flags, fix `any` types |

---

### Phase 4: Advanced Features (Future)
| Feature | Description |
|---------|-------------|
| Multi-file joins | Relate multiple uploaded datasets |
| Saved narratives | Persist stories to localStorage/IndexedDB |
| Custom viz templates | User-defined chart specifications |
| PDF/PowerPoint export | Report generation |
| Collaboration | Requires backend (WebRTC or server) |

---

## 6. Immediate Next Steps (Start Here)

```bash
# 1. Create missing config files
touch vite.config.ts postcss.config.js

# 2. Create public/index.html
# 3. Create src/main.tsx, src/App.tsx, src/index.css
# 4. Implement real DuckDBManager (replace mock)
# 5. Run: npm run dev
```

### Critical Files to Create First (in order)
1. **`vite.config.ts`** — enables dev server, WASM worker loading, Tailwind
2. **`public/index.html`** — mount point, CSP headers for WASM
3. **`src/main.tsx`** — React 18 root, strict mode
4. **`src/App.tsx`** — layout: file upload + query input + widget grid
5. **`src/data/duckdbManager.ts`** — **REWRITE** with real `@duckdb/duckdb-wasm` init

---

## 7. Architecture Decisions Log

| Decision | Rationale | Revisit If |
|----------|-----------|------------|
| **Vite over Next.js** | Simpler WASM worker config, pure client-side, no SSR needed | Need SEO or server components |
| **Recharts over D3/Nivo** | React-native, composable, smaller bundle, good TS support | Need custom viz not in Recharts |
| **Web Worker for DuckDB** | Keeps main thread free for UI | Bundle size becomes issue |
| **LLM returns `{sql, widgetType, chartConfig}`** | Single round-trip, decouples SQL from viz | Need more complex UI specs |
| **Mock-first TDD** | Defined interfaces before implementation | — |

---

## 8. Key Technical References

- **DuckDB-Wasm Guide**: https://duckdb.org/docs/api/wasm
- **Recharts Docs**: https://recharts.org
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Apache Arrow JS**: https://arrow.apache.org/docs/js/
- **Bertin's Semiology of Graphics** — Visual encoding theory

---

## 9. Questions / Open Decisions

1. **LLM Provider**: OpenAI, Anthropic, local (Ollama), or multi-provider via Vercel AI SDK?
2. **Auth/Privacy**: Pure localStorage for API keys, or secure proxy backend?
3. **State Management**: Start with React Context + useReducer, migrate to Zustand if needed?
4. **Chart Library Lock-in**: Abstract behind `WidgetFactory` to allow swapping?

---

*Last updated: 2026-11-05 — Run `npm run dev` to verify current state*