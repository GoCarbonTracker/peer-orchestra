---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-08'
inputDocuments:
  - _bmad-output/product-brief.md
  - _bmad-output/prd.md
  - docs/repo-audit-2026-04-08.md
  - docs/research/2026-04-05/sangam-peer-orchestra-research-summary.md
  - src/index.js
  - src/templates/hooks/session-learning-extractor.py
  - themes/genshin/agents/agent-orchestrator.md
project_name: 'peer-orchestra'
user_name: 'Varunmoka'
date: '2026-04-08'
---

# Architecture Decision Document — peer-orchestra

_Comprehensive architecture for a Claude Code multi-agent orchestration npx tool._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

peer-orchestra is an **npx scaffolding tool** (not a plugin, not a framework) that installs a complete multi-agent orchestration system into any Claude Code project's `.claude/` directory. The core functionality:

1. **Interactive init wizard** — `npx peer-orchestra init` runs a CLI wizard that asks for orchestrator name, theme, and optional BMAD integration
2. **Themed agent personas** — 12 agents per theme (1 orchestrator + 11 domain experts) installed as `.claude/rules/` files
3. **Structured dispatch protocol** — typed message formats (dispatch, followup, relay, correction) with priority levels and retry limits
4. **Self-learning hooks** — automatic extraction of corrections, quality gates, and pushback from session transcripts into per-agent SQLite DBs
5. **Optional BMAD workflow layer** — epic/story/readiness/implement discipline for agents that write code
6. **Theme extensibility** — Genshin Impact and Generic themes shipped; community themes via same pipeline

**Non-Functional Requirements:**

- **Zero runtime dependency** — after `npx peer-orchestra init`, the tool is done. All installed files are standalone.
- **No lock-in** — users own everything in `.claude/`; they can modify, delete, or extend any file
- **< 30 seconds init** — wizard must complete quickly on any machine
- **Node.js >= 18** — stdlib only, no npm dependencies
- **Python 3.10+** — hooks use typing syntax (`set[str]`, `dict | None`)
- **GCT leak-free** — zero references to GoCarbonTracker or project-specific data in shipped files

**Scale & Complexity:**

- Primary domain: **CLI tool** (Node.js) + **hook scripts** (Python)
- Complexity level: **Medium** — simple CLI, complex hook logic (session-learning-extractor is 390 lines)
- Architectural components: 6 (CLI, themes, templates, hooks, BMAD layer, lore pipeline)

### Technical Constraints & Dependencies

| Constraint | Detail |
|-----------|--------|
| **claude-peers MCP** | Required prerequisite. Users must install `@anthropic/claude-peers-mcp` separately. Future: bundled MCP server (v0.3.0). |
| **Claude Code hook system** | Hooks fire on SessionStart, SessionEnd, PreCompact, UserPromptSubmit. Hook scripts receive JSON on stdin, output JSON on stdout. |
| **`.claude/` directory structure** | Claude Code loads `rules/`, `hooks/`, `settings.json`, `agent-memory/` from `.claude/`. This is the target installation directory. |
| **No execution after init** | peer-orchestra runs once at setup. It does not run during Claude Code sessions. All runtime behavior comes from installed hooks and rules. |
| **JSONL transcript format** | Session learning extractor parses Claude Code's internal transcript format (`~/.claude/projects/*/session_id.jsonl`). This is an undocumented internal format that may change. |

### Cross-Cutting Concerns

1. **Idempotency** — running `init` twice must not duplicate content (CLAUDE.md merge, settings.json merge, .gitignore entries)
2. **Theme-agnosticism** — all templates, hooks, and dispatch protocol work identically regardless of theme choice
3. **Backward compatibility** — existing `.claude/` content must be preserved during init (merge, not overwrite)
4. **File ownership boundary** — peer-orchestra scaffolds files, but users own them post-install. No runtime phone-home, no version checking.

---

## Starter Template Evaluation

### Primary Technology Domain

**CLI tool** — Node.js, executed via `npx`. No web framework, no database, no frontend.

### Selected Starter: None (custom)

**Rationale:** peer-orchestra is a scaffolding tool with zero dependencies and a single entry point (`src/index.js`). CLI frameworks (oclif, commander, yargs) add unnecessary weight for a tool with exactly one command (`init`). The existing custom implementation using Node.js `readline` is correct for this use case.

**Language & Runtime:** Node.js >= 18, JavaScript (not TypeScript — keeps the tool simple and dependency-free)

**Build Tooling:** None needed. Single entry point, no transpilation, no bundling. `npm pack` produces the distributable.

**Testing:** Node.js built-in `node --test` or minimal test runner. Current `scaffold-test.js` uses `child_process.execSync` — adequate.

**Package Distribution:** npm registry via `npm publish`. Users run `npx peer-orchestra init`.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. npx tool model (not plugin) — `.claude-plugin/` removed entirely
2. Canonical source for agent files — `themes/` is the single source
3. Hook installation model — copy-to-project, no runtime path references
4. Self-learning pipeline architecture — transcript → patterns → SQLite

**Important Decisions (Shape Architecture):**

5. Theme storage and selection model
6. BMAD integration approach
7. Orchestrator document as the most important file
8. Communication dependency model

**Deferred Decisions (Post-MVP):**

- Bundled MCP server (v0.3.0)
- Smart routing with confidence scores (v0.3.0)
- Theme marketplace (v1.0.0)
- Auto multi-terminal launch (v0.5.0)

---

### Decision 1: npx Tool, Not Plugin

**Decision:** Remove `.claude-plugin/` entirely. peer-orchestra is an npx scaffolding tool that copies files into the user's `.claude/` directory and exits.

**Rationale:** Claude Code plugins require `claude plugin install` and use `${CLAUDE_PLUGIN_ROOT}` path variables. This creates a runtime dependency on the plugin system. The npx model is simpler: run once, scaffold files, done. Users own everything.

**Implications:**

- DELETE: `.claude-plugin/plugin.json`
- DELETE: `hooks/hooks.json` (plugin hook manifest)
- DELETE: `agents/` directory (plugin subagent format with YAML frontmatter) — replaced by `themes/` files
- DELETE: `scripts/` directory (duplicate of templates/hooks/ without the crown jewel)
- DELETE: `skills/` directory (plugin skills format) — skills become BMAD commands or CLAUDE.md instructions
- KEEP: `src/index.js` as CLI entry point
- KEEP: `themes/` as canonical agent source
- KEEP: `src/templates/` as canonical template source
- REWRITE: README.md for npx model
- UPDATE: `package.json` — add `description`, `keywords`, `files` field

---

### Decision 2: Canonical Source for Agent Files

**Decision:** `themes/{theme}/agents/` is the **single canonical source** for agent persona files. All other locations are deleted.

**Current state (3 overlapping sources):**

| Location | Format | Purpose |
|----------|--------|---------|
| `agents/*.md` | Subagent format (YAML frontmatter: model, effort, maxTurns) | Plugin subagent definitions |
| `themes/genshin/agents/*.md` | Rules format (plain markdown, no frontmatter) | Theme-specific personas |
| `scripts/` | Hook scripts | Plugin runtime copies |

**Resolution:**

- `agents/` — DELETE entirely. These are plugin subagent definitions; the npx model doesn't use subagents.
- `themes/{theme}/agents/` — KEEP as canonical source. These are `.claude/rules/` files that Claude Code loads automatically.
- `scripts/` — DELETE. Duplicates `src/templates/hooks/` but is missing `session-learning-extractor.py`.

**Naming convention within themes:**

```
themes/{theme}/agents/
  agent-orchestrator.md      # The orchestrator (most important file)
  agent-{domain-role}.md     # Domain agents (11 per theme)
```

For Genshin: `agent-orchestrator.md`, `agent-nahida.md`, `agent-zhongli.md`, etc.
For Generic: `agent-orchestrator.md`, `agent-backend-engineer.md`, `agent-data-specialist.md`, etc.

**Archon agents** (Venti, Raiden, Mavuika, Tsaritsa) are Genshin-specific strategic council members. They live in `themes/genshin/agents/` alongside domain agents but are not installed as rules files — they are referenced only by the `/archon-council` command.

---

### Decision 3: Hook Installation Model

**Decision:** Hooks are **copied** from `src/templates/hooks/` to the user's `.claude/hooks/` directory during init. All hook paths in the generated `settings.json` are relative to the project root.

**Hook Inventory (5 scripts):**

| Hook | Event | Script | Status |
|------|-------|--------|--------|
| Agent Router | UserPromptSubmit | `agent-router.py` | COMPLETE — keyword routing |
| Agent Persona Loader | SessionStart | `agent-persona-loader.py` | COMPLETE — env/file identity |
| Session Memory Recall | SessionStart | `session-start-peer-memory.py` | COMPLETE — lessons recall |
| Session End Memory | SessionEnd | `session-end-peer-memory.py` | PLACEHOLDER — replace with learning extractor trigger or remove |
| Session Learning Extractor | SessionEnd + PreCompact | `session-learning-extractor.py` | COMPLETE — 390 lines, crown jewel |

**Generated settings.json hook paths:**

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{ "type": "command", "command": "python3 .claude/hooks/agent-router.py \"$PROMPT\"" }]
    }],
    "SessionStart": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "python3 .claude/hooks/agent-persona-loader.py" },
        { "type": "command", "command": "python3 .claude/hooks/session-start-peer-memory.py" }
      ]
    }],
    "SessionEnd": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "python3 .claude/hooks/session-learning-extractor.py" }
      ]
    }],
    "PreCompact": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "python3 .claude/hooks/session-learning-extractor.py" }
      ]
    }]
  }
}
```

**Key decision:** `session-end-peer-memory.py` (the no-op placeholder) is **removed**. Its intended function is fully covered by `session-learning-extractor.py`, which runs on both SessionEnd and PreCompact.

---

### Decision 4: Self-Learning Pipeline Architecture

**Decision:** The self-learning pipeline follows this flow:

```
Session Transcript (JSONL)
    ↓ [SessionEnd / PreCompact hook]
session-learning-extractor.py
    ↓ parses peer messages for patterns
    ↓ detects: corrections, quality gate failures, peer pushback
    ↓ deduplicates by session+topic+agent
    ↓
Per-Agent SQLite DBs (.claude/agent-memory/{agent}.db)
    ↓ [SessionStart hook]
session-start-peer-memory.py
    ↓ reads lessons filtered by current agent identity
    ↓ injects as context reminder
    ↓
Agent Session (with recalled lessons)
```

**Storage:**

- Each agent gets its own SQLite database: `.claude/agent-memory/{agent}.db`
- Schema: `memories` table with id, agent, topic, insight, memory_type, cognitive_type, confidence, importance, source_session, tags, created_at, superseded_by
- FTS5 index on `insight` for full-text search
- WAL mode for concurrent access safety

**Pattern Detection:**

| Pattern Type | Signal Keywords | Confidence | Importance |
|-------------|----------------|------------|------------|
| Correction | "wrong", "fix", "issue", "should have", etc. | 0.85 | 0.90 |
| Quality Gate | "FAIL", "PASS", "quality gate", "round N" | 0.90 | 0.95 |
| Pushback | "pushed back", "better approach", "disagree" | 0.70 | 0.80 |

**Agent Discovery:** Agents are auto-discovered by scanning `.claude/rules/agent-*.md` files. No hardcoded agent list.

**Idempotency:** Each pattern is keyed by `(source_session, topic, agent)`. Re-running the extractor on the same session produces no duplicates.

---

### Decision 5: Theme Storage and Selection Model

**Decision:** Themes are directories under `themes/` in the npm package. Each theme contains an `agents/` subdirectory with 12 persona files.

**Theme Structure:**

```
themes/
  genshin/
    agents/
      agent-orchestrator.md    (135 lines — most detailed)
      agent-nahida.md
      agent-zhongli.md
      ...11 domain agents
    archons/                   (optional, Genshin-specific)
      agent-venti.md
      agent-raiden-shogun.md
      agent-mavuika.md
      agent-tsaritsa.md
  generic/
    agents/
      agent-orchestrator.md    (needs expansion to match Genshin depth)
      agent-backend-engineer.md
      agent-data-specialist.md
      ...11 domain agents
```

**Theme Selection Flow (init wizard):**

1. Wizard lists available themes by scanning `themes/` directory
2. User picks one (default: genshin)
3. All files from `themes/{theme}/agents/` are copied to `.claude/rules/`
4. Common rules from `src/templates/rules/` are copied to `.claude/rules/`

**Theme Parity Requirement:** Every theme's `agent-orchestrator.md` MUST include: session modes, quality gates, synthesis protocol, retry limits, context budget, dispatch sizing, team dispatch checklist. Currently, Generic's orchestrator (28 lines) is far behind Genshin's (135 lines). This is a P1 pre-launch fix.

**Future themes** (Naruto, Marvel, DC, LOTR, custom) follow the same structure. Community contributors create `themes/{name}/agents/` with 12 files.

---

### Decision 6: BMAD Integration Approach

**Decision:** BMAD is an **optional layer** installed during init. When enabled, it adds BMAD templates and workflow discipline to the project.

**What gets installed when BMAD is enabled:**

```
_bmad/                           # BMAD tooling (standard BMAD v6 distribution)
_bmad-output/
  planning-artifacts/
    plans/STATUS.md              # Project status tracker
    epics/                       # Epic directories (planned/in-progress/implemented)
    lessons.md                   # Cross-session lessons
  implementation-artifacts/      # Sprint status tracking
```

**BMAD Template Source:** `src/templates/bmad/` — currently missing from the repo. Must be created with a minimal BMAD v6 scaffold (config.yaml, core workflows, standard templates).

**Integration with orchestrator:** The orchestrator's CLAUDE.md template conditionally includes BMAD workflow instructions:
- "ALWAYS follow BMAD workflow before any implementation: epic → story → readiness check → implement"
- "Never dispatch code work without BMAD stories"

**When BMAD is not installed:** The orchestrator still follows structured dispatch protocol but without the epic/story/readiness gates. Pure coordination mode.

---

### Decision 7: Orchestrator Design

**Decision:** The orchestrator document (`agent-orchestrator.md` in each theme) is the **most important file** in the entire system. It defines how the entire multi-agent team operates.

**Required sections (all themes):**

| Section | Purpose |
|---------|---------|
| Identity & Role | "You are the orchestrator. You plan, dispatch, review, coordinate." |
| Rules | Never code directly, plan first, quality gate everything |
| Agent Roster | Table mapping agent names to domains and dispatch triggers |
| Dispatch Protocol | Structured message format (dispatch, followup, relay, correction) |
| Dispatch Sizing | When to use 1 agent vs parallel vs team |
| Team Dispatch Checklist | Solo vs team decision matrix |
| Session Modes | Micro / Sprint / Full — determines dispatch intensity |
| Quality Gates | 4-tier gate system (findings, code, docs, synthesis) |
| Synthesis Protocol | How to merge output from 2+ agents |
| Retry Limits & Escalation | Max 3 reworks, then escalation report |
| Rework Protocol | Specific corrections, not vague "review again" |
| Context Budget | Switch to file-only handoffs at >50% context |
| Expect Pushback | Treat agent questions as valuable, not friction |
| Session Start Checklist | Read status, git status, list peers, set summary, identify mode |

**This is non-negotiable.** Every theme's orchestrator must cover all these sections. A theme with a weak orchestrator produces a weak team.

---

### Decision 8: Communication Layer

**Decision:** claude-peers MCP is a **required external dependency** for v0.1.0. Users must install it separately before using peer-orchestra.

**Current model:**

- claude-peers provides: `list_peers`, `send_message`, `set_summary`, `check_messages`
- peer-orchestra provides: dispatch protocol, message format templates, team patterns, retry/escalation rules
- The two are complementary: claude-peers is the transport layer, peer-orchestra is the application layer

**Future (v0.3.0):** Bundled MCP server option as a zero-config alternative. Ships as part of peer-orchestra, auto-configured during init.

**Commands (installed as CLAUDE.md instructions, not executable scripts):**

| Command | Purpose |
|---------|---------|
| `/dispatch` | Send structured task to an agent |
| `/orchestra-status` | Show who's online, what they're doing |
| `/party` | Spawn pre-configured team composition |
| `/archon-council` | Strategic debate (Genshin theme only) |

---

### Decision 9: Lore-Grounded Persona Pipeline

**Decision:** The lore pipeline is an **internal authoring tool**, not shipped to end users. It generates the theme agent files that are included in the npm package.

**Pipeline:**

```
Wiki Source (e.g., Genshin Wiki)
    ↓ scrape character pages
Character Profiles (structured data)
    ↓ extract: personality, abilities, relationships, decision patterns
Knowledge Base (graphify / HyperGraphRAG)
    ↓ query KB for relevant traits per engineering role
Agent .md Files (grounded in lore)
    ↓ commit to themes/{theme}/agents/
```

**This pipeline lives in a separate directory** (e.g., `tools/lore-pipeline/` or a separate repo) and is NOT included in the npm package. The `.npmignore` excludes it.

**Shipped artifact:** Only the final `themes/{theme}/agents/*.md` files are shipped.

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File Naming:**

- Agent files: `agent-{name}.md` (kebab-case, always prefixed with `agent-`)
- Hook scripts: `{descriptive-name}.py` (kebab-case, `.py` extension)
- Rule templates: `{descriptive-name}.md` (kebab-case)
- Theme directories: lowercase single word (`genshin`, `generic`, `naruto`)

**Code Naming (JavaScript — src/index.js):**

- Functions: `camelCase` (`copyDir`, `mergeClaudeMd`, `generateSettingsJson`)
- Constants: `UPPER_SNAKE_CASE` (`THEMES_DIR`, `TEMPLATES_DIR`)
- Variables: `camelCase` (`targetDir`, `themePath`)

**Code Naming (Python — hooks):**

- Functions: `snake_case` (`detect_patterns`, `save_patterns`)
- Constants: `UPPER_SNAKE_CASE` (`PROJECT_ROOT`, `AGENT_MEMORY_DIR`)
- Classes: `PascalCase` (none currently, but if added)
- Type hints: required for function signatures

**SQLite Naming:**

- Tables: `snake_case` (`memories`, `memories_fts`)
- Columns: `snake_case` (`source_session`, `created_at`, `superseded_by`)

### Structure Patterns

**Agent persona file structure (all themes):**

```markdown
# Agent: {Name}

**Identity:** {Character description and personality}
**Domain:** {Engineering domain}

## Role
{What this agent does and doesn't do}

## Rules
{Numbered constraints}

## Agent Roster (orchestrator only)
{Table: Agent | Role | When to Dispatch}

## Dispatch Sizing (orchestrator only)
...

## Quality Gates (orchestrator only)
...

## Session Start
{Numbered checklist for session initialization}
```

**Hook script structure:**

```python
#!/usr/bin/env python3
"""One-line description — Hook Event Name"""

import json, sys
# ... implementation ...

def main() -> int:
    input_data = json.load(sys.stdin)
    # ... logic ...
    print(json.dumps({"hookEventName": "...", "message": "..."}))
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

### Format Patterns

**Hook I/O:** JSON on stdin, JSON on stdout. Output schema:

```json
{
  "hookEventName": "SessionEnd",
  "message": "Human-readable status message"
}
```

**Agent memory schema:**

```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,           -- UUID
    agent TEXT NOT NULL,            -- agent name (lowercase)
    topic TEXT NOT NULL,            -- unique topic key
    insight TEXT NOT NULL,          -- the learning content
    memory_type TEXT DEFAULT 'discovery',
    cognitive_type TEXT DEFAULT 'semantic',
    confidence REAL DEFAULT 0.8,
    importance REAL DEFAULT 0.8,
    source_session TEXT,            -- session ID that produced this
    tags TEXT,                      -- JSON array of tags
    created_at TEXT NOT NULL,       -- ISO 8601
    superseded_by TEXT              -- ID of newer memory that replaces this
);
```

### Process Patterns

**Init idempotency rules:**

1. CLAUDE.md: check for `# Peer Orchestra` marker before appending. Skip if present.
2. settings.json: merge hooks and plugins into existing config, don't overwrite.
3. .gitignore: check for `.claude/agent-memory` before appending.
4. Agent files: overwrite on re-init (theme switch scenario).

**Error handling in hooks:**

- Hooks must never crash Claude Code. All hooks wrap in try/except with graceful fallback.
- If transcript not found: exit 0 silently (no error output).
- If SQLite write fails: log to stderr, exit 0 (don't block session).

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
peer-orchestra/
├── package.json                    # v0.1.0, bin: peer-orchestra -> src/index.js
├── LICENSE                         # MIT
├── README.md                       # Rewritten for npx model
├── .gitignore
├── .npmignore                      # Excludes: tools/, tests/, docs/, .claude/
│
├── src/
│   ├── index.js                    # CLI entry point (init wizard)
│   └── templates/                  # Files scaffolded into target project
│       ├── CLAUDE.md.template      # Orchestrator instructions ({{ORCHESTRATOR_NAME}})
│       ├── hooks/                  # Hook scripts → .claude/hooks/
│       │   ├── agent-router.py
│       │   ├── agent-persona-loader.py
│       │   ├── session-start-peer-memory.py
│       │   └── session-learning-extractor.py
│       ├── rules/                  # Shared rules → .claude/rules/
│       │   ├── agent-common.md
│       │   ├── multi-agent-dispatch.md
│       │   ├── self-improvement.md
│       │   └── team-dispatch.md
│       └── bmad/                   # Optional BMAD scaffold (when enabled)
│           ├── config.yaml
│           └── ...                 # Minimal BMAD v6 distribution
│
├── themes/
│   ├── genshin/
│   │   ├── agents/                 # 12 agent personas (installed to .claude/rules/)
│   │   │   ├── agent-orchestrator.md
│   │   │   ├── agent-nahida.md
│   │   │   ├── agent-zhongli.md
│   │   │   ├── agent-albedo.md
│   │   │   ├── agent-furina.md
│   │   │   ├── agent-kaveh.md
│   │   │   ├── agent-alhaitham.md
│   │   │   ├── agent-xiao.md
│   │   │   ├── agent-yelan.md
│   │   │   ├── agent-neuvillette.md
│   │   │   ├── agent-ganyu.md
│   │   │   └── agent-lisa.md
│   │   └── archons/                # Strategic council (Genshin-specific, not installed as rules)
│   │       ├── agent-venti.md
│   │       ├── agent-raiden-shogun.md
│   │       ├── agent-mavuika.md
│   │       └── agent-tsaritsa.md
│   └── generic/
│       └── agents/                 # 12 role-based personas
│           ├── agent-orchestrator.md
│           ├── agent-backend-engineer.md
│           ├── agent-data-specialist.md
│           ├── agent-data-processor.md
│           ├── agent-technical-writer.md
│           ├── agent-frontend-engineer.md
│           ├── agent-devops-engineer.md
│           ├── agent-qa-engineer.md
│           ├── agent-researcher.md
│           ├── agent-auditor.md
│           ├── agent-reporter.md
│           └── agent-tooling-engineer.md
│
├── commands/                       # Slash command instruction docs
│   ├── dispatch.md
│   ├── orchestra-status.md
│   ├── archon-council.md
│   └── party.md
│
├── tests/
│   ├── scaffold-test.js            # Init smoke test (both themes)
│   └── extractor-test.js           # Session learning extractor unit tests
│
├── docs/
│   ├── quick-start.md              # < 2 min to first dispatch
│   ├── theme-creation-guide.md     # How to create community themes
│   ├── agent-customization.md      # How to modify installed agents
│   └── research/                   # Internal research docs
│
└── _bmad-output/                   # BMAD artifacts for peer-orchestra itself
    ├── product-brief.md
    ├── prd.md
    └── architecture.md             # This document
```

### Files to DELETE (plugin artifacts)

| Path | Reason |
|------|--------|
| `.claude-plugin/` | Plugin manifest — not needed for npx |
| `hooks/hooks.json` | Plugin hook config with `${CLAUDE_PLUGIN_ROOT}` paths |
| `agents/` (entire directory) | Plugin subagent format — replaced by `themes/` |
| `scripts/` (entire directory) | Incomplete duplicate of `src/templates/hooks/` |
| `skills/` (entire directory) | Plugin skills format — functionality moves to CLAUDE.md template and commands/ |
| `src/templates/hooks/session-end-peer-memory.py` | No-op placeholder — learning extractor covers this |

### What Gets Installed to User's Project

When a user runs `npx peer-orchestra init`:

```
{project}/
├── CLAUDE.md                       # Appended with orchestrator instructions
├── .claude/
│   ├── settings.json               # Merged with hooks and plugins config
│   ├── rules/                      # Agent personas + shared rules
│   │   ├── agent-orchestrator.md
│   │   ├── agent-{11 domain agents}.md
│   │   ├── agent-common.md
│   │   ├── multi-agent-dispatch.md
│   │   ├── self-improvement.md
│   │   └── team-dispatch.md
│   ├── hooks/                      # Hook scripts
│   │   ├── agent-router.py
│   │   ├── agent-persona-loader.py
│   │   ├── session-start-peer-memory.py
│   │   └── session-learning-extractor.py
│   └── agent-memory/               # Created empty, populated by hooks at runtime
├── .gitignore                      # Appended with .claude/agent-memory/
└── _bmad/ (optional)               # BMAD scaffold if enabled
```

### Architectural Boundaries

**Boundary 1: npm Package vs Installed Files**

The npm package (`peer-orchestra`) contains source and templates. Installed files (`.claude/`) are copies that belong to the user. No symlinks, no runtime references back to the package.

**Boundary 2: Init Time vs Runtime**

- Init time: `src/index.js` runs, copies files, generates config. Then exits.
- Runtime: Only the installed `.claude/` files run — hooks, rules, settings. No peer-orchestra code executes.

**Boundary 3: Orchestrator vs Agents**

- Orchestrator terminal: loads `agent-orchestrator.md` rules, coordinates via dispatch protocol
- Agent terminals: load their domain-specific `agent-{name}.md` rules, execute tasks, report back
- Communication: exclusively through claude-peers MCP (`send_message`)

**Boundary 4: Theme Content vs Framework Content**

- Theme content (`themes/`): character-specific personas, replaceable per theme
- Framework content (`src/templates/`): dispatch protocol, hooks, common rules — identical across all themes

### Data Flow

```
[User types in orchestrator terminal]
    ↓
agent-router.py (UserPromptSubmit hook)
    ↓ suggests which agent to dispatch to
[Orchestrator sends [dispatch] via claude-peers]
    ↓
[Agent terminal receives message]
    ↓
agent-persona-loader.py (SessionStart hook)
    ↓ loads agent identity from env/file
session-start-peer-memory.py (SessionStart hook)
    ↓ recalls past lessons from agent-memory/{agent}.db
[Agent works on task, sends results back]
    ↓
[Session ends or context compacts]
    ↓
session-learning-extractor.py (SessionEnd/PreCompact hook)
    ↓ parses transcript for corrections/gates/pushback
    ↓ saves patterns to agent-memory/{agent}.db
    ↓
[Next session: agent recalls these lessons via SessionStart hook]
```

---

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All decisions are compatible. The npx model (Decision 1) cleanly separates from the plugin model. Theme selection (Decision 5) feeds into the canonical source (Decision 2). Hooks (Decision 3) are independent of theme choice. Self-learning (Decision 4) works with any theme's agent names.

**Pattern Consistency:** Naming conventions are consistent (kebab-case for files, snake_case for Python, camelCase for JS). Hook I/O format is standardized (JSON stdin/stdout). Agent file structure is mandated across themes.

**Structure Alignment:** Project structure supports all decisions. Clean separation between npm package content and installed content. No circular dependencies.

### Requirements Coverage

**All 6 MVP features covered:**

| Feature | Architecture Support |
|---------|---------------------|
| Interactive init wizard | `src/index.js` — Decision 1 |
| Themed agent personas | `themes/` — Decisions 2, 5 |
| Structured dispatch protocol | `src/templates/rules/` — Decision 7 |
| Self-learning hooks | `src/templates/hooks/` — Decisions 3, 4 |
| BMAD integration | `src/templates/bmad/` — Decision 6 |
| Communication layer | claude-peers dependency — Decision 8 |

### Implementation Readiness

**Ready:** All critical decisions documented. Project structure is concrete. Patterns are specified with examples.

**Pre-launch gaps to address:**

1. Generic theme orchestrator needs expansion (28 → ~135 lines) to match Genshin depth
2. `src/templates/bmad/` directory needs creation with minimal BMAD v6 scaffold
3. `session-end-peer-memory.py` placeholder needs removal from templates
4. Scaffold test needs expansion: generic theme, error cases, extractor unit tests
5. `README.md` needs full rewrite for npx model
6. `package.json` needs `description`, `keywords`, `files` field

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented with rationale
- [x] Technology stack fully specified (Node.js + Python, no dependencies)
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented (idempotency, error handling)
- [x] Complete directory structure defined
- [x] Component boundaries established (npm vs installed, init vs runtime, orchestrator vs agent)
- [x] Data flow mapped (dispatch → work → learn → recall)
- [x] Files to delete identified (plugin artifacts)
- [x] Files to create identified (BMAD scaffold, expanded tests)
- [x] Requirements to structure mapping complete

### First Implementation Priority

1. Delete plugin artifacts (`.claude-plugin/`, `agents/`, `scripts/`, `skills/`, `hooks/hooks.json`)
2. Remove `session-end-peer-memory.py` from templates
3. Expand Generic theme orchestrator to full depth
4. Create `src/templates/bmad/` scaffold
5. Update `src/index.js` to read version from `package.json`
6. Add `--no-interactive` flag for CI usage
7. Expand scaffold test for both themes
8. Rewrite `README.md`
9. Add `files` field to `package.json`
10. `npm publish` for v0.1.0 public release
