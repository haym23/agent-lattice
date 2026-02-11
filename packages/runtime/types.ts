export type StateSnapshot = {
  $vars: Record<string, unknown>
  $tmp: Record<string, unknown>
  $ctx: Record<string, unknown>
  $in: Record<string, unknown>
}

export type ExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type NodeExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "skipped"
  | "failed"

export type WorkflowStreamEventVersion = "1.0"

export type WorkflowStreamEventType =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "stage.started"
  | "stage.completed"
  | "stage.failed"
  | "tool.called"
  | "tool.result"
  | "tool.failed"
  | "llm.step.started"
  | "llm.step.completed"
  | "llm.step.failed"
  | "trace.breadcrumb"

export interface RedactionMetadata {
  redactionLevel: "none" | "partial" | "full"
  isRedacted: boolean
  redactionReason?: string
}

export interface RedactedContent extends RedactionMetadata {
  value: unknown
}

export interface RunStartedPayload {
  status: "running"
  input: RedactedContent
}

export interface RunCompletedPayload {
  status: "completed" | "cancelled"
}

export interface RunFailedPayload {
  status: "failed"
  error: string
  providerFailure?: ProviderFailure
}

export interface StageStartedPayload {
  stageId: string
  stageType: string
}

export interface StageCompletedPayload {
  stageId: string
  stageType: string
}

export interface StageFailedPayload {
  stageId: string
  stageType: string
  error: string
  providerFailure?: ProviderFailure
}

export interface ToolCalledPayload {
  stageId: string
  toolName: string
  input: RedactedContent
}

export interface ToolResultPayload {
  stageId: string
  toolName: string
  status: "success"
  output: RedactedContent
}

export interface ToolFailedPayload {
  stageId: string
  toolName: string
  error: string
}

export interface LlmStepStartedPayload {
  stageId: string
  modelClass: string
  prompt: RedactedContent
}

export interface LlmStepCompletedPayload {
  stageId: string
  modelUsed: string
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export interface LlmStepFailedPayload {
  stageId: string
  error: string
  providerFailure: ProviderFailure
}

export type ProviderFailureCode =
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "invalid_response"
  | "provider_unavailable"
  | "unknown"

export interface ProviderFailure {
  code: ProviderFailureCode
  provider: "openai" | "unknown"
  retryable: boolean
  statusCode?: number
}

export interface TraceBreadcrumbPayload {
  stageId?: string
  category:
    | "prompt.compiled"
    | "validation.failed"
    | "repair.attempted"
    | "run.terminal"
  summary: string
  details: RedactedContent
}

export interface WorkflowStreamPayloadMap {
  "run.started": RunStartedPayload
  "run.completed": RunCompletedPayload
  "run.failed": RunFailedPayload
  "stage.started": StageStartedPayload
  "stage.completed": StageCompletedPayload
  "stage.failed": StageFailedPayload
  "tool.called": ToolCalledPayload
  "tool.result": ToolResultPayload
  "tool.failed": ToolFailedPayload
  "llm.step.started": LlmStepStartedPayload
  "llm.step.completed": LlmStepCompletedPayload
  "llm.step.failed": LlmStepFailedPayload
  "trace.breadcrumb": TraceBreadcrumbPayload
}

export interface WorkflowStreamEventEnvelope<
  TType extends WorkflowStreamEventType = WorkflowStreamEventType,
> {
  eventVersion: WorkflowStreamEventVersion
  runId: string
  seq: number
  timestamp: string
  type: TType
  payload: WorkflowStreamPayloadMap[TType]
}

export type ExecutionEvent = WorkflowStreamEventEnvelope

export type StateEvent =
  | {
      type: "variable-set"
      namespace: "$vars" | "$tmp"
      path: string
      value: unknown
    }
  | { type: "snapshot"; state: StateSnapshot }

export type StateListener = (event: StateEvent) => void

export interface ExecutionResult {
  status: ExecutionStatus
  runId: string
  finalState: StateSnapshot
  events: ExecutionEvent[]
  error?: Error
}
