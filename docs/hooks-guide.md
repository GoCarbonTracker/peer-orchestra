# Claude Code Hooks — A Practical Guide

*Using real hooks from Peer Orchestra as examples.*

---

## What Are Hooks?

Hooks are scripts that Claude Code runs automatically at specific moments during a session — when a session starts, when you submit a prompt, when context gets compacted, or when a session ends. They let you inject behavior into Claude Code without modifying Claude itself. Think of them as event listeners for your AI coding sessions.

---

## How Hooks Work

Claude Code fires **lifecycle events** at key moments. For each event, it runs any scripts you've registered in `.claude/settings.json`. The protocol is simple:

1. Claude Code sends a **JSON object on stdin** with event context (session ID, prompt text, etc.)
2. Your script does its work (read files, query databases, analyze text)
3. Your script prints a **JSON object on stdout** with a message that gets injected into the conversation

```
Claude Code                    Your Hook Script
    |                               |
    |-- fires event --------------->|
    |   (JSON on stdin)             |
    |                               |-- reads stdin
    |                               |-- does work
    |                               |-- prints JSON to stdout
    |<------------------------------|
    |   injects message into        |
    |   conversation context        |
```

If your script prints nothing, no message is injected — the hook runs silently.

---

## Available Events

| Event | When It Fires | Common Uses |
|-------|--------------|-------------|
| **SessionStart** | When a Claude Code session begins | Load agent identity, recall past learnings, set up context |
| **SessionEnd** | When a session closes | Save learnings, export memory, cleanup |
| **PreCompact** | Before context gets compressed (long sessions) | Save work-in-progress, extract learnings before they're lost |
| **UserPromptSubmit** | After the user types a message, before Claude processes it | Route prompts to agents, add context, validate input |
| **PreToolUse** | Before Claude calls a tool (Read, Bash, etc.) | Security scanning, permission checks, logging |
| **PostToolUse** | After a tool call completes | Audit logging, result validation, notifications |

The **stdin JSON** varies by event. Key fields:

```json
// SessionStart / SessionEnd
{
  "session_id": "abc123",
  "hook_event_name": "SessionStart"
}

// UserPromptSubmit
{
  "prompt": "Fix the login bug",
  "session_id": "abc123",
  "hook_event_name": "UserPromptSubmit"
}

// PreToolUse / PostToolUse
{
  "tool_name": "Bash",
  "tool_input": {"command": "npm test"},
  "session_id": "abc123",
  "hook_event_name": "PreToolUse"
}
```

---

## Wiring Hooks in settings.json

Hooks are registered in `.claude/settings.json` under the `hooks` key. Each event maps to an array of hook groups, where each group has a `matcher` (regex filter, empty = match everything) and a list of hook commands:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/agent-persona-loader.py"
          },
          {
            "type": "command",
            "command": "python3 .claude/hooks/session-start-peer-memory.py"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/agent-router.py \"$PROMPT\""
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/session-learning-extractor.py"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/session-learning-extractor.py"
          }
        ]
      }
    ]
  }
}
```

Key points:
- Hooks run **in order** within a group. If you have 2 hooks in the same group, the first finishes before the second starts.
- The `matcher` field is a regex applied to the tool name (for PreToolUse/PostToolUse) or empty to match everything.
- Hook commands run from the **project root directory** (`Path.cwd()` in Python).
- Use `python3` (not `python`) — many systems don't have `python` aliased.

---

## Real-World Examples: Peer Orchestra's 4 Hooks

### 1. Agent Persona Loader

**File:** `agent-persona-loader.py` (55 lines)
**Event:** SessionStart
**Purpose:** Tells Claude which agent persona to load when a terminal opens.

**How it works:**

```python
def get_agent_identity() -> str:
    # Priority 1: PEER_AGENT environment variable
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return agent

    # Priority 2: .peer-identity file in project root
    identity_file = PROJECT_ROOT / ".peer-identity"
    if identity_file.exists():
        return identity_file.read_text().strip()

    # Priority 3: default to orchestrator
    return "orchestrator"
```

The hook checks three places for the agent's identity (env var, file, default), then confirms whether the matching rules file exists at `.claude/rules/agent-{name}.md`. Its output message tells Claude "you are agent X" — which primes it to follow that agent's rules.

**Why it's useful:** In a multi-agent setup, you open multiple terminals. Each one needs to know which agent it is. Setting `PEER_AGENT=qa-engineer` before launching Claude Code makes that terminal automatically adopt the QA engineer persona.

**Usage:**
```bash
# Terminal 1 (orchestrator — the default)
claude

# Terminal 2 (QA engineer)
PEER_AGENT=qa-engineer claude

# Terminal 3 (backend engineer)
PEER_AGENT=backend-engineer claude
```

---

### 2. Session Memory Recall

**File:** `session-start-peer-memory.py` (83 lines)
**Event:** SessionStart
**Purpose:** Recalls past learnings for this specific agent from a SQLite database.

**How it works:**

```python
def recall_memories(agent: str, limit: int = 10) -> list[str]:
    db_path = AGENT_MEMORY_DIR / f"{agent}.db"
    if not db_path.exists():
        return []

    conn = sqlite3.connect(str(db_path))
    try:
        rows = conn.execute(
            "SELECT insight FROM memories "
            "WHERE agent = ? AND superseded_by IS NULL "
            "ORDER BY created_at DESC LIMIT ?",
            (agent, limit),
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()
```

Each agent has its own SQLite database at `.claude/agent-memory/{agent}.db`. This hook reads the most recent 10 non-superseded memories and injects them as a bullet list into the session context.

**Why it's useful:** This is what makes agents learn across sessions. If the orchestrator corrected the QA engineer yesterday ("always run the full test suite, not just the changed tests"), that correction gets saved to `qa-engineer.db`. Next time the QA engineer terminal opens, this hook reminds it of that lesson.

**Output example:**
```
**Past learnings for qa-engineer (most recent 3):**
- [Correction] Always run full test suite before claiming a story is complete
- [Quality Gate FAIL->PASS] Integration tests must pass before unit tests are trusted
- [Peer Pushback] Preferred running live queries over mocked data for validation
```

---

### 3. Agent Router

**File:** `agent-router.py` (140 lines)
**Event:** UserPromptSubmit
**Purpose:** Suggests which agent should handle a task based on keyword matching against the user's prompt.

**How it works:**

The router has two layers:

1. **Auto-discovery:** Scans `.claude/rules/agent-*.md` files, extracts the `**Domain:**` line and `## Abilities` section, and builds a keyword index per agent.

2. **Fallback routes:** If an agent file doesn't have an Abilities section, it falls back to a built-in keyword map:

```python
DEFAULT_ROUTES = {
    "backend": ["API", "database", "backend", "performance", "architecture"],
    "qa": ["test", "QA", "regression", "benchmark", "edge case", "coverage"],
    "research": ["competitive", "research", "market", "intelligence"],
    # ... more routes
}
```

3. **Matching:** When you type a prompt, every keyword is checked against the prompt text. Agents are ranked by number of matching keywords.

```python
def route_prompt(prompt: str, agents: dict) -> list[dict]:
    prompt_lower = prompt.lower()
    matches = []
    for agent, info in agents.items():
        matched_keywords = [kw for kw in info["keywords"]
                           if kw.lower() in prompt_lower]
        if matched_keywords:
            matches.append({
                "agent": agent, "score": len(matched_keywords), ...
            })
    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches
```

**Why it's useful:** In the orchestrator terminal, when you type "fix the login API tests", the router suggests: "This looks like a task for **Backend-engineer** (Backend & Architecture). Matching keywords: 'API'" and "**Qa-engineer** (QA & Testing). Matching keywords: 'test'." This helps the orchestrator dispatch to the right agent.

**Output example:**
```
Agent Router: This looks like a task for **Backend-engineer** (Backend & Architecture).
Matching keywords: "API", "database"
Agent Router: This looks like a task for **Qa-engineer** (QA & Testing).
Matching keywords: "test"
```

---

### 4. Session Learning Extractor

**File:** `session-learning-extractor.py` (390 lines)
**Event:** SessionEnd + PreCompact
**Purpose:** The crown jewel. Parses the session transcript to find learnable moments — corrections, quality gate results, and peer pushback — then saves them to per-agent SQLite databases.

**How it works (simplified):**

**Step 1 — Find the transcript.** Claude Code stores session transcripts as JSONL files in `~/.claude/projects/*/`. The hook finds the right file using the session ID from stdin.

**Step 2 — Extract peer messages.** It scans the JSONL for messages containing `<channel source="claude-peers">` — these are messages sent between agents via the claude-peers MCP server.

```python
def extract_peer_messages(transcript_path: Path) -> list[dict]:
    messages = []
    with open(transcript_path) as f:
        for line in f:
            entry = json.loads(line)
            # Look for claude-peers channel messages in two places:
            # 1. queue-operation entries (enqueue events)
            # 2. user entries with channel tags
            if "claude-peers" in str(entry.get("content", "")):
                parsed = parse_channel_message(content)
                if parsed:
                    messages.append(parsed)
    return messages
```

**Step 3 — Detect patterns.** Each message is checked for three types of learnable moments:

| Pattern | Signal Keywords | What It Captures |
|---------|----------------|-----------------|
| **Correction** | "wrong", "fix", "issue", "should have", "rework" | When the orchestrator corrects an agent's work |
| **Quality Gate** | "FAIL", "PASS", "quality gate", "round 1/2/3" | When work fails or passes review |
| **Pushback** | "pushed back", "better approach", "disagree" | When an agent successfully argues for a different approach |

**Step 4 — Save to per-agent SQLite.** Each detected pattern is saved to the relevant agent's database. Idempotency is enforced by checking `(source_session, topic, agent)` — re-running the extractor on the same session produces no duplicates.

```python
def save_patterns(patterns: list[dict], session_id: str) -> int:
    for agent in all_agents:
        db_path = AGENT_MEMORY_DIR / f"{agent}.db"
        conn = sqlite3.connect(str(db_path))
        # Create schema if needed (memories table + FTS5 index)
        ensure_schema(conn)
        for p in patterns:
            if agent not in p["agents"]:
                continue
            # Skip if already saved for this session
            existing = conn.execute(
                "SELECT 1 FROM memories WHERE source_session=? AND topic=? AND agent=?",
                (session_id, p["topic"], agent),
            ).fetchone()
            if existing:
                continue
            conn.execute("INSERT INTO memories ...", (...))
        conn.commit()
```

**Why it's useful:** This closes the learning loop. Without this hook, corrections are lost when the session ends. With it, every correction, failed quality gate, and successful pushback becomes a permanent lesson that the agent recalls in future sessions via hook #2 (Session Memory Recall).

**Why it fires on both SessionEnd AND PreCompact:** Long sessions trigger context compaction (Claude compresses old messages to make room). If a correction happened early in the session, it could be lost during compaction. By also firing on PreCompact, the extractor captures learnings before they're compressed away.

---

## Writing Your Own Hook

Here's a minimal template for a Python hook:

```python
#!/usr/bin/env python3
"""One-line description — EventName Hook"""

import json
import sys


def main() -> int:
    # 1. Read the event data from stdin
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    # 2. Do your work here
    session_id = input_data.get("session_id", "unknown")
    # ... your logic ...

    # 3. Output a message (or print nothing to stay silent)
    result = "Hello from my custom hook!"
    if result:
        print(json.dumps({
            "hookEventName": "SessionStart",  # match your event
            "message": result,
        }))

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)  # Never crash Claude Code
```

Then wire it in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/my-hook.py"
          }
        ]
      }
    ]
  }
}
```

---

## Tips and Gotchas

### Always wrap in try/except, always exit 0

A crashing hook can disrupt Claude Code. Every hook should have a top-level exception handler that exits cleanly:

```python
if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        # Log to stderr (doesn't affect Claude), exit clean
        print(json.dumps({
            "hookEventName": "SessionStart",
            "message": f"Hook error (non-fatal): {e}",
        }), file=sys.stderr)
        sys.exit(0)
```

### JSON format matters

Claude Code expects exactly this structure on stdout. Any other output (plain text, malformed JSON, extra print statements) will be ignored or cause errors:

```json
{
  "hookEventName": "SessionStart",
  "message": "Your message here"
}
```

The `message` field is what gets injected into the conversation. The `hookEventName` should match the event your hook is registered for.

### Print nothing for silent hooks

If your hook has nothing to report (no memories found, no routing match), just `return 0` without printing anything. Don't print an empty message — that adds noise to every session.

### Use stderr for debugging

`print("debug info", file=sys.stderr)` goes to the terminal's error stream, not to Claude. Useful for debugging without polluting the conversation.

### Hooks run from the project root

`Path.cwd()` inside a hook is the project directory where Claude Code was launched. Use this to find `.claude/`, config files, and project data. Don't hardcode absolute paths.

### SessionEnd hooks are unreliable for peers

In multi-agent setups, agent terminals often sit idle after finishing their task. The SessionEnd hook may never fire if the user closes the terminal without properly ending the session. This is why Peer Orchestra's learning extractor also fires on PreCompact — it's a safety net.

### Don't do heavy work in UserPromptSubmit

This hook runs on every single prompt. If it takes 2 seconds, every interaction feels laggy. Keep it fast — keyword matching (like the agent router) is fine, but don't make network requests or run expensive computations here.

### Merge settings.json, don't overwrite

If you're writing a tool that installs hooks (like Peer Orchestra), always merge into existing `settings.json` rather than overwriting it. Users may have their own hooks configured.

```javascript
// Good: merge
const existing = JSON.parse(fs.readFileSync(settingsPath));
existing.hooks = { ...existing.hooks, ...newHooks };

// Bad: overwrite
fs.writeFileSync(settingsPath, JSON.stringify(newSettings));
```
