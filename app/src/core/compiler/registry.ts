import { ClaudeEmitter } from "./emitters/claudeEmitter";
import { OpenAiAssistantsEmitter } from "./emitters/openAiAssistantsEmitter";
import { PortableJsonEmitter } from "./emitters/portableJsonEmitter";
import type {
	CompileInput,
	CompileOutput,
	CompilerEmitter,
	CompilerTarget,
} from "./types";

/**
 * Provides emitter registry behavior.
 */
export class EmitterRegistry {
	private readonly emitters = new Map<CompilerTarget, CompilerEmitter>();

	constructor(initialEmitters: CompilerEmitter[] = []) {
		for (const emitter of initialEmitters) {
			this.register(emitter);
		}
	}

	register(emitter: CompilerEmitter): void {
		this.emitters.set(emitter.target, emitter);
	}

	emit(input: CompileInput): CompileOutput {
		const emitter = this.emitters.get(input.target);
		if (!emitter) {
			throw new Error(`No emitter registered for target: ${input.target}`);
		}
		return emitter.emit(input);
	}
}

/**
 * Creates default emitter registry.
 */
export function createDefaultEmitterRegistry(): EmitterRegistry {
	return new EmitterRegistry([
		new ClaudeEmitter(),
		new OpenAiAssistantsEmitter(),
		new PortableJsonEmitter(),
	]);
}
