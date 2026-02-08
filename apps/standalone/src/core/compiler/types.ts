import type { ModelDefinition } from '../models/types';
import type { WorkflowDocument } from '../workflow/types';

export type CompilerTarget = 'claude' | 'openai-assistants' | 'portable-json';

export interface CompileInput {
  workflow: WorkflowDocument;
  model: ModelDefinition;
  target: CompilerTarget;
}

export interface CompileOutput {
  target: CompilerTarget;
  files: Array<{ path: string; content: string }>;
}

export interface CompilerEmitter {
  target: CompilerTarget;
  emit(input: CompileInput): CompileOutput;
}
