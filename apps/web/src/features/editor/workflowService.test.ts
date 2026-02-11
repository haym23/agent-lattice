import type { CompileOutput } from "@lattice/compiler"
import type { ExecutionResult } from "@lattice/runtime"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { MemoryWorkflowRepository } from "../../adapters/persistence/memoryWorkflowRepository"
import { ModelRegistry } from "../../core/models/registry"
import type { ModelDefinition } from "../../core/models/types"
import type { WorkflowDocument } from "../../core/workflow/types"
import type {
  ExecutionListener,
  McpToolSchema,
  PlatformAdapter,
} from "../../services/platform-adapter"
import {
  listStoredWorkflows,
  saveCurrentWorkflow,
  setPlatformAdapter,
} from "./workflowService"

class WorkflowServiceTestAdapter implements PlatformAdapter {
  private readonly repository = new MemoryWorkflowRepository()
  private readonly modelRegistry = new ModelRegistry()

  async saveWorkflow(_id: string, data: WorkflowDocument): Promise<void> {
    await this.repository.save(data)
  }

  async loadWorkflow(id: string): Promise<WorkflowDocument | null> {
    return this.repository.load(id)
  }

  async listWorkflows(): Promise<WorkflowDocument[]> {
    return this.repository.list()
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async compileWorkflow(
    _workflow: WorkflowDocument,
    _modelId: string,
    _target: string
  ): Promise<CompileOutput> {
    throw new Error("Not implemented")
  }

  async generateWorkflow(
    _prompt: string,
    _model: string
  ): Promise<WorkflowDocument> {
    throw new Error("Not implemented")
  }

  async refineWorkflow(
    _workflow: WorkflowDocument,
    _instruction: string
  ): Promise<WorkflowDocument> {
    throw new Error("Not implemented")
  }

  async executeWorkflow(
    _workflow: WorkflowDocument,
    _input?: Record<string, unknown>
  ): Promise<ExecutionResult> {
    throw new Error("Not implemented")
  }

  subscribeToExecution(_listener: ExecutionListener): () => void {
    return () => {}
  }

  listModels(): ModelDefinition[] {
    return this.modelRegistry.list()
  }

  async discoverMcpTools(): Promise<McpToolSchema[]> {
    return []
  }
}

const EMPTY_GRAPH = { nodes: [], edges: [] }

describe("workflowService", () => {
  let adapter: WorkflowServiceTestAdapter

  beforeEach(() => {
    adapter = new WorkflowServiceTestAdapter()
    setPlatformAdapter(adapter)
  })

  afterEach(() => {
    setPlatformAdapter(new WorkflowServiceTestAdapter())
  })

  it("save updates existing workflow deterministically", async () => {
    const first = await saveCurrentWorkflow({
      name: "alpha",
      ...EMPTY_GRAPH,
      mode: "save",
    })

    const second = await saveCurrentWorkflow({
      id: first.id,
      name: "alpha-updated",
      ...EMPTY_GRAPH,
      mode: "save",
    })

    const workflows = await listStoredWorkflows()

    expect(workflows).toHaveLength(1)
    expect(second.id).toBe(first.id)
    expect(second.createdAt).toBe(first.createdAt)
    expect(workflows[0]?.name).toBe("alpha-updated")
  })

  it("save as resolves deterministic name collisions", async () => {
    const original = await saveCurrentWorkflow({
      name: "alpha",
      ...EMPTY_GRAPH,
      mode: "save",
    })

    const copyOne = await saveCurrentWorkflow({
      id: original.id,
      name: "alpha",
      ...EMPTY_GRAPH,
      mode: "save-as",
    })

    const copyTwo = await saveCurrentWorkflow({
      id: original.id,
      name: "alpha",
      ...EMPTY_GRAPH,
      mode: "save-as",
    })

    expect(copyOne.id).not.toBe(original.id)
    expect(copyOne.name).toBe("alpha (copy)")
    expect(copyTwo.name).toBe("alpha (copy 2)")
  })

  it("deduplicates list entries by workflow id", async () => {
    const workflow = await saveCurrentWorkflow({
      name: "dedupe",
      ...EMPTY_GRAPH,
      mode: "save",
    })

    await adapter.saveWorkflow(workflow.id, {
      ...workflow,
      name: "dedupe-updated",
      updatedAt: new Date(Date.now() + 1_000).toISOString(),
    })

    const workflows = await listStoredWorkflows()
    expect(workflows).toHaveLength(1)
    expect(workflows[0]?.name).toBe("dedupe-updated")
  })
})
