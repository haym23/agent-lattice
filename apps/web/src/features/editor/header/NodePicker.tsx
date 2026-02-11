import { useState } from "react"

import { nodeCatalog } from "../../../core/nodes/catalog"
import { isWorkflowNodeType } from "../../../core/workflow/types"
import { getNodeTypeIcon } from "../icons/nodeTypeIconMap"

/**
 * Component for picking a node type to add to the workflow.
 */

interface NodePickerProps {
  nextNodeType: string
  setNextNodeType: (type: string) => void
  addNode: (type: string) => void
  excludedNodeTypes?: string[]
}

export function NodePicker({
  nextNodeType,
  setNextNodeType,
  addNode,
  excludedNodeTypes = [],
}: NodePickerProps): JSX.Element {
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false)
  const availableNodes = nodeCatalog.filter(
    (node) => !excludedNodeTypes.includes(node.type)
  )
  const resolvedNodeType =
    availableNodes.find((node) => node.type === nextNodeType)?.type ??
    availableNodes[0]?.type ??
    nextNodeType
  const nextNodeIcon = isWorkflowNodeType(resolvedNodeType)
    ? getNodeTypeIcon(resolvedNodeType)
    : null
  const nextNodeDefinition =
    availableNodes.find((node) => node.type === resolvedNodeType) ??
    availableNodes[0] ??
    nodeCatalog[0]

  return (
    <div className="workflow-toolbar-controls">
      <div className="node-picker">
        <button
          type="button"
          className="workflow-input workflow-input--button node-picker-trigger"
          aria-haspopup="listbox"
          aria-expanded={isNodePickerOpen}
          onClick={() => setIsNodePickerOpen((prev) => !prev)}
        >
          {nextNodeIcon ? (
            <img
              src={nextNodeIcon}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
            />
          ) : null}
          <span className="node-picker-trigger-labels">
            <span>{nextNodeDefinition.title}</span>
            <span>{nextNodeDefinition.description}</span>
          </span>
        </button>
        {isNodePickerOpen ? (
          <div className="node-picker-menu" role="listbox">
            {availableNodes.map((node) => {
              const isSelected = node.type === resolvedNodeType
              return (
                <button
                  key={node.type}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={
                    isSelected
                      ? "node-picker-option node-picker-option--selected"
                      : "node-picker-option"
                  }
                  onClick={() => {
                    setNextNodeType(node.type)
                    setIsNodePickerOpen(false)
                  }}
                >
                  {isWorkflowNodeType(node.type) ? (
                    <img
                      src={getNodeTypeIcon(node.type)}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                    />
                  ) : null}
                  <span className="node-picker-option-labels">
                    <span>{node.title}</span>
                    <span>{node.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => addNode(resolvedNodeType)}
        className="workflow-btn workflow-btn--primary"
      >
        Add
      </button>
    </div>
  )
}
