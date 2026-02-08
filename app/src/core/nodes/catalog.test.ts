import { describe, expect, it } from 'vitest';

import { getNodeDefinition, nodeCatalog } from './catalog';

describe('node catalog', () => {
  it('contains all documented node definitions (12 implemented + 8 researched)', () => {
    expect(nodeCatalog.length).toBe(20);
  });

  it('has unique types', () => {
    const types = nodeCatalog.map((n) => n.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every entry has required fields', () => {
    for (const node of nodeCatalog) {
      expect(node.type).toBeTruthy();
      expect(node.category).toBeTruthy();
      expect(node.title).toBeTruthy();
      expect(node.description).toBeTruthy();
      expect(node.defaultConfig).toBeDefined();
    }
  });

  it('includes all documented implemented node types', () => {
    const types = nodeCatalog.map((n) => n.type);
    const implemented = [
      'start',
      'end',
      'prompt',
      'subAgent',
      'askUserQuestion',
      'ifElse',
      'switch',
      'skill',
      'mcp',
      'flow',
      'codex',
      'branch',
    ];

    for (const t of implemented) {
      expect(types).toContain(t);
    }
  });

  it('includes all 8 researched node types', () => {
    const types = nodeCatalog.map((n) => n.type);
    const researched = [
      'parallel',
      'httpRequest',
      'dataTransform',
      'delay',
      'webhookTrigger',
      'variableStore',
      'codeExecutor',
      'batchIterator',
    ];
    for (const t of researched) {
      expect(types).toContain(t);
    }
  });

  it('getNodeDefinition returns correct definition', () => {
    const def = getNodeDefinition('parallel');
    expect(def.title).toBe('Parallel Execution');
    expect(def.category).toBe('control');
  });

  it('getNodeDefinition throws for unknown type', () => {
    expect(() => getNodeDefinition('nonexistent' as never)).toThrow('Unknown node type');
  });
});
