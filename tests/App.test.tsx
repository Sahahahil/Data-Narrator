import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock the DuckDBManager and its dependencies
const mockDuckDBManager = {
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
  };

vi.mock('../src/data/duckdbManager', () => {
  return {
    DuckDBManager: vi.fn().mockImplementation(() => mockDuckDBManager),
  };
});

vi.mock('../src/data/fileRegistry', () => {
  return {
    FileRegistry: vi.fn().mockImplementation(() => ({
      registerFile: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock('../src/data/schemaInspector', () => {
  return {
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
  };
});

const mockLLMResponse = {
  sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
  widgetType: 'bar',
  chartConfig: {
    xAxisKey: 'category',
    yAxisKeys: ['total'],
    title: 'Total by Category',
    description: 'Total value by category',
  },
};

const mockLLMClient = {
  generateSQLAndConfig: vi.fn().mockResolvedValue(mockLLMResponse),
};

vi.mock('../src/ai/llmClient', () => {
  return {
    LLMClient: vi.fn().mockImplementation(() => mockLLMClient),
  };
});

vi.mock('../src/ai/promptBuilder', () => {
  return {
    PromptBuilder: vi.fn().mockImplementation(() => ({
      buildPrompt: vi.fn().mockReturnValue('test prompt'),
    })),
  };
});

vi.mock('../src/ai/responseParser', () => {
  return {
    ResponseParser: vi.fn().mockImplementation(() => ({
      parse: vi.fn().mockReturnValue(mockLLMResponse),
    })),
  };
});

const mockSelfHealingController = {
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
};

vi.mock('../src/ai/selfHealingController', () => {
  return {
    SelfHealingController: vi.fn().mockImplementation(() => mockSelfHealingController),
  };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

describe('App (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default successful mocks
    mockDuckDBManager.initialize.mockResolvedValue(true);
    mockDuckDBManager.isInitialized.mockReturnValue(true);
    mockDuckDBManager.connect.mockResolvedValue({
      query: vi.fn().mockResolvedValue({
        toArray: vi.fn().mockResolvedValue([
          { toJSON: () => ({ category: 'A', value: 100 }) },
          { toJSON: () => ({ category: 'B', value: 200 }) },
        ]),
      }),
      registerFileHandle: vi.fn().mockResolvedValue(undefined),
    });
    mockDuckDBManager.registerFile.mockResolvedValue(undefined);
    mockDuckDBManager.terminate.mockResolvedValue(undefined);
    mockLLMClient.generateSQLAndConfig.mockResolvedValue({
      sql: 'SELECT category, SUM(value) as total FROM uploaded_data GROUP BY category',
      widgetType: 'bar',
      chartConfig: {
        xAxisKey: 'category',
        yAxisKeys: ['total'],
        title: 'Total by Category',
        description: 'Total value by category',
      },
    });
    mockSelfHealingController.executeWithRetry.mockResolvedValue({
      ...mockLLMResponse,
      queryResult: [
        { category: 'A', total: 100 },
        { category: 'B', total: 200 },
      ],
    });
  });

  it('renders file upload zone when no file selected', () => {
    render(<App />);
    expect(screen.getByLabelText(/upload zone/i)).toBeInTheDocument();
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });

  it('shows file info after valid CSV upload', async () => {
    render(<App />);
    const fileInput = screen.getByLabelText(/upload zone/i).querySelector('input') as HTMLInputElement;
    const file = new File(['category,value\nA,100\nB,200'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('shows query input after file upload', async () => {
    render(<App />);
    const fileInput = screen.getByLabelText(/upload zone/i).querySelector('input') as HTMLInputElement;
    const file = new File(['category,value\nA,100\nB,200'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., show total value by category/i)).toBeInTheDocument();
    });
  });

  it('submits query and renders chart', async () => {
    render(<App />);
    const fileInput = screen.getByLabelText(/upload zone/i).querySelector('input') as HTMLInputElement;
    const file = new File(['category,value\nA,100\nB,200'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., show total value by category/i)).toBeInTheDocument();
    });

    const queryInput = screen.getByPlaceholderText(/e.g., show total value by category/i);
    fireEvent.change(queryInput, { target: { value: 'Show total by category' } });

    const submitButton = screen.getByRole('button', { name: /get insights/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/total by category/i)).toBeInTheDocument();
    });
  });

  it('shows loading spinner during query', async () => {
    render(<App />);
    const fileInput = screen.getByLabelText(/upload zone/i).querySelector('input') as HTMLInputElement;
    const file = new File(['category,value\nA,100\nB,200'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., show total value by category/i)).toBeInTheDocument();
    });

    const queryInput = screen.getByPlaceholderText(/e.g., show total value by category/i);
    fireEvent.change(queryInput, { target: { value: 'Show total by category' } });

    const submitButton = screen.getByRole('button', { name: /get insights/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });

  it('shows error boundary on query error', async () => {
    // Mock LLMClient to throw an error
    const mockLLMClient = {
      generateSQLAndConfig: vi.fn().mockRejectedValueOnce(new Error('API Error')),
    };

    vi.mock('../src/ai/llmClient', () => {
      return {
        LLMClient: vi.fn().mockImplementation(() => mockLLMClient),
      };
    });

    render(<App />);
    const fileInput = screen.getByLabelText(/upload zone/i).querySelector('input') as HTMLInputElement;
    const file = new File(['category,value\nA,100\nB,200'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., show total value by category/i)).toBeInTheDocument();
    });

    const queryInput = screen.getByPlaceholderText(/e.g., show total value by category/i);
    fireEvent.change(queryInput, { target: { value: 'Show total by category' } });

    const submitButton = screen.getByRole('button', { name: /get insights/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});