interface ChartConfig {
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

interface ParsedResponse {
  sql: string;
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  chartConfig: ChartConfig;
}

export class ResponseParser {
  parse(response: string): ParsedResponse {
    let parsed: unknown;
    try {
      parsed = JSON.parse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const parseError = new Error(`Invalid JSON response: ${message}`);
      (parseError as Error & { cause?: unknown }).cause = error;
      throw parseError;
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON response: not an object');
    }

    const obj = parsed as Record<string, unknown>;

    // Validate required fields
    if (!obj['sql'] || typeof obj['sql'] !== 'string') {
      throw new Error('Missing or invalid "sql" field');
    }

    if (!obj['widgetType'] || !['bar', 'line', 'scatter', 'kpi'].includes(obj['widgetType'] as string)) {
      throw new Error('Missing or invalid "widgetType" field. Must be one of: bar, line, scatter, kpi');
    }

    if (!obj['chartConfig'] || typeof obj['chartConfig'] !== 'object') {
      throw new Error('Missing or invalid "chartConfig" field');
    }

    const chartConfig = obj['chartConfig'] as Record<string, unknown>;
    const requiredChartFields = ['xAxisKey', 'yAxisKeys', 'title', 'description'];
    for (const field of requiredChartFields) {
      if (!chartConfig[field]) {
        throw new Error(`Missing required chartConfig field: ${field}`);
      }
    }

    // Validate yAxisKeys is an array
    if (!Array.isArray(chartConfig['yAxisKeys'])) {
      throw new Error('chartConfig.yAxisKeys must be an array');
    }

    return {
      sql: obj['sql'] as string,
      widgetType: obj['widgetType'] as 'bar' | 'line' | 'scatter' | 'kpi',
      chartConfig: {
        xAxisKey: chartConfig['xAxisKey'] as string,
        yAxisKeys: chartConfig['yAxisKeys'] as string[],
        groupKey: chartConfig['groupKey'] as string | undefined,
        title: chartConfig['title'] as string,
        description: chartConfig['description'] as string,
      },
    };
  }
}