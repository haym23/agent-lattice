import { useExecutionStore } from "../executionStore";
import { ExecutionControls } from "./ExecutionControls";
import { ExecutionLog } from "./ExecutionLog";
import { ModelCallsLog } from "./ModelCallsLog";
import { StateInspector } from "./StateInspector";

interface ExecutionPanelProps {
	workflowName: string;
}

/**
 * Executes execution panel.
 */
export function ExecutionPanel({
	workflowName,
}: ExecutionPanelProps): JSX.Element {
	const {
		executionStatus,
		stateSnapshot,
		events,
		modelCalls,
		startExecution,
		abort,
	} = useExecutionStore();

	return (
		<aside className="card" style={{ minHeight: 520 }}>
			<h3 style={{ marginTop: 0 }}>Execution Debug Panel</h3>
			<ExecutionControls
				status={executionStatus}
				onRun={() => {
					void startExecution(workflowName);
				}}
				onStop={abort}
			/>
			<ExecutionLog events={events} />
			<div style={{ height: 12 }} />
			<StateInspector state={stateSnapshot} />
			<div style={{ height: 12 }} />
			<ModelCallsLog calls={modelCalls} />
		</aside>
	);
}
