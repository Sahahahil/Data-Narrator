import * as React from 'react';

interface KPICardProps {
  data: any[];
  yAxisKeys: string[];
  title: string;
  description: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  data, yAxisKeys, title, description
}) => {
  const value = data.reduce((sum, row) => sum + (Number(row[yAxisKeys[0]]) || 0), 0);
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-center">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="text-4xl font-bold text-blue-400">{formatted}</div>
    </div>
  );
};