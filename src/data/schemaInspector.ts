import { DuckDBManager } from './duckdbManager';
import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { QueryExecutor } from './queryExecutor';

export interface ColumnInfo { name: string; type: string; }

export interface ColumnStats {
  distinct: number;
  nulls: number;
  nullPercent: number;
  min?: string | number;
  max?: string | number;
}

export interface TableSchema {
  columns: ColumnInfo[];
  sampleData: Record<string, unknown>[];
  columnStats?: Record<string, ColumnStats>;
}

interface DescribeRow { column_name: string; column_type: string; }

export class SchemaInspector {
  constructor(private duckDBManager: DuckDBManager) {}

  async inspectTable(tableName: string): Promise<TableSchema> {
    const conn = await this.duckDBManager.connect() as AsyncDuckDBConnection;

    const describeResult = await conn.query(`DESCRIBE ${tableName}`);
    const describeArray = await describeResult.toArray();

    const sampleResult = await conn.query(`SELECT * FROM ${tableName} LIMIT 5`);
    const sampleArray = await sampleResult.toArray();

    const columns = describeArray.map((row: DescribeRow) => ({
      name: row.column_name,
      type: row.column_type,
    }));

    const sampleData = sampleArray.map((row: { toJSON: () => Record<string, unknown> }) => row.toJSON());

    // Calculate column stats using DuckDB queries
    const queryExecutor = new QueryExecutor(this.duckDBManager);
    const columnStats = await this.getColumnStats(queryExecutor, tableName, columns);

    return { columns, sampleData, columnStats };
  }

  async getColumnStats(
    queryExecutor: QueryExecutor,
    tableName: string,
    columns: ColumnInfo[]
  ): Promise<Record<string, ColumnStats>> {
    const columnStats: Record<string, ColumnStats> = {};

    for (const col of columns) {
      const isNumeric = /INT|DOUBLE|DECIMAL|FLOAT|NUMERIC/i.test(col.type);
      const isTemporal = /DATE|TIMESTAMP|TIME/i.test(col.type);

      // Distinct count
      const distinctResult = await queryExecutor.execute(
        `SELECT COUNT(DISTINCT ${col.name}) as distinct_count FROM ${tableName}`
      );
      const distinct = Number(distinctResult[0]?.['distinct_count'] ?? 0);

      // Null count
      const nullResult = await queryExecutor.execute(
        `SELECT COUNT(*) as null_count FROM ${tableName} WHERE ${col.name} IS NULL`
      );
      const nulls = Number(nullResult[0]?.['null_count'] ?? 0);

      // Row count for null percent
      const rowCountResult = await queryExecutor.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = Number(rowCountResult[0]?.['count'] ?? 0);
      const nullPercent = rowCount > 0 ? (nulls / rowCount) * 100 : 0;

      // Min/Max for numeric/temporal
      let min: string | number | undefined;
      let max: string | number | undefined;
      if (isNumeric || isTemporal) {
        const minMaxResult = await queryExecutor.execute(
          `SELECT MIN(${col.name}) as min_val, MAX(${col.name}) as max_val FROM ${tableName}`
        );
        min = minMaxResult[0]?.['min_val'] as string | number | undefined;
        max = minMaxResult[0]?.['max_val'] as string | number | undefined;
      }

      columnStats[col.name] = {
        distinct,
        nulls,
        nullPercent,
        min,
        max,
      };
    }

    return columnStats;
  }
}