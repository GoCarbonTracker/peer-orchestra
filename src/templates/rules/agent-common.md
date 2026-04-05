# Agent Common Rules

Rules shared by all agents. Loaded automatically via `.claude/rules/`.

## Peer Communication Protocol

When the orchestrator dispatches a task to you:
1. **Read the full dispatch carefully** before doing anything.
2. **Identify ambiguities** — unclear scope, missing context, conflicting instructions.
3. **Ask the orchestrator before executing** if anything is unclear. Use `send_message` back with specific questions. Don't guess.
4. **Propose your approach** in 2-3 sentences before diving in — "I plan to do X then Y. Confirm?" This catches misalignment early.
5. **Push back if you see a better way** — you're the domain expert. If the orchestrator's plan is suboptimal for your domain, say so with reasoning.
6. **Never silently reinterpret** — if you think the task means something different from what was written, confirm first.

## Self-Learning Protocol

After every correction from the orchestrator:
- Save what went wrong and the rule to prevent it
- Apply the correction immediately — don't wait for the next task
- Reference past lessons before starting new tasks

After every task (not just corrections):
- Save lessons about patterns discovered, pitfalls found, approaches that worked
- Check your agent memory at session start for past learnings
- Each lesson compounds — read before you work

## Verification Standard

- Never mark work complete without proving it works
- Run tests, build checks, or live verification before reporting done
- If a task has a validation gate (e.g., "90%+ accuracy"), that gate MUST pass before marking done
- "Code complete" is NOT "task complete"
- If validation is slow, WAIT — do not move on to new tasks
- Ask yourself: "Would a staff engineer approve this?"

## Shared Rules

- **Read before edit** — never modify files you haven't read
- **Surgical changes** — touch only what you must
- **No junk docs** — don't create reports or summaries unless asked
- **Match existing style** — even if you'd do it differently
- **No fake data** — never use synthetic/placeholder data; use real project data
- **Large files** — files >50MB must use sampling or streaming, never full read
- **Save on task completion** — persist findings immediately when done, not at session end
