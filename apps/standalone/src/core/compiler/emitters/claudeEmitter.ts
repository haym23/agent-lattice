import type { CompileInput, CompileOutput, CompilerEmitter } from '../types';

export class ClaudeEmitter implements CompilerEmitter {
  target = 'claude' as const;

  emit(input: CompileInput): CompileOutput {
    const commandBody = [
      '---',
      `description: Execute workflow ${input.workflow.name}`,
      'allowed-tools: Task,AskUserQuestion',
      '---',
      '',
      `Model: ${input.model.displayName}`,
      '',
      'Workflow steps:',
      ...input.workflow.nodes.map((node, index) => `${index + 1}. ${node.label} (${node.type})`),
      '',
      'Connections:',
      ...input.workflow.edges.map((edge) => `- ${edge.source} -> ${edge.target}`),
    ].join('\n');

    return {
      target: this.target,
      files: [
        {
          path: `.claude/commands/${input.workflow.name}.md`,
          content: commandBody,
        },
      ],
    };
  }
}
