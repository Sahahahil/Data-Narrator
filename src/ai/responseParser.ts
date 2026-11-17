export class ResponseParser {
  parse(response: string): any {
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON response: ${message}`);
    }

    // Validate required fields
    if (!parsed.sql || typeof parsed.sql !== 'string') {
      throw new Error('Missing or invalid "sql" field');
    }

    if (!parsed.widgetType || !['bar', 'line', 'scatter', 'kpi'].includes(parsed.widgetType)) {
      throw new Error('Missing or invalid "widgetType" field. Must be one of: bar, line, scatter, kpi');
    }

    if (!parsed.chartConfig || typeof parsed.chartConfig !== 'object') {
      throw new Error('Missing or invalid "chartConfig" field');
    }

    const requiredChartFields = ['xAxisKey', 'yAxisKeys', 'title', 'description'];
    for (const field of requiredChartFields) {
      if (!parsed.chartConfig[field]) {
        throw new Error(`Missing required chartConfig field: ${field}`);
      }
    }

    // Validate yAxisKeys is an array
    if (!Array.isArray(parsed.chartConfig.yAxisKeys)) {
      throw new Error('chartConfig.yAxisKeys must be an array');
    }

    return parsed;
  }
}
