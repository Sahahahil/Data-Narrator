import { LLMClient, LLMResponse } from './llmClient';
import { ResponseParser } from './responseParser';
import { QueryExecutor } from '../data/queryExecutor';
import { SchemaInspector, TableSchema } from '../data/schemaInspector';

export interface SelfHealingResult {
  sql: string;
  widgetType: LLMResponse['widgetType'];
  chartConfig: LLMResponse['chartConfig'];
  queryResult: Record<string, unknown>[];
}

export class SelfHealingController {
  constructor(
    private llmClient: LLMClient,
    private responseParser: ResponseParser,
    private queryExecutor: QueryExecutor,
    private schemaInspector: SchemaInspector,
    private maxRetries: number = 2
  ) {}

  async executeWithRetry(userQuestion: string, tableName: string = 'uploaded_data'): Promise<SelfHealingResult> {
    let lastError: Error = new Error('Failed after all retries');
    let currentPrompt = userQuestion;
    const schema = await this.schemaInspector.inspectTable(tableName);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const llmResponse = await this.llmClient.generateSQLAndConfig(currentPrompt);
        const parsed = this.responseParser.parse(JSON.stringify(llmResponse));
        const queryResult = await this.queryExecutor.execute(parsed.sql);

        return {
          sql: parsed.sql,
          widgetType: parsed.widgetType,
          chartConfig: parsed.chartConfig,
          queryResult,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt === this.maxRetries) break;

        // Build refinement prompt with error context
        const failedSql = (error as Record<string, unknown>)['sql'] as string | undefined;
        const errorMessage = error instanceof Error ? error.message : String(error);
        currentPrompt = this.buildRefinementPrompt(
          userQuestion,
          failedSql || 'unknown',
          errorMessage,
          schema,
          tableName
        );
      }
    }
    throw lastError;
  }

  private buildRefinementPrompt(
    originalQuestion: string,
    failedSql: string,
    errorMessage: string,
    schema: TableSchema,
    tableName: string
  ): string {
    const columnDefs = schema.columns.map(c => `${c.name} ${c.type}`).join(', ');
    return `The previous SQL failed. Please provide corrected SQL.

ORIGINAL QUESTION: ${originalQuestion}
FAILED SQL: ${failedSql}
ERROR: ${errorMessage}

SCHEMA (Table "${tableName}"): ${columnDefs}

Return ONLY the corrected JSON response with the same schema as before.`;
  }
}