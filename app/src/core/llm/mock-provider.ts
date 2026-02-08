import type { LlmProvider, LlmRequest, LlmResponse } from './types';

type MockResponseFactory = (request: LlmRequest, index: number) => LlmResponse;

export class MockLlmProvider implements LlmProvider {
  private readonly responses: Map<string, LlmResponse>;
  private readonly responseFactory?: MockResponseFactory;
  private readonly calls: LlmRequest[] = [];

  constructor(input: Map<string, LlmResponse> | MockResponseFactory = new Map()) {
    if (input instanceof Map) {
      this.responses = input;
      this.responseFactory = undefined;
    } else {
      this.responses = new Map();
      this.responseFactory = input;
    }
  }

  async chat(request: LlmRequest): Promise<LlmResponse> {
    this.calls.push(request);
    if (this.responseFactory) {
      return this.responseFactory(request, this.calls.length - 1);
    }
    const key = `${request.modelClass}:${request.messages.at(-1)?.content ?? ''}`;
    return (
      this.responses.get(key) ?? {
        content: JSON.stringify({ ok: true }),
        parsed: { ok: true },
        usage: { promptTokens: 0, completionTokens: 0 },
        modelUsed: request.modelClass,
      }
    );
  }

  getCalls(): LlmRequest[] {
    return [...this.calls];
  }
}
