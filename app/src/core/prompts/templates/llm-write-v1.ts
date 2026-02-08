import type { PromptTemplate } from "../types";

export const llmWriteV1Template: PromptTemplate = {
	id: "llm-write-v1",
	version: "1",
	systemPrompt:
		"You are a task executor. Follow the instruction precisely. Respond in JSON.",
	userPromptTemplate:
		"Instruction:\n{{instruction}}\n\nInput:\n{{input_json}}\n\nReturn only valid JSON.",
};
