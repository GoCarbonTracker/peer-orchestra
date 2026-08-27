# Multi-Agent Dispatch Rules

## Peer Dispatch Protocol

When assigning a persona to a peer, ALWAYS include these 4 instructions:

1. **Load persona rules:** "Read `.claude/rules/agent-{name}.md` and follow those rules for this session."
2. **Set summary:** "Call `set_summary` with your persona name and current task so the orchestrator can track you."
3. **Save on task completion:** "When your task is done, immediately save key findings to memory. Do NOT wait for session end."
4. **Clarify first:** "Before executing, review this task carefully. If anything is ambiguous or you see a better approach, send questions back before starting work."

Rule 3 is critical — SessionEnd hooks are unreliable for peers that stay open after finishing tasks.

## Dispatch Template

Every task sent to an agent must follow this format:

```
[dispatch] [P0-blocking|P1-normal|P2-when-idle]

TASK: {one sentence — what to do}

CONTEXT: {2-3 sentences — why, what's already known, what to avoid}

OUTPUT: {file path for results} + {format: report/code/epic/etc}

RESPOND: {what to send back — file path confirmation? summary? nothing?}

SETUP: Read .claude/rules/agent-{name}.md. Call set_summary.
Save findings to memory + file on task completion.
```

## Message Types

| Type | When | Format |
|------|------|--------|
| `dispatch` | New task assignment | Full template above |
| `followup` | Clarification on active task | TASK + CONTEXT only, no boilerplate |
| `relay` | Forwarding another agent's output | SOURCE + CONTENT + ACTION |
| `correction` | Rework request | ISSUE + FIX + file path/line numbers |

## Message Rules

1. **Dispatch messages < 300 words** — context goes in files, not messages. Link to files instead of pasting content.
2. **SETUP block on first message only** — don't repeat persona loading instructions on followups/corrections.
3. **One task per dispatch** — if you have 2 tasks for the same agent, send 2 messages or bundle explicitly.
4. **Always specify OUTPUT path** — agent must know where to write before starting.
5. **Priority is mandatory** — every dispatch needs P0/P1/P2. Default is P1.

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

## Parallel Dispatch Tracking

When dispatching the same persona to multiple peers in parallel:
1. **Include peer ID in task message** so you can trace which terminal produced which output
2. **Log the dispatch map** documenting which peer got which task
3. **Peers tag memories with peer ID** for traceability
