import type { CompileOutput } from '../core/compiler/types';
import type { ModelDefinition } from '../core/models/types';
import type { ExecutionEvent, ExecutionResult } from '../core/runtime/types';
import type { WorkflowDocument } from '../core/workflow/types';

export interface PlatformAdapter {
  saveWorkflow(id: string, data: WorkflowDocument): Promise<void>;
  loadWorkflow(id: string): Promise<WorkflowDocument | null>;
  listWorkflows(): Promise<WorkflowDocument[]>;
  deleteWorkflow(id: string): Promise<void>;

  compileWorkflow(
    workflow: WorkflowDocument,
    modelId: string,
    target: string
  ): Promise<CompileOutput>;

  generateWorkflow(prompt: string, model: string): Promise<WorkflowDocument>;
  refineWorkflow(workflow: WorkflowDocument, instruction: string): Promise<WorkflowDocument>;

  executeWorkflow(
    workflow: WorkflowDocument,
    input?: Record<string, unknown>
  ): Promise<ExecutionResult>;
  subscribeToExecution(listener: ExecutionListener): () => void;

  listModels(): ModelDefinition[];

  discoverMcpTools(): Promise<McpToolSchema[]>;
}

export type ExecutionListener = (event: ExecutionEvent) => void;

export interface McpToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
