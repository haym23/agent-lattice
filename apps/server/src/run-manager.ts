import { lowerToExecIR } from "@lattice/compiler"
import type { LlmProvider } from "@lattice/llm"
import type { ExecutionEvent } from "@lattice/runtime"
import { createRunner, serializeStreamEvent } from "@lattice/runtime"
import {
  InMemoryRunEventStore,
  type RunEventStore,
  type RunStatus,
} from "./event-store.js"
import {
  createProviderFromEnv,
  type LlmProviderFactory,
} from "./provider-factory.js"

interface RunManagerOptions {
  providerFactory?: LlmProviderFactory
  eventStore?: RunEventStore
}

interface WorkflowRunRequest {
  workflow: Record<string, unknown>
  input?: Record<string, unknown>
}

interface RunRecord {
  runId: string
  status: RunStatus
  lastPersistedSeq: number
  listeners: Set<(event: ExecutionEvent) => void>
  processing: Promise<void>
}

export class RunManager {
  private readonly runs = new Map<string, RunRecord>()
  private readonly providerFactory: LlmProviderFactory
  private readonly eventStore: RunEventStore

  constructor(options: RunManagerOptions = {}) {
    this.providerFactory = options.providerFactory ?? createProviderFromEnv
    this.eventStore = options.eventStore ?? new InMemoryRunEventStore()
  }

  private createRunnerWithProvider(): ReturnType<typeof createRunner> {
    const provider: LlmProvider = this.providerFactory()
    return createRunner(provider)
  }

  private enqueueRunEvent(runId: string, event: ExecutionEvent): void {
    const run = this.runs.get(runId)
    if (!run) {
      return
    }

    run.processing = run.processing
      .then(async () => {
        if (event.seq <= run.lastPersistedSeq) {
          return
        }

        if (event.seq !== run.lastPersistedSeq + 1) {
          throw new Error(
            `Non-monotonic event sequence for run ${runId}: expected ${run.lastPersistedSeq + 1}, got ${event.seq}`
          )
        }

        await this.eventStore.appendEvent(event)
        run.lastPersistedSeq = event.seq

        if (event.type === "run.completed") {
          run.status = "completed"
          await this.eventStore.updateRunStatus(runId, "completed")
        }
        if (event.type === "run.failed") {
          run.status = "failed"
          await this.eventStore.updateRunStatus(runId, "failed")
        }

        for (const listener of run.listeners) {
          listener(event)
        }
      })
      .catch(async (error) => {
        run.status = "failed"
        const terminalEvent: ExecutionEvent = {
          eventVersion: "1.0",
          runId,
          seq: run.lastPersistedSeq + 1,
          timestamp: new Date().toISOString(),
          type: "run.failed",
          payload: {
            status: "failed",
            error: (error as Error).message,
          },
        }
        await this.eventStore.appendEvent(terminalEvent)
        run.lastPersistedSeq = terminalEvent.seq
        await this.eventStore.updateRunStatus(runId, "failed")
        for (const listener of run.listeners) {
          listener(terminalEvent)
        }
      })
  }

  private async getOrSyncRun(runId: string): Promise<RunRecord | undefined> {
    const inMemory = this.runs.get(runId)
    if (inMemory) {
      return inMemory
    }

    const persisted = await this.eventStore.getRun(runId)
    if (!persisted) {
      return undefined
    }

    const restored: RunRecord = {
      runId,
      status: persisted.status,
      lastPersistedSeq: persisted.lastSeq,
      listeners: new Set(),
      processing: Promise.resolve(),
    }
    this.runs.set(runId, restored)
    return restored
  }

  async startRun(request: WorkflowRunRequest): Promise<string> {
    const runner = this.createRunnerWithProvider()
    const program = lowerToExecIR(request.workflow)
    const runId = crypto.randomUUID()
    await this.eventStore.createRun(runId)

    const run: RunRecord = {
      runId,
      status: "running",
      lastPersistedSeq: 0,
      listeners: new Set(),
      processing: Promise.resolve(),
    }
    this.runs.set(runId, run)

    void runner
      .execute(
        program,
        request.input ?? {},
        {},
        {
          runId,
          onEvent: (event) => {
            this.enqueueRunEvent(runId, event)
          },
        }
      )
      .catch(async () => {
        const current = this.runs.get(runId)
        if (current) {
          current.status = "failed"
          await this.eventStore.updateRunStatus(runId, "failed")
        }
      })

    return runId
  }

  async getRun(runId: string): Promise<RunRecord | undefined> {
    return this.getOrSyncRun(runId)
  }

  async subscribe(
    runId: string,
    lastSeq: number,
    listener: (event: ExecutionEvent) => void
  ): Promise<(() => void) | null> {
    const run = await this.getOrSyncRun(runId)
    if (!run) {
      return null
    }

    await run.processing

    const replayEvents = await this.eventStore.listEvents(runId, lastSeq)
    let highestSeq = lastSeq
    for (const event of replayEvents) {
      if (event.seq > highestSeq) {
        listener(event)
        highestSeq = event.seq
      }
    }

    if (run.status !== "running") {
      return () => {}
    }

    const orderedListener = (event: ExecutionEvent) => {
      if (event.seq <= highestSeq) {
        return
      }
      if (event.seq !== highestSeq + 1) {
        return
      }
      highestSeq = event.seq
      listener(event)
    }

    run.listeners.add(orderedListener)
    return () => {
      run.listeners.delete(orderedListener)
    }
  }
}

export function toSseFrame(event: ExecutionEvent): string {
  return `id: ${event.seq}\nevent: ${event.type}\ndata: ${serializeStreamEvent(event)}\n\n`
}
