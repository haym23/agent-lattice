import type { ExecNode, InputProjection } from '../ir/types';
import type { LlmRequest } from '../llm/types';
import type { PromptTemplateRegistry } from '../prompts/types';

function getByPath(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = source;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function applyProjection(projection: InputProjection, state: Record<string, unknown>): unknown {
  let value = getByPath(state, projection.ref);
  if (projection.pick && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const picked: Record<string, unknown> = {};
    for (const key of projection.pick) {
      picked[key] = (value as Record<string, unknown>)[key];
    }
    value = picked;
  }
  if (projection.truncate_items && Array.isArray(value)) {
    value = value.slice(0, projection.truncate_items);
  }
  if (projection.truncate_chars && typeof value === 'string') {
    value = value.slice(0, projection.truncate_chars);
  }
  return value;
}

function render(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, token: string) => {
    const value = values[token];
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value ?? null, null, 2);
  });
}

export class PromptCompiler {
  constructor(private readonly registry: PromptTemplateRegistry) {}

  compile(
    node: ExecNode,
    resolvedInputs: Record<string, unknown>,
    state: Record<string, unknown> = {}
  ): LlmRequest {
    if (!('prompt_template' in node)) {
      throw new Error(`Node ${node.id} does not support prompt compilation`);
    }
    const template = this.registry.get(node.prompt_template);
    const projectedInputs = Object.fromEntries(
      Object.entries(resolvedInputs).map(([key, value]) => {
        if (value && typeof value === 'object' && 'ref' in (value as object)) {
          return [key, applyProjection(value as InputProjection, state)];
        }
        return [key, value];
      })
    );
    return {
      modelClass: node.model_class,
      messages: [
        { role: 'system', content: template.systemPrompt },
        {
          role: 'user',
          content: render(template.userPromptTemplate, {
            ...projectedInputs,
            input_json: projectedInputs,
            instruction: projectedInputs.instruction,
          }),
        },
      ],
      responseFormat:
        typeof node.output_schema === 'object'
          ? (node.output_schema as Record<string, unknown>)
          : undefined,
    };
  }

  compileRepair(
    modelClass: 'SMALL_EXEC' | 'MEDIUM_PLAN' | 'LARGE_JUDGE',
    repairPacket: { error: string; previous_output: unknown; expected_schema: unknown }
  ): LlmRequest {
    const template = this.registry.get('repair-v1');
    return {
      modelClass,
      messages: [
        { role: 'system', content: template.systemPrompt },
        {
          role: 'user',
          content: render(template.userPromptTemplate, {
            error: repairPacket.error,
            previous_output_json: repairPacket.previous_output,
            expected_schema_json: repairPacket.expected_schema,
          }),
        },
      ],
      responseFormat: { type: 'object' },
    };
  }
}
