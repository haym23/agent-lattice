export const MODEL_CLASSES = [
    "SMALL_EXEC",
    "MEDIUM_PLAN",
    "LARGE_JUDGE",
];
/**
 * Represents the missing api key error condition.
 */
export class MissingApiKeyError extends Error {
    constructor() {
        super("Missing OpenAI API key. Set VITE_OPENAI_API_KEY.");
        this.name = "MissingApiKeyError";
    }
}
//# sourceMappingURL=types.js.map