// ============================================================================
// EXPLANATION PANEL - Teacher-Friendly Step-by-Step Logic Explanation
// ============================================================================

import React, { useMemo } from 'react';
import { useLastResult, useConfig, useExplanationMode, useAccessLog, useDemos, useSelectedDemo, useWorkload, useWorkloadIndex,
  useToggleExplanationMode, useSetActivePanel, useLoadDemo, useRunDemo
} from '../store/simulatorStore';
import { MappingScheme, ReplacementPolicy, WritePolicy, WriteAllocatePolicy, AccessType, DEMO_PRESETS } from '../engine/cacheEngine';
import { 
  BookOpen, Lightbulb, ArrowRight, ArrowLeft, Play, Pause, 
  SkipBack, SkipForward, ChevronDown, ChevronUp, Target, 
  AlertCircle, CheckCircle, XCircle, HelpCircle, Info, RefreshCw
} from 'lucide-react';

export const ExplanationPanel: React.FC = () => {
  const lastResult = useLastResult();
  const config = useConfig();
  const explanationMode = useExplanationMode();
  const accessLog = useAccessLog();
  const demos = useDemos();
  const selectedDemo = useSelectedDemo();
  const workload = useWorkload();
  const workloadIndex = useWorkloadIndex();
  const toggleExplanationMode = useToggleExplanationMode();
  const setActivePanel = useSetActivePanel();
  const loadDemo = useLoadDemo();
  const runDemo = useRunDemo();

  const currentStep = accessLog[accessLog.length - 1];
  const previousSteps = accessLog.slice(-10).reverse(); // Last 10 steps

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          Explanation Mode
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExplanationMode}
            className={`p-2 rounded-lg transition-colors ${
              explanationMode 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Toggle Explanation Mode"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Demo Presets */}
        <DemoPresetsSection demos={demos} selectedDemo={selectedDemo} onLoad={loadDemo} onRun={runDemo} />

        {/* Current Step Explanation */}
        {explanationMode && lastResult && (
          <CurrentStepExplanation result={lastResult} config={config} />
        )}

        {/* Step History */}
        <StepHistory steps={previousSteps} config={config} />

        {/* Educational Concepts */}
        <EducationalConcepts config={config} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Demo Presets Section
// -----------------------------------------------------------------------------

interface DemoPresetsSectionProps {
  demos: any[];
  selectedDemo: string | null;
  onLoad: (name: string) => void;
  onRun: (name: string) => void;
}

const DemoPresetsSection: React.FC<DemoPresetsSectionProps> = ({ demos, selectedDemo, onLoad, onRun }) => (
  <div className="border-b border-gray-100 pb-4 mb-4">
    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
      <Target className="w-4 h-4 text-primary-600" />
      Pre-configured Demos
    </h3>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {demos.map((demo) => (
        <div
          key={demo.name}
          className={`p-3 rounded-lg border transition-all ${
            selectedDemo === demo.name 
              ? 'border-primary-300 bg-primary-50' 
              : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${selectedDemo === demo.name ? 'text-primary-700' : 'text-gray-900'}`}>
                  {demo.name}
                </span>
                {selectedDemo === demo.name && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">Active</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{demo.description}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{demo.explanation}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onLoad(demo.name)}
                className="btn-secondary text-xs px-2 py-1"
              >
                Load
              </button>
              <button
                onClick={() => onRun(demo.name)}
                className="btn-primary text-xs px-2 py-1"
              >
                <Play className="w-3 h-3" />
                Run
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Current Step Explanation
// -----------------------------------------------------------------------------

interface CurrentStepExplanationProps {
  result: any;
  config: any;
}

const CurrentStepExplanation: React.FC<CurrentStepExplanationProps> = ({ result, config }) => {
  const { parsedAddress, hit, missType, evicted, evictedBlock, dirtyWriteback, explanation, setIndex, blockIndex, cycles } = result;
  const { tag, index, offset, tagBits, indexBits, offsetBits, tagBitLength, indexBitLength, offsetBitLength, hex } = parsedAddress;

  const mappingNames = {
    [MappingScheme.DIRECT]: 'Direct Mapped',
    [MappingScheme.FULLY_ASSOCIATIVE]: 'Fully Associative',
    [MappingScheme.SET_ASSOCIATIVE]: `${config.associativity}-Way Set Associative`,
  };

  return (
    <div className="space-y-4 mb-4">
      <div className={`p-4 rounded-xl border-2 animate-slide-in ${
        hit ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            hit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {hit ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {hit ? 'CACHE HIT ✓' : `CACHE MISS (${missType?.toUpperCase() || 'UNKNOWN'}) ✗`}
            </h4>
            <p className="text-sm text-gray-700 mt-1">{explanation}</p>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/50 p-2 rounded">
                <span className="text-gray-500">Address:</span>
                <code className="font-mono ml-1">{hex}</code>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <span className="text-gray-500">Cycles:</span>
                <span className="font-mono ml-1">{cycles}</span>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <span className="text-gray-500">Set:</span>
                <span className="font-mono ml-1">{setIndex}</span>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <span className="text-gray-500">Block/Way:</span>
                <span className="font-mono ml-1">{blockIndex}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary-600" />
          Step-by-Step Breakdown
        </h4>

        <div className="space-y-2">
          <ExplanationStep 
            number={1} 
            title="Address Parsing" 
            content={
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  The {config.addressWidth}-bit address <code className="font-mono bg-gray-100 px-1 rounded">{hex}</code> is split into three fields:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="font-medium text-blue-800">TAG ({tagBitLength} bits)</div>
                    <div className="font-mono text-blue-900">{tagBits || 'N/A'}</div>
                    <div className="text-blue-600">Value: {tagBits ? `0x${tag.toString(16).toUpperCase()}` : 'N/A'}</div>
                  </div>
                  {indexBitLength > 0 && (
                    <div className="p-2 bg-green-50 rounded border border-green-100">
                      <div className="font-medium text-green-800">INDEX ({indexBitLength} bits)</div>
                      <div className="font-mono text-green-900">{indexBits}</div>
                      <div className="text-green-600">Set: {index}</div>
                    </div>
                  )}
                  <div className="p-2 bg-amber-50 rounded border border-amber-100">
                    <div className="font-medium text-amber-800">OFFSET ({offsetBitLength} bits)</div>
                    <div className="font-mono text-amber-900">{offsetBits}</div>
                    <div className="text-amber-600">Byte: {offset}</div>
                  </div>
                </div>
              </div>
            } 
          />

          <ExplanationStep 
            number={2} 
            title="Cache Lookup" 
            content={
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  {config.mappingScheme === MappingScheme.FULLY_ASSOCIATIVE 
                    ? `Fully Associative: Compare tag ${tagBits ? `0x${tag.toString(16).toUpperCase()}` : 'N/A'} against ALL ${config.cacheSize / config.blockSize} blocks in parallel.`
                    : `Set ${index} selected by INDEX bits. Compare tag ${tagBits ? `0x${tag.toString(16).toUpperCase()}` : 'N/A'} against ${config.mappingScheme === MappingScheme.DIRECT ? '1' : config.associativity} block(s) in this set.`
                  }
                </p>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <strong>Result: </strong>
                  {hit 
                    ? `✓ Tag MATCHED in Way ${blockIndex} (Valid=1, Tag matches)`
                    : `✗ Tag NOT FOUND in Set ${index} (${missType} miss)`
                  }
                </div>
              </div>
            } 
          />

          {!hit && (
            <ExplanationStep 
              number={3} 
              title="Miss Handling & Replacement" 
              content={
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    Miss type: <strong>{missType}</strong>. 
                    {missType === 'compulsory' && 'First access to this block (cold start).'}
                    {missType === 'conflict' && 'Multiple blocks map to same set (direct/limited associativity).'}
                    {missType === 'capacity' && 'Cache is full, must evict existing block.'}
                  </p>
                  <p className="text-sm text-gray-700">
                    Replacement policy: <strong>{config.replacementPolicy.toUpperCase()}</strong>.
                    {config.replacementPolicy === ReplacementPolicy.LRU && 'Evict Least Recently Used block.'}
                    {config.replacementPolicy === ReplacementPolicy.FIFO && 'Evict First In (oldest loaded) block.'}
                    {config.replacementPolicy === ReplacementPolicy.RANDOM && 'Evict randomly selected block.'}
                  </p>
                  {evicted && evictedBlock && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-sm">
                      <strong>Evicted:</strong> Tag {`0x${evictedBlock.tag.toString(16).toUpperCase()}`} from Way {blockIndex}
                      {evictedBlock.dirty && config.writePolicy === WritePolicy.WRITE_BACK && (
                        <span className="ml-2 text-amber-700 font-medium">(Dirty → Writeback to memory)</span>
                      )}
                    </div>
                  )}
                  {!evicted && (
                    <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                      <strong>Empty slot found:</strong> No eviction needed (compulsory miss).
                    </div>
                  )}
                  <p className="text-sm text-gray-700">
                    New block loaded with Tag <code className="font-mono bg-gray-100 px-1 rounded">{tagBits ? `0x${tag.toString(16).toUpperCase()}` : 'N/A'}</code>, Valid=1.
                  </p>
                </div>
              } 
            />
          )}

          {hit && (
            <ExplanationStep 
              number={3} 
              title="Hit Processing" 
              content={
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    Block found in Way {blockIndex}. 
                    {result.type === AccessType.READ 
                      ? 'Data read from cache.' 
                      : `Write operation: ${config.writePolicy === WritePolicy.WRITE_THROUGH ? 'Write-through - data written to cache AND memory' : 'Write-back - data written to cache, dirty bit set'}`}
                  </p>
                  {config.writePolicy === WritePolicy.WRITE_BACK && result.type === AccessType.WRITE && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-sm">
                      <strong>Dirty bit set to 1</strong> - block modified, will write back on eviction.
                    </div>
                  )}
                </div>
              } 
            />
          )}

          <ExplanationStep 
            number={hit ? 4 : 4} 
            title="LRU/FIFO Update" 
            content={
              <p className="text-sm text-gray-700">
                {config.replacementPolicy === ReplacementPolicy.LRU 
                  ? 'Block timestamp updated to current time (most recently used).'
                  : config.replacementPolicy === ReplacementPolicy.FIFO
                  ? 'Block load order preserved (FIFO queue unchanged on hit).'
                  : 'No replacement metadata update needed (Random policy).'
                }
              </p>
            } 
          />
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Explanation Step Component
// -----------------------------------------------------------------------------

interface ExplanationStepProps {
  number: number;
  title: string;
  content: React.ReactNode;
}

const ExplanationStep: React.FC<ExplanationStepProps> = ({ number, title, content }) => (
  <div className="border-l-2 border-primary-200 pl-4 relative">
    <div className="absolute left-[-6px] top-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
      {number}
    </div>
    <h5 className="font-medium text-gray-900 text-sm">{title}</h5>
    <div className="mt-1 text-gray-700">{content}</div>
  </div>
);

// -----------------------------------------------------------------------------
// Step History
// -----------------------------------------------------------------------------

interface StepHistoryProps {
  steps: any[];
  config: any;
}

const StepHistory: React.FC<StepHistoryProps> = ({ steps, config }) => {
  if (steps.length === 0) return null;

  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary-600" />
        Recent Access History (Last 10)
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {steps.map((entry, idx) => (
          <div 
            key={entry.step} 
            className={`p-3 rounded-lg border transition-colors ${
              entry.result.hit ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  entry.result.hit ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {entry.result.hit ? '✓' : '✗'}
                </span>
                <div>
                  <div className="font-mono text-sm text-gray-900">
                    Step {entry.step}: {entry.type.toUpperCase()} {entry.result.parsedAddress.hex}
                  </div>
                  <div className="text-xs text-gray-500">
                    Set {entry.result.setIndex} • Way {entry.result.blockIndex} • {entry.result.cycles} cycles
                  </div>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                entry.result.hit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {entry.result.hit ? 'HIT' : entry.result.missType?.toUpperCase() || 'MISS'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2 ml-9">{entry.result.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Educational Concepts
// -----------------------------------------------------------------------------

const EducationalConcepts: React.FC<{ config: any }> = ({ config }) => (
  <div className="border-t border-gray-100 pt-4">
    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
      <Lightbulb className="w-4 h-4 text-amber-500" />
      Key Concepts
    </h3>
    <div className="space-y-3">
      <ConceptCard
        title="Locality of Reference"
        description="Programs tend to access same memory locations repeatedly (temporal) or nearby locations (spatial). Caches exploit this."
        icon={Target}
      />
      <ConceptCard
        title={config.mappingScheme === MappingScheme.DIRECT ? 'Direct Mapping' : 
              config.mappingScheme === MappingScheme.FULLY_ASSOCIATIVE ? 'Fully Associative' : 
              `${config.associativity}-Way Set Associative`}
        description={
          config.mappingScheme === MappingScheme.DIRECT 
            ? 'Each block maps to exactly ONE cache location. Simple but causes conflict misses.'
            : config.mappingScheme === MappingScheme.FULLY_ASSOCIATIVE
            ? 'Any block can go anywhere. Best hit rate but complex hardware (parallel tag comparison).'
            : 'Compromise: N blocks per set. Reduces conflicts while keeping hardware feasible.'
        }
        icon={ArrowRight}
      />
      <ConceptCard
        title={config.writePolicy === WritePolicy.WRITE_THROUGH ? 'Write-Through' : 'Write-Back'}
        description={
          config.writePolicy === WritePolicy.WRITE_THROUGH
            ? 'Every write goes to cache AND memory immediately. Simple, consistent, but slower writes.'
            : 'Writes only to cache. Memory updated on eviction (dirty bit). Faster writes, but more complex.'
        }
        icon={AlertCircle}
      />
      <ConceptCard
        title={`Replacement: ${config.replacementPolicy.toUpperCase()}`}
        description={
          config.replacementPolicy === ReplacementPolicy.LRU
            ? 'Evict Least Recently Used. Best for temporal locality but needs timestamp tracking.'
            : config.replacementPolicy === ReplacementPolicy.FIFO
            ? 'Evict First In (oldest). Simple queue, but may evict frequently used blocks.'
            : 'Evict Random block. Simplest hardware, decent average performance.'
        }
        icon={RefreshCw}
      />
      <ConceptCard
        title={`Write Allocate: ${config.writeAllocatePolicy === WriteAllocatePolicy.WRITE_ALLOCATE ? 'Yes' : 'No'}`}
        description={
          config.writeAllocatePolicy === WriteAllocatePolicy.WRITE_ALLOCATE
            ? 'On write miss: load block into cache, then write. Good for spatial locality.'
            : 'On write miss: write directly to memory, bypass cache. Avoids polluting cache with write-only data.'
        }
        icon={ArrowLeft}
      />
    </div>
  </div>
);

const ConceptCard: React.FC<{ title: string; description: React.ReactNode; icon: React.ComponentType<{ className?: string }> }> = ({ 
  title, description, icon: Icon 
}) => (
  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-gray-900 text-sm">{title}</h5>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </div>
);