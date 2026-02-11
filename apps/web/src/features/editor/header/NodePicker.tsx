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
}

export function NodePicker({
  nextNodeType,
  setNextNodeType,
  addNode,
}: NodePickerProps): JSX.Element {
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false)
  const nextNodeIcon = isWorkflowNodeType(nextNodeType)
    ? getNodeTypeIcon(nextNodeType)
    : null
  const nextNodeDefinition =
    nodeCatalog.find((node) => node.type === nextNodeType) ?? nodeCatalog[0]

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
            {nodeCatalog.map((node) => {
              const isSelected = node.type === nextNodeType
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
        onClick={() => addNode(nextNodeType)}
        className="workflow-btn workflow-btn--primary"
      >
        Add Node
      </button>
    </div>
  )
}
