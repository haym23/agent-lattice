interface ExecutionControlsProps {
  status: "idle" | "running" | "completed" | "failed" | "cancelled"
  canClear: boolean
  onRun: () => void
  onStop: () => void
  onClear: () => void
}

/**
 * Executes execution controls.
 */
export function ExecutionControls({
  status,
  canClear,
  onRun,
  onStop,
  onClear,
}: ExecutionControlsProps): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <button type="button" onClick={onRun} disabled={status === "running"}>
        Run
      </button>
      <button type="button" onClick={onClear} disabled={!canClear}>
        Clear
      </button>
      <button type="button" onClick={onStop} disabled={status !== "running"}>
        Stop
      </button>
      <span style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>
        Status: {status}
      </span>
    </div>
  )
}
