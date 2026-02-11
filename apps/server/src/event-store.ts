import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type { ExecutionEvent } from "@lattice/runtime"

export type RunStatus =
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"

export interface RedactionMetadataSnapshot {
  path: string
  redactionLevel: "none" | "partial" | "full"
  redactionReason?: string
}

export interface StoredRun {
  runId: string
  status: RunStatus
  startedAt: string
  endedAt?: string
  error?: string
  updatedAt: string
  lastSeq: number
}

export interface RunStatusUpdate {
  status: RunStatus
  endedAt?: string
  error?: string
}

export interface RunEventStore {
  createRun(runId: string): Promise<void>
  getRun(runId: string): Promise<StoredRun | undefined>
  updateRunStatus(runId: string, update: RunStatusUpdate): Promise<void>
  appendEvent(event: ExecutionEvent): Promise<void>
  listEvents(runId: string, afterSeq: number): Promise<ExecutionEvent[]>
  pruneStaleRuns(cutoffTimestamp: string): Promise<number>
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
      startedAt: timestamp,
      updatedAt: timestamp,
      lastSeq: 0,
    })
    this.runEvents.set(runId, [])
  }

  async getRun(runId: string): Promise<StoredRun | undefined> {
    return this.runs.get(runId)
  }

  async updateRunStatus(runId: string, update: RunStatusUpdate): Promise<void> {
    const current = this.runs.get(runId)
    if (!current) {
      return
    }
    this.runs.set(runId, {
      ...current,
      status: update.status,
      endedAt: update.endedAt ?? current.endedAt,
      error: update.error,
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

  async pruneStaleRuns(cutoffTimestamp: string): Promise<number> {
    const removable = Array.from(this.runs.values()).filter((run) => {
      return (
        run.status !== "running" &&
        run.status !== "waiting" &&
        run.updatedAt < cutoffTimestamp
      )
    })

    for (const run of removable) {
      this.runs.delete(run.runId)
      this.runEvents.delete(run.runId)
    }

    return removable.length
  }
}

function extractRedactionMetadata(
  value: unknown,
  path = "payload"
): RedactionMetadataSnapshot[] {
  if (!value || typeof value !== "object") {
    return []
  }

  const objectValue = value as Record<string, unknown>
  const redactionLevel = objectValue.redactionLevel
  const isRedacted = objectValue.isRedacted

  const current: RedactionMetadataSnapshot[] =
    typeof redactionLevel === "string" &&
    (redactionLevel === "none" ||
      redactionLevel === "partial" ||
      redactionLevel === "full") &&
    typeof isRedacted === "boolean" &&
    isRedacted
      ? [
          {
            path,
            redactionLevel,
            redactionReason:
              typeof objectValue.redactionReason === "string"
                ? objectValue.redactionReason
                : undefined,
          },
        ]
      : []

  const nested = Object.entries(objectValue).flatMap(([key, nestedValue]) =>
    extractRedactionMetadata(nestedValue, `${path}.${key}`)
  )

  return [...current, ...nested]
}

export interface SqliteRunEventStoreOptions {
  filePath?: string
}

export class SqliteRunEventStore implements RunEventStore {
  private readonly database: DatabaseSync

  constructor(options: SqliteRunEventStoreOptions = {}) {
    const filePath = resolve(
      options.filePath ??
        process.env.LATTICE_EVENT_STORE_SQLITE_PATH ??
        ".lattice/run-events.sqlite"
    )
    mkdirSync(dirname(filePath), { recursive: true })
    this.database = new DatabaseSync(filePath)
    this.database.exec("PRAGMA journal_mode = WAL")
    this.database.exec("PRAGMA foreign_keys = ON")
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        error TEXT,
        last_seq INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `)
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS run_events (
        run_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        redaction_metadata_json TEXT NOT NULL,
        event_version TEXT NOT NULL,
        PRIMARY KEY (run_id, seq),
        FOREIGN KEY (run_id) REFERENCES runs (run_id) ON DELETE CASCADE
      )
    `)
    this.database.exec(
      "CREATE INDEX IF NOT EXISTS idx_run_events_run_id_seq ON run_events (run_id, seq)"
    )
    this.database.exec(
      "CREATE INDEX IF NOT EXISTS idx_run_events_run_id_timestamp ON run_events (run_id, timestamp)"
    )
  }

  private inTransaction(fn: () => void): void {
    this.database.exec("BEGIN")
    try {
      fn()
      this.database.exec("COMMIT")
    } catch (error) {
      this.database.exec("ROLLBACK")
      throw error
    }
  }

  async createRun(runId: string): Promise<void> {
    const now = nowIso()
    this.database
      .prepare(
        `
          INSERT INTO runs (run_id, status, started_at, updated_at, last_seq)
          VALUES (?, 'running', ?, ?, 0)
        `
      )
      .run(runId, now, now)
  }

  async getRun(runId: string): Promise<StoredRun | undefined> {
    const row = this.database
      .prepare(
        `
          SELECT run_id, status, started_at, ended_at, error, last_seq, updated_at
          FROM runs
          WHERE run_id = ?
        `
      )
      .get(runId) as
      | {
          run_id: string
          status: RunStatus
          started_at: string
          ended_at: string | null
          error: string | null
          last_seq: number
          updated_at: string
        }
      | undefined

    if (!row) {
      return undefined
    }

    return {
      runId: row.run_id,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      error: row.error ?? undefined,
      lastSeq: row.last_seq,
      updatedAt: row.updated_at,
    }
  }

  async updateRunStatus(runId: string, update: RunStatusUpdate): Promise<void> {
    this.database
      .prepare(
        `
          UPDATE runs
          SET status = ?,
              ended_at = COALESCE(?, ended_at),
              error = ?,
              updated_at = ?
          WHERE run_id = ?
        `
      )
      .run(
        update.status,
        update.endedAt ?? null,
        update.error ?? null,
        nowIso(),
        runId
      )
  }

  async appendEvent(event: ExecutionEvent): Promise<void> {
    const metadata = extractRedactionMetadata(event.payload)
    this.inTransaction(() => {
      const inserted = this.database
        .prepare(
          `
            INSERT OR IGNORE INTO run_events
              (run_id, seq, timestamp, type, payload_json, redaction_metadata_json, event_version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          event.runId,
          event.seq,
          event.timestamp,
          event.type,
          JSON.stringify(event.payload),
          JSON.stringify(metadata),
          event.eventVersion
        )

      if (Number(inserted.changes ?? 0) === 0) {
        return
      }

      const updatedRun = this.database
        .prepare(
          `
            UPDATE runs
            SET last_seq = CASE WHEN ? > last_seq THEN ? ELSE last_seq END,
                updated_at = ?
            WHERE run_id = ?
          `
        )
        .run(event.seq, event.seq, nowIso(), event.runId)

      if (Number(updatedRun.changes ?? 0) === 0) {
        throw new Error(`Cannot append event for unknown run: ${event.runId}`)
      }
    })
  }

  async listEvents(runId: string, afterSeq: number): Promise<ExecutionEvent[]> {
    const rows = this.database
      .prepare(
        `
          SELECT event_version, run_id, seq, timestamp, type, payload_json
          FROM run_events
          WHERE run_id = ? AND seq > ?
          ORDER BY seq ASC
        `
      )
      .all(runId, afterSeq) as Array<{
      event_version: string
      run_id: string
      seq: number
      timestamp: string
      type: ExecutionEvent["type"]
      payload_json: string
    }>

    return rows.map((row) => ({
      eventVersion: row.event_version as ExecutionEvent["eventVersion"],
      runId: row.run_id,
      seq: row.seq,
      timestamp: row.timestamp,
      type: row.type,
      payload: JSON.parse(row.payload_json) as ExecutionEvent["payload"],
    }))
  }

  async pruneStaleRuns(cutoffTimestamp: string): Promise<number> {
    const staleRows = this.database
      .prepare(
        `
          SELECT run_id
          FROM runs
          WHERE status NOT IN ('running', 'waiting') AND updated_at < ?
        `
      )
      .all(cutoffTimestamp) as Array<{ run_id: string }>

    if (staleRows.length === 0) {
      return 0
    }

    this.inTransaction(() => {
      for (const row of staleRows) {
        this.database
          .prepare("DELETE FROM runs WHERE run_id = ?")
          .run(row.run_id)
      }
    })

    return staleRows.length
  }
}

export type EventStoreBackend = "sqlite" | "memory"

function getBackendFromEnv(): EventStoreBackend {
  const configured = process.env.LATTICE_EVENT_STORE_BACKEND
  const value = (
    configured ?? (process.env.NODE_ENV === "test" ? "memory" : "sqlite")
  ).toLowerCase()
  if (value === "sqlite" || value === "memory") {
    return value
  }
  throw new Error(
    `Unsupported LATTICE_EVENT_STORE_BACKEND: ${value}. Expected 'sqlite' or 'memory'.`
  )
}

export function createRunEventStoreFromEnv(): RunEventStore {
  const backend = getBackendFromEnv()
  if (backend === "memory") {
    return new InMemoryRunEventStore()
  }

  return new SqliteRunEventStore()
}
