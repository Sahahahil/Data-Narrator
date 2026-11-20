import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileRegistry } from '../../src/data/fileRegistry';
import * as duckdb from '@duckdb/duckdb-wasm';

describe('FileRegistry', () => {
  let registry: FileRegistry;
  let mockDuckDBManager: any;
  let registerFileMock: any;

  beforeEach(() => {
    registerFileMock = vi.fn().mockResolvedValue(undefined);
    mockDuckDBManager = {
      registerFile: registerFileMock,
    };
    registry = new FileRegistry(mockDuckDBManager);
  });

  describe('registerFile()', () => {
    it('should call duckDBManager.registerFile for CSV', async () => {
      const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      await registry.registerFile('test_csv', file);

      expect(registerFileMock).toHaveBeenCalledWith('test_csv', file);
    });

    it('should call duckDBManager.registerFile for Parquet', async () => {
      const file = new File([new ArrayBuffer(0)], 'test.parquet', { type: 'application/octet-stream' });

      await registry.registerFile('test_parquet', file);

      expect(registerFileMock).toHaveBeenCalledWith('test_parquet', file);
    });

    it('should handle any file extension via duckDBManager', async () => {
      const file = new File(['data'], 'test.parquet', { type: 'application/octet-stream' });

      await registry.registerFile('custom_table', file);

      expect(registerFileMock).toHaveBeenCalledWith('custom_table', file);
    });
  });
});