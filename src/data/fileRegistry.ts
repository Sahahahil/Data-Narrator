import { DuckDBManager } from './duckdbManager';

export class FileRegistry {
  constructor(private duckDBManager: DuckDBManager) {}

  async registerFile(tableName: string, file: File): Promise<void> {
    await this.duckDBManager.registerFile(tableName, file);
  }
}