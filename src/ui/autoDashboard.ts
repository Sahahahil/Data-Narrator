import { TableProfile } from '../data/dataProfiler';
import { ChartConfigBuilder } from './chartConfigBuilder';
import { QueryExecutor } from '../data/queryExecutor';
import { SchemaInspector } from '../data/schemaInspector';

export interface DashboardWidget {
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  config: {
    dataKey: string;
    xAxisKey: string;
    yAxisKeys: string[];
    groupKey?: string;
    title: string;
    description: string;
  };
  data: Record<string, unknown>[];
}

export class AutoDashboard {
  constructor(private chartConfigBuilder: ChartConfigBuilder) {}

  generateDashboard(profile: TableProfile): Omit<DashboardWidget, 'data'>[] {
    return profile.suggestedWidgets.map(suggestion => ({
      widgetType: suggestion.widgetType,
      config: this.chartConfigBuilder.buildChartConfig(
        {
          xAxisKey: suggestion.chartConfig.xAxisKey,
          yAxisKeys: suggestion.chartConfig.yAxisKeys,
          groupKey: suggestion.chartConfig.groupKey,
          title: suggestion.title,
          description: suggestion.description,
        },
        suggestion.widgetType
      ),
      data: [],
    }));
  }

  async executeDashboard(
    profile: TableProfile,
    queryExecutor: QueryExecutor,
    _schemaInspector: SchemaInspector,
    tableName: string
  ): Promise<DashboardWidget[]> {
    const widgets = this.generateDashboard(profile);

    const results = await Promise.all(
      widgets.map(async (widget) => {
        const sql = this.buildSqlFromConfig(widget.config, tableName);
        try {
          const data = await queryExecutor.execute(sql);
          return { ...widget, data };
        } catch {
          // Silently handle errors - widget will have empty data
          return { ...widget, data: [] };
        }
      })
    );

    return results;
  }

  private buildSqlFromConfig(config: {
    dataKey: string;
    xAxisKey: string;
    yAxisKeys: string[];
    groupKey?: string;
  }, tableName: string): string {
    const { xAxisKey, yAxisKeys, groupKey } = config;

    if (!xAxisKey) {
      return `SELECT SUM(${yAxisKeys[0]}) as total FROM ${tableName}`;
    }

    const selectCols = [xAxisKey, ...yAxisKeys];
    if (groupKey) {
      selectCols.push(groupKey);
    }

    const groupBy = groupKey ? `GROUP BY ${groupKey}, ${xAxisKey}` : `GROUP BY ${xAxisKey}`;

    return `SELECT ${selectCols.join(', ')} FROM ${tableName} ${groupBy} ORDER BY ${xAxisKey}`;
  }
}