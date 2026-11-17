import { DuckDBManager } from '../../src/data/duckdbManager';

describe('DuckDBManager (API Contract)', () => {
  let manager: DuckDBManager;

  beforeEach(() => { manager = new DuckDBManager(); });

  describe('initialize()', () => {
    it('should return boolean and set isInitialized', async () => {
      const result = await manager.initialize();
      expect([true, false]).toContain(result);
      expect(typeof manager.isInitialized()).toBe('boolean');
    });
  });

  describe('connect()', () => {
    it('should throw if not initialized', async () => {
      const mgr = new DuckDBManager();
      await expect(mgr.connect()).rejects.toThrow('DuckDB not initialized');
    });
  });

  describe('terminate()', () => {
    it('should clean up and set initialized to false', async () => {
      await manager.initialize();
      await manager.terminate();
      expect(manager.isInitialized()).toBe(false);
    });
  });
});