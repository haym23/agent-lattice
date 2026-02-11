import {
  createEventFactory,
  type ExecutionEvent,
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
  | { type: "step-complete"; stageId: string; modelUsed: string }
  | { type: "step-fail"; stageId: string; error: string }

export function mapAiSdkEventsToWorkflowStream(
  runId: string,
  events: AiSdkEvent[]
): ExecutionEvent[] {
  const { emit } = createEventFactory(runId)
  const mapped: ExecutionEvent[] = []

  for (const event of events) {
    if (event.type === "step-start") {
      mapped.push(
        emit("llm.step.started", {
          stageId: event.stageId,
          modelClass: event.modelClass,
          prompt: redactContent(event.prompt, {
            force: true,
            redactionReason: "prompt-redacted-by-default",
          }),
        })
      )
      continue
    }

    if (event.type === "tool-call") {
      mapped.push(
        emit("tool.called", {
          stageId: event.stageId,
          toolName: event.toolName,
          input: redactContent(event.args, {
            force: true,
            redactionReason: "tool-input-redacted-by-default",
          }),
        })
      )
      continue
    }

    if (event.type === "tool-result") {
      mapped.push(
        emit("tool.result", {
          stageId: event.stageId,
          toolName: event.toolName,
          status: "success",
          output: redactContent(event.result),
        })
      )
      continue
    }

    if (event.type === "step-complete") {
      mapped.push(
        emit("llm.step.completed", {
          stageId: event.stageId,
          modelUsed: event.modelUsed,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
          },
        })
      )
      continue
    }

    mapped.push(
      emit("llm.step.failed", {
        stageId: event.stageId,
        error: event.error,
        providerFailure: {
          code: "unknown",
          provider: "unknown",
          retryable: false,
        },
      })
    )
  }

  return mapped
}
