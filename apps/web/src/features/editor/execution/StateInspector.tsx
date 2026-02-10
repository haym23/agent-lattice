import type { StateSnapshot } from "@lattice/runtime";

interface StateInspectorProps {
	state: StateSnapshot | null;
}

/**
 * Executes state inspector.
 */
export function StateInspector({ state }: StateInspectorProps): JSX.Element {
	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>State Inspector</h4>
			<pre
				style={{
					margin: 0,
					padding: 8,
					background: "#0f172a",
					color: "#f8fafc",
					borderRadius: 8,
					fontSize: 11,
					maxHeight: 180,
					overflow: "auto",
				}}
			>
				{JSON.stringify(
					state ?? { $vars: {}, $tmp: {}, $ctx: {}, $in: {} },
					null,
					2,
				)}
			</pre>
		</section>
	);
}
