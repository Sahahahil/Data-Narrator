import { DuckDBManager } from './duckdbManager';

export async function executeQuery(duckDBManager: DuckDBManager, sql: string): Promise<any[]> {
  const connection = await duckDBManager.connect();
  const result = await connection.query(sql);
  const array = await result.toArray();
  return array.map((row: any) => row.toJSON());
}
