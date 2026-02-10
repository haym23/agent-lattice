import type { ExecutionResult } from "../../core/runtime/types";
import { serializeWorkflowFromCanvas } from "../../core/workflow/serialization";
import type { WorkflowDocument } from "../../core/workflow/types";
import type { PlatformAdapter } from "../../services/platform-adapter";
import { WebPlatformAdapter } from "../../services/web-adapter";

let adapter: PlatformAdapter = new WebPlatformAdapter();

export function setPlatformAdapter(custom: PlatformAdapter): void {
	adapter = custom;
}

export function getPlatformAdapter(): PlatformAdapter {
	return adapter;
}

/**
 * Executes save current workflow.
 */
export async function saveCurrentWorkflow(input: {
	id?: string;
	name: string;
	description?: string;
	nodes: Parameters<typeof serializeWorkflowFromCanvas>[0]["nodes"];
	edges: Parameters<typeof serializeWorkflowFromCanvas>[0]["edges"];
}): Promise<WorkflowDocument> {
	const workflow = serializeWorkflowFromCanvas(input);
	await adapter.saveWorkflow(workflow.id, workflow);
	return workflow;
}

export async function listStoredWorkflows(): Promise<WorkflowDocument[]> {
	return adapter.listWorkflows();
}

/**
 * Loads a stored workflow by its persisted identifier.
 */
export async function loadStoredWorkflow(
	id: string,
): Promise<WorkflowDocument | null> {
	return adapter.loadWorkflow(id);
}

export async function deleteStoredWorkflow(id: string): Promise<void> {
	await adapter.deleteWorkflow(id);
}

/**
 * Compiles for target.
 */
export async function compileForTarget(input: {
	workflow: WorkflowDocument;
	modelId: string;
	target: string;
}) {
	return adapter.compileWorkflow(input.workflow, input.modelId, input.target);
}

export function listModels() {
	return adapter.listModels();
}

/**
 * Executes execute workflow.
 */
export async function executeWorkflow(input: {
	workflow: WorkflowDocument;
	data?: Record<string, unknown>;
}): Promise<ExecutionResult> {
	return adapter.executeWorkflow(input.workflow, input.data ?? {});
}
