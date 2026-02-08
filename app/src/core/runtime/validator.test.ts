import { describe, expect, it } from 'vitest';

import type { ExecNode } from '../ir/types';
import { Validator } from './validator';

describe('Validator', () => {
  it('accepts valid schema output', () => {
    const validator = new Validator();
    const node: ExecNode = {
      id: 'n1',
      op: 'LLM_WRITE',
      model_class: 'SMALL_EXEC',
      prompt_template: 'llm-write-v1',
      output_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      validators: [
        {
          type: 'json_schema',
          schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        },
      ],
    };
    const result = validator.validate({ id: 'x' }, node);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid schema output', () => {
    const validator = new Validator();
    const node: ExecNode = {
      id: 'n1',
      op: 'LLM_WRITE',
      model_class: 'SMALL_EXEC',
      prompt_template: 'llm-write-v1',
      output_schema: { type: 'object' },
      validators: [
        {
          type: 'json_schema',
          schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        },
      ],
    };
    const result = validator.validate({}, node);
    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe('schema');
  });

  it('evaluates invariant checks', () => {
    const validator = new Validator();
    const node: ExecNode = {
      id: 'n1',
      op: 'LLM_WRITE',
      model_class: 'SMALL_EXEC',
      prompt_template: 'llm-write-v1',
      output_schema: { type: 'object' },
      validators: [{ type: 'invariant', expr: '$out.id in $in.allowed' }],
    };
    const ok = validator.validate({ id: 'a' }, node, { allowed: ['a', 'b'] });
    const bad = validator.validate({ id: 'c' }, node, { allowed: ['a', 'b'] });
    expect(ok.valid).toBe(true);
    expect(bad.valid).toBe(false);
    expect(bad.errors[0].type).toBe('invariant');
  });
});
