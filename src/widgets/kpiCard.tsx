import * as React from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useFilter, applyFilter } from '../ui/FilterContext';

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
  const { filter, isFiltered, clearFilter } = useFilter();

  // ResizeObserver for potential future use
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // KPI card doesn't need resize handling but kept for consistency
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Apply cross-filter
  const filteredData = useMemo(() => applyFilter(data, filter), [data, filter]);

  const key = yAxisKeys[0] ?? '';
  const value = filteredData.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      ref={containerRef}
      className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-center"
      role="img"
      aria-label={`${title}: ${formatted}. ${description}`}
      tabIndex={0}
    >
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
      <div className="text-4xl font-bold text-blue-400">{formatted}</div>
    </div>
  );
};