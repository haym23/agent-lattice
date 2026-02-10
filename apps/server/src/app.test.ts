import { describe, expect, it } from "vitest"
import { createServerApp } from "./app"

function makeWorkflow(): Record<string, unknown> {
  return {
    id: "wf-server-test",
    name: "server-test",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "start",
        type: "start",
        label: "Start",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: "end",
        type: "end",
        label: "End",
        position: { x: 100, y: 0 },
        config: {},
      },
    ],
    edges: [{ id: "e1", source: "start", target: "end" }],
  }
}

function parseSsePayload(
  payload: string
): Array<{ id: number; event: string; data: string }> {
  return payload
    .trim()
    .split("\n\n")
    .map((chunk) => {
      const lines = chunk.split("\n")
      const idLine = lines.find((line) => line.startsWith("id:"))
      const eventLine = lines.find((line) => line.startsWith("event:"))
      const dataLine = lines.find((line) => line.startsWith("data:"))
      return {
        id: Number.parseInt(idLine?.replace("id:", "").trim() ?? "0", 10),
        event: eventLine?.replace("event:", "").trim() ?? "",
        data: dataLine?.replace("data:", "").trim() ?? "",
      }
    })
}

describe("server SSE routes", () => {
  it("returns 404 for unknown run stream", async () => {
    const app = createServerApp()
    const response = await app.inject({
      method: "GET",
      url: "/runs/missing/events",
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it("starts runs and streams SSE events", async () => {
    const app = createServerApp()
    const startResponse = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { workflow: makeWorkflow(), input: { user_message: "hello" } },
    })

    expect(startResponse.statusCode).toBe(200)
    const parsed = startResponse.json<{ runId: string }>()
    expect(parsed.runId).toBeTruthy()

    const eventsResponse = await app.inject({
      method: "GET",
      url: `/runs/${parsed.runId}/events`,
    })
    expect(eventsResponse.statusCode).toBe(200)
    const events = parseSsePayload(eventsResponse.payload)
    expect(events.some((event) => event.event === "run.started")).toBe(true)
    expect(
      events.some((event) => {
        return event.event === "run.completed" || event.event === "run.failed"
      })
    ).toBe(true)

    await app.close()
  })

  it("replays buffered events based on lastSeq", async () => {
    const app = createServerApp()
    const startResponse = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { workflow: makeWorkflow() },
    })

    const parsed = startResponse.json<{ runId: string }>()
    const firstResponse = await app.inject({
      method: "GET",
      url: `/runs/${parsed.runId}/events`,
    })
    const firstEvents = parseSsePayload(firstResponse.payload)
    const thirdEventSeq = firstEvents[2]?.id ?? 0

    const replayResponse = await app.inject({
      method: "GET",
      url: `/runs/${parsed.runId}/events?lastSeq=${thirdEventSeq}`,
    })
    const replayEvents = parseSsePayload(replayResponse.payload)

    expect(replayEvents.length).toBeGreaterThan(0)
    expect(replayEvents[0]?.id).toBe(thirdEventSeq + 1)

    await app.close()
  })
})
