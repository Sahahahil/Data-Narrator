import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';
import { mockDuckDBManager, mockLLMResponse, mockLLMClient, mockSelfHealingController } from './mocks';

// Mock the DuckDBManager and its dependencies
vi.mock('../src/data/duckdbManager', () => ({
  DuckDBManager: vi.fn().mockImplementation(() => mockDuckDBManager),
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

vi.mock('../src/ai/llmClient', () => ({
  LLMClient: vi.fn().mockImplementation(() => mockLLMClient),
}));

vi.mock('../src/ai/promptBuilder', () => ({
  PromptBuilder: vi.fn().mockImplementation(() => ({
    buildPrompt: vi.fn().mockReturnValue('test prompt'),
  })),
}));

vi.mock('../src/ai/responseParser', () => ({
  ResponseParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue(mockLLMResponse),
  })),
}));

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

vi.mock('../src/ai/selfHealingController', () => ({
  SelfHealingController: vi.fn().mockImplementation(() => mockSelfHealingController),
}));

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
    // Mock selfHealingController to throw an error
    mockSelfHealingController.executeWithRetry.mockRejectedValueOnce(new Error('API Error'));

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
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });
});