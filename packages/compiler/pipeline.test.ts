import { describe, expect, it } from "vitest";

import { ModelRegistry } from "../../apps/web/src/core/models/registry";
import { buildAnalyzedGraph, compileWorkflow } from "./pipeline";

function makeWorkflow(overrides: Record<string, unknown> = {}) {
	return {
		id: "wf",
		name: "compile-test",
		version: "1.0.0" as const,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		nodes: [
			{
				id: "n1",
				type: "subAgent" as const,
				label: "LLM",
				position: { x: 0, y: 0 },
				config: {},
			},
		],
		edges: [],
		...overrides,
	};
}

describe("compiler pipeline", () => {
	it("emits claude output", () => {
		const model = new ModelRegistry().get("claude-sonnet");
		const output = compileWorkflow({
			target: "claude",
			model,
			workflow: makeWorkflow(),
		});
		expect(output.files[0].path).toContain(".claude/commands");
		expect(output.preview).toBeTruthy();
		expect(output.warnings).toBeInstanceOf(Array);
	});

	it("emits snapshots for all phase-1 targets", () => {
		const model = new ModelRegistry().get("gpt-4o");
		const workflow = makeWorkflow({
			name: "snapshot-test",
			createdAt: new Date("2026-01-01").toISOString(),
			updatedAt: new Date("2026-01-01").toISOString(),
		});

		const claude = compileWorkflow({ target: "claude", model, workflow });
		const openai = compileWorkflow({
			target: "openai-assistants",
			model,
			workflow,
		});
		const portable = compileWorkflow({
			target: "portable-json",
			model,
			workflow,
		});

		expect(claude).toMatchSnapshot("claude-target");
		expect(openai).toMatchSnapshot("openai-assistants-target");
		expect(portable).toMatchSnapshot("portable-json-target");
	});

	it("throws on empty workflow", () => {
		const model = new ModelRegistry().get("claude-sonnet");
		expect(() =>
			compileWorkflow({
				target: "claude",
				model,
				workflow: makeWorkflow({ nodes: [] }),
			}),
		).toThrow("at least one node");
	});

	it("throws on unknown target", () => {
		const model = new ModelRegistry().get("claude-sonnet");
		expect(() =>
			compileWorkflow({
				target: "nonexistent" as never,
				model,
				workflow: makeWorkflow(),
			}),
		).toThrow("No emitter registered");
	});

	it("includes warnings for model/target mismatch", () => {
		const gpt = new ModelRegistry().get("gpt-4o");
		const output = compileWorkflow({
			target: "claude",
			model: gpt,
			workflow: makeWorkflow(),
		});
		expect(output.warnings.some((w) => w.includes("function-calling"))).toBe(
			true,
		);
	});

	it("includes graph warnings for unreachable nodes", () => {
		const model = new ModelRegistry().get("claude-sonnet");
		const workflow = makeWorkflow({
			nodes: [
				{
					id: "s",
					type: "start" as const,
					label: "Start",
					position: { x: 0, y: 0 },
					config: {},
				},
				{
					id: "n1",
					type: "subAgent" as const,
					label: "LLM",
					position: { x: 100, y: 0 },
					config: {},
				},
				{
					id: "orphan",
					type: "subAgent" as const,
					label: "Orphan",
					position: { x: 200, y: 100 },
					config: {},
				},
			],
			edges: [{ id: "e1", source: "s", target: "n1" }],
		});
		const output = compileWorkflow({ target: "claude", model, workflow });
		expect(output.warnings.some((w) => w.includes("orphan"))).toBe(true);
	});
});

describe("buildAnalyzedGraph", () => {
	it("returns analyzed graph with execution order", () => {
		const model = new ModelRegistry().get("claude-sonnet");
		const graph = buildAnalyzedGraph({
			target: "claude",
			model,
			workflow: makeWorkflow(),
		});
		expect(graph.executionOrder).toHaveLength(1);
		expect(graph.cycles).toEqual([]);
	});
});
