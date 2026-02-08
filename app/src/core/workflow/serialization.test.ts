import { describe, expect, it } from "vitest";

import {
	deserializeWorkflowToCanvas,
	serializeWorkflowFromCanvas,
	validateWorkflowDocument,
} from "./serialization";

describe("workflow serialization", () => {
	it("round-trips nodes and edges", () => {
		const workflow = serializeWorkflowFromCanvas({
			name: "roundtrip",
			nodes: [
				{
					id: "n1",
					type: "subAgent",
					position: { x: 10, y: 10 },
					data: { label: "Step 1" },
				},
			],
			edges: [],
		});

		const canvas = deserializeWorkflowToCanvas(workflow);
		expect(canvas.nodes).toHaveLength(1);
		expect(canvas.nodes[0].id).toBe("n1");
	});

	it("preserves edge connections through round-trip", () => {
		const workflow = serializeWorkflowFromCanvas({
			name: "edge-test",
			nodes: [
				{
					id: "a",
					type: "start",
					position: { x: 0, y: 0 },
					data: { label: "A" },
				},
				{
					id: "b",
					type: "subAgent",
					position: { x: 100, y: 0 },
					data: { label: "B" },
				},
			],
			edges: [{ id: "e1", source: "a", target: "b" }],
		});

		const canvas = deserializeWorkflowToCanvas(workflow);
		expect(canvas.edges).toHaveLength(1);
		expect(canvas.edges[0].source).toBe("a");
		expect(canvas.edges[0].target).toBe("b");
	});

	it("generates an id when none is provided", () => {
		const workflow = serializeWorkflowFromCanvas({
			name: "no-id",
			nodes: [],
			edges: [],
		});
		expect(workflow.id).toMatch(/^workflow_/);
	});

	it("preserves existing id", () => {
		const workflow = serializeWorkflowFromCanvas({
			id: "custom-id",
			name: "with-id",
			nodes: [],
			edges: [],
		});
		expect(workflow.id).toBe("custom-id");
	});

	it("throws on workflow name exceeding 100 chars", () => {
		expect(() =>
			serializeWorkflowFromCanvas({
				name: "a".repeat(101),
				nodes: [],
				edges: [],
			}),
		).toThrow("Workflow name is invalid");
	});

	it("throws on edge referencing missing node", () => {
		expect(() =>
			validateWorkflowDocument({
				id: "wf",
				name: "bad-edges",
				version: "1.0.0",
				createdAt: "",
				updatedAt: "",
				nodes: [
					{
						id: "a",
						type: "subAgent",
						label: "A",
						position: { x: 0, y: 0 },
						config: {},
					},
				],
				edges: [{ id: "e1", source: "a", target: "missing" }],
			}),
		).toThrow("Edge e1 references missing node");
	});

	it("throws on more than 200 nodes", () => {
		const nodes = Array.from({ length: 201 }, (_, i) => ({
			id: `n${i}`,
			type: "subAgent" as const,
			label: `N${i}`,
			position: { x: 0, y: 0 },
			config: {},
		}));
		expect(() =>
			validateWorkflowDocument({
				id: "wf",
				name: "too-many",
				version: "1.0.0",
				createdAt: "",
				updatedAt: "",
				nodes,
				edges: [],
			}),
		).toThrow("Workflow node limit exceeded");
	});

	it("falls back to subAgent when canvas node type is unknown", () => {
		const workflow = serializeWorkflowFromCanvas({
			name: "fallback-type",
			nodes: [
				{
					id: "x1",
					type: "legacy-node-type",
					position: { x: 0, y: 0 },
					data: { label: "Legacy" },
				},
			],
			edges: [],
		});

		expect(workflow.nodes[0].type).toBe("subAgent");
	});

	it("throws when workflow document has unsupported node type", () => {
		expect(() =>
			validateWorkflowDocument({
				id: "wf",
				name: "bad-node-type",
				version: "1.0.0",
				createdAt: "",
				updatedAt: "",
				nodes: [
					{
						id: "bad",
						type: "not-a-node" as unknown as "subAgent",
						label: "Bad Node",
						position: { x: 0, y: 0 },
						config: {},
					},
				],
				edges: [],
			}),
		).toThrow("Unsupported node type: not-a-node");
	});
});
