import { describe, expect, it } from 'vitest';

import { ModelRegistry } from '../models/registry';
import { compileWorkflow } from './pipeline';

describe('compiler pipeline', () => {
  it('emits claude output', () => {
    const model = new ModelRegistry().get('claude-sonnet');

    const output = compileWorkflow({
      target: 'claude',
      model,
      workflow: {
        id: 'wf',
        name: 'compile-test',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          {
            id: 'n1',
            type: 'llmCall',
            label: 'LLM',
            position: { x: 0, y: 0 },
            config: {},
          },
        ],
        edges: [],
      },
    });

    expect(output.files[0].path).toContain('.claude/commands');
  });

  it('emits snapshots for all phase-1 targets', () => {
    const model = new ModelRegistry().get('gpt-4o');
    const workflow = {
      id: 'wf',
      name: 'snapshot-test',
      version: '1.0.0' as const,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
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

    const claude = compileWorkflow({ target: 'claude', model, workflow });
    const openai = compileWorkflow({ target: 'openai-assistants', model, workflow });
    const portable = compileWorkflow({ target: 'portable-json', model, workflow });

    expect(claude).toMatchSnapshot('claude-target');
    expect(openai).toMatchSnapshot('openai-assistants-target');
    expect(portable).toMatchSnapshot('portable-json-target');
  });
});
