interface ModelCallsLogProps {
	calls: Array<{ model: string; prompt: string; response: string }>;
}

/**
 * Executes model calls log.
 */
export function ModelCallsLog({ calls }: ModelCallsLogProps): JSX.Element {
	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>Model Calls</h4>
			<div style={{ maxHeight: 140, overflow: "auto", fontSize: 12 }}>
				{calls.length === 0 ? (
					<p style={{ margin: 0, color: "#64748b" }}>No calls yet.</p>
				) : null}
				{calls.map((call, index) => (
					<div
						key={`${call.model}-${index}`}
						style={{ borderBottom: "1px solid #e2e8f0", padding: "4px 0" }}
					>
						<div>
							<strong>{call.model}</strong>
						</div>
						<div>Prompt: {call.prompt.slice(0, 80)}</div>
						<div>Response: {call.response.slice(0, 80)}</div>
					</div>
				))}
			</div>
		</section>
	);
}
