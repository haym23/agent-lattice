import type { ExecutionEvent } from "@lattice/runtime"
import { describe, expect, it, vi } from "vitest"

import { WebPlatformAdapter } from "./web-adapter"

class FakeEventSource {
  private readonly listeners = new Map<
    string,
    Array<(event: MessageEvent<string>) => void>
  >()
  onerror: ((event: Event) => void) | null = null

  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void
  ): void {
    const current = this.listeners.get(type) ?? []
    current.push(listener)
    this.listeners.set(type, current)
  }

  emit(type: string, event: ExecutionEvent): void {
    const handlers = this.listeners.get(type) ?? []
    const payload = {
      data: JSON.stringify(event),
    } as MessageEvent<string>
    for (const handler of handlers) {
      handler(payload)
    }
  }

  close(): void {}
}

function makeWorkflow() {
  return {
    id: "wf-1",
    name: "execute-test",
    version: "1.0.0" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "start",
        type: "start" as const,
        label: "Start",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: "end",
        type: "end" as const,
        label: "End",
        position: { x: 120, y: 0 },
        config: {},
      },
    ],
    edges: [{ id: "e1", source: "start", target: "end" }],
  }
}

describe("WebPlatformAdapter executeWorkflow", () => {
  it("starts runs on server and resolves from streamed SSE terminal state", async () => {
    const workflow = makeWorkflow()
    const fakeEventSource = new FakeEventSource()
    const fetchImpl = vi.fn(async () => {
      return {
        ok: true,
        async json() {
          return { runId: "run-test" }
        },
      } as Response
    })
    const adapter = new WebPlatformAdapter({
      serverBaseUrl: "http://localhost:8787",
      fetchImpl,
      eventSourceFactory: () => fakeEventSource,
    })
    const events: string[] = []
    const unsub = adapter.subscribeToExecution((event) =>
      events.push(event.type)
    )

    const executionPromise = adapter.executeWorkflow(workflow)
    await Promise.resolve()
    await Promise.resolve()

    fakeEventSource.emit("run.started", {
      eventVersion: "1.0",
      runId: "run-test",
      seq: 1,
      timestamp: new Date().toISOString(),
      type: "run.started",
      payload: {
        status: "running",
        input: {
          value: "[REDACTED]",
          redactionLevel: "full",
          isRedacted: true,
          redactionReason: "input-redacted-by-default",
        },
      },
    })
    fakeEventSource.emit("stage.completed", {
      eventVersion: "1.0",
      runId: "run-test",
      seq: 2,
      timestamp: new Date().toISOString(),
      type: "stage.completed",
      payload: {
        stageId: "start",
        stageType: "START",
      },
    })
    fakeEventSource.emit("run.completed", {
      eventVersion: "1.0",
      runId: "run-test",
      seq: 3,
      timestamp: new Date().toISOString(),
      type: "run.completed",
      payload: {
        status: "completed",
      },
    })

    const result = await executionPromise
    unsub()

    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8787/runs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ workflow, input: {} }),
    })
    expect(result.status).toBe("completed")
    expect(result.runId).toBe("run-test")
    expect(events).toContain("run.completed")
  })

  it("surfaces server start errors when POST /runs fails", async () => {
    const adapter = new WebPlatformAdapter({
      serverBaseUrl: "http://localhost:8787",
      fetchImpl: vi.fn(async () => {
        return {
          ok: false,
          async json() {
            return { error: "workflow is required" }
          },
        } as Response
      }),
      eventSourceFactory: () => new FakeEventSource(),
    })

    await expect(adapter.executeWorkflow(makeWorkflow())).rejects.toThrow(
      "workflow is required"
    )
  })

  it("includes runtime prompt preview when compiling workflow with llm nodes", async () => {
    const adapter = new WebPlatformAdapter()
    const workflow = {
      id: "wf-2",
      name: "compile-test",
      version: "1.0.0" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: "start",
          type: "start" as const,
          label: "Start",
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "agent-1",
          type: "subAgent" as const,
          label: "Sub-Agent",
          position: { x: 120, y: -40 },
          config: { description: "Summarize", prompt: "Summarize the input" },
        },
        {
          id: "agent-2",
          type: "subAgent" as const,
          label: "Sub-Agent",
          position: { x: 120, y: 40 },
          config: { description: "Classify", prompt: "Classify the input" },
        },
        {
          id: "end",
          type: "end" as const,
          label: "End",
          position: { x: 240, y: 0 },
          config: {},
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "agent-1" },
        { id: "e2", source: "start", target: "agent-2" },
        { id: "e3", source: "agent-1", target: "end" },
        { id: "e4", source: "agent-2", target: "end" },
      ],
    }

    const result = await adapter.compileWorkflow(
      workflow,
      "claude-sonnet",
      "claude"
    )
    const runtimePreview = result.files.find(
      (file) => file.path === ".debug/runtime-prompts.md"
    )

    expect(runtimePreview).toBeTruthy()
    expect(runtimePreview?.content).toContain("Runtime Prompt Preview")
    expect(runtimePreview?.content).toContain("Summarize the input")
    expect(runtimePreview?.content).toContain("Classify the input")
  })
})
