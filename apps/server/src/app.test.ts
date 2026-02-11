import { describe, expect, it } from "vitest"
import { createServerApp } from "./app"
import { RunManager } from "./run-manager"

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

function makeBurstWorkflow(promptNodes = 20): Record<string, unknown> {
  const nodes: Array<Record<string, unknown>> = [
    {
      id: "start",
      type: "start",
      label: "Start",
      position: { x: 0, y: 0 },
      config: {},
    },
  ]
  const edges: Array<Record<string, unknown>> = []

  let previousId = "start"
  for (let index = 0; index < promptNodes; index += 1) {
    const nodeId = `prompt-${index + 1}`
    nodes.push({
      id: nodeId,
      type: "prompt",
      label: `Prompt ${index + 1}`,
      position: { x: (index + 1) * 100, y: 0 },
      config: { prompt: `Emit payload ${index + 1}` },
    })
    edges.push({
      id: `edge-${index + 1}`,
      source: previousId,
      target: nodeId,
    })
    previousId = nodeId
  }

  nodes.push({
    id: "end",
    type: "end",
    label: "End",
    position: { x: (promptNodes + 1) * 100, y: 0 },
    config: {},
  })
  edges.push({
    id: `edge-${promptNodes + 1}`,
    source: previousId,
    target: "end",
  })

  return {
    id: "wf-server-burst",
    name: "server-burst",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  }
}

function createTestApp() {
  const runManager = new RunManager({
    providerFactory: () => ({
      async chat(request) {
        return {
          content: JSON.stringify({ ok: true, modelClass: request.modelClass }),
          parsed: { ok: true, modelClass: request.modelClass },
          usage: { promptTokens: 0, completionTokens: 0 },
          modelUsed: request.modelClass,
        }
      },
    }),
  })
  return createServerApp(runManager)
}

function parseSsePayload(
  payload: string
): Array<{ id: number; event: string; data: string }> {
  if (payload.trim().length === 0) {
    return []
  }

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
    const app = createTestApp()
    const response = await app.inject({
      method: "GET",
      url: "/runs/missing/events",
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it("starts runs and streams SSE events", async () => {
    const app = createTestApp()
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
    const app = createTestApp()
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

  it("reconnects with Last-Event-ID and replays strictly after that seq", async () => {
    const app = createTestApp()
    const startResponse = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { workflow: makeBurstWorkflow(24) },
    })

    const { runId } = startResponse.json<{ runId: string }>()
    const firstStream = await app.inject({
      method: "GET",
      url: `/runs/${runId}/events`,
    })
    const initialEvents = parseSsePayload(firstStream.payload)
    const reconnectFromSeq =
      initialEvents[Math.floor(initialEvents.length / 2)]?.id

    expect(reconnectFromSeq).toBeGreaterThan(0)

    const replayStream = await app.inject({
      method: "GET",
      url: `/runs/${runId}/events`,
      headers: {
        "last-event-id": String(reconnectFromSeq),
      },
    })
    const replayEvents = parseSsePayload(replayStream.payload)

    expect(replayEvents.length).toBeGreaterThan(0)
    expect(replayEvents[0]?.id).toBe((reconnectFromSeq ?? 0) + 1)
    expect(
      replayEvents.every((event, index, all) => {
        if (index === 0) {
          return true
        }
        return event.id === all[index - 1]?.id + 1
      })
    ).toBe(true)

    await app.close()
  })

  it("streams burst workloads with monotonic, gap-free sequence ids", async () => {
    const app = createTestApp()
    const startResponse = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { workflow: makeBurstWorkflow(60) },
    })

    const { runId } = startResponse.json<{ runId: string }>()
    const eventsResponse = await app.inject({
      method: "GET",
      url: `/runs/${runId}/events`,
    })
    const events = parseSsePayload(eventsResponse.payload)
    const ids = events.map((event) => event.id)
    const uniqueIds = new Set(ids)

    expect(events.length).toBeGreaterThan(100)
    expect(uniqueIds.size).toBe(ids.length)
    expect(ids[0]).toBe(1)
    expect(
      ids.every((id, index) => {
        return id === index + 1
      })
    ).toBe(true)
    expect(events.at(-1)?.event).toBe("run.completed")

    await app.close()
  })
})
