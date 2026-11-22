import { NarrativeStore, NarrativeSession } from '../data/narrativeStore';

export class NarrativePersistence {
  constructor(private store: NarrativeStore) {}

  async saveCurrentSession(
    fileName: string,
    fileSize: number,
    question: string,
    result: {
      sql: string;
      widgetType: string;
      chartConfig: Record<string, unknown>;
      description: string;
      data: unknown[];
    }
  ): Promise<string> {
    const session: NarrativeSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      fileName,
      fileSize,
      question,
      sql: result.sql,
      widgetType: result.widgetType,
      chartConfig: result.chartConfig,
      description: result.description,
      dataSnapshot: result.data.slice(0, 100), // Store first 100 rows as snapshot
      tags: [],
    };

    await this.store.save(session);
    return session.id;
  }

  async loadSession(id: string): Promise<NarrativeSession | undefined> {
    return this.store.get(id);
  }

  async getRecent(limit: number = 10): Promise<NarrativeSession[]> {
    return this.store.getRecent(limit);
  }

  async search(query: string): Promise<NarrativeSession[]> {
    return this.store.search(query);
  }

  async deleteSession(id: string): Promise<void> {
    return this.store.delete(id);
  }

  async addTags(id: string, tags: string[]): Promise<void> {
    const session = await this.store.get(id);
    if (!session) throw new Error('Session not found');

    const newTags = [...new Set([...session.tags, ...tags])];
    const updatedSession = { ...session, tags: newTags };
    await this.store.save(updatedSession);
  }

  async removeTag(id: string, tag: string): Promise<void> {
    const session = await this.store.get(id);
    if (!session) throw new Error('Session not found');

    const updatedSession = { ...session, tags: session.tags.filter(t => t !== tag) };
    await this.store.save(updatedSession);
  }
}