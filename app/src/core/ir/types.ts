export const EXEC_OPS = [
  'START',
  'END',
  'LLM_WRITE',
  'SWITCH',
  'TOOL_CALL',
  'VAR_SET',
  'VAR_GET',
  'TRANSFORM',
] as const;

export type ExecOp = (typeof EXEC_OPS)[number];

const execOpSet = new Set<string>(EXEC_OPS);

export function isExecOp(value: string): value is ExecOp {
  return execOpSet.has(value);
}

export const MODEL_CLASSES = ['SMALL_EXEC', 'MEDIUM_PLAN', 'LARGE_JUDGE'] as const;

export type ModelClass = (typeof MODEL_CLASSES)[number];

const modelClassSet = new Set<string>(MODEL_CLASSES);

export function isModelClass(value: string): value is ModelClass {
  return modelClassSet.has(value);
}

export const STATE_NAMESPACES = ['$vars', '$tmp', '$ctx', '$in'] as const;

export type StateNamespace = (typeof STATE_NAMESPACES)[number];

type Primitive = string | number | boolean | null;
export type JsonValue = Primitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type StateRef = `${StateNamespace}.${string}`;

export interface InputProjection {
  ref: StateRef;
  pick?: string[];
  truncate_items?: number;
  truncate_chars?: number;
}

export type OutputSchema = JsonObject;

export interface RetryPolicy {
  strategy: 'PATCH_JSON_FROM_ERROR' | 'FULL_RETRY';
  max_attempts: number;
}

export interface EscalationPolicy {
  on: string[];
  to_model_class: ModelClass;
}

export type ValidatorDef =
  | { type: 'json_schema'; schema: string | OutputSchema }
  | { type: 'invariant'; expr: string };

interface BaseExecNode {
  id: string;
  op: ExecOp;
  inputs?: Record<string, StateRef | InputProjection | JsonValue>;
  outputs?: Record<string, StateRef>;
}

export interface StartExecNode extends BaseExecNode {
  op: 'START';
}

export interface EndExecNode extends BaseExecNode {
  op: 'END';
}

export interface LlmWriteExecNode extends BaseExecNode {
  op: 'LLM_WRITE';
  model_class: ModelClass;
  prompt_template: string;
  output_schema: string | OutputSchema;
  validators?: ValidatorDef[];
  retry_policy?: RetryPolicy;
  escalation?: EscalationPolicy;
}

export interface SwitchExecNode extends BaseExecNode {
  op: 'SWITCH';
}

export interface ToolCallExecNode extends BaseExecNode {
  op: 'TOOL_CALL';
  tool: string;
  args?: Record<string, StateRef | JsonValue>;
}

export interface VarSetExecNode extends BaseExecNode {
  op: 'VAR_SET';
  target: StateRef;
  value: StateRef | JsonValue;
}

export interface VarGetExecNode extends BaseExecNode {
  op: 'VAR_GET';
  source: StateRef;
}

export interface TransformExecNode extends BaseExecNode {
  op: 'TRANSFORM';
  transformation: 'jmespath' | 'jsonpath' | 'javascript';
  expression: string;
}

export type ExecNode =
  | StartExecNode
  | EndExecNode
  | LlmWriteExecNode
  | SwitchExecNode
  | ToolCallExecNode
  | VarSetExecNode
  | VarGetExecNode
  | TransformExecNode;

export type WhenCondition =
  | { op: 'always'; left?: string; right?: string }
  | { op: 'eq' | 'neq' | 'contains' | 'regex'; left: string; right: string };

export interface ExecEdge {
  from: string;
  to: string;
  when: WhenCondition;
}

export interface ExecProgram {
  execir_version: string;
  entry_node: string;
  nodes: ExecNode[];
  edges: ExecEdge[];
}

export function isStateRef(value: string): value is StateRef {
  return /^\$(vars|tmp|ctx|in)\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(value);
}
