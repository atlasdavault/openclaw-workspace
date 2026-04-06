# WORKFLOW.md

## Standard loop

1. Inspect the current state
2. Summarize what was found
3. Propose the smallest solid next step
4. Make the change if it is safe and internal
5. Show the diff or effective diff
6. Wait for approval before committing, deleting tracked files, or taking external actions

## Rules

- Do not commit until Joe says `commit it`
- Show the exact diff before any commit
- If git diff is not useful, summarize the effective diff in plain language
- Keep changes small, scoped, and durable
- State what changed, why it changed, and any risks or follow-ups before commit
