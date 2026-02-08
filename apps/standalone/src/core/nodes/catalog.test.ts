import { describe, expect, it } from 'vitest';

import { nodeCatalog } from './catalog';

describe('node catalog', () => {
  it('contains at least 15 production-usable node definitions', () => {
    expect(nodeCatalog.length).toBeGreaterThanOrEqual(15);
  });
});
