import type { ExecNode } from "@lattice/ir";
import type { LlmProvider } from "@lattice/llm";
import type { ValidationError } from "./validator";

export interface RepairResult {
  repaired: boolean;
  output?: unknown;
  attempts: number;
}

/**
 * Provides repair engine behavior.
 */
export class RepairEngine {
  async attemptRepair(
    node: ExecNode,
    previousOutput: unknown,
    errors: ValidationError[],
    provider: LlmProvider,
  ): Promise<RepairResult> {
    const maxAttempts =
      "retry_policy" in node && node.retry_policy
        ? Math.min(node.retry_policy.max_attempts, 3)
        : 1;
    const modelClass = "model_class" in node ? node.model_class : "SMALL_EXEC";
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const repairPacket = {
        error: errors.map((e) => e.message).join("; "),
        previous_output: previousOutput,
        expected_schema: "output_schema" in node ? node.output_schema : null,
      };
      const response = await provider.chat({
        modelClass,
        messages: [
          {
            role: "system",
            content:
              "Fix the JSON output based on validation errors. Return JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify(repairPacket),
          },
        ],
        responseFormat: { type: "object" },
      });
      try {
        return {
          repaired: true,
          output: response.parsed ?? JSON.parse(response.content),
          attempts: attempt,
        };
      } catch {
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    return {
      repaired: false,
      attempts: maxAttempts,
    };
  }
}
