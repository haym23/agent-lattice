import { useExecutionStore } from "../executionStore"
import { ExecutionControls } from "./ExecutionControls"
import { ExecutionLog } from "./ExecutionLog"
import { ModelCallsLog } from "./ModelCallsLog"
import { StateInspector } from "./StateInspector"

interface ExecutionPanelProps {
  workflowName: string
}

/**
 * Executes execution panel.
 */
export function ExecutionPanel({
  workflowName,
}: ExecutionPanelProps): JSX.Element {
  const {
    executionStatus,
    executionError,
    currentNodeId,
    stateSnapshot,
    events,
    startExecution,
    abort,
    clearExecution,
  } = useExecutionStore()
  const canClear =
    executionStatus !== "idle" ||
    executionError !== null ||
    currentNodeId !== null ||
    stateSnapshot !== null ||
    events.length > 0

  return (
    <aside className="card" style={{ minHeight: 520 }}>
      <h3 style={{ marginTop: 0 }}>Execution Debug Panel</h3>
      <ExecutionControls
        status={executionStatus}
        canClear={canClear}
        onRun={() => {
          void startExecution(workflowName)
        }}
        onStop={abort}
        onClear={clearExecution}
      />
      {executionError ? (
        <p style={{ margin: "0 0 10px", color: "#b91c1c", fontSize: 12 }}>
          {executionError}
        </p>
      ) : null}
      <ExecutionLog events={events} />
      <div style={{ height: 12 }} />
      <StateInspector state={stateSnapshot} />
      <div style={{ height: 12 }} />
      <ModelCallsLog events={events} />
    </aside>
  )
}
