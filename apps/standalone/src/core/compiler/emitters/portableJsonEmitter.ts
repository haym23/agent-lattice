import type { CompileInput, CompileOutput, CompilerEmitter } from '../types';

export class PortableJsonEmitter implements CompilerEmitter {
  target = 'portable-json' as const;

  emit(input: CompileInput): CompileOutput {
    return {
      target: this.target,
      files: [
        {
          path: `out/${input.workflow.name}.portable.json`,
          content: JSON.stringify(
            {
              schemaVersion: '1.0.0',
              compiledFor: input.model.id,
              workflow: input.workflow,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
