import { createWidget } from '../../src/ui/widgetFactory';
import { LineChart } from '../../src/widgets/lineChart';
import { BarChart } from '../../src/widgets/barChart';
import { ScatterPlot } from '../../src/widgets/scatterPlot';
import { KPICard } from '../../src/widgets/kpiCard';

describe('createWidget()', () => {
  const baseConfig = { xAxisKey: 'x', yAxisKeys: ['y'], title: 'Test', description: 'Desc' };

  it('returns LineChart for "line"', () => {
    const widget = createWidget('line', baseConfig);
    expect(widget.type).toBe(LineChart);
  });

  it('returns BarChart for "bar"', () => {
    const widget = createWidget('bar', baseConfig);
    expect(widget.type).toBe(BarChart);
  });

  it('returns ScatterPlot for "scatter"', () => {
    const widget = createWidget('scatter', baseConfig);
    expect(widget.type).toBe(ScatterPlot);
  });

  it('returns KPICard for "kpi"', () => {
    const widget = createWidget('kpi', { ...baseConfig, xAxisKey: '' });
    expect(widget.type).toBe(KPICard);
  });

  it('throws for invalid widgetType', () => {
    expect(() => createWidget('invalid', baseConfig)).toThrow();
  });
});