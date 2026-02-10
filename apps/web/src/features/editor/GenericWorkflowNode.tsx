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
  const iconSrc = isWorkflowNodeType(type) ? getNodeTypeIcon(type) : null
  const nodeDescription = isWorkflowNodeType(type)
    ? getNodeDefinition(type).description
    : ""
  const hasInput = type !== "start"
  const hasOutput = type !== "end"
  const ports =
    Number.isFinite(outputPorts) && outputPorts > 0 ? outputPorts : 1
  const executionBorderColor =
    executionStatus === "running"
      ? "#ca8a04"
      : executionStatus === "completed"
        ? "#16a34a"
        : executionStatus === "failed"
          ? "#dc2626"
          : null

  return (
    <div
      className={
        executionStatus === "running"
          ? "workflow-node workflow-node--running"
          : "workflow-node"
      }
      style={{
        minWidth: 180,
        maxWidth: 220,
        border: selected
          ? "2px solid #2563eb"
          : executionBorderColor
            ? `2px solid ${executionBorderColor}`
            : "1px solid #94a3b8",
        borderRadius: 10,
        background: "#ffffff",
        padding: 10,
        boxShadow:
          executionStatus === "running"
            ? "0 0 0 2px rgba(202, 138, 4, 0.2)"
            : selected
              ? "0 6px 18px rgba(37, 99, 235, 0.18)"
              : "0 2px 10px rgba(15, 23, 42, 0.08)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        transform: selected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {hasInput ? (
        <Handle id="input" type="target" position={Position.Left} />
      ) : null}
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>
        {type}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            style={{ flexShrink: 0 }}
          />
        ) : null}
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{label}</div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{id}</div>
      {nodeDescription ? (
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.35,
            color: "#475569",
            marginTop: 6,
          }}
        >
          {nodeDescription}
        </div>
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
