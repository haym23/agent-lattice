import type { LlmWriteExecNode } from "@lattice/ir";
import type { Lowerer } from "../types";

export const promptLowerer: Lowerer = {
	nodeType: "prompt",
	lower(node) {
		const promptText =
			typeof node.config.prompt === "string" ? node.config.prompt : "";
		const execNode: LlmWriteExecNode = {
			id: node.id,
			op: "LLM_WRITE",
			model_class: "SMALL_EXEC",
			prompt_template: "llm-write-v1",
			inputs: {
				instruction: promptText,
			},
			output_schema: { type: "object" },
			outputs: { result: `$vars.${node.id}.result` },
			validators: [{ type: "json_schema", schema: { type: "object" } }],
			retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 3 },
		};
		return {
			nodes: [execNode],
			edges: [],
			requiredTemplates: ["llm-write-v1"],
		};
	},
};
