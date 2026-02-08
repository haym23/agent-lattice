export interface PromptTemplate {
  id: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema?: object;
}

export class PromptTemplateRegistry {
  private readonly templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Prompt template already registered: ${template.id}`);
    }
    this.templates.set(template.id, template);
  }

  get(id: string): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Prompt template not found: ${id}`);
    }
    return template;
  }

  list(): PromptTemplate[] {
    return [...this.templates.values()];
  }
}
