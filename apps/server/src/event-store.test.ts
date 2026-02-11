import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ExecutionEvent } from "@lattice/runtime"
import { afterEach, describe, expect, it } from "vitest"
import { SqliteRunEventStore } from "./event-store"
import { RunManager } from "./run-manager"

function makeLinearPromptWorkflow(promptNodes = 6): Record<string, unknown> {
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
    id: "wf-sqlite",
    name: "sqlite",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  }
}

function createMockProviderFactory() {
  return () => ({
    async chat(request: { modelClass: string }) {
      return {
        content: JSON.stringify({ ok: true }),
        parsed: { ok: true },
        usage: { promptTokens: 2, completionTokens: 1 },
        modelUsed: request.modelClass,
      }
    },
  })
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

const tempDirs: string[] = []

function createTempSqliteStore(): SqliteRunEventStore {
  const dir = mkdtempSync(join(tmpdir(), "lattice-event-store-"))
  tempDirs.push(dir)
  return new SqliteRunEventStore({
    filePath: join(dir, "run-events.sqlite"),
  })
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("SqliteRunEventStore", () => {
  it("persists run metadata and supports ordered replay query", async () => {
    const eventStore = createTempSqliteStore()
    const runManager = new RunManager({
      eventStore,
      providerFactory: createMockProviderFactory(),
      pruneIntervalMs: 0,
    })

    const runId = await runManager.startRun({
      workflow: makeLinearPromptWorkflow(4),
    })
    const events = await collectRunEvents(runManager, runId)
    const midpoint = events[Math.floor(events.length / 2)]?.seq ?? 0
    const replay = await eventStore.listEvents(runId, midpoint)
    const run = await eventStore.getRun(runId)

    expect(replay.length).toBeGreaterThan(0)
    expect(replay[0]?.seq).toBe(midpoint + 1)
    expect(
      replay.every((event, index, all) => {
        if (index === 0) {
          return true
        }
        return event.seq === (all[index - 1]?.seq ?? 0) + 1
      })
    ).toBe(true)
    expect(run?.status).toBe("completed")
    expect(run?.startedAt).toBeTruthy()
    expect(run?.endedAt).toBeTruthy()
    expect(run?.lastSeq).toBe(events.at(-1)?.seq)
  })

  it("recovers replay + run lookup after manager restart", async () => {
    const eventStore = createTempSqliteStore()
    const managerA = new RunManager({
      eventStore,
      providerFactory: createMockProviderFactory(),
      pruneIntervalMs: 0,
    })

    const runId = await managerA.startRun({
      workflow: makeLinearPromptWorkflow(8),
    })
    const originalEvents = await collectRunEvents(managerA, runId)
    const anchorSeq =
      originalEvents[Math.floor(originalEvents.length / 2)]?.seq ?? 0

    const managerB = new RunManager({
      eventStore,
      providerFactory: createMockProviderFactory(),
      pruneIntervalMs: 0,
    })

    const replayed = await collectRunEvents(managerB, runId, anchorSeq)
    const expected = originalEvents.filter((event) => event.seq > anchorSeq)

    expect((await managerB.getRun(runId))?.runId).toBe(runId)
    expect(replayed.map((event) => event.seq)).toEqual(
      expected.map((event) => event.seq)
    )
  })

  it("prunes stale terminal runs by retention cutoff", async () => {
    const eventStore = createTempSqliteStore()
    const runManager = new RunManager({
      eventStore,
      providerFactory: createMockProviderFactory(),
      pruneIntervalMs: 0,
    })

    const runId = await runManager.startRun({
      workflow: makeLinearPromptWorkflow(2),
    })
    await collectRunEvents(runManager, runId)

    const cutoff = new Date(Date.now() + 1000).toISOString()
    const removedRuns = await eventStore.pruneStaleRuns(cutoff)

    expect(removedRuns).toBe(1)
    expect(await eventStore.getRun(runId)).toBeUndefined()
    expect(await eventStore.listEvents(runId, 0)).toEqual([])
  })
})
