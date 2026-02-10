# Workflow Header Enhancements

The workflow header works for basic operations. 

- Needs to be more user friendly
  - Add clean animations
  - Clear divisions of actions
- Nodes need to draw user attention
  - Icons for easy identification
  - Short description for clarity
- Better LLM model picking interface
  - Give short preview on the model
  - Show logo

---

### Agent

This section is for the LLM agent. Based on the description earlier, integrate the feature into apps/web. It should pass all of the requirements listed, with lint, typecheck and tests all passing. Log the TODO list here:

- [x] Audit existing editor header, node card, and model registry wiring in `apps/web`
- [x] Run broad search pass (explore/librarian + Grep/rg/ast-grep) for internal/external patterns
- [x] Redesign workflow header controls into clearly separated action sections
- [x] Add clean UI motion (header entrance + hover/selection transitions)
- [x] Improve node attention in canvas (status pulse + short description visibility)
- [x] Upgrade model picker UX with provider logo badge and concise model previews
- [x] Extend model metadata/types to support richer picker display
- [x] Update tests for model metadata changes
- [x] Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` in `apps/web` successfully
