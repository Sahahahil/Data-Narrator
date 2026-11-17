export function buildChartConfig(llmConfig: any, widgetType: string): any {
  const base = {
    dataKey: widgetType === 'kpi' ? llmConfig.yAxisKeys?.[0] : llmConfig.xAxisKey,
    xAxisKey: llmConfig.xAxisKey,
    yAxisKeys: llmConfig.yAxisKeys,
    title: llmConfig.title,
    description: llmConfig.description,
  };

  if (llmConfig.groupKey) {
    return { ...base, groupKey: llmConfig.groupKey };
  }
  return base;
}