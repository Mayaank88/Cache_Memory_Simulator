// ============================================================================
// CACHE MEMORY SIMULATION ENGINE
// Pure TypeScript implementation - Zero dependencies, runs entirely in-browser
// ============================================================================

// -----------------------------------------------------------------------------
// Types & Enums
// -----------------------------------------------------------------------------

export enum MappingScheme {
  DIRECT = 'direct',
  FULLY_ASSOCIATIVE = 'fully-associative',
  SET_ASSOCIATIVE = 'set-associative',
}

export enum ReplacementPolicy {
  LRU = 'lru',
  FIFO = 'fifo',
  RANDOM = 'random',
}

export enum WritePolicy {
  WRITE_THROUGH = 'write-through',
  WRITE_BACK = 'write-back',
}

export enum WriteAllocatePolicy {
  WRITE_ALLOCATE = 'write-allocate',
  NO_WRITE_ALLOCATE = 'no-write-allocate',
}

export enum AccessType {
  READ = 'read',
  WRITE = 'write',
}

export interface CacheConfig {
  memorySize: number;           // Main memory size in bytes
  cacheSize: number;            // Cache size in bytes
  blockSize: number;            // Block/line size in bytes
  addressWidth: 16 | 32;        // Address bus width
  mappingScheme: MappingScheme;
  associativity: number;        // 1 for direct, N for N-way, 0 for fully-associative
  replacementPolicy: ReplacementPolicy;
  writePolicy: WritePolicy;
  writeAllocatePolicy: WriteAllocatePolicy;
  hitTime: number;              // Cycles for cache hit
  missPenalty: number;          // Cycles for cache miss
}

export interface ParsedAddress {
  raw: number;
  binary: string;
  hex: string;
  tag: number;
  index: number;
  offset: number;
  tagBits: string;
  indexBits: string;
  offsetBits: string;
  tagBitLength: number;
  indexBitLength: number;
  offsetBitLength: number;
}

export interface CacheBlock {
  valid: boolean;
  dirty: boolean;
  tag: number;
  data: Uint8Array;             // Block data (simulated)
  timestamp: number;            // For LRU/FIFO tracking
  accessCount: number;          // For statistics
}

export interface CacheSet {
  blocks: CacheBlock[];
  setIndex: number;
}

export interface MemoryAccess {
  address: number;
  type: AccessType;
  data?: Uint8Array;
}

export interface AccessResult {
  hit: boolean;
  missType: 'compulsory' | 'capacity' | 'conflict' | 'none';
  evicted: boolean;
  evictedBlock?: CacheBlock;
  dirtyWriteback: boolean;
  cycles: number;
  parsedAddress: ParsedAddress;
  setIndex: number;
  blockIndex: number;
  explanation: string;
}

export interface SimulationState {
  cache: CacheSet[];
  stats: CacheStats;
  accessLog: AccessLogEntry[];
  currentStep: number;
  isRunning: boolean;
  speed: number;                // Steps per second in auto mode
}

export interface CacheStats {
  hits: number;
  misses: number;
  compulsoryMisses: number;
  capacityMisses: number;
  conflictMisses: number;
  totalAccesses: number;
  readAccesses: number;
  writeAccesses: number;
  writebacks: number;
  dirtyBlocks: number;
}

export interface AccessLogEntry {
  step: number;
  address: number;
  type: AccessType;
  result: AccessResult;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function log2(n: number): number {
  return Math.log2(n);
}

function toBinaryString(num: number, width: number): string {
  return num.toString(2).padStart(width, '0');
}

function toHexString(num: number, width: number): string {
  return '0x' + num.toString(16).toUpperCase().padStart(width / 4, '0');
}

// -----------------------------------------------------------------------------
// Configuration Validation
// -----------------------------------------------------------------------------

export function validateConfig(config: Partial<CacheConfig>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.memorySize || config.memorySize <= 0) {
    errors.push({ field: 'memorySize', message: 'Memory size must be greater than 0' });
  } else if (!isPowerOfTwo(config.memorySize)) {
    errors.push({ field: 'memorySize', message: 'Memory size must be a power of 2' });
  }

  if (!config.cacheSize || config.cacheSize <= 0) {
    errors.push({ field: 'cacheSize', message: 'Cache size must be greater than 0' });
  } else if (!isPowerOfTwo(config.cacheSize)) {
    errors.push({ field: 'cacheSize', message: 'Cache size must be a power of 2' });
  }

  if (!config.blockSize || config.blockSize <= 0) {
    errors.push({ field: 'blockSize', message: 'Block size must be greater than 0' });
  } else if (!isPowerOfTwo(config.blockSize)) {
    errors.push({ field: 'blockSize', message: 'Block size must be a power of 2' });
  }

  if (config.cacheSize && config.blockSize && config.cacheSize < config.blockSize) {
    errors.push({ field: 'cacheSize', message: 'Cache size must be >= block size' });
  }

  if (config.memorySize && config.cacheSize && config.memorySize < config.cacheSize) {
    errors.push({ field: 'memorySize', message: 'Memory size must be >= cache size' });
  }

  if (config.addressWidth && ![16, 32].includes(config.addressWidth)) {
    errors.push({ field: 'addressWidth', message: 'Address width must be 16 or 32 bits' });
  }

  if (config.mappingScheme === MappingScheme.SET_ASSOCIATIVE) {
    if (!config.associativity || config.associativity < 2) {
      errors.push({ field: 'associativity', message: 'Associativity must be >= 2 for set-associative' });
    } else if (!isPowerOfTwo(config.associativity)) {
      errors.push({ field: 'associativity', message: 'Associativity must be a power of 2' });
    }
  }

  // Validate derived parameters
  if (config.cacheSize && config.blockSize) {
    const numBlocks = config.cacheSize / config.blockSize;
    if (!Number.isInteger(numBlocks)) {
      errors.push({ field: 'blockSize', message: 'Cache size must be divisible by block size' });
    }
  }

  if (config.mappingScheme === MappingScheme.SET_ASSOCIATIVE && config.cacheSize && config.blockSize && config.associativity) {
    const numSets = (config.cacheSize / config.blockSize) / config.associativity;
    if (!Number.isInteger(numSets)) {
      errors.push({ field: 'associativity', message: 'Number of sets must be integer (cacheSize / (blockSize * associativity))' });
    }
    if (!isPowerOfTwo(numSets)) {
      errors.push({ field: 'associativity', message: 'Number of sets must be a power of 2' });
    }
  }

  return errors;
}

// -----------------------------------------------------------------------------
// Address Parsing
// -----------------------------------------------------------------------------

export function parseAddress(address: number, config: CacheConfig): ParsedAddress {
  const numBlocks = config.cacheSize / config.blockSize;
  const offsetBits = log2(config.blockSize);

  let indexBits: number;
  let tagBits: number;

  switch (config.mappingScheme) {
    case MappingScheme.DIRECT:
      indexBits = log2(numBlocks);
      tagBits = config.addressWidth - indexBits - offsetBits;
      break;
    case MappingScheme.FULLY_ASSOCIATIVE:
      indexBits = 0;
      tagBits = config.addressWidth - offsetBits;
      break;
    case MappingScheme.SET_ASSOCIATIVE:
      const numSets = numBlocks / config.associativity;
      indexBits = log2(numSets);
      tagBits = config.addressWidth - indexBits - offsetBits;
      break;
  }

  const offsetMask = (1 << offsetBits) - 1;
  const indexMask = (1 << indexBits) - 1;

  const offset = address & offsetMask;
  const index = (address >> offsetBits) & indexMask;
  const tag = address >> (offsetBits + indexBits);

  const binary = toBinaryString(address, config.addressWidth);
  const tagBinary = toBinaryString(tag, tagBits);
  const indexBinary = indexBits > 0 ? toBinaryString(index, indexBits) : '';
  const offsetBinary = toBinaryString(offset, offsetBits);

  return {
    raw: address,
    binary,
    hex: toHexString(address, config.addressWidth),
    tag,
    index,
    offset,
    tagBits: tagBinary,
    indexBits: indexBinary,
    offsetBits: offsetBinary,
    tagBitLength: tagBits,
    indexBitLength: indexBits,
    offsetBitLength: offsetBits,
  };
}

// -----------------------------------------------------------------------------
// Cache Engine Class
// -----------------------------------------------------------------------------

export class CacheEngine {
  private config: CacheConfig;
  private cache: CacheSet[];
  private stats: CacheStats;
  private accessLog: AccessLogEntry[];
  private stepCounter: number;
  private globalTimestamp: number;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stepCounter = 0;
    this.globalTimestamp = 0;
    this.accessLog = [];
    this.stats = this.createInitialStats();
    this.cache = this.initializeCache();
  }

  private createInitialStats(): CacheStats {
    return {
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
    };
  }

  private initializeCache(): CacheSet[] {
    const numBlocks = this.config.cacheSize / this.config.blockSize;
    let numSets: number;
    let blocksPerSet: number;

    switch (this.config.mappingScheme) {
      case MappingScheme.DIRECT:
        numSets = numBlocks;
        blocksPerSet = 1;
        break;
      case MappingScheme.FULLY_ASSOCIATIVE:
        numSets = 1;
        blocksPerSet = numBlocks;
        break;
      case MappingScheme.SET_ASSOCIATIVE:
        numSets = numBlocks / this.config.associativity;
        blocksPerSet = this.config.associativity;
        break;
    }

    const cache: CacheSet[] = [];
    for (let setIndex = 0; setIndex < numSets; setIndex++) {
      const blocks: CacheBlock[] = [];
      for (let i = 0; i < blocksPerSet; i++) {
        blocks.push({
          valid: false,
          dirty: false,
          tag: 0,
          data: new Uint8Array(this.config.blockSize),
          timestamp: 0,
          accessCount: 0,
        });
      }
      cache.push({ blocks, setIndex });
    }
    return cache;
  }

  // -----------------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------------

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  getCache(): CacheSet[] {
    return this.cache.map(set => ({
      ...set,
      blocks: set.blocks.map(block => ({ ...block, data: new Uint8Array(block.data) })),
    }));
  }

  getStats(): CacheStats {
    // Recalculate dirty blocks count
    let dirtyCount = 0;
    for (const set of this.cache) {
      for (const block of set.blocks) {
        if (block.valid && block.dirty) dirtyCount++;
      }
    }
    return { ...this.stats, dirtyBlocks: dirtyCount };
  }

  getAccessLog(): AccessLogEntry[] {
    return [...this.accessLog];
  }

  getStepCounter(): number {
    return this.stepCounter;
  }

  reset(): void {
    this.stepCounter = 0;
    this.globalTimestamp = 0;
    this.accessLog = [];
    this.stats = this.createInitialStats();
    this.cache = this.initializeCache();
  }

  updateConfig(newConfig: Partial<CacheConfig>): ValidationError[] {
    const mergedConfig = { ...this.config, ...newConfig };
    const errors = validateConfig(mergedConfig);
    if (errors.length === 0) {
      this.config = mergedConfig;
      this.reset();
    }
    return errors;
  }

  // -----------------------------------------------------------------------------
  // Core Simulation Logic
  // -----------------------------------------------------------------------------

  processAccess(address: number, type: AccessType, data?: Uint8Array): AccessResult {
    this.stepCounter++;
    this.globalTimestamp++;

    const parsedAddress = parseAddress(address, this.config);
    const setIndex = parsedAddress.index;
    const tag = parsedAddress.tag;

    const set = this.cache[setIndex];
    let hit = false;
    let hitBlockIndex = -1;
    let missType: AccessResult['missType'] = 'none';

    // Check for hit
    for (let i = 0; i < set.blocks.length; i++) {
      const block = set.blocks[i];
      if (block.valid && block.tag === tag) {
        hit = true;
        hitBlockIndex = i;
        break;
      }
    }

    let evicted = false;
    let evictedBlock: CacheBlock | undefined;
    let dirtyWriteback = false;
    let cycles = 0;
    let explanation = '';

    if (hit) {
      // CACHE HIT
      this.stats.hits++;
      cycles = this.config.hitTime;

      const block = set.blocks[hitBlockIndex];
      block.timestamp = this.globalTimestamp;
      block.accessCount++;

      if (type === AccessType.WRITE) {
        if (this.config.writePolicy === WritePolicy.WRITE_THROUGH) {
          // Write-through: write to cache and memory (simulated)
          cycles += this.config.hitTime; // Additional cycle for memory write
          block.dirty = false; // In write-through, cache stays clean
          explanation = `Hit: Tag ${toHexString(tag, parsedAddress.tagBitLength)} matched in Set ${setIndex}. Write-through: data written to cache and memory.`;
        } else {
          // Write-back: mark dirty, write to cache only
          block.dirty = true;
          explanation = `Hit: Tag ${toHexString(tag, parsedAddress.tagBitLength)} matched in Set ${setIndex}. Write-back: data written to cache, dirty bit set.`;
        }
      } else {
        explanation = `Hit: Tag ${toHexString(tag, parsedAddress.tagBitLength)} matched in Set ${setIndex}. Data read from cache.`;
      }
    } else {
      // CACHE MISS
      this.stats.misses++;
      cycles = this.config.missPenalty + this.config.hitTime;

      // Determine miss type
      const hasEmptyBlock = set.blocks.some(b => !b.valid);
      const allBlocksValid = set.blocks.every(b => b.valid);
      const totalBlocks = this.config.cacheSize / this.config.blockSize;
      const totalValidBlocks = this.cache.flatMap(s => s.blocks).filter(b => b.valid).length;

      if (hasEmptyBlock) {
        missType = 'compulsory';
        this.stats.compulsoryMisses++;
      } else if (this.config.mappingScheme === MappingScheme.DIRECT || 
                 (this.config.mappingScheme === MappingScheme.SET_ASSOCIATIVE && this.config.associativity < totalBlocks)) {
        // In direct mapped or set associative with limited ways, check for conflict
        missType = 'conflict';
        this.stats.conflictMisses++;
      } else {
        missType = 'capacity';
        this.stats.capacityMisses++;
      }

      // Find victim block using replacement policy
      const victimIndex = this.findVictimBlock(set);
      const victimBlock = set.blocks[victimIndex];

      // Handle writeback if victim is dirty
      if (victimBlock.valid && victimBlock.dirty && this.config.writePolicy === WritePolicy.WRITE_BACK) {
        dirtyWriteback = true;
        this.stats.writebacks++;
        cycles += this.config.missPenalty; // Extra cycles for writeback
      }

      // Evict victim
      if (victimBlock.valid) {
        evicted = true;
        evictedBlock = { ...victimBlock, data: new Uint8Array(victimBlock.data) };
      }

      // Load new block
      const newBlock = set.blocks[victimIndex];
      newBlock.valid = true;
      newBlock.tag = tag;
      newBlock.timestamp = this.globalTimestamp;
      newBlock.accessCount = 1;
      newBlock.data = new Uint8Array(this.config.blockSize); // Simulate loading from memory

      if (type === AccessType.WRITE) {
        if (this.config.writePolicy === WritePolicy.WRITE_THROUGH) {
          newBlock.dirty = false;
          explanation = `Miss (${missType}): Tag ${toHexString(tag, parsedAddress.tagBitLength)} not found in Set ${setIndex}. Loaded from memory. Write-through: data written to cache and memory.`;
        } else {
          // Write-back with write-allocate
          if (this.config.writeAllocatePolicy === WriteAllocatePolicy.WRITE_ALLOCATE) {
            newBlock.dirty = true;
            explanation = `Miss (${missType}): Tag ${toHexString(tag, parsedAddress.tagBitLength)} not found in Set ${setIndex}. Write-allocate: block loaded, data written, dirty bit set.`;
          } else {
            // No-write allocate: write directly to memory, don't load into cache
            newBlock.valid = false; // Invalidate since we're not allocating
            cycles = this.config.missPenalty; // Just memory write time
            explanation = `Miss (${missType}): Tag ${toHexString(tag, parsedAddress.tagBitLength)} not found in Set ${setIndex}. No-write allocate: data written directly to memory, cache not updated.`;
          }
        }
      } else {
        newBlock.dirty = false;
        explanation = `Miss (${missType}): Tag ${toHexString(tag, parsedAddress.tagBitLength)} not found in Set ${setIndex}. Block loaded from memory.`;
      }

      if (evicted) {
        explanation += ` Evicted block with Tag ${toHexString(evictedBlock!.tag, parsedAddress.tagBitLength)}${evictedBlock!.dirty ? ' (dirty, written back)' : ''}.`;
      }
    }

    // Update stats
    this.stats.totalAccesses++;
    if (type === AccessType.READ) this.stats.readAccesses++;
    else this.stats.writeAccesses++;

    const result: AccessResult = {
      hit,
      missType,
      evicted,
      evictedBlock,
      dirtyWriteback,
      cycles,
      parsedAddress,
      setIndex,
      blockIndex: hit ? hitBlockIndex : this.findVictimBlock(set),
      explanation,
    };

    const logEntry: AccessLogEntry = {
      step: this.stepCounter,
      address,
      type,
      result,
      timestamp: Date.now(),
    };

    this.accessLog.push(logEntry);

    return result;
  }

  private findVictimBlock(set: CacheSet): number {
    switch (this.config.replacementPolicy) {
      case ReplacementPolicy.LRU:
        // Find block with oldest timestamp
        return set.blocks.reduce((oldestIdx, block, idx) => 
          !block.valid ? idx : (block.timestamp < set.blocks[oldestIdx].timestamp ? idx : oldestIdx), 0);
      
      case ReplacementPolicy.FIFO:
        // Find block with oldest timestamp (same as LRU for initial load, but doesn't update on hit)
        return set.blocks.reduce((oldestIdx, block, idx) => 
          !block.valid ? idx : (block.timestamp < set.blocks[oldestIdx].timestamp ? idx : oldestIdx), 0);
      
      case ReplacementPolicy.RANDOM:
        // Random replacement among valid blocks, prefer invalid
        const invalidIndices = set.blocks.map((b, i) => !b.valid ? i : -1).filter(i => i !== -1);
        if (invalidIndices.length > 0) return invalidIndices[0];
        return Math.floor(Math.random() * set.blocks.length);
    }
  }

  // -----------------------------------------------------------------------------
  // Batch Processing
  // -----------------------------------------------------------------------------

  processAccessBatch(accesses: MemoryAccess[]): AccessResult[] {
    return accesses.map(acc => this.processAccess(acc.address, acc.type, acc.data));
  }

  // -----------------------------------------------------------------------------
  // Workload Generation
  // -----------------------------------------------------------------------------

  static generateWorkload(type: 'sequential' | 'strided' | 'random' | 'matrix' | 'loop', 
                          config: CacheConfig, 
                          count: number): MemoryAccess[] {
    const accesses: MemoryAccess[] = [];
    const maxAddress = config.memorySize - 1;
    const blockSize = config.blockSize;

    switch (type) {
      case 'sequential':
        // Sequential access - strong spatial locality
        for (let i = 0; i < count; i++) {
          const addr = (i * 4) % maxAddress; // Word-aligned sequential
          accesses.push({ address: addr, type: AccessType.READ });
        }
        break;

      case 'strided':
        // Strided access - strided spatial locality
        const stride = blockSize * 2;
        for (let i = 0; i < count; i++) {
          const addr = (i * stride) % maxAddress;
          accesses.push({ address: addr, type: AccessType.READ });
        }
        break;

      case 'random':
        // Random access - no locality
        for (let i = 0; i < count; i++) {
          const addr = Math.floor(Math.random() * maxAddress);
          accesses.push({ address: addr, type: AccessType.READ });
        }
        break;

      case 'matrix':
        // Matrix multiplication pattern - row-major access
        const matrixSize = Math.floor(Math.sqrt(count / 3));
        for (let i = 0; i < matrixSize; i++) {
          for (let j = 0; j < matrixSize; j++) {
            // Access A[i][k]
            for (let k = 0; k < matrixSize; k++) {
              const addrA = ((i * matrixSize + k) * 8) % maxAddress;
              accesses.push({ address: addrA, type: AccessType.READ });
              // Access B[k][j]
              const addrB = ((k * matrixSize + j) * 8) % maxAddress;
              accesses.push({ address: addrB, type: AccessType.READ });
            }
            // Write C[i][j]
            const addrC = ((i * matrixSize + j) * 8) % maxAddress;
            accesses.push({ address: addrC, type: AccessType.WRITE });
            if (accesses.length >= count) break;
          }
          if (accesses.length >= count) break;
        }
        break;

      case 'loop':
        // Temporal locality - repeated loop
        const loopSize = Math.min(16, count / 4);
        const iterations = Math.floor(count / loopSize);
        for (let iter = 0; iter < iterations; iter++) {
          for (let i = 0; i < loopSize; i++) {
            const addr = (i * 4) % maxAddress;
            accesses.push({ address: addr, type: AccessType.READ });
          }
        }
        break;
    }

    return accesses.slice(0, count);
  }

  // -----------------------------------------------------------------------------
  // Trace File Parsing
  // -----------------------------------------------------------------------------

  static parseTraceFile(content: string): MemoryAccess[] {
    const lines = content.trim().split('\n');
    const accesses: MemoryAccess[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const type = parts[0].toUpperCase() === 'W' || parts[0].toUpperCase() === 'WRITE' 
          ? AccessType.WRITE : AccessType.READ;
        const address = parseInt(parts[1], parts[1].startsWith('0x') ? 16 : 10);
        if (!isNaN(address)) {
          accesses.push({ address, type });
        }
      }
    }

    return accesses;
  }

  // -----------------------------------------------------------------------------
  // AMAT Calculation
  // -----------------------------------------------------------------------------

  calculateAMAT(): number {
    const { hits, misses, totalAccesses } = this.stats;
    if (totalAccesses === 0) return 0;
    const hitRate = hits / totalAccesses;
    const missRate = misses / totalAccesses;
    return this.config.hitTime + (missRate * this.config.missPenalty);
  }

  getHitRate(): number {
    const { hits, totalAccesses } = this.stats;
    return totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0;
  }

  getMissRate(): number {
    return 100 - this.getHitRate();
  }
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

export const DEFAULT_CONFIG: CacheConfig = {
  memorySize: 64 * 1024,        // 64 KB
  cacheSize: 4 * 1024,          // 4 KB
  blockSize: 64,                // 64 bytes
  addressWidth: 16,
  mappingScheme: MappingScheme.DIRECT,
  associativity: 1,
  replacementPolicy: ReplacementPolicy.LRU,
  writePolicy: WritePolicy.WRITE_BACK,
  writeAllocatePolicy: WriteAllocatePolicy.WRITE_ALLOCATE,
  hitTime: 1,
  missPenalty: 20,
};

// -----------------------------------------------------------------------------
// Preset Demos
// -----------------------------------------------------------------------------

export interface DemoPreset {
  name: string;
  description: string;
  config: Partial<CacheConfig>;
  workload: { type: string; count: number };
  explanation: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    name: 'Temporal Locality Demo',
    description: 'Repeated access to same addresses shows high hit rate',
    config: {
      mappingScheme: MappingScheme.DIRECT,
      cacheSize: 1024,
      blockSize: 32,
    },
    workload: { type: 'loop', count: 100 },
    explanation: 'This demo shows temporal locality. The same small set of addresses is accessed repeatedly in a loop. After the first iteration (compulsory misses), all subsequent accesses hit in cache.',
  },
  {
    name: 'Spatial Locality Demo',
    description: 'Sequential array traversal benefits from block loading',
    config: {
      mappingScheme: MappingScheme.DIRECT,
      cacheSize: 2048,
      blockSize: 64,
    },
    workload: { type: 'sequential', count: 200 },
    explanation: 'This demo shows spatial locality. Sequential addresses are accessed. When a block is loaded, adjacent words in the same block are accessed next, resulting in hits.',
  },
  {
    name: 'Direct Mapping Conflict Demo',
    description: 'Multiple addresses mapping to same set cause conflict misses',
    config: {
      mappingScheme: MappingScheme.DIRECT,
      cacheSize: 1024,
      blockSize: 64,
      memorySize: 16 * 1024,
    },
    workload: { type: 'strided', count: 100 },
    explanation: 'This demo shows conflict misses in direct-mapped cache. Strided access pattern causes multiple blocks to map to the same cache set, evicting each other repeatedly.',
  },
  {
    name: 'Set Associative vs Direct',
    description: 'Comparing 4-way set associative vs direct mapping',
    config: {
      mappingScheme: MappingScheme.SET_ASSOCIATIVE,
      associativity: 4,
      cacheSize: 2048,
      blockSize: 64,
    },
    workload: { type: 'strided', count: 100 },
    explanation: 'This demo compares set-associative vs direct mapping. The same strided pattern that causes conflicts in direct mapping works well in 4-way associative cache.',
  },
  {
    name: 'Write Policy Comparison',
    description: 'Write-through vs write-back behavior',
    config: {
      mappingScheme: MappingScheme.SET_ASSOCIATIVE,
      associativity: 2,
      cacheSize: 2048,
      blockSize: 32,
      writePolicy: WritePolicy.WRITE_BACK,
      writeAllocatePolicy: WriteAllocatePolicy.WRITE_ALLOCATE,
    },
    workload: { type: 'sequential', count: 50 },
    explanation: 'This demo shows write-back behavior. Writes mark blocks dirty. Writebacks only occur on eviction. Change to write-through to see immediate memory writes.',
  },
  {
    name: 'Fully Associative with LRU',
    description: 'Best hit rate but complex hardware',
    config: {
      mappingScheme: MappingScheme.FULLY_ASSOCIATIVE,
      cacheSize: 1024,
      blockSize: 32,
      replacementPolicy: ReplacementPolicy.LRU,
    },
    workload: { type: 'random', count: 200 },
    explanation: 'Fully associative cache with LRU replacement. Any block can go anywhere. LRU tracks usage perfectly. Good for small caches but hardware cost grows quadratically.',
  },
];