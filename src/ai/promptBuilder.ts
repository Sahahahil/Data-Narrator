import { TableSchema } from '../data/schemaInspector';
import { Relationship } from '../data/multiFileRegistry';

export interface MultiTableSchema {
  tables: Map<string, TableSchema>;
  relationships: Relationship[];
  primaryTable?: string;
}

export class PromptBuilder {
  buildPrompt(
    input: MultiTableSchema | { schema: TableSchema; userQuestion: string; tableName?: string } | TableSchema,
    userQuestion?: string,
    _tableName?: string
  ): string {
    // Handle legacy single-table call: buildPrompt(schema, question, tableName)
    if (!('tables' in input) && 'columns' in input) {
      return this.buildSingleTablePrompt(input, userQuestion || '', _tableName || 'orders');
    }
    // Handle legacy object format: buildPrompt({ schema, userQuestion, tableName })
    if (!('tables' in input) && 'schema' in input) {
      return this.buildSingleTablePrompt(input.schema, input.userQuestion, input.tableName || 'orders');
    }

    const { tables, relationships, primaryTable } = input;
    const primaryTableName = primaryTable || Array.from(tables.keys())[0] || 'uploaded_data';
    const question = userQuestion || '';

    const schemaSections = Array.from(tables.entries()).map(([name, schema]) => {
      const columnDefs = schema.columns
        .map(col => `  ${col.name} ${col.type}`)
        .join(',\n');

      let columnStats = '';
      if (schema.columnStats) {
        columnStats = Object.entries(schema.columnStats)
          .map(([col, stat]) => `  -- ${col}: distinct=${stat.distinct}, nulls=${stat.nulls}, min=${stat.min}, max=${stat.max}`)
          .join('\n');
      }

      return `Table "${name}" (\n${columnDefs}\n)\n${columnStats}`;
    }).join('\n\n');

    const relSection = relationships.length > 0
      ? `\nRELATIONSHIPS:\n${relationships.map(r =>
        `- ${r.tableA}.${r.columnA} = ${r.tableB}.${r.columnB} (${r.type}, ${Math.round(r.confidence * 100)}% confidence)`
      ).join('\n')}`
      : '';

    // Limit sample data to 3 rows from primary table
    const primarySchema = tables.get(primaryTableName);
    const sampleStrings = primarySchema?.sampleData.slice(0, 3).map(row => {
      const entries = Object.entries(row)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      return `{${entries}}`;
    }) || [];

    return `You are an expert Data Engineer & UI Architect. Given multiple database tables, convert the user query into a valid DuckDB SQL query and a JSON layout specification.

DATABASE SCHEMAS:
${schemaSections}
${relSection}

SAMPLE DATA (from ${primaryTableName}):
${sampleStrings.join('\n') || 'No sample data available'}

USER QUESTION:
${question}

OUTPUT INSTRUCTIONS:
Return strictly a valid JSON object matching this schema:
{
  "sql": "<Valid DuckDB SQL statement with explicit JOINs and table aliases>",
  "widgetType": "bar" | "line" | "scatter" | "kpi",
  "chartConfig": {
    "xAxisKey": "<column_name>",
    "yAxisKeys": ["<column_name>"],
    "groupKey": "<optional_column_name>",
    "title": "<Short Chart Title>",
    "description": "<Executive commentary explaining what the chart shows>"
  }
}

For multi-table queries, use explicit JOIN syntax with table aliases (e.g., t1.column, t2.column).
Use relationship hints for join columns when available.`;
  }

  private buildSingleTablePrompt(schema: TableSchema, userQuestion: string, tableName: string): string {
    const columnDefs = schema.columns
      .map(col => `  ${col.name} ${col.type}`)
      .join(',\n');

    const limitedSamples = schema.sampleData.slice(0, 3);
    const sampleStrings = limitedSamples
      .map(row => {
        const entries = Object.entries(row)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        return `{${entries}}`;
      });

    let columnStats = '';
    if (schema.columnStats) {
      columnStats = Object.entries(schema.columnStats)
        .map(([col, stat]) => `  -- ${col}: distinct=${stat.distinct}, nulls=${stat.nulls}, min=${stat.min}, max=${stat.max}`)
        .join('\n');
    }

    return `You are an expert Data Engineer & UI Architect. Given a database schema, convert the user query into a valid DuckDB SQL query and a JSON layout specification.

DATABASE SCHEMA:
Table "${tableName}" (
${columnDefs}
)
${columnStats}

SAMPLE DATA (first 3 rows):
[${sampleStrings.join(', ') || ''}]

USER QUESTION:
${userQuestion}

OUTPUT INSTRUCTIONS:
Return strictly a valid JSON object matching this schema:
{
  "sql": "<Valid DuckDB SQL statement>",
  "widgetType": "bar" | "line" | "scatter" | "kpi",
  "chartConfig": {
    "xAxisKey": "<column_name>",
    "yAxisKeys": ["<column_name>"],
    "groupKey": "<optional_column_name>",
    "title": "<Short Chart Title>",
    "description": "<Executive commentary explaining what the chart shows>"
  }
}`;
  }
}