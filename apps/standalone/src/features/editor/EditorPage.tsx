import { useState } from 'react';

import { nodeCatalog } from '../../core/nodes/catalog';
import { deserializeWorkflowToCanvas } from '../../core/workflow/serialization';
import type { WorkflowDocument } from '../../core/workflow/types';
import { PageShell } from '../shared/PageShell';
import { CompilePreviewDialog } from './CompilePreviewDialog';
import {
  compileForTarget,
  listModels,
  listStoredWorkflows,
  loadStoredWorkflow,
  saveCurrentWorkflow,
} from './standaloneWorkflowService';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useWorkflowStore } from './workflowStore';

export function EditorPage(): JSX.Element {
  const { addNode, nodes, edges } = useWorkflowStore();
  const [workflowName, setWorkflowName] = useState('standalone-workflow');
  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowDocument[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [modelId, setModelId] = useState('claude-sonnet');
  const [target, setTarget] = useState<'claude' | 'openai-assistants' | 'portable-json'>('claude');
  const [compilePreview, setCompilePreview] = useState('');
  const [isCompileDialogOpen, setIsCompileDialogOpen] = useState(false);
  const [nextNodeType, setNextNodeType] = useState('llmCall');
  const [searchTerm, setSearchTerm] = useState('');

  const models = listModels();

  const handleSave = async () => {
    const saved = await saveCurrentWorkflow({
      id: selectedId || undefined,
      name: workflowName,
      nodes,
      edges,
    });
    setSelectedId(saved.id);
  };

  const handleRefresh = async () => {
    setSavedWorkflows(await listStoredWorkflows());
  };

  const handleLoad = async () => {
    if (!selectedId) return;
    const workflow = await loadStoredWorkflow(selectedId);
    if (!workflow) return;
    const canvas = deserializeWorkflowToCanvas(workflow);
    useWorkflowStore.setState({ nodes: canvas.nodes, edges: canvas.edges });
    setWorkflowName(workflow.name);
  };

  const handleCompile = async () => {
    if (!selectedId) return;
    const workflow = await loadStoredWorkflow(selectedId);
    if (!workflow) return;
    const result = compileForTarget({ workflow, modelId, target });
    setCompilePreview(
      result.files.map((file) => `${file.path}\n${file.content}`).join('\n\n---\n\n')
    );
    setIsCompileDialogOpen(true);
  };

  return (
    <main className="page">
      <PageShell
        title="Standalone Editor"
        description="Phase 1 extraction in progress: standalone React Flow canvas is running."
      />
      <section className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select value={nextNodeType} onChange={(event) => setNextNodeType(event.target.value)}>
            {nodeCatalog.map((node) => (
              <option key={node.type} value={node.type}>
                {node.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => addNode(nextNodeType)}>
            Add Node
          </button>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search nodes"
            aria-label="search-nodes"
          />
          <input
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
            aria-label="workflow-name"
          />
          <button type="button" onClick={handleSave}>
            Save (IndexedDB)
          </button>
          <button type="button" onClick={handleRefresh}>
            Refresh List
          </button>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Select workflow</option>
            {savedWorkflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleLoad}>
            Load
          </button>
          <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
          <select
            value={target}
            onChange={(event) =>
              setTarget(event.target.value as 'claude' | 'openai-assistants' | 'portable-json')
            }
          >
            <option value="claude">.claude</option>
            <option value="openai-assistants">OpenAI Assistants</option>
            <option value="portable-json">Portable JSON</option>
          </select>
          <button type="button" onClick={handleCompile}>
            Compile
          </button>
        </div>
        <WorkflowCanvas searchTerm={searchTerm} />
      </section>
      <CompilePreviewDialog
        open={isCompileDialogOpen}
        onOpenChange={setIsCompileDialogOpen}
        content={compilePreview}
      />
    </main>
  );
}
