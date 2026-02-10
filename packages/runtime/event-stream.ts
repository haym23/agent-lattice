import type {
  ExecutionEvent,
  RedactedContent,
  WorkflowStreamEventEnvelope,
  WorkflowStreamEventType,
  WorkflowStreamPayloadMap,
} from "./types"

const SENSITIVE_KEY_PATTERN =
  /(token|password|secret|api[_-]?key|authorization)/i

function now(): string {
  return new Date().toISOString()
}

function summarizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  if (Array.isArray(value)) {
    return { kind: "array", length: value.length }
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    return {
      kind: "object",
      keys: entries.slice(0, 8).map(([key]) => key),
      keyCount: entries.length,
    }
  }
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value
  }
  return value
}

export function redactContent(
  value: unknown,
  options: {
    redactionLevel?: RedactedContent["redactionLevel"]
    redactionReason?: string
    force?: boolean
  } = {}
): RedactedContent {
  const force = options.force ?? false
  const redactionLevel = options.redactionLevel ?? "partial"
  const redactionReason = options.redactionReason ?? "sensitive-by-default"
  if (force) {
    return {
      value: "[REDACTED]",
      redactionLevel: "full",
      isRedacted: true,
      redactionReason,
    }
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>
    const redacted: Record<string, unknown> = {}
    let hasRedaction = false
    for (const [key, entry] of Object.entries(objectValue)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        redacted[key] = "[REDACTED]"
        hasRedaction = true
      } else {
        redacted[key] = summarizeValue(entry)
      }
    }
    return {
      value: redacted,
      redactionLevel: hasRedaction ? redactionLevel : "none",
      isRedacted: hasRedaction,
      redactionReason: hasRedaction ? redactionReason : undefined,
    }
  }

  return {
    value: summarizeValue(value),
    redactionLevel: "none",
    isRedacted: false,
  }
}

function assertEventEnvelope(event: ExecutionEvent): void {
  if (!event.runId) {
    throw new Error("Stream event missing runId")
  }
  if (!Number.isInteger(event.seq) || event.seq <= 0) {
    throw new Error("Stream event seq must be a positive integer")
  }
  if (!event.timestamp) {
    throw new Error("Stream event missing timestamp")
  }
}

export function serializeStreamEvent(event: ExecutionEvent): string {
  assertEventEnvelope(event)
  return JSON.stringify(event)
}

export function createEventFactory(
  runId: string,
  onEvent?: (event: ExecutionEvent) => void
): {
  emit: <TType extends WorkflowStreamEventType>(
    type: TType,
    payload: WorkflowStreamPayloadMap[TType]
  ) => WorkflowStreamEventEnvelope<TType>
} {
  let seq = 0

  return {
    emit<TType extends WorkflowStreamEventType>(
      type: TType,
      payload: WorkflowStreamPayloadMap[TType]
    ): WorkflowStreamEventEnvelope<TType> {
      seq += 1
      const event: WorkflowStreamEventEnvelope<TType> = {
        eventVersion: "1.0",
        runId,
        seq,
        timestamp: now(),
        type,
        payload,
      }
      assertEventEnvelope(event)
      if (onEvent) {
        queueMicrotask(() => {
          onEvent(event)
        })
      }
      return event
    },
  }
}
