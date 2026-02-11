import type {
  ExecutionEvent,
  ExecutionStatus,
  NodeExecutionStatus,
  StateSnapshot,
} from "@lattice/runtime"
import { create } from "zustand"
import { serializeWorkflowFromCanvas } from "../../core/workflow/serialization"
import { getPlatformAdapter } from "./workflowService"
import { useWorkflowStore } from "./workflowStore"

interface ExecutionState {
  executionStatus: ExecutionStatus
  executionError: string | null
  currentNodeId: string | null
  nodeStatuses: Record<string, NodeExecutionStatus>
  stateSnapshot: StateSnapshot | null
  events: ExecutionEvent[]
  modelCalls: Array<{ model: string; prompt: string; response: string }>
  startExecution: (workflowName: string) => Promise<void>
  abort: () => void
  clearExecution: () => void
}

let unsubscribe: (() => void) | null = null

export const useExecutionStore = create<ExecutionState>((set) => ({
  executionStatus: "idle",
  executionError: null,
  currentNodeId: null,
  nodeStatuses: {},
  stateSnapshot: null,
  events: [],
  modelCalls: [],
  async startExecution(workflowName: string) {
    const adapter = getPlatformAdapter()
    const canvas = useWorkflowStore.getState()
    const workflow = serializeWorkflowFromCanvas({
      name: workflowName,
      nodes: canvas.nodes,
      edges: canvas.edges,
    })

    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    set({
      executionStatus: "running",
      executionError: null,
      events: [],
      modelCalls: [],
      currentNodeId: null,
      nodeStatuses: {},
    })

    unsubscribe = adapter.subscribeToExecution((event) => {
      set((state) => {
        const nodeStatuses = { ...state.nodeStatuses }
        if (event.type === "stage.started") {
          if (
            "stageId" in event.payload &&
            typeof event.payload.stageId === "string"
          ) {
            nodeStatuses[event.payload.stageId] = "running"
          }
        }
        if (event.type === "stage.completed") {
          if (
            "stageId" in event.payload &&
            typeof event.payload.stageId === "string"
          ) {
            nodeStatuses[event.payload.stageId] = "completed"
          }
        }
        if (event.type === "stage.failed") {
          if (
            "stageId" in event.payload &&
            typeof event.payload.stageId === "string"
          ) {
            nodeStatuses[event.payload.stageId] = "failed"
          }
        }

        const nextEvents = [...state.events, event].sort((left, right) => {
          return left.seq - right.seq
        })

        return {
          ...state,
          currentNodeId:
            event.type.startsWith("stage.") && "stageId" in event.payload
              ? event.payload.stageId
              : state.currentNodeId,
          events: nextEvents,
          nodeStatuses,
          executionStatus:
            event.type === "run.completed"
              ? "completed"
              : event.type === "run.failed"
                ? "failed"
                : state.executionStatus,
          executionError:
            event.type === "run.failed" && "error" in event.payload
              ? event.payload.error
              : state.executionError,
        }
      })
    })

    try {
      const result = await adapter.executeWorkflow(workflow)
      set((state) => ({
        ...state,
        executionStatus: result.status,
        executionError:
          result.status === "failed" ? (result.error?.message ?? null) : null,
        stateSnapshot: result.finalState,
        events:
          state.events.length > 0
            ? state.events
            : [...result.events].sort((left, right) => left.seq - right.seq),
      }))
    } catch (error) {
      set((state) => ({
        ...state,
        executionStatus: "failed",
        executionError:
          error instanceof Error ? error.message : "Execution failed",
      }))
    }
  },
  abort() {
    set({ executionStatus: "cancelled", executionError: null })
  },
  clearExecution() {
    set({
      executionStatus: "idle",
      executionError: null,
      currentNodeId: null,
      nodeStatuses: {},
      stateSnapshot: null,
      events: [],
      modelCalls: [],
    })
  },
}))
