import { describe, expect, it, vi } from "vitest";

import { ReadOnlyNamespaceError, StateStore } from "./state-store";

describe("StateStore", () => {
	it("writes and reads vars/tmp", () => {
		const store = new StateStore();
		store.set("$vars.answer", 42);
		store.set("$tmp.cache.key", "value");
		expect(store.get("$vars.answer")).toBe(42);
		expect(store.get("$tmp.cache.key")).toBe("value");
	});

	it("reads input/context data", () => {
		const store = new StateStore(
			{ user: "haym" },
			{ timezone: "America/New_York" },
		);
		expect(store.get("$in.user")).toBe("haym");
		expect(store.get("$ctx.timezone")).toBe("America/New_York");
	});

	it("throws when writing to read-only namespaces", () => {
		const store = new StateStore();
		expect(() => store.set("$ctx.test", 1)).toThrow(ReadOnlyNamespaceError);
		expect(() => store.set("$in.test", 1)).toThrow(ReadOnlyNamespaceError);
	});

	it("emits events on updates", () => {
		const store = new StateStore();
		const listener = vi.fn();
		store.subscribe(listener);
		store.set("$vars.x", "y");
		expect(listener).toHaveBeenCalledWith({
			type: "variable-set",
			namespace: "$vars",
			path: "x",
			value: "y",
		});
	});

	it("returns immutable snapshots", () => {
		const store = new StateStore();
		store.set("$vars.nested.value", "ok");
		const snapshot = store.snapshot();
		(snapshot.$vars as Record<string, unknown>).nested = "mutated";
		expect(store.get("$vars.nested.value")).toBe("ok");
	});
});
