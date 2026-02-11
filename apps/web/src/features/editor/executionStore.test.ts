import type { CompileOutput } from "@lattice/compiler"
import type { ExecutionEvent, ExecutionResult } from "@lattice/runtime"
import { afterEach, describe, expect, it } from "vitest"
import type { ModelDefinition } from "../../core/models/types"
import type { WorkflowDocument } from "../../core/workflow/types"
import type {
  ExecutionListener,
  McpToolSchema,
  PlatformAdapter,
} from "../../services/platform-adapter"
import { WebPlatformAdapter } from "../../services/web-adapter"
import { useExecutionStore } from "./executionStore"
import { setPlatformAdapter } from "./workflowService"

const DEFAULT_STATE = {
  executionStatus: "idle" as const,
  executionError: null,
  currentNodeId: null,
  nodeStatuses: {},
  stateSnapshot: null,
  events: [],
  modelCalls: [],
}

class SseTestAdapter implements PlatformAdapter {
  private readonly listeners = new Set<ExecutionListener>()

  async saveWorkflow(_id: string, _data: WorkflowDocument): Promise<void> {
    throw new Error("not implemented")
  }

  async loadWorkflow(_id: string): Promise<WorkflowDocument | null> {
    throw new Error("not implemented")
  }

  async listWorkflows(): Promise<WorkflowDocument[]> {
    throw new Error("not implemented")
  }

  async deleteWorkflow(_id: string): Promise<void> {
    throw new Error("not implemented")
  }

  async compileWorkflow(
    _workflow: WorkflowDocument,
    _modelId: string,
    _target: string
  ): Promise<CompileOutput> {
    throw new Error("not implemented")
  }

  async generateWorkflow(
    _prompt: string,
    _model: string
  ): Promise<WorkflowDocument> {
    throw new Error("not implemented")
  }

  async refineWorkflow(
    _workflow: WorkflowDocument,
    _instruction: string
  ): Promise<WorkflowDocument> {
    throw new Error("not implemented")
  }

  async executeWorkflow(
    _workflow: WorkflowDocument,
    _input?: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const events: ExecutionEvent[] = [
      {
        eventVersion: "1.0",
        runId: "run-sse-test",
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
      },
      {
        eventVersion: "1.0",
        runId: "run-sse-test",
        seq: 2,
        timestamp: new Date().toISOString(),
        type: "stage.started",
        payload: {
          stageId: "start",
          stageType: "START",
        },
      },
      {
        eventVersion: "1.0",
        runId: "run-sse-test",
        seq: 3,
        timestamp: new Date().toISOString(),
        type: "stage.completed",
        payload: {
          stageId: "start",
          stageType: "START",
        },
      },
      {
        eventVersion: "1.0",
        runId: "run-sse-test",
        seq: 4,
        timestamp: new Date().toISOString(),
        type: "run.completed",
        payload: {
          status: "completed",
        },
      },
    ]

    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event)
      }
    }

    return {
      status: "completed",
      runId: "run-sse-test",
      finalState: {
        $vars: { completion: true },
        $tmp: {},
        $ctx: {},
        $in: {},
      },
      events,
    }
  }

  subscribeToExecution(listener: ExecutionListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  listModels(): ModelDefinition[] {
    return []
  }

  async discoverMcpTools(): Promise<McpToolSchema[]> {
    return []
  }
}

class FailingAdapter extends SseTestAdapter {
  override async executeWorkflow(): Promise<ExecutionResult> {
    throw new Error("Workflow contains unreachable nodes: end")
  }
}

describe("executionStore", () => {
  afterEach(() => {
    useExecutionStore.setState(DEFAULT_STATE)
    setPlatformAdapter(new WebPlatformAdapter())
  })

  it("tracks run and stage status from streamed server events", async () => {
    setPlatformAdapter(new SseTestAdapter())

    await useExecutionStore.getState().startExecution("sse-workflow")

    const state = useExecutionStore.getState()
    expect(state.executionStatus).toBe("completed")
    expect(state.currentNodeId).toBe("start")
    expect(state.nodeStatuses.start).toBe("completed")
    expect(state.events.map((event) => event.seq)).toEqual([1, 2, 3, 4])
    expect(state.stateSnapshot?.$vars).toEqual({ completion: true })
    expect(state.executionError).toBeNull()

    useExecutionStore.getState().clearExecution()
    const cleared = useExecutionStore.getState()
    expect(cleared.executionStatus).toBe("idle")
    expect(cleared.executionError).toBeNull()
    expect(cleared.currentNodeId).toBeNull()
    expect(cleared.events).toEqual([])
    expect(cleared.stateSnapshot).toBeNull()
  })

  it("surfaces backend error message when execution start fails", async () => {
    setPlatformAdapter(new FailingAdapter())

    await useExecutionStore.getState().startExecution("broken-workflow")

    const state = useExecutionStore.getState()
    expect(state.executionStatus).toBe("failed")
    expect(state.executionError).toBe(
      "Workflow contains unreachable nodes: end"
    )
  })
})
