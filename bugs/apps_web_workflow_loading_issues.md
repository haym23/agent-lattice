# Workflow Loading Issues

On the UI, there is some choppy behavior with how the UI loads workflows. It is unclear statuses of saved workflows, and saved workflows make duplicates. Make the saving, loading, deleting and modifying UX easier

**Questions:**
- What is IndexedDB?
- What does refresh list do? Does it update IndexedDB
- What does load do?
- Does saving check for duplicates?
- Does workflow name get loaded in right when workflow is initialized?

**Affected:**
- apps/web needs updates to interface
- Workflow header should be more user friendly
- Divide actions better, show loading and saving workflow separate from compiling new prompt

---

### Agent

This section is for LLM agent notes. Keep a record of what you have accomplished for this bug. Make a TODO list and update it as items are completed, tested, and verified.