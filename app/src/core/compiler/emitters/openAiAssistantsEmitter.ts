import type { CompileInput, CompileOutput, CompilerEmitter } from "../types";

/**
 * Provides open ai assistants emitter behavior.
 */
export class OpenAiAssistantsEmitter implements CompilerEmitter {
	target = "openai-assistants" as const;
	name = "OpenAI Assistants";
	description =
		"Generates OpenAI Assistants API-compatible JSON configuration.";

	emit(input: CompileInput): CompileOutput {
		const payload = {
			name: input.workflow.name,
			description: input.workflow.description ?? "",
			model: input.model.id,
			instructions: `Execute workflow ${input.workflow.name} with ${input.workflow.nodes.length} steps.`,
			metadata: {
				workflowId: input.workflow.id,
				nodeCount: input.workflow.nodes.length,
				edgeCount: input.workflow.edges.length,
			},
		};

		const content = JSON.stringify(payload, null, 2);
		const warnings: string[] = [];
		if (input.model.capabilities.promptFormat === "xml") {
			warnings.push(
				`Model ${input.model.displayName} uses xml format; OpenAI target expects function-calling.`,
			);
		}

		return {
			target: this.target,
			files: [
				{
					path: `out/${input.workflow.name}.assistant.json`,
					content,
				},
			],
			preview: content,
			warnings,
		};
	}
}
