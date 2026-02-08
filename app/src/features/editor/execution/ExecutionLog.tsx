import type { ExecutionEvent } from "../../../core/runtime/types";

interface ExecutionLogProps {
	events: ExecutionEvent[];
}

/**
 * Executes execution log.
 */
export function ExecutionLog({ events }: ExecutionLogProps): JSX.Element {
	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>Execution Log</h4>
			<div style={{ maxHeight: 180, overflow: "auto", fontSize: 12 }}>
				{events.map((event, index) => (
					<div key={`${event.type}-${index}`}>
						<strong>{event.type}</strong>{" "}
						{"nodeId" in event ? <span>{event.nodeId}</span> : null}
						{"error" in event ? (
							<span style={{ color: "#b91c1c" }}> - {event.error}</span>
						) : null}
					</div>
				))}
			</div>
		</section>
	);
}
