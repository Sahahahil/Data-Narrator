import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface NarrativeSession {
  id: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  question: string;
  sql: string;
  widgetType: string;
  chartConfig: Record<string, unknown>;
  description: string;
  dataSnapshot?: unknown[];
  tags: string[];
  thumbnail?: string;
}

interface NarrativeDB extends DBSchema {
  sessions: {
    key: string;
    value: NarrativeSession;
    indexes: { 'by-timestamp': number; 'by-fileName': string; 'by-tags': string };
  };
}

const DB_NAME = 'DataStorytellerNarratives';
const STORE_NAME = 'sessions';
const MAX_SESSIONS = 100;

export class NarrativeStore {
  private db: IDBPDatabase<NarrativeDB> | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<NarrativeDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-fileName', 'fileName');
        store.createIndex('by-tags', 'tags', { multiEntry: true });
      },
    });
  }

  async save(session: NarrativeSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    // Enforce storage limits before saving
    await this.enforceLimits(session);

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    await tx.store.put(session);
    await tx.done;
  }

  async get(id: string): Promise<NarrativeSession | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get(STORE_NAME, id);
  }

  async getAll(): Promise<NarrativeSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll(STORE_NAME);
  }

  async getRecent(limit: number = 10): Promise<NarrativeSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    return sessions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async search(query: string): Promise<NarrativeSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const allSessions = await this.db.getAll(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allSessions.filter(session =>
      session.question.toLowerCase().includes(lowerQuery) ||
      session.description.toLowerCase().includes(lowerQuery) ||
      session.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async delete(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  private async enforceLimits(_newSession: NarrativeSession): Promise<void> {
    if (!this.db) return;

    // Check session count limit
    const count = await this.db.count(STORE_NAME);
    if (count >= MAX_SESSIONS) {
      // Delete oldest sessions to make room
      const oldestSessions = await this.db.getAllFromIndex(STORE_NAME, 'by-timestamp');
      const toDelete = oldestSessions.slice(0, count - MAX_SESSIONS + 1);
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      for (const session of toDelete) {
        await tx.store.delete(session.id);
      }
      await tx.done;
    }

    // Storage size limit is harder to enforce precisely in IndexedDB
    // We'll rely on browser quota management for the 50MB limit
  }
}