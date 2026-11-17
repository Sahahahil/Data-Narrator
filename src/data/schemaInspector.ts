import { DuckDBManager } from './duckdbManager';
import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

export interface ColumnInfo { name: string; type: string; }
export interface TableSchema { columns: ColumnInfo[]; sampleData: any[]; columnStats?: Record<string, { distinct: number; nulls: number; min: any; max: any }>; }

export class SchemaInspector {
  constructor(private duckDBManager: DuckDBManager) {}

  async inspectTable(tableName: string): Promise<TableSchema> {
    const conn = await this.duckDBManager.connect() as AsyncDuckDBConnection;

    const describeResult = await conn.query(`DESCRIBE ${tableName}`);
    const describeArray = await describeResult.toArray();

    const sampleResult = await conn.query(`SELECT * FROM ${tableName} LIMIT 5`);
    const sampleArray = await sampleResult.toArray();

    const columns = describeArray.map((row: any) => ({
      name: row.column_name,
      type: row.column_type,
    }));

    const sampleData = sampleArray.map((row: any) => row.toJSON());

    // Calculate column stats
    const columnStats: Record<string, { distinct: number; nulls: number; min: any; max: any }> = {};
    for (const col of columns) {
      const values = sampleData.map(row => row[col.name]).filter(v => v !== null && v !== undefined);
      const distinctValues = new Set(values);
      const numericValues = values.filter(v => typeof v === 'number');

      columnStats[col.name] = {
        distinct: distinctValues.size,
        nulls: sampleData.length - values.length,
        min: numericValues.length > 0 ? Math.min(...numericValues) : values[0],
        max: numericValues.length > 0 ? Math.max(...numericValues) : values[values.length - 1],
      };
    }

    return { columns, sampleData, columnStats };
  }
}