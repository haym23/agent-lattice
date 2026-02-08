import type { VarGetExecNode, VarSetExecNode } from "../../../ir/types";
import type { Lowerer } from "../types";

export const variableStoreLowerer: Lowerer = {
	nodeType: "variableStore",
	lower(node) {
		const operation =
			typeof node.config.operation === "string" ? node.config.operation : "set";
		const key =
			typeof node.config.key === "string" && node.config.key
				? node.config.key
				: `${node.id}.value`;
		const target = `$vars.${key}` as const;

		if (operation === "get") {
			const execNode: VarGetExecNode = {
				id: node.id,
				op: "VAR_GET",
				source: target,
				outputs: { result: `$vars.${node.id}.result` },
			};
			return { nodes: [execNode], edges: [], requiredTemplates: [] };
		}

		const value = node.config.value;
		const execNode: VarSetExecNode = {
			id: node.id,
			op: "VAR_SET",
			target,
			value:
				typeof value === "string" && value.startsWith("$")
					? (value as `$${string}`)
					: JSON.stringify(value),
			outputs: { result: `$vars.${node.id}.result` },
		};
		return { nodes: [execNode], edges: [], requiredTemplates: [] };
	},
};
