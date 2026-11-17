import { vi, describe, it, expect, beforeEach } from 'vitest';
import { inspectTable } from '../../src/data/schemaInspector';

describe('inspectTable', () => {
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

  describe('inspectTable()', () => {
    it('should extract column names and types', async () => {
      // Mock DESCRIBE query result
      const describeResult = {
        toArray: vi.fn().mockResolvedValue([
          { column_name: 'id', column_type: 'INTEGER' },
          { column_name: 'name', column_type: 'VARCHAR' },
          { column_name: 'value', column_type: 'DOUBLE' }
        ])
      };
      // Mock SELECT LIMIT 5 for sample values
      const sampleResult = {
        toArray: vi.fn().mockResolvedValue([
          { toJSON: () => ({ id: 1, name: 'A', value: 10.5 }) },
          { toJSON: () => ({ id: 2, name: 'B', value: 20.3 }) }
        ])
      };
      connectMock.mockResolvedValue(mockConnection);
      queryMock.mockImplementation((query: string) => {
        if (query.includes('DESCRIBE')) {
          return Promise.resolve(describeResult);
        }
        // Mock SELECT LIMIT 5 for sample values
        return Promise.resolve(sampleResult);
      });

      const schema = await inspectTable(mockDuckDBManager, 'test_table');

      expect(schema.columns).toEqual([
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' }
      ]);
      expect(schema.sampleData).toHaveLength(2);
    });

    it('should handle empty tables', async () => {
      const describeResult = {
        toArray: vi.fn().mockResolvedValue([])
      };
      const sampleResult = {
        toArray: vi.fn().mockResolvedValue([])
      };
      connectMock.mockResolvedValue(mockConnection);
      queryMock.mockImplementation((query: string) => {
        if (query.includes('DESCRIBE')) {
          return Promise.resolve(describeResult);
        }
        return Promise.resolve(sampleResult);
      });

      const schema = await inspectTable(mockDuckDBManager, 'empty_table');

      expect(schema.columns).toEqual([]);
      expect(schema.sampleData).toEqual([]);
    });
  });
});