import jmespath from "jmespath";

import type {
	ExecEdge,
	ExecNode,
	ExecProgram,
	LlmWriteExecNode,
	ToolCallExecNode,
	TransformExecNode,
	VarGetExecNode,
	VarSetExecNode,
} from "../ir/types";
import type { LlmProvider } from "../llm/types";
import type { EscalationEngine } from "./escalation-engine";
import type { PromptCompiler } from "./prompt-compiler";
import type { RepairEngine } from "./repair-engine";
import { StateStore } from "./state-store";
import { ToolExecutor } from "./tool-executor";
import type { ExecutionEvent, ExecutionResult, ExecutionStatus } from "./types";
import type { Validator } from "./validator";

interface RunnerDependencies {
	provider: LlmProvider;
	promptCompiler: PromptCompiler;
	validator: Validator;
	repairEngine: RepairEngine;
	escalationEngine: EscalationEngine;
	toolExecutor?: ToolExecutor;
}

function now(): string {
	return new Date().toISOString();
}

function isStateRef(value: unknown): value is `$${string}` {
	return typeof value === "string" && value.startsWith("$");
}

/**
 * Executes evaluate when.
 */
function evaluateWhen(edge: ExecEdge, state: StateStore): boolean {
	const when = edge.when;
	if (when.op === "always") {
		return true;
	}
	const left = String(
		isStateRef(when.left) ? (state.get(when.left) ?? "") : when.left,
	);
	const right = String(
		isStateRef(when.right) ? (state.get(when.right) ?? "") : when.right,
	);
	switch (when.op) {
		case "eq":
			return left === right;
		case "neq":
			return left !== right;
		case "contains":
			return left.includes(right);
		case "regex":
			return new RegExp(right).test(left);
		default:
			return false;
	}
}

/**
 * Provides runner behavior.
 */
export class Runner {
	private readonly provider: LlmProvider;
	private readonly promptCompiler: PromptCompiler;
	private readonly validator: Validator;
	private readonly repairEngine: RepairEngine;
	private readonly escalationEngine: EscalationEngine;
	private readonly toolExecutor: ToolExecutor;
	private readonly abortController = new AbortController();

	constructor(deps: RunnerDependencies) {
		this.provider = deps.provider;
		this.promptCompiler = deps.promptCompiler;
		this.validator = deps.validator;
		this.repairEngine = deps.repairEngine;
		this.escalationEngine = deps.escalationEngine;
		this.toolExecutor = deps.toolExecutor ?? new ToolExecutor();
	}

	abort(): void {
		this.abortController.abort();
	}

	async execute(
		program: ExecProgram,
		input: Record<string, unknown> = {},
		context: Record<string, unknown> = {},
	): Promise<ExecutionResult> {
		const state = new StateStore(input, {
			timestamp: now(),
			executionId: crypto.randomUUID(),
			...context,
		});
		const events: ExecutionEvent[] = [];
		const nodeMap = new Map(program.nodes.map((node) => [node.id, node]));
		const outgoing = new Map<string, ExecEdge[]>();
		const incomingCount = new Map<string, number>();
		const completed = new Set<string>();
		const skipped = new Set<string>();

		for (const node of program.nodes) {
			incomingCount.set(node.id, 0);
		}
		for (const edge of program.edges) {
			const edges = outgoing.get(edge.from) ?? [];
			edges.push(edge);
			outgoing.set(edge.from, edges);
			incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
		}

		const queue: string[] = [program.entry_node];
		let status: ExecutionStatus = "running";

		while (queue.length > 0) {
			if (this.abortController.signal.aborted) {
				status = "cancelled";
				break;
			}
			const nodeId = queue.shift();
			if (!nodeId) {
				continue;
			}
			if (completed.has(nodeId) || skipped.has(nodeId)) {
				continue;
			}
			const node = nodeMap.get(nodeId);
			if (!node) {
				throw new Error(`Node not found: ${nodeId}`);
			}

			events.push({ type: "node-started", nodeId, timestamp: now() });
			try {
				await this.executeNode(node, state);
				events.push({ type: "node-completed", nodeId, timestamp: now() });
				completed.add(nodeId);

				if (node.op === "END") {
					status = "completed";
					break;
				}

				const outgoingEdges = outgoing.get(nodeId) ?? [];
				let selectedEdges = outgoingEdges;
				if (node.op === "SWITCH") {
					selectedEdges = outgoingEdges.filter((edge) =>
						evaluateWhen(edge, state),
					);
					if (selectedEdges.length === 0) {
						selectedEdges = outgoingEdges
							.filter((edge) => edge.when.op === "always")
							.slice(0, 1);
					}

					for (const edge of outgoingEdges) {
						if (!selectedEdges.some((selected) => selected.to === edge.to)) {
							skipped.add(edge.to);
						}
					}
				}

				for (const edge of selectedEdges) {
					const required = incomingCount.get(edge.to) ?? 0;
					const predecessors = program.edges
						.filter((e) => e.to === edge.to)
						.map((e) => e.from);
					const done = predecessors.filter((pred) =>
						completed.has(pred),
					).length;
					if (done >= required) {
						queue.push(edge.to);
					}
				}
			} catch (error) {
				status = "failed";
				events.push({
					type: "node-failed",
					nodeId,
					timestamp: now(),
					error: (error as Error).message,
				});
				events.push({
					type: "execution-failed",
					timestamp: now(),
					error: (error as Error).message,
				});
				return {
					status,
					finalState: state.snapshot(),
					events,
					error: error as Error,
				};
			}
		}

		if (status === "running") {
			status = "completed";
		}

		events.push({ type: "execution-completed", timestamp: now() });
		return {
			status,
			finalState: state.snapshot(),
			events,
		};
	}

	private async executeNode(node: ExecNode, state: StateStore): Promise<void> {
		switch (node.op) {
			case "START":
			case "END":
				return;
			case "LLM_WRITE":
				await this.executeLlmNode(node, state);
				return;
			case "SWITCH":
				return;
			case "TOOL_CALL": {
				const result = await this.toolExecutor.execute(
					node as ToolCallExecNode,
				);
				if (node.outputs?.result) {
					state.set(node.outputs.result, result);
				}
				return;
			}
			case "VAR_SET": {
				const varNode = node as VarSetExecNode;
				const value = isStateRef(varNode.value)
					? state.get(varNode.value)
					: varNode.value;
				state.set(varNode.target, value);
				if (node.outputs?.result) {
					state.set(node.outputs.result, value);
				}
				return;
			}
			case "VAR_GET": {
				const varNode = node as VarGetExecNode;
				const value = state.get(varNode.source);
				if (node.outputs?.result) {
					state.set(node.outputs.result, value);
				}
				return;
			}
			case "TRANSFORM": {
				const transformNode = node as TransformExecNode;
				const sourceRef =
					typeof transformNode.inputs?.source === "string"
						? (transformNode.inputs.source as `$${string}`)
						: undefined;
				const source = sourceRef ? state.get(sourceRef) : state.snapshot();
				const transformed = jmespath.search(source, transformNode.expression);
				if (node.outputs?.result) {
					state.set(node.outputs.result, transformed);
				}
			}
		}
	}

	private async executeLlmNode(
		node: LlmWriteExecNode,
		state: StateStore,
	): Promise<void> {
		const resolvedInputs = { ...(node.inputs ?? {}) };
		const request = this.promptCompiler.compile(
			node,
			resolvedInputs,
			state.snapshot() as Record<string, unknown>,
		);
		const response = await this.provider.chat(request);
		let output = response.parsed ?? JSON.parse(response.content || "{}");
		let validation = this.validator.validate(output, node);
		if (!validation.valid) {
			const repair = await this.repairEngine.attemptRepair(
				node,
				output,
				validation.errors,
				this.provider,
			);
			if (repair.repaired) {
				output = repair.output;
				validation = this.validator.validate(output, node);
			}
		}

		// Single-model mode: do not switch model class during runtime execution.
		// Escalation policies remain in IR for forward compatibility, but are not applied here.

		if (!validation.valid) {
			throw new Error(
				validation.errors.map((error) => error.message).join("; "),
			);
		}

		if (node.outputs?.result) {
			state.set(node.outputs.result, output);
		}
	}
}
