import type {
  ExecEdge,
  ExecNode,
  ExecProgram,
  LlmWriteExecNode,
  ToolCallExecNode,
  TransformExecNode,
  VarGetExecNode,
  VarSetExecNode,
} from "@lattice/ir"
import type { LlmProvider } from "@lattice/llm"
import jmespath from "jmespath"
import type { EscalationEngine } from "./escalation-engine"
import { createEventFactory, redactContent } from "./event-stream"
import type { PromptCompiler } from "./prompt-compiler"
import type { RepairEngine } from "./repair-engine"
import { StateStore } from "./state-store"
import { ToolExecutor } from "./tool-executor"
import type {
  ExecutionEvent,
  ExecutionResult,
  ExecutionStatus,
  ProviderFailure,
  WorkflowStreamEventType,
  WorkflowStreamPayloadMap,
} from "./types"
import type { Validator } from "./validator"

interface RunnerDependencies {
  provider: LlmProvider
  promptCompiler: PromptCompiler
  validator: Validator
  repairEngine: RepairEngine
  escalationEngine: EscalationEngine
  toolExecutor?: ToolExecutor
}

interface ExecuteOptions {
  runId?: string
  initialSeq?: number
  checkpoint?: {
    queue: string[]
    completedNodeIds: string[]
    skippedNodeIds: string[]
    state: {
      $vars: Record<string, unknown>
      $tmp: Record<string, unknown>
      $ctx: Record<string, unknown>
      $in: Record<string, unknown>
    }
  }
  onEvent?: (event: ExecutionEvent) => void
}

function isSwitchAwaitingUserInput(node: ExecNode, state: StateStore): boolean {
  if (node.op !== "SWITCH") {
    return false
  }
  const questionText = node.inputs?.questionText
  const evaluationTarget = node.inputs?.evaluationTarget
  if (
    typeof questionText !== "string" ||
    typeof evaluationTarget !== "string"
  ) {
    return false
  }
  if (!isStateRef(evaluationTarget)) {
    return false
  }
  const currentValue = state.get(evaluationTarget)
  return (
    currentValue === undefined || currentValue === null || currentValue === ""
  )
}

function buildRunWaitingPayload(
  node: ExecNode
): WorkflowStreamPayloadMap["run.waiting"] {
  const rawOptions = Array.isArray(node.inputs?.options)
    ? (node.inputs?.options as Array<Record<string, unknown>>)
    : []
  const options = rawOptions.map((option, index) => {
    const label =
      typeof option.label === "string" && option.label.trim().length > 0
        ? option.label
        : `Option ${index + 1}`
    const value =
      typeof option.value === "string" && option.value.trim().length > 0
        ? option.value
        : label
    const description =
      typeof option.description === "string" ? option.description : undefined
    return { label, value, description }
  })
  return {
    status: "waiting",
    stageId: node.id,
    question:
      typeof node.inputs?.questionText === "string"
        ? node.inputs.questionText
        : "Select an option",
    options,
    inputPath:
      typeof node.inputs?.evaluationTarget === "string"
        ? node.inputs.evaluationTarget
        : `$in.askUserQuestion.${node.id}`,
  }
}

function now(): string {
  return new Date().toISOString()
}

function isStateRef(value: unknown): value is `$${string}` {
  return typeof value === "string" && value.startsWith("$")
}

function normalizeProviderFailure(error: unknown): ProviderFailure {
  const unknownFailure: ProviderFailure = {
    code: "unknown",
    provider: "unknown",
    retryable: false,
  }

  if (error instanceof SyntaxError) {
    return {
      code: "malformed_output",
      provider: "unknown",
      retryable: false,
    }
  }

  if (!(error instanceof Error)) {
    return unknownFailure
  }

  const provider = /openai/i.test(error.name) ? "openai" : "unknown"
  if (error.name === "MissingApiKeyError") {
    return {
      code: "auth",
      provider: "openai",
      retryable: false,
    }
  }
  const candidate = error as Error & {
    status?: number
    statusCode?: number
    code?: string
    cause?: { code?: string }
  }
  const statusCode = candidate.status ?? candidate.statusCode
  const rawCode =
    candidate.code ??
    (typeof candidate.cause === "object" ? candidate.cause?.code : undefined)
  const code = typeof rawCode === "string" ? rawCode.toLowerCase() : undefined

  if (statusCode === 401 || statusCode === 403) {
    return { code: "auth", provider, retryable: false, statusCode }
  }
  if (statusCode === 429) {
    return { code: "rate_limit", provider, retryable: true, statusCode }
  }
  if (statusCode === 408 || statusCode === 504) {
    return { code: "timeout", provider, retryable: true, statusCode }
  }
  if (typeof statusCode === "number" && statusCode >= 500) {
    return {
      code: "provider_unavailable",
      provider,
      retryable: true,
      statusCode,
    }
  }

  if (code?.includes("timeout") || code === "etimedout") {
    return { code: "timeout", provider, retryable: true, statusCode }
  }
  if (
    code === "econnreset" ||
    code === "econnrefused" ||
    code === "enotfound" ||
    code === "eai_again" ||
    code?.includes("network")
  ) {
    return { code: "network", provider, retryable: true, statusCode }
  }

  return { ...unknownFailure, provider, statusCode }
}

/**
 * Executes evaluate when.
 */
function evaluateWhen(edge: ExecEdge, state: StateStore): boolean {
  const when = edge.when
  if (when.op === "always") {
    return true
  }
  const left = String(
    isStateRef(when.left) ? (state.get(when.left) ?? "") : when.left
  )
  const right = String(
    isStateRef(when.right) ? (state.get(when.right) ?? "") : when.right
  )
  switch (when.op) {
    case "eq":
      return left === right
    case "neq":
      return left !== right
    case "contains":
      return left.includes(right)
    case "regex":
      return new RegExp(right).test(left)
    default:
      return false
  }
}

/**
 * Provides runner behavior.
 */
export class Runner {
  private readonly provider: LlmProvider
  private readonly promptCompiler: PromptCompiler
  private readonly validator: Validator
  private readonly repairEngine: RepairEngine
  private readonly escalationEngine: EscalationEngine
  private readonly toolExecutor: ToolExecutor
  private readonly abortController = new AbortController()

  constructor(deps: RunnerDependencies) {
    this.provider = deps.provider
    this.promptCompiler = deps.promptCompiler
    this.validator = deps.validator
    this.repairEngine = deps.repairEngine
    this.escalationEngine = deps.escalationEngine
    this.toolExecutor = deps.toolExecutor ?? new ToolExecutor()
  }

  abort(): void {
    this.abortController.abort()
  }

  async execute(
    program: ExecProgram,
    input: Record<string, unknown> = {},
    context: Record<string, unknown> = {},
    options: ExecuteOptions = {}
  ): Promise<ExecutionResult> {
    const runId = options.runId ?? crypto.randomUUID()
    const eventFactory = createEventFactory(
      runId,
      options.onEvent,
      options.initialSeq ?? 0
    )
    const events: ExecutionEvent[] = []
    const emit = <TType extends WorkflowStreamEventType>(
      type: TType,
      payload: WorkflowStreamPayloadMap[TType]
    ): ExecutionEvent => {
      const event = eventFactory.emit(type, payload)
      events.push(event)
      return event
    }

    const checkpoint = options.checkpoint
    const state = checkpoint
      ? new StateStore(
          input,
          {
            ...(checkpoint.state.$ctx ?? {}),
            ...context,
          },
          checkpoint.state
        )
      : new StateStore(input, {
          timestamp: now(),
          executionId: runId,
          ...context,
        })

    if (!checkpoint) {
      emit("run.started", {
        status: "running",
        input: redactContent(input, {
          force: true,
          redactionReason: "input-redacted-by-default",
        }),
      })
    }

    const nodeMap = new Map(program.nodes.map((node) => [node.id, node]))
    const outgoing = new Map<string, ExecEdge[]>()
    const incomingCount = new Map<string, number>()
    const completed = new Set<string>()
    const skipped = new Set<string>()

    for (const node of program.nodes) {
      incomingCount.set(node.id, 0)
    }
    for (const edge of program.edges) {
      const edges = outgoing.get(edge.from) ?? []
      edges.push(edge)
      outgoing.set(edge.from, edges)
      incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1)
    }

    const queue: string[] = checkpoint
      ? [...checkpoint.queue]
      : [program.entry_node]
    let status: ExecutionStatus = "running"
    const restoredCompleted = checkpoint
      ? checkpoint.completedNodeIds
      : ([] as string[])
    const restoredSkipped = checkpoint
      ? checkpoint.skippedNodeIds
      : ([] as string[])
    for (const nodeId of restoredCompleted) {
      completed.add(nodeId)
    }
    for (const nodeId of restoredSkipped) {
      skipped.add(nodeId)
    }

    while (queue.length > 0) {
      if (this.abortController.signal.aborted) {
        status = "cancelled"
        break
      }
      const nodeId = queue.shift()
      if (!nodeId) {
        continue
      }
      if (completed.has(nodeId) || skipped.has(nodeId)) {
        continue
      }
      const node = nodeMap.get(nodeId)
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`)
      }

      emit("stage.started", {
        stageId: nodeId,
        stageType: node.op,
      })
      try {
        await this.executeNode(node, state, emit)
        emit("stage.completed", {
          stageId: nodeId,
          stageType: node.op,
        })
        if (node.op === "END") {
          completed.add(nodeId)
          status = "completed"
          break
        }

        const outgoingEdges = outgoing.get(nodeId) ?? []
        let selectedEdges = outgoingEdges
        if (node.op === "SWITCH") {
          if (isSwitchAwaitingUserInput(node, state)) {
            const waitingPayload = buildRunWaitingPayload(node)
            emit("run.waiting", waitingPayload)
            status = "waiting"
            queue.unshift(nodeId)
            break
          }

          const matchedConditional = outgoingEdges.find(
            (edge) => edge.when.op !== "always" && evaluateWhen(edge, state)
          )
          if (matchedConditional) {
            selectedEdges = [matchedConditional]
          } else {
            const defaultEdge = outgoingEdges.find(
              (edge) => edge.when.op === "always"
            )
            selectedEdges = defaultEdge ? [defaultEdge] : []
          }

          for (const edge of outgoingEdges) {
            if (!selectedEdges.some((selected) => selected.to === edge.to)) {
              skipped.add(edge.to)
            }
          }
        }

        completed.add(nodeId)

        for (const edge of selectedEdges) {
          const required = incomingCount.get(edge.to) ?? 0
          const predecessors = program.edges
            .filter((e) => e.to === edge.to)
            .map((e) => e.from)
          const done = predecessors.filter((pred) => completed.has(pred)).length
          if (done >= required) {
            queue.push(edge.to)
          }
        }
      } catch (error) {
        status = "failed"
        const providerFailure = normalizeProviderFailure(error)
        emit("stage.failed", {
          stageId: nodeId,
          stageType: node.op,
          error: (error as Error).message,
          providerFailure,
        })
        emit("trace.breadcrumb", {
          stageId: nodeId,
          category: "run.terminal",
          summary: "Run failed while executing stage",
          details: redactContent((error as Error).message, {
            force: true,
            redactionReason: "reasoning-redacted-by-default",
          }),
        })
        emit("run.failed", {
          status: "failed",
          error: (error as Error).message,
          providerFailure,
        })
        return {
          status,
          runId,
          finalState: state.snapshot(),
          events,
          error: error as Error,
        }
      }
    }

    if (status === "waiting") {
      return {
        status,
        runId,
        finalState: state.snapshot(),
        events,
        checkpoint: {
          queue,
          completedNodeIds: [...completed],
          skippedNodeIds: [...skipped],
          state: state.snapshot(),
        },
      }
    }

    if (status === "running") {
      status = "completed"
    }

    emit("trace.breadcrumb", {
      category: "run.terminal",
      summary: `Run reached terminal status: ${status}`,
      details: redactContent(status, {
        force: true,
        redactionReason: "reasoning-redacted-by-default",
      }),
    })
    emit("run.completed", {
      status: status === "cancelled" ? "cancelled" : "completed",
    })
    return {
      status,
      runId,
      finalState: state.snapshot(),
      events,
    }
  }

  private async executeNode(
    node: ExecNode,
    state: StateStore,
    emit: <TType extends WorkflowStreamEventType>(
      type: TType,
      payload: WorkflowStreamPayloadMap[TType]
    ) => ExecutionEvent
  ): Promise<void> {
    switch (node.op) {
      case "START":
      case "END":
        return
      case "LLM_WRITE":
        await this.executeLlmNode(node, state, emit)
        return
      case "SWITCH":
        return
      case "TOOL_CALL": {
        const toolNode = node as ToolCallExecNode
        emit("tool.called", {
          stageId: node.id,
          toolName: toolNode.tool,
          input: redactContent(toolNode.args ?? {}, {
            force: true,
            redactionReason: "tool-input-redacted-by-default",
          }),
        })

        try {
          const result = await this.toolExecutor.execute(toolNode)
          emit("tool.result", {
            stageId: node.id,
            toolName: toolNode.tool,
            status: "success",
            output: redactContent(result),
          })

          if (node.outputs?.result) {
            state.set(node.outputs.result, result)
          }
          return
        } catch (error) {
          emit("tool.failed", {
            stageId: node.id,
            toolName: toolNode.tool,
            error: (error as Error).message,
          })
          throw error
        }
      }
      case "VAR_SET": {
        const varNode = node as VarSetExecNode
        const value = isStateRef(varNode.value)
          ? state.get(varNode.value)
          : varNode.value
        state.set(varNode.target, value)
        if (node.outputs?.result) {
          state.set(node.outputs.result, value)
        }
        return
      }
      case "VAR_GET": {
        const varNode = node as VarGetExecNode
        const value = state.get(varNode.source)
        if (node.outputs?.result) {
          state.set(node.outputs.result, value)
        }
        return
      }
      case "TRANSFORM": {
        const transformNode = node as TransformExecNode
        const sourceRef =
          typeof transformNode.inputs?.source === "string"
            ? (transformNode.inputs.source as `$${string}`)
            : undefined
        const source = sourceRef ? state.get(sourceRef) : state.snapshot()
        const transformed = jmespath.search(source, transformNode.expression)
        if (node.outputs?.result) {
          state.set(node.outputs.result, transformed)
        }
      }
    }
  }

  private async executeLlmNode(
    node: LlmWriteExecNode,
    state: StateStore,
    emit: <TType extends WorkflowStreamEventType>(
      type: TType,
      payload: WorkflowStreamPayloadMap[TType]
    ) => ExecutionEvent
  ): Promise<void> {
    const resolvedInputs = { ...(node.inputs ?? {}) }
    const request = this.promptCompiler.compile(
      node,
      resolvedInputs,
      state.snapshot() as Record<string, unknown>
    )
    emit("trace.breadcrumb", {
      stageId: node.id,
      category: "prompt.compiled",
      summary: "Prompt compiled for model call",
      details: redactContent(
        request.messages.map((message) => message.role),
        {
          force: true,
          redactionReason: "reasoning-redacted-by-default",
        }
      ),
    })

    emit("llm.step.started", {
      stageId: node.id,
      modelClass: request.modelClass,
      prompt: redactContent(request.messages, {
        force: true,
        redactionReason: "prompt-redacted-by-default",
      }),
    })

    try {
      const response = await this.provider.chat(request)
      let output = response.parsed ?? JSON.parse(response.content || "{}")
      let validation = this.validator.validate(output, node)
      if (!validation.valid) {
        emit("trace.breadcrumb", {
          stageId: node.id,
          category: "validation.failed",
          summary: "Validation failed and repair started",
          details: redactContent(validation.errors.length, {
            force: true,
            redactionReason: "reasoning-redacted-by-default",
          }),
        })
        const repair = await this.repairEngine.attemptRepair(
          node,
          output,
          validation.errors,
          this.provider
        )
        emit("trace.breadcrumb", {
          stageId: node.id,
          category: "repair.attempted",
          summary: `Repair attempted: ${repair.repaired ? "succeeded" : "failed"}`,
          details: redactContent(repair.attempts, {
            force: true,
            redactionReason: "reasoning-redacted-by-default",
          }),
        })
        if (repair.repaired) {
          output = repair.output
          validation = this.validator.validate(output, node)
        }
      }

      // Single-model mode: do not switch model class during runtime execution.
      // Escalation policies remain in IR for forward compatibility, but are not applied here.

      if (!validation.valid) {
        throw new Error(
          validation.errors.map((error) => error.message).join("; ")
        )
      }

      emit("llm.step.completed", {
        stageId: node.id,
        modelUsed: response.modelUsed,
        usage: response.usage,
        response: {
          value: response.content,
          redactionLevel: "none",
          isRedacted: false,
        },
      })

      if (node.outputs?.result) {
        state.set(node.outputs.result, output)
      }
    } catch (error) {
      const providerFailure = normalizeProviderFailure(error)
      emit("llm.step.failed", {
        stageId: node.id,
        error: (error as Error).message,
        providerFailure,
      })
      throw error
    }
  }
}
