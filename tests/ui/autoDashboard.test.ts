import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AutoDashboard } from '../../src/ui/autoDashboard';
import { ChartConfigBuilder } from '../../src/ui/chartConfigBuilder';
import { QueryExecutor } from '../../src/data/queryExecutor';
import { SchemaInspector } from '../../src/data/schemaInspector';
import { TableProfile, SuggestedWidget } from '../../src/data/dataProfiler';

describe('AutoDashboard', () => {
  let autoDashboard: AutoDashboard;
  let mockChartConfigBuilder: ChartConfigBuilder;
  let mockQueryExecutor: QueryExecutor;
  let mockSchemaInspector: SchemaInspector;

  const mockProfile: TableProfile = {
    rowCount: 100,
    columnCount: 4,
    columns: [],
    suggestedWidgets: [
      {
        widgetType: 'kpi',
        title: 'Total Value',
        description: 'Sum of value across all 100 rows',
        chartConfig: { xAxisKey: '', yAxisKeys: ['value'] },
        confidence: 0.9,
      },
      {
        widgetType: 'bar',
        title: 'Value by Category',
        description: 'Value grouped by category',
        chartConfig: { xAxisKey: 'category', yAxisKeys: ['value'] },
        confidence: 0.85,
      },
      {
        widgetType: 'line',
        title: 'Value over Time',
        description: 'Value trend by date',
        chartConfig: { xAxisKey: 'date', yAxisKeys: ['value'] },
        confidence: 0.9,
      },
      {
        widgetType: 'scatter',
        title: 'Value2 vs Value',
        description: 'Correlation between value and value2',
        chartConfig: { xAxisKey: 'value', yAxisKeys: ['value2'] },
        confidence: 0.7,
      },
    ],
  };

  beforeEach(() => {
    mockChartConfigBuilder = new ChartConfigBuilder();
    mockQueryExecutor = {
      execute: vi.fn()
    } as unknown as QueryExecutor;
    mockSchemaInspector = {
      inspectTable: vi.fn()
    } as unknown as SchemaInspector;

    autoDashboard = new AutoDashboard(mockChartConfigBuilder);
  });

  describe('generateDashboard()', () => {
    it('should create widget configs from profile suggestions', () => {
      const widgets = autoDashboard.generateDashboard(mockProfile);

      expect(widgets).toHaveLength(4);
      expect(widgets[0].widgetType).toBe('kpi');
      expect(widgets[1].widgetType).toBe('bar');
      expect(widgets[2].widgetType).toBe('line');
      expect(widgets[3].widgetType).toBe('scatter');
    });

    it('should build chart config for each widget', () => {
      const widgets = autoDashboard.generateDashboard(mockProfile);

      widgets.forEach(widget => {
        expect(widget.config).toBeDefined();
        expect(widget.config.title).toBeTruthy();
        expect(widget.config.description).toBeTruthy();
        expect(widget.config.yAxisKeys).toBeDefined();
        expect(Array.isArray(widget.config.yAxisKeys)).toBe(true);
      });
    });

    it('should handle empty suggestions', () => {
      const emptyProfile: TableProfile = {
        rowCount: 0,
        columnCount: 0,
        columns: [],
        suggestedWidgets: [],
      };

      const widgets = autoDashboard.generateDashboard(emptyProfile);
      expect(widgets).toHaveLength(0);
    });
  });

  describe('executeDashboard()', () => {
    it('should execute SQL for each widget and populate data', async () => {
      mockQueryExecutor.execute
        .mockResolvedValueOnce([{ total: 5000 }]) // KPI
        .mockResolvedValueOnce([{ category: 'A', value: 100 }, { category: 'B', value: 200 }]) // Bar
        .mockResolvedValueOnce([{ date: '2023-01', value: 100 }, { date: '2023-02', value: 150 }]) // Line
        .mockResolvedValueOnce([{ value: 10, value2: 20 }, { value: 15, value2: 25 }]); // Scatter

      const widgets = await autoDashboard.executeDashboard(
        mockProfile,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      expect(widgets).toHaveLength(4);
      expect(widgets[0].data).toEqual([{ total: 5000 }]);
      expect(widgets[1].data).toHaveLength(2);
      expect(widgets[2].data).toHaveLength(2);
      expect(widgets[3].data).toHaveLength(2);
    });

    it('should handle widget execution errors gracefully', async () => {
      mockQueryExecutor.execute
        .mockResolvedValueOnce([{ total: 5000 }]) // KPI succeeds
        .mockRejectedValueOnce(new Error('SQL error')) // Bar fails
        .mockResolvedValueOnce([{ date: '2023-01', value: 100 }]) // Line succeeds
        .mockResolvedValueOnce([{ value: 10, value2: 20 }]); // Scatter succeeds

      const widgets = await autoDashboard.executeDashboard(
        mockProfile,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      expect(widgets).toHaveLength(4);
      expect(widgets[0].data).toEqual([{ total: 5000 }]);
      expect(widgets[1].data).toEqual([]); // Failed widget has empty data
      expect(widgets[2].data).toHaveLength(1);
      expect(widgets[3].data).toHaveLength(1);
    });

    it('should generate correct SQL for KPI widget', async () => {
      mockQueryExecutor.execute.mockResolvedValue([{ total: 5000 }]);

      await autoDashboard.executeDashboard(
        mockProfile,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      // First call should be for KPI
      expect(mockQueryExecutor.execute).toHaveBeenCalledWith(
        'SELECT SUM(value) as total FROM test_table'
      );
    });

    it('should generate correct SQL for Bar widget with groupKey', async () => {
      const profileWithGroup: TableProfile = {
        ...mockProfile,
        suggestedWidgets: [
          {
            widgetType: 'bar',
            title: 'Value by Category grouped by Segment',
            description: 'Value grouped by category and segment',
            chartConfig: { xAxisKey: 'category', yAxisKeys: ['value'], groupKey: 'segment' },
            confidence: 0.85,
          },
        ],
      };

      mockQueryExecutor.execute.mockResolvedValue([{ category: 'A', segment: 'X', value: 100 }]);

      await autoDashboard.executeDashboard(
        profileWithGroup,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      expect(mockQueryExecutor.execute).toHaveBeenCalledWith(
        'SELECT category, value, segment FROM test_table GROUP BY segment, category ORDER BY category'
      );
    });

    it('should generate correct SQL for Line widget', async () => {
      const profileWithLine: TableProfile = {
        ...mockProfile,
        suggestedWidgets: [
          {
            widgetType: 'line',
            title: 'Value over Time',
            description: 'Value trend by date',
            chartConfig: { xAxisKey: 'date', yAxisKeys: ['value'] },
            confidence: 0.9,
          },
        ],
      };

      mockQueryExecutor.execute.mockResolvedValue([{ date: '2023-01', value: 100 }]);

      await autoDashboard.executeDashboard(
        profileWithLine,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      expect(mockQueryExecutor.execute).toHaveBeenCalledWith(
        'SELECT date, value FROM test_table GROUP BY date ORDER BY date'
      );
    });

    it('should generate correct SQL for Scatter widget', async () => {
      const profileWithScatter: TableProfile = {
        ...mockProfile,
        suggestedWidgets: [
          {
            widgetType: 'scatter',
            title: 'Value2 vs Value',
            description: 'Correlation between value and value2',
            chartConfig: { xAxisKey: 'value', yAxisKeys: ['value2'] },
            confidence: 0.7,
          },
        ],
      };

      mockQueryExecutor.execute.mockResolvedValue([{ value: 10, value2: 20 }]);

      await autoDashboard.executeDashboard(
        profileWithScatter,
        mockQueryExecutor,
        mockSchemaInspector,
        'test_table'
      );

      expect(mockQueryExecutor.execute).toHaveBeenCalledWith(
        'SELECT value, value2 FROM test_table GROUP BY value ORDER BY value'
      );
    });
  });
});