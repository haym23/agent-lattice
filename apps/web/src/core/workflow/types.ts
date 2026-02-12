export const WORKFLOW_NODE_TYPES = [
  "start",
  "end",
  "prompt",
  "subAgent",
  "askUserQuestion",
  "conditional",
  "nondeterministic",
  "recursion",
  "switch",
  "skill",
  "mcp",
  "flow",
  "branch",
  "parallel",
  "httpRequest",
  "dataTransform",
  "delay",
  "webhookTrigger",
  "variableStore",
  "codeExecutor",
  "batchIterator",
] as const

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number]

const workflowNodeTypeSet = new Set<string>(WORKFLOW_NODE_TYPES)

export function isWorkflowNodeType(value: string): value is WorkflowNodeType {
  return workflowNodeTypeSet.has(value)
}

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label: string
  position: { x: number; y: number }
  config: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowDocument {
  id: string
  name: string
  description?: string
  version: "1.0.0"
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  metadata?: Record<string, unknown>
}
