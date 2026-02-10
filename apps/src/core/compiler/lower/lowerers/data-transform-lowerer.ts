import type { TransformExecNode } from "../../../ir/types";
import type { Lowerer } from "../types";

export const dataTransformLowerer: Lowerer = {
	nodeType: "dataTransform",
	lower(node) {
		const transformationType =
			typeof node.config.transformationType === "string"
				? node.config.transformationType
				: "jmespath";
		const expression =
			typeof node.config.expression === "string" ? node.config.expression : "";
		const execNode: TransformExecNode = {
			id: node.id,
			op: "TRANSFORM",
			transformation:
				transformationType === "jsonpath" || transformationType === "javascript"
					? transformationType
					: "jmespath",
			expression,
			inputs: {
				source: `$vars.${node.id}.input`,
			},
			outputs: { result: `$vars.${node.id}.result` },
		};

		return { nodes: [execNode], edges: [], requiredTemplates: [] };
	},
};
