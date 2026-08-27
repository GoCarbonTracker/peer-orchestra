# Agent Customization Guide

After `npx peer-orchestra init`, all agent files live in your project's `.claude/rules/` directory. You own them — modify anything.

---

## Modify an Agent's Personality

Edit `.claude/rules/agent-{name}.md` directly. Change the **Identity** line to adjust personality:

```markdown
**Identity:** Nahida, the data specialist. Curious but cautious — always verifies before acting.
```

Changes take effect in the next Claude Code session. No restart needed for already-open terminals — just start a new session.

## Add Domain-Specific Rules

Append rules to any agent's **Domain Rules** section:

```markdown
## Domain Rules

- Always use TypeScript strict mode
- Run `npm run lint` before marking work complete
- Never modify files in `src/legacy/` without explicit approval
```

These rules shape agent behavior for your specific project.

## Add a New Agent

1. Create `.claude/rules/agent-your-role.md` following the [persona file format](theme-creation-guide.md#agent-persona-file-format)
2. Add the agent to the orchestrator's roster table in `.claude/rules/agent-orchestrator.md`:

```markdown
| your-role | Your Domain | When to dispatch to this agent |
```

The agent router hook (`agent-router.py`) auto-discovers agents by scanning `.claude/rules/agent-*.md`, so new agents are automatically available for routing suggestions.

## Remove an Agent

Delete the agent's file from `.claude/rules/`:

```bash
rm .claude/rules/agent-reporter.md
```

Remove the agent's row from the orchestrator's roster table in `agent-orchestrator.md`.

## Adjust the Dispatch Protocol

The dispatch protocol lives in `.claude/rules/multi-agent-dispatch.md`. You can:

- Change message format templates
- Adjust priority levels
- Modify retry limits (default: 3 attempts before escalation)
- Add or remove message types

## Adjust Team Patterns

Team patterns live in `.claude/rules/team-dispatch.md`. You can:

- Add new team compositions (e.g., "Security Audit" = Builder + Security + QA)
- Modify existing patterns
- Change the decision matrix for when to use solo vs team dispatch

## Customize the Orchestrator

The orchestrator (`agent-orchestrator.md`) controls the entire team. Key sections to customize:

| Section | What to change |
|---------|---------------|
| **Agent Roster** | Add/remove agents, update dispatch triggers |
| **Session Modes** | Adjust Micro/Sprint/Full thresholds for your workflow |
| **Quality Gates** | Tighten or relax verification requirements |
| **Context Budget** | Change the threshold for switching to file-only handoffs |
| **Dispatch Sizing** | Tune when to parallelize vs serialize work |

## Customize Self-Learning

### Adjust what gets extracted

The learning extractor (`.claude/hooks/session-learning-extractor.py`) detects corrections, quality gate outcomes, and pushback. To adjust detection sensitivity, modify the pattern keywords in the script.

### Change memory recall behavior

The recall hook (`.claude/hooks/session-start-peer-memory.py`) loads past lessons at session start. Modify it to:
- Filter by recency (only last N sessions)
- Filter by confidence threshold
- Limit number of recalled lessons

### View an agent's memory

```bash
# SQLite databases are in .claude/agent-memory/
sqlite3 .claude/agent-memory/nahida.db "SELECT topic, insight FROM memories ORDER BY created_at DESC LIMIT 10;"
```

### Reset an agent's memory

```bash
rm .claude/agent-memory/nahida.db
```

The agent starts fresh next session.

## Switch Themes

Re-run init with a different theme. Use `--force` to overwrite existing agent files:

```bash
npx peer-orchestra init --theme generic --name Commander --no-interactive --force
```

This replaces agent persona files but preserves your `.claude/agent-memory/` databases — agents keep their learned knowledge even after a theme switch.
