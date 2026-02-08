export type StateSnapshot = {
  $vars: Record<string, unknown>;
  $tmp: Record<string, unknown>;
  $ctx: Record<string, unknown>;
  $in: Record<string, unknown>;
};

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export type ExecutionEvent =
  | { type: 'node-started'; nodeId: string; timestamp: string }
  | { type: 'node-completed'; nodeId: string; timestamp: string }
  | { type: 'node-failed'; nodeId: string; timestamp: string; error: string }
  | {
      type: 'variable-set';
      namespace: '$vars' | '$tmp';
      path: string;
      value: unknown;
      timestamp: string;
    }
  | { type: 'execution-completed'; timestamp: string }
  | { type: 'execution-failed'; timestamp: string; error: string };

export type StateEvent =
  | { type: 'variable-set'; namespace: '$vars' | '$tmp'; path: string; value: unknown }
  | { type: 'snapshot'; state: StateSnapshot };

export type StateListener = (event: StateEvent) => void;

export interface ExecutionResult {
  status: ExecutionStatus;
  finalState: StateSnapshot;
  events: ExecutionEvent[];
  error?: Error;
}
