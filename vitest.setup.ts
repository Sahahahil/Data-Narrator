import { vi } from 'vitest';

// Mock the DuckDBManager and its dependencies
export const mockDuckDBManager = {
  initialize: vi.fn().mockResolvedValue(true),
  isInitialized: vi.fn().mockReturnValue(true),
  connect: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({
      toArray: vi.fn().mockResolvedValue([
        { toJSON: () => ({ category: 'A', value: 100 }) },
        { toJSON: () => ({ category: 'B', value: 200 }) },
      ]),
    }),
    registerFileHandle: vi.fn().mockResolvedValue(undefined),
    registerFile: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn().mockResolvedValue(undefined),
    }),
  };

export const mockLLMResponse = {
  sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
  widgetType: 'bar',
  chartConfig: {
    xAxisKey: 'category',
    yAxisKeys: ['total'],
    title: 'Total by Category',
    description: 'Total value by category',
  },
};

export const mockLLMClient = {
  generateSQLAndConfig: vi.fn(),
};

export const mockSelfHealingController = {
  executeWithRetry: vi.fn(),
};