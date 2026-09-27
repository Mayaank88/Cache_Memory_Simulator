# Interactive Cache Memory Simulator & Learning Tool

A production-ready, browser-based cache memory simulator designed for 3rd-year Computer Science Engineering coursework. Built with React, TypeScript, and modern web technologies — **zero backend required**.

---

## 🎯 Features

### Core Simulation Engine
- **Mapping Schemes**: Direct Mapped, Fully Associative, N-Way Set Associative (2/4/8-way)
- **Replacement Policies**: LRU (Least Recently Used), FIFO (First In First Out), Random
- **Write Policies**: Write-Through vs Write-Back (with dirty bit tracking)
- **Write Allocate**: Write Allocate vs No-Write Allocate
- **Configurable Hardware**:
  - Main Memory Size (Bytes/KB)
  - Cache Size (Bytes/KB)
  - Block/Line Size (Bytes)
  - Address Bus Width (16-bit or 32-bit)
  - Hit Time & Miss Penalty (cycles)

### Interactive Visualization
- **Binary Address Parsing** — Real-time bit-split visualization (Tag / Index / Offset)
- **Step-by-Step Execution** — Manual step or auto-run with adjustable speed
- **Cache Grid Display** — Full cache array with Valid/Dirty bits, Tags, hit/miss highlighting
- **Animated Feedback** — Green pulse for hits, red pulse for misses, purple for evictions

### Workload Generation & Analysis
| Workload Type | Locality Pattern | Use Case |
|--------------|-----------------|----------|
| Sequential | Spatial | Array traversal |
| Strided | Spatial (strided) | Matrix column access |
| Random | None | Worst-case analysis |
| Matrix Multiply | Spatial + Temporal | Numerical computing |
| Loop | Temporal | Repeated iterations |

- **Trace File Support** — Upload `.txt` files (`R/W 0xHEX_ADDRESS` format)
- **Live Metrics Dashboard** — Hits, Misses, Hit Rate, Miss Rate, AMAT
- **Charts** — Hit/Miss trends, Hit Rate over time, Miss type breakdown (Recharts)

### Educational Features
- **Explanation Mode** — Human-readable step-by-step logic for every access:
  - *"Miss (Compulsory): Set 2, Index 10 was empty"*
  - *"Hit: Tag 0x0A matched in Set 1, Way 0"*
- **Pre-configured Demos**:
  1. **Temporal Locality** — Repeated loop access
  2. **Spatial Locality** — Sequential array traversal
  3. **Direct Mapping Conflicts** — Strided access causing conflict misses
  4. **Set Associative vs Direct** — Same workload, different mapping
  5. **Write Policy Comparison** — Write-through vs Write-back
  6. **Fully Associative LRU** — Optimal replacement policy

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Lucide Icons |
| Charts | Recharts |
| State | Zustand (with subscribeWithSelector) |
| Engine | Pure TypeScript (in-browser, no WASM) |
| Build | Vite + esbuild |

---

## 🚀 Quick Start

```bash
# Clone & install
git clone <repo-url>
cd cache-simulator
npm install

# Development server (hot reload)
npm run dev
# → http://localhost:3000

# Production build
npm run build
# → ./dist folder

cache-simulator/
├── src/
│   ├── engine/
│   │   └── cacheEngine.ts      # Pure TS simulation engine (zero deps)
│   ├── store/
│   │   └── simulatorStore.ts   # Zustand state management
│   ├── components/
│   │   ├── AddressInputPanel.tsx   # Config + address input + workloads
│   │   ├── AddressVisualizer.tsx   # Binary bit parsing display
│   │   ├── CacheGrid.tsx           # Interactive cache visualization
│   │   ├── AnalyticsPanel.tsx      # Metrics + charts
│   │   ├── ExplanationPanel.tsx    # Teacher-friendly explanations
│   │   ├── DemosPanel.tsx          # Pre-configured demos
│   │   └── MainLayout.tsx          # Responsive layout
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

🧠 Architecture
CacheEngine (Pure TypeScript)
Zero dependencies — Runs entirely in-browser
Immutable state transitions — Predictable, testable
Validation — Power-of-2 checks, size constraints, configurability
Extensible — Easy to add new policies/mappings

// Example usage
const engine = new CacheEngine(config);
const result = engine.processAccess(0x1A2C, AccessType.READ);
console.log(result.hit, result.explanation, result.cycles);
