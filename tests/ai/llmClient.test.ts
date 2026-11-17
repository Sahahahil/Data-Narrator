// tests/ai/llmClient.test.ts
import { LLMClient } from '../../src/ai/llmClient';

describe('LLMClient (Real)', () => {
  let client: LLMClient;

  beforeEach(() => {
    client = new LLMClient({
      apiKey: 'test-key',
      endpoint: 'https://api.test.com/v1/chat/completions',
      timeout: 5000,
      retryCount: 2,
    });
  });

  describe('generateSQLAndConfig()', () => {
    it('should send prompt to LLM and return parsed response', async () => {
      // Mock fetch globally
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({
            sql: "SELECT * FROM orders",
            widgetType: "bar",
            chartConfig: { xAxisKey: "category", yAxisKeys: ["value"], title: "Test", description: "Desc" }
          })}}]
        })
      } as Response);

      const result = await client.generateSQLAndConfig("Show orders");
      expect(result.sql).toBe("SELECT * FROM orders");
      expect(result.widgetType).toBe("bar");
    });

    it('should retry on 5xx errors', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ choices: [{ message: { content: '{"sql":"SELECT 1","widgetType":"kpi","chartConfig":{}}' }}] })
        } as Response);

      const result = await client.generateSQLAndConfig("Test");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw on timeout', async () => {
      const timeoutClient = new LLMClient({
        apiKey: 'test-key',
        endpoint: 'https://api.test.com/v1/chat/completions',
        timeout: 100, // Short timeout for test
        retryCount: 0,
      });
      // Mock fetch to simulate abort after timeout
      global.fetch = vi.fn(() => Promise.reject(new DOMException('Aborted', 'AbortError')));
      await expect(timeoutClient.generateSQLAndConfig("Test")).rejects.toThrow('Timeout');
    }, 10000);
  });
});