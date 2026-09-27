// ============================================================================
// ADDRESS VISUALIZER - Binary Bit Parsing Display
// ============================================================================

import React from 'react';
import { useParsedAddress, useConfig, useLastResult, useShowBinary, useToggleBinary } from '../store/simulatorStore';
import { Copy, Expand, Minimize } from 'lucide-react';

export const AddressVisualizer: React.FC = () => {
  const parsedAddress = useParsedAddress();
  const config = useConfig();
  const lastResult = useLastResult();
  const showBinary = useShowBinary();
  const toggleBinary = useToggleBinary();

  if (!parsedAddress) return null;

  const { tag, index, offset, tagBits, indexBits, offsetBits, tagBitLength, indexBitLength, offsetBitLength, binary, hex } = parsedAddress;

  const totalBits = config.addressWidth;
  const isHit = lastResult?.hit;
  const isMiss = lastResult !== null && !lastResult.hit;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-primary-600">0x</span>
          Address Bit Parsing
        </h2>
        <button
          onClick={toggleBinary}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title={showBinary ? 'Show compact view' : 'Show binary breakdown'}
        >
          {showBinary ? <Minimize className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-4">
        {/* Address Display */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hex:</span>
            <code className="font-mono text-lg text-gray-900 bg-white px-3 py-1 rounded border">{hex}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Decimal:</span>
            <code className="font-mono text-lg text-gray-900 bg-white px-3 py-1 rounded border">{parsedAddress.raw}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Binary:</span>
            <code className="font-mono text-sm text-gray-900 bg-white px-3 py-1 rounded border font-mono max-w-xs truncate block">
              {binary}
            </code>
          </div>
        </div>

        {/* Bit Split Visualization */}
        {showBinary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-20 text-right">MSB</span>
              <span className="flex-1 text-center">Bit Position</span>
              <span className="w-20">LSB</span>
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {Array.from({ length: totalBits }, (_, i) => totalBits - 1 - i).map(bitPos => (
                <div
                  key={bitPos}
                  className="w-8 h-8 flex items-center justify-center text-xs font-mono text-gray-700 border border-gray-200 bg-white"
                  style={{ 
                    backgroundColor: 
                      bitPos >= totalBits - tagBitLength ? 'rgba(59, 130, 246, 0.1)' :
                      bitPos >= offsetBitLength && indexBitLength > 0 ? 'rgba(16, 185, 129, 0.1)' :
                      bitPos < offsetBitLength ? 'rgba(245, 158, 11, 0.1)' : 'white'
                  }}
                >
                  {bitPos}
                </div>
              ))}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {binary.split('').map((bit, i) => (
                <div
                  key={i}
                  className="w-8 h-10 flex items-center justify-center text-xs font-mono font-bold"
                  style={{ 
                    color: 
                      i < tagBitLength ? '#3b82f6' :
                      i < tagBitLength + indexBitLength ? '#10b981' :
                      '#f59e0b'
                  }}
                >
                  {bit}
                </div>
              ))}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {[
                { label: 'TAG', length: tagBitLength, color: '#3b82f6', value: tagBits || '-' },
                ...(indexBitLength > 0 ? [{ label: 'INDEX', length: indexBitLength, color: '#10b981', value: indexBits || '-' }] : []),
                { label: 'OFFSET', length: offsetBitLength, color: '#f59e0b', value: offsetBits || '-' },
              ].map((field, fieldIdx) => (
                <div
                  key={field.label}
                  className="flex items-center justify-center min-w-[80px] px-2"
                  style={{ width: `${field.length * 32}px` }}
                >
                  <div className="text-center">
                    <div className="text-xs font-semibold text-white px-2 py-1 rounded" style={{ backgroundColor: field.color }}>
                      {field.label}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-mono">{field.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{field.length} bits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Field Values */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xs font-medium text-blue-800 uppercase tracking-wide">Tag</div>
            <div className="font-mono text-lg font-bold text-blue-900">
              {tagBits ? `0x${tag.toString(16).toUpperCase().padStart(Math.ceil(tagBitLength/4), '0')}` : 'N/A'}
            </div>
            <div className="text-xs text-blue-600">{tagBitLength} bits</div>
          </div>
          
          {indexBitLength > 0 ? (
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs font-medium text-green-800 uppercase tracking-wide">Index</div>
              <div className="font-mono text-lg font-bold text-green-900">
                {indexBits ? `0x${index.toString(16).toUpperCase().padStart(Math.ceil(indexBitLength/4), '0')}` : '0'}
              </div>
              <div className="text-xs text-green-600">{indexBitLength} bits</div>
            </div>
          ) : (
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Index</div>
              <div className="font-mono text-lg font-bold text-gray-400">N/A</div>
              <div className="text-xs text-gray-400">Fully Associative</div>
            </div>
          )}

          <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-xs font-medium text-amber-800 uppercase tracking-wide">Offset</div>
            <div className="font-mono text-lg font-bold text-amber-900">
              {offsetBits ? `0x${offset.toString(16).toUpperCase().padStart(Math.ceil(offsetBitLength/4), '0')}` : '0'}
            </div>
            <div className="text-xs text-amber-600">{offsetBitLength} bits</div>
          </div>
        </div>

        {/* Hit/Miss Indicator */}
        {lastResult && (
          <div className={`p-3 rounded-lg flex items-center justify-between animate-fade-in ${
            isHit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isHit ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <div className="font-semibold text-gray-900">
                  {isHit ? 'CACHE HIT' : 'CACHE MISS'}
                </div>
                <div className="text-sm text-gray-600">
                  {isHit 
                    ? `Tag matched in Set ${lastResult.setIndex}, Block ${lastResult.blockIndex}`
                    : `Miss type: ${lastResult.missType}${lastResult.evicted ? ' (eviction occurred)' : ''}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-gray-900">{lastResult.cycles} cycles</div>
              <div className="text-xs text-gray-500">Access time</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};