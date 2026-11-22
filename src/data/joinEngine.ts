import { MultiFileRegistry, RegisteredTable } from './multiFileRegistry';

export interface JoinParams {
  baseTable: string;
  joinTable: string;
  joinColumn: string;
  selectColumns: string[];
  joinType?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  whereClause?: string;
  groupBy?: string[];
  orderBy?: string[];
}

export interface JoinSuggestion {
  sql: string;
  description: string;
  confidence: number;
  tables: string[];
}

export class JoinEngine {
  constructor(private registry: MultiFileRegistry) {}

  generateJoinSQL(params: JoinParams): string {
    const { baseTable, joinTable, joinColumn, selectColumns, joinType = 'INNER', whereClause, groupBy, orderBy } = params;

    // Build SELECT clause
    const selectClause = selectColumns.join(', ');

    // Build JOIN clause
    const joinClause = `${joinType} JOIN ${joinTable} ON ${baseTable}.${joinColumn} = ${joinTable}.${joinColumn}`;

    // Build WHERE clause
    const whereClauseStr = whereClause ? `WHERE ${whereClause}` : '';

    // Build GROUP BY clause
    const groupByStr = groupBy && groupBy.length > 0 ? `GROUP BY ${groupBy.join(', ')}` : '';

    // Build ORDER BY clause
    const orderByStr = orderBy && orderBy.length > 0 ? `ORDER BY ${orderBy.join(', ')}` : '';

    return `
SELECT ${selectClause}
FROM ${baseTable}
${joinClause}
${whereClauseStr}
${groupByStr}
${orderByStr}
`.trim();
  }

  suggestJoins(): JoinSuggestion[] {
    const relationships = this.registry.detectRelationships();
    const suggestions: JoinSuggestion[] = [];

    for (const rel of relationships) {
      // Get columns from both tables
      const tableA = this.registry.getTable(rel.tableA);
      const tableB = this.registry.getTable(rel.tableB);

      if (!tableA || !tableB) continue;

      // Build select columns - use table aliases
      const columnsA = tableA.columns.map(c => `t1.${c.name}`);
      const columnsB = tableB.columns.map(c => `t2.${c.name}`);
      const selectColumns = [...columnsA, ...columnsB];

      // Generate SQL
      const sql = this.generateJoinSQL({
        baseTable: rel.tableA,
        joinTable: rel.tableB,
        joinColumn: rel.columnA,
        selectColumns,
        joinType: 'INNER',
      });

      suggestions.push({
        sql,
        description: `Join ${rel.tableA} with ${rel.tableB} on ${rel.columnA} (${rel.type}, ${Math.round(rel.confidence * 100)}% confidence)`,
        confidence: rel.confidence,
        tables: [rel.tableA, rel.tableB],
      });
    }

    return suggestions;
  }

  // Generate JOIN SQL from a natural language question context
  generateJoinFromQuestion(
    baseTable: string,
    joinTable: string,
    joinColumn: string,
    questionColumns: string[],
    tables: RegisteredTable[]
  ): string {
    // Find the table objects
    const baseTableObj = tables.find(t => t.name === baseTable);
    const joinTableObj = tables.find(t => t.name === joinTable);

    if (!baseTableObj || !joinTableObj) {
      throw new Error(`Table not found: ${baseTable} or ${joinTable}`);
    }

    // Build select columns - use aliases
    const baseColumns = baseTableObj.columns
      .filter(c => questionColumns.some(qc => qc.toLowerCase() === c.name.toLowerCase()))
      .map(c => `t1.${c.name} as ${c.name}`);

    const joinColumns = joinTableObj.columns
      .filter(c => questionColumns.some(qc => qc.toLowerCase() === c.name.toLowerCase()))
      .map(c => `t2.${c.name} as ${c.name}`);

    const selectColumns = [...baseColumns, ...joinColumns];

    // If no specific columns requested, use all
    const selectClause = questionColumns.length > 0
      ? selectColumns.join(', ')
      : `${baseTableObj.columns.map(c => `t1.${c.name}`).join(', ')}, ${joinTableObj.columns.map(c => `t2.${c.name}`).join(', ')}`;

    return `
SELECT ${selectClause}
FROM ${baseTable} t1
INNER JOIN ${joinTable} t2 ON t1.${joinColumn} = t2.${joinColumn}
`.trim();
  }
}