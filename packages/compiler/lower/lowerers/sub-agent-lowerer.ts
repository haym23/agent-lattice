import type { LlmWriteExecNode } from "@lattice/ir"
import type { Lowerer } from "../types"

export const subAgentLowerer: Lowerer = {
  nodeType: "subAgent",
  lower(node) {
    const description =
      typeof node.config.description === "string" ? node.config.description : ""
    const promptText =
      typeof node.config.prompt === "string" ? node.config.prompt : ""
    const execNode: LlmWriteExecNode = {
      id: node.id,
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "node-sub-agent-v1",
      inputs: {
        instruction: description
          ? `${description}\n\n${promptText}`
          : promptText,
      },
      output_schema: { type: "object" },
      outputs: { result: `$vars.${node.id}.result` },
      validators: [{ type: "json_schema", schema: { type: "object" } }],
      retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 3 },
    }
    return {
      nodes: [execNode],
      edges: [],
      requiredTemplates: ["node-sub-agent-v1"],
    }
  },
}
