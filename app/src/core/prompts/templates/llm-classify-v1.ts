import type { PromptTemplate } from '../types';

export const llmClassifyV1Template: PromptTemplate = {
  id: 'llm-classify-v1',
  version: '1',
  systemPrompt: 'Classify the input into exactly one of the given labels. Respond in JSON.',
  userPromptTemplate:
    'Input:\n{{input_json}}\n\nLabels:\n{{labels_json}}\n\nReturn: {"label":"..."}',
};
