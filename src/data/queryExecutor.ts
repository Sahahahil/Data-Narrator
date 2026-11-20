import { DuckDBManager } from './duckdbManager';

export class QueryExecutor {
  constructor(private duckDBManager: DuckDBManager) {}

  async execute(sql: string): Promise<Record<string, unknown>[]> {
    const connection = await this.duckDBManager.connect();
    const result = await connection.query(sql);
    const array = await result.toArray();
    return array.map((row: { toJSON: () => Record<string, unknown> }) => row.toJSON());
  }
}