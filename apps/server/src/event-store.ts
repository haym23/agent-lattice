import type { ExecutionEvent } from "@lattice/runtime"

export type RunStatus = "running" | "completed" | "failed"

export interface StoredRun {
  runId: string
  status: RunStatus
  createdAt: string
  updatedAt: string
  lastSeq: number
}

export interface RunEventStore {
  createRun(runId: string): Promise<void>
  getRun(runId: string): Promise<StoredRun | undefined>
  updateRunStatus(runId: string, status: RunStatus): Promise<void>
  appendEvent(event: ExecutionEvent): Promise<void>
  listEvents(runId: string, afterSeq: number): Promise<ExecutionEvent[]>
}

function nowIso(): string {
  return new Date().toISOString()
}

export class InMemoryRunEventStore implements RunEventStore {
  private readonly runs = new Map<string, StoredRun>()
  private readonly runEvents = new Map<string, ExecutionEvent[]>()

  async createRun(runId: string): Promise<void> {
    const timestamp = nowIso()
    this.runs.set(runId, {
      runId,
      status: "running",
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSeq: 0,
    })
    this.runEvents.set(runId, [])
  }

  async getRun(runId: string): Promise<StoredRun | undefined> {
    return this.runs.get(runId)
  }

  async updateRunStatus(runId: string, status: RunStatus): Promise<void> {
    const current = this.runs.get(runId)
    if (!current) {
      return
    }
    this.runs.set(runId, {
      ...current,
      status,
      updatedAt: nowIso(),
    })
  }

  async appendEvent(event: ExecutionEvent): Promise<void> {
    const run = this.runs.get(event.runId)
    if (!run) {
      throw new Error(`Cannot append event for unknown run: ${event.runId}`)
    }

    const events = this.runEvents.get(event.runId)
    if (!events) {
      throw new Error(
        `Cannot append event for missing run event log: ${event.runId}`
      )
    }

    if (event.seq <= run.lastSeq) {
      return
    }

    events.push(event)
    events.sort((left, right) => left.seq - right.seq)
    this.runs.set(event.runId, {
      ...run,
      lastSeq: event.seq,
      updatedAt: nowIso(),
    })
  }

  async listEvents(runId: string, afterSeq: number): Promise<ExecutionEvent[]> {
    const events = this.runEvents.get(runId) ?? []
    return events.filter((event) => event.seq > afterSeq)
  }
}
