import * as React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export interface ScatterPlotProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  title: string;
  description: string;
}

const CHART_COLORS = [
  '#38bdf8', // blue-400
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#a855f7', // purple-500
];

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data, xAxisKey, yAxisKeys, title, description
}) => {
  if (data.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-4">{description}</p>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No data available
        </div>
      </div>
    );
  }

  // Use first yAxisKey for scatter
  const yAxisKey = yAxisKeys[0];

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} type="number" />
            <YAxis dataKey={yAxisKey} stroke="#94a3b8" fontSize={12} type="number" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Scatter
              name={yAxisKey}
              data={data}
              fill={CHART_COLORS[0]}
              stroke={CHART_COLORS[0]}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};