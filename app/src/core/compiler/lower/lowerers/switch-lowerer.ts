import type { ExecEdge, SwitchExecNode } from "../../../ir/types";
import type { Lowerer } from "../types";

export const switchLowerer: Lowerer = {
	nodeType: "switch",
	lower(node, context) {
		const evaluationTarget =
			typeof node.config.evaluationTarget === "string" &&
			node.config.evaluationTarget
				? node.config.evaluationTarget
				: `$vars.${node.id}.input`;
		const branches = Array.isArray(node.config.branches)
			? (node.config.branches as Array<{
					value?: string;
					label?: string;
					condition?: string;
				}>)
			: [];
		const outgoing = context.outgoingEdges.get(node.id) ?? [];

		const edges: ExecEdge[] = outgoing.map((edge, index) => {
			const value =
				branches[index]?.value ??
				branches[index]?.condition ??
				branches[index]?.label ??
				`${index}`;
			return {
				from: edge.source,
				to: edge.target,
				when:
					index === outgoing.length - 1
						? { op: "always" }
						: { op: "eq", left: evaluationTarget, right: value },
			};
		});

		const execNode: SwitchExecNode = {
			id: node.id,
			op: "SWITCH",
			inputs: { evaluationTarget },
		};
		return { nodes: [execNode], edges, requiredTemplates: [] };
	},
};
