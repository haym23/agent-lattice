import { describe, expect, it } from 'vitest';

import { MemoryWorkflowRepository } from '../../adapters/persistence/memoryWorkflowRepository';
import { compileWorkflow } from '../compiler/pipeline';
import { ModelRegistry } from '../models/registry';

describe('workflow integration', () => {
  it('saves, loads, and compiles workflow', async () => {
    const repository = new MemoryWorkflowRepository();
    const model = new ModelRegistry().get('claude-sonnet');

    const workflow = {
      id: 'wf-int',
      name: 'integration',
      version: '1.0.0' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n1',
          type: 'llmCall' as const,
          label: 'LLM',
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      edges: [],
    };

    await repository.save(workflow);
    const loaded = await repository.load(workflow.id);

    expect(loaded).not.toBeNull();

    if (!loaded) {
      throw new Error('Expected loaded workflow');
    }

    const compiled = compileWorkflow({
      workflow: loaded,
      model,
      target: 'portable-json',
    });

    expect(compiled.files[0].content).toContain('schemaVersion');
  });
});
