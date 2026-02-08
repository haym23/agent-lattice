import { openDB } from 'idb';

import type { WorkflowRepository } from '../../core/workflow/repository';
import type { WorkflowDocument } from '../../core/workflow/types';

const DB_NAME = 'agent-lattice-standalone';
const STORE_NAME = 'workflows';

export class IndexedDbWorkflowRepository implements WorkflowRepository {
  private async getDb() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async save(workflow: WorkflowDocument): Promise<void> {
    const db = await this.getDb();
    await db.put(STORE_NAME, workflow);
  }

  async load(id: string): Promise<WorkflowDocument | null> {
    const db = await this.getDb();
    return (await db.get(STORE_NAME, id)) ?? null;
  }

  async list(): Promise<WorkflowDocument[]> {
    const db = await this.getDb();
    return db.getAll(STORE_NAME);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(STORE_NAME, id);
  }
}
