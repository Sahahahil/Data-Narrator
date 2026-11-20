import { SelfHealingController } from '../../src/ai/selfHealingController';
import { LLMClient } from '../../src/ai/llmClient';
import { ResponseParser } from '../../src/ai/responseParser';
import { QueryExecutor } from '../../src/data/queryExecutor';
import { SchemaInspector, TableSchema } from '../../src/data/schemaInspector';

describe('SelfHealingController', () => {
  let controller: SelfHealingController;
  let mockLLMClient: LLMClient;
  let mockResponseParser: ResponseParser;
  let mockQueryExecutor: QueryExecutor;
  let mockSchemaInspector: SchemaInspector;

  beforeEach(() => {
    mockLLMClient = {
      generateSQLAndConfig: vi.fn()
    } as unknown as LLMClient;
    mockResponseParser = {
      parse: vi.fn()
    } as unknown as ResponseParser;
    mockQueryExecutor = {
      execute: vi.fn()
    } as unknown as QueryExecutor;
    mockSchemaInspector = {
      inspectTable: vi.fn()
    } as unknown as SchemaInspector;
    controller = new SelfHealingController(
      mockLLMClient,
      mockResponseParser,
      mockQueryExecutor,
      mockSchemaInspector
    );
  });

  describe('executeWithRetry()', () => {
    const mockSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' }
      ],
      sampleData: [
        { id: 1, category: 'A', value: 100 }
      ]
    };

    const mockResponse = {
      sql: "SELECT * FROM uploaded_data",
      widgetType: "bar",
      chartConfig: {
        xAxisKey: "category",
        yAxisKeys: ["value"],
        title: "Test Chart",
        description: "Test description"
      }
    };

    beforeEach(() => {
      mockSchemaInspector.inspectTable.mockResolvedValue(mockSchema);
      mockQueryExecutor.execute.mockResolvedValue([{ id: 1, category: 'A', value: 100 }]);
    });

    it('should succeed on first attempt', async () => {
      mockLLMClient.generateSQLAndConfig.mockResolvedValueOnce(mockResponse);
      mockResponseParser.parse.mockReturnValueOnce(mockResponse);

      const result = await controller.executeWithRetry("Show all orders");

      expect(result).toEqual({
        ...mockResponse,
        queryResult: [{ id: 1, category: 'A', value: 100 }]
      });
      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(1);
      expect(mockSchemaInspector.inspectTable).toHaveBeenCalledWith('uploaded_data');
      expect(mockQueryExecutor.execute).toHaveBeenCalledWith(mockResponse.sql);
    });

    it('should retry on DuckDB error', async () => {
      const mockErrorResponse = {
        sql: "SELECT * FROM nonexistent",
        widgetType: "bar",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      };

      const mockSuccessResponse = {
        sql: "SELECT * FROM uploaded_data",
        widgetType: "bar",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      };

      mockLLMClient.generateSQLAndConfig
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockSuccessResponse);

      mockResponseParser.parse
        .mockReturnValueOnce(mockErrorResponse)
        .mockReturnValueOnce(mockSuccessResponse);

      // First execute throws, second succeeds
      mockQueryExecutor.execute
        .mockRejectedValueOnce(new Error("Table 'nonexistent' does not exist"))
        .mockResolvedValueOnce([{ id: 1, category: 'A', value: 100 }]);

      const result = await controller.executeWithRetry("Show all orders");

      expect(result).toEqual({
        ...mockSuccessResponse,
        queryResult: [{ id: 1, category: 'A', value: 100 }]
      });
      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(2);
      expect(mockQueryExecutor.execute).toHaveBeenCalledTimes(2);
    });

    it('should give up after max retries', async () => {
      mockLLMClient.generateSQLAndConfig.mockResolvedValue(mockResponse);
      mockResponseParser.parse.mockReturnValue(mockResponse);

      const duckdbError = new Error("Persistent error");
      mockQueryExecutor.execute.mockRejectedValue(duckdbError);

      await expect(controller.executeWithRetry("Show problematic data")).rejects.toThrow();

      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(3);
      expect(mockQueryExecutor.execute).toHaveBeenCalledTimes(3);
    });
  });
});