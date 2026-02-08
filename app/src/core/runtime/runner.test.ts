import { describe, expect, it, vi } from "vitest";

import type { ExecProgram } from "../ir/types";
import { MockLlmProvider } from "../llm/mock-provider";
import { createDefaultPromptRegistry } from "../prompts/registry";
import { EscalationEngine } from "./escalation-engine";
import { PromptCompiler } from "./prompt-compiler";
import { RepairEngine } from "./repair-engine";
import { Runner } from "./runner";
import { ToolExecutor } from "./tool-executor";
import { Validator } from "./validator";

function makeRunner(provider = new MockLlmProvider()): Runner {
	return new Runner({
		provider,
		promptCompiler: new PromptCompiler(createDefaultPromptRegistry()),
		validator: new Validator(),
		repairEngine: new RepairEngine(),
		escalationEngine: new EscalationEngine(),
		toolExecutor: new ToolExecutor(),
	});
}

describe("Runner", () => {
	it("executes linear workflow", async () => {
		const provider = new MockLlmProvider(() => ({
			content: '{"answer":"ok"}',
			parsed: { answer: "ok" },
			usage: { promptTokens: 1, completionTokens: 1 },
			modelUsed: "SMALL_EXEC",
		}));
		const runner = makeRunner(provider);
		const program: ExecProgram = {
			execir_version: "1.0",
			entry_node: "start",
			nodes: [
				{ id: "start", op: "START" },
				{
					id: "llm",
					op: "LLM_WRITE",
					model_class: "SMALL_EXEC",
					prompt_template: "llm-write-v1",
					output_schema: { type: "object" },
					validators: [{ type: "json_schema", schema: { type: "object" } }],
					outputs: { result: "$vars.llm.result" },
				},
				{ id: "end", op: "END" },
			],
			edges: [
				{ from: "start", to: "llm", when: { op: "always" } },
				{ from: "llm", to: "end", when: { op: "always" } },
			],
		};
		const result = await runner.execute(program, { user_message: "hi" });
		expect(result.status).toBe("completed");
		expect(result.finalState.$vars).toHaveProperty("llm");
	});

	it("takes correct switch branch", async () => {
		const runner = makeRunner();
		const program: ExecProgram = {
			execir_version: "1.0",
			entry_node: "start",
			nodes: [
				{ id: "start", op: "START" },
				{ id: "set", op: "VAR_SET", target: "$vars.flag", value: "yes" },
				{ id: "switch", op: "SWITCH" },
				{ id: "yes", op: "VAR_SET", target: "$vars.branch", value: "yes" },
				{ id: "no", op: "VAR_SET", target: "$vars.branch", value: "no" },
				{ id: "end", op: "END" },
			],
			edges: [
				{ from: "start", to: "set", when: { op: "always" } },
				{ from: "set", to: "switch", when: { op: "always" } },
				{
					from: "switch",
					to: "yes",
					when: { op: "eq", left: "$vars.flag", right: "yes" },
				},
				{
					from: "switch",
					to: "no",
					when: { op: "eq", left: "$vars.flag", right: "no" },
				},
				{ from: "yes", to: "end", when: { op: "always" } },
				{ from: "no", to: "end", when: { op: "always" } },
			],
		};
		const result = await runner.execute(program);
		expect(result.finalState.$vars).toHaveProperty("branch", "yes");
	});

	it("fails when repair is exhausted", async () => {
		const provider = new MockLlmProvider(() => ({
			content: "not-json",
			usage: { promptTokens: 1, completionTokens: 1 },
			modelUsed: "SMALL_EXEC",
		}));
		const runner = makeRunner(provider);
		const program: ExecProgram = {
			execir_version: "1.0",
			entry_node: "start",
			nodes: [
				{ id: "start", op: "START" },
				{
					id: "llm",
					op: "LLM_WRITE",
					model_class: "SMALL_EXEC",
					prompt_template: "llm-write-v1",
					output_schema: { type: "object" },
					validators: [
						{
							type: "json_schema",
							schema: { type: "object", required: ["id"] },
						},
					],
					retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 1 },
					outputs: { result: "$vars.llm.result" },
				},
			],
			edges: [{ from: "start", to: "llm", when: { op: "always" } }],
		};
		const result = await runner.execute(program);
		expect(result.status).toBe("failed");
	});

	it("executes tool and transform operations", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ text: async () => '{"items":[{"id":1}]}' })),
		);
		const runner = makeRunner();
		const program: ExecProgram = {
			execir_version: "1.0",
			entry_node: "start",
			nodes: [
				{ id: "start", op: "START" },
				{
					id: "http",
					op: "TOOL_CALL",
					tool: "http.request",
					args: { method: "GET", url: "https://example.com" },
					outputs: { result: "$vars.http.result" },
				},
				{
					id: "transform",
					op: "TRANSFORM",
					transformation: "jmespath",
					expression: "items[*].id",
					inputs: { source: "$vars.http.result" },
					outputs: { result: "$vars.ids" },
				},
				{ id: "end", op: "END" },
			],
			edges: [
				{ from: "start", to: "http", when: { op: "always" } },
				{ from: "http", to: "transform", when: { op: "always" } },
				{ from: "transform", to: "end", when: { op: "always" } },
			],
		};
		const result = await runner.execute(program);
		expect(result.status).toBe("completed");
		expect(result.finalState.$vars).toHaveProperty("ids");
	});
});
