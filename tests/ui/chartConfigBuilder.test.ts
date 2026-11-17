import { buildChartConfig } from '../../src/ui/chartConfigBuilder';

describe('buildChartConfig()', () => {
  it('includes groupKey when provided for line', () => {
    const llmConfig = { xAxisKey: 'month', yAxisKeys: ['revenue'], groupKey: 'segment', title: 'Monthly Revenue', description: 'Trends by segment' };
    const result = buildChartConfig(llmConfig, 'line');
    expect(result.groupKey).toBe('segment');
  });

  it('excludes groupKey when not provided for bar', () => {
    const llmConfig = { xAxisKey: 'category', yAxisKeys: ['value'], title: 'Total by Category', description: 'Category totals' };
    const result = buildChartConfig(llmConfig, 'bar');
    expect(result.groupKey).toBeUndefined();
  });

  it('sets dataKey from yAxisKeys for kpi', () => {
    const llmConfig = { yAxisKeys: ['totalValue'], title: 'Total', description: 'Total value' };
    const result = buildChartConfig(llmConfig, 'kpi');
    expect(result.dataKey).toBe('totalValue');
  });
});