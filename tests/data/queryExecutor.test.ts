import { vi, describe, it, expect, beforeEach } from 'vitest';
import { executeQuery } from '../../src/data/queryExecutor';

describe('executeQuery', () => {
  let mockDuckDBManager: any;
  let mockConnection: any;
  let connectMock: any;
  let queryMock: any;

  beforeEach(() => {
    connectMock = vi.fn();
    queryMock = vi.fn();
    mockConnection = {
      query: queryMock
    };
    mockDuckDBManager = {
      connect: connectMock
    };
  });

  it('should execute a query and return results', async () => {
    const mockResult = [{ toJSON: () => ({ id: 1, name: 'test' }) }];
    queryMock.mockResolvedValueOnce({
      toArray: async () => mockResult
    });
    connectMock.mockResolvedValueOnce(mockConnection);

    const sql = 'SELECT * FROM test';
    const result = await executeQuery(mockDuckDBManager, sql);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, name: 'test' });
    expect(connectMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith(sql);
  });

  it('should handle empty results', async () => {
    queryMock.mockResolvedValueOnce({
      toArray: async () => []
    });
    connectMock.mockResolvedValueOnce(mockConnection);

    const result = await executeQuery(mockDuckDBManager, 'SELECT * FROM empty');
    expect(result).toHaveLength(0);
  });
});