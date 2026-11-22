import { QueryExecutor } from './queryExecutor';
import { TableSchema, ColumnInfo } from './schemaInspector';

export interface ColumnProfile {
  name: string;
  type: string;
  distinctCount: number;
  nullCount: number;
  nullPercent: number;
  min?: string | number;
  max?: string | number;
  sampleValues: unknown[];
  isCategorical: boolean;
  isTemporal: boolean;
  isNumeric: boolean;
}

export interface SuggestedWidget {
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  title: string;
  description: string;
  chartConfig: {
    xAxisKey: string;
    yAxisKeys: string[];
    groupKey?: string;
  };
  confidence: number;
}

export interface TableProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  suggestedWidgets: SuggestedWidget[];
}

export class DataProfiler {
  constructor(
    private queryExecutor: QueryExecutor,
    private schema: TableSchema,
    private tableName: string
  ) {}

  async profile(): Promise<TableProfile> {
    // 1. Row count
    const rowCountResult = await this.queryExecutor.execute(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    const rowCount = Number(rowCountResult[0]?.['count'] ?? 0);

    // 2. Profile each column in parallel (chunked to avoid blocking)
    const columnProfiles = await Promise.all(
      this.schema.columns.map(col => this.profileColumn(col, rowCount))
    );

    // 3. Generate widget suggestions
    const suggestedWidgets = this.generateWidgetSuggestions(columnProfiles, rowCount);

    return {
      rowCount,
      columnCount: this.schema.columns.length,
      columns: columnProfiles,
      suggestedWidgets,
    };
  }

  private async profileColumn(col: ColumnInfo, rowCount: number): Promise<ColumnProfile> {
    const isNumeric = /INT|DOUBLE|DECIMAL|FLOAT|NUMERIC/i.test(col.type);
    const isTemporal = /DATE|TIMESTAMP|TIME/i.test(col.type);

    // Distinct count (sample for large tables)
    const distinctSql = rowCount > 10000
      ? `SELECT APPROX_COUNT_DISTINCT(${col.name}) as distinct_count FROM ${this.tableName}`
      : `SELECT COUNT(DISTINCT ${col.name}) as distinct_count FROM ${this.tableName}`;
    const distinctResult = await this.queryExecutor.execute(distinctSql);
    const distinctCount = Number(distinctResult[0]?.['distinct_count'] ?? 0);

    // Null count
    const nullResult = await this.queryExecutor.execute(
      `SELECT COUNT(*) as null_count FROM ${this.tableName} WHERE ${col.name} IS NULL`
    );
    const nullCount = Number(nullResult[0]?.['null_count'] ?? 0);

    // Min/Max for numeric/temporal
    let min: string | number | undefined;
    let max: string | number | undefined;
    if (isNumeric || isTemporal) {
      const minMaxResult = await this.queryExecutor.execute(
        `SELECT MIN(${col.name}) as min_val, MAX(${col.name}) as max_val FROM ${this.tableName}`
      );
      min = minMaxResult[0]?.['min_val'] as string | number | undefined;
      max = minMaxResult[0]?.['max_val'] as string | number | undefined;
    }

    // Sample distinct values (up to 10)
    const sampleResult = await this.queryExecutor.execute(
      `SELECT DISTINCT ${col.name} FROM ${this.tableName} LIMIT 10`
    );
    const sampleValues = sampleResult.map(r => r[col.name as keyof typeof r]);

    return {
      name: col.name,
      type: col.type,
      distinctCount,
      nullCount,
      nullPercent: rowCount > 0 ? (nullCount / rowCount) * 100 : 0,
      min,
      max,
      sampleValues,
      isCategorical: !isNumeric && !isTemporal && distinctCount < rowCount * 0.5,
      isTemporal,
      isNumeric,
    };
  }

  private generateWidgetSuggestions(profiles: ColumnProfile[], rowCount: number): SuggestedWidget[] {
    const suggestions: SuggestedWidget[] = [];
    const numericCols = profiles.filter(p => p.isNumeric);
    const categoricalCols = profiles.filter(p => p.isCategorical);
    const temporalCols = profiles.filter(p => p.isTemporal);

    // KPI: Total of first numeric column
    const firstNumeric = numericCols[0];
    if (firstNumeric) {
      suggestions.push({
        widgetType: 'kpi',
        title: `Total ${firstNumeric.name}`,
        description: `Sum of ${firstNumeric.name} across all ${rowCount} rows`,
        chartConfig: { xAxisKey: '', yAxisKeys: [firstNumeric.name] },
        confidence: 0.9,
      });
    }

    // Bar: Categorical vs Numeric
    const firstCategorical = categoricalCols[0];
    if (firstCategorical && firstNumeric) {
      suggestions.push({
        widgetType: 'bar',
        title: `${firstNumeric.name} by ${firstCategorical.name}`,
        description: `${firstNumeric.name} grouped by ${firstCategorical.name}`,
        chartConfig: { xAxisKey: firstCategorical.name, yAxisKeys: [firstNumeric.name] },
        confidence: 0.85,
      });
    }

    // Line: Temporal vs Numeric
    const firstTemporal = temporalCols[0];
    if (firstTemporal && firstNumeric) {
      suggestions.push({
        widgetType: 'line',
        title: `${firstNumeric.name} over time`,
        description: `${firstNumeric.name} trend by ${firstTemporal.name}`,
        chartConfig: { xAxisKey: firstTemporal.name, yAxisKeys: [firstNumeric.name] },
        confidence: 0.9,
      });
    }

    // Scatter: Two numeric columns
    const secondNumeric = numericCols[1];
    if (secondNumeric && firstNumeric) {
      suggestions.push({
        widgetType: 'scatter',
        title: `${secondNumeric.name} vs ${firstNumeric.name}`,
        description: `Correlation between ${firstNumeric.name} and ${secondNumeric.name}`,
        chartConfig: { xAxisKey: firstNumeric.name, yAxisKeys: [secondNumeric.name] },
        confidence: 0.7,
      });
    }

    return suggestions.slice(0, 5); // Max 5 widgets
  }
}