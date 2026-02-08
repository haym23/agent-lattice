import { create } from "zustand";

import type {
	ExecutionEvent,
	ExecutionStatus,
	NodeExecutionStatus,
	StateSnapshot,
} from "../../core/runtime/types";
import { serializeWorkflowFromCanvas } from "../../core/workflow/serialization";
import { getPlatformAdapter } from "./standaloneWorkflowService";
import { useWorkflowStore } from "./workflowStore";

interface ExecutionState {
	executionStatus: ExecutionStatus;
	currentNodeId: string | null;
	nodeStatuses: Record<string, NodeExecutionStatus>;
	stateSnapshot: StateSnapshot | null;
	events: ExecutionEvent[];
	modelCalls: Array<{ model: string; prompt: string; response: string }>;
	startExecution: (workflowName: string) => Promise<void>;
	abort: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useExecutionStore = create<ExecutionState>((set) => ({
	executionStatus: "idle",
	currentNodeId: null,
	nodeStatuses: {},
	stateSnapshot: null,
	events: [],
	modelCalls: [],
	async startExecution(workflowName: string) {
		const adapter = getPlatformAdapter();
		const canvas = useWorkflowStore.getState();
		const workflow = serializeWorkflowFromCanvas({
			name: workflowName,
			nodes: canvas.nodes,
			edges: canvas.edges,
		});

		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}

		set({ executionStatus: "running", events: [], modelCalls: [] });

		unsubscribe = adapter.subscribeToExecution((event) => {
			set((state) => {
				const nodeStatuses = { ...state.nodeStatuses };
				if (event.type === "node-started") {
					nodeStatuses[event.nodeId] = "running";
				}
				if (event.type === "node-completed") {
					nodeStatuses[event.nodeId] = "completed";
				}
				if (event.type === "node-failed") {
					nodeStatuses[event.nodeId] = "failed";
				}
				return {
					...state,
					currentNodeId: "nodeId" in event ? event.nodeId : state.currentNodeId,
					events: [...state.events, event],
					nodeStatuses,
					executionStatus:
						event.type === "execution-completed"
							? "completed"
							: event.type === "execution-failed"
								? "failed"
								: state.executionStatus,
				};
			});
		});

		try {
			const result = await adapter.executeWorkflow(workflow);
			set((state) => ({
				...state,
				executionStatus: result.status,
				stateSnapshot: result.finalState,
				events: result.events,
			}));
		} catch {
			set((state) => ({ ...state, executionStatus: "failed" }));
		}
	},
	abort() {
		set({ executionStatus: "cancelled" });
	},
}));
