import { LineChart, LineChartProps } from '../widgets/lineChart';
import { BarChart, BarChartProps } from '../widgets/barChart';
import { ScatterPlot, ScatterPlotProps } from '../widgets/scatterPlot';
import { KPICard, KPICardProps } from '../widgets/kpiCard';
import { CustomChart, CustomChartProps } from '../widgets/customChart';
import type { ComponentType } from 'react';

type ChartProps = LineChartProps | BarChartProps | ScatterPlotProps | KPICardProps | CustomChartProps;

export interface WidgetComponent {
  type: ComponentType<any>;
  config: ChartProps;
}

const widgetMap: Record<string, ComponentType<any>> = {
  line: LineChart,
  bar: BarChart,
  scatter: ScatterPlot,
  kpi: KPICard,
  custom: CustomChart,
};

export function createWidget(widgetType: string, config: ChartProps): WidgetComponent {
  const Component = widgetMap[widgetType];
  if (!Component) throw new Error(`Unsupported widgetType: ${widgetType}`);
  return { type: Component, config };
}