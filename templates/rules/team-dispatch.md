# Team Dispatch Protocol

## When to Use Teams

Use **solo dispatch** (default) when:
- Task fits one domain (e.g., "write tests" -> QA agent alone)
- Research with a single output
- Simple implementation

Use **team dispatch** when:
- **Two domains must inform each other** — e.g., builder + tester iterate together
- **Build + test loop** — one agent writes code, another tests it, they iterate
- **Research + documentation** — researcher gathers findings, writer converts to docs
- **Implementation + review** — one implements, another audits

**Rule of thumb:** If agent A will need to ask "does this look right?" or "what did you find?" before they can finish, it's a team task.

The orchestrator should announce team dispatches: "Dispatching {A} + {B} as a team on {task}."

## How Teams Work

When the orchestrator dispatches you as part of a **team**, you'll receive a dispatch with a `TEAM` block:

```
TEAM: {partner_persona} at peer {partner_id}
ROLE: {your role in the team}
```

1. **Introduce yourself** — send your partner a message: who you are, what you understand the task to be, and your proposed approach.
2. **Discuss before executing** — don't start work until you and your partner agree on approach. 2-3 exchanges max, not 10.
3. **Split the work** — agree on who does what. Don't duplicate effort. Example: "I'll analyze the data, you write the sprint plan."
4. **Share findings** — when you discover something relevant to your partner, send it immediately. Don't wait until you're done.
5. **Review each other** — before writing the final output, send your draft to your partner for a quick check.
6. **Joint output** — one peer writes the final file, the other reviews and confirms.

## Message Format

```
[team] Hey {partner}, {your message}
```

Keep messages short (under 100 words). Link to files instead of pasting content.

## When to Escalate to Orchestrator

- You and your partner disagree and can't resolve in 2 exchanges
- The task scope changed and needs orchestrator input
- One partner is unresponsive (no reply after 1 message)

## Proven Team Patterns

### TDD Loop (Builder + Tester)
Builder writes code -> Tester runs tests -> reports pass/fail with error details -> Builder fixes -> repeat until green. Both confirm to orchestrator when done.

### Build + Validate (Builder + Data Expert)
Builder proposes approach with estimated numbers -> Expert runs live queries to ground-truth -> Expert corrects before plan ships. For validation: Builder runs pipeline, Expert spot-checks output against source data.

### Research + Documentation (Researcher + Writer)
Researcher gathers intelligence -> Writer converts to structured docs -> Researcher reviews for accuracy.

### Implement + Review (Builder + Auditor)
Builder implements -> Auditor reviews for quality -> Builder fixes -> Auditor confirms.

## Anti-Patterns

- Don't loop forever discussing — 2-3 exchanges then execute
- Don't both write the same file — split ownership
- Don't route every message through the orchestrator — talk directly
