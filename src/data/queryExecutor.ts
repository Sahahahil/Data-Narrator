import { DuckDBManager } from './duckdbManager';
import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

export class QueryExecutor {
  constructor(private duckDBManager: DuckDBManager) {}

  async execute(sql: string): Promise<any[]> {
    const connection = await this.duckDBManager.connect();
    const result = await connection.query(sql);
    const array = await result.toArray();
    return array.map((row: any) => row.toJSON());
  }
}
