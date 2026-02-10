import type { ExecEdge, ExecNode, ExecProgram } from "@lattice/ir";
import type {
	WorkflowDocument,
	WorkflowEdge,
	WorkflowNode,
} from "../types";
import { analyzeGraph } from "../analyzer";
import {
	dataTransformLowerer,
	endLowerer,
	httpRequestLowerer,
	ifElseLowerer,
	mcpLowerer,
	promptLowerer,
	startLowerer,
	subAgentLowerer,
	switchLowerer,
	variableStoreLowerer,
} from "./lowerers";
import { LowererRegistry } from "./registry";
import type { LoweringContext } from "./types";

/**
 * Creates edge maps.
 */
function createEdgeMaps(edges: WorkflowEdge[]): {
	incomingEdges: Map<string, WorkflowEdge[]>;
	outgoingEdges: Map<string, WorkflowEdge[]>;
} {
	const incomingEdges = new Map<string, WorkflowEdge[]>();
	const outgoingEdges = new Map<string, WorkflowEdge[]>();
	for (const edge of edges) {
		const incoming = incomingEdges.get(edge.target) ?? [];
		incoming.push(edge);
		incomingEdges.set(edge.target, incoming);

		const outgoing = outgoingEdges.get(edge.source) ?? [];
		outgoing.push(edge);
		outgoingEdges.set(edge.source, outgoing);
	}
	return { incomingEdges, outgoingEdges };
}

/**
 * Creates default lowerer registry.
 */
export function createDefaultLowererRegistry(): LowererRegistry {
	const registry = new LowererRegistry();
	registry.register(startLowerer);
	registry.register(endLowerer);
	registry.register(promptLowerer);
	registry.register(subAgentLowerer);
	registry.register(ifElseLowerer);
	registry.register(switchLowerer);
	registry.register(mcpLowerer);
	registry.register(httpRequestLowerer);
	registry.register(variableStoreLowerer);
	registry.register(dataTransformLowerer);
	return registry;
}

/**
 * Validates graph.
 */
function validateGraph(workflow: WorkflowDocument): void {
	const graph = analyzeGraph(workflow.nodes, workflow.edges);
	const starts = workflow.nodes.filter((node: WorkflowNode) => node.type === "start");
	if (starts.length !== 1) {
		throw new Error(
			`Workflow must contain exactly one start node. Found: ${starts.length}`,
		);
	}
	if (graph.cycles.length > 0) {
		throw new Error(
			`Workflow contains cycle(s): ${graph.cycles.map((c) => c.join(" -> ")).join("; ")}`,
		);
	}
	if (graph.unreachable.length > 0) {
		throw new Error(
			`Workflow contains unreachable nodes: ${graph.unreachable.join(", ")}`,
		);
	}
}

/**
 * Lowers to exec ir.
 */
export function lowerToExecIR(workflow: WorkflowDocument): ExecProgram {
	validateGraph(workflow);
	const registry = createDefaultLowererRegistry();
	const analyzed = analyzeGraph(workflow.nodes, workflow.edges);
	const allNodes = new Map<string, WorkflowNode>(
		workflow.nodes.map((n: WorkflowNode) => [n.id, n]),
	);
	const { incomingEdges, outgoingEdges } = createEdgeMaps(workflow.edges);

	const context: LoweringContext = {
		workflow,
		graph: analyzed,
		allNodes,
		incomingEdges,
		outgoingEdges,
	};

	const nodes = [] as ExecProgram["nodes"];
	const edges = [] as ExecEdge[];
	const specialEdgeNodes = new Set(["ifElse", "switch"]);

	for (const node of workflow.nodes) {
		const fragment = registry.lower(node, context);
		nodes.push(...fragment.nodes);
		edges.push(...fragment.edges);

		if (!specialEdgeNodes.has(node.type)) {
			const outgoing = outgoingEdges.get(node.id) ?? [];
			edges.push(
				...outgoing.map((edge) => ({
					from: edge.source,
					to: edge.target,
					when: { op: "always" as const },
				})),
			);
		}
	}

	const entry = workflow.nodes.find((node: WorkflowNode) => node.type === "start");
	if (!entry) {
		throw new Error("Workflow must contain exactly one start node. Found: 0");
	}

	return {
		execir_version: "1.0",
		entry_node: entry.id,
		nodes,
		edges,
	};
}
