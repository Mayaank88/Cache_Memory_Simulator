// ============================================================================
// SIMULATOR STORE - Zustand State Management
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CacheEngine,
  DEFAULT_CONFIG,
  DEMO_PRESETS,
  parseAddress,
  validateConfig,
  AccessType,
} from '../engine/cacheEngine';
import type {
  CacheConfig,
  ParsedAddress,
  CacheSet,
  CacheStats,
  AccessResult,
  AccessLogEntry,
  MemoryAccess,
  MappingScheme,
  ReplacementPolicy,
  WritePolicy,
  WriteAllocatePolicy,
  DemoPreset,
} from '../engine/cacheEngine';

// -----------------------------------------------------------------------------
// Store Types
// -----------------------------------------------------------------------------

interface SimulatorState {
  engine: CacheEngine | null;
  config: CacheConfig;
  configErrors: Record<string, string>;
  currentAddress: number;
  currentAddressInput: string;
  parsedAddress: ParsedAddress | null;
  lastResult: AccessResult | null;
  cacheSets: CacheSet[];
  stats: CacheStats;
  isRunning: boolean;
  isStepMode: boolean;
  executionSpeed: number;
  autoRunInterval: number | null;
  workload: MemoryAccess[];
  workloadIndex: number;
  workloadType: string;
  activePanel: 'simulator' | 'analytics' | 'explanation' | 'demos';
  explanationMode: boolean;
  showBinary: boolean;
  highlightAnimation: { setIndex: number; blockIndex: number; type: 'hit' | 'miss' } | null;
  demos: DemoPreset[];
  selectedDemo: string | null;
  hitMissHistory: { step: number; hits: number; misses: number; hitRate: number }[];
  accessLog: AccessLogEntry[];
}

interface SimulatorActions {
  initialize: () => void;
  reset: () => void;
  updateConfig: (partial: Partial<CacheConfig>) => void;
  setConfig: (config: CacheConfig) => void;
  validateConfig: () => boolean;
  setAddressInput: (input: string) => void;
  parseCurrentAddress: () => ParsedAddress | null;
  step: () => AccessResult | null;
  runAuto: () => void;
  stopAuto: () => void;
  setSpeed: (speed: number) => void;
  toggleStepMode: () => void;
  generateWorkload: (type: string, count: number) => void;
  loadTraceFile: (content: string) => void;
  runWorkload: () => void;
  stepWorkload: () => AccessResult | null;
  resetWorkload: () => void;
  loadDemo: (demoName: string) => void;
  runDemo: (demoName: string) => void;
  setActivePanel: (panel: SimulatorState['activePanel']) => void;
  toggleExplanationMode: () => void;
  toggleBinary: () => void;
  setHighlightAnimation: (anim: SimulatorState['highlightAnimation']) => void;
  _updateFromEngine: () => void;
}

// -----------------------------------------------------------------------------
// Helper: Create Engine
// -----------------------------------------------------------------------------

function createEngine(config: CacheConfig): CacheEngine {
  return new CacheEngine(config);
}

// -----------------------------------------------------------------------------
// Store Definition
// -----------------------------------------------------------------------------

export const useSimulatorStore = create<SimulatorState & SimulatorActions>()(
  subscribeWithSelector((set, get) => ({
    engine: null,
    config: DEFAULT_CONFIG,
    configErrors: {},
    currentAddress: 0,
    currentAddressInput: '0x0000',
    parsedAddress: null,
    lastResult: null,
    cacheSets: [],
    stats: {
      hits: 0,
      misses: 0,
      compulsoryMisses: 0,
      capacityMisses: 0,
      conflictMisses: 0,
      totalAccesses: 0,
      readAccesses: 0,
      writeAccesses: 0,
      writebacks: 0,
      dirtyBlocks: 0,
    },
    isRunning: false,
    isStepMode: true,
    executionSpeed: 500,
    autoRunInterval: null,
    workload: [],
    workloadIndex: 0,
    workloadType: 'sequential',
    activePanel: 'simulator',
    explanationMode: true,
    showBinary: true,
    highlightAnimation: null,
    demos: DEMO_PRESETS,
    selectedDemo: null,
    hitMissHistory: [],
    accessLog: [],

    initialize: () => {
      const { config } = get();
      const engine = createEngine(config);
      set({
        engine,
        cacheSets: engine.getCache(),
        stats: engine.getStats(),
        parsedAddress: get().parseCurrentAddress(),
      });
    },

    reset: () => {
      const { engine } = get();
      if (engine) engine.reset();
      set({
        currentAddress: 0,
        currentAddressInput: '0x0000',
        parsedAddress: null,
        lastResult: null,
        cacheSets: engine?.getCache() || [],
        stats: engine?.getStats() || {
          hits: 0, misses: 0, compulsoryMisses: 0, capacityMisses: 0,
          conflictMisses: 0, totalAccesses: 0, readAccesses: 0,
          writeAccesses: 0, writebacks: 0, dirtyBlocks: 0,
        },
        isRunning: false,
        workload: [],
        workloadIndex: 0,
        highlightAnimation: null,
        hitMissHistory: [],
        accessLog: [],
        selectedDemo: null,
      });
      get().stopAuto();
    },

    updateConfig: (partial: Partial<CacheConfig>) => {
      const { engine } = get();
      if (!engine) return;
      const errors = engine.updateConfig(partial);
      const errorMap: Record<string, string> = {};
      errors.forEach(e => { errorMap[e.field] = e.message; });
      const newConfig = engine.getConfig();
      set({
        config: newConfig,
        configErrors: errorMap,
        cacheSets: engine.getCache(),
        stats: engine.getStats(),
        parsedAddress: get().parseCurrentAddress(),
        hitMissHistory: [],
        accessLog: [],
      });
    },

    setConfig: (config: CacheConfig) => {
      const { engine } = get();
      if (!engine) return;
      const errors = engine.updateConfig(config);
      const errorMap: Record<string, string> = {};
      errors.forEach(e => { errorMap[e.field] = e.message; });
      set({
        config: engine.getConfig(),
        configErrors: errorMap,
        cacheSets: engine.getCache(),
        stats: engine.getStats(),
        parsedAddress: get().parseCurrentAddress(),
        hitMissHistory: [],
        accessLog: [],
      });
    },

    validateConfig: () => {
      const { config, engine } = get();
      if (!engine) return false;
      const errors = validateConfig(config);
      const errorMap: Record<string, string> = {};
      errors.forEach(e => { errorMap[e.field] = e.message; });
      set({ configErrors: errorMap });
      return errors.length === 0;
    },

    setAddressInput: (input: string) => {
      let address = 0;
      try {
        if (input.startsWith('0x') || input.startsWith('0X')) {
          address = parseInt(input, 16);
        } else {
          address = parseInt(input, 10);
        }
        if (isNaN(address)) address = 0;
      } catch { address = 0; }
      const { config } = get();
      const maxAddress = (1 << config.addressWidth) - 1;
      if (address > maxAddress) address = maxAddress;
      const parsed = parseAddress(address, config);
      set({ currentAddressInput: input, currentAddress: address, parsedAddress: parsed });
    },

    parseCurrentAddress: () => {
      const { currentAddress, config } = get();
      return parseAddress(currentAddress, config);
    },

    step: () => {
      const { engine, currentAddress, workload, workloadIndex, isStepMode } = get();
      if (!engine) return null;
      let address = currentAddress;
      let type = AccessType.READ;
      if (!isStepMode && workload.length > 0 && workloadIndex < workload.length) {
        const access = workload[workloadIndex];
        address = access.address;
        type = access.type;
        set({ workloadIndex: workloadIndex + 1 });
      }
      const result = engine.processAccess(address, type);
      set({ highlightAnimation: { setIndex: result.setIndex, blockIndex: result.blockIndex, type: result.hit ? 'hit' : 'miss' }});
      setTimeout(() => set({ highlightAnimation: null }), 800);
      const newStats = engine.getStats();
      const hitRate = newStats.totalAccesses > 0 ? (newStats.hits / newStats.totalAccesses) * 100 : 0;
      set({
        lastResult: result,
        cacheSets: engine.getCache(),
        stats: newStats,
        hitMissHistory: [...get().hitMissHistory, { step: newStats.totalAccesses, hits: newStats.hits, misses: newStats.misses, hitRate }].slice(-100),
        accessLog: engine.getAccessLog(),
      });
      return result;
    },

    runAuto: () => {
      const { isRunning, isStepMode, workload, workloadIndex, engine, executionSpeed } = get();
      if (isRunning || !engine) return;
      if (!isStepMode && workload.length === 0) get().generateWorkload('sequential', 100);
      set({ isRunning: true });
      const interval = window.setInterval(() => {
        const state = get();
        if (state.isStepMode || (state.workload.length > 0 && state.workloadIndex >= state.workload.length)) {
          state.stopAuto();
          return;
        }
        state.step();
      }, executionSpeed);
      set({ autoRunInterval: interval });
    },

    stopAuto: () => {
      const { autoRunInterval } = get();
      if (autoRunInterval) {
        clearInterval(autoRunInterval);
        set({ autoRunInterval: null, isRunning: false });
      }
    },

    setSpeed: (speed: number) => {
      set({ executionSpeed: speed });
      if (get().isRunning) { get().stopAuto(); get().runAuto(); }
    },

    toggleStepMode: () => {
      const { isStepMode } = get();
      set({ isStepMode: !isStepMode });
      if (!isStepMode) get().resetWorkload();
    },

    generateWorkload: (type: string, count: number) => {
      const { config } = get();
      const workload = CacheEngine.generateWorkload(type as any, config, count);
      set({ workload, workloadIndex: 0, workloadType: type, isStepMode: false });
    },

    loadTraceFile: (content: string) => {
      const workload = CacheEngine.parseTraceFile(content);
      set({ workload, workloadIndex: 0, workloadType: 'trace', isStepMode: false });
    },

    runWorkload: () => {
      const { workload } = get();
      if (workload.length === 0) return;
      set({ isStepMode: false, workloadIndex: 0 });
      get().runAuto();
    },

    stepWorkload: () => {
      const { workload, workloadIndex } = get();
      if (workloadIndex >= workload.length) return null;
      return get().step();
    },

    resetWorkload: () => set({ workloadIndex: 0 }),

    loadDemo: (demoName: string) => {
      const demo = DEMO_PRESETS.find(d => d.name === demoName);
      if (!demo) return;
      const { config } = get();
      const newConfig = { ...config, ...demo.config };
      get().setConfig(newConfig);
      get().generateWorkload(demo.workload.type, demo.workload.count);
      set({ selectedDemo: demoName, explanationMode: true, activePanel: 'explanation' });
    },

    runDemo: (demoName: string) => {
      get().loadDemo(demoName);
      get().runWorkload();
    },

    setActivePanel: (panel: SimulatorState['activePanel']) => set({ activePanel: panel }),
    toggleExplanationMode: () => set(state => ({ explanationMode: !state.explanationMode })),
    toggleBinary: () => set(state => ({ showBinary: !state.showBinary })),
    setHighlightAnimation: (anim) => set({ highlightAnimation: anim }),

    _updateFromEngine: () => {
      const { engine } = get();
      if (!engine) return;
      set({ cacheSets: engine.getCache(), stats: engine.getStats() });
    },
  }))
);

// -----------------------------------------------------------------------------
// Selectors - Simple and Stable
// -----------------------------------------------------------------------------

// Primitive selectors
export const useEngine = () => useSimulatorStore(state => state.engine);
export const useParsedAddress = () => useSimulatorStore(state => state.parsedAddress);
export const useLastResult = () => useSimulatorStore(state => state.lastResult);
export const useIsRunning = () => useSimulatorStore(state => state.isRunning);
export const useIsStepMode = () => useSimulatorStore(state => state.isStepMode);
export const useExecutionSpeed = () => useSimulatorStore(state => state.executionSpeed);
export const useWorkloadIndex = () => useSimulatorStore(state => state.workloadIndex);
export const useActivePanel = () => useSimulatorStore(state => state.activePanel);
export const useExplanationMode = () => useSimulatorStore(state => state.explanationMode);
export const useShowBinary = () => useSimulatorStore(state => state.showBinary);
export const useHighlightAnimation = () => useSimulatorStore(state => state.highlightAnimation);
export const useSelectedDemo = () => useSimulatorStore(state => state.selectedDemo);

// Object selectors - use reference equality (objects are stable in Zustand)
export const useConfig = () => useSimulatorStore(state => state.config);
export const useConfigErrors = () => useSimulatorStore(state => state.configErrors);
export const useCacheSets = () => useSimulatorStore(state => state.cacheSets);
export const useStats = () => useSimulatorStore(state => state.stats);
export const useWorkload = () => useSimulatorStore(state => state.workload);
export const useDemos = () => useSimulatorStore(state => state.demos);
export const useHitMissHistory = () => useSimulatorStore(state => state.hitMissHistory);
export const useAccessLog = () => useSimulatorStore(state => state.accessLog);

// Individual action selectors (stable)
export const useInitialize = () => useSimulatorStore(state => state.initialize);
export const useReset = () => useSimulatorStore(state => state.reset);
export const useUpdateConfig = () => useSimulatorStore(state => state.updateConfig);
export const useSetConfig = () => useSimulatorStore(state => state.setConfig);
export const useSetAddressInput = () => useSimulatorStore(state => state.setAddressInput);
export const useStep = () => useSimulatorStore(state => state.step);
export const useRunAuto = () => useSimulatorStore(state => state.runAuto);
export const useStopAuto = () => useSimulatorStore(state => state.stopAuto);
export const useSetSpeed = () => useSimulatorStore(state => state.setSpeed);
export const useToggleStepMode = () => useSimulatorStore(state => state.toggleStepMode);
export const useGenerateWorkload = () => useSimulatorStore(state => state.generateWorkload);
export const useLoadTraceFile = () => useSimulatorStore(state => state.loadTraceFile);
export const useRunWorkload = () => useSimulatorStore(state => state.runWorkload);
export const useStepWorkload = () => useSimulatorStore(state => state.stepWorkload);
export const useResetWorkload = () => useSimulatorStore(state => state.resetWorkload);
export const useLoadDemo = () => useSimulatorStore(state => state.loadDemo);
export const useRunDemo = () => useSimulatorStore(state => state.runDemo);
export const useSetActivePanel = () => useSimulatorStore(state => state.setActivePanel);
export const useToggleExplanationMode = () => useSimulatorStore(state => state.toggleExplanationMode);
export const useToggleBinary = () => useSimulatorStore(state => state.toggleBinary);
export const useSetHighlightAnimation = () => useSimulatorStore(state => state.setHighlightAnimation);

// Convenience: stable actions object - select once, never changes
const actionsSelector = (state: SimulatorState & SimulatorActions) => ({
  initialize: state.initialize,
  reset: state.reset,
  updateConfig: state.updateConfig,
  setConfig: state.setConfig,
  setAddressInput: state.setAddressInput,
  step: state.step,
  runAuto: state.runAuto,
  stopAuto: state.stopAuto,
  setSpeed: state.setSpeed,
  toggleStepMode: state.toggleStepMode,
  generateWorkload: state.generateWorkload,
  loadTraceFile: state.loadTraceFile,
  runWorkload: state.runWorkload,
  stepWorkload: state.stepWorkload,
  resetWorkload: state.resetWorkload,
  loadDemo: state.loadDemo,
  runDemo: state.runDemo,
  setActivePanel: state.setActivePanel,
  toggleExplanationMode: state.toggleExplanationMode,
  toggleBinary: state.toggleBinary,
  setHighlightAnimation: state.setHighlightAnimation,
});

let cachedActions: ReturnType<typeof actionsSelector> | null = null;
export const useSimulatorActions = () => {
  const actions = useSimulatorStore(actionsSelector);
  // Return cached version if functions are the same (they always are)
  if (cachedActions && 
      cachedActions.initialize === actions.initialize &&
      cachedActions.step === actions.step) {
    return cachedActions;
  }
  cachedActions = actions;
  return actions;
};