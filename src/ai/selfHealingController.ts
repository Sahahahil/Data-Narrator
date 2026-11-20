interface LLMClient {
  generateSQLAndConfig(prompt: string): Promise<LLMResponse>;
}

interface ResponseParser {
  parse(response: string): ParsedResponse;
}

interface LLMResponse {
  sql: string;
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  chartConfig: ChartConfig;
}

interface ChartConfig {
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

interface ParsedResponse {
  sql: string;
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  chartConfig: ChartConfig;
}

interface TableSchema {
  columns: { name: string; type: string }[];
  sampleData: Record<string, unknown>[];
  columnStats?: Record<string, { distinct: number; nulls: number; min: unknown; max: unknown }>;
}

interface QueryExecutorResult {
  sql: string;
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  chartConfig: ChartConfig;
  queryResult: Record<string, unknown>[];
}

export class SelfHealingController {
  constructor(
    private llmClient: LLMClient,
    private responseParser: ResponseParser,
    private maxRetries: number = 2
  ) {}

  async executeWithRetry(
    userQuestion: string,
    queryExecutor: (sql: string) => Promise<Record<string, unknown>[]>,
    schema?: TableSchema
  ): Promise<QueryExecutorResult> {
    let lastError: unknown;
    let currentPrompt = userQuestion;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Generate SQL and config from LLM
        const llmResponse = await this.llmClient.generateSQLAndConfig(currentPrompt);
        const parsedResponse = this.responseParser.parse(JSON.stringify(llmResponse));

        // Try to execute the SQL
        const queryResult = await queryExecutor(parsedResponse.sql);

        // If we get here, both LLM response and SQL execution succeeded
        return {
          ...parsedResponse,
          queryResult,
        };
      } catch (error) {
        lastError = error;

        // If this is our last attempt, don't retry
        if (attempt === this.maxRetries) {
          break;
        }

        // Construct refinement prompt for LLM with schema info
        const schemaInfo = schema ? JSON.stringify(schema) : 'unknown';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorSql = (error as Record<string, unknown>).sql as string | undefined;
        currentPrompt = `Previous SQL: ${errorSql || 'unknown'}
Error: ${errorMessage}
Schema: ${schemaInfo}
Original Question: ${userQuestion}
Provide corrected SQL that addresses the error.`;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed after all retries');
  }
}
