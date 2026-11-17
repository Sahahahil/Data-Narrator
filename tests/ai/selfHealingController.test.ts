import { SelfHealingController } from '../../src/ai/selfHealingController';
import { LLMClient } from '../../src/ai/llmClient';
import { ResponseParser } from '../../src/ai/responseParser';

describe('SelfHealingController', () => {
  let controller: SelfHealingController;
  let mockLLMClient: LLMClient;
  let mockResponseParser: ResponseParser;

  beforeEach(() => {
    mockLLMClient = {
      generateSQLAndConfig: vi.fn()
    } as unknown as LLMClient;
    mockResponseParser = {
      parse: vi.fn()
    } as unknown as ResponseParser;
    controller = new SelfHealingController(mockLLMClient, mockResponseParser);
  });

  describe('executeWithRetry()', () => {
    it('should succeed on first attempt', async () => {
      const mockResponse = {
        sql: "SELECT * FROM orders",
        widgetType: "bar",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      };
      
      mockLLMClient.generateSQLAndConfig.mockResolvedValueOnce(mockResponse);
      mockResponseParser.parse.mockReturnValueOnce(mockResponse);
      
      const result = await controller.executeWithRetry("Show all orders",
        async (sql: string) => {
          return [{ id: 1, name: 'test' }];
        });
      
      expect(result).toEqual({
        ...mockResponse,
        queryResult: [{ id: 1, name: 'test' }]
      });
      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(1);
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
        sql: "SELECT * FROM orders",
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
      
      const duckdbError = new Error("Table 'nonexistent' does not exist");
      
      const result = await controller.executeWithRetry("Show all orders",
        async (sql: string) => {
          if (sql.includes('nonexistent')) throw duckdbError;
          return [];
        });
      
      expect(result).toEqual({
        ...mockSuccessResponse,
        queryResult: []
      });
      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(2);
    });

    it('should give up after max retries', async () => {
      const mockResponse = {
        sql: "SELECT * FROM problematic",
        widgetType: "bar",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      };
      
      mockLLMClient.generateSQLAndConfig.mockResolvedValue(mockResponse);
      
      const duckdbError = new Error("Persistent error");
      
      await expect(controller.executeWithRetry("Show problematic data", 
        async (sql: string) => {
          throw duckdbError;
        })).rejects.toThrow();
      
      expect(mockLLMClient.generateSQLAndConfig).toHaveBeenCalledTimes(3);
    });
  });
});
