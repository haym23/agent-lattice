import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutionPanel } from "./ExecutionPanel";

describe("ExecutionPanel", () => {
	it("renders execution panel sections", () => {
		render(<ExecutionPanel workflowName="test-workflow" />);
		expect(screen.getByText("Execution Debug Panel")).toBeTruthy();
		expect(screen.getByText("Execution Log")).toBeTruthy();
		expect(screen.getByText("State Inspector")).toBeTruthy();
	});

	it("has run and stop controls", () => {
		render(<ExecutionPanel workflowName="test-workflow" />);
		const runButton = screen.getAllByRole("button", { name: "Run" })[0];
		const stopButton = screen.getAllByRole("button", { name: "Stop" })[0];
		expect(runButton.hasAttribute("disabled")).toBe(false);
		expect(stopButton.hasAttribute("disabled")).toBe(true);
		fireEvent.click(runButton);
	});
});
