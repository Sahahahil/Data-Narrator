import * as React from 'react';
import { useEffect, useRef, useMemo } from 'react';
import { VegaEmbed } from 'react-vega';
import { CustomVizSpec } from '../ui/customVizBuilder';
import { customVizBuilder } from '../ui/customVizBuilder';

export interface CustomChartProps {
  spec: CustomVizSpec;
  data: Record<string, unknown>[];
}

export const CustomChart: React.FC<CustomChartProps> = ({
  spec,
  data,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver for chart resizing
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // Vega-Embed handles resize automatically
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Generate Vega-Lite spec
  const vegaSpec = useMemo(() => customVizBuilder.toVegaLite(spec, data), [spec, data]);

  if (data.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold mb-1">{spec.name}</h3>
        <p className="text-sm text-slate-400 mb-4">{spec.description}</p>
        <div className="h-64 flex items-center justify-center text-slate-500" role="img" aria-label={`${spec.name}: ${spec.description}`}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold">{spec.name}</h3>
        <span className="px-2 py-0.5 text-xs font-medium bg-raised rounded-full text-muted">
          {spec.mark.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-4">{spec.description}</p>
      <div
        ref={containerRef}
        className="h-64 w-full"
        role="img"
        aria-label={`${spec.name}: ${spec.description}`}
        tabIndex={0}
      >
        <VegaEmbed
          spec={vegaSpec}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};