import { analyzeGraph } from "./analyzer"
import { createDefaultEmitterRegistry } from "./registry"
import type { AnalyzedGraph, CompileInput, CompileOutput } from "./types"

/**
 * Executes build analyzed graph.
 */
export function buildAnalyzedGraph(input: CompileInput): AnalyzedGraph {
  if (input.workflow.nodes.length === 0) {
    throw new Error("Workflow must contain at least one node")
  }
  return analyzeGraph(input.workflow.nodes, input.workflow.edges)
}

/**
 * Executes normalize graph.
 */
function normalizeGraph(
  input: CompileInput,
  graph: AnalyzedGraph
): CompileInput {
  const orderIndex = new Map<string, number>(
    graph.executionOrder.map((nodeId, index) => [nodeId, index])
  )
  return {
    ...input,
    workflow: {
      ...input.workflow,
      nodes: [...input.workflow.nodes].sort((a, b) => {
        const ai = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const bi = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
        if (ai !== bi) {
          return ai - bi
        }
        return 0
      }),
    },
  }
}

/**
 * Validates output.
 */
function validateOutput(output: CompileOutput): CompileOutput {
  if (output.files.length === 0) {
    throw new Error("Compiler produced no files")
  }
  return output
}

/**
 * Compiles workflow.
 */
export function compileWorkflow(input: CompileInput): CompileOutput {
  const graph = buildAnalyzedGraph(input)
  const normalized = normalizeGraph(input, graph)
  const registry = createDefaultEmitterRegistry()
  const emitted = registry.emit(normalized)

  const graphWarnings: string[] = []
  if (graph.cycles.length > 0) {
    graphWarnings.push(
      `Graph contains ${graph.cycles.length} cycle(s): ${graph.cycles.map((c) => c.join(" -> ")).join("; ")}`
    )
  }
  if (graph.unreachable.length > 0) {
    graphWarnings.push(`Unreachable nodes: ${graph.unreachable.join(", ")}`)
  }

  return validateOutput({
    ...emitted,
    warnings: [...graphWarnings, ...emitted.warnings],
  })
}
