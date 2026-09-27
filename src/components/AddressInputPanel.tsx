// ============================================================================
// ADDRESS INPUT PANEL
// ============================================================================

import React from 'react';
import { useConfig, useParsedAddress, useLastResult, useIsRunning, useWorkload, useWorkloadIndex, useIsStepMode, useExecutionSpeed, useActivePanel,
  useSetAddressInput, useStep, useRunAuto, useStopAuto, useToggleStepMode, useGenerateWorkload, useLoadTraceFile, useRunWorkload, useResetWorkload, useStepWorkload, useUpdateConfig, useSetActivePanel, useSetSpeed
} from '../store/simulatorStore';
import { MappingScheme, ReplacementPolicy, WritePolicy, WriteAllocatePolicy } from '../engine/cacheEngine';
import { 
  Cpu, MemoryStick, Settings, Play, Pause, StepForward, 
  RotateCcw, Zap, FileText, ChevronDown, ChevronUp,
  HelpCircle, Info, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

const MappingSchemeOptions = [
  { value: MappingScheme.DIRECT, label: 'Direct Mapped', desc: 'One block per set' },
  { value: MappingScheme.FULLY_ASSOCIATIVE, label: 'Fully Associative', desc: 'Any block anywhere' },
  { value: MappingScheme.SET_ASSOCIATIVE, label: 'Set Associative', desc: 'N blocks per set' },
];

const ReplacementPolicyOptions = [
  { value: ReplacementPolicy.LRU, label: 'LRU', desc: 'Least Recently Used' },
  { value: ReplacementPolicy.FIFO, label: 'FIFO', desc: 'First In First Out' },
  { value: ReplacementPolicy.RANDOM, label: 'Random', desc: 'Random replacement' },
];

const WritePolicyOptions = [
  { value: WritePolicy.WRITE_THROUGH, label: 'Write-Through', desc: 'Write to cache & memory' },
  { value: WritePolicy.WRITE_BACK, label: 'Write-Back', desc: 'Write to cache only (dirty bit)' },
];

const WriteAllocateOptions = [
  { value: WriteAllocatePolicy.WRITE_ALLOCATE, label: 'Write Allocate', desc: 'Load block on write miss' },
  { value: WriteAllocatePolicy.NO_WRITE_ALLOCATE, label: 'No Write Allocate', desc: 'Write to memory directly' },
];

const WorkloadOptions = [
  { value: 'sequential', label: 'Sequential', desc: 'Array traversal (spatial locality)' },
  { value: 'strided', label: 'Strided', desc: 'Fixed stride access pattern' },
  { value: 'random', label: 'Random', desc: 'No locality' },
  { value: 'matrix', label: 'Matrix Multiply', desc: 'Row/column access pattern' },
  { value: 'loop', label: 'Loop', desc: 'Repeated access (temporal locality)' },
];

const ConfigInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
}> = ({ label, value, onChange, min }) => (
  <div>
    <label className="block text-xs text-gray-600 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || min)}
      min={min}
      className="input-field text-sm"
    />
  </div>
);

const ConfigSelect: React.FC<{
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (v: string | number) => void;
}> = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-xs text-gray-600 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        const opt = options.find(o => o.value === val || o.value === Number(val));
        onChange(opt?.value ?? val);
      }}
      className="select-field text-sm"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const AddressInputPanel: React.FC = () => {
  const config = useConfig();
  const parsedAddress = useParsedAddress();
  const lastResult = useLastResult();
  const isRunning = useIsRunning();
  const workload = useWorkload();
  const workloadIndex = useWorkloadIndex();
  const isStepMode = useIsStepMode();
  const executionSpeed = useExecutionSpeed();
  const activePanel = useActivePanel();
  
  const setAddressInput = useSetAddressInput();
  const step = useStep();
  const runAuto = useRunAuto();
  const stopAuto = useStopAuto();
  const toggleStepMode = useToggleStepMode();
  const generateWorkload = useGenerateWorkload();
  const loadTraceFile = useLoadTraceFile();
  const runWorkload = useRunWorkload();
  const resetWorkload = useResetWorkload();
  const stepWorkload = useStepWorkload();
  const updateConfig = useUpdateConfig();
  const setActivePanel = useSetActivePanel();
  const setSpeed = useSetSpeed();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      step();
    }
  };

  const maxAddress = (1 << config.addressWidth) - 1;

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-600" />
          Simulator Controls
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActivePanel('explanation')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Explanation Panel"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActivePanel('analytics')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Analytics Panel"
          >
            <MemoryStick className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Memory Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={parsedAddress?.hex || '0x0000'}
              onChange={handleAddressChange}
              onKeyDown={handleKeyDown}
              className="input-field flex-1 font-mono text-sm"
              placeholder="0x0000 or decimal"
              title="Enter address in hex (0x...) or decimal. Press Enter to step."
            />
            <select
              value={isStepMode ? 'step' : 'auto'}
              onChange={(e) => toggleStepMode()}
              className="select-field px-3 py-2 text-sm min-w-[120px]"
            >
              <option value="step">Step Mode</option>
              <option value="auto">Auto Run</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Range: 0 - {maxAddress} (0x{maxAddress.toString(16).toUpperCase().padStart(config.addressWidth/4, '0')})</span>
            <span>Width: {config.addressWidth}-bit</span>
          </div>
        </div>

        {/* Execution Controls */}
        <div className="flex gap-2">
          <button
            onClick={step}
            disabled={isRunning}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <StepForward className="w-4 h-4" />
            Step
          </button>
          {isRunning ? (
            <button onClick={stopAuto} className="btn-danger flex-1 flex items-center justify-center gap-2">
              <Pause className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button 
              onClick={runAuto}
              disabled={!isStepMode && workload.length === 0}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Auto Run
            </button>
          )}
        </div>

        {isRunning && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Speed:</label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={executionSpeed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none accent-primary-600"
            />
            <span className="text-sm text-gray-500 w-20 text-right">{executionSpeed}ms</span>
          </div>
        )}

        {/* Workload Generator */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Workload Generator</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                generateWorkload(e.target.value, 100);
                e.target.value = '';
              }
            }}
            className="select-field mb-2"
          >
            <option value="" disabled>Select workload type...</option>
            {WorkloadOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {workload.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{workload.length} accesses queued</span>
                <span className="text-primary-600 font-medium">
                  {workloadIndex}/{workload.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-600 h-full transition-all duration-300"
                  style={{ width: workload.length > 0 ? `${(workloadIndex / workload.length) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={runWorkload} disabled={isRunning} className="btn-primary flex-1 text-sm">
                  Run All
                </button>
                <button onClick={stepWorkload} disabled={isRunning || workloadIndex >= workload.length} className="btn-secondary flex-1 text-sm">
                  Next
                </button>
                <button onClick={resetWorkload} className="btn-secondary text-sm">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trace File Upload */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Load Trace File</label>
          <input
            type="file"
            accept=".txt,.trace"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => loadTraceFile(evt.target?.result as string);
                reader.readAsText(file);
              }
            }}
            className="input-field text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-gray-500 mt-1">Format: <code className="bg-gray-100 px-1 rounded">R 0x1000</code> or <code className="bg-gray-100 px-1 rounded">W 0x2000</code></p>
        </div>

        {/* Configuration */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Settings className="w-4 h-4" />
            Cache Configuration
          </label>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <ConfigInput 
                label="Memory Size (KB)" 
                value={config.memorySize / 1024}
                onChange={(v) => updateConfig({ memorySize: v * 1024 })}
                min={1}
              />
              <ConfigInput 
                label="Cache Size (KB)" 
                value={config.cacheSize / 1024}
                onChange={(v) => updateConfig({ cacheSize: v * 1024 })}
                min={1}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ConfigInput 
                label="Block Size (B)" 
                value={config.blockSize}
                onChange={(v) => updateConfig({ blockSize: v })}
                min={1}
              />
              <ConfigSelect
                label="Address Width"
                value={config.addressWidth}
                options={[
                  { value: 16, label: '16-bit' },
                  { value: 32, label: '32-bit' },
                ]}
                onChange={(v) => updateConfig({ addressWidth: Number(v) as 16 | 32 })}
              />
            </div>
            <ConfigSelect
              label="Mapping Scheme"
              value={config.mappingScheme}
              options={MappingSchemeOptions.map(o => ({ value: o.value, label: o.label }))}
              onChange={(v) => updateConfig({ mappingScheme: v as MappingScheme })}
            />
            
            {config.mappingScheme === MappingScheme.SET_ASSOCIATIVE && (
              <ConfigInput 
                label="Associativity (Ways)" 
                value={config.associativity}
                onChange={(v) => updateConfig({ associativity: v })}
                min={2}
              />
            )}

            <ConfigSelect
              label="Replacement Policy"
              value={config.replacementPolicy}
              options={ReplacementPolicyOptions.map(o => ({ value: o.value, label: o.label }))}
              onChange={(v) => updateConfig({ replacementPolicy: v as ReplacementPolicy })}
            />

            <ConfigSelect
              label="Write Policy"
              value={config.writePolicy}
              options={WritePolicyOptions.map(o => ({ value: o.value, label: o.label }))}
              onChange={(v) => updateConfig({ writePolicy: v as WritePolicy })}
            />

            <ConfigSelect
              label="Write Allocate"
              value={config.writeAllocatePolicy}
              options={WriteAllocateOptions.map(o => ({ value: o.value, label: o.label }))}
              onChange={(v) => updateConfig({ writeAllocatePolicy: v as WriteAllocatePolicy })}
            />

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <ConfigInput 
                label="Hit Time (cycles)" 
                value={config.hitTime}
                onChange={(v) => updateConfig({ hitTime: v })}
                min={1}
              />
              <ConfigInput 
                label="Miss Penalty (cycles)" 
                value={config.missPenalty}
                onChange={(v) => updateConfig({ missPenalty: v })}
                min={1}
              />
            </div>
          </div>
        </div>

        {/* Status / Result Banner */}
        {lastResult && (
          <div className={`border-t border-gray-100 pt-4 p-3 rounded-lg ${
            lastResult.hit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          } animate-fade-in`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.hit ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-gray-900">
                {lastResult.hit ? 'CACHE HIT' : 'CACHE MISS'}
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/50">
                {lastResult.cycles} cycles
              </span>
            </div>
            <p className="text-sm text-gray-700">{lastResult.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};