// ============================================================================
// CACHE GRID VISUALIZATION - Interactive Cache Sets/Blocks Display
// ============================================================================

import React, { useMemo } from 'react';
import { useCacheSets, useConfig, useHighlightAnimation, useParsedAddress, useLastResult } from '../store/simulatorStore';
import { MappingScheme } from '../engine/cacheEngine';
import { ChevronRight, HardDrive, Database, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface CacheBlockDisplay {
  valid: boolean;
  dirty: boolean;
  tag: number;
  tagHex: string;
  index: number;
  way: number;
  isHighlighted: boolean;
  highlightType: 'hit' | 'miss' | null;
  isVictim: boolean;
}

export const CacheGrid: React.FC = () => {
  const cacheSets = useCacheSets();
  const config = useConfig();
  const highlight = useHighlightAnimation();
  const parsedAddress = useParsedAddress();
  const lastResult = useLastResult();

  const displayData = useMemo((): CacheBlockDisplay[] => {
    const result: CacheBlockDisplay[] = [];
    const currentSetIndex = parsedAddress?.index ?? -1;
    const currentTag = parsedAddress?.tag ?? -1;

    cacheSets.forEach((set, setIdx) => {
      set.blocks.forEach((block, blockIdx) => {
        const isCurrentSet = setIdx === currentSetIndex;
        const isCurrentBlock = isCurrentSet && block.valid && block.tag === currentTag;
        const isHighlighted = highlight && highlight.setIndex === setIdx && highlight.blockIndex === blockIdx;
        
        let highlightType: 'hit' | 'miss' | null = null;
        if (isHighlighted) {
          highlightType = highlight.type;
        } else if (lastResult && isCurrentBlock) {
          highlightType = lastResult.hit ? 'hit' : 'miss';
        }

        // Check if this block was evicted (victim)
        const isVictim = Boolean(lastResult && !lastResult.hit && lastResult.evicted && 
          lastResult.evictedBlock && lastResult.setIndex === setIdx && 
          lastResult.blockIndex === blockIdx);

        // Calculate tag hex for display
        const tagBitLength = config.addressWidth - Math.log2(config.blockSize) - 
          (config.mappingScheme === MappingScheme.DIRECT ? Math.log2(config.cacheSize/config.blockSize) : 
           config.mappingScheme === MappingScheme.SET_ASSOCIATIVE ? Math.log2((config.cacheSize/config.blockSize)/config.associativity) : 0);
        
        result.push({
          valid: block.valid,
          dirty: block.dirty,
          tag: block.tag,
          tagHex: block.valid ? `0x${block.tag.toString(16).toUpperCase().padStart(Math.ceil(tagBitLength/4), '0')}` : '---',
          index: setIdx,
          way: blockIdx,
          isHighlighted: isHighlighted || isCurrentBlock,
          highlightType,
          isVictim,
        });
      });
    });
    return result;
  }, [cacheSets, config, highlight, parsedAddress, lastResult]);

  const numSets = cacheSets.length;
  const waysPerSet = cacheSets[0]?.blocks.length ?? 0;

  if (numSets === 0) return null;

  // For fully associative, show as single set with many ways
  const isFullyAssociative = config.mappingScheme === MappingScheme.FULLY_ASSOCIATIVE;
  const isDirectMapped = config.mappingScheme === MappingScheme.DIRECT;

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-600" />
          Cache Contents
          <span className="text-sm font-normal text-gray-500">
            ({numSets} set{numSets !== 1 ? 's' : ''} × {waysPerSet} way{waysPerSet !== 1 ? 's' : ''})
          </span>
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Hit</span>
          <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Miss</span>
          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> Dirty</span>
          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3 text-blue-500" /> Valid</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isFullyAssociative ? (
          <FullyAssociativeView blocks={displayData} config={config} />
        ) : (
          <SetAssociativeView 
            sets={cacheSets} 
            displayData={displayData} 
            config={config} 
            parsedAddress={parsedAddress}
            lastResult={lastResult}
          />
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-xl">
        <div className="flex flex-wrap gap-4 text-xs">
          <LegendItem color="bg-green-100 text-green-800" label="Hit (Green pulse)" />
          <LegendItem color="bg-red-100 text-red-800" label="Miss (Red pulse)" />
          <LegendItem color="bg-amber-100 text-amber-800" label="Dirty Block" />
          <LegendItem color="bg-blue-100 text-blue-800" label="Valid Block" />
          <LegendItem color="bg-gray-100 text-gray-600" label="Empty/Invalid" />
          <LegendItem color="bg-purple-100 text-purple-800" label="Victim/Evicted" />
        </div>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${color}`}>
    <span className="w-2 h-2 rounded" />
    {label}
  </span>
);

// -----------------------------------------------------------------------------
// Set-Associative / Direct Mapped View
// -----------------------------------------------------------------------------

interface SetAssociativeViewProps {
  sets: any[];
  displayData: any[];
  config: any;
  parsedAddress: any;
  lastResult: any;
}

const SetAssociativeView: React.FC<SetAssociativeViewProps> = ({ 
  sets, displayData, config, parsedAddress, lastResult 
}) => {
  const waysPerSet = sets[0]?.blocks.length ?? 1;
  const currentIndex = parsedAddress?.index ?? -1;
  const currentTag = parsedAddress?.tag ?? -1;

  return (
    <div className="space-y-2">
      {/* Header Row */}
      <div className="flex font-mono text-xs font-medium text-gray-500 px-2 py-1 bg-gray-50 rounded sticky top-0 z-10">
        <div className="w-16 text-center">Set</div>
        {Array.from({ length: waysPerSet }, (_, w) => (
          <div key={w} className="flex-1 min-w-[140px] text-center">Way {w}</div>
        ))}
        <div className="w-24 text-center">Status</div>
      </div>

      {/* Cache Rows */}
      {sets.map((set, setIdx) => {
        const isCurrentSet = setIdx === currentIndex;
        const setBlocks = displayData.filter(b => b.index === setIdx);
        
        return (
          <div 
            key={setIdx} 
            className={`group relative transition-all duration-200 ${
              isCurrentSet ? 'bg-blue-50/50' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-16 flex items-center justify-center">
                <span className={`text-xs font-mono font-medium px-2 py-1 rounded ${
                  isCurrentSet ? 'bg-blue-100 text-blue-800' : 'text-gray-500'
                }`}>
                  {setIdx}
                </span>
              </div>

              {setBlocks.map((block, wayIdx) => (
                <CacheBlockCell
                  key={wayIdx}
                  block={block}
                  isCurrentSet={isCurrentSet}
                  isCurrentBlock={block.isHighlighted && block.highlightType === 'hit'}
                  isMissBlock={block.isHighlighted && block.highlightType === 'miss'}
                  isVictim={block.isVictim}
                  config={config}
                />
              ))}

              <div className="w-24 flex items-center justify-center">
                <SetStatusIndicator set={set} currentSet={isCurrentSet} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CacheBlockCell: React.FC<{
  block: any;
  isCurrentSet: boolean;
  isCurrentBlock: boolean;
  isMissBlock: boolean;
  isVictim: boolean;
  config: any;
}> = ({ block, isCurrentSet, isCurrentBlock, isMissBlock, isVictim, config }) => {
  const tagBitLength = config.addressWidth - Math.log2(config.blockSize) - 
    (config.mappingScheme === MappingScheme.DIRECT ? Math.log2(config.cacheSize/config.blockSize) : 
     config.mappingScheme === MappingScheme.SET_ASSOCIATIVE ? Math.log2((config.cacheSize/config.blockSize)/config.associativity) : 0);

  const baseClasses = 'flex-1 min-w-[140px] p-2 transition-all duration-300 relative';
  
  let cellClasses = baseClasses;
  let borderColor = 'border-gray-200';
  let bgColor = 'bg-white';
  let animationClass = '';

  if (isVictim) {
    borderColor = 'border-purple-400';
    bgColor = 'bg-purple-50';
    animationClass = 'animate-pulse';
  } else if (isCurrentBlock) {
    borderColor = 'border-green-400';
    bgColor = 'bg-green-50';
    animationClass = 'animate-pulse-hit';
  } else if (isMissBlock) {
    borderColor = 'border-red-400';
    bgColor = 'bg-red-50';
    animationClass = 'animate-pulse-miss';
  } else if (block.valid) {
    borderColor = 'border-blue-200';
    bgColor = 'bg-blue-25';
  } else {
    borderColor = 'border-gray-200';
    bgColor = 'bg-gray-50';
  }

  return (
    <div className={`${cellClasses} ${borderColor} ${bgColor} ${animationClass} rounded-lg border-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">Way {block.way}</span>
        {block.valid && (
          <div className="flex items-center gap-1">
            {block.dirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Dirty" />
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Valid" />
          </div>
        )}
      </div>
      
      <div className="font-mono text-sm font-medium text-gray-900 truncate">
        {block.valid ? block.tagHex : '---'}
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {block.valid ? `Tag: ${block.tag}` : 'Invalid'}
      </div>

      {isVictim && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-100/50 rounded-lg">
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
            EVICTED
          </span>
        </div>
      )}
    </div>
  );
};

const SetStatusIndicator: React.FC<{ set: any; currentSet: boolean }> = ({ set, currentSet }) => {
  const validCount = set.blocks.filter((b: any) => b.valid).length;
  const dirtyCount = set.blocks.filter((b: any) => b.valid && b.dirty).length;
  const totalWays = set.blocks.length;

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="px-1.5 py-0.5 rounded text-white bg-gray-600">
        {validCount}/{totalWays}
      </span>
      {dirtyCount > 0 && (
        <span className="px-1.5 py-0.5 rounded text-white bg-amber-500">
          {dirtyCount}D
        </span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Fully Associative View
// -----------------------------------------------------------------------------

const FullyAssociativeView: React.FC<{ blocks: any[]; config: any }> = ({ blocks, config }) => {
  const validBlocks = blocks.filter(b => b.valid);
  const emptyBlocks = blocks.filter(b => !b.valid);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-2">
        Fully Associative Cache - {validBlocks.length}/{blocks.length} blocks used
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {blocks.map((block, idx) => (
          <FullyAssociativeBlock key={idx} block={block} index={idx} config={config} />
        ))}
      </div>

      {emptyBlocks.length > 0 && (
        <div className="text-center text-gray-400 py-4 text-sm">
          {emptyBlocks.length} empty slots available
        </div>
      )}
    </div>
  );
};

const FullyAssociativeBlock: React.FC<{ block: any; index: number; config: any }> = ({ block, index, config }) => {
  const isHighlighted = block.isHighlighted;
  const isVictim = block.isVictim;
  const highlightType = block.highlightType;

  let borderColor = 'border-gray-200';
  let bgColor = 'bg-white';
  let animationClass = '';

  if (isVictim) {
    borderColor = 'border-purple-400';
    bgColor = 'bg-purple-50';
    animationClass = 'animate-pulse';
  } else if (highlightType === 'hit') {
    borderColor = 'border-green-400';
    bgColor = 'bg-green-50';
    animationClass = 'animate-pulse-hit';
  } else if (highlightType === 'miss') {
    borderColor = 'border-red-400';
    bgColor = 'bg-red-50';
    animationClass = 'animate-pulse-miss';
  } else if (block.valid) {
    borderColor = 'border-blue-200';
    bgColor = 'bg-blue-25';
  } else {
    borderColor = 'border-gray-200';
    bgColor = 'bg-gray-50';
  }

  return (
    <div className={`p-3 rounded-lg border-2 ${borderColor} ${bgColor} ${animationClass} transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Slot {index}</span>
        <div className="flex items-center gap-1">
          {block.valid && block.dirty && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Dirty" />
          )}
          {block.valid && (
            <span className="w-2 h-2 rounded-full bg-blue-500" title="Valid" />
          )}
        </div>
      </div>
      
      <div className="font-mono text-base font-medium text-gray-900 truncate mb-1">
        {block.valid ? block.tagHex : '---'}
      </div>
      
      <div className="text-xs text-gray-500">
        {block.valid ? `Tag: ${block.tag}` : 'Empty'}
      </div>

      {isVictim && (
        <div className="mt-2 text-center">
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
            EVICTED
          </span>
        </div>
      )}
    </div>
  );
};