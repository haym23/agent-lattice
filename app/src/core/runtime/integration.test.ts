import { describe, expect, it, vi } from 'vitest';

import { lowerToExecIR } from '../compiler/lower';
import { MockLlmProvider } from '../llm/mock-provider';
import { createRunner } from './index';

function baseWorkflow() {
  return {
    id: 'wf',
    name: 'integration',
    version: '1.0.0' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      { id: 'start', type: 'start' as const, label: 'Start', position: { x: 0, y: 0 }, config: {} },
      {
        id: 'prompt',
        type: 'prompt' as const,
        label: 'Prompt',
        position: { x: 100, y: 0 },
        config: { prompt: 'Summarize' },
      },
      { id: 'end', type: 'end' as const, label: 'End', position: { x: 200, y: 0 }, config: {} },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'prompt' },
      { id: 'e2', source: 'prompt', target: 'end' },
    ],
  };
}

describe('runtime integration', () => {
  it('runs full lower + execute pipeline', async () => {
    const program = lowerToExecIR(baseWorkflow());
    const runner = createRunner(
      new MockLlmProvider(() => ({
        content: '{"summary":"done"}',
        parsed: { summary: 'done' },
        usage: { promptTokens: 1, completionTokens: 1 },
        modelUsed: 'SMALL_EXEC',
      }))
    );

    const result = await runner.execute(program, { user_message: 'hello' });
    expect(result.status).toBe('completed');
    expect(result.finalState.$vars).toHaveProperty('prompt');
  });

  it('runs http request via tool call node', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ text: async () => '{"ok":true}' }))
    );
    const workflow = {
      ...baseWorkflow(),
      nodes: [
        {
          id: 'start',
          type: 'start' as const,
          label: 'Start',
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: 'http',
          type: 'httpRequest' as const,
          label: 'HTTP',
          position: { x: 100, y: 0 },
          config: { method: 'GET', url: 'https://example.com', responseFormat: 'json' },
        },
        { id: 'end', type: 'end' as const, label: 'End', position: { x: 200, y: 0 }, config: {} },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'http' },
        { id: 'e2', source: 'http', target: 'end' },
      ],
    };
    const program = lowerToExecIR(workflow);
    const runner = createRunner(new MockLlmProvider());
    const result = await runner.execute(program);
    expect(result.status).toBe('completed');
    expect(result.finalState.$vars).toHaveProperty('http');
  });
});
