import type { LlmProvider } from "@lattice/llm";
// TODO: Fix architecture - packages should not depend on apps
// import { createDefaultPromptRegistry } from "../../apps/web/src/core/prompts/registry";
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
export * from "./prompt-compiler";

/**
 * Creates runner.
 * TODO: Re-enable when prompt registry is moved to a shared package
 */
export function createRunner(provider: LlmProvider): Runner {
	// const promptRegistry = createDefaultPromptRegistry();
	return new Runner({
		provider,
		promptCompiler: new PromptCompiler({} as any), // TODO: Fix this
		validator: new Validator(),
		repairEngine: new RepairEngine(),
		escalationEngine: new EscalationEngine(),
		toolExecutor: new ToolExecutor(),
	});
}
