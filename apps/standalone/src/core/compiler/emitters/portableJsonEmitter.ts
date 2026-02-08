import type { CompileInput, CompileOutput, CompilerEmitter } from '../types';

export class PortableJsonEmitter implements CompilerEmitter {
  target = 'portable-json' as const;
  name = 'Portable JSON';
  description = 'Generates a target-agnostic JSON representation of the workflow.';

  emit(input: CompileInput): CompileOutput {
    const content = JSON.stringify(
      {
        schemaVersion: '1.0.0',
        compiledFor: input.model.id,
        workflow: input.workflow,
      },
      null,
      2
    );

    return {
      target: this.target,
      files: [
        {
          path: `out/${input.workflow.name}.portable.json`,
          content,
        },
      ],
      preview: content,
      warnings: [],
    };
  }
}
