// ============================================================================
// ANALYTICS PANEL - Performance Metrics & Charts
// ============================================================================

import React, { useMemo } from 'react';
import { useStats, useConfig, useHitMissHistory, useLastResult } from '../store/simulatorStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Line, Area, AreaChart, LineChart, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, 
  RefreshCw, Download, FileText
} from 'lucide-react';

export const AnalyticsPanel: React.FC = () => {
  const stats = useStats();
  const config = useConfig();
  const history = useHitMissHistory();
  const lastResult = useLastResult();

  const hitRate = useMemo(() => 
    stats.totalAccesses > 0 ? (stats.hits / stats.totalAccesses) * 100 : 0
  , [stats.hits, stats.totalAccesses]);

  const missRate = useMemo(() => 100 - hitRate, [hitRate]);

  const amat = useMemo(() => {
    if (stats.totalAccesses === 0) return 0;
    const missRateRatio = stats.misses / stats.totalAccesses;
    return config.hitTime + (missRateRatio * config.missPenalty);
  }, [stats, config.hitTime, config.missPenalty]);

  const totalCycles = useMemo(() => {
    return stats.hits * config.hitTime + stats.misses * (config.hitTime + config.missPenalty) + stats.writebacks * config.missPenalty;
  }, [stats, config]);

  const avgCyclesPerAccess = stats.totalAccesses > 0 ? totalCycles / stats.totalAccesses : 0;

  // Chart data preparation
  const chartData = useMemo(() => 
    history.map(h => ({
      step: h.step,
      hits: h.hits,
      misses: h.misses,
      hitRate: h.hitRate,
      cumulativeHits: h.hits,
      cumulativeMisses: h.misses,
    }))
  , [history]);

  const summaryData = useMemo(() => [
    { name: 'Hits', value: stats.hits, color: '#10b981' },
    { name: 'Compulsory Misses', value: stats.compulsoryMisses, color: '#f59e0b' },
    { name: 'Conflict Misses', value: stats.conflictMisses, color: '#ef4444' },
    { name: 'Capacity Misses', value: stats.capacityMisses, color: '#8b5cf6' },
  ], [stats]);

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Performance Analytics
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Export Data">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Reset Stats">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard 
            title="Hit Rate" 
            value={`${hitRate.toFixed(2)}%`} 
            icon={Target} 
            iconColor="text-green-500"
            trend={hitRate > 50 ? 'up' : 'down'}
            subtitle={`${stats.hits}/${stats.totalAccesses} accesses`}
          />
          <MetricCard 
            title="Miss Rate" 
            value={`${missRate.toFixed(2)}%`} 
            icon={Target} 
            iconColor="text-red-500"
            trend={missRate < 50 ? 'down' : 'up'}
            subtitle={`${stats.misses}/${stats.totalAccesses} accesses`}
          />
          <MetricCard 
            title="AMAT" 
            value={`${amat.toFixed(2)} cycles`} 
            icon={Clock} 
            iconColor="text-blue-500"
            subtitle={`Hit: ${config.hitTime} | Miss: ${config.missPenalty}`}
          />
          <MetricCard 
            title="Avg Cycles/Access" 
            value={`${avgCyclesPerAccess.toFixed(2)}`} 
            icon={Zap} 
            iconColor="text-purple-500"
            subtitle={`Total: ${totalCycles} cycles`}
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatGroup title="Access Breakdown" items={[
            { label: 'Total Accesses', value: stats.totalAccesses },
            { label: 'Read Accesses', value: stats.readAccesses },
            { label: 'Write Accesses', value: stats.writeAccesses },
            { label: 'Cache Hits', value: stats.hits },
            { label: 'Cache Misses', value: stats.misses },
          ]} />
          
          <StatGroup title="Miss Classification" items={[
            { label: 'Compulsory (Cold)', value: stats.compulsoryMisses, color: 'text-amber-600' },
            { label: 'Conflict', value: stats.conflictMisses, color: 'text-red-600' },
            { label: 'Capacity', value: stats.capacityMisses, color: 'text-purple-600' },
            { label: 'Writebacks', value: stats.writebacks, color: 'text-orange-600' },
            { label: 'Dirty Blocks', value: stats.dirtyBlocks, color: 'text-amber-600' },
          ]} />
        </div>

        {/* Charts */}
        {history.length > 0 && (
          <div className="space-y-6">
            {/* Hit/Miss Trend */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-primary-600" />
                Hit/Miss Trend Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMisses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="step" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      // @ts-ignore
                      formatter={(value: any, name: any) => [value ?? 0, name]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="hits" stroke="#10b981" fill="url(#colorHits)" name="Hits" />
                    <Area type="monotone" dataKey="misses" stroke="#ef4444" fill="url(#colorMisses)" name="Misses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hit Rate Trend */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                Hit Rate Trend
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="step" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      stroke="#9ca3af" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(val: number) => `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      // @ts-ignore
                      formatter={(value: any) => [`${(value ?? 0).toFixed(2)}%`, 'Hit Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hitRate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Miss Type Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Miss Type Breakdown
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData.filter(d => d.value > 0)} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" name="Count">
                      {summaryData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Run simulation to see analytics</p>
            <p className="text-sm mt-1">Execute memory accesses to generate charts</p>
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Metric Card Component
// -----------------------------------------------------------------------------

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: 'up' | 'down';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, iconColor, trend, subtitle }) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${iconColor.replace('text-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
    {trend && (
      <div className="mt-2 flex items-center gap-1">
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? 'Good' : 'Needs improvement'}
        </span>
      </div>
    )}
  </div>
);

// -----------------------------------------------------------------------------
// Stat Group Component
// -----------------------------------------------------------------------------

interface StatGroupProps {
  title: string;
  items: { label: string; value: number; color?: string }[];
}

const StatGroup: React.FC<StatGroupProps> = ({ title, items }) => (
  <div className="p-4 bg-white rounded-xl border border-gray-100">
    <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className={`font-mono font-semibold text-gray-900 ${item.color || ''}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);