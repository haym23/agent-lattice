import { describe, expect, it } from 'vitest';

import { ifElseLowerer } from './if-else-lowerer';
import { promptLowerer } from './prompt-lowerer';

const baseContext = {
  workflow: {
    id: 'wf',
    name: 'wf',
    version: '1.0.0' as const,
    createdAt: '',
    updatedAt: '',
    nodes: [],
    edges: [],
  },
  graph: { nodes: [], edges: [], executionOrder: [], cycles: [], unreachable: [] },
  allNodes: new Map(),
  incomingEdges: new Map(),
  outgoingEdges: new Map<string, Array<{ id: string; source: string; target: string }>>(),
};

describe('lowerers', () => {
  it('prompt lowerer emits llm write node', () => {
    const fragment = promptLowerer.lower(
      {
        id: 'p1',
        type: 'prompt',
        label: 'Prompt',
        position: { x: 0, y: 0 },
        config: { prompt: 'Hello' },
      },
      baseContext
    );
    expect(fragment.nodes[0].op).toBe('LLM_WRITE');
  });

  it('ifElse lowerer emits branch edges', () => {
    const context = {
      ...baseContext,
      outgoingEdges: new Map([
        [
          'if1',
          [
            { id: 'e1', source: 'if1', target: 'yes' },
            { id: 'e2', source: 'if1', target: 'no' },
          ],
        ],
      ]),
    };
    const fragment = ifElseLowerer.lower(
      {
        id: 'if1',
        type: 'ifElse',
        label: 'If',
        position: { x: 0, y: 0 },
        config: {
          evaluationTarget: '$vars.flag',
          branches: [{ value: 'true' }, { value: 'false' }],
        },
      },
      context
    );
    expect(fragment.nodes[0].op).toBe('SWITCH');
    expect(fragment.edges).toHaveLength(2);
  });
});
