import type { WorkflowEdge, WorkflowNode } from '../workflow/types';
import type { AnalyzedGraph } from './types';

export function analyzeGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): AnalyzedGraph {
  const executionOrder = topologicalSort(nodes, edges);
  const cycles = detectCycles(nodes, edges);
  const unreachable = findUnreachable(nodes, edges);
  return { nodes, edges, executionOrder, cycles, unreachable };
}

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) neighbors.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) neighbors.push(edge.target);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(nodeId: string, path: string[]): void {
    if (inStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart));
      }
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      dfs(neighbor, [...path]);
    }

    inStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

function findUnreachable(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0 && nodes.length > 0) {
    const hasIncoming = new Set(edges.map((e) => e.target));
    const roots = nodes.filter((n) => !hasIncoming.has(n.id));
    if (roots.length > 0) startNodes.push(...roots);
    else return [];
  }

  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) neighbors.push(edge.target);
  }

  const reachable = new Set<string>();
  const queue = startNodes.map((n) => n.id);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!reachable.has(neighbor)) queue.push(neighbor);
    }
  }

  return nodes.filter((n) => !reachable.has(n.id)).map((n) => n.id);
}
