import { DuckDBManager } from './duckdbManager';
import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { ColumnInfo } from './schemaInspector';

export interface RegisteredTable {
  name: string;
  file: File;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface Relationship {
  tableA: string;
  columnA: string;
  tableB: string;
  columnB: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  confidence: number;
}

export class MultiFileRegistry {
  private tables: Map<string, RegisteredTable> = new Map();
  private duckDBManager: DuckDBManager;

  constructor(duckDBManager: DuckDBManager) {
    this.duckDBManager = duckDBManager;
  }

  async registerFile(tableName: string, file: File): Promise<RegisteredTable> {
    // Register with DuckDB through the manager
    await this.duckDBManager.registerFile(tableName, file);

    // Get schema
    const conn = await this.duckDBManager.connect() as AsyncDuckDBConnection;
    const schemaResult = await conn.query(`DESCRIBE ${tableName}`);
    const schemaArray = await schemaResult.toArray();

    const columns: ColumnInfo[] = schemaArray.map((row: { column_name: string; column_type: string }) => ({
      name: row.column_name,
      type: row.column_type,
    }));

    // Get row count
    const countResult = await conn.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
    const countArray = await countResult.toArray();
    const rowCount = Number(countArray[0]?.cnt || 0);

    const table: RegisteredTable = { name: tableName, file, columns, rowCount };
    this.tables.set(tableName, table);

    return table;
  }

  getTables(): RegisteredTable[] {
    return Array.from(this.tables.values());
  }

  getTable(name: string): RegisteredTable | undefined {
    return this.tables.get(name);
  }

  removeTable(name: string): void {
    this.tables.delete(name);
  }

  clear(): void {
    this.tables.clear();
  }

  // Relationship detection
  detectRelationships(): Relationship[] {
    const relationships: Relationship[] = [];
    const tables = this.getTables();

    for (let i = 0; i < tables.length; i++) {
      const tableA = tables[i];
      if (!tableA) continue;
      for (let j = i + 1; j < tables.length; j++) {
        const tableB = tables[j];
        if (!tableB) continue;

        const relationshipsBetweenPair = this.detectRelationshipsBetweenTables(tableA, tableB);
        relationships.push(...relationshipsBetweenPair);
      }
    }

    // Sort by confidence descending
    return relationships.sort((a, b) => b.confidence - a.confidence);
  }

  private detectRelationshipsBetweenTables(tableA: RegisteredTable, tableB: RegisteredTable): Relationship[] {
    const relationships: Relationship[] = [];

    // Create a map of column names to ColumnInfo for quick lookup
    const columnsB = new Map(tableB.columns.map(c => [c.name.toLowerCase(), c]));

    for (const colA of tableA.columns) {
      const colB = columnsB.get(colA.name.toLowerCase());
      if (!colB) continue;

      // Check if types are compatible
      if (!this.areTypesCompatible(colA.type, colB.type)) continue;

      // Calculate distinct ratio for both sides (simplified)
      // In a real implementation, we'd query actual distinct counts
      const distinctRatioA = 0.5; // placeholder
      const distinctRatioB = 0.5; // placeholder

      const type = this.classifyRelationship(distinctRatioA, distinctRatioB);
      const confidence = Math.min(distinctRatioA, distinctRatioB);

      relationships.push({
        tableA: tableA.name,
        columnA: colA.name,
        tableB: tableB.name,
        columnB: colB.name,
        type,
        confidence,
      });
    }

    return relationships;
  }

  private areTypesCompatible(typeA: string, typeB: string): boolean {
    const normalizeType = (type: string) => type.toUpperCase().replace(/\(.*\)/, '');
    const normA = normalizeType(typeA);
    const normB = normalizeType(typeB);

    // Exact match
    if (normA === normB) return true;

    // Numeric types compatible
    const numericTypes = ['INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'DOUBLE', 'FLOAT', 'REAL', 'DECIMAL', 'NUMERIC'];
    if (numericTypes.includes(normA) && numericTypes.includes(normB)) return true;

    // String types compatible
    const stringTypes = ['VARCHAR', 'CHAR', 'TEXT', 'STRING'];
    if (stringTypes.includes(normA) && stringTypes.includes(normB)) return true;

    // Date/time types compatible
    const dateTypes = ['DATE', 'TIMESTAMP', 'TIME', 'DATETIME'];
    if (dateTypes.includes(normA) && dateTypes.includes(normB)) return true;

    // Boolean
    if (normA === 'BOOLEAN' && normB === 'BOOLEAN') return true;

    return false;
  }

  private classifyRelationship(ratioA: number, ratioB: number): 'one-to-one' | 'one-to-many' | 'many-to-many' {
    const threshold = 0.9;

    if (ratioA >= threshold && ratioB >= threshold) return 'one-to-one';
    if ((ratioA >= threshold && ratioB < 0.1) || (ratioB >= threshold && ratioA < 0.1)) return 'one-to-many';
    return 'many-to-many';
  }
}