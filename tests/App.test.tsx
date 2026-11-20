import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

vi.mock('../src/data/duckdbManager', () => ({
  DuckDBManager: vi.fn().mockImplementation(() => ({
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
    }),
    registerFile: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/data/fileRegistry', () => ({
  FileRegistry: vi.fn().mockImplementation(() => ({
    registerFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/data/schemaInspector', () => ({
  SchemaInspector: vi.fn().mockImplementation(() => ({
    inspectTable: vi.fn().mockResolvedValue({
      columns: [
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
      ],
      sampleData: [
        { category: 'A', value: 100 },
        { category: 'B', value: 200 },
      ],
    }),
  })),
}));

vi.mock('../src/data/queryExecutor', () => ({
  QueryExecutor: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../src/ai/llmClient', () => ({
  LLMClient: vi.fn().mockImplementation(() => ({
    generateSQLAndConfig: vi.fn().mockResolvedValue({
      sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
      widgetType: 'bar',
      chartConfig: {
        xAxisKey: 'category',
        yAxisKeys: ['total'],
        title: 'Total by Category',
        description: 'Total value by category',
      },
    }),
  })),
}));

vi.mock('../src/ai/promptBuilder', () => ({
  PromptBuilder: vi.fn().mockImplementation(() => ({
    buildPrompt: vi.fn().mockReturnValue('test prompt'),
  })),
}));

vi.mock('../src/ai/responseParser', () => ({
  ResponseParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
      widgetType: 'bar',
      chartConfig: {
        xAxisKey: 'category',
        yAxisKeys: ['total'],
        title: 'Total by Category',
        description: 'Total value by category',
      },
    }),
  })),
}));

vi.mock('../src/ui/chartConfigBuilder', () => ({
  ChartConfigBuilder: vi.fn().mockImplementation(() => ({
    buildChartConfig: vi.fn().mockReturnValue({
      dataKey: 'category',
      xAxisKey: 'category',
      yAxisKeys: ['total'],
      title: 'Total by Category',
      description: 'Total value by category',
    }),
  })),
}));

vi.mock('../src/ui/autoDashboard', () => ({
  AutoDashboard: vi.fn().mockImplementation(() => ({
    executeDashboard: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../src/ai/selfHealingController', () => ({
  SelfHealingController: vi.fn().mockImplementation(() => ({
    executeWithRetry: vi.fn().mockResolvedValue({
      sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
      widgetType: 'bar',
      chartConfig: {
        xAxisKey: 'category',
        yAxisKeys: ['total'],
        title: 'Total by Category',
        description: 'Total value by category',
      },
      queryResult: [
        { category: 'A', total: 100 },
        { category: 'B', total: 200 },
      ],
    }),
  })),
}));

vi.mock('../src/widgets/exportUtilities', () => ({
  ExportUtilities: vi.fn().mockImplementation(() => ({
    exportChartAsPNG: vi.fn(),
    exportDataAsCSV: vi.fn(),
  })),
}));

vi.mock('../src/ui/widgetFactory', () => ({
  createWidget: vi.fn().mockReturnValue({
    type: 'div',
    config: {},
  }),
}));

describe('App (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file upload zone when no file selected', () => {
    render(<App />);
    expect(screen.getByLabelText(/upload zone/i)).toBeInTheDocument();
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });
});