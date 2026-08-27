# Claude Code Hooks Masterclass

*A comprehensive guide using 29 production hooks from a real project.*

---

## 1. What Are Claude Code Hooks?

Hooks are scripts that Claude Code runs automatically at specific moments during a session. They let you inject context, enforce rules, save learnings, and trigger external tools — all without modifying Claude itself.

Think of hooks like middleware in a web framework: they intercept events (session start, prompt submission, tool execution) and can inject messages into the conversation or block actions. A hook is just a script (Python, Bash, anything) that reads JSON from stdin and optionally prints JSON to stdout.

The project this guide draws from has **29 production hooks** that handle agent identity, memory recall, security scanning, learning extraction, and more. By the end of this guide, you'll understand how to build hooks like these.

---

## 2. How Hooks Work

### The Protocol

Every hook follows the same simple protocol:

```
Claude Code                          Your Hook Script
    |                                     |
    |--- event fires ------------------>  |
    |    (JSON on stdin)                  |
    |                                     |--- reads stdin JSON
    |                                     |--- does work
    |                                     |--- prints JSON to stdout
    |  <--------------------------------  |
    |    injects message into context     |
    |    (or blocks the action)           |
```

**Input (stdin):** Claude Code sends a JSON object with event-specific fields:

```json
{
  "session_id": "abc123def",
  "hook_event_name": "SessionStart"
}
```

**Output (stdout):** Your script prints one JSON object:

```json
{
  "hookEventName": "SessionStart",
  "message": "Context injected into the conversation"
}
```

If your script prints nothing, no message is injected — the hook runs silently. This is fine for hooks that only have side effects (saving to a database, writing a log file).

### Output Modes

Hooks can inject context in two ways:

**1. Direct message** — appears as a system reminder in the conversation:
```json
{
  "hookEventName": "SessionStart",
  "message": "Agent: Nahida loaded. Past learnings recalled."
}
```

**2. Additional context** — appears alongside the event, less prominent:
```json
{
  "hookEventName": "PostToolUse",
  "additionalContext": "MEMORY CHECK: Consider saving your work."
}
```

**3. Blocking** (PreToolUse only) — prevents the tool from executing:
```json
{
  "hookEventName": "PreToolUse",
  "decision": "block",
  "reason": "Security: potential prompt injection detected in memory write"
}
```

---

## 3. Available Lifecycle Events

| Event | When It Fires | What stdin Contains | Common Uses |
|-------|--------------|--------------------|----|
| **SessionStart** | Session begins | `session_id` | Load agent identity, recall memories, set up context |
| **SessionEnd** | Session closes | `session_id`, transcript metadata | Save learnings, export to external tools, cleanup |
| **PreCompact** | Before context compression | `session_id` | Extract learnings before they're lost, save checkpoints |
| **UserPromptSubmit** | User types a message | `prompt`, `session_id` | Route prompts, suggest agents/skills, detect patterns |
| **PreToolUse** | Before a tool executes | `tool_name`, `tool_input`, `session_id` | Security scanning, permission gates, parallelization hints |
| **PostToolUse** | After a tool completes | `tool_name`, `tool_input`, `tool_output`, `session_id` | Auto-review commits, count calls, nudge memory saves |
| **Stop** | User stops Claude mid-response | `session_id` | Verification checklists, save partial work |

### Event Frequency

Understanding frequency matters for performance:

- **SessionStart/SessionEnd/Stop**: Once per session. Do anything you want here — read databases, call APIs, parse files.
- **PreCompact**: Rare. Only fires during long sessions when context fills up.
- **UserPromptSubmit**: Every prompt. Keep it fast (< 1 second). No API calls.
- **PreToolUse/PostToolUse**: Every single tool call. Can fire hundreds of times per session. Must be extremely fast. Use `matcher` to filter to specific tools.

---

## 4. Wiring Hooks in settings.json

Hooks live in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global):

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
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/auto-review-on-commit.py"
          }
        ]
      },
      {
        "matcher": "(Write|Edit)",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/memory-scan-security.py"
          }
        ]
      }
    ]
  }
}
```

**Key concepts:**

- **`matcher`**: A regex applied to the tool name (for PreToolUse/PostToolUse). Empty string = match everything. `"Bash"` = only fire on Bash tool. `"(Write|Edit)"` = fire on Write or Edit.
- **Execution order**: Hooks within a group run sequentially. Multiple groups under the same event run in array order.
- **Working directory**: Hooks run from the project root (`Path.cwd()` in Python).
- **Use `python3`**: Many systems don't have `python` aliased. Always use `python3`.

---

## 5. Hook Categories with Real Examples

### Category 1: Agent Identity & Routing

**Problem:** In a multi-agent setup, each terminal needs to know which agent it is, and prompts need to be routed to the right agent.

#### Example: Agent Persona Loader (SessionStart, 152 lines)

Resolves which agent this terminal is and loads their rules into context.

```python
def get_agent_identity() -> str:
    """Three-layer identity resolution."""
    # 1. Environment variable (set before launching Claude)
    agent = os.environ.get("GCT_AGENT_ID")
    if agent:
        return agent

    # 2. Identity file (written by orchestrator)
    identity_file = Path("core/scripts/compliance/.current-agent")
    if identity_file.exists():
        return identity_file.read_text().strip()

    # 3. Scan rules directory — if only one agent file, use it
    rules = list(Path(".claude/rules").glob("agent-*.md"))
    non_common = [r for r in rules if "common" not in r.stem and "orchestrator" not in r.stem]
    if len(non_common) == 1:
        return non_common[0].stem.replace("agent-", "")

    return "orchestrator"
```

Once identity is resolved, it reads the full agent rules file and injects it into context. This is how an agent "becomes" its persona at session start.

**Usage:**
```bash
# Terminal 1: orchestrator (default)
claude

# Terminal 2: QA engineer
GCT_AGENT_ID=xiao claude

# Terminal 3: backend engineer
GCT_AGENT_ID=zhongli claude
```

#### Example: Agent Router (UserPromptSubmit, 134 lines)

Suggests which agent should handle a task by matching prompt keywords against agent abilities.

```python
# Scans .claude/rules/agent-*.md files for keywords
# Scores each agent by number of keyword matches
# Returns top matches, ranked by score

def route_prompt(prompt, agents):
    prompt_lower = prompt.lower()
    matches = []
    for agent, info in agents.items():
        matched = [kw for kw in info["keywords"]
                   if kw.lower() in prompt_lower]
        if matched:
            matches.append({"agent": agent, "score": len(matched)})
    return sorted(matches, key=lambda m: m["score"], reverse=True)
```

Output: `"Agent Router: This looks like a task for **Xiao** (QA & Testing). Matching keywords: 'test', 'regression'"`

---

### Category 2: Memory & Learning

**Problem:** Claude Code sessions are stateless. Every session starts from zero. Corrections, decisions, and domain knowledge are lost when the terminal closes.

#### Example: Agent Memory Recall (SessionStart, 228 lines)

Loads past learnings from a 5-layer fallback chain:

```python
# Layer 1: Private agent SQLite DB (.claude/agent-memory/{agent}.db)
# Layer 2: Unified memory (private, via MCP tool)
# Layer 3: Unified memory (shared, via MCP tool)
# Layer 4: Vestige CLI (cross-session memory)
# Layer 5: ByteRover CLI (cross-agent knowledge)

# Each layer has a 5-second timeout. If one fails, fall to the next.
memories = []
for source in [private_db, unified_private, unified_shared, vestige, byterover]:
    try:
        result = source.query(agent=agent, limit=10, timeout=5)
        memories.extend(result)
        if len(memories) >= 10:
            break
    except Exception:
        continue  # Fall to next layer
```

This is the most resilient hook in the system — it never fails to load *some* context, even if most memory backends are offline.

#### Example: Session Learning Extractor (SessionEnd + PreCompact, 395 lines)

The crown jewel. Parses the session transcript to find learnable moments and saves them to per-agent databases.

**What it extracts:**

| Pattern | Signal Keywords | Example |
|---------|----------------|---------|
| **Corrections** | "wrong", "fix", "should have", "rework" | Orchestrator tells agent: "That's wrong, use snake_case not camelCase" |
| **Quality Gates** | "FAIL", "PASS", "round 1/2/3" | Agent's code fails review, then passes on second attempt |
| **Pushback** | "pushed back", "better approach", "disagree" | Agent argues for a simpler solution and orchestrator accepts |

**How it works:**

```python
# 1. Find the session transcript JSONL
transcript = find_transcript(session_id)  # ~/.claude/projects/*/session.jsonl

# 2. Extract peer-to-peer messages from the JSONL
messages = extract_peer_messages(transcript)

# 3. Detect learnable patterns
patterns = detect_patterns(messages)

# 4. Save to per-agent SQLite with deduplication
for pattern in patterns:
    for agent in pattern["agents"]:
        db = sqlite3.connect(f".claude/agent-memory/{agent}.db")
        # Skip if already saved for this session
        if not already_exists(db, session_id, pattern["topic"], agent):
            db.execute("INSERT INTO memories ...", pattern)
```

**Why it fires on both SessionEnd AND PreCompact:** Long sessions trigger context compaction. If a correction happened early, it would be compressed away before SessionEnd. PreCompact captures it first.

#### Example: Memory Nudge (PostToolUse, 94 lines)

Counts tool calls per session. Every 15 calls, reminds the agent to save learnings:

```python
# Uses a temp file as counter: /tmp/.claude-memory-nudge-{session_id}
counter = read_counter(session_id)
counter += 1
write_counter(session_id, counter)

if counter % 15 == 0:
    print(json.dumps({
        "hookEventName": "PostToolUse",
        "additionalContext": f"MEMORY CHECK: You've completed {counter} tool calls "
                           "since your last memory save..."
    }))
```

Simple but effective. Without this, agents do 60+ tool calls without saving anything.

---

### Category 3: Quality & Safety

**Problem:** Agents can write insecure content to protected files, work from stale documentation, or forget to review their own commits.

#### Example: Memory Security Scanner (PreToolUse, 104 lines)

Scans Write/Edit operations targeting protected paths for prompt injection patterns:

```python
PROTECTED_PATHS = ["/memory/", "/.claude/rules/", "/.claude/skills/", "/.claude/hooks/"]

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?previous",
    r"system\s*prompt\s*override",
    r"curl.*\$\{?.*SECRET",
    r"eval\(.*base64",
    # ... 22 patterns total
]

# Only fires on Write/Edit to protected paths
if any(p in file_path for p in PROTECTED_PATHS):
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            return {"decision": "block", "reason": f"Security: {description}"}
```

This is a **PreToolUse blocker** — it actually prevents the tool from executing, not just warns.

#### Example: Auto-Review on Commit (PostToolUse, 117 lines)

After a successful `git commit`, injects domain-specific review reminders:

```python
# Detects: git commit (not --dry-run, not --amend)
if re.search(r"git\s+commit", command) and "create mode" in output:
    review_rules = """
    Review checklist:
    - KB access: ctx.get('metadata', {}).get('company'), not ctx.get('company')
    - Display names: get_display_name(), never company_id.upper()
    - No fake data in tests
    - File organization per ARCHITECTURE.md
    """
    print(json.dumps({"additionalContext": review_rules}))
```

#### Example: Stale Doc Guard (PostToolUse, 64 lines)

When Claude reads README.md, OVERVIEW.md, or SUMMARY.md files, warns that these may be outdated and suggests using live tools instead:

```python
STALE_PATTERNS = ["README.md", "OVERVIEW.md", "SUMMARY.md"]

if tool_name == "Read" and any(p in file_path for p in STALE_PATTERNS):
    print(json.dumps({
        "additionalContext": "This document may be stale. "
                           "Use live tools for current data."
    }))
```

---

### Category 4: Skill & Tool Matching

**Problem:** Users don't know which skills or evaluation workflows are available for their current task.

#### Example: Skill Matcher (UserPromptSubmit, 179 lines)

Matches prompts against a keyword registry of installed skills:

```python
SKILLS = {
    "graphiti": {
        "keywords": ["knowledge graph", "entity", "fact", "episode", "graph"],
        "path": "skills/graphiti/SKILL.md"
    },
    "discourse-graph": {
        "keywords": ["discourse", "claim", "evidence", "contradiction", "argument"],
        "path": "skills/discourse-graph-extraction/SKILL.md"
    },
    # ... 16+ skills
}

# Threshold: 3+ keyword matches to suggest
matches = []
for skill, info in SKILLS.items():
    score = sum(1 for kw in info["keywords"] if kw in prompt_lower)
    if score >= 3:
        matches.append((skill, score, info["path"]))
```

Suggests top 2 matching skills. Skips short prompts (< 10 chars) and meta-commands (git, confirmations).

#### Example: Skill Creation Offer (PostToolUse, 114 lines)

Tracks session complexity. After 10+ tool calls across 3+ tool types, offers to create a reusable skill:

```python
# Persists state in state/skill-creation-tracker.json
state = load_state()
state["total_calls"] += 1
state["tool_types"][tool_name] = state["tool_types"].get(tool_name, 0) + 1

if state["total_calls"] >= 10 and len(state["tool_types"]) >= 3 and not state["offered"]:
    state["offered"] = True
    save_state(state)
    print(json.dumps({
        "message": f"This session used {state['total_calls']} calls across "
                  f"{len(state['tool_types'])} tool types. "
                  "Would you like to save this as a reusable skill?"
    }))
```

This uses the **state directory pattern** for inter-call persistence within a session.

---

### Category 5: External Integrations

**Problem:** External tools (Vestige, ByteRover, MemPalace) need to be kept in sync with session activity without manual intervention.

#### Example: ByteRover Auto-Curate (PostToolUse, 97 lines)

After every successful git commit, automatically curates the commit to ByteRover (a cross-agent knowledge store):

```python
# Detects successful git commit from Bash tool output
if re.search(r"git\s+commit", command) and "create mode" in output:
    # Get commit details
    details = subprocess.run(
        ["git", "log", "-1", "--format=%s%n%n%b", "--stat"],
        capture_output=True, text=True, timeout=10
    ).stdout

    # Curate to ByteRover
    subprocess.run(
        ["brv", "curate", f"Git commit: {details}"],
        timeout=30
    )
```

#### Example: Session End Pipeline (SessionEnd, uses lib/)

The session-end hook delegates to a shared learning pipeline in `lib/learning.py`:

```python
# session-end.py (31 lines — thin wrapper)
from lib.learning import run_learning_pipeline

def main():
    input_data = json.load(sys.stdin)
    run_learning_pipeline(input_data, hook_event_name="SessionEnd")
```

The pipeline in `lib/learning.py` (220 lines) orchestrates:

1. **Parse transcript** (via `lib/transcript.py`) — extract meaningful entries from JSONL
2. **Classify session** — "deep", "standard", "quick", or "debug" based on message count and tool usage
3. **Summarize** (via `lib/summarizer.py`) — try Ollama (local LLM) then Haiku (API) then fallback (no LLM)
4. **Ingest to Vestige** — long-term memory
5. **Store to ByteRover** — cross-agent knowledge
6. **Save last-session.md** — for next session's context
7. **Track corrections** — escalate after 3 repeated corrections

---

## 6. How to Build Your Own Hook

### Minimal Template

```python
#!/usr/bin/env python3
"""What this hook does — EventName Hook"""

import json
import sys


def main() -> int:
    # 1. Read event data from stdin
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    # 2. Your logic here
    session_id = input_data.get("session_id", "unknown")

    # 3. Output (or print nothing for silent hooks)
    print(json.dumps({
        "hookEventName": "SessionStart",
        "message": "Hello from my hook!"
    }))

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)  # NEVER crash Claude Code
```

### Wire it in settings.json

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 .claude/hooks/my-hook.py"
      }]
    }]
  }
}
```

### Blocker Template (PreToolUse)

```python
# Return this to BLOCK a tool from executing:
print(json.dumps({
    "hookEventName": "PreToolUse",
    "decision": "block",
    "reason": "Blocked because: specific reason"
}))
```

---

## 7. Advanced Patterns

### Pattern 1: Shared Libraries (lib/)

When you have 10+ hooks, you'll find repeated logic: agent detection, config loading, subprocess wrappers. Extract these into a `lib/` directory:

```
.claude/hooks/
  lib/
    __init__.py
    config.py        # Paths, thresholds, env loading
    transcript.py    # JSONL transcript parsing
    summarizer.py    # LLM summarization (Ollama -> Haiku fallback)
    vestige.py       # Vestige CLI wrapper
    byterover.py     # ByteRover CLI wrapper
  session-end.py     # from lib.learning import run_learning_pipeline
  session-start.py   # from lib.config import PROJECT_ROOT, STATE_DIR
```

**`config.py`** centralizes all configuration:

```python
PROJECT_ROOT = Path.cwd()
HOOKS_DIR = PROJECT_ROOT / ".claude" / "hooks"
STATE_DIR = HOOKS_DIR / "state"

# Load .env (hooks don't inherit shell environment)
env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip('"'))

# Thresholds
MIN_MEANINGFUL_ENTRIES = 5
CONSOLIDATION_INTERVAL_HOURS = 24
MAX_INJECTED_MEMORIES = 3
```

### Pattern 2: State Management (state/)

Hooks need to persist data between calls (within a session) and between sessions. Use a `state/` directory:

```
.claude/hooks/state/
  last-session.md              # Previous session summary
  session-learner.log          # Debug log (append-only)
  skill-creation-tracker.json  # Per-session call counter
  last-consolidation           # Timestamp of last expensive operation
  workspace-sync.lock          # PID lock file
  corrections-history.json     # Correction frequency tracking
```

**Counter pattern** (skill-creation-offer.py):
```python
STATE_FILE = Path(".claude/hooks/state/skill-creation-tracker.json")

def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"total_calls": 0, "tool_types": {}, "offered": False}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))
```

**Throttle pattern** (session-start.py):
```python
LAST_CONSOLIDATION = Path(".claude/hooks/state/last-consolidation")

def should_consolidate():
    if not LAST_CONSOLIDATION.exists():
        return True
    last = datetime.fromisoformat(LAST_CONSOLIDATION.read_text().strip())
    return (datetime.now() - last).total_seconds() > 24 * 3600

if should_consolidate():
    subprocess.run(["vestige", "consolidate"], timeout=30)
    LAST_CONSOLIDATION.write_text(datetime.now().isoformat())
```

**Lock pattern** (lib/learning.py):
```python
LOCK_FILE = Path(".claude/hooks/state/workspace-sync.lock")

def acquire_lock():
    if LOCK_FILE.exists():
        pid = int(LOCK_FILE.read_text().strip())
        if is_process_running(pid):
            return False  # Another hook instance is running
        # Stale lock — clean it up
    LOCK_FILE.write_text(str(os.getpid()))
    return True

def release_lock():
    LOCK_FILE.unlink(missing_ok=True)
```

### Pattern 3: Hook Chains

Multiple hooks on the same event fire sequentially. Design them as a pipeline:

```
SessionStart:
  1. agent-persona-loader.py    → identifies which agent this is
  2. agent-memory-recall.py     → loads memories FOR that agent
  3. session-start.py           → loads session context + Vestige
  4. learnings-path-validator.py → verifies agent config is intact
```

Each hook builds on the previous one's work. The persona loader sets the agent identity; the memory recall uses that identity to query the right database.

### Pattern 4: Matcher Filtering

For PostToolUse/PreToolUse hooks, always use matchers to avoid running on every tool call:

```json
{
  "matcher": "Bash",
  "hooks": [{"type": "command", "command": "python3 .claude/hooks/auto-review-on-commit.py"}]
}
```

Without the matcher, `auto-review-on-commit.py` would fire on every Read, Write, Glob, Grep, and Agent call — hundreds of times per session, completely wasted.

Common matcher patterns:
- `"Bash"` — git commands, npm, system tools
- `"(Write|Edit)"` — file modifications (security scanning)
- `"Read"` — stale doc detection
- `"mcp__claude-peers__send_message"` — peer dispatch gating

### Pattern 5: Fallback Chains

When depending on external tools, build fallback chains:

```python
# Summarization: Ollama (free, local) -> Haiku (paid, reliable) -> no-LLM fallback
def summarize(text):
    try:
        return summarize_ollama(text)  # Local LLM, fastest
    except Exception:
        pass

    try:
        return summarize_anthropic(text)  # API call, costs money
    except Exception:
        pass

    return fallback_summary(text)  # Just counts and lists, no LLM
```

```python
# Memory recall: 5-layer fallback (see agent-memory-recall.py)
# Each layer has a 5-second timeout
# If all fail, return empty list — never crash
```

### Pattern 6: Correction Escalation

Track how often the same correction appears. After 3 occurrences, escalate:

```python
# corrections-history.json tracks: {"pattern": count, ...}
history = load_corrections_history()

for correction in new_corrections:
    key = normalize(correction)  # Strip dates, ids
    history[key] = history.get(key, 0) + 1

    if history[key] >= 3:
        # This correction keeps happening — escalate
        stage_for_rules_update(correction)
        # "Consider adding this to agent rules or CLAUDE.md"
```

---

## Tips and Gotchas

### Always exit 0
A non-zero exit code or unhandled exception can disrupt Claude Code. Every hook must have:
```python
if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
```

### Use stderr for debugging
`print("debug", file=sys.stderr)` goes to the terminal, not to Claude. Use for debugging.

### Keep UserPromptSubmit hooks fast
This fires on every prompt. If it takes 2 seconds, every interaction feels laggy. No API calls, no database queries, no subprocess calls. Keyword matching only.

### Merge settings.json, don't overwrite
If writing a tool that installs hooks, merge into existing config:
```javascript
existing.hooks = { ...existing.hooks, ...newHooks };
```

### SessionEnd is unreliable for idle peers
Agent terminals often sit idle after finishing work. SessionEnd may never fire. Use PreCompact as a safety net for critical saves.

### Hooks don't inherit shell environment
If your hook needs `.env` variables, load them manually (see `lib/config.py` pattern above).

### Watch out for JSONL transcript format changes
Hooks that parse `~/.claude/projects/*/session.jsonl` rely on an undocumented internal format. It can change between Claude Code versions. Build defensively with try/except around every JSONL parse.

### Use temp files for per-session state
For counters that reset each session, use `/tmp/.claude-{hook}-{session_id}` files. They auto-cleanup on reboot.

### Test hooks with piped input
```bash
echo '{"session_id": "test", "prompt": "fix the API tests"}' | python3 .claude/hooks/agent-router.py
```
