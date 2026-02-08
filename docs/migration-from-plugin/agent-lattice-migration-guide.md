# Agent Lattice — Code Migration Guide

**Extracting cc-wf-studio into a Standalone Web Application**

> *This document is a detailed, step-by-step guide for the single most critical task in the Agent Lattice project: extracting the React Flow canvas and core workflow logic from the VSCode extension shell into a standalone Vite-powered web application. This is Priority #1 because every future feature — multi-model compilation, the execution runtime, collaboration, the plugin system — depends on this foundation being clean and correct.*

---

## 1. Understanding the Current Architecture

Before touching any code, you need to understand how cc-wf-studio is structured. It's a VSCode extension, which means it runs as two separate processes that communicate via message passing. This is the fundamental constraint you're removing.

### 1.1 The Two-Process Model

Every VSCode extension with a UI operates as two isolated processes. The Extension Host is a Node.js process that has access to the file system, the VSCode API, child processes (like Claude Code CLI), and the operating system. The Webview is an isolated Chromium iframe that renders the UI — it has zero direct access to files, the terminal, or VSCode APIs. These two halves talk to each other exclusively through `postMessage`, a one-way asynchronous messaging channel.

| Process | Location in Repo | Runtime | Has Access To |
|---------|-----------------|---------|---------------|
| Extension Host | `src/extension/` | Node.js (VSCode) | File system, VSCode API, child_process (Claude CLI), MCP SDK, OS |
| Webview (UI) | `src/webview/src/` | Chromium iframe | React, React Flow canvas, Zustand stores, DOM — nothing else |
| Shared Types | `src/shared/` | Both (compile-time) | TypeScript interfaces for messages, node types, workflow schema |

The critical insight is this: the entire visual product — the canvas, the node palette, the property panel, the toolbar, the AI editing dialog — lives inside `src/webview/src/`. That's what users see and interact with. The extension host is just the plumbing that reads/writes files and calls external CLIs. Your job is to make the webview self-sufficient by replacing that plumbing with web-native alternatives.

### 1.2 The Message Bridge

The extension host and webview communicate through a typed `postMessage` protocol. When the webview needs to save a workflow, it sends a message like `SAVE_WORKFLOW` with the JSON payload. The extension host receives this, writes it to `.vscode/workflows/filename.json`, and sends back `SAVE_SUCCESS`. When the user clicks "Edit with AI," the webview sends `GENERATE_WORKFLOW`, the extension host spawns Claude Code CLI via `child_process`, captures the output, and sends back `GENERATION_SUCCESS` with the new workflow graph.

These message types are defined in `src/shared/` and include approximately 40–50 distinct message types covering workflow CRUD, AI generation, MCP tool discovery, Slack sharing, skill management, export, and more. Every single one of these message handlers is a seam you'll need to replace.

### 1.3 Key Files and Directories

| Path | What It Contains | Migration Action |
|------|-----------------|------------------|
| `src/extension/extension.ts` | Extension entry point, registers commands and webview provider | **DELETE** — replaced by Vite app entry |
| `src/extension/ai-generation.ts` | Claude Code CLI integration for AI workflow generation | **REWRITE** — becomes API call to Claude/GPT |
| `src/extension/workflow-*.ts` | File system read/write for `.vscode/workflows/*.json` | **REPLACE** — with IndexedDB storage service |
| `src/extension/export-*.ts` | Compiler that generates `.claude/agents/` and `.claude/commands/` | **EXTRACT** — core compiler logic moves to shared service |
| `src/extension/slack-*.ts` | Slack OAuth, sharing, import | **DEFER** — Phase 2 feature, skip for now |
| `src/extension/mcp-*.ts` | MCP server discovery and tool schema fetching | **REWRITE** — MCP client in browser or via proxy |
| `src/extension/skill-*.ts` | Skill file scanner and manager | **REPLACE** — with template/skill registry |
| `src/webview/src/components/` | All React components: canvas, nodes, panels, dialogs | **KEEP** — this is the product, copy it |
| `src/webview/src/stores/` | Zustand stores: workflow-store, ui-store, etc. | **KEEP** — core state management, minor refactor |
| `src/webview/src/i18n/` | 5-language translation system (690+ keys) | **KEEP** — migrate from `vscode.env.language` to browser |
| `src/webview/src/types/` | TypeScript types for nodes, workflows, etc. | **KEEP** — copy directly |
| `src/shared/` | Message types, node type definitions, workflow schema | **PARTIAL KEEP** — keep schema types, delete message types |
| `contracts/` | JSON Schema for workflow format | **KEEP** — becomes the canonical schema |
| `resources/` | Icons, images, demo GIFs | **KEEP** — some will need new Agent Lattice branding |

---

## 2. The Migration, Step by Step

This section walks through the migration in exact order. Don't skip ahead. Each step builds on the previous one, and each step has a clear "done" checkpoint where you can verify it worked before moving on.

---

### Step 1: Scaffold the Vite Project

Create a brand new Vite + React + TypeScript project. Do not try to convert the existing extension project in place — it's cleaner to start fresh and copy things in.

```bash
npm create vite@latest agent-lattice -- --template react-ts
cd agent-lattice
npm install
npm install reactflow zustand immer
npm install -D tailwindcss @tailwindcss/vite
```

Verify it runs with `npm run dev` and you see the default Vite welcome page. This is your new home. Everything from cc-wf-studio gets pulled into this project.

> **✅ CHECKPOINT 1**
> - Fresh Vite + React + TypeScript project runs on `localhost:5173`
> - React Flow, Zustand, Immer, and Tailwind are installed
> - You can see the default Vite page in your browser

---

### Step 2: Copy the Webview Source

From the cc-wf-studio repo, copy the entire contents of `src/webview/src/` into your new project's `src/` directory. Also copy `src/shared/` as `src/shared/`. This gives you all the React components, Zustand stores, types, and i18n strings.

Your new project structure should look like this:

```
agent-lattice/
  src/
    components/          ← from src/webview/src/components/
    stores/              ← from src/webview/src/stores/
    i18n/                ← from src/webview/src/i18n/
    types/               ← from src/webview/src/types/
    hooks/               ← from src/webview/src/hooks/ (if exists)
    shared/              ← from src/shared/
    App.tsx              ← new entry point
    main.tsx             ← Vite entry
```

At this point your project will not compile. That's expected. The copied code is full of references to the VSCode postMessage bridge. The next three steps systematically remove those dependencies.

> **⚠️ CHECKPOINT 2**
> - All webview source files are copied into the new project
> - `src/shared/` types are available
> - TypeScript shows many errors — this is expected and correct

---

### Step 3: Create the VSCode Shim Layer

This is the most important architectural decision in the entire migration. Instead of hunting down every `postMessage` call and rewriting it individually (there are dozens), you create a single abstraction layer that intercepts all communication and routes it to web-native implementations.

#### 3a. Identify the Communication Interface

In the cc-wf-studio webview code, find how messages are sent. It will be something like:

```typescript
// Typical pattern in cc-wf-studio webview code
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'SAVE_WORKFLOW', payload: workflowData });
```

Or it might be wrapped in a utility function. Either way, trace every call site where the webview sends or receives messages from the extension host. Create a list — this is your migration checklist.

#### 3b. Build the Platform Adapter

Create a service layer that provides the same interface the webview expects, but implements it using web-native APIs instead of `postMessage`. This is the pattern:

```typescript
// src/services/platform-adapter.ts

export interface PlatformAdapter {
  // Workflow persistence
  saveWorkflow(id: string, data: WorkflowData): Promise<void>;
  loadWorkflow(id: string): Promise<WorkflowData>;
  listWorkflows(): Promise<WorkflowMeta[]>;
  deleteWorkflow(id: string): Promise<void>;

  // Compilation / Export
  compileWorkflow(graph: WorkflowGraph, target: string): Promise<string>;

  // AI features
  generateWorkflow(prompt: string, model: string): Promise<WorkflowData>;
  refineWorkflow(workflow: WorkflowData, instruction: string): Promise<WorkflowData>;

  // Model Context Protocol
  discoverMcpTools(): Promise<McpToolSchema[]>;
}
```

```typescript
// src/services/web-adapter.ts
// Implements PlatformAdapter using IndexedDB, fetch, etc.

export class WebPlatformAdapter implements PlatformAdapter {
  async saveWorkflow(id, data) {
    // IndexedDB instead of file system
    await db.workflows.put({ id, ...data, updatedAt: Date.now() });
  }
  async compileWorkflow(graph, target) {
    // In-browser compiler (no CLI needed)
    return compiler.emit(graph, target);
  }
  // ... etc
}
```

This pattern is powerful because it also lets you build a `VSCodePlatformAdapter` later that uses the original postMessage approach — meaning you could offer Agent Lattice as both a web app AND a VSCode extension sharing the same UI code.

#### 3c. Wire It Into the Stores

The Zustand stores in `src/stores/` are where the webview currently calls `postMessage`. Replace those calls with calls to the `PlatformAdapter`. Use React context or a simple module-level singleton to inject the adapter:

```typescript
// src/stores/workflow-store.ts (before)
save: () => { vscode.postMessage({ type: 'SAVE_WORKFLOW', payload: get().workflow }); }

// src/stores/workflow-store.ts (after)
save: async () => { await platform.saveWorkflow(get().id, get().workflow); }
```

> **✅ CHECKPOINT 3**
> - `PlatformAdapter` interface is defined with all message types covered
> - `WebPlatformAdapter` implements the interface with stubs (can return mock data)
> - All `postMessage` calls in stores/components replaced with adapter calls
> - TypeScript compiles with zero errors (even if runtime features are stubbed)

---

### Step 4: Implement IndexedDB Storage

The extension host currently reads and writes workflow JSON to `.vscode/workflows/*.json` on the local file system. In the web app, you replace this with IndexedDB, a browser-native database that persists across sessions.

```bash
npm install idb
```

The `idb` library provides a clean Promise-based wrapper around the raw IndexedDB API. Create a database schema:

```typescript
// src/services/database.ts
import { openDB } from 'idb';

const db = await openDB('agent-lattice', 1, {
  upgrade(db) {
    const workflows = db.createObjectStore('workflows', { keyPath: 'id' });
    workflows.createIndex('updatedAt', 'updatedAt');
    workflows.createIndex('name', 'name');
    db.createObjectStore('settings', { keyPath: 'key' });
    db.createObjectStore('templates', { keyPath: 'id' });
  }
});
```

Then implement the workflow CRUD methods in `WebPlatformAdapter` using this database. At this point, you can save and load workflows in the browser. Export them as JSON download for backup.

> **✅ CHECKPOINT 4**
> - Can create a workflow on the canvas, save it, refresh the page, and load it back
> - Workflow list shows all saved workflows with names and timestamps
> - Can export a workflow as a `.json` file download
> - Can import a workflow from a `.json` file

---

### Step 5: Get the Canvas Rendering

This is the moment of truth. With the adapter wired in and storage working, the React Flow canvas should render. But you'll likely hit issues with:

- **Missing CSS:** The webview had styles injected by VSCode's theme system (CSS variables like `--vscode-editor-background`). Create a theme file that provides Agent Lattice's own design tokens for these variables. A quick approach: search the copied CSS for any `--vscode-*` variables and map each one to a Tailwind color or a custom CSS variable.

- **Missing vscode API calls:** Some components might call `acquireVsCodeApi()` directly or reference `window.vscode`. Create a global shim that no-ops these calls or redirects them to your adapter.

- **Node component registration:** React Flow needs node types registered. The current code registers custom node types (`PromptNode`, `SubAgentNode`, `ConditionalNode`, `McpToolNode`, `SkillNode`). Make sure the `nodeTypes` object is properly assembled and passed to the `ReactFlow` component.

- **Webview READY handshake:** The cc-wf-studio webview sends a `WEBVIEW_READY` message on mount, and the extension host responds with initial state. Replace this with a simple `useEffect` that loads the last-used workflow from IndexedDB on app mount.

> **✅ CHECKPOINT 5**
> - The React Flow canvas renders in the browser at full viewport
> - Can drag nodes from the palette onto the canvas
> - Can connect nodes with edges
> - Can click a node and see the property panel
> - The toolbar renders with Save, Load, Export buttons functional

---

### Step 6: Extract and Refactor the Compiler

The compiler is the code that takes a workflow graph and produces output files. In cc-wf-studio, it lives across `src/extension/export-*.ts` and outputs `.claude/agents/` and `.claude/commands/` Markdown files. This logic must be extracted into a pure function that runs in the browser.

#### 6a. Isolate the Compiler Logic

Copy the export files from `src/extension/` into a new directory: `src/compiler/`. Strip out any Node.js-specific code (`fs.writeFile`, `path.join`) and any VSCode API calls. What remains should be pure TypeScript that transforms a workflow graph into a string.

#### 6b. Define the Target Interface

```typescript
// src/compiler/types.ts

export interface CompilerTarget {
  id: string;                    // 'claude' | 'openai' | 'portable'
  name: string;                  // 'Claude Code (agents/commands)'
  description: string;
  compile(graph: AnalyzedGraph, model: ModelConfig): CompilerOutput;
}

export interface CompilerOutput {
  files: { path: string; content: string; }[];   // Generated file(s)
  preview: string;                                // Human-readable preview
  warnings: string[];                             // Compatibility notes
}
```

#### 6c. Implement the Claude Target

Your first target is the existing `.claude` output format. Take the export logic you extracted and wrap it in a class that implements `CompilerTarget`. This should be a near-direct port of the existing code with file system calls removed.

#### 6d. Add Graph Analysis

Before any target can compile, the graph needs to be analyzed: topological sort (execution order), cycle detection, dependency resolution, unreachable node detection. This analysis is target-independent and runs once, then each target receives the analyzed graph.

```typescript
// src/compiler/analyzer.ts

export function analyzeGraph(nodes: Node[], edges: Edge[]): AnalyzedGraph {
  const sorted = topologicalSort(nodes, edges);
  const cycles = detectCycles(nodes, edges);
  const unreachable = findUnreachable(nodes, edges);
  return { nodes, edges, executionOrder: sorted, cycles, unreachable };
}
```

> **✅ CHECKPOINT 6**
> - Compiler is a pure TypeScript module with zero Node.js or VSCode dependencies
> - Can compile a simple workflow to `.claude` format in the browser
> - Output matches what cc-wf-studio would have generated for the same workflow
> - Graph analyzer catches cycles and unreachable nodes with warnings

---

### Step 7: Replace the AI Integration

cc-wf-studio generates and refines workflows by spawning Claude Code CLI as a child process via Node.js `child_process.exec()`. This obviously doesn't work in a browser. You need to replace it with direct API calls.

For Phase 1, the simplest approach is to have the user provide their own API key (stored in the browser's encrypted storage) and make direct calls to the Claude or OpenAI API from the frontend. This avoids needing a backend.

#### 7a. Build the AI Service

```typescript
// src/services/ai-service.ts

export class AiService {
  constructor(private apiKey: string, private model: string) {}

  async generateWorkflow(description: string, schema: object): Promise<WorkflowData> {
    // 1. Build the system prompt with the workflow JSON schema
    // 2. Send the user's description as the user message
    // 3. Parse the JSON response into WorkflowData
    // 4. Validate against the schema
    // (Reuse the existing prompt construction from ai-generation.ts)
  }
}
```

The prompt construction logic from `src/extension/ai-generation.ts` is valuable — it includes the workflow schema, available skills, and formatting instructions. Extract this into a reusable prompt builder that works with any LLM.

#### 7b. API Key Management

For Phase 1, store API keys in browser memory only (never `localStorage` for security). Show a settings dialog where the user enters their Claude API key and/or OpenAI API key. In Phase 2, when you add a backend, the keys move to server-side encrypted storage and API calls go through your backend proxy.

> **✅ CHECKPOINT 7**
> - Can enter an API key in settings
> - Can type a workflow description and get a generated workflow on the canvas
> - Can select a node and use "refine with AI" to modify it
> - Works with at least one model (Claude Sonnet or GPT-4o)

---

### Step 8: Fix i18n

The current i18n system detects the language from `vscode.env.language`. Replace this with browser-native language detection:

```typescript
const browserLang = navigator.language.split('-')[0]; // 'en', 'ja', 'ko', 'zh'
const supportedLocales = ['en', 'ja', 'ko', 'zh-CN', 'zh-TW'];
const locale = supportedLocales.includes(browserLang) ? browserLang : 'en';
```

The 690+ translation keys and 5 locale files can be used as-is. Just change how the initial locale is detected and add a language picker to the settings UI so users can override the auto-detection.

> **✅ CHECKPOINT 8**
> - UI language auto-detects from browser settings
> - Language picker in settings works
> - All 690+ translation keys render correctly
> - Switching language updates the entire UI without reload

---

### Step 9: Styling Overhaul

The copied components use a mix of inline styles and VSCode CSS variables. Replace these with Tailwind CSS and a cohesive Agent Lattice design system.

- **Phase 9a — Quick pass:** Search for all `--vscode-*` CSS variables. Create a CSS file that maps each one to an Agent Lattice color token. This gets things looking reasonable fast.
- **Phase 9b — Component by component:** Migrate each component to Tailwind classes. Start with the most visible: toolbar, node palette sidebar, property panel, and node components on the canvas.
- **Phase 9c — Radix UI:** The project already migrated dialogs to Radix UI. Continue this pattern for all interactive primitives (dropdowns, tooltips, tabs, toasts).

> **✅ CHECKPOINT 9**
> - No `--vscode-*` CSS variables remain in the codebase
> - Consistent Agent Lattice color palette, typography, and spacing throughout
> - Dark mode support via Tailwind's `dark:` variants
> - All interactive elements use Radix UI primitives

---

### Step 10: Add Routing and App Shell

cc-wf-studio was a single panel inside VSCode. As a standalone app, you need basic navigation:

```bash
npm install react-router
```

| Route | View | Purpose |
|-------|------|---------|
| `/` | Dashboard | List saved workflows, create new, import |
| `/editor/:id` | Workflow Editor | The canvas — this is the main cc-wf-studio UI |
| `/settings` | Settings | API keys, language, theme, model preferences |
| `/templates` | Template Library | Browse and clone starter workflows |

The editor route is where the React Flow canvas lives. The dashboard is new and shows a grid or list of saved workflows. Keep it simple — a card for each workflow with name, last modified date, node count, and an "Open" button.

> **✅ CHECKPOINT 10**
> - Can navigate between dashboard, editor, settings, and templates
> - Dashboard shows all saved workflows as cards
> - Clicking a workflow card opens it in the editor
> - Creating a new workflow navigates to a blank editor
> - Browser back/forward works correctly

---

## 3. What to Explicitly Defer

The following features exist in cc-wf-studio but should NOT be migrated in the first pass. They're either tightly coupled to VSCode, not critical for launch, or will be rebuilt differently in later phases.

| Feature | Why Defer | When to Revisit |
|---------|-----------|-----------------|
| Slack sharing/import | Requires OAuth server, complex auth flow. Rebuild in Phase 2 with proper backend. | Phase 2 |
| Claude Code CLI execution | Browser can't spawn child processes. Replaced by direct API calls (Step 7). | Already replaced |
| Copilot/Roo Code export | VSCode-specific extension APIs. Rebuild as compiler targets in Phase 2. | Phase 2 |
| Run workflow in IDE | Requires VSCode Extension API commands. Replaced by web-based execution runtime. | Phase 2 |
| MCP server auto-discovery | Reads from local Claude Code config files. Rebuild as manual MCP config or proxy. | Phase 2 |
| Skill file scanning | Reads from `~/.claude/skills/` and `.claude/skills/`. Replace with template registry. | Phase 1 (late) |
| VSCode commands/menus | Extension-only feature. Not applicable to web app. | Never (web equivalent is keyboard shortcuts) |
| Extension marketplace publishing | No longer relevant. Replaced by web deployment. | Never |

---

## 4. Risk Map

These are the things most likely to go wrong during the migration, ranked by probability and impact.

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `postMessage` calls scattered throughout components (not just stores) | High | High | Grep the entire codebase for `postMessage`, `acquireVsCodeApi`, and `vscode.` before starting. Build a complete inventory. |
| React Flow version incompatibility after upgrade | Medium | High | Pin React Flow to the exact version cc-wf-studio uses (check `package.json`). Upgrade later in a separate PR. |
| Zustand store shapes assume VSCode file system paths | Medium | Medium | Audit every store for path manipulation (`path.join`, `path.resolve`). Replace with abstract IDs. |
| Inline styles referencing VSCode theme tokens | High | Low | Non-blocking — things render, just ugly. Fix progressively in Step 9. |
| MCP tool schemas unavailable without local config | High | Medium | For Phase 1, allow manual MCP server URL entry. Auto-discovery comes in Phase 2. |
| AI generation prompts depend on local skill scanning | Medium | Medium | Strip skill references from prompt for Phase 1. Add template-based skill injection later. |

---

## 5. You're Done When

The migration is complete when all of the following are true:

> **✅ Migration Complete Checklist**
> - [ ] The app runs as a standalone web page with `npm run dev` (no VSCode required)
> - [ ] Zero imports from `vscode` or `@types/vscode` in the entire codebase
> - [ ] Can create, edit, save, load, and delete workflows entirely in the browser
> - [ ] The React Flow canvas renders identically to the original cc-wf-studio
> - [ ] The compiler produces `.claude` format output matching the original
> - [ ] At least one AI feature works (generate or refine workflow via API call)
> - [ ] i18n works in all 5 supported languages
> - [ ] All interactive elements are accessible (keyboard nav, screen reader labels)
> - [ ] The app builds for production with `npm run build` and serves from a static host

*This checklist is your north star. Every time you're unsure what to work on next, pick the first unchecked item. When they're all checked, you have a working Agent Lattice and you're ready for Phase 2.*
