import * as duckdb from '@duckdb/duckdb-wasm';

export class DuckDBManager {
  private worker: Worker | null = null;
  private db: duckdb.AsyncDuckDB | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<boolean> {
    if (typeof Worker === 'undefined') return false;
    try {
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      this.worker = worker;
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error);
      this.initialized = false;
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async connect() {
    if (!this.initialized || !this.db) throw new Error('DuckDB not initialized');
    return await this.db.connect();
  }

  async registerFile(name: string, file: File): Promise<void> {
    if (!this.initialized || !this.db) throw new Error('DuckDB not initialized');
    const protocol = file.name.endsWith('.parquet')
      ? duckdb.DuckDBDataProtocol.BROWSER_FILEREADER
      : duckdb.DuckDBDataProtocol.BROWSER_FILEREADER;
    await this.db.registerFileHandle(name, file, protocol, true);
  }

  async terminate() {
    if (this.db) {
      await this.db.terminate();
      this.db = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
  }
}