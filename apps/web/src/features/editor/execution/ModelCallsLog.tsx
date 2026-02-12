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

  const formatValue = (value: unknown): string => {
    if (typeof value === "string") {
      return value
    }
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

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
              <div>
                Model:{" "}
                {"modelUsed" in event.payload ? event.payload.modelUsed : ""}
              </div>
            ) : null}
            {event.type === "llm.step.completed" &&
            "response" in event.payload &&
            event.payload.response ? (
              <div>
                <div>Response:</div>
                <pre
                  style={{
                    margin: "4px 0 0",
                    padding: "6px 8px",
                    background: "#f8fafc",
                    borderRadius: 6,
                    whiteSpace: "pre-wrap",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {event.payload.response.isRedacted
                    ? "[REDACTED]"
                    : formatValue(event.payload.response.value)}
                </pre>
              </div>
            ) : null}
            {event.type === "tool.called" ? (
              <div>
                Tool:{" "}
                {"toolName" in event.payload ? event.payload.toolName : ""}
              </div>
            ) : null}
            {event.type === "trace.breadcrumb" ? (
              <div>
                {"summary" in event.payload ? event.payload.summary : ""}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
