🎯 Features
Core Simulation Engine
Mapping Schemes: Direct Mapped, Fully Associative, N-Way Set Associative (2/4/8-way)
Replacement Policies: LRU (Least Recently Used), FIFO (First In First Out), Random
Write Policies: Write-Through vs Write-Back (with dirty bit tracking)
Write Allocate: Write Allocate vs No-Write Allocate
Configurable Hardware:
Main Memory Size (Bytes/KB)
Cache Size (Bytes/KB)
Block/Line Size (Bytes)
Address Bus Width (16-bit or 32-bit)
Hit Time & Miss Penalty (cycles)
Interactive Visualization
Binary Address Parsing — Real-time bit-split visualization (Tag / Index / Offset)
Step-by-Step Execution — Manual step or auto-run with adjustable speed
Cache Grid Display — Full cache array with Valid/Dirty bits, Tags, hit/miss highlighting
Animated Feedback — Green pulse for hits, red pulse for misses, purple for evictions
Workload Generation & Analysis
Workload Type	Locality Pattern	Use Case
Sequential	Spatial	Array traversal
Strided	Spatial (strided)	Matrix column access
Random	None	Worst-case analysis
Matrix Multiply	Spatial + Temporal	Numerical computing
Loop	Temporal	Repeated iterations
Trace File Support — Upload .txt files (R/W 0xHEX_ADDRESS format)
Live Metrics Dashboard — Hits, Misses, Hit Rate, Miss Rate, AMAT
Charts — Hit/Miss trends, Hit Rate over time, Miss type breakdown (Recharts)
Educational Features
Explanation Mode — Human-readable step-by-step logic for every access:
"Miss (Compulsory): Set 2, Index 10 was empty"
"Hit: Tag 0x0A matched in Set 1, Way 0"
Pre-configured Demos:
Temporal Locality — Repeated loop access
Spatial Locality — Sequential array traversal
Direct Mapping Conflicts — Strided access causing conflict misses
Set Associative vs Direct — Same workload, different mapping
Write Policy Comparison — Write-through vs Write-back
Fully Associative LRU — Optimal replacement policy
🛠 Tech Stack
Layer	Technology
Framework	React 19 + TypeScript + Vite
Styling	Tailwind CSS + Lucide Icons
Charts	Recharts
State	Zustand (with subscribeWithSelector)
Engine	Pure TypeScript (in-browser, no WASM)
Build	Vite + esbuild
🚀 Quick Start
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
Requirements: Node.js 18+

📁 Project Structure
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
Zustand Store
Atomic selectors prevent unnecessary re-renders
Actions separated from state for stability
subscribeWithSelector for performance
🎓 Educational Use Cases
Course Topic	Demo / Feature
Memory Hierarchy	AMAT calculation with configurable hit/miss penalty
Mapping Techniques	Visual comparison: Direct vs Set-Associative vs Fully
Replacement Policies	LRU vs FIFO vs Random on same workload
Write Policies	Dirty bit tracking, writeback on eviction
Locality	Temporal (loop) vs Spatial (sequential) workloads
Conflict Misses	Strided access in direct-mapped cache
📸 Screenshots
Add screenshots here showing:

Address bit parsing visualization
Cache grid with hit/miss highlighting
Analytics charts
Explanation panel
🔧 Configuration
All parameters adjustable via sidebar:

interface CacheConfig {
  memorySize: 64 * 1024;      // 64 KB
  cacheSize: 4 * 1024;        // 4 KB
  blockSize: 64;              // 64 bytes
  addressWidth: 16;           // 16 or 32
  mappingScheme: 'direct' | 'fully-associative' | 'set-associative';
  associativity: 1 | 2 | 4 | 8;
  replacementPolicy: 'lru' | 'fifo' | 'random';
  writePolicy: 'write-through' | 'write-back';
  writeAllocatePolicy: 'write-allocate' | 'no-write-allocate';
  hitTime: 1;                 // cycles
  missPenalty: 20;            // cycles
}
🧪 Testing
# Type checking
npm run build

# Linting (if configured)
npm run lint
📦 Deployment
npm run build
# Deploy ./dist to any static host:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
🤝 Contributing
Fork the repository
Create feature branch: git checkout -b feature/amazing-feature
Commit changes: git commit -m 'Add amazing feature'
Push branch: git push origin feature/amazing-feature
Open Pull Request
📄 License
MIT License — Feel free to use in courses, research, or personal projects.

🙏 Acknowledgments
Computer Architecture course materials (Patterson & Hennessy)
Cache replacement policy literature (LRU, FIFO, Random)
Recharts for beautiful visualizations
Zustand for lightweight state management
📞 Support
Issues: GitHub Issues tab
Discussions: GitHub Discussions
Course Integration: Works with standard CA curricula (CS3XX level)
Built for Computer Architecture Education — Making cache behavior visible, interactive, and understandable.
