import { describe, expect, it } from "vitest";

import type { WorkflowDocument } from "../../workflow/types";
import { lowerToExecIR } from "./index";

function makeWorkflow() {
	return {
		id: "wf",
		name: "lower-test",
		version: "1.0.0" as const,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		nodes: [
			{
				id: "start",
				type: "start" as const,
				label: "Start",
				position: { x: 0, y: 0 },
				config: {},
			},
			{
				id: "prompt",
				type: "prompt" as const,
				label: "Prompt",
				position: { x: 100, y: 0 },
				config: { prompt: "Say hello" },
			},
			{
				id: "end",
				type: "end" as const,
				label: "End",
				position: { x: 200, y: 0 },
				config: {},
			},
		],
		edges: [
			{ id: "e1", source: "start", target: "prompt" },
			{ id: "e2", source: "prompt", target: "end" },
		],
	};
}

describe("lowerToExecIR", () => {
	it("lowers linear workflow into exec program", () => {
		const output = lowerToExecIR(makeWorkflow());
		expect(output.entry_node).toBe("start");
		expect(output.nodes.map((node) => node.op)).toEqual([
			"START",
			"LLM_WRITE",
			"END",
		]);
		expect(output.edges).toHaveLength(2);
	});

	it("throws for unreachable nodes", () => {
		const workflow = makeWorkflow();
		workflow.nodes.push({
			id: "orphan",
			type: "prompt",
			label: "Orphan",
			position: { x: 10, y: 10 },
			config: { prompt: "Nope" },
		});
		expect(() => lowerToExecIR(workflow)).toThrow("unreachable");
	});

	it("throws for unsupported nodes", () => {
		const workflow: WorkflowDocument = {
			...makeWorkflow(),
			nodes: [
				{
					id: "start",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					config: {},
				},
				{
					id: "skill",
					type: "skill",
					label: "Skill",
					position: { x: 10, y: 10 },
					config: {},
				},
				{
					id: "end",
					type: "end",
					label: "End",
					position: { x: 200, y: 0 },
					config: {},
				},
			],
			edges: [
				{ id: "e1", source: "start", target: "skill" },
				{ id: "e2", source: "skill", target: "end" },
			],
		};
		expect(() => lowerToExecIR(workflow)).toThrow(
			"Unsupported workflow node type",
		);
	});
});
