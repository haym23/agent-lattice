import type { CompileInput, CompileOutput, CompilerEmitter } from '../types';

export class ClaudeEmitter implements CompilerEmitter {
  target = 'claude' as const;
  name = 'Claude Code (agents/commands)';
  description = 'Generates .claude/commands/ Markdown files for Claude Code CLI.';

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

    const warnings: string[] = [];
    if (input.model.capabilities.promptFormat !== 'xml') {
      warnings.push(
        `Model ${input.model.displayName} uses ${input.model.capabilities.promptFormat} format; Claude target expects xml.`
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
