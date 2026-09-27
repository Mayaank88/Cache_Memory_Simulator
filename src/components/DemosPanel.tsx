// ============================================================================
// DEMOS PANEL - Pre-configured Educational Demonstrations
// ============================================================================

import React from 'react';
import { useDemos, useSelectedDemo, useConfig, useIsRunning,
  useLoadDemo, useRunDemo, useSetActivePanel, useUpdateConfig
} from '../store/simulatorStore';
import { Play, Pause, Settings, BookOpen, Target, Zap, ArrowRight } from 'lucide-react';

export const DemosPanel: React.FC = () => {
  const demos = useDemos();
  const selectedDemo = useSelectedDemo();
  const config = useConfig();
  const isRunning = useIsRunning();
  const loadDemo = useLoadDemo();
  const runDemo = useRunDemo();
  const setActivePanel = useSetActivePanel();
  const updateConfig = useUpdateConfig();

  const runQuickExperiment = (partialConfig: Partial<any>) => {
    updateConfig(partialConfig);
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          Interactive Demos
        </h2>
        <button
          onClick={() => setActivePanel('explanation')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Explanation Panel"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Current Config Summary */}
        <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
          <h3 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Current Configuration
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-500">Mapping:</span> <span className="font-mono text-gray-900 ml-1">{config.mappingScheme}</span></div>
            <div><span className="text-gray-500">Cache:</span> <span className="font-mono text-gray-900 ml-1">{config.cacheSize/1024} KB</span></div>
            <div><span className="text-gray-500">Block:</span> <span className="font-mono text-gray-900 ml-1">{config.blockSize} B</span></div>
            <div><span className="text-gray-500">Policy:</span> <span className="font-mono text-gray-900 ml-1">{config.replacementPolicy.toUpperCase()}</span></div>
            <div><span className="text-gray-500">Write:</span> <span className="font-mono text-gray-900 ml-1">{config.writePolicy}</span></div>
            <div><span className="text-gray-500">Assoc:</span> <span className="font-mono text-gray-900 ml-1">{config.associativity}-way</span></div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="space-y-3">
          {demos.map((demo) => (
            <DemoCard
              key={demo.name}
              demo={demo}
              isSelected={selectedDemo === demo.name}
              isRunning={isRunning}
              onLoad={() => loadDemo(demo.name)}
              onRun={() => runDemo(demo.name)}
            />
          ))}
        </div>

        {/* Custom Demo Builder */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Experiments
          </h3>
          <div className="space-y-2">
            <QuickExperiment 
              title="Vary Associativity" 
              description="Compare 1-way vs 2-way vs 4-way for same cache size"
              onRun={() => runQuickExperiment({ mappingScheme: 'set-associative', associativity: 1 })}
            />
            <QuickExperiment 
              title="Vary Block Size" 
              description="Test 16B vs 64B vs 128B blocks with sequential access"
              onRun={() => runQuickExperiment({ blockSize: 16 })}
            />
            <QuickExperiment 
              title="Write Policy Impact" 
              description="Compare Write-Through vs Write-Back with write-heavy workload"
              onRun={() => runQuickExperiment({ writePolicy: 'write-through' })}
            />
            <QuickExperiment 
              title="Replacement Policy" 
              description="LRU vs FIFO vs Random with cyclic access pattern"
              onRun={() => runQuickExperiment({ replacementPolicy: 'lru' })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Demo Card Component
// -----------------------------------------------------------------------------

interface DemoCardProps {
  demo: any;
  isSelected: boolean;
  isRunning: boolean;
  onLoad: () => void;
  onRun: () => void;
}

const DemoCard: React.FC<DemoCardProps> = ({ demo, isSelected, isRunning, onLoad, onRun }) => (
  <div className={`p-4 rounded-xl border-2 transition-all ${
    isSelected 
      ? 'border-primary-300 bg-primary-50' 
      : 'border-gray-100 hover:border-gray-200'
  }`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900">{demo.name}</h4>
          {isSelected && (
            <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">ACTIVE</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">{demo.description}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{demo.explanation}</p>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {Object.entries(demo.config).map(([key, value]) => (
            <span key={key} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
              {key}: {String(value)}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          onClick={onLoad}
          disabled={isRunning}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          <Settings className="w-4 h-4 mr-1" />
          Load Config
        </button>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="btn-primary text-sm whitespace-nowrap"
        >
          <Play className="w-4 h-4 mr-1" />
          Run Demo
        </button>
      </div>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Quick Experiment Component
// -----------------------------------------------------------------------------

interface QuickExperimentProps {
  title: string;
  description: string;
  onRun: () => void;
}

const QuickExperiment: React.FC<QuickExperimentProps> = ({ title, description, onRun }) => (
  <button
    onClick={onRun}
    className="w-full p-3 text-left rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors"
  >
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400" />
    </div>
  </button>
);