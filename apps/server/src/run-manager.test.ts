import type { ExecutionEvent } from "@lattice/runtime"
import { describe, expect, it } from "vitest"
import { InMemoryRunEventStore } from "./event-store"
import { RunManager } from "./run-manager"

function makeLinearPromptWorkflow(promptNodes = 8): Record<string, unknown> {
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

  let previous = "start"
  for (let index = 0; index < promptNodes; index += 1) {
    const nodeId = `prompt-${index + 1}`
    nodes.push({
      id: nodeId,
      type: "prompt",
      label: nodeId,
      position: { x: index * 100, y: 0 },
      config: { prompt: `Prompt ${index + 1}` },
    })
    edges.push({
      id: `edge-${index + 1}`,
      source: previous,
      target: nodeId,
    })
    previous = nodeId
  }

  nodes.push({
    id: "end",
    type: "end",
    label: "End",
    position: { x: promptNodes * 100 + 100, y: 0 },
    config: {},
  })
  edges.push({
    id: `edge-${promptNodes + 1}`,
    source: previous,
    target: "end",
  })

  return {
    id: "wf-run-manager",
    name: "run-manager",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  }
}

class ProbeStore extends InMemoryRunEventStore {
  async hasEvent(runId: string, seq: number): Promise<boolean> {
    const events = await this.listEvents(runId, seq - 1)
    return events.some((event) => event.seq === seq)
  }
}

function createRunManagerWithMockProvider(eventStore = new ProbeStore()) {
  return {
    eventStore,
    runManager: new RunManager({
      eventStore,
      providerFactory: () => ({
        async chat(request) {
          return {
            content: JSON.stringify({ ok: true }),
            parsed: { ok: true },
            usage: { promptTokens: 0, completionTokens: 0 },
            modelUsed: request.modelClass,
          }
        },
      }),
    }),
  }
}

function collectRunEvents(
  runManager: RunManager,
  runId: string,
  lastSeq = 0
): Promise<ExecutionEvent[]> {
  return new Promise((resolve, reject) => {
    const events: ExecutionEvent[] = []
    let unsubscribeFn: (() => void) | null = null

    void runManager
      .subscribe(runId, lastSeq, (event) => {
        events.push(event)
        if (event.type === "run.completed" || event.type === "run.failed") {
          unsubscribeFn?.()
          resolve(events)
        }
      })
      .then((unsubscribe) => {
        if (unsubscribe === null) {
          reject(new Error(`Run not found: ${runId}`))
          return
        }
        unsubscribeFn = unsubscribe
      })
      .catch(reject)
  })
}

describe("RunManager", () => {
  it("persists events before delivering them to subscribers", async () => {
    const { runManager, eventStore } = createRunManagerWithMockProvider()
    const runId = await runManager.startRun({
      workflow: makeLinearPromptWorkflow(4),
    })

    const persistedChecks: Array<Promise<boolean>> = []
    const seen = await new Promise<ExecutionEvent[]>((resolve, reject) => {
      const events: ExecutionEvent[] = []
      let unsubscribeFn: (() => void) | null = null

      void runManager
        .subscribe(runId, 0, (event) => {
          events.push(event)
          persistedChecks.push(eventStore.hasEvent(runId, event.seq))
          if (event.type === "run.completed" || event.type === "run.failed") {
            unsubscribeFn?.()
            resolve(events)
          }
        })
        .then((unsubscribe) => {
          if (unsubscribe === null) {
            reject(new Error("subscribe returned null"))
            return
          }
          unsubscribeFn = unsubscribe
        })
        .catch(reject)
    })

    expect(seen.length).toBeGreaterThan(0)
    expect(await Promise.all(persistedChecks)).toEqual(
      persistedChecks.map(() => true)
    )
  })

  it("replays deterministically by runId and seq", async () => {
    const { runManager } = createRunManagerWithMockProvider()
    const runId = await runManager.startRun({
      workflow: makeLinearPromptWorkflow(12),
    })
    const allEvents = await collectRunEvents(runManager, runId)
    const anchorSeq = allEvents[Math.floor(allEvents.length / 2)]?.seq ?? 0

    const replayed = await collectRunEvents(runManager, runId, anchorSeq)
    const expected = allEvents.filter((event) => event.seq > anchorSeq)

    expect(replayed.map((event) => event.seq)).toEqual(
      expected.map((event) => event.seq)
    )
    expect(replayed[0]?.seq).toBe(anchorSeq + 1)
  })

  it("enforces monotonic ordering when streaming burst events", async () => {
    const { runManager } = createRunManagerWithMockProvider()
    const runId = await runManager.startRun({
      workflow: makeLinearPromptWorkflow(40),
    })
    const events = await collectRunEvents(runManager, runId)
    const seqs = events.map((event) => event.seq)

    expect(seqs.length).toBeGreaterThan(60)
    expect(
      seqs.every((seq, index) => {
        return seq === index + 1
      })
    ).toBe(true)
  })
})
