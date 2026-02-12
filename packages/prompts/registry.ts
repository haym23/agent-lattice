import { askUserQuestionTemplate } from "./templates/ask-user-question"
import { conditionalTemplate } from "./templates/conditional"
import { disruptiveTemplate } from "./templates/disruptive"
import { exceptionTemplate } from "./templates/exception"
import { loopTemplate } from "./templates/loop"
import { nondeterministicTemplate } from "./templates/nondeterministic"
import { promptTemplate } from "./templates/prompt"
import { recursionTemplate } from "./templates/recursion"
import { repairV1Template } from "./templates/repair-v1"
import { sequentialTemplate } from "./templates/sequential"
import { subAgentTemplate } from "./templates/sub-agent"
import { switchTemplate } from "./templates/switch"
import { PromptTemplateRegistry } from "./types"

/**
 * Creates default prompt registry.
 */
export function createDefaultPromptRegistry(): PromptTemplateRegistry {
  const registry = new PromptTemplateRegistry()
  registry.register(sequentialTemplate)
  registry.register(conditionalTemplate)
  registry.register(switchTemplate)
  registry.register(loopTemplate)
  registry.register(recursionTemplate)
  registry.register(nondeterministicTemplate)
  registry.register(disruptiveTemplate)
  registry.register(exceptionTemplate)
  registry.register(promptTemplate)
  registry.register(subAgentTemplate)
  registry.register(askUserQuestionTemplate)
  registry.register(repairV1Template)
  return registry
}
