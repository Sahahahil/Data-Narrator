import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SchemaInspector } from '../../src/data/schemaInspector';

describe('SchemaInspector', () => {
  let inspector: SchemaInspector;
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
    inspector = new SchemaInspector(mockDuckDBManager);
  });

  const createMockRow = (data: Record<string, unknown>) => ({
    ...data,
    toJSON: () => data
  });

  const createMockResults = () => {
    // DESCRIBE query result
    const describeResult = {
      toArray: vi.fn().mockResolvedValue([
        { column_name: 'id', column_type: 'INTEGER' },
        { column_name: 'name', column_type: 'VARCHAR' },
        { column_name: 'value', column_type: 'DOUBLE' }
      ])
    };

    // SELECT LIMIT 5 for sample values
    const sampleResult = {
      toArray: vi.fn().mockResolvedValue([
        createMockRow({ id: 1, name: 'A', value: 10.5 }),
        createMockRow({ id: 2, name: 'B', value: 20.3 })
      ])
    };

    // QueryExecutor queries for getColumnStats
    const distinctResult = {
      toArray: vi.fn().mockResolvedValue([createMockRow({ distinct_count: '2' })])
    };
    const nullResult = {
      toArray: vi.fn().mockResolvedValue([createMockRow({ null_count: '0' })])
    };
    const rowCountResult = {
      toArray: vi.fn().mockResolvedValue([createMockRow({ count: '2' })])
    };
    const minMaxResult = {
      toArray: vi.fn().mockResolvedValue([createMockRow({ min_val: 1, max_val: 20.3 })])
    };

    connectMock.mockResolvedValue(mockConnection);
    queryMock.mockImplementation((query: string) => {
      if (query.includes('DESCRIBE')) {
        return Promise.resolve(describeResult);
      }
      if (query.includes('LIMIT 5')) {
        return Promise.resolve(sampleResult);
      }
      if (query.includes('COUNT(DISTINCT')) {
        return Promise.resolve(distinctResult);
      }
      if (query.includes('IS NULL')) {
        return Promise.resolve(nullResult);
      }
      if (query.includes('COUNT(*) as count')) {
        return Promise.resolve(rowCountResult);
      }
      if (query.includes('MIN(') && query.includes('MAX(')) {
        return Promise.resolve(minMaxResult);
      }
      return Promise.resolve(sampleResult);
    });
  };

  describe('inspectTable()', () => {
    it('should extract column names and types', async () => {
      createMockResults();

      const schema = await inspector.inspectTable('test_table');

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
      connectMock.mockResolvedValue({ query: queryMock });
      queryMock.mockImplementation((query: string) => {
        if (query.includes('DESCRIBE')) {
          return Promise.resolve(describeResult);
        }
        return Promise.resolve(sampleResult);
      });

      const schema = await inspector.inspectTable('empty_table');

      expect(schema.columns).toEqual([]);
      expect(schema.sampleData).toEqual([]);
    });

    it('should include column stats', async () => {
      const describeResult = {
        toArray: vi.fn().mockResolvedValue([
          { column_name: 'id', column_type: 'INTEGER' },
          { column_name: 'category', column_type: 'VARCHAR' }
        ])
      };
      const sampleResult = {
        toArray: vi.fn().mockResolvedValue([
          createMockRow({ id: 1, category: 'A' }),
          createMockRow({ id: 2, category: 'B' })
        ])
      };
      const distinctResult = {
        toArray: vi.fn().mockResolvedValue([createMockRow({ distinct_count: '2' })])
      };
      const nullResult = {
        toArray: vi.fn().mockResolvedValue([createMockRow({ null_count: '0' })])
      };
      const rowCountResult = {
        toArray: vi.fn().mockResolvedValue([createMockRow({ count: '2' })])
      };
      const minMaxResult = {
        toArray: vi.fn().mockResolvedValue([createMockRow({ min_val: 1, max_val: 2 })])
      };

      connectMock.mockResolvedValue(mockConnection);
      queryMock.mockImplementation((query: string) => {
        if (query.includes('DESCRIBE')) {
          return Promise.resolve(describeResult);
        }
        if (query.includes('LIMIT 5')) {
          return Promise.resolve(sampleResult);
        }
        if (query.includes('COUNT(DISTINCT')) {
          return Promise.resolve(distinctResult);
        }
        if (query.includes('IS NULL')) {
          return Promise.resolve(nullResult);
        }
        if (query.includes('COUNT(*) as count')) {
          return Promise.resolve(rowCountResult);
        }
        if (query.includes('MIN(') && query.includes('MAX(')) {
          return Promise.resolve(minMaxResult);
        }
        return Promise.resolve(sampleResult);
      });

      const schema = await inspector.inspectTable('stats_table');

      expect(schema.columnStats).toBeDefined();
      expect(schema.columnStats!.id).toBeDefined();
      expect(schema.columnStats!.id.distinct).toBeGreaterThan(0);
    });
  });
});