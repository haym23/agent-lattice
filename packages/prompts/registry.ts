import { llmClassifyV1Template } from "./templates/llm-classify-v1"
import { llmWriteV1Template } from "./templates/llm-write-v1"
import { nodeAskUserQuestionV1Template } from "./templates/ask-user-question"
import { nodeIfElseV1Template } from "./templates/if-else"
import { nodePromptV1Template } from "./templates/prompt"
import { nodeSubAgentV1Template } from "./templates/sub-agent"
import { nodeSwitchV1Template } from "./templates/switch"
import { repairV1Template } from "./templates/repair-v1"
import { PromptTemplateRegistry } from "./types"

/**
 * Creates default prompt registry.
 */
export function createDefaultPromptRegistry(): PromptTemplateRegistry {
  const registry = new PromptTemplateRegistry()
  registry.register(nodePromptV1Template)
  registry.register(nodeSubAgentV1Template)
  registry.register(nodeIfElseV1Template)
  registry.register(nodeSwitchV1Template)
  registry.register(nodeAskUserQuestionV1Template)
  registry.register(llmWriteV1Template)
  registry.register(llmClassifyV1Template)
  registry.register(repairV1Template)
  return registry
}
