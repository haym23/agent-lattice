import type { WorkflowNodeType } from "../workflow/types"

export type NodeCategory =
  | "core-ai"
  | "logic"
  | "data"
  | "output"
  | "agent"
  | "integration"
  | "control"

export interface NodeDefinition {
  type: WorkflowNodeType
  category: NodeCategory
  title: string
  description: string
  defaultConfig: Record<string, unknown>
}

export const nodeCatalog: NodeDefinition[] = [
  {
    type: "start",
    category: "logic",
    title: "Start",
    description: "Workflow entry point. Exactly one Start node is required.",
    defaultConfig: { label: "Start" },
  },
  {
    type: "end",
    category: "logic",
    title: "End",
    description: "Workflow exit point. At least one End node is required.",
    defaultConfig: { label: "End" },
  },
  {
    type: "prompt",
    category: "core-ai",
    title: "Prompt",
    description: "Define prompt/instruction text for workflow execution.",
    defaultConfig: { prompt: "", variables: {} },
  },
  {
    type: "subAgent",
    category: "agent",
    title: "Sub-Agent",
    description: "Delegate execution to an AI sub-agent step.",
    defaultConfig: { description: "", prompt: "", outputPorts: 1 },
  },
  {
    type: "askUserQuestion",
    category: "logic",
    title: "Ask User Question",
    description: "Capture a user decision with 2-4 options for branching.",
    defaultConfig: { questionText: "", options: [], outputPorts: 2 },
  },
  {
    type: "ifElse",
    category: "logic",
    title: "If/Else",
    description: "Two-way branch with fixed true/false style outputs.",
    defaultConfig: { evaluationTarget: "", branches: [], outputPorts: 2 },
  },
  {
    type: "switch",
    category: "logic",
    title: "Switch",
    description: "Multi-way branching with a required default branch.",
    defaultConfig: { evaluationTarget: "", branches: [], outputPorts: 3 },
  },
  {
    type: "skill",
    category: "agent",
    title: "Skill",
    description: "Execute or load a Claude Code skill.",
    defaultConfig: {
      name: "",
      description: "",
      scope: "project",
      outputPorts: 1,
    },
  },
  {
    type: "mcp",
    category: "integration",
    title: "MCP Tool",
    description: "Invoke a Model Context Protocol tool.",
    defaultConfig: {
      mode: "manualParameterConfig",
      serverId: "",
      toolName: "",
      outputPorts: 1,
    },
  },
  {
    type: "flow",
    category: "agent",
    title: "Flow",
    description: "Reference and execute a reusable sub-agent flow.",
    defaultConfig: { flowId: "", outputPorts: 1 },
  },
  {
    type: "codex",
    category: "agent",
    title: "Codex",
    description: "OpenAI Codex CLI execution step.",
    defaultConfig: {
      label: "Codex",
      promptMode: "fixed",
      prompt: "",
      model: "gpt-5.2-codex",
      reasoningEffort: "medium",
      sandbox: "workspace-write",
      outputPorts: 1,
    },
  },
  {
    type: "branch",
    category: "logic",
    title: "Legacy Branch",
    description: "Legacy branch node kept for backward compatibility.",
    defaultConfig: { branchType: "conditional", branches: [], outputPorts: 2 },
  },
  {
    type: "parallel",
    category: "control",
    title: "Parallel Execution",
    description: "Execute multiple branches concurrently.",
    defaultConfig: { branchCount: 2, failureStrategy: "wait-all" },
  },
  {
    type: "httpRequest",
    category: "integration",
    title: "HTTP Request",
    description: "Make HTTP/HTTPS requests to external APIs.",
    defaultConfig: { method: "GET", url: "", responseFormat: "json" },
  },
  {
    type: "dataTransform",
    category: "data",
    title: "Data Transformer",
    description:
      "Transform structured data with JSONPath, JMESPath, or JavaScript.",
    defaultConfig: { transformationType: "jmespath", expression: "" },
  },
  {
    type: "delay",
    category: "control",
    title: "Delay",
    description: "Pause workflow execution for a specified duration.",
    defaultConfig: { delayType: "duration", duration: 1000 },
  },
  {
    type: "webhookTrigger",
    category: "integration",
    title: "Webhook Trigger",
    description:
      "Receive incoming HTTP webhooks to trigger workflow execution.",
    defaultConfig: { payloadFormat: "json", allowedMethods: ["POST"] },
  },
  {
    type: "variableStore",
    category: "data",
    title: "Variable Store",
    description: "Store and retrieve variables across workflow execution.",
    defaultConfig: { operation: "set", scope: "workflow" },
  },
  {
    type: "codeExecutor",
    category: "integration",
    title: "Code Executor",
    description: "Execute custom code snippets in a sandboxed environment.",
    defaultConfig: { language: "javascript", timeout: 30000 },
  },
  {
    type: "batchIterator",
    category: "control",
    title: "Batch Iterator",
    description:
      "Process lists in configurable batch sizes with rate limiting.",
    defaultConfig: { batchSize: 50, processingMode: "sequential" },
  },
]

/**
 * Returns node definition.
 */
export function getNodeDefinition(type: WorkflowNodeType): NodeDefinition {
  const node = nodeCatalog.find((entry) => entry.type === type)
  if (!node) throw new Error(`Unknown node type: ${type}`)
  return node
}
