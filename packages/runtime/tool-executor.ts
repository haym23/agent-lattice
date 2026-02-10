import type { ToolCallExecNode } from "@lattice/ir";

/**
 * Provides tool executor behavior.
 */
export class ToolExecutor {
	async execute(node: ToolCallExecNode): Promise<unknown> {
		if (node.tool === "http.request") {
			return this.executeHttp(node);
		}
		if (node.tool.startsWith("mcp:")) {
			return this.executeMcp(node);
		}
		throw new Error(`Unsupported tool: ${node.tool}`);
	}

	private async executeHttp(node: ToolCallExecNode): Promise<unknown> {
		const method = String(node.args?.method ?? "GET");
		const url = String(node.args?.url ?? "");
		const body = node.args?.body;
		const response = await fetch(url, {
			method,
			headers: { "content-type": "application/json" },
			body:
				method === "GET" ? undefined : body ? JSON.stringify(body) : undefined,
		});
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}

	private async executeMcp(node: ToolCallExecNode): Promise<unknown> {
		const parts = node.tool.split(":");
		const endpoint = String(node.args?.endpoint ?? "/mcp");
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				serverId: parts[1],
				toolName: parts[2],
				args: node.args ?? {},
			}),
		});
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}
}
