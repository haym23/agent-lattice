import { describe, expect, it } from 'vitest';

import { MockLlmProvider } from './mock-provider';
import type { LlmRequest } from './types';

describe('MockLlmProvider', () => {
  it('returns mapped response and records calls', async () => {
    const request: LlmRequest = {
      modelClass: 'SMALL_EXEC',
      messages: [{ role: 'user', content: 'hello' }],
    };
    const provider = new MockLlmProvider(
      new Map([
        [
          'SMALL_EXEC:hello',
          {
            content: '{"ok":true}',
            parsed: { ok: true },
            usage: { promptTokens: 1, completionTokens: 1 },
            modelUsed: 'SMALL_EXEC',
          },
        ],
      ])
    );

    const response = await provider.chat(request);
    expect(response.parsed).toEqual({ ok: true });
    expect(provider.getCalls()).toHaveLength(1);
  });

  it('uses factory function when provided', async () => {
    const provider = new MockLlmProvider((req, index) => ({
      content: JSON.stringify({ idx: index, model: req.modelClass }),
      parsed: { idx: index, model: req.modelClass },
      usage: { promptTokens: 0, completionTokens: 0 },
      modelUsed: req.modelClass,
    }));

    const response = await provider.chat({
      modelClass: 'MEDIUM_PLAN',
      messages: [{ role: 'user', content: 'x' }],
    });

    expect(response.parsed).toEqual({ idx: 0, model: 'MEDIUM_PLAN' });
  });
});
