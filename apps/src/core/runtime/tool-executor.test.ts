import { describe, expect, it, vi } from "vitest";

import type { ToolCallExecNode } from "../ir/types";
import { ToolExecutor } from "./tool-executor";

describe("ToolExecutor", () => {
	it("executes http request tool", async () => {
		const fetchMock = vi.fn(async () => ({ text: async () => '{"ok":true}' }));
		vi.stubGlobal("fetch", fetchMock);

		const executor = new ToolExecutor();
		const node: ToolCallExecNode = {
			id: "http1",
			op: "TOOL_CALL",
			tool: "http.request",
			args: { method: "GET", url: "https://example.com" },
		};
		const result = await executor.execute(node);
		expect(result).toEqual({ ok: true });
	});

	it("executes mcp tool endpoint", async () => {
		const fetchMock = vi.fn(async () => ({
			text: async () => '{"result":"done"}',
		}));
		vi.stubGlobal("fetch", fetchMock);

		const executor = new ToolExecutor();
		const node: ToolCallExecNode = {
			id: "mcp1",
			op: "TOOL_CALL",
			tool: "mcp:server:tool",
			args: { endpoint: "/mcp" },
		};
		const result = await executor.execute(node);
		expect(result).toEqual({ result: "done" });
	});
});
