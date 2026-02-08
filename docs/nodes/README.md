# Node Types

This document describes every node type currently available in the workflow editor.

Each section includes:
- Description: what the node does
- Invocation: how to add/configure it in the UI
- Example: minimal workflow node object

## Table of Contents

- [Node Types](#node-types)
  - [Table of Contents](#table-of-contents)
  - [Start (`start`)](#start-start)
  - [End (`end`)](#end-end)
  - [Prompt (`prompt`)](#prompt-prompt)
  - [Sub-Agent (`subAgent`)](#sub-agent-subagent)
  - [Ask User Question (`askUserQuestion`)](#ask-user-question-askuserquestion)
  - [If/Else (`ifElse`)](#ifelse-ifelse)
  - [Switch (`switch`)](#switch-switch)
  - [Skill (`skill`)](#skill-skill)
  - [MCP Tool (`mcp`)](#mcp-tool-mcp)
  - [Flow (`flow`)](#flow-flow)
  - [Codex (`codex`)](#codex-codex)
  - [Legacy Branch (`branch`)](#legacy-branch-branch)
  - [🔬 Researched Node Types (Not Yet Implemented)](#-researched-node-types-not-yet-implemented)
    - [Parallel Execution (`parallel`)](#parallel-execution-parallel)
    - [HTTP Request (`httpRequest`)](#http-request-httprequest)
    - [Data Transformer (`dataTransform`)](#data-transformer-datatransform)
    - [Delay (`delay`)](#delay-delay)
    - [Webhook Trigger (`webhookTrigger`)](#webhook-trigger-webhooktrigger)
    - [Variable Store (`variableStore`)](#variable-store-variablestore)
    - [Code Executor (`codeExecutor`)](#code-executor-codeexecutor)
    - [Batch Iterator (`batchIterator`)](#batch-iterator-batchiterator)
- [Node Definition](#node-definition)
  - [Required Fields](#required-fields)
  - [Structured Data Fields](#structured-data-fields)
  - [Source of Truth](#source-of-truth)

## Start (`start`)

Description:
- Workflow entry point.
- A workflow must contain exactly one Start node.
- Start has no input ports and one output port.

Invocation:
- In main workflow editing, Start is present by default when the canvas/store is initialized.
- In Sub-Agent Flow creation, Start is created automatically when you add a Sub-Agent Flow reference.

Example:

```json
{
  "id": "start-node-default",
  "type": "start",
  "name": "Start",
  "position": { "x": 100, "y": 200 },
  "data": { "label": "Start" }
}
```

## End (`end`)

Description:
- Workflow exit point.
- A workflow must contain at least one End node.
- End has no output ports.

Invocation:
- Click the `End` button in Node Palette.
- In Sub-Agent Flow creation, one End node is created automatically in the new flow skeleton.

Example:

```json
{
  "id": "end-1730000000000",
  "type": "end",
  "name": "End",
  "position": { "x": 600, "y": 200 },
  "data": { "label": "End" }
}
```

## Prompt (`prompt`)

Description:
- Defines prompt/instruction text used in the workflow.
- Supports template variables.

Invocation:
- Click `Prompt` in Node Palette.
- Configure prompt text and optional `variables` in node properties.

Example:

```json
{
  "id": "prompt-1730000000001",
  "type": "prompt",
  "name": "Prompt",
  "position": { "x": 350, "y": 200 },
  "data": {
    "label": "Prompt",
    "prompt": "Summarize {{topic}} in 3 bullets.",
    "variables": { "topic": "release notes" }
  }
}
```

## Sub-Agent (`subAgent`)

Description:
- Delegates a step to an AI sub-agent.
- Supports model override, tool constraints, color, and memory scope.

Invocation:
- Click `Sub-Agent` in Node Palette.
- Fill required `description` and `prompt`.
- Optional: set `model`, `tools`, `memory`, and `color`.

Example:

```json
{
  "id": "agent-1730000000002",
  "type": "subAgent",
  "name": "Implementation Agent",
  "position": { "x": 250, "y": 100 },
  "data": {
    "description": "Implement migration task",
    "prompt": "Migrate the selected workflow path.",
    "model": "sonnet",
    "memory": "project",
    "outputPorts": 1
  }
}
```

## Ask User Question (`askUserQuestion`)

Description:
- Captures a user decision with 2-4 options.
- Can be used for branching paths.

Invocation:
- Click `Ask User Question` in Node Palette.
- Provide `questionText` and at least 2 options.

Example:

```json
{
  "id": "question-1730000000003",
  "type": "askUserQuestion",
  "name": "Select Strategy",
  "position": { "x": 250, "y": 300 },
  "data": {
    "questionText": "Which migration strategy should we use?",
    "options": [
      { "label": "Parallel app", "description": "Build in apps/standalone" },
      { "label": "In-place", "description": "Modify existing runtime" }
    ],
    "outputPorts": 2
  }
}
```

## If/Else (`ifElse`)

Description:
- Two-way branching node.
- Always exactly 2 branches and 2 outputs.

Invocation:
- Click `If/Else` in Node Palette.
- Set `evaluationTarget` and two branch conditions.

Example:

```json
{
  "id": "ifelse-1730000000004",
  "type": "ifElse",
  "name": "Check CI",
  "position": { "x": 250, "y": 250 },
  "data": {
    "evaluationTarget": "Standalone CI result",
    "branches": [
      { "label": "Pass", "condition": "All checks are green" },
      { "label": "Fail", "condition": "Any check failed" }
    ],
    "outputPorts": 2
  }
}
```

## Switch (`switch`)

Description:
- Multi-way branching for 2-10 paths.
- Must contain a default branch as the last branch.

Invocation:
- Click `Switch` in Node Palette.
- Configure `branches`; keep one `isDefault: true` branch last.

Example:

```json
{
  "id": "switch-1730000000005",
  "type": "switch",
  "name": "Target Export",
  "position": { "x": 250, "y": 280 },
  "data": {
    "evaluationTarget": "Selected target",
    "branches": [
      { "label": "Claude", "condition": "target == 'claude'", "isDefault": false },
      { "label": "OpenAI", "condition": "target == 'openai'", "isDefault": false },
      { "label": "Default", "condition": "Other cases", "isDefault": true }
    ],
    "outputPorts": 3
  }
}
```

## Skill (`skill`)

Description:
- Executes or loads a Claude Code Skill (`SKILL.md`).
- Output ports are fixed to 1.

Invocation:
- Click `Skill` in Node Palette to open Skill Browser dialog.
- Select skill and optional execution settings, then add node.

Example:

```json
{
  "id": "skill-1730000000006",
  "type": "skill",
  "name": "Run Skill",
  "position": { "x": 300, "y": 250 },
  "data": {
    "name": "ai-grep",
    "description": "Token-efficient local search",
    "scope": "project",
    "skillPath": ".claude/skills/ai-grep/SKILL.md",
    "validationStatus": "valid",
    "executionMode": "execute",
    "outputPorts": 1
  }
}
```

## MCP Tool (`mcp`)

Description:
- Calls an MCP server tool with typed parameters.
- Supports manual parameter config and AI-assisted config modes.

Invocation:
- Click `MCP` in Node Palette to open MCP Node dialog.
- Pick server, tool, and mode (`manualParameterConfig`, `aiParameterConfig`, or `aiToolSelection`).
- For generated workflows, prefer `manualParameterConfig`.

Example:

```json
{
  "id": "mcp-1730000000007",
  "type": "mcp",
  "name": "Open URL",
  "position": { "x": 300, "y": 250 },
  "data": {
    "mode": "manualParameterConfig",
    "serverId": "playwright",
    "toolName": "playwright_navigate",
    "toolDescription": "Navigate browser to URL",
    "parameters": [
      {
        "name": "url",
        "type": "string",
        "description": "Target URL",
        "required": true
      }
    ],
    "parameterValues": { "url": "https://example.com" },
    "validationStatus": "valid",
    "outputPorts": 1
  }
}
```

## Flow (`flow`)

Description:
- References and executes a reusable sub-agent flow definition.
- Output ports are fixed to 1.

Invocation:
- Click `Flow` in Node Palette.
- This creates a new sub-flow skeleton (Start + End) and enters sub-flow edit mode.
- The reference node points to `flowId` in root `flows` array.

Example:

```json
{
  "id": "flow-ref-1730000000008",
  "type": "flow",
  "name": "Validation Flow Ref",
  "position": { "x": 400, "y": 200 },
  "data": {
    "flowId": "validation-flow-1",
    "label": "Validation Flow",
    "description": "Validate request payload",
    "outputPorts": 1
  }
}
```

## Codex (`codex`)

Description:
- Represents an OpenAI Codex CLI agent step.
- Supports fixed or AI-generated prompt mode.

Invocation:
- Enable Codex beta feature.
- Click `Codex` in Node Palette to open Codex Node dialog.
- Configure prompt mode, model, reasoning level, and sandbox.

Example:

```json
{
  "id": "codex-1730000000009",
  "type": "codex",
  "name": "Codex Refactor",
  "position": { "x": 320, "y": 220 },
  "data": {
    "label": "Codex Refactor",
    "promptMode": "fixed",
    "prompt": "Refactor this module to reduce duplication.",
    "model": "gpt-5.2-codex",
    "reasoningEffort": "medium",
    "sandbox": "workspace-write",
    "outputPorts": 1,
    "skipGitRepoCheck": false
  }
}
```

## Legacy Branch (`branch`)

Description:
- Legacy branching node kept for backward compatibility.
- New workflows should use `ifElse` or `switch`.

Invocation:
- Click `Branch (Legacy)` in Node Palette.
- Use only when editing old workflows that still depend on this shape.

Example:

```json
{
  "id": "branch-1730000000010",
  "type": "branch",
  "name": "Legacy Branch",
  "position": { "x": 250, "y": 250 },
  "data": {
    "branchType": "conditional",
    "branches": [
      { "label": "True", "condition": "Condition passed" },
      { "label": "False", "condition": "Condition failed" }
    ],
    "outputPorts": 2
  }
}
```

---

## 🔬 Researched Node Types (Not Yet Implemented)

The following node types have been researched and designed but are not yet implemented in the workflow editor. They represent future capabilities that would enhance workflow automation.

### Parallel Execution (`parallel`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Executes multiple workflow branches concurrently.
- All branches must complete before proceeding to the next node.
- Useful for parallel API calls, concurrent file processing, or simultaneous sub-agent execution.
- Supports 2-10 parallel branches with individual timeout configuration.

Invocation (proposed):
- Click `Parallel` in Node Palette.
- Configure branch count (2-10) and optional per-branch timeout.
- Connect each output port to a parallel execution path.
- All paths must eventually converge to a single node.

Example:

```json
{
  "id": "parallel-1730000000011",
  "type": "parallel",
  "name": "Parallel Processing",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Parallel Execution",
    "branchCount": 3,
    "branchTimeouts": [30000, 60000, 30000],
    "failureStrategy": "wait-all",
    "outputPorts": 3
  },
  "in": {
    "trigger": { "kind": "from", "ref": "previous-node" }
  },
  "out": {
    "branch1": { "description": "First parallel path" },
    "branch2": { "description": "Second parallel path" },
    "branch3": { "description": "Third parallel path" }
  },
  "args": {
    "maxConcurrency": 3,
    "collectResults": true
  }
}
```

### HTTP Request (`httpRequest`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Makes HTTP/HTTPS requests to external APIs or webhooks.
- Supports GET, POST, PUT, PATCH, DELETE methods.
- Configurable headers, query parameters, and request body.
- Handles authentication (Bearer token, API key, Basic Auth).
- Response can be parsed as JSON, text, or binary.

Invocation (proposed):
- Click `HTTP Request` in Node Palette to open HTTP Request dialog.
- Configure method, URL, headers, and body.
- Set authentication type and credentials.
- Specify response format and error handling strategy.

Example:

```json
{
  "id": "http-1730000000012",
  "type": "httpRequest",
  "name": "Fetch User Data",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Fetch User Data",
    "method": "POST",
    "url": "https://api.example.com/users",
    "authentication": {
      "type": "bearer",
      "token": "{{env.API_TOKEN}}"
    },
    "headers": {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    "body": {
      "query": "{{userQuery}}"
    },
    "responseFormat": "json",
    "timeout": 30000,
    "retryStrategy": {
      "maxRetries": 3,
      "backoffMs": 1000
    },
    "outputPorts": 1
  },
  "in": {
    "userQuery": { "kind": "from", "ref": "query-builder" },
    "apiToken": { "kind": "var", "key": "env.API_TOKEN" }
  },
  "out": {
    "response": { "description": "API response data" }
  },
  "args": {
    "validateSSL": true,
    "followRedirects": true
  }
}
```

### Data Transformer (`dataTransform`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Transforms structured data using JSONPath, JMESPath, or custom JavaScript expressions.
- Supports filtering, mapping, aggregation, and reshaping operations.
- Can merge data from multiple sources into a single output.
- Useful for preparing data before passing to LLMs or external APIs.

Invocation (proposed):
- Click `Data Transformer` in Node Palette to open Data Transformer dialog.
- Select transformation type (JSONPath, JMESPath, or JavaScript).
- Configure input data sources and transformation logic.
- Preview transformation result before saving.

Example:

```json
{
  "id": "transform-1730000000013",
  "type": "dataTransform",
  "name": "Extract User Info",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Extract User Info",
    "transformationType": "jmespath",
    "expression": "users[?age > `25`].{name: name, email: email}",
    "fallbackValue": [],
    "outputPorts": 1
  },
  "in": {
    "sourceData": { "kind": "from", "ref": "api-response" },
    "filterAge": { "kind": "var", "key": "minAge" }
  },
  "out": {
    "transformedData": { "description": "Filtered and mapped user list" }
  },
  "args": {
    "validateSchema": true,
    "schemaRef": "@schemas/user-list.json"
  }
}
```

### Delay (`delay`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Pauses workflow execution for a specified duration.
- Supports milliseconds, seconds, minutes, hours, or dynamic delay from variables.
- Useful for rate limiting, scheduled tasks, retry backoff, or waiting for external processes.
- Can be configured with a specific timestamp for scheduled execution.

Invocation (proposed):
- Click `Delay` in Node Palette to open Delay dialog.
- Configure delay duration or specific execution timestamp.
- Optional: Set a message to display during the wait.

Example:

```json
{
  "id": "delay-1730000000014",
  "type": "delay",
  "name": "Wait 5 Minutes",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Wait 5 Minutes",
    "delayType": "duration",
    "duration": 300000,
    "unit": "milliseconds",
    "message": "Waiting for API rate limit reset...",
    "outputPorts": 1
  },
  "in": {
    "trigger": { "kind": "from", "ref": "api-call" },
    "dynamicDelay": { "kind": "var", "key": "retryBackoffMs" }
  },
  "out": {
    "continue": { "description": "Proceeds after delay completes" }
  },
  "args": {
    "allowCancel": true,
    "showProgressBar": true
  }
}
```

### Webhook Trigger (`webhookTrigger`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Receives incoming HTTP webhooks to trigger workflow execution.
- Generates a unique webhook URL for external services to call.
- Supports payload validation, authentication (HMAC, API key), and content negotiation.
- Can parse webhook payloads (JSON, form data, XML) and pass data to subsequent nodes.
- Ideal for GitHub webhooks, Slack events, payment notifications, or any external trigger.

Invocation (proposed):
- Click `Webhook Trigger` in Node Palette to open Webhook Trigger dialog.
- Configure authentication method and payload schema.
- Copy the generated webhook URL to external service.

Example:

```json
{
  "id": "webhook-1730000000015",
  "type": "webhookTrigger",
  "name": "GitHub Push Event",
  "position": { "x": 100, "y": 250 },
  "data": {
    "label": "GitHub Push Event",
    "webhookUrl": "https://workflows.example.com/webhook/abc123",
    "authentication": {
      "type": "hmac-sha256",
      "secretKey": "{{env.GITHUB_WEBHOOK_SECRET}}",
      "headerName": "X-Hub-Signature-256"
    },
    "payloadFormat": "json",
    "allowedMethods": ["POST"],
    "outputPorts": 1
  },
  "in": {},
  "out": {
    "payload": { "description": "Parsed webhook payload" },
    "headers": { "description": "Request headers" },
    "metadata": { "description": "Request metadata (timestamp, IP, etc.)" }
  },
  "args": {
    "validateSchema": true,
    "schemaRef": "@schemas/github-push-event.json",
    "responseStatus": 200,
    "responseBody": { "status": "accepted" }
  }
}
```

### Variable Store (`variableStore`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Stores and retrieves variables for use across workflow execution.
- Supports different scopes: workflow-local, session, persistent (across runs).
- Can set, get, update, or delete variables.
- Useful for passing data between disconnected workflow branches or maintaining state.
- Supports structured data (JSON) and primitive types (string, number, boolean).

Invocation (proposed):
- Click `Variable Store` in Node Palette to open Variable Store dialog.
- Configure operation (set, get, update, delete) and variable scope.
- Specify variable name and value (or source for get operations).

Example:

```json
{
  "id": "varstore-1730000000016",
  "type": "variableStore",
  "name": "Store API Token",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Store API Token",
    "operation": "set",
    "scope": "session",
    "variableName": "apiToken",
    "outputPorts": 1
  },
  "in": {
    "value": { "kind": "from", "ref": "auth-response" },
    "variableName": { "kind": "text", "value": "apiToken" }
  },
  "out": {
    "storedValue": { "description": "Confirmation of stored value" },
    "success": { "description": "Operation success status" }
  },
  "args": {
    "ttl": 3600000,
    "encrypt": true,
    "overwriteExisting": true
  }
}
```

### Code Executor (`codeExecutor`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Executes custom code snippets in sandboxed environments.
- Supports multiple languages: JavaScript, Python, Bash, TypeScript.
- Provides access to workflow variables and file system (with permissions).
- Can install dependencies via npm/pip/apt on-demand.
- Useful for custom logic, data processing, or integration with external tools not covered by other nodes.

Invocation (proposed):
- Click `Code Executor` in Node Palette to open Code Executor dialog.
- Select language and runtime version.
- Write or paste code snippet.
- Configure input variables and output extraction logic.

Example:

```json
{
  "id": "code-1730000000017",
  "type": "codeExecutor",
  "name": "Custom Data Parser",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Custom Data Parser",
    "language": "python",
    "runtime": "3.11",
    "code": "import json\n\ndata = json.loads(input_data)\nresult = [item['name'] for item in data if item['active']]\nreturn {'filtered': result}",
    "timeout": 30000,
    "outputPorts": 1
  },
  "in": {
    "inputData": { "kind": "from", "ref": "api-response" },
    "configFile": { "kind": "file", "path": "@config/parser.json" }
  },
  "out": {
    "result": { "description": "Code execution result" },
    "stdout": { "description": "Standard output" },
    "stderr": { "description": "Standard error" }
  },
  "args": {
    "sandboxMode": "strict",
    "allowNetworkAccess": false,
    "allowFileSystem": true,
    "workingDirectory": "/tmp/workflow",
    "dependencies": ["pandas", "numpy"]
  }
}
```

### Batch Iterator (`batchIterator`)

**Status**: 🔬 Researched - Not Yet Implemented

Description:
- Processes large lists or arrays in configurable batch sizes.
- Executes a sub-workflow for each batch with rate limiting support.
- Collects and aggregates results from all batches.
- Useful for processing large datasets without overwhelming APIs or memory.
- Supports sequential or parallel batch processing with error recovery.

Invocation (proposed):
- Click `Batch Iterator` in Node Palette to open Batch Iterator dialog.
- Configure batch size, processing mode (sequential/parallel), and rate limits.
- Connect to a sub-workflow or node that processes each batch.

Example:

```json
{
  "id": "batch-1730000000018",
  "type": "batchIterator",
  "name": "Process User List",
  "position": { "x": 300, "y": 250 },
  "data": {
    "label": "Process User List",
    "batchSize": 50,
    "processingMode": "sequential",
    "rateLimitMs": 1000,
    "outputPorts": 2
  },
  "in": {
    "items": { "kind": "from", "ref": "user-list" },
    "batchSize": { "kind": "var", "key": "maxBatchSize" }
  },
  "out": {
    "currentBatch": { "description": "Current batch being processed" },
    "onComplete": { "description": "Triggered when all batches complete" }
  },
  "args": {
    "aggregateResults": true,
    "continueOnError": true,
    "maxRetries": 3,
    "progressTracking": true,
    "maxConcurrentBatches": 3
  }
}
```

---

# Node Definition

## Required Fields

- `in`: named inputs
- `out`: named outputs
- `args`: node specific simple settings

## Structured Data Fields

Use these fields to standardize how data is read consumed by models

| Name | Description | Compiler |
| ---- | ----------- | -------- |
| `workflowref` | reference to another section of the workflow | Make markdown link to section [link](#link)
| `fileref` | reference to a file for context | Use @ |
| `cli` | run a CLI command | ```bash``` (is this the best way to do this?) |

---

## Source of Truth

- Type definitions: `src/shared/types/workflow-definition.ts`
- Node schema and examples: `resources/workflow-schema.json`
- UI node creation handlers: `src/webview/src/components/NodePalette.tsx`
- Runtime node registration: `src/webview/src/components/WorkflowEditor.tsx`
- Validation rules: `src/extension/utils/validate-workflow.ts`