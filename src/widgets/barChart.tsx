import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';
import { CHART_COLORS } from '../ui/chartColors';

export interface BarChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data, xAxisKey, yAxisKeys, groupKey, title, description
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

  // If groupKey is provided, transform data for grouped bar chart
  const chartData = groupKey
    ? data.flatMap((row) =>
        yAxisKeys.map((key) => ({
          [xAxisKey]: row[xAxisKey],
          [groupKey]: row[groupKey],
          value: row[key],
          series: key,
        }))
      )
    : data;

  const displayKeys = groupKey ? ['value'] : yAxisKeys;

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
            <YAxis type="category" dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} width={80} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            {displayKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={groupKey ? undefined : CHART_COLORS[idx % CHART_COLORS.length]}
                name={groupKey ? key : yAxisKeys[idx]}
                radius={[0, 4, 4, 0]}
              >
                {groupKey && chartData.map((d, i) => (
                  <Cell key={i} fill={CHART_COLORS[chartData.findIndex(c => c.series === d.series && c[groupKey] === d[groupKey]) % CHART_COLORS.length]} />
                ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};