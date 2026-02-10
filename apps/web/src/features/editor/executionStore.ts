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
  currentNodeId: string | null
  nodeStatuses: Record<string, NodeExecutionStatus>
  stateSnapshot: StateSnapshot | null
  events: ExecutionEvent[]
  modelCalls: Array<{ model: string; prompt: string; response: string }>
  startExecution: (workflowName: string) => Promise<void>
  abort: () => void
}

let unsubscribe: (() => void) | null = null

export const useExecutionStore = create<ExecutionState>((set) => ({
  executionStatus: "idle",
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
      events: [],
      modelCalls: [],
      currentNodeId: null,
      nodeStatuses: {},
    })

    unsubscribe = adapter.subscribeToExecution((event) => {
      set((state) => {
        const nodeStatuses = { ...state.nodeStatuses }
        if (event.type === "stage.started") {
          nodeStatuses[event.payload.stageId] = "running"
        }
        if (event.type === "stage.completed") {
          nodeStatuses[event.payload.stageId] = "completed"
        }
        if (event.type === "stage.failed") {
          nodeStatuses[event.payload.stageId] = "failed"
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
        }
      })
    })

    try {
      const result = await adapter.executeWorkflow(workflow)
      set((state) => ({
        ...state,
        executionStatus: result.status,
        stateSnapshot: result.finalState,
        events:
          state.events.length > 0
            ? state.events
            : [...result.events].sort((left, right) => left.seq - right.seq),
      }))
    } catch {
      set((state) => ({ ...state, executionStatus: "failed" }))
    }
  },
  abort() {
    set({ executionStatus: "cancelled" })
  },
}))
