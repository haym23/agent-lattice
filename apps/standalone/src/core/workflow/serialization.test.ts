import { describe, expect, it } from 'vitest';

import { deserializeWorkflowToCanvas, serializeWorkflowFromCanvas } from './serialization';

describe('workflow serialization', () => {
  it('round-trips nodes and edges', () => {
    const workflow = serializeWorkflowFromCanvas({
      name: 'roundtrip',
      nodes: [
        {
          id: 'n1',
          type: 'llmCall',
          position: { x: 10, y: 10 },
          data: { label: 'Step 1' },
        },
      ],
      edges: [],
    });

    const canvas = deserializeWorkflowToCanvas(workflow);
    expect(canvas.nodes).toHaveLength(1);
    expect(canvas.nodes[0].id).toBe('n1');
  });
});
