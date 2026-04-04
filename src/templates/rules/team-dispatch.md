# Team Dispatch Protocol

## When to Use Teams

Use **solo dispatch** (default) when:
- Task fits one domain (e.g., "write tests" → QA agent alone)
- Research with a single output
- Simple implementation

Use **team dispatch** when:
- **Two domains must inform each other** — e.g., builder + tester iterate together
- **Build + test loop** — one agent writes code, another tests it, they iterate
- **Research + documentation** — researcher gathers findings, writer converts to docs
- **Implementation + review** — one implements, another audits

## How Teams Work

1. **Introduce yourself** — send your partner a message with your understanding and approach
2. **Discuss before executing** — agree on who does what (2-3 exchanges max)
3. **Split the work** — don't duplicate effort
4. **Share findings** — send discoveries immediately, don't wait
5. **Review each other** — draft goes to partner before final output

## Message Format

```
[team] Hey {partner}, {your message}
```

Keep messages short (under 100 words). Link to files instead of pasting content.

## Proven Team Patterns

### TDD Loop (Builder + Tester)
Builder writes code → Tester runs tests → reports pass/fail → Builder fixes → repeat until green.

### Build + Validate (Builder + Data Expert)
Builder proposes approach → Expert checks against real data → Expert corrects before shipping.

### Research + Documentation (Researcher + Writer)
Researcher gathers intelligence → Writer converts to structured docs → Researcher reviews for accuracy.

### Implement + Review (Builder + Auditor)
Builder implements → Auditor reviews for quality → Builder fixes → Auditor confirms.

## Anti-Patterns

- Don't loop forever discussing — 2-3 exchanges then execute
- Don't both write the same file — split ownership
- Don't route every message through the orchestrator — talk directly
