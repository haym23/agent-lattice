export declare const MODEL_CLASSES: readonly ["SMALL_EXEC", "MEDIUM_PLAN", "LARGE_JUDGE"];
export type ModelClass = (typeof MODEL_CLASSES)[number];
export interface JsonSchema {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
    [key: string]: unknown;
}
export interface LlmMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface LlmRequest {
    modelClass: ModelClass;
    messages: LlmMessage[];
    responseFormat?: JsonSchema;
    temperature?: number;
}
export interface LlmResponse {
    content: string;
    parsed?: unknown;
    usage: {
        promptTokens: number;
        completionTokens: number;
    };
    modelUsed: string;
}
export interface LlmProvider {
    chat(request: LlmRequest): Promise<LlmResponse>;
}
/**
 * Represents the missing api key error condition.
 */
export declare class MissingApiKeyError extends Error {
    constructor();
}
//# sourceMappingURL=types.d.ts.map