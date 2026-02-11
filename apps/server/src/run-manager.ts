import { lowerToExecIR } from "@lattice/compiler"
import type { ExecProgram } from "@lattice/ir"
import type { LlmProvider } from "@lattice/llm"
import type {
  ExecutionEvent,
  LlmStepCompletedPayload,
  LlmStepFailedPayload,
  LlmStepStartedPayload,
  RunFailedPayload,
  RunWaitingPayload,
} from "@lattice/runtime"
import { createRunner, serializeStreamEvent } from "@lattice/runtime"
import {
  type AiSdkEvent,
  createAiSdkEventMapper,
} from "./ai-sdk-event-mapper.js"
import {
  createRunEventStoreFromEnv,
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
  retentionMs?: number
  pruneIntervalMs?: number
}

interface WorkflowRunRequest {
  workflow: Record<string, unknown>
  input?: Record<string, unknown>
}

interface RunCheckpoint {
  queue: string[]
  completedNodeIds: string[]
  skippedNodeIds: string[]
  state: {
    $vars: Record<string, unknown>
    $tmp: Record<string, unknown>
    $ctx: Record<string, unknown>
    $in: Record<string, unknown>
  }
}

interface RunRecord {
  runId: string
  status: RunStatus
  lastPersistedSeq: number
  listeners: Set<(event: ExecutionEvent) => void>
  processing: Promise<void>
  program?: ExecProgram
  runner?: ReturnType<typeof createRunner>
  checkpoint?: RunCheckpoint
}

export class RunManager {
  private readonly runs = new Map<string, RunRecord>()
  private readonly providerFactory: LlmProviderFactory
  private readonly eventStore: RunEventStore
  private readonly retentionMs: number
  private readonly pruneIntervalMs: number
  private pruneTimer: NodeJS.Timeout | null = null

  constructor(options: RunManagerOptions = {}) {
    this.providerFactory = options.providerFactory ?? createProviderFromEnv
    this.eventStore = options.eventStore ?? createRunEventStoreFromEnv()
    this.retentionMs =
      options.retentionMs ??
      Number.parseInt(
        process.env.LATTICE_EVENT_RETENTION_MS ??
          String(14 * 24 * 60 * 60 * 1000),
        10
      )
    this.pruneIntervalMs =
      options.pruneIntervalMs ??
      Number.parseInt(
        process.env.LATTICE_EVENT_PRUNE_INTERVAL_MS ?? String(5 * 60 * 1000),
        10
      )

    if (Number.isFinite(this.pruneIntervalMs) && this.pruneIntervalMs > 0) {
      this.pruneTimer = setInterval(() => {
        void this.pruneEvents()
      }, this.pruneIntervalMs)
      this.pruneTimer.unref()
    }
  }

  async pruneEvents(): Promise<void> {
    if (!Number.isFinite(this.retentionMs) || this.retentionMs <= 0) {
      return
    }

    const cutoffTimestamp = new Date(
      Date.now() - this.retentionMs
    ).toISOString()
    const prunedCount = await this.eventStore.pruneStaleRuns(cutoffTimestamp)
    if (prunedCount === 0) {
      return
    }

    for (const [runId, run] of this.runs.entries()) {
      if (run.status !== "running" && run.status !== "waiting") {
        this.runs.delete(runId)
      }
    }
  }

  stopPruneJob(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer)
      this.pruneTimer = null
    }
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
          await this.eventStore.updateRunStatus(runId, {
            status: "completed",
            endedAt: event.timestamp,
          })
        }
        if (event.type === "run.waiting") {
          run.status = "waiting"
          await this.eventStore.updateRunStatus(runId, {
            status: "waiting",
          })
        }
        if (event.type === "run.failed") {
          const payload = event.payload as RunFailedPayload
          run.status = "failed"
          await this.eventStore.updateRunStatus(runId, {
            status: "failed",
            endedAt: event.timestamp,
            error: payload.error,
          })
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
        await this.eventStore.updateRunStatus(runId, {
          status: "failed",
          endedAt: terminalEvent.timestamp,
          error: (terminalEvent.payload as RunFailedPayload).error,
        })
        for (const listener of run.listeners) {
          listener(terminalEvent)
        }
      })
  }

  private normalizeProviderLifecycleEvent(
    event: ExecutionEvent,
    mapAiSdkEvent: (event: AiSdkEvent) => ExecutionEvent
  ): ExecutionEvent {
    if (event.type === "llm.step.started") {
      const payload = event.payload as LlmStepStartedPayload
      const mapped = mapAiSdkEvent({
        type: "step-start",
        stageId: payload.stageId,
        modelClass: payload.modelClass,
        prompt: payload.prompt.value,
      })
      return {
        ...event,
        type: mapped.type,
        payload: mapped.payload,
      }
    }

    if (event.type === "llm.step.completed") {
      const payload = event.payload as LlmStepCompletedPayload
      const mapped = mapAiSdkEvent({
        type: "step-complete",
        stageId: payload.stageId,
        modelUsed: payload.modelUsed,
        usage: {
          promptTokens: payload.usage.promptTokens,
          completionTokens: payload.usage.completionTokens,
        },
      })
      return {
        ...event,
        type: mapped.type,
        payload: mapped.payload,
      }
    }

    if (event.type === "llm.step.failed") {
      const payload = event.payload as LlmStepFailedPayload
      const mapped = mapAiSdkEvent({
        type: "step-fail",
        stageId: payload.stageId,
        error: payload.error,
        code: payload.providerFailure.code,
        statusCode: payload.providerFailure.statusCode,
        provider: payload.providerFailure.provider,
      })
      return {
        ...event,
        type: mapped.type,
        payload: mapped.payload,
      }
    }

    return event
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
    const mapAiSdkEvent = createAiSdkEventMapper(runId)
    await this.eventStore.createRun(runId)

    const run: RunRecord = {
      runId,
      status: "running",
      lastPersistedSeq: 0,
      listeners: new Set(),
      processing: Promise.resolve(),
      program,
      runner,
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
            const normalizedEvent = this.normalizeProviderLifecycleEvent(
              event,
              mapAiSdkEvent
            )
            this.enqueueRunEvent(runId, normalizedEvent)
          },
        }
      )
      .then(async (result) => {
        const current = this.runs.get(runId)
        if (!current) {
          return
        }
        current.checkpoint = result.checkpoint
      })
      .catch(async () => {
        const current = this.runs.get(runId)
        if (current) {
          current.status = "failed"
          await this.eventStore.updateRunStatus(runId, {
            status: "failed",
            endedAt: new Date().toISOString(),
            error: "Runner execution failed",
          })
        }
      })

    return runId
  }

  async resumeRun(
    runId: string,
    input: Record<string, unknown> = {}
  ): Promise<{
    runId: string
    status: RunStatus
    waiting?: RunWaitingPayload
  }> {
    const run = await this.getOrSyncRun(runId)
    if (!run) {
      throw new Error("run not found")
    }
    if (
      run.status !== "waiting" ||
      !run.checkpoint ||
      !run.program ||
      !run.runner
    ) {
      throw new Error("run is not waiting for user input")
    }

    const mapAiSdkEvent = createAiSdkEventMapper(runId)
    run.status = "running"
    await this.eventStore.updateRunStatus(runId, {
      status: "running",
    })

    void run.runner
      .execute(
        run.program,
        input,
        {},
        {
          runId,
          initialSeq: run.lastPersistedSeq,
          checkpoint: run.checkpoint,
          onEvent: (event) => {
            const normalizedEvent = this.normalizeProviderLifecycleEvent(
              event,
              mapAiSdkEvent
            )
            this.enqueueRunEvent(runId, normalizedEvent)
          },
        }
      )
      .then((result) => {
        const current = this.runs.get(runId)
        if (!current) {
          return
        }
        current.checkpoint = result.checkpoint
      })
      .catch(async () => {
        const current = this.runs.get(runId)
        if (current) {
          current.status = "failed"
          await this.eventStore.updateRunStatus(runId, {
            status: "failed",
            endedAt: new Date().toISOString(),
            error: "Runner resume failed",
          })
        }
      })

    return { runId, status: "running" }
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
