import Ajv from "ajv";

import type { ExecNode } from "../ir/types";

export interface ValidationError {
	type: "schema" | "invariant";
	message: string;
	path?: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Executes evaluate invariant.
 */
function evaluateInvariant(
	expr: string,
	output: unknown,
	input: Record<string, unknown>,
): boolean {
	const membership = /^\$out\.([A-Za-z0-9_]+) in \$in\.([A-Za-z0-9_]+)$/.exec(
		expr,
	);
	if (membership) {
		const outKey = membership[1];
		const inKey = membership[2];
		const outValue = (output as Record<string, unknown> | null)?.[outKey];
		const inValue = input[inKey];
		if (Array.isArray(inValue)) {
			return inValue.includes(outValue);
		}
		return false;
	}
	return true;
}

/**
 * Provides validator behavior.
 */
export class Validator {
	validate(
		output: unknown,
		node: ExecNode,
		input: Record<string, unknown> = {},
	): ValidationResult {
		const errors: ValidationError[] = [];
		if ("validators" in node && Array.isArray(node.validators)) {
			for (const validator of node.validators) {
				if (validator.type === "json_schema") {
					const schema =
						typeof validator.schema === "string"
							? { $ref: validator.schema }
							: validator.schema;
					const check = ajv.compile(schema as object);
					const valid = check(output);
					if (!valid) {
						for (const err of check.errors ?? []) {
							errors.push({
								type: "schema",
								message: err.message ?? "schema validation failed",
								path: err.instancePath,
							});
						}
					}
				}
				if (validator.type === "invariant") {
					const ok = evaluateInvariant(validator.expr, output, input);
					if (!ok) {
						errors.push({
							type: "invariant",
							message: `Invariant failed: ${validator.expr}`,
						});
					}
				}
			}
		}
		return {
			valid: errors.length === 0,
			errors,
		};
	}
}
