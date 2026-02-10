import type { WorkflowRepository } from "../../core/workflow/repository"
import type { WorkflowDocument } from "../../core/workflow/types"

/**
 * Provides memory workflow repository behavior.
 */
export class MemoryWorkflowRepository implements WorkflowRepository {
  private readonly store = new Map<string, WorkflowDocument>()

  async save(workflow: WorkflowDocument): Promise<void> {
    this.store.set(workflow.id, workflow)
  }

  async load(id: string): Promise<WorkflowDocument | null> {
    return this.store.get(id) ?? null
  }

  async list(): Promise<WorkflowDocument[]> {
    return [...this.store.values()]
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }
}
