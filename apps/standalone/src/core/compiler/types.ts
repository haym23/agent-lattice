import type { ModelDefinition } from '../models/types';
import type { WorkflowDocument, WorkflowEdge, WorkflowNode } from '../workflow/types';

export type CompilerTarget = 'claude' | 'openai-assistants' | 'portable-json';

export interface CompileInput {
  workflow: WorkflowDocument;
  model: ModelDefinition;
  target: CompilerTarget;
}

export interface CompileOutput {
  target: CompilerTarget;
  files: Array<{ path: string; content: string }>;
  preview: string;
  warnings: string[];
}

export interface CompilerEmitter {
  target: CompilerTarget;
  name: string;
  description: string;
  emit(input: CompileInput): CompileOutput;
}

export interface AnalyzedGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  executionOrder: string[];
  cycles: string[][];
  unreachable: string[];
}
