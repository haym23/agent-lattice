import type { LlmProvider } from "../llm/types";
import { createDefaultPromptRegistry } from "../prompts/registry";
import { EscalationEngine } from "./escalation-engine";
import { PromptCompiler } from "./prompt-compiler";
import { RepairEngine } from "./repair-engine";
import { Runner } from "./runner";
import { ToolExecutor } from "./tool-executor";
import { Validator } from "./validator";

export * from "./escalation-engine";
export * from "./repair-engine";
export * from "./runner";
export * from "./state-store";
export * from "./tool-executor";
export * from "./types";
export * from "./validator";

/**
 * Creates runner.
 */
export function createRunner(provider: LlmProvider): Runner {
	const promptRegistry = createDefaultPromptRegistry();
	return new Runner({
		provider,
		promptCompiler: new PromptCompiler(promptRegistry),
		validator: new Validator(),
		repairEngine: new RepairEngine(),
		escalationEngine: new EscalationEngine(),
		toolExecutor: new ToolExecutor(),
	});
}
