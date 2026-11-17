import { DuckDBManager } from './duckdbManager';
import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

export interface ColumnInfo { name: string; type: string; }
export interface TableSchema { columns: ColumnInfo[]; sampleData: any[]; }

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

    return { columns, sampleData };
  }
}