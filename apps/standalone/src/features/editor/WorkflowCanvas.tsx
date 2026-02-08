import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';

import { useWorkflowStore } from './workflowStore';

import 'reactflow/dist/style.css';

interface WorkflowCanvasProps {
  searchTerm: string;
}

export function WorkflowCanvas({ searchTerm }: WorkflowCanvasProps): JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

  const displayNodes = nodes.map((node) => {
    const label = String((node.data as Record<string, unknown> | undefined)?.label ?? '');
    const isSearchMatch = searchTerm
      ? label.toLowerCase().includes(searchTerm.toLowerCase())
      : false;

    return {
      ...node,
      style: isSearchMatch
        ? {
            border: '2px solid #2563eb',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
          }
        : undefined,
    };
  });

  return (
    <div style={{ height: 520, border: '1px solid #cbd5e1', borderRadius: 12, overflow: 'hidden' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
