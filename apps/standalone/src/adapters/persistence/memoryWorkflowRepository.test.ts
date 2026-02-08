import { describe, expect, it } from 'vitest';

import { MemoryWorkflowRepository } from './memoryWorkflowRepository';

describe('MemoryWorkflowRepository', () => {
  it('saves and loads workflow', async () => {
    const repository = new MemoryWorkflowRepository();

    await repository.save({
      id: 'wf1',
      name: 'Workflow 1',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    });

    const loaded = await repository.load('wf1');
    expect(loaded?.name).toBe('Workflow 1');
  });
});
