import { createDefaultEmitterRegistry } from './registry';
import type { CompileInput, CompileOutput } from './types';

function analyzeGraph(input: CompileInput): CompileInput {
  if (input.workflow.nodes.length === 0) {
    throw new Error('Workflow must contain at least one node');
  }
  return input;
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
  const analyzed = analyzeGraph(input);
  const normalized = normalizeGraph(analyzed);
  const registry = createDefaultEmitterRegistry();
  const emitted = registry.emit(normalized);
  return validateOutput(emitted);
}
