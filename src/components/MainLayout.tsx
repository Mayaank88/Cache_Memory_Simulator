// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

import React from 'react';
import { useActivePanel, useExplanationMode, useSetActivePanel, useToggleExplanationMode } from '../store/simulatorStore';
import { AddressInputPanel } from './AddressInputPanel';
import { AddressVisualizer } from './AddressVisualizer';
import { CacheGrid } from './CacheGrid';
import { AnalyticsPanel } from './AnalyticsPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { DemosPanel } from './DemosPanel';
import { Menu, X, Layout, LayoutDashboard, BookOpen, BarChart2 } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const activePanel = useActivePanel();
  const explanationMode = useExplanationMode();
  const setActivePanel = useSetActivePanel();
  const toggleExplanationMode = useToggleExplanationMode();

  const panels = {
    simulator: 'Simulator',
    analytics: 'Analytics',
    explanation: 'Explanation',
    demos: 'Demos',
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Cache Simulator</span>
              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                v1.0
              </span>
            </div>

            {/* Panel Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 hidden md:flex">
              {(Object.keys(panels) as Array<keyof typeof panels>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActivePanel(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activePanel === key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {panels[key]}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="Menu">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Panel Selector */}
        <div className="md:hidden px-4 py-2 border-t border-gray-100">
          <select
            value={activePanel}
            onChange={(e) => setActivePanel(e.target.value as any)}
            className="w-full select-field text-sm"
          >
            {Object.entries(panels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Sidebar - Controls */}
          <aside className="w-80 lg:w-96 flex-shrink-0 border-r border-gray-200 bg-white hidden lg:block">
            <AddressInputPanel />
          </aside>

          {/* Center - Visualization */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Address Visualizer - Top */}
            <div className="h-64 lg:h-72 flex-shrink-0 border-b border-gray-200 bg-white">
              <AddressVisualizer />
            </div>

            {/* Cache Grid - Middle */}
            <div className="flex-1 overflow-hidden border-b border-gray-200 bg-white">
              <CacheGrid />
            </div>
          </div>

          {/* Right Sidebar - Dynamic Panel */}
          <aside className="w-80 lg:w-96 flex-shrink-0 border-l border-gray-200 bg-white hidden lg:block">
            {activePanel === 'simulator' && <ExplanationPanel />}
            {activePanel === 'analytics' && <AnalyticsPanel />}
            {activePanel === 'explanation' && <ExplanationPanel />}
            {activePanel === 'demos' && <DemosPanel />}
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Sheet for Panels */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-40 max-h-[60vh] overflow-y-auto">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 capitalize">{panels[activePanel]}</h3>
          <button onClick={() => setActivePanel('simulator')} className="p-2 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3">
          {activePanel === 'simulator' && <ExplanationPanel />}
          {activePanel === 'analytics' && <AnalyticsPanel />}
          {activePanel === 'explanation' && <ExplanationPanel />}
          {activePanel === 'demos' && <DemosPanel />}
        </div>
      </div>
    </div>
  );
};