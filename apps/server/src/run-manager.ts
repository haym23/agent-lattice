import { lowerToExecIR } from "@lattice/compiler"
import type { ExecutionEvent } from "@lattice/runtime"
import { createRunner, serializeStreamEvent } from "@lattice/runtime"

interface LocalLlmProvider {
  chat(request: { modelClass: string }): Promise<{
    content: string
    parsed: Record<string, unknown>
    usage: { promptTokens: number; completionTokens: number }
    modelUsed: string
  }>
}

interface WorkflowRunRequest {
  workflow: Record<string, unknown>
  input?: Record<string, unknown>
}

interface RunRecord {
  runId: string
  status: "running" | "completed" | "failed"
  events: ExecutionEvent[]
  listeners: Set<(event: ExecutionEvent) => void>
}

export class RunManager {
  private readonly runs = new Map<string, RunRecord>()

  constructor(private readonly replayLimit = 200) {}

  private createProvider(): LocalLlmProvider {
    return {
      async chat(request) {
        return {
          content: JSON.stringify({ ok: true }),
          parsed: { ok: true },
          usage: { promptTokens: 0, completionTokens: 0 },
          modelUsed: request.modelClass,
        }
      },
    }
  }

  async startRun(request: WorkflowRunRequest): Promise<string> {
    const provider = this.createProvider()
    const runner = createRunner(provider)
    const program = lowerToExecIR(request.workflow as any)
    const runId = crypto.randomUUID()

    const run: RunRecord = {
      runId,
      status: "running",
      events: [],
      listeners: new Set(),
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
            const current = this.runs.get(runId)
            if (!current) {
              return
            }
            current.events.push(event)
            if (current.events.length > this.replayLimit) {
              current.events.splice(0, current.events.length - this.replayLimit)
            }
            for (const listener of current.listeners) {
              listener(event)
            }
            if (event.type === "run.completed") {
              current.status = "completed"
            }
            if (event.type === "run.failed") {
              current.status = "failed"
            }
          },
        }
      )
      .catch(() => {
        const current = this.runs.get(runId)
        if (current) {
          current.status = "failed"
        }
      })

    return runId
  }

  getRun(runId: string): RunRecord | undefined {
    return this.runs.get(runId)
  }

  subscribe(
    runId: string,
    lastSeq: number,
    listener: (event: ExecutionEvent) => void
  ): (() => void) | null {
    const run = this.runs.get(runId)
    if (!run) {
      return null
    }

    for (const event of run.events) {
      if (event.seq > lastSeq) {
        listener(event)
      }
    }

    if (run.status !== "running") {
      return () => {}
    }

    run.listeners.add(listener)
    return () => {
      run.listeners.delete(listener)
    }
  }
}

export function toSseFrame(event: ExecutionEvent): string {
  return `id: ${event.seq}\nevent: ${event.type}\ndata: ${serializeStreamEvent(event)}\n\n`
}
