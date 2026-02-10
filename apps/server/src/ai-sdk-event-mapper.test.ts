import { describe, expect, it } from "vitest"
import { mapAiSdkEventsToWorkflowStream } from "./ai-sdk-event-mapper"

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
      { type: "step-complete", stageId: "node-1", modelUsed: "gpt-4o-mini" },
    ])

    expect(events.map((event) => event.type)).toEqual([
      "llm.step.started",
      "tool.called",
      "tool.result",
      "llm.step.completed",
    ])
    expect(events.every((event) => event.runId === runId)).toBe(true)
    expect(events.every((event) => Number.isInteger(event.seq))).toBe(true)
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
})
