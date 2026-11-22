import { vi } from 'vitest';

// IntersectionObserver polyfill for JSDOM
if (typeof global.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: ReadonlyArray<number> = [0];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
  }
  global.IntersectionObserver = MockIntersectionObserver as any;
}

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