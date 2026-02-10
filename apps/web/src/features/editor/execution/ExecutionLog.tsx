import type { ExecutionEvent } from "@lattice/runtime"

interface ExecutionLogProps {
  events: ExecutionEvent[]
}

/**
 * Executes execution log.
 */
export function ExecutionLog({ events }: ExecutionLogProps): JSX.Element {
  return (
    <section>
      <h4 style={{ margin: "0 0 8px" }}>Execution Log</h4>
      <div style={{ maxHeight: 180, overflow: "auto", fontSize: 12 }}>
        {events.map((event) => (
          <div key={`${event.runId}-${event.seq}`}>
            <strong>{event.type}</strong> <span>#{event.seq}</span>{" "}
            {event.type.startsWith("stage.") ? (
              <span>{event.payload.stageId}</span>
            ) : null}
            {event.type === "tool.called" || event.type === "tool.result" ? (
              <span>({event.payload.toolName})</span>
            ) : null}
            {event.type === "stage.failed" ||
            event.type === "tool.failed" ||
            event.type === "llm.step.failed" ||
            event.type === "run.failed" ? (
              <span style={{ color: "#b91c1c" }}> - {event.payload.error}</span>
            ) : null}
            {"details" in event.payload && event.payload.details.isRedacted ? (
              <span style={{ color: "#92400e" }}> [redacted]</span>
            ) : null}
            {"input" in event.payload && event.payload.input.isRedacted ? (
              <span style={{ color: "#92400e" }}> [redacted]</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
