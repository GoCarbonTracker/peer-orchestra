# Multi-Agent Dispatch Rules

## Dispatch Template

Every task sent to an agent must follow this format:

```
[dispatch] [P0-blocking|P1-normal|P2-when-idle]

TASK: {one sentence — what to do}

CONTEXT: {2-3 sentences — why, what's already known, what to avoid}

OUTPUT: {file path for results} + {format: report/code/epic/etc}

RESPOND: {what to send back — file path confirmation? summary? nothing?}
```

## Message Types

| Type | When | Format |
|------|------|--------|
| `dispatch` | New task assignment | Full template above |
| `followup` | Clarification on active task | TASK + CONTEXT only |
| `relay` | Forwarding another agent's output | SOURCE + CONTENT + ACTION |
| `correction` | Rework request | ISSUE + FIX + file path/line numbers |

## Rules

1. **Dispatch messages < 300 words** — context goes in files, not messages
2. **One task per dispatch** — don't bundle multiple tasks
3. **Priority is mandatory** — every dispatch needs P0/P1/P2
4. **Always specify OUTPUT path** — agent must know where to write
5. **Never interrupt busy agents** — check status via `list_peers` first

## Retry Limits

- **Max 3 rework attempts per task per agent**
- After 3 failures: stop, diagnose root cause, reassign or decompose the task
- Never retry a 4th time — change the approach

## Correction Template

```
[correction] [P0|P1|P2]

ISSUE: {what's wrong — specific, with evidence}

FIX: {what to change — file path + line numbers if applicable}

CONTEXT: {why it matters — what depends on this}
```
