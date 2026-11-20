import * as React from 'react';

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  [key: string]: unknown;
}

interface ScatterTooltipPayloadItem {
  payload?: { x?: number | string; y?: number | string };
  name: string;
  value: number | string;
  [key: string]: unknown;
}

export const formatLineTooltip = (payload: TooltipPayloadItem[], xAxisKey: string): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    <p className="font-bold">{String(payload[0]?.[xAxisKey] ?? '')}</p>
    {payload.map((item, i) => (
      <p key={i} className="text-sm">{item.name}: {item.value.toLocaleString()}</p>
    ))}
  </div>
);

export const formatBarTooltip = (payload: TooltipPayloadItem[]): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    <p className="font-bold">{payload[0]?.name}</p>
    {payload.map((item, i) => (
      <p key={i} className="text-sm">{item.name}: {item.value.toLocaleString()}</p>
    ))}
  </div>
);

export const formatScatterTooltip = (payload: ScatterTooltipPayloadItem[]): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    {payload.map((item, i) => (
      <p key={i} className="text-sm">X: {item.payload?.x?.toLocaleString()}, Y: {item.payload?.y?.toLocaleString()}</p>
    ))}
  </div>
);