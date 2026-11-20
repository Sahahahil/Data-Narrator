import * as React from 'react';
import { useRef, useEffect } from 'react';
import {
  LineChart as RechartsLineChart,
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { CHART_COLORS } from '../ui/chartColors';

export interface LineChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

interface GroupedDataPoint {
  [key: string]: unknown;
  value: number | string;
  series: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data, xAxisKey, yAxisKeys, groupKey, title, description
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver for chart resizing
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // Recharts handles resize automatically via ResponsiveContainer
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (data.length === 0) {
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

  // If groupKey is provided, transform data for multi-line chart
  const chartData: (Record<string, unknown> | GroupedDataPoint)[] = groupKey
    ? data.flatMap((row) =>
        yAxisKeys.map((key) => ({
          [xAxisKey]: row[xAxisKey],
          [groupKey]: row[groupKey],
          value: row[key],
          series: key,
        }))
      )
    : data;

  const seriesNames = groupKey
    ? [...new Set(chartData.map((d) => (d as GroupedDataPoint).series))]
    : yAxisKeys;

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div
        ref={containerRef}
        className="h-64 w-full"
        role="img"
        aria-label={`${title}: ${description}`}
        tabIndex={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            {seriesNames.map((seriesName, idx) => (
              <Line
                key={seriesName}
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={seriesName}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};