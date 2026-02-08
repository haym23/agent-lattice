import type { CompileInput, CompileOutput, CompilerEmitter } from '../types';

export class OpenAiAssistantsEmitter implements CompilerEmitter {
  target = 'openai-assistants' as const;

  emit(input: CompileInput): CompileOutput {
    const payload = {
      name: input.workflow.name,
      description: input.workflow.description ?? '',
      model: input.model.id,
      instructions: `Execute workflow ${input.workflow.name} with ${input.workflow.nodes.length} steps.`,
      metadata: {
        workflowId: input.workflow.id,
        nodeCount: input.workflow.nodes.length,
        edgeCount: input.workflow.edges.length,
      },
    };

    return {
      target: this.target,
      files: [
        {
          path: `out/${input.workflow.name}.assistant.json`,
          content: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }
}
