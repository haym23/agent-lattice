import {
  createEventFactory,
  type ExecutionEvent,
  type ProviderFailure,
  type RedactedContent,
  redactContent,
} from "@lattice/runtime"

export type AiSdkEvent =
  | {
      type: "step-start"
      stageId: string
      modelClass: string
      prompt: unknown
    }
  | { type: "tool-call"; stageId: string; toolName: string; args: unknown }
  | {
      type: "tool-result"
      stageId: string
      toolName: string
      result: unknown
    }
  | {
      type: "step-complete"
      stageId: string
      modelUsed: string
      usage?: {
        promptTokens?: number
        completionTokens?: number
      }
      response?: unknown
    }
  | {
      type: "step-fail"
      stageId: string
      error: string
      statusCode?: number
      provider?: string
      code?: string
    }

function toCanonicalProviderFailure(
  event: Extract<AiSdkEvent, { type: "step-fail" }>
): ProviderFailure {
  const provider =
    event.provider && event.provider.toLowerCase() === "openai"
      ? "openai"
      : "unknown"
  const statusCode = event.statusCode
  const loweredCode = event.code?.toLowerCase()

  if (loweredCode === "auth" || statusCode === 401 || statusCode === 403) {
    return { code: "auth", provider, retryable: false, statusCode }
  }

  if (loweredCode === "rate_limit" || statusCode === 429) {
    return { code: "rate_limit", provider, retryable: true, statusCode }
  }

  if (loweredCode === "timeout" || statusCode === 408 || statusCode === 504) {
    return { code: "timeout", provider, retryable: true, statusCode }
  }

  if (
    loweredCode === "malformed_output" ||
    loweredCode === "invalid_response"
  ) {
    return {
      code: "malformed_output",
      provider,
      retryable: false,
      statusCode,
    }
  }

  return {
    code: "unknown",
    provider,
    retryable: false,
    statusCode,
  }
}

function toPlainContent(value: unknown): RedactedContent {
  return {
    value,
    redactionLevel: "none",
    isRedacted: false,
  }
}

export function createAiSdkEventMapper(runId: string) {
  const { emit } = createEventFactory(runId)

  return (event: AiSdkEvent): ExecutionEvent => {
    if (event.type === "step-start") {
      return emit("llm.step.started", {
        stageId: event.stageId,
        modelClass: event.modelClass,
        prompt: redactContent(event.prompt, {
          force: true,
          redactionReason: "prompt-redacted-by-default",
        }),
      })
    }

    if (event.type === "tool-call") {
      return emit("tool.called", {
        stageId: event.stageId,
        toolName: event.toolName,
        input: redactContent(event.args, {
          force: true,
          redactionReason: "tool-input-redacted-by-default",
        }),
      })
    }

    if (event.type === "tool-result") {
      return emit("tool.result", {
        stageId: event.stageId,
        toolName: event.toolName,
        status: "success",
        output: redactContent(event.result),
      })
    }

    if (event.type === "step-complete") {
      return emit("llm.step.completed", {
        stageId: event.stageId,
        modelUsed: event.modelUsed,
        usage: {
          promptTokens: event.usage?.promptTokens ?? 0,
          completionTokens: event.usage?.completionTokens ?? 0,
        },
        response:
          event.response === undefined
            ? undefined
            : toPlainContent(event.response),
      })
    }

    return emit("llm.step.failed", {
      stageId: event.stageId,
      error: event.error,
      providerFailure: toCanonicalProviderFailure(event),
    })
  }
}

export function mapAiSdkEventsToWorkflowStream(
  runId: string,
  events: AiSdkEvent[]
): ExecutionEvent[] {
  const mapEvent = createAiSdkEventMapper(runId)
  return events.map(mapEvent)
}
