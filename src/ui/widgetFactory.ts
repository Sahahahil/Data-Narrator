import { LineChart } from '../widgets/lineChart';
import { BarChart } from '../widgets/barChart';
import { ScatterPlot } from '../widgets/scatterPlot';
import { KPICard } from '../widgets/kpiCard';
import type { ComponentType } from 'react';

export interface WidgetComponent {
  type: ComponentType<any>;
  config: any;
}

const widgetMap: Record<string, ComponentType<any>> = {
  line: LineChart,
  bar: BarChart,
  scatter: ScatterPlot,
  kpi: KPICard,
};

export function createWidget(widgetType: string, config: any): WidgetComponent {
  const Component = widgetMap[widgetType];
  if (!Component) throw new Error(`Unsupported widgetType: ${widgetType}`);
  return { type: Component, config };
}