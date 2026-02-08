import { IndexedDbWorkflowRepository } from '../../adapters/persistence/indexeddbWorkflowRepository';
import { compileWorkflow } from '../../core/compiler/pipeline';
import type { CompilerTarget } from '../../core/compiler/types';
import { ModelRegistry } from '../../core/models/registry';
import { serializeWorkflowFromCanvas } from '../../core/workflow/serialization';
import type { WorkflowDocument } from '../../core/workflow/types';

const repository = new IndexedDbWorkflowRepository();
const modelRegistry = new ModelRegistry();

export async function saveCurrentWorkflow(input: {
  id?: string;
  name: string;
  description?: string;
  nodes: Parameters<typeof serializeWorkflowFromCanvas>[0]['nodes'];
  edges: Parameters<typeof serializeWorkflowFromCanvas>[0]['edges'];
}): Promise<WorkflowDocument> {
  const workflow = serializeWorkflowFromCanvas(input);
  await repository.save(workflow);
  return workflow;
}

export async function listStoredWorkflows(): Promise<WorkflowDocument[]> {
  return repository.list();
}

export async function loadStoredWorkflow(id: string): Promise<WorkflowDocument | null> {
  return repository.load(id);
}

export function compileForTarget(input: {
  workflow: WorkflowDocument;
  modelId: string;
  target: CompilerTarget;
}) {
  const model = modelRegistry.get(input.modelId);
  return compileWorkflow({ workflow: input.workflow, model, target: input.target });
}

export function listModels() {
  return modelRegistry.list();
}
