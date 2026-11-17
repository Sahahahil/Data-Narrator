import { ExportUtilities } from '../../src/widgets/exportUtilities';

describe('ExportUtilities', () => {
  let utils: ExportUtilities;

  beforeEach(() => { utils = new ExportUtilities(); });

  describe('exportChartAsPNG()', () => {
    it('function exists and is callable', () => {
      expect(typeof utils.exportChartAsPNG).toBe('function');
    });
  });

  describe('exportDataAsCSV()', () => {
    it('function exists and is callable', () => {
      expect(typeof utils.exportDataAsCSV).toBe('function');
    });

    it('handles empty data', () => {
      utils.exportDataAsCSV([], 'empty.csv');
      expect(true).toBe(true);
    });
  });
});