import type { ExecutionResult } from "@lattice/runtime"
import { serializeWorkflowFromCanvas } from "../../core/workflow/serialization"
import type { WorkflowDocument } from "../../core/workflow/types"
import type { PlatformAdapter } from "../../services/platform-adapter"
import { WebPlatformAdapter } from "../../services/web-adapter"

let adapter: PlatformAdapter = new WebPlatformAdapter()

export type SaveWorkflowMode = "save" | "save-as"

function normalizeWorkflowName(name: string): string {
  const normalized = name.trim()
  return normalized.length > 0 ? normalized : "untitled-workflow"
}

function dedupeAndSortWorkflows(
  workflows: WorkflowDocument[]
): WorkflowDocument[] {
  const uniqueById = new Map<string, WorkflowDocument>()
  for (const workflow of workflows) {
    const existing = uniqueById.get(workflow.id)
    if (!existing) {
      uniqueById.set(workflow.id, workflow)
      continue
    }

    const existingUpdatedAt = Date.parse(existing.updatedAt)
    const nextUpdatedAt = Date.parse(workflow.updatedAt)
    if (Number.isNaN(existingUpdatedAt) || nextUpdatedAt >= existingUpdatedAt) {
      uniqueById.set(workflow.id, workflow)
    }
  }

  return [...uniqueById.values()].sort((left, right) => {
    const rightTime = Date.parse(right.updatedAt)
    const leftTime = Date.parse(left.updatedAt)
    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return left.name.localeCompare(right.name)
    }
    if (rightTime !== leftTime) {
      return rightTime - leftTime
    }
    return left.name.localeCompare(right.name)
  })
}

function resolveSaveAsName(
  requestedName: string,
  existing: WorkflowDocument[]
): string {
  if (!existing.some((workflow) => workflow.name === requestedName)) {
    return requestedName
  }

  let copyIndex = 1
  while (true) {
    const candidate =
      copyIndex === 1
        ? `${requestedName} (copy)`
        : `${requestedName} (copy ${copyIndex})`
    if (!existing.some((workflow) => workflow.name === candidate)) {
      return candidate
    }
    copyIndex += 1
  }
}

export function setPlatformAdapter(custom: PlatformAdapter): void {
  adapter = custom
}

export function getPlatformAdapter(): PlatformAdapter {
  return adapter
}

/**
 * Executes save current workflow.
 */
export async function saveCurrentWorkflow(input: {
  id?: string
  name: string
  description?: string
  nodes: Parameters<typeof serializeWorkflowFromCanvas>[0]["nodes"]
  edges: Parameters<typeof serializeWorkflowFromCanvas>[0]["edges"]
  mode?: SaveWorkflowMode
}): Promise<WorkflowDocument> {
  const mode = input.mode ?? "save"
  const normalizedName = normalizeWorkflowName(input.name)
  const isSaveAs = mode === "save-as"
  const existingWorkflow = input.id
    ? await adapter.loadWorkflow(input.id)
    : null
  const existingWorkflows = isSaveAs ? await listStoredWorkflows() : []
  const workflow = serializeWorkflowFromCanvas({
    ...input,
    id: isSaveAs ? undefined : input.id,
    name: isSaveAs
      ? resolveSaveAsName(normalizedName, existingWorkflows)
      : normalizedName,
  })

  if (existingWorkflow && !isSaveAs) {
    workflow.createdAt = existingWorkflow.createdAt
  }

  await adapter.saveWorkflow(workflow.id, workflow)
  return workflow
}

export async function listStoredWorkflows(): Promise<WorkflowDocument[]> {
  const workflows = await adapter.listWorkflows()
  return dedupeAndSortWorkflows(workflows)
}

/**
 * Loads a stored workflow by its persisted identifier.
 */
export async function loadStoredWorkflow(
  id: string
): Promise<WorkflowDocument | null> {
  return adapter.loadWorkflow(id)
}

export async function deleteStoredWorkflow(id: string): Promise<void> {
  await adapter.deleteWorkflow(id)
}

/**
 * Compiles for target.
 */
export async function compileForTarget(input: {
  workflow: WorkflowDocument
  modelId: string
  target: string
}) {
  return adapter.compileWorkflow(input.workflow, input.modelId, input.target)
}

export function listModels() {
  return adapter.listModels()
}

/**
 * Executes execute workflow.
 */
export async function executeWorkflow(input: {
  workflow: WorkflowDocument
  data?: Record<string, unknown>
}): Promise<ExecutionResult> {
  return adapter.executeWorkflow(input.workflow, input.data ?? {})
}
