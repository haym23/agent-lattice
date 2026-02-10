import type { ToolCallExecNode } from "@lattice/ir";
import type { Lowerer } from "../types";

export const mcpLowerer: Lowerer = {
	nodeType: "mcp",
	lower(node) {
		const serverId =
			typeof node.config.serverId === "string" ? node.config.serverId : "";
		const toolName =
			typeof node.config.toolName === "string" ? node.config.toolName : "";
		const execNode: ToolCallExecNode = {
			id: node.id,
			op: "TOOL_CALL",
			tool: `mcp:${serverId}:${toolName}`,
			args: {
				config: JSON.stringify(node.config),
			},
			outputs: { result: `$vars.${node.id}.result` },
		};
		return { nodes: [execNode], edges: [], requiredTemplates: [] };
	},
};
