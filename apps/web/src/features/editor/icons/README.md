# Node Icons

SVG assets for standalone workflow node types.

- `nodes/`: raw SVG files grouped by semantic usage.
- `nodeTypeIconMap.ts`: canonical mapping from `WorkflowNodeType` to icon asset.

When adding a new node type, add/update an SVG in `nodes/` and extend `nodeTypeIconMap.ts`.
