import { describe, expect, it } from "vitest"
import {
  createAiSdkEventMapper,
  mapAiSdkEventsToWorkflowStream,
} from "./ai-sdk-event-mapper"

describe("AI SDK event mapper", () => {
  it("maps step and tool lifecycle to unified event stream", () => {
    const runId = "run-test"
    const events = mapAiSdkEventsToWorkflowStream(runId, [
      {
        type: "step-start",
        stageId: "node-1",
        modelClass: "SMALL_EXEC",
        prompt: "secret prompt",
      },
      {
        type: "tool-call",
        stageId: "node-1",
        toolName: "http.request",
        args: { apiKey: "SECRET", url: "https://example.com" },
      },
      {
        type: "tool-result",
        stageId: "node-1",
        toolName: "http.request",
        result: { ok: true },
      },
      {
        type: "step-complete",
        stageId: "node-1",
        modelUsed: "gpt-4o-mini",
        usage: { promptTokens: 21, completionTokens: 13 },
      },
    ])

    expect(events.map((event) => event.type)).toEqual([
      "llm.step.started",
      "tool.called",
      "tool.result",
      "llm.step.completed",
    ])
    expect(events.every((event) => event.runId === runId)).toBe(true)
    expect(events.every((event) => Number.isInteger(event.seq))).toBe(true)

    const completion = events.find(
      (event) => event.type === "llm.step.completed"
    )
    expect(completion?.type).toBe("llm.step.completed")
    if (completion?.type === "llm.step.completed") {
      expect(completion.payload.usage.promptTokens).toBe(21)
      expect(completion.payload.usage.completionTokens).toBe(13)
    }
  })

  it("redacts tool args by default", () => {
    const [event] = mapAiSdkEventsToWorkflowStream("run-redaction", [
      {
        type: "tool-call",
        stageId: "node-2",
        toolName: "http.request",
        args: { token: "abc", body: { hello: "world" } },
      },
    ])

    expect(event.type).toBe("tool.called")
    if (event.type !== "tool.called") {
      return
    }

    expect(event.payload.input.isRedacted).toBe(true)
    expect(JSON.stringify(event.payload.input.value)).not.toContain("abc")
  })

  it("maps provider failures to canonical event codes", () => {
    const events = mapAiSdkEventsToWorkflowStream("run-failure-map", [
      {
        type: "step-fail",
        stageId: "node-auth",
        error: "Unauthorized",
        statusCode: 401,
        provider: "openai",
      },
      {
        type: "step-fail",
        stageId: "node-rate",
        error: "Rate limited",
        statusCode: 429,
        provider: "openai",
      },
      {
        type: "step-fail",
        stageId: "node-timeout",
        error: "Gateway timeout",
        statusCode: 504,
      },
      {
        type: "step-fail",
        stageId: "node-parse",
        error: "Malformed JSON",
        code: "invalid_response",
      },
    ])

    const failureCodes = events.map((event) => {
      if (event.type !== "llm.step.failed") {
        return ""
      }
      return event.payload.providerFailure.code
    })

    expect(failureCodes).toEqual([
      "auth",
      "rate_limit",
      "timeout",
      "malformed_output",
    ])
  })

  it("maintains event sequence across streaming mapper calls", () => {
    const mapEvent = createAiSdkEventMapper("run-stream")
    const first = mapEvent({
      type: "step-start",
      stageId: "node-1",
      modelClass: "SMALL_EXEC",
      prompt: "p1",
    })
    const second = mapEvent({
      type: "step-complete",
      stageId: "node-1",
      modelUsed: "gpt-4o-mini",
      usage: { promptTokens: 2, completionTokens: 3 },
    })

    expect(first.seq).toBe(1)
    expect(second.seq).toBe(2)
  })
})
