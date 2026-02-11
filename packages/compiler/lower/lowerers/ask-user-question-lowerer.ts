import type { ExecEdge, SwitchExecNode } from "@lattice/ir"
import type { Lowerer } from "../types"

export const askUserQuestionLowerer: Lowerer = {
  nodeType: "askUserQuestion",
  lower(node, context) {
    const evaluationTarget =
      typeof node.config.evaluationTarget === "string" &&
      node.config.evaluationTarget
        ? node.config.evaluationTarget
        : `$in.askUserQuestion.${node.id}`

    const questionText =
      typeof node.config.questionText === "string"
        ? node.config.questionText
        : "Please choose an option"

    const options = Array.isArray(node.config.options)
      ? (node.config.options as Array<{ value?: string; label?: string }>)
      : []
    const outgoing = context.outgoingEdges.get(node.id) ?? []

    const edges: ExecEdge[] = outgoing.map((edge, index) => {
      const value = options[index]?.value ?? options[index]?.label ?? `${index}`
      return {
        from: edge.source,
        to: edge.target,
        when:
          index === outgoing.length - 1
            ? { op: "always" }
            : { op: "eq", left: evaluationTarget, right: value },
      }
    })

    const execNode: SwitchExecNode = {
      id: node.id,
      op: "SWITCH",
      inputs: {
        evaluationTarget,
        questionText,
        options,
      },
    }

    return { nodes: [execNode], edges, requiredTemplates: [] }
  },
}
