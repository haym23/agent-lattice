import { describe, expect, it } from "vitest"
import {
  createEventFactory,
  redactContent,
  serializeStreamEvent,
} from "./event-stream"

describe("event stream helpers", () => {
  it("creates envelope with runId and seq", () => {
    const { emit } = createEventFactory("run-helper")
    const event = emit("run.started", {
      status: "running",
      input: redactContent({ user_message: "hello" }, { force: true }),
    })

    expect(event.runId).toBe("run-helper")
    expect(event.seq).toBe(1)
    expect(() => serializeStreamEvent(event)).not.toThrow()
  })

  it("redacts sensitive keys", () => {
    const redacted = redactContent({ apiKey: "SECRET", plain: "ok" })
    expect(redacted.isRedacted).toBe(true)
    expect(JSON.stringify(redacted.value)).not.toContain("SECRET")
  })
})
