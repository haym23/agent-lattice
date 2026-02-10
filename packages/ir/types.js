export const EXEC_OPS = [
    "START",
    "END",
    "LLM_WRITE",
    "SWITCH",
    "TOOL_CALL",
    "VAR_SET",
    "VAR_GET",
    "TRANSFORM",
];
const execOpSet = new Set(EXEC_OPS);
export function isExecOp(value) {
    return execOpSet.has(value);
}
export const MODEL_CLASSES = [
    "SMALL_EXEC",
    "MEDIUM_PLAN",
    "LARGE_JUDGE",
];
const modelClassSet = new Set(MODEL_CLASSES);
export function isModelClass(value) {
    return modelClassSet.has(value);
}
export const STATE_NAMESPACES = ["$vars", "$tmp", "$ctx", "$in"];
/**
 * Checks whether a string is a valid state reference path.
 */
export function isStateRef(value) {
    return /^\$(vars|tmp|ctx|in)\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(value);
}
//# sourceMappingURL=types.js.map