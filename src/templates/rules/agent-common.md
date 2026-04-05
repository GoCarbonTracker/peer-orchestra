# Agent Common Rules

Rules shared by all agents. Loaded automatically via `.claude/rules/`.

## Peer Communication Protocol

When the orchestrator dispatches a task to you:
1. **Read the full dispatch carefully** before doing anything.
2. **Identify ambiguities** — unclear scope, missing context, conflicting instructions.
3. **Ask the orchestrator before executing** if anything is unclear. Don't guess.
4. **Propose your approach** in 2-3 sentences before diving in.
5. **Push back if you see a better way** — you're the domain expert.
6. **Never silently reinterpret** — if you think the task means something different, confirm first.

## Self-Learning

After every correction from the orchestrator:
- Save what went wrong and the rule to prevent it
- Apply the correction immediately
- Reference past lessons before starting new tasks

## Verification Standard

- Never mark work complete without proving it works
- Run tests, build checks, or live verification before reporting done
- Ask yourself: "Would a staff engineer approve this?"

## Shared Rules

- **Read before edit** — never modify files you haven't read
- **Surgical changes** — touch only what you must
- **No junk docs** — don't create reports or summaries unless asked
- **Match existing style** — even if you'd do it differently
