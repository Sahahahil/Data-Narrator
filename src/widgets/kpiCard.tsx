import * as React from 'react';
import { useRef, useEffect } from 'react';

export interface KPICardProps {
  data: Record<string, unknown>[];
  yAxisKeys: string[];
  title: string;
  description: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  data, yAxisKeys, title, description
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver for potential future use
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // KPI card doesn't need resize handling but kept for consistency
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const key = yAxisKeys[0] ?? '';
  const value = data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      ref={containerRef}
      className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-center"
      role="img"
      aria-label={`${title}: ${formatted}. ${description}`}
      tabIndex={0}
    >
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="text-4xl font-bold text-blue-400">{formatted}</div>
    </div>
  );
};