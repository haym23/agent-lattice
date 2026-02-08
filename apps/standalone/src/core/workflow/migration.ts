import type { WorkflowDocument } from './types';

interface LegacyWorkflow {
  id?: string;
  name?: string;
  description?: string;
  nodes?: Array<{ id: string; type: string; position: { x: number; y: number }; data?: unknown }>;
  connections?: Array<{
    id: string;
    from: string;
    to: string;
    fromPort?: string;
    toPort?: string;
  }>;
}

export function migrateLegacyWorkflow(input: unknown): WorkflowDocument {
  const legacy = input as LegacyWorkflow;
  const now = new Date().toISOString();

  return {
    id: legacy.id ?? `workflow_${Date.now()}`,
    name: legacy.name ?? 'Untitled Workflow',
    description: legacy.description,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    nodes: (legacy.nodes ?? []).map((node) => ({
      id: node.id,
      type: (node.type as WorkflowDocument['nodes'][number]['type']) ?? 'llmCall',
      label: String((node.data as Record<string, unknown> | undefined)?.label ?? node.id),
      position: node.position,
      config: (node.data as Record<string, unknown>) ?? {},
    })),
    edges: (legacy.connections ?? []).map((connection) => ({
      id: connection.id,
      source: connection.from,
      target: connection.to,
      sourceHandle: connection.fromPort,
      targetHandle: connection.toPort,
    })),
  };
}
