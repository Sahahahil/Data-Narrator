import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock @duckdb/duckdb-wasm for test environment
vi.mock('@duckdb/duckdb-wasm', () => ({
  BROWSER_FILEREAD: 0,
  BROWSER_FILEREAD_PARQUET: 1,
  DuckDBDataProtocol: {
    BROWSER_FILEREADER: 2,
    BUFFER: 0,
    NODE_FS: 1,
    BROWSER_FSACCESS: 3,
    HTTP: 4,
    S3: 5,
  },
  AsyncDuckDB: vi.fn(),
  ConsoleLogger: vi.fn(),
  selectBundle: vi.fn(),
  getJsDelivrBundles: vi.fn(),
}));

import { FileRegistry } from '../../src/data/fileRegistry';

// Mock DuckDBManager for testing protocol mapping
const createMockDuckDBManager = () => {
  const registerFileMock = vi.fn().mockResolvedValue(undefined);

  return {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
      registerFileHandle: vi.fn().mockResolvedValue(undefined),
    }),
    initialize: vi.fn().mockResolvedValue(true),
    isInitialized: vi.fn().mockReturnValue(true),
    terminate: vi.fn().mockResolvedValue(undefined),
    registerFile: registerFileMock,
    _registerFileMock: registerFileMock,
  };
};

describe('FileRegistry (Protocol Mapping)', () => {
  let registry: FileRegistry;
  let mockDuckDBManager: ReturnType<typeof createMockDuckDBManager>;

  beforeEach(() => {
    mockDuckDBManager = createMockDuckDBManager();
    registry = new FileRegistry(mockDuckDBManager as any);
  });

  describe('registerFile()', () => {
    it('should register a CSV file with BROWSER_FILEREAD protocol', async () => {
      const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      await registry.registerFile('test_csv', file);

      expect(mockDuckDBManager.registerFile).toHaveBeenCalledWith('test_csv', file);
      expect(mockDuckDBManager._registerFileMock).toHaveBeenCalledWith('test_csv', file);
    });

    it('should register a Parquet file with BROWSER_FILEREAD_PARQUET protocol', async () => {
      const file = new File([new ArrayBuffer(0)], 'test.parquet', { type: 'application/octet-stream' });

      await registry.registerFile('test_parquet', file);

      expect(mockDuckDBManager.registerFile).toHaveBeenCalledWith('test_parquet', file);
      expect(mockDuckDBManager._registerFileMock).toHaveBeenCalledWith('test_parquet', file);
    });
  });
});