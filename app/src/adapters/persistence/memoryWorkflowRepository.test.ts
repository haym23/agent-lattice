import { describe, expect, it } from "vitest";

import type { WorkflowDocument } from "../../core/workflow/types";
import { MemoryWorkflowRepository } from "./memoryWorkflowRepository";

function makeWorkflow(id: string, name: string): WorkflowDocument {
	return {
		id,
		name,
		version: "1.0.0",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		nodes: [],
		edges: [],
	};
}

describe("MemoryWorkflowRepository", () => {
	it("saves and loads workflow", async () => {
		const repo = new MemoryWorkflowRepository();
		await repo.save(makeWorkflow("wf1", "Workflow 1"));
		const loaded = await repo.load("wf1");
		expect(loaded?.name).toBe("Workflow 1");
	});

	it("returns null for unknown id", async () => {
		const repo = new MemoryWorkflowRepository();
		expect(await repo.load("nonexistent")).toBeNull();
	});

	it("lists all saved workflows", async () => {
		const repo = new MemoryWorkflowRepository();
		await repo.save(makeWorkflow("wf1", "First"));
		await repo.save(makeWorkflow("wf2", "Second"));
		const all = await repo.list();
		expect(all).toHaveLength(2);
		expect(all.map((w) => w.name).sort()).toEqual(["First", "Second"]);
	});

	it("deletes a workflow", async () => {
		const repo = new MemoryWorkflowRepository();
		await repo.save(makeWorkflow("wf1", "Delete Me"));
		await repo.delete("wf1");
		expect(await repo.load("wf1")).toBeNull();
		expect(await repo.list()).toHaveLength(0);
	});

	it("overwrites on duplicate save", async () => {
		const repo = new MemoryWorkflowRepository();
		await repo.save(makeWorkflow("wf1", "Original"));
		await repo.save(makeWorkflow("wf1", "Updated"));
		const loaded = await repo.load("wf1");
		expect(loaded?.name).toBe("Updated");
		expect(await repo.list()).toHaveLength(1);
	});

	it("delete of unknown id is a no-op", async () => {
		const repo = new MemoryWorkflowRepository();
		await repo.save(makeWorkflow("wf1", "Keep"));
		await repo.delete("nonexistent");
		expect(await repo.list()).toHaveLength(1);
	});
});
