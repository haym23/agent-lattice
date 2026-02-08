import type { ExecNode, ModelClass } from "../ir/types";
import type { ValidationError } from "./validator";

export interface EscalationDecision {
	escalate: boolean;
	toModelClass?: ModelClass;
}

/**
 * Provides escalation engine behavior.
 */
export class EscalationEngine {
	shouldEscalate(node: ExecNode, error: ValidationError): EscalationDecision {
		if (!("escalation" in node) || !node.escalation) {
			return { escalate: false };
		}
		const shouldEscalate = node.escalation.on.some((value) =>
			error.message.includes(value),
		);
		if (!shouldEscalate) {
			return { escalate: false };
		}
		return {
			escalate: true,
			toModelClass: node.escalation.to_model_class,
		};
	}
}
