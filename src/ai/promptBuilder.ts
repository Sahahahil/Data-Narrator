export class PromptBuilder {
  buildPrompt(
    schema: { columns: { name: string; type: string }[]; sampleData: any[]; columnStats?: Record<string, { distinct: number; nulls: number; min: any; max: any }> },
    userQuestion: string,
    tableName: string = 'orders'
  ): string {
    const columnDefs = schema.columns
      .map(col => `  ${col.name} ${col.type}`)
      .join(',\n');

    // Limit sample data to 3 rows
    const limitedSamples = schema.sampleData.slice(0, 3);
    const sampleStrings = limitedSamples
      .map(row => {
        const entries = Object.entries(row)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        return `{${entries}}`;
      });

    // Include column stats if available
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
[${sampleStrings.join(', ')}]

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