# Agent Lattice

## Overview

### **Goal:**

To simplify the way we create and interact with LLM models, giving us the ability to make ultra high fidelity agents.

### **Problem Statement:**

Users are not perfect in their instructions, and LLMs pay the price. They misuse words, give conflicting tasks, and don't utilize proper spelling and grammar. They don't properly convey what is important, and what their idea of "acceptable" looks like. This results in LLMs wasting time and context trying to figure out what they mean. Every person in their own head knows what they're talking about, but sometimes there are parts that get lost in translation between your brain and what you give the LLM.

### **Solution:**

Standardize interactions taking place with LLM agents by giving users drag and drop boxes to wire together. Blocks take in parameterized input, then get converted to intermediate processing types, and eventually outputted as a structured LLM prompt.

Each block is built on a node. A node is the smallest unit of data accessible to the user at runtime, before it begins its transformation into a prompt. The runtime wires nodes together, and injects a section to the prompt outlining to the LLM the flow between nodes. This allows the LLM to easily jump around the context and execute tasks.

This gives a way to make the information exchange between humans and LLMs consistent. Easier interface leads to a better definition of *intent*. Well defined intent leads to better results. This increased fidelity of agents means you can build any kind of personal assistant. While LLM interfaces like ChatGPT are limited to a chat interface, this would allow integrations with all of your tools. 

Whether its learning a new hobby or becoming a rockstar at work, your solution is just a few building blocks away.


## Directory Structure

```
apps/
|   ├ web/
|   ├ server/
|   └ worker/
packages/
|   ├ compiler/
|   |   ├ analyzer.ts
|   |   ├ pipeline.ts
|   |   ├ emitters/
|   |   └ lower/
|   ├ ir/
|   ├ llm/
|   ├ models/
|   ├ nodes/
|   ├ prompts/
|   |   ├ registry.ts
|   |   ├   types.ts
|   |   └ templates/
|   |     ├ llm-write-v1.ts
|   |     ├ llm-classify-v1.ts
|   |     └ repair.ts
|   ├ runtime/
|   └ workflow/

```

---

## Section Descriptions

### `adapters`

### `apps`

Main containerized applications live here

### `web`

The UI of the site. Handles workflow creation through connected blocks.

Block Data -> IR stages -> Prompt Template Injection

### `packages`

Shared code between apps.

#### `compiler`

Critical logical layer of the Agent Lattice framework. This is the transformation pipeline that converts the visual workflow to low-level execution plans (IR). UI calls the `compileWorkflow` function to begin compilation. Contains the following components:

[**`analyzer`:**](packages/compiler/analyzer.test.ts) is for checking logical flow between blocks. It sorts nodes, ensures valid node/edge connections, and verifies no infinite loops.

[**`pipeline`:**](packages/compiler/pipeline.ts) takes the validated block config and preps it for conversion to IR.

[**`lower`:**](packages/compiler/lower/) This is where the transformation to IR takes place. Nodes are mapped to operations and assigned a prompt template. It adds validation and test where applicable (as defined by the block). From sorted nodes -> fragments -> executable IR.

[**`emitters`**](packages/compiler/emitters/): Outputs compiled results to different ingestion types. Includes outputs for Claude, OpenAI, and JSON.

#### `ir`

IR stands for "Intermediate Representation" and defines the data structures used by a compiler to represent source code. In our case, the ExecIR is the lowest level of data structure that will be used, this is the last convertable unit before prompt template generation.

#### `llm`

Definition of the LLM providers. OpenAI and MockProvider are defined currently. Prompt is passed to OpenAI models through `OpenAIProvider`.

#### `models`

Definition of the specific models available for blocks. For MVP, models will apply to entire workflow. In the future, investigate the concept of task-based model assignment for individual (or groups of) blocks.

#### `nodes`

Nodes are the smallest units that can be used in workflows. This directory gives a catalog of all of the different node types that are used during prompt compilation.

##### `prompts`

Prompts are broken down into templates that the compiler is able to read and inject. This is where the matching for prompts takes place.

**Current templates include:**

- llm-write-v1
- llm-classify-v1
- repair

##### `runtime`

Internal components that make up the execution of the runtime engine. This is the heart of the Agent Lattice framework. This takes the output of the compiler and converts to our LLM "bytecode" (prompt). The output from the compiler is expected as a [`ExecProgram`](packages/ir/types.ts#L141), our IR format.

Made up of:

- [`escalation-engine.ts`](packages/runtime/escalation-engine.ts)
- [`prompt-compiler.ts`](packages/runtime/prompt-compiler.ts)
  - Generates final prompt to be sent to LLM
  - Replaces {{placeholders}} with actual values
  - Applies projections to fields
  - Resolves state references to actual values
- [`repair-engine.ts`](packages/runtime/repair-engine.ts)
  - Build in retry policy
- [`runner.ts`](packages/runtime/runner.ts)
  - Responsible for ingesting compiler output
  - Orchestrates 
  - Executes the IR
- [`state-store.ts`](packages/runtime/state-store.ts)
  - Manages variables across the workflow
  - Accessed by `prompt-compiler` during prompt generation
  - Made up of four namespaces
    - `$vars`: Mutable workflow variables
    - `$tmp`: Temporary values
    - `$ctx`: Read-only context (execution metadata)
    - `$in`: Read-only input parameters
  - **Dot notation paths:** `state.get("$vars.user.name")`
  - Listeners can subscribe to state changes
- [`tool-executor.ts`](app/src/core/runtime/tool-executor.ts)
- [`validator.ts`](app/src/core/runtime/validator.ts)
  - Adds JSON schema validations

#### `workflow`

### `features`

UI features for the main site. Includes all React UI content. Routes for features defined in [`app`](#app).

#### `dashboard`

#### `editor`

#### `settings`

#### `shared`

#### `templates`

### `services`

---

## Notes

### Use Cases

- Developer: Well structured workflows could replace APIs. Run cheap models with lots of validation and coverage and you have replaced the need for a backend API
- Busy Mom: Organize dinner plans between family. Send a text in the morning, family deliberates, short summary and shopping list is ready for when mom goes to grocery store after work.
- Young Professional: A busy employee takes a call while driving to meet a customer. The entire meeting is summarized and waiting in his notes by the time he is back to the office.
- Developer: Come in Monday morning, have a flow to summarize Jira tasks for the sprint and give suggested solution. Using a series of templates and AI tools, you make workflows for each task in just a few hours. Once workflows are approved they can be run and you can have PRs ready by the time you're back from lunch
- Fantasy Diehard: You love fantasy football, but live a busy life and don't have time to check all the news. Automatically get NFL news from RSS feeds, then place waiver claims through Sleeper API. You also get automated trade ideas based on team and player news.

### Good MCPs

- **Google Maps, Gmail, Calendar, etc:** Connect to any Google app
- **Reddit:** Search through Reddit quickly for ideas
- **Sleeper:** Fantasy football
- **Context7:** Code formatting and standards

---

## Resources
- [Vercel AI SDK](https://ai-sdk.dev/)
  - For streaming LLM events as they happen
  - Used in workflow tracking and debugging
- [CC Workflow Studio](https://breaking-brake.com/)
  - Inspiration behind block-based prompt building
  - Forked repo to begin Agent Lattice

---

## Stack
- Typescript
- UI: Vite React
- Linter: Biome
- Package Manager: pnpm

## Inspirations

- [n8n](https://n8n.io/): Visual workflow building
- [Scratch](https://scratch.mit.edu/): Block semantics
- [LangChain/LangGraph](https://www.langchain.com/langgraph): LLM primitives and linking
- [Temporal](https://temporal.io/): Workflow tracking and state resiliance
- [CrewAi](https://www.crewai.com/open-source): Multi-agent orchestration framework

---
---
---

# Claude Code Workflow Studio (Deprecated)

<p align="center">
  <a href="https://github.com/haym23/agent-lattice/stargazers"><img src="https://img.shields.io/github/stars/haym23/agent-lattice" alt="GitHub Stars" /></a>
  <a href="https://snyk.io/test/github/haym23/agent-lattice"><img src="https://snyk.io/test/github/haym23/agent-lattice/badge.svg" alt="Known Vulnerabilities" /></a>
  <a href="https://open-vsx.org/extension/haym23/agent-lattice"><img src="https://img.shields.io/open-vsx/v/haym23/agent-lattice?label=OpenVSX" alt="OpenVSX" /></a>
  <a href="https://deepwiki.com/haym23/agent-lattice"><img src="https://img.shields.io/badge/Ask-DeepWiki-009485" alt="Ask DeepWiki" /></a>
</p>

<p align="center">
  <img src="./resources/hero.png" alt="CC Workflow Studio" width="800">
</p>

<p align="center">
  <strong>Accelerate Claude Code/GitHub Copilot<a href="#github-copilot-support">(※1)</a>/OpenAI Codex<a href="#openai-codex-support">(※2)</a>/Roo Code<a href="#roo-code-support">(※3)</a> automation with a visual workflow editor</strong>
</p>

<p align="center">
  Design complex AI agent workflows by conversing with AI – or use intuitive drag-and-drop. Build Sub-Agent orchestrations and conditional branching with natural language, then export directly to <code>.claude</code> format.
</p>

---

<!-- AI Edit Demo GIF: PR Code Review Workflow -->
<p align="center">
  <img src="./resources/demo_edit_with_ai.gif" alt="AI-Assisted Workflow Creation Demo - PR Code Review" width="800">
</p>

<p align="center">
  <em>✨ Edit with AI: Create a PR code review workflow with MCP, Skills, and conditional branching – All with natural language</em>
</p>

---

<!-- Run Workflow Demo GIF -->
<p align="center">
  <img src="./resources/demo_run_workflow.gif" alt="Run Workflow Demo - Execute workflows directly from the editor" width="800">
</p>

<p align="center">
  <em>▶️ Run workflows directly from the editor – See your AI automation in action instantly</em>
</p>

---

## Key Features

🔀 **Visual Workflow Editor** - Intuitive drag-and-drop canvas for designing AI workflows without code

✨ **Edit with AI** - Iteratively improve workflows through conversational AI - ask for changes, add features, or refine logic with natural language feedback

⚡ **One-Click Export & Run** - Export workflows to ready-to-use formats and run directly from the editor:
  - **Claude Code**: `.claude/agents/` and `.claude/commands/`
  - **GitHub Copilot Chat**<a href="#github-copilot-support">(※1)</a>: `.github/prompts/`
  - **GitHub Copilot CLI**<a href="#github-copilot-support">(※1)</a>: `.github/skills/`
  - **OpenAI Codex CLI**<a href="#openai-codex-support">(※2)</a>: `.codex/skills/`
  - **Roo Code**<a href="#roo-code-support">(※3)</a>: `.roo/skills/`

<span id="github-copilot-support">🤖</span> **GitHub Copilot Support (※1 β)** - Export & Run workflows to Copilot Chat or Copilot CLI, and use Copilot as AI provider for Edit with AI.

  **Note:**
  - Enable **Copilot** option in Toolbar's **More** menu to activate
  - Requires [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) extension or [Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli) to be installed
  - Experimental feature; some workflows may not work as expected

<span id="openai-codex-support">🤖</span> **OpenAI Codex CLI Support (※2 β)** - Export & Run workflows to Codex CLI (Skills format).

  **Note:**
  - Enable **Codex** option in Toolbar's **More** menu to activate
  - Requires [Codex CLI](https://github.com/openai/codex) to be installed
  - Experimental feature; some workflows may not work as expected

<span id="roo-code-support">🤖</span> **Roo Code Support (※3 β)** - Export & Run workflows to Roo Code (Skills format). Run launches Roo Code directly via Extension API.

  **Note:**
  - Enable **Roo Code** option in Toolbar's **More** menu to activate
  - Requires [Roo Code](https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline) extension to be installed
  - Experimental feature; some workflows may not work as expected

## How to Use

### Launch the Extension

- Click the <img src="./resources/icon.png" alt="icon" height="16" style="vertical-align: middle"> icon in the top-right corner of the editor
- Or: Command Palette (`Cmd+Shift+P`) → **"CC Workflow Studio: Open Editor"**

### Create a Workflow

- Add nodes from the palette and configure their settings, or use [Edit with AI](#edit-with-ai).

### Save & Load

- Click Save <img src="./resources/icon-save.png" alt="save" height="16" style="vertical-align: middle"> button in the toolbar to store your workflow as `.vscode/workflows/*.json`
- Click Load <img src="./resources/icon-file-down.png" alt="load" height="16" style="vertical-align: middle"> button in the toolbar to open a saved `.json` workflow

### Export & Run

- Click Export <img src="./resources/icon-export.png" alt="export" height="16" style="vertical-align: middle"> button in the toolbar to create a `.md` slash command or agent skill (use `/workflow-name` in AI coding agents)
- Click Run <img src="./resources/icon-play.png" alt="run" height="16" style="vertical-align: middle"> button in the toolbar to run your workflow directly in AI coding agents

### Edit with AI

- Click Edit with AI <img src="./resources/icon-sparkles.png" alt="sparkles" height="16" style="vertical-align: middle"> button in the toolbar to generate or refine workflows with natural language

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0-or-later).

See the [LICENSE](./LICENSE) file for the full license text.

### What this means

- You can use, modify, and distribute this software
- If you modify and deploy this software (including as a network service), you must:
  - Make your modified source code available under AGPL-3.0
  - Provide access to the source code for users interacting with the service
- Commercial use is allowed, but proprietary modifications are not

Copyright (c) 2025 breaking-brake

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=haym23/agent-lattice&type=Date)](https://star-history.com/#haym23/agent-lattice&Date)

## Acknowledgments

Built with [React Flow](https://reactflow.dev/) • Powered by [Claude Code](https://claude.com/claude-code) • Inspired by [Dify](https://dify.ai/)

---
