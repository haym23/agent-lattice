import type { ExecutionEvent } from "@lattice/runtime"

interface ModelCallsLogProps {
  events: ExecutionEvent[]
}

/**
 * Executes model calls log.
 */
export function ModelCallsLog({ events }: ModelCallsLogProps): JSX.Element {
  const tracked = events.filter((event) => {
    return (
      event.type.startsWith("llm.step.") ||
      event.type.startsWith("tool.") ||
      event.type === "trace.breadcrumb"
    )
  })

  return (
    <section>
      <h4 style={{ margin: "0 0 8px" }}>Model and Tool Timeline</h4>
      <div style={{ maxHeight: 140, overflow: "auto", fontSize: 12 }}>
        {tracked.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b" }}>
            No model or tool events yet.
          </p>
        ) : null}
        {tracked.map((event) => (
          <div
            key={`${event.runId}-${event.seq}`}
            style={{ borderBottom: "1px solid #e2e8f0", padding: "4px 0" }}
          >
            <div>
              <strong>{event.type}</strong>
            </div>
            <div>Seq: {event.seq}</div>
            {event.type === "llm.step.completed" ? (
              <div>Model: {event.payload.modelUsed}</div>
            ) : null}
            {event.type === "tool.called" ? (
              <div>Tool: {event.payload.toolName}</div>
            ) : null}
            {event.type === "trace.breadcrumb" ? (
              <div>{event.payload.summary}</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
