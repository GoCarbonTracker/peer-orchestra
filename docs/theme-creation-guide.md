# Theme Creation Guide

Create a theme pack that maps fictional characters (or professional roles) to engineering agent personas.

---

## Theme Structure

A theme is a directory under `themes/` with 12 agent persona files:

```
themes/your-theme/
  agents/
    agent-orchestrator.md      # The coordinator (most important file)
    agent-backend.md           # Backend / architecture
    agent-frontend.md          # Frontend / UI
    agent-qa.md                # Testing / quality
    agent-data.md              # Data / KB management
    agent-data-processor.md    # Data extraction / processing
    agent-infra.md             # Infrastructure / security
    agent-research.md          # Research / intelligence
    agent-docs.md              # Documentation / writing
    agent-audit.md             # Audit / compliance review
    agent-reporting.md         # Reporting / admin
    agent-tooling.md           # Tooling / internals
```

File names must start with `agent-` and end with `.md`.

---

## Agent Persona File Format

Each file follows this structure:

```markdown
# Agent: {Name}

**Identity:** {Name}, {description}. {Personality traits}.
**Domain:** {Domain area} — {specific capabilities}.

## Role

{What this agent does. What it doesn't do. 2-3 sentences.}

## Rules

1. {Constraint or behavioral rule}
2. {Another rule}
3. {Another rule}

## Abilities

- {Capability 1}
- {Capability 2}
- {Capability 3}

## Domain Rules

- {Domain-specific constraint}
- {Another domain rule}

## Self-Learning

- Save corrections to memory on task completion
- Recall past lessons at session start
- Track domain-specific patterns
```

### Required Fields

| Field | Purpose |
|-------|---------|
| **Identity** | Character name, personality, and voice |
| **Domain** | Engineering domain and specific capabilities |
| **Abilities** | What this agent can do (5-10 items) |
| **Domain Rules** | Constraints and behavioral rules |
| **Self-Learning** | How the agent persists and recalls knowledge |

### Optional Fields

| Field | Purpose |
|-------|---------|
| **Role** | Extended description of responsibilities |
| **Rules** | Numbered behavioral constraints |
| **Key Files** | Table of important files for this agent's domain |
| **Verification Commands** | Shell commands to validate work |
| **Learnings** | Directories where the agent's output accumulates |

---

## The Orchestrator File

`agent-orchestrator.md` is the most important file. It defines how the entire team operates. Every theme's orchestrator **must** include these sections:

| Section | Purpose |
|---------|---------|
| Identity & Role | "You are the orchestrator. You plan, dispatch, review, coordinate." |
| Agent Roster | Table mapping agent names to domains and dispatch triggers |
| Dispatch Protocol | Structured message format (dispatch, followup, relay, correction) |
| Dispatch Sizing | When to use 1 agent vs parallel vs team |
| Session Modes | Micro / Sprint / Full — dispatch intensity by task scope |
| Quality Gates | How to verify agent output before accepting it |
| Synthesis Protocol | How to merge output from 2+ agents |
| Retry Limits | Max 3 reworks per task, then escalation |
| Context Budget | Switch to file-only handoffs at high context usage |
| Team Dispatch | Decision matrix for solo vs team tasks |

Reference `themes/genshin/agents/agent-orchestrator.md` (135 lines) as the gold standard.

---

## Tips for Good Personas

**Map character traits to engineering behavior:**
- A strategic character -> dependency analysis, architecture decisions
- A meticulous character -> testing, validation, edge cases
- A bold character -> rapid prototyping, frontend, user-facing work
- A scholarly character -> documentation, research, knowledge management

**Keep files under 150 lines.** Agent rule files are loaded into Claude's context window. Longer files compete with code for context budget.

**Be specific, not generic.** "Writes clean code" is useless. "Validates all API responses against the schema before returning" is actionable.

**Test your theme's personality.** Does the orchestrator feel different from a generic coordinator? Do agents respond in character? If they all sound the same, the theme isn't working.

---

## Submitting a Theme

### 1. Create your theme directory

```bash
mkdir -p themes/your-theme/agents
# Create all 12 agent files
```

### 2. Run the scaffold test

```bash
# The test verifies file structure, format, and GCT leak detection
npm test
```

The scaffold test checks:
- All 12 agent files exist
- Each file has Identity/Role sections
- No project-specific references leaked (GoCarbonTracker, etc.)
- settings.json is valid

### 3. Submit a PR

- Branch from `main`
- Add your theme under `themes/your-theme/`
- Include a brief description in the PR: theme name, source franchise, character-to-role mapping rationale
- The scaffold test runs in CI — it must pass

### Quality Gates

Your theme PR will be reviewed for:
- **Format compliance** — all 12 files, required sections present
- **Orchestrator depth** — must cover all required orchestrator sections
- **No content leaks** — zero references to other projects or hardcoded paths
- **Character consistency** — personas should feel authentic to source material
- **Actionable rules** — domain rules must be specific, not generic platitudes
