import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { CHART_COLORS } from '../ui/chartColors';

interface LineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

export const LineChart: React.FC<LineChartProps> = ({
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

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            {yAxisKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={key}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};