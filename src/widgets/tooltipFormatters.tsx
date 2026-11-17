import * as React from 'react';

export const formatLineTooltip = (payload: any[], xAxisKey: string): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    <p className="font-bold">{payload[0]?.[xAxisKey]}</p>
    {payload.map((item, i) => (
      <p key={i} className="text-sm">{item.name}: {item.value.toLocaleString()}</p>
    ))}
  </div>
);

export const formatBarTooltip = (payload: any[]): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    <p className="font-bold">{payload[0]?.name}</p>
    {payload.map((item, i) => (
      <p key={i} className="text-sm">{item.name}: {item.value.toLocaleString()}</p>
    ))}
  </div>
);

export const formatScatterTooltip = (payload: any[]): React.ReactNode => (
  <div className="p-2 bg-slate-900 rounded border border-slate-700">
    {payload.map((item, i) => (
      <p key={i} className="text-sm">X: {item.payload?.x?.toLocaleString()}, Y: {item.payload?.y?.toLocaleString()}</p>
    ))}
  </div>
);