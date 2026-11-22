import { vi, describe, it, expect } from 'vitest';
import { DataProfiler, TableProfile, ColumnProfile, SuggestedWidget } from '../../src/data/dataProfiler';
import { QueryExecutor } from '../../src/data/queryExecutor';
import { TableSchema, ColumnInfo } from '../../src/data/schemaInspector';

describe('DataProfiler', () => {
  const tableName = 'test_table';

  const createMockSchema = (columns: ColumnInfo[]): TableSchema => ({
    columns,
    sampleData: []
  });

  const createMockExecutor = (responseMap: Map<string, unknown[]>): QueryExecutor => {
    return {
      execute: vi.fn().mockImplementation(async (sql: string) => {
        // Normalize SQL for matching
        const normalizedSql = sql.replace(/\s+/g, ' ').trim();

        // Try exact match first
        if (responseMap.has(normalizedSql)) {
          return responseMap.get(normalizedSql)!;
        }

        // Try partial match for common queries
        for (const [key, value] of responseMap.entries()) {
          if (normalizedSql.includes(key) || key.includes(normalizedSql)) {
            return value;
          }
        }

        // Fallback for DISTINCT queries
        if (normalizedSql.includes('DISTINCT')) {
          const colMatch = normalizedSql.match(/DISTINCT\s+(\w+)/i);
          if (colMatch) {
            const colName = colMatch[1];
            const key = `DISTINCT_${colName}`;
            if (responseMap.has(key)) {
              return responseMap.get(key)!;
            }
          }
        }

        // Fallback for COUNT queries
        if (normalizedSql.includes('COUNT(*)') && normalizedSql.includes('IS NULL')) {
          const colMatch = normalizedSql.match(/WHERE\s+(\w+)\s+IS\s+NULL/i);
          if (colMatch) {
            const colName = colMatch[1];
            const key = `NULL_${colName}`;
            if (responseMap.has(key)) {
              return responseMap.get(key)!;
            }
          }
        }

        // Fallback for MIN/MAX
        if (normalizedSql.includes('MIN(') && normalizedSql.includes('MAX(')) {
          const colMatch = normalizedSql.match(/MIN\((\w+)\)/i);
          if (colMatch) {
            const colName = colMatch[1];
            const key = `MINMAX_${colName}`;
            if (responseMap.has(key)) {
              return responseMap.get(key)!;
            }
          }
        }

        // Fallback for SAMPLE
        if (normalizedSql.includes('LIMIT 10')) {
          const colMatch = normalizedSql.match(/DISTINCT\s+(\w+)/i);
          if (colMatch) {
            const colName = colMatch[1];
            const key = `SAMPLE_${colName}`;
            if (responseMap.has(key)) {
              return responseMap.get(key)!;
            }
          }
        }

        // Fallback for row count
        if (normalizedSql.includes('COUNT(*)') && normalizedSql.includes('count')) {
          if (responseMap.has('ROW_COUNT')) {
            return responseMap.get('ROW_COUNT')!;
          }
        }

        console.warn('No mock response for SQL:', normalizedSql);
        return [];
      })
    } as unknown as QueryExecutor;
  };

  describe('profile()', () => {
    it('should return row count', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id column
        ['DISTINCT_id', [{ distinct_count: '5' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }, { id: '2' }]],
        // category column
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }, { category: 'B' }]],
        // value column
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }, { value: '20' }]],
        // date column
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }, { date: '2023-01-02' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      expect(profile.rowCount).toBe(100);
      expect(profile.columnCount).toBe(4);
    });

    it('should compute distinct count for each column', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '50' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '50' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }, { category: 'B' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '45' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const idProfile = profile.columns.find(c => c.name === 'id');
      expect(idProfile?.distinctCount).toBe(50);

      const categoryProfile = profile.columns.find(c => c.name === 'category');
      expect(categoryProfile?.distinctCount).toBe(3);
    });

    it('should compute null percent', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '5' }]],
        ['NULL_id', [{ null_count: '5' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const idProfile = profile.columns.find(c => c.name === 'id');
      expect(idProfile?.nullPercent).toBe(5);
    });

    it('should identify numeric columns', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const idProfile = profile.columns.find(c => c.name === 'id');
      expect(idProfile?.isNumeric).toBe(true);
      expect(idProfile?.isTemporal).toBe(false);
      expect(idProfile?.isCategorical).toBe(false);

      const valueProfile = profile.columns.find(c => c.name === 'value');
      expect(valueProfile?.isNumeric).toBe(true);
    });

    it('should identify temporal columns', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const dateProfile = profile.columns.find(c => c.name === 'date');
      expect(dateProfile?.isTemporal).toBe(true);
      expect(dateProfile?.isNumeric).toBe(false);
    });

    it('should identify categorical columns', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const categoryProfile = profile.columns.find(c => c.name === 'category');
      expect(categoryProfile?.isCategorical).toBe(true);
      expect(categoryProfile?.isNumeric).toBe(false);
      expect(categoryProfile?.isTemporal).toBe(false);
    });

    it('should suggest KPI widget for numeric columns', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const kpiWidget = profile.suggestedWidgets.find(w => w.widgetType === 'kpi');
      expect(kpiWidget).toBeDefined();
      expect(kpiWidget?.confidence).toBe(0.9);
      expect(kpiWidget?.chartConfig.yAxisKeys).toContain('id');
    });

    it('should suggest Bar widget for categorical + numeric', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const barWidget = profile.suggestedWidgets.find(w => w.widgetType === 'bar');
      expect(barWidget).toBeDefined();
      expect(barWidget?.confidence).toBe(0.85);
      expect(barWidget?.chartConfig.xAxisKey).toBe('category');
      expect(barWidget?.chartConfig.yAxisKeys).toContain('id');
    });

    it('should suggest Line widget for temporal + numeric', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // category
        ['DISTINCT_category', [{ distinct_count: '3' }]],
        ['NULL_category', [{ null_count: '0' }]],
        ['SAMPLE_category', [{ category: 'A' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const lineWidget = profile.suggestedWidgets.find(w => w.widgetType === 'line');
      expect(lineWidget).toBeDefined();
      expect(lineWidget?.confidence).toBe(0.9);
      expect(lineWidget?.chartConfig.xAxisKey).toBe('date');
      expect(lineWidget?.chartConfig.yAxisKeys).toContain('id');
    });

    it('should suggest Scatter widget for two numeric columns', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'value2', type: 'DOUBLE' },
        { name: 'date', type: 'DATE' }
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id
        ['DISTINCT_id', [{ distinct_count: '50' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ id: '1' }]],
        // value
        ['DISTINCT_value', [{ distinct_count: '10' }]],
        ['NULL_value', [{ null_count: '0' }]],
        ['MINMAX_value', [{ min_val: '10', max_val: '1000' }]],
        ['SAMPLE_value', [{ value: '10' }]],
        // value2
        ['DISTINCT_value2', [{ distinct_count: '15' }]],
        ['NULL_value2', [{ null_count: '0' }]],
        ['MINMAX_value2', [{ min_val: '5', max_val: '500' }]],
        ['SAMPLE_value2', [{ value2: '20' }]],
        // date
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ date: '2023-01-01' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, tableName);

      const profile = await profiler.profile();

      const scatterWidget = profile.suggestedWidgets.find(w => w.widgetType === 'scatter');
      expect(scatterWidget).toBeDefined();
      expect(scatterWidget?.confidence).toBe(0.7);
    });

    it('should limit suggestions to 5 widgets', async () => {
      const mockSchema = createMockSchema([
        { name: 'id', type: 'INTEGER' },
        { name: 'val1', type: 'DOUBLE' },
        { name: 'val2', type: 'DOUBLE' },
        { name: 'val3', type: 'DOUBLE' },
        { name: 'val4', type: 'DOUBLE' },
        { name: 'val5', type: 'DOUBLE' },
        { name: 'val6', type: 'DOUBLE' },
        { name: 'cat', type: 'VARCHAR' },
        { name: 'date', type: 'DATE' },
      ]);

      const responseMap = new Map<string, unknown[]>([
        ['ROW_COUNT', [{ count: '100' }]],
        // id (numeric)
        ['DISTINCT_id', [{ distinct_count: '10' }]],
        ['NULL_id', [{ null_count: '0' }]],
        ['MINMAX_id', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_id', [{ sample: '1' }]],
        // val1 (numeric)
        ['DISTINCT_val1', [{ distinct_count: '10' }]],
        ['NULL_val1', [{ null_count: '0' }]],
        ['MINMAX_val1', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val1', [{ sample: '1' }]],
        // val2 (numeric)
        ['DISTINCT_val2', [{ distinct_count: '10' }]],
        ['NULL_val2', [{ null_count: '0' }]],
        ['MINMAX_val2', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val2', [{ sample: '1' }]],
        // val3 (numeric)
        ['DISTINCT_val3', [{ distinct_count: '10' }]],
        ['NULL_val3', [{ null_count: '0' }]],
        ['MINMAX_val3', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val3', [{ sample: '1' }]],
        // val4 (numeric)
        ['DISTINCT_val4', [{ distinct_count: '10' }]],
        ['NULL_val4', [{ null_count: '0' }]],
        ['MINMAX_val4', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val4', [{ sample: '1' }]],
        // val5 (numeric)
        ['DISTINCT_val5', [{ distinct_count: '10' }]],
        ['NULL_val5', [{ null_count: '0' }]],
        ['MINMAX_val5', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val5', [{ sample: '1' }]],
        // val6 (numeric)
        ['DISTINCT_val6', [{ distinct_count: '10' }]],
        ['NULL_val6', [{ null_count: '0' }]],
        ['MINMAX_val6', [{ min_val: '1', max_val: '100' }]],
        ['SAMPLE_val6', [{ sample: '1' }]],
        // cat (categorical - no minmax)
        ['DISTINCT_cat', [{ distinct_count: '3' }]],
        ['NULL_cat', [{ null_count: '0' }]],
        ['SAMPLE_cat', [{ sample: '1' }]],
        // date (temporal)
        ['DISTINCT_date', [{ distinct_count: '12' }]],
        ['NULL_date', [{ null_count: '0' }]],
        ['MINMAX_date', [{ min_val: '2023-01-01', max_val: '2023-12-31' }]],
        ['SAMPLE_date', [{ sample: '1' }]],
      ]);

      const mockExecutor = createMockExecutor(responseMap);
      const profiler = new DataProfiler(mockExecutor, mockSchema, 'test');

      const profile = await profiler.profile();

      expect(profile.suggestedWidgets.length).toBeLessThanOrEqual(5);
    });
  });
});