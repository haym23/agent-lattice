import type { StateEvent, StateListener, StateSnapshot } from './types';

const READ_ONLY_NAMESPACES = new Set(['$ctx', '$in']);
const VALID_NAMESPACES = new Set(['$vars', '$tmp', '$ctx', '$in']);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseRef(ref: string): {
  namespace: '$vars' | '$tmp' | '$ctx' | '$in';
  segments: string[];
} {
  const [namespace, ...segments] = ref.split('.');
  if (!VALID_NAMESPACES.has(namespace) || segments.length === 0) {
    throw new Error(`Invalid state reference: ${ref}`);
  }
  return {
    namespace: namespace as '$vars' | '$tmp' | '$ctx' | '$in',
    segments,
  };
}

export class ReadOnlyNamespaceError extends Error {
  constructor(namespace: string) {
    super(`Cannot write to read-only namespace: ${namespace}`);
    this.name = 'ReadOnlyNamespaceError';
  }
}

export class StateStore {
  private readonly state: StateSnapshot;
  private readonly listeners = new Set<StateListener>();

  constructor(input: Record<string, unknown> = {}, context: Record<string, unknown> = {}) {
    this.state = {
      $vars: {},
      $tmp: {},
      $ctx: deepClone(context),
      $in: deepClone(input),
    };
  }

  get(ref: string): unknown {
    const { namespace, segments } = parseRef(ref);
    let current: unknown = this.state[namespace];
    for (const segment of segments) {
      if (typeof current !== 'object' || current === null || !(segment in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  set(ref: string, value: unknown): void {
    const { namespace, segments } = parseRef(ref);
    if (READ_ONLY_NAMESPACES.has(namespace)) {
      throw new ReadOnlyNamespaceError(namespace);
    }

    let current: Record<string, unknown> = this.state[namespace] as Record<string, unknown>;
    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      if (
        !(segment in current) ||
        typeof current[segment] !== 'object' ||
        current[segment] === null
      ) {
        current[segment] = {};
      }
      current = current[segment] as Record<string, unknown>;
    }

    current[segments[segments.length - 1]] = value;

    this.emit({
      type: 'variable-set',
      namespace: namespace as '$vars' | '$tmp',
      path: segments.join('.'),
      value,
    });
  }

  snapshot(): StateSnapshot {
    return deepClone(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emitSnapshot(): void {
    this.emit({
      type: 'snapshot',
      state: this.snapshot(),
    });
  }

  private emit(event: StateEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
