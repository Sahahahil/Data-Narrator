interface LLMChartConfig {
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

interface ChartConfig {
  dataKey: string;
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

export function buildChartConfig(llmConfig: LLMChartConfig, widgetType: string): ChartConfig {
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