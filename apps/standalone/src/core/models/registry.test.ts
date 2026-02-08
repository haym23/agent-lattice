import { describe, expect, it } from 'vitest';

import { ModelRegistry } from './registry';

describe('ModelRegistry', () => {
  it('contains Claude and GPT-4o', () => {
    const registry = new ModelRegistry();
    const ids = registry.list().map((model) => model.id);

    expect(ids).toContain('claude-sonnet');
    expect(ids).toContain('gpt-4o');
  });
});
