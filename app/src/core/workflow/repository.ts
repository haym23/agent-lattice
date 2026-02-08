import type { WorkflowDocument } from "./types";

export interface WorkflowRepository {
	save(workflow: WorkflowDocument): Promise<void>;
	load(id: string): Promise<WorkflowDocument | null>;
	list(): Promise<WorkflowDocument[]>;
	delete(id: string): Promise<void>;
}
