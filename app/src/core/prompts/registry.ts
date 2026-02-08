import { llmClassifyV1Template } from './templates/llm-classify-v1';
import { llmWriteV1Template } from './templates/llm-write-v1';
import { repairV1Template } from './templates/repair-v1';
import { PromptTemplateRegistry } from './types';

export function createDefaultPromptRegistry(): PromptTemplateRegistry {
  const registry = new PromptTemplateRegistry();
  registry.register(llmWriteV1Template);
  registry.register(llmClassifyV1Template);
  registry.register(repairV1Template);
  return registry;
}
