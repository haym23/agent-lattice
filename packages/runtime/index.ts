import type { LlmProvider } from "@lattice/llm"
import { createDefaultPromptRegistry } from "@lattice/prompts"
import { EscalationEngine } from "./escalation-engine"
import { PromptCompiler } from "./prompt-compiler"
import { RepairEngine } from "./repair-engine"
import { Runner } from "./runner"
import { ToolExecutor } from "./tool-executor"
import { Validator } from "./validator"

export * from "./escalation-engine"
export * from "./event-stream"
export * from "./prompt-compiler"
export * from "./repair-engine"
export * from "./runner"
export * from "./state-store"
export * from "./tool-executor"
export * from "./types"
export * from "./validator"

/**
 * Creates runner.
 * TODO: Re-enable when prompt registry is moved to a shared package
 */
export function createRunner(provider: LlmProvider): Runner {
  return new Runner({
    provider,
    promptCompiler: new PromptCompiler(createDefaultPromptRegistry()),
    validator: new Validator(),
    repairEngine: new RepairEngine(),
    escalationEngine: new EscalationEngine(),
    toolExecutor: new ToolExecutor(),
  })
}
