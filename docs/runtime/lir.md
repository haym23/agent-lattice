# Lattice IR Requirements

This document defines the requirements for **Lattice IR (LIR)**, including:

* the split between **PlanIR** and **ExecIR**
* the minimum fields needed for deterministic execution
* how IR supports **stateful “memory” via runtime state**, not model context
* how to compile from **UI blocks → IR → per-node LLM prompts**

The central design goal is:

> **Make small, cheap, fast models reliable by shifting intelligence into structure, validation, and runtime state.**

---

## Goals

### Functional goals

* Represent workflows as **typed graphs** (nodes + edges)
* Support deterministic control flow (branching, loops) without LLM involvement
* Support tool calls, LLM calls, and deterministic transforms in one program model
* Enable variable passing (“memory”) between distant nodes via runtime state
* Enable validation, repair, and escalation policies per node

### Non-goals

* IR is not a user-facing prompt language
* IR is not itself sent wholesale to LLMs for execution
* IR is not intended to be hand-authored by most users (UI/SDK generate it)

---

## Concepts

### Three layers (recommended)

1. **Workflow Graph JSON (Authoring AST)**

   * produced by the UI builder
   * focused on ergonomics and editing

2. **PlanIR (Optional, Semantic Plan)**

   * a high-level plan describing *what should happen*
   * used when the user’s intent is vague or when auto-planning is desired

3. **ExecIR (Required, Executable Program)**

   * deterministic, validated runtime program
   * what the Lattice Runtime Environment (LRE) executes

Only ExecIR is required to run.

---

## PlanIR vs ExecIR

### PlanIR (semantic, high-level)

**Purpose:** Describe the intended sequence of actions in a human-meaningful way.

**When to use:**

* the user gives a goal, not an explicit workflow
* you want an “AI planner” to draft a workflow
* you want reusable templates generated from intent

**Characteristics:**

* coarse-grained steps
* references user goals/constraints
* not necessarily runnable
* may omit detailed tool arguments

**Example PlanIR**

```json
{
  "planir_version": "1.0",
  "goal": "Email Sarah to confirm meeting time and attach last week’s doc",
  "constraints": {
    "timezone": "America/New_York",
    "tone": "friendly",
    "send": true
  },
  "steps": [
    {
      "id": "S1",
      "type": "EXTRACT_INTENT",
      "inputs": { "text": "$in.user_message" },
      "outputs": { "intent": "$vars.intent" }
    },
    {
      "id": "S2",
      "type": "FIND_CONTACT",
      "inputs": { "name": "$vars.intent.recipient_name" },
      "outputs": { "contact": "$vars.contact" }
    },
    {
      "id": "S3",
      "type": "FIND_ATTACHMENT",
      "inputs": { "hint": "$vars.intent.attachment_hint" },
      "outputs": { "attachment": "$vars.attachment" }
    },
    {
      "id": "S4",
      "type": "DRAFT_AND_SEND_EMAIL",
      "inputs": {
        "contact": "$vars.contact",
        "intent": "$vars.intent",
        "attachment": "$vars.attachment"
      },
      "outputs": { "receipt": "$vars.receipt" }
    }
  ]
}
```

### ExecIR (executable, runtime)

**Purpose:** Precisely define what the runtime will execute.

**Characteristics:**

* explicit nodes and edges
* strict variable references
* deterministic control flow
* per-node validators, retry/repair, escalation
* tool calls have concrete args schemas

**Key rule:**

> ExecIR must run without requiring an LLM to “understand the program.”

**Example ExecIR (small excerpt)**

```json
{
  "execir_version": "1.0",
  "entry_node": "N_extract",
  "nodes": [
    {
      "id": "N_extract",
      "op": "LLM_EXTRACT",
      "model_class": "SMALL_EXEC",
      "prompt_template": "extract_intent_v1",
      "inputs": { "text": "$in.user_message" },
      "output_schema": "ExtractedIntent",
      "outputs": { "result": "$vars.intent" },
      "validators": [
        { "type": "json_schema", "schema": "ExtractedIntent" }
      ],
      "retry_policy": { "strategy": "PATCH_JSON_FROM_ERROR", "max_attempts": 2 },
      "escalation": { "on": ["schema_failure"], "to_model_class": "MEDIUM_PLAN" }
    }
  ],
  "edges": [
    { "from": "N_extract", "to": "N_contacts", "when": { "op": "always" } }
  ]
}
```

---

## IR Requirements (Must-Haves)

### 1) Versioning

* `workflow_version`, `planir_version`, and `execir_version` must be present
* runtime must support migration or rejection with clear errors

### 2) Deterministic graph structure

* `nodes[]` with unique `id`
* `edges[]` with `from`, `to`, and deterministic `when`
* `entry_node` for ExecIR

### 3) Explicit state references (the “memory” model)

All cross-step memory is represented as variables and references.

#### Namespaces

* `$vars.*` durable run state
* `$tmp.*` ephemeral state
* `$ctx.*` read-only runtime metadata
* `$in.*` read-only trigger input

#### Requirement

* Nodes must declare **inputs** and **outputs** referencing these namespaces
* Runtime must resolve these references and store results

### 4) Deterministic control flow (no LLM)

* `when` must be evaluable by runtime without model calls
* recommended as a JSON AST expression language

### 5) Operation types (ops)

ExecIR must support both deterministic and LLM-based ops.

Minimum v1 ops:

* Deterministic: `TOOL_CALL`, `PACK`, `MERGE`, `SWITCH`, `MAP`
* LLM: `LLM_EXTRACT`, `LLM_CLASSIFY`, `LLM_CHOOSE`, `LLM_WRITE`

### 6) Validation and repair

Every LLM node must have:

* `output_schema`
* `validators[]`
* `retry_policy`

Validators must support at least:

* JSON Schema validation
* invariants (e.g., chosen id must be one of candidates)

Repair must:

* generate a structured **repair packet**
* re-run with a “fix-only” prompt

### 7) Prompt template binding

Each LLM node must bind to a known **prompt template**

* templates are “compiler intrinsics” (owned by the platform)
* user prompts can exist, but must compile into safe templates

### 8) Input projection and trimming

LLM nodes must support deterministic input shrinking:

* `pick` selected fields
* `truncate_items`, `truncate_chars`

This prevents context bloat and preserves small-model reliability.

### 9) Escalation policies

LLM nodes must be able to specify:

* which failures trigger escalation
* to which `model_class`

Escalation must be deterministic.

---

## How IR Provides “Memory” Without LLM Context

LLMs do not provide reliable cross-call memory.

LRE provides memory by:

1. Storing node outputs into runtime state (`$vars.*`)
2. Injecting selected state fields into later prompts as inputs

This is **real program memory**, not context-window memory.

### Example: early “sub-agent” → late “sub-agent” handoff

* Early node writes `$vars.research_packet`
* Later node reads `$vars.research_packet` (or a packed projection)

The LLM does not “remember.” The runtime passes data.

---

## End-to-End Flow: UI Blocks → ExecIR → LLM Prompting

Below is a concrete example showing the entire lowering pipeline.

### Scenario

User wants:

> “Email Sarah: meeting next Tuesday at 2:30, attach last week’s doc.”

---

## Step A — UI Blocks (Authoring Graph)

A minimal block flow:

1. Extract intent
2. Search contacts
3. Choose contact
4. Search attachments
5. Choose attachment
6. Pack context
7. Draft email
8. Send email

Example authoring JSON (UI-friendly):

```json
{
  "workflow_version": "1.0",
  "nodes": [
    { "id": "extract", "type": "extract_intent", "in": "user_message" },
    { "id": "contact_search", "type": "tool", "tool": "contacts.search" },
    { "id": "contact_choose", "type": "choose" },
    { "id": "attach_search", "type": "tool", "tool": "drive.search" },
    { "id": "attach_choose", "type": "choose" },
    { "id": "pack", "type": "pack" },
    { "id": "draft", "type": "write" },
    { "id": "send", "type": "tool", "tool": "gmail.send" }
  ],
  "edges": [
    { "from": "extract", "to": "contact_search" },
    { "from": "contact_search", "to": "contact_choose" },
    { "from": "contact_choose", "to": "attach_search" },
    { "from": "attach_search", "to": "attach_choose" },
    { "from": "attach_choose", "to": "pack" },
    { "from": "pack", "to": "draft" },
    { "from": "draft", "to": "send" }
  ]
}
```

This is not yet executable.

---

## Step B — Lowering to ExecIR

The compiler resolves each UI block into:

* a concrete `op`
* explicit `inputs` and `outputs` state references
* schemas, validators, retry policies
* deterministic edges with `when`

Example ExecIR (simplified but realistic):

```json
{
  "execir_version": "1.0",
  "entry_node": "N_extract",
  "nodes": [
    {
      "id": "N_extract",
      "op": "LLM_EXTRACT",
      "model_class": "SMALL_EXEC",
      "prompt_template": "extract_intent_v1",
      "inputs": { "text": "$in.user_message" },
      "output_schema": "ExtractedIntent",
      "outputs": { "result": "$vars.intent" },
      "validators": [
        { "type": "json_schema", "schema": "ExtractedIntent" }
      ],
      "retry_policy": { "strategy": "PATCH_JSON_FROM_ERROR", "max_attempts": 2 }
    },

    {
      "id": "N_contacts",
      "op": "TOOL_CALL",
      "tool": "contacts.search",
      "args": { "query": "$vars.intent.recipient_name" },
      "outputs": { "result": "$tmp.contacts" }
    },

    {
      "id": "N_choose_contact",
      "op": "LLM_CHOOSE",
      "model_class": "SMALL_EXEC",
      "prompt_template": "choose_contact_v1",
      "inputs": {
        "candidates": { "ref": "$tmp.contacts.results", "pick": ["id", "name", "email"] }
      },
      "output_schema": "ChoiceById",
      "outputs": { "result": "$tmp.contact_choice" },
      "validators": [
        { "type": "json_schema", "schema": "ChoiceById" },
        { "type": "invariant", "expr": "$out.id in $in.candidates[*].id" }
      ],
      "retry_policy": { "strategy": "PATCH_JSON_FROM_ERROR", "max_attempts": 2 }
    },

    {
      "id": "N_search_attach",
      "op": "TOOL_CALL",
      "tool": "drive.search",
      "args": { "query": "$vars.intent.attachment_hint" },
      "outputs": { "result": "$tmp.attachments" }
    },

    {
      "id": "N_choose_attach",
      "op": "LLM_CHOOSE",
      "model_class": "SMALL_EXEC",
      "prompt_template": "choose_attachment_v1",
      "inputs": {
        "candidates": { "ref": "$tmp.attachments.results", "pick": ["id", "title", "modified_time"] }
      },
      "output_schema": "ChoiceById",
      "outputs": { "result": "$tmp.attachment_choice" },
      "validators": [
        { "type": "json_schema", "schema": "ChoiceById" }
      ]
    },

    {
      "id": "N_pack",
      "op": "PACK",
      "inputs": {
        "intent": "$vars.intent",
        "contact": "$tmp.contact_choice",
        "attachment": "$tmp.attachment_choice",
        "tz": "$ctx.timezone"
      },
      "projection": {
        "intent": ["meeting_time_iso", "message"],
        "contact": ["id"],
        "attachment": ["id", "title"],
        "tz": []
      },
      "outputs": { "result": "$vars.handoff_packet" }
    },

    {
      "id": "N_draft",
      "op": "LLM_WRITE",
      "model_class": "SMALL_EXEC",
      "prompt_template": "draft_email_v1",
      "inputs": { "handoff": "$vars.handoff_packet" },
      "output_schema": "EmailDraft",
      "outputs": { "result": "$vars.email_draft" },
      "validators": [
        { "type": "json_schema", "schema": "EmailDraft" }
      ],
      "retry_policy": { "strategy": "PATCH_JSON_FROM_ERROR", "max_attempts": 2 }
    },

    {
      "id": "N_send",
      "op": "TOOL_CALL",
      "tool": "gmail.send",
      "args": {
        "to": "$vars.handoff_packet.contact.email",
        "subject": "$vars.email_draft.subject",
        "body": "$vars.email_draft.body",
        "attachments": ["$vars.handoff_packet.attachment.id"]
      },
      "outputs": { "result": "$vars.receipt" }
    }
  ],

  "edges": [
    { "from": "N_extract", "to": "N_contacts", "when": { "op": "always" } },
    { "from": "N_contacts", "to": "N_choose_contact", "when": { "op": "always" } },
    { "from": "N_choose_contact", "to": "N_search_attach", "when": { "op": "always" } },
    { "from": "N_search_attach", "to": "N_choose_attach", "when": { "op": "always" } },
    { "from": "N_choose_attach", "to": "N_pack", "when": { "op": "always" } },
    { "from": "N_pack", "to": "N_draft", "when": { "op": "always" } },
    { "from": "N_draft", "to": "N_send", "when": { "op": "always" } }
  ]
}
```

Notice how "memory" is achieved:

* `N_extract` writes `$vars.intent`
* later nodes read `$vars.intent.*`
* `N_pack` creates `$vars.handoff_packet`
* `N_draft` reads `$vars.handoff_packet`

No model must remember prior context.

---

## Step C — Per-node prompt compilation (what the LLM sees)

The runtime does **not** send ExecIR to the LLM.

Instead, for `N_choose_contact`, it compiles a micro-prompt using the template `choose_contact_v1` and the resolved inputs.

### Resolved inputs (after projection)

```json
{
  "candidates": [
    { "id": "C1", "name": "Sarah A", "email": "sarah.a@company.com" },
    { "id": "C2", "name": "Sarah B", "email": "sarah.b@company.com" }
  ]
}
```

### Compiled prompt payload (conceptual)

* System rules: JSON only, no extra keys
* Allowed IDs: C1, C2
* Output schema: `ChoiceById`

The model returns:

```json
{ "id": "C2" }
```

The runtime validates:

* schema matches
* `id` is in candidate ids

If invalid, it generates a **repair packet**:

```json
{
  "error": "id must be one of candidate ids",
  "allowed_ids": ["C1", "C2"],
  "previous_output": { "id": "C9" }
}
```

Then it re-prompts with “fix only this.”

---

## Linking data for stateful behavior (“runtime memory”)

### Requirements for linking fields across nodes

ExecIR must support:

* output references (`outputs`) to write to the state store
* input references (`inputs`) to read from the state store
* deterministic transforms (`PACK`, `MERGE`) to reshape state

This creates stable “memory objects,” such as:

* `$vars.intent`
* `$vars.research_packet`
* `$vars.handoff_packet`

These objects can be passed to later nodes without re-sending full transcripts.

### Recommended pattern: Handoff packets

Use `PACK` near the boundary between sub-agents:

* early sub-agent produces detailed state
* pack into a compact, validated object
* late sub-agent consumes the compact handoff

This keeps prompts small and model behavior stable.

---

## PlanIR → ExecIR (how planning integrates)

When PlanIR is used:

1. PlanIR is generated (optionally by a planner model)
2. The compiler lowers PlanIR steps into concrete ExecIR nodes
3. Missing details (schemas, templates, validators) are filled in by the platform

Important: even if PlanIR is produced by an LLM, **ExecIR must be validated deterministically** before execution.

### Example: lowering a PlanIR step

PlanIR:

```json
{ "type": "FIND_CONTACT", "inputs": { "name": "$vars.intent.recipient_name" } }
```

ExecIR expansion:

* `TOOL_CALL contacts.search`
* if multiple candidates, `LLM_CHOOSE`
* invariants: chosen id must exist

---

## Minimum Schema Set (Recommended)

### Workflow Graph schema

* node ids and edges valid
* block types valid
* ports compatible

### ExecIR schema

* node op shapes valid
* references valid (`$vars`, `$tmp`, `$ctx`, `$in`)
* validators are well-formed
* retry policies legal

### Output schemas

At minimum:

* `ExtractedIntent`
* `ChoiceById`
* `EmailDraft`

(These can be extended per integration.)

---

## Safety and determinism requirements

* `when` conditions must never require an LLM
* tool invocations must be allowlisted
* output schemas and invariants must be enforced for every LLM node
* repair retries must be bounded (`max_attempts`)
* escalation must be explicit (no implicit “try bigger model”) unless configured

---

## Summary

* **PlanIR** is optional and describes intent at a semantic level.
* **ExecIR** is required and is the deterministic, schema-validated program the runtime executes.
* The runtime provides “memory” through explicit state (`$vars`, `$tmp`) and data linking (input/output refs), not via LLM context.
* LLM calls are compiled into **micro-prompts per node** using templates, projections, schemas, validators, and repair packets.
* This structure enables small models to behave reliably while keeping cost and latency low.
