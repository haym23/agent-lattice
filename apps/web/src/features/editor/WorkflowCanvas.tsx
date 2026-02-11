import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
  type NodeTypes,
} from "reactflow"

import { WORKFLOW_NODE_TYPES } from "../../core/workflow/types"
import { useExecutionStore } from "./executionStore"
import { GenericWorkflowNode } from "./GenericWorkflowNode"
import { useWorkflowStore } from "./workflowStore"

import "reactflow/dist/style.css"

interface WorkflowCanvasProps {
  searchTerm: string
  onNodeSelect?: () => void
}

const nodeTypes: NodeTypes = Object.fromEntries(
  WORKFLOW_NODE_TYPES.map((nodeType) => [nodeType, GenericWorkflowNode])
)

/**
 * Executes workflow canvas.
 */
export function WorkflowCanvas({
  searchTerm,
  onNodeSelect,
}: WorkflowCanvasProps): JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick } =
    useWorkflowStore()
  const nodeStatuses = useExecutionStore((state) => state.nodeStatuses)
  const handleNodeClick: NodeMouseHandler = (event, node) => {
    onNodeClick(event, node)
    onNodeSelect?.()
  }

  const displayNodes = nodes.map((node) => {
    const label = String(
      (node.data as Record<string, unknown> | undefined)?.label ?? ""
    )
    const isSearchMatch = searchTerm
      ? label.toLowerCase().includes(searchTerm.toLowerCase())
      : false

    return {
      ...node,
      data: {
        ...(node.data as Record<string, unknown>),
        executionStatus: nodeStatuses[node.id],
      },
      style: isSearchMatch
        ? {
            border: "2px solid #2563eb",
            boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.2)",
          }
        : undefined,
    }
  })

  return (
    <div
      style={{
        height: 520,
        border: "1px solid #cbd5e1",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
