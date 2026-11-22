import * as React from 'react';
import { useRef, useEffect, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getChartColors } from '../ui/chartColors';
import { useFilter, applyFilter } from '../ui/FilterContext';

export interface ScatterPlotProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  title: string;
  description: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data, xAxisKey, yAxisKeys, title, description
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { filter, isFiltered, clearFilter } = useFilter();

  // ResizeObserver for chart resizing
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // Recharts handles resize automatically via ResponsiveContainer
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Apply cross-filter
  const filteredData = useMemo(() => applyFilter(data, filter), [data, filter]);

  // Theme-aware chart colors
  const chartColors = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return getChartColors(isDark);
  }, []);

  if (filteredData.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-4">{description}</p>
        <div className="h-64 flex items-center justify-center text-slate-500" role="img" aria-label={`${title}: ${description}`}>
          No data available
        </div>
      </div>
    );
  }

  // Use first yAxisKey for scatter
  const yAxisKey = yAxisKeys[0] ?? '';

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold">{title}</h3>
        {isFiltered && (
          <button
            onClick={clearFilter}
            className="text-xs text-accent hover:underline"
            aria-label="Clear cross-filter"
          >
            Clear filter
          </button>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div
        ref={containerRef}
        className="h-64 w-full"
        role="img"
        aria-label={`${title}: ${description}`}
        tabIndex={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={filteredData}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} type="number" />
            <YAxis dataKey={yAxisKey} stroke="#94a3b8" fontSize={12} type="number" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Scatter
              name={yAxisKey}
              data={filteredData}
              fill={chartColors[0]}
              stroke={chartColors[0]}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};