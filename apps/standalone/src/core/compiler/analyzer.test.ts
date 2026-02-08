import { describe, expect, it } from 'vitest';

import type { WorkflowEdge, WorkflowNode, WorkflowNodeType } from '../workflow/types';
import { analyzeGraph } from './analyzer';

function node(id: string, type: WorkflowNodeType = 'subAgent'): WorkflowNode {
  return { id, type, label: id, position: { x: 0, y: 0 }, config: {} };
}

function edge(source: string, target: string): WorkflowEdge {
  return { id: `${source}-${target}`, source, target };
}

describe('analyzeGraph', () => {
  it('returns topological order for a linear chain', () => {
    const nodes = [node('a', 'start'), node('b'), node('c', 'end')];
    const edges = [edge('a', 'b'), edge('b', 'c')];
    const result = analyzeGraph(nodes, edges);
    expect(result.executionOrder).toEqual(['a', 'b', 'c']);
    expect(result.cycles).toEqual([]);
    expect(result.unreachable).toEqual([]);
  });

  it('detects a simple cycle', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')];
    const result = analyzeGraph(nodes, edges);
    expect(result.cycles.length).toBeGreaterThanOrEqual(1);
  });

  it('finds unreachable nodes', () => {
    const nodes = [node('start', 'start'), node('connected'), node('orphan')];
    const edges = [edge('start', 'connected')];
    const result = analyzeGraph(nodes, edges);
    expect(result.unreachable).toContain('orphan');
    expect(result.unreachable).not.toContain('start');
    expect(result.unreachable).not.toContain('connected');
  });

  it('handles empty graph', () => {
    const result = analyzeGraph([], []);
    expect(result.executionOrder).toEqual([]);
    expect(result.cycles).toEqual([]);
    expect(result.unreachable).toEqual([]);
  });

  it('handles graph with no edges', () => {
    const nodes = [node('a', 'start'), node('b')];
    const result = analyzeGraph(nodes, []);
    expect(result.executionOrder).toHaveLength(2);
    expect(result.unreachable).toContain('b');
  });

  it('handles diamond graph without false cycles', () => {
    const nodes = [node('s', 'start'), node('a'), node('b'), node('e', 'end')];
    const edges = [edge('s', 'a'), edge('s', 'b'), edge('a', 'e'), edge('b', 'e')];
    const result = analyzeGraph(nodes, edges);
    expect(result.cycles).toEqual([]);
    expect(result.unreachable).toEqual([]);
    expect(result.executionOrder[0]).toBe('s');
  });
});
