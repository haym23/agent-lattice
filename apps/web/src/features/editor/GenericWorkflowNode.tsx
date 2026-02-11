import { Handle, type NodeProps, Position } from "reactflow"

import { getNodeDefinition } from "../../core/nodes/catalog"
import { isWorkflowNodeType } from "../../core/workflow/types"
import { getNodeTypeIcon } from "./icons/nodeTypeIconMap"

/**
 * Executes generic workflow node.
 */
export function GenericWorkflowNode({
  id,
  type,
  data,
  selected,
}: NodeProps): JSX.Element {
  const label = String(
    (data as Record<string, unknown> | undefined)?.label ?? type
  )
  const outputPorts = Number(
    (data as Record<string, unknown> | undefined)?.outputPorts ?? 1
  )
  const executionStatus = String(
    (data as Record<string, unknown> | undefined)?.executionStatus ?? ""
  ) as "running" | "completed" | "failed" | ""
  const statusLabel =
    executionStatus === "running"
      ? "Running"
      : executionStatus === "completed"
        ? "Completed"
        : executionStatus === "failed"
          ? "Failed"
          : ""
  const iconSrc = isWorkflowNodeType(type) ? getNodeTypeIcon(type) : null
  const nodeDescription = isWorkflowNodeType(type)
    ? getNodeDefinition(type).description
    : ""
  const hasInput = type !== "start"
  const hasOutput = type !== "end"
  const ports =
    Number.isFinite(outputPorts) && outputPorts > 0 ? outputPorts : 1
  const nodeClassName = [
    "workflow-node",
    selected ? "workflow-node--selected" : "",
    executionStatus ? `workflow-node--${executionStatus}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={nodeClassName} data-status={executionStatus || "idle"}>
      {hasInput ? (
        <Handle id="input" type="target" position={Position.Left} />
      ) : null}
      <div className="workflow-node-meta-row">
        <div className="workflow-node-type">{type}</div>
        {executionStatus ? (
          <div
            className={`workflow-node-status workflow-node-status--${executionStatus}`}
            aria-label={`Node ${statusLabel}`}
            title={statusLabel}
          >
            {executionStatus === "running" ? (
              <span className="workflow-node-spinner" aria-hidden="true" />
            ) : null}
            {executionStatus === "completed" ? (
              <span className="workflow-node-check" aria-hidden="true" />
            ) : null}
            {executionStatus === "failed" ? (
              <span className="workflow-node-fail" aria-hidden="true" />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="workflow-node-title-row">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            className="workflow-node-icon"
          />
        ) : null}
        <div className="workflow-node-title">{label}</div>
      </div>
      <div className="workflow-node-id">{id}</div>
      {nodeDescription ? (
        <div className="workflow-node-description">{nodeDescription}</div>
      ) : null}
      {hasOutput
        ? Array.from({ length: ports }, (_, index) => {
            const top =
              ports === 1 ? "50%" : `${((index + 1) * 100) / (ports + 1)}%`
            const handleId = ports === 1 ? "output" : `branch-${index}`

            return (
              <Handle
                key={handleId}
                id={handleId}
                type="source"
                position={Position.Right}
                style={{ top }}
              />
            )
          })
        : null}
    </div>
  )
}
