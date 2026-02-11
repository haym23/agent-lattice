# Agent Lattice Learning Site

A comprehensive 6-page educational resource teaching the theory, philosophy, and architecture behind Agent Lattice.

## Pages

1. **Why Agent Lattice Exists** (`page1-why-agent-lattice.jsx`)
   - The intent problem and why expressing intent is hard
   - Cost & reliability trap with current LLM workflows
   - Real user needs across different personas
   - The paradigm shift that Agent Lattice enables

2. **Programs, Not Prompts** (`page2-programs-not-prompts.jsx`)
   - Design philosophy: system does thinking, model fills blanks
   - Workflows as programs (nodes, edges, state, validators)
   - Deterministic control flow without model involvement
   - Explicit state management via runtime namespaces
   - Validation & repair making small models reliable

3. **Blocks → IR → Runtime** (`page3-blocks-ir-runtime.jsx`)
   - The three-layer architecture (UI Blocks, PlanIR, ExecIR)
   - How each layer serves a distinct purpose
   - End-to-end data flow from user action to runtime execution
   - Why this separation makes reliability possible

4. **Intent Compilation Layer** (`page4-intent-compilation.jsx`)
   - Advanced internals: block fusion, reasoning traces
   - Model routing and tier assignment strategies
   - Runtime optimization and execution semantics
   - *(Existing architecture-v2.jsx content)*

5. **Reliability & Transparency** (`page5-reliability-transparency.jsx`)
   - Event streaming (SSE) for real-time visibility
   - Deterministic replay and recovery mechanisms
   - Observable execution vs black-box systems
   - How transparent failure handling builds trust

6. **Vision & Roadmap** (`page6-vision-roadmap.jsx`)
   - Migration story: from VSCode extension constraints
   - The 10-step journey to standalone platform
   - Current MVP goals and development status
   - Future hardware vision (LatticeBox, MicroLattice)

## Architecture

### Shared Components (`components.jsx`)
- Color palette (C) and font families (F) constants
- Reusable UI components: Badge, Section, Pre, InfoBox, Clr
- PageContainer wrapper with consistent styling

### Navigation (`Navigation.jsx`)
- Top navigation bar with 6 page tabs
- Previous/Next buttons for sequential reading
- Current page title display
- Hover states and visual feedback

### Main Entry (`main.jsx`)
- React app with state management for current page
- Page routing logic
- Integration of all 6 page components
- Site header and description

## Build & Deploy

```bash
# Development
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run pages:deploy
```

The site builds to `dist/` and can be deployed to GitHub Pages at:
https://haym23.github.io/agent-lattice/

## Design System

- **Dark theme** with professional color palette
- **Typography**: Space Grotesk (display), DM Sans (sans), JetBrains Mono (code)
- **Components**: Consistent spacing, border radius, and color usage
- **Responsive**: Max-width 780px for readability
- **Accessible**: Semantic HTML, keyboard navigation support

## Content Philosophy

Each page follows the principle:
- **Breadth over speed**: Rich, comprehensive content
- **Quality over completion**: Well-explained concepts
- **Conceptual over technical**: Focus on understanding, not implementation
- **Visual aids**: Code blocks, diagrams, comparisons, callouts
- **Progressive narrative**: Each page builds on the previous

## File Structure

```
learning/
├── src/
│   ├── components.jsx              # Shared UI components
│   ├── Navigation.jsx              # Page navigation component
│   ├── main.jsx                   # App entry point
│   ├── page1-why-agent-lattice.jsx
│   ├── page2-programs-not-prompts.jsx
│   ├── page3-blocks-ir-runtime.jsx
│   ├── page4-intent-compilation.jsx    # Existing architecture content
│   ├── page5-reliability-transparency.jsx
│   └── page6-vision-roadmap.jsx
├── index.html                  # HTML template
├── package.json                # Dependencies
├── vite.config.js             # Vite configuration
└── README.md                   # This file
```

## Content Sources

All content is derived from:
- `docs/README.md` - Project overview and problem statement
- `notes/runtime/lre.md` - Runtime philosophy and architecture
- `notes/runtime/lir.md` - IR specification and design
- `notes/runtime/compiler.md` - Compiler architecture
- `apps/server/README.md` - Event streaming and observability
- `notes/migration-from-plugin/` - Migration story and rationale
- `notes/FEATURES.md` - Roadmap and vision
- `notes/hardware/` - Hardware deployment plans

## License

Same license as parent Agent Lattice project.
