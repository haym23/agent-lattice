import { describe, expect, it } from "vitest";

import { createDefaultPromptRegistry } from "./registry";
import { PromptTemplateRegistry } from "./types";

describe("PromptTemplateRegistry", () => {
	it("registers and fetches templates", () => {
		const registry = new PromptTemplateRegistry();
		registry.register({
			id: "custom-v1",
			version: "1",
			systemPrompt: "sys",
			userPromptTemplate: "user",
		});
		expect(registry.get("custom-v1").systemPrompt).toBe("sys");
	});

	it("rejects duplicate ids", () => {
		const registry = new PromptTemplateRegistry();
		registry.register({
			id: "dup-v1",
			version: "1",
			systemPrompt: "sys",
			userPromptTemplate: "user",
		});
		expect(() =>
			registry.register({
				id: "dup-v1",
				version: "1",
				systemPrompt: "sys2",
				userPromptTemplate: "user2",
			}),
		).toThrow("already registered");
	});

	it("throws when template does not exist", () => {
		const registry = new PromptTemplateRegistry();
		expect(() => registry.get("missing-v1")).toThrow("not found");
	});

	it("creates default registry with built-in templates", () => {
		const registry = createDefaultPromptRegistry();
		const ids = registry.list().map((t) => t.id);
		expect(ids).toContain("llm-write-v1");
		expect(ids).toContain("llm-classify-v1");
		expect(ids).toContain("repair-v1");
	});
});
