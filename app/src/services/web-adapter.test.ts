import { describe, expect, it } from "vitest";

import { MemoryWorkflowRepository } from "../adapters/persistence/memoryWorkflowRepository";
import { compileWorkflow } from "../core/compiler/pipeline";
import type { CompileOutput, CompilerTarget } from "../core/compiler/types";
import { ModelRegistry } from "../core/models/registry";
import type { ModelDefinition } from "../core/models/types";
import type { ExecutionResult } from "../core/runtime/types";
import type { WorkflowDocument } from "../core/workflow/types";
import type {
	ExecutionListener,
	McpToolSchema,
	PlatformAdapter,
} from "./platform-adapter";

class TestPlatformAdapter implements PlatformAdapter {
	private readonly repository = new MemoryWorkflowRepository();
	private readonly modelRegistry = new ModelRegistry();

	async saveWorkflow(_id: string, data: WorkflowDocument): Promise<void> {
		await this.repository.save(data);
	}

	async loadWorkflow(id: string): Promise<WorkflowDocument | null> {
		return this.repository.load(id);
	}

	async listWorkflows(): Promise<WorkflowDocument[]> {
		return this.repository.list();
	}

	async deleteWorkflow(id: string): Promise<void> {
		await this.repository.delete(id);
	}

	async compileWorkflow(
		workflow: WorkflowDocument,
		modelId: string,
		target: string,
	): Promise<CompileOutput> {
		const model = this.modelRegistry.get(modelId);
		return compileWorkflow({
			workflow,
			model,
			target: target as CompilerTarget,
		});
	}

	async generateWorkflow(
		_prompt: string,
		_model: string,
	): Promise<WorkflowDocument> {
		throw new Error("Not implemented");
	}

	async refineWorkflow(
		_workflow: WorkflowDocument,
		_instruction: string,
	): Promise<WorkflowDocument> {
		throw new Error("Not implemented");
	}

	listModels(): ModelDefinition[] {
		return this.modelRegistry.list();
	}

	async discoverMcpTools(): Promise<McpToolSchema[]> {
		return [];
	}

	async executeWorkflow(_workflow: WorkflowDocument): Promise<ExecutionResult> {
		return {
			status: "completed",
			finalState: { $vars: {}, $tmp: {}, $ctx: {}, $in: {} },
			events: [
				{ type: "execution-completed", timestamp: new Date().toISOString() },
			],
		};
	}

	subscribeToExecution(_listener: ExecutionListener): () => void {
		return () => {};
	}
}

function makeWorkflow(
	overrides: Partial<WorkflowDocument> = {},
): WorkflowDocument {
	return {
		id: "wf-1",
		name: "test-workflow",
		version: "1.0.0",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		nodes: [
			{
				id: "n1",
				type: "subAgent",
				label: "LLM",
				position: { x: 0, y: 0 },
				config: {},
			},
		],
		edges: [],
		...overrides,
	};
}

describe("PlatformAdapter (TestPlatformAdapter)", () => {
	it("saves, loads, lists, and deletes workflows", async () => {
		const adapter = new TestPlatformAdapter();
		const wf = makeWorkflow();

		await adapter.saveWorkflow(wf.id, wf);
		expect(await adapter.loadWorkflow(wf.id)).toEqual(wf);
		expect(await adapter.listWorkflows()).toHaveLength(1);

		await adapter.deleteWorkflow(wf.id);
		expect(await adapter.loadWorkflow(wf.id)).toBeNull();
		expect(await adapter.listWorkflows()).toHaveLength(0);
	});

	it("compiles workflow to claude target", async () => {
		const adapter = new TestPlatformAdapter();
		const wf = makeWorkflow();
		const result = await adapter.compileWorkflow(wf, "claude-sonnet", "claude");
		expect(result.target).toBe("claude");
		expect(result.files.length).toBeGreaterThan(0);
		expect(result.preview).toBeTruthy();
		expect(result.warnings).toBeInstanceOf(Array);
	});

	it("lists models", () => {
		const adapter = new TestPlatformAdapter();
		const models = adapter.listModels();
		expect(models.length).toBeGreaterThanOrEqual(2);
		expect(models.map((m) => m.id)).toContain("claude-sonnet");
	});

	it("returns empty array for MCP tools", async () => {
		const adapter = new TestPlatformAdapter();
		expect(await adapter.discoverMcpTools()).toEqual([]);
	});

	it("throws on AI generation", async () => {
		const adapter = new TestPlatformAdapter();
		await expect(adapter.generateWorkflow("test", "claude")).rejects.toThrow();
	});
});
