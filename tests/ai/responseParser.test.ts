import { ResponseParser } from '../../src/ai/responseParser';

describe('ResponseParser', () => {
  let parser: ResponseParser;

  beforeEach(() => {
    parser = new ResponseParser();
  });

  describe('parse()', () => {
    it('should parse valid LLM response', () => {
      const validResponse = JSON.stringify({
        sql: "SELECT * FROM orders",
        widgetType: "bar",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      });
      
      const result = parser.parse(validResponse);
      expect(result.sql).toBe("SELECT * FROM orders");
      expect(result.widgetType).toBe("bar");
      expect(result.chartConfig.xAxisKey).toBe("category");
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = "{ not valid json";
      expect(() => parser.parse(invalidJson)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const missingFields = JSON.stringify({
        sql: "SELECT * FROM orders"
        // missing widgetType and chartConfig
      });
      expect(() => parser.parse(missingFields)).toThrow();
    });

    it('should throw error for invalid widgetType', () => {
      const invalidWidgetType = JSON.stringify({
        sql: "SELECT * FROM orders",
        widgetType: "invalid",
        chartConfig: {
          xAxisKey: "category",
          yAxisKeys: ["value"],
          title: "Test Chart",
          description: "Test description"
        }
      });
      expect(() => parser.parse(invalidWidgetType)).toThrow();
    });
  });
});
