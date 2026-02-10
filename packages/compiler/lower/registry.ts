import type { WorkflowNode, WorkflowNodeType } from "../types";
import type { ExecIrFragment, Lowerer, LoweringContext } from "./types";
import { UnsupportedNodeError } from "./types";

/**
 * Provides lowerer registry behavior.
 */
export class LowererRegistry {
	private readonly lowerers = new Map<WorkflowNodeType, Lowerer>();

	register(lowerer: Lowerer): void {
		if (this.lowerers.has(lowerer.nodeType)) {
			throw new Error(
				`Lowerer already registered for node type: ${lowerer.nodeType}`,
			);
		}
		this.lowerers.set(lowerer.nodeType, lowerer);
	}

	has(type: WorkflowNodeType): boolean {
		return this.lowerers.has(type);
	}

	lower(node: WorkflowNode, context: LoweringContext): ExecIrFragment {
		const lowerer = this.lowerers.get(node.type);
		if (!lowerer) {
			throw new UnsupportedNodeError(node.type);
		}
		return lowerer.lower(node, context);
	}
}
