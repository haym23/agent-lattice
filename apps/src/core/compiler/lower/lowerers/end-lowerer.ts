import type { EndExecNode } from "../../../ir/types";
import type { Lowerer } from "../types";

export const endLowerer: Lowerer = {
	nodeType: "end",
	lower(node) {
		const execNode: EndExecNode = { id: node.id, op: "END" };
		return { nodes: [execNode], edges: [], requiredTemplates: [] };
	},
};
