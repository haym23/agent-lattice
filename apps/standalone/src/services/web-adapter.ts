import { IndexedDbWorkflowRepository } from '../adapters/persistence/indexeddbWorkflowRepository';
import { compileWorkflow } from '../core/compiler/pipeline';
import type { CompileOutput, CompilerTarget } from '../core/compiler/types';
import { ModelRegistry } from '../core/models/registry';
import type { ModelDefinition } from '../core/models/types';
import type { WorkflowDocument } from '../core/workflow/types';
import type { McpToolSchema, PlatformAdapter } from './platform-adapter';

export class WebPlatformAdapter implements PlatformAdapter {
  private readonly repository = new IndexedDbWorkflowRepository();
  private readonly modelRegistry = new ModelRegistry();

  async saveWorkflow(id: string, data: WorkflowDocument): Promise<void> {
    await this.repository.save({ ...data, id, updatedAt: new Date().toISOString() });
  }

  async loadWorkflow(id: string): Promise<WorkflowDocument | null> {
    return this.repository.load(id);
  }

  async listWorkflows(): Promise<WorkflowDocument[]> {
    return this.repository.list();
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async compileWorkflow(
    workflow: WorkflowDocument,
    modelId: string,
    target: string
  ): Promise<CompileOutput> {
    const model = this.modelRegistry.get(modelId);
    return compileWorkflow({ workflow, model, target: target as CompilerTarget });
  }

  async generateWorkflow(_prompt: string, _model: string): Promise<WorkflowDocument> {
    throw new Error('AI generation requires an API key. Configure in Settings (Phase 2).');
  }

  async refineWorkflow(
    _workflow: WorkflowDocument,
    _instruction: string
  ): Promise<WorkflowDocument> {
    throw new Error('AI refinement requires an API key. Configure in Settings (Phase 2).');
  }

  listModels(): ModelDefinition[] {
    return this.modelRegistry.list();
  }

  async discoverMcpTools(): Promise<McpToolSchema[]> {
    return [];
  }
}
