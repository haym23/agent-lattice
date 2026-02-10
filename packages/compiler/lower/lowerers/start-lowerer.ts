import type { StartExecNode } from "@lattice/ir";
import type { Lowerer } from "../types";

export const startLowerer: Lowerer = {
	nodeType: "start",
	lower(node) {
		const execNode: StartExecNode = { id: node.id, op: "START" };
		return { nodes: [execNode], edges: [], requiredTemplates: [] };
	},
};
