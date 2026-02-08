import type { CompileInput, CompileOutput, CompilerEmitter } from "../types";

/**
 * Executes describe node.
 */
function describeNode(node: CompileInput["workflow"]["nodes"][number]): string {
	const parts: string[] = [];

	if (node.type === "prompt") {
		const prompt =
			typeof node.config.prompt === "string" ? node.config.prompt : "";
		if (prompt) {
			parts.push(`prompt="${prompt}"`);
		}
	}

	if (node.type === "subAgent") {
		const description =
			typeof node.config.description === "string"
				? node.config.description
				: "";
		const prompt =
			typeof node.config.prompt === "string" ? node.config.prompt : "";
		if (description) {
			parts.push(`description="${description}"`);
		}
		if (prompt) {
			parts.push(`prompt="${prompt}"`);
		}
	}

	if (node.type === "ifElse" || node.type === "switch") {
		const target =
			typeof node.config.evaluationTarget === "string"
				? node.config.evaluationTarget
				: undefined;
		if (target) {
			parts.push(`evaluationTarget="${target}"`);
		}
	}

	if (node.type === "httpRequest") {
		const method =
			typeof node.config.method === "string" ? node.config.method : undefined;
		const url =
			typeof node.config.url === "string" ? node.config.url : undefined;
		if (method) {
			parts.push(`method=${method}`);
		}
		if (url) {
			parts.push(`url=${url}`);
		}
	}

	return parts.length > 0 ? ` - ${parts.join(", ")}` : "";
}

/**
 * Provides claude emitter behavior.
 */
export class ClaudeEmitter implements CompilerEmitter {
	target = "claude" as const;
	name = "Claude Code (agents/commands)";
	description =
		"Generates .claude/commands/ Markdown files for Claude Code CLI.";

	emit(input: CompileInput): CompileOutput {
		const commandBody = [
			"---",
			`description: Execute workflow ${input.workflow.name}`,
			"allowed-tools: Task,AskUserQuestion",
			"---",
			"",
			`Model: ${input.model.displayName}`,
			"",
			"Workflow steps:",
			...input.workflow.nodes.map(
				(node, index) =>
					`${index + 1}. ${node.label} (${node.type})${describeNode(node)}`,
			),
			"",
			"Connections:",
			...input.workflow.edges.map(
				(edge) => `- ${edge.source} -> ${edge.target}`,
			),
		].join("\n");

		const warnings: string[] = [];
		if (input.model.capabilities.promptFormat !== "xml") {
			warnings.push(
				`Model ${input.model.displayName} uses ${input.model.capabilities.promptFormat} format; Claude target expects xml.`,
			);
		}

		return {
			target: this.target,
			files: [
				{
					path: `.claude/commands/${input.workflow.name}.md`,
					content: commandBody,
				},
			],
			preview: commandBody,
			warnings,
		};
	}
}
