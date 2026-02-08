import { analyzeGraph } from './analyzer';
import { createDefaultEmitterRegistry } from './registry';
import type { AnalyzedGraph, CompileInput, CompileOutput } from './types';

export function buildAnalyzedGraph(input: CompileInput): AnalyzedGraph {
  if (input.workflow.nodes.length === 0) {
    throw new Error('Workflow must contain at least one node');
  }
  return analyzeGraph(input.workflow.nodes, input.workflow.edges);
}

function normalizeGraph(input: CompileInput): CompileInput {
  return {
    ...input,
    workflow: {
      ...input.workflow,
      nodes: [...input.workflow.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    },
  };
}

function validateOutput(output: CompileOutput): CompileOutput {
  if (output.files.length === 0) {
    throw new Error('Compiler produced no files');
  }
  return output;
}

export function compileWorkflow(input: CompileInput): CompileOutput {
  const graph = buildAnalyzedGraph(input);
  const normalized = normalizeGraph(input);
  const registry = createDefaultEmitterRegistry();
  const emitted = registry.emit(normalized);

  const graphWarnings: string[] = [];
  if (graph.cycles.length > 0) {
    graphWarnings.push(
      `Graph contains ${graph.cycles.length} cycle(s): ${graph.cycles.map((c) => c.join(' -> ')).join('; ')}`
    );
  }
  if (graph.unreachable.length > 0) {
    graphWarnings.push(`Unreachable nodes: ${graph.unreachable.join(', ')}`);
  }

  return validateOutput({
    ...emitted,
    warnings: [...graphWarnings, ...emitted.warnings],
  });
}
