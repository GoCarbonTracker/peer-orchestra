---
story: STORY-003
epic: EPIC-V010-PUBLIC-RELEASE
title: "Generic Theme Parity"
sprint: 1
priority: P1
effort: M
status: planned
assigned: TBD
dependencies: [STORY-001]
traces_to: [FR10, AR4]
---

# STORY-003: Generic Theme Parity

**As a** developer who prefers professional role names over fictional characters,
**I want** the Generic theme's orchestrator to have the same depth as Genshin's,
**So that** my team gets the same dispatch quality, quality gates, and team patterns regardless of theme choice.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `themes/generic/agents/agent-orchestrator.md` | REWRITE | Expand from 28 lines to ~135 lines matching Genshin depth |
| `themes/genshin/archons/` | CREATE directory | Move archon agents here from `themes/genshin/agents/` if not already separated |

## Acceptance Criteria

- [ ] Generic `agent-orchestrator.md` includes ALL of these sections (matching Genshin):
  - [ ] Identity & Role
  - [ ] Rules (never code directly, plan first, etc.)
  - [ ] Agent Roster table (mapping generic role names to domains)
  - [ ] Dispatch Protocol (typed messages, priorities)
  - [ ] Dispatch Sizing (1 agent vs parallel vs team)
  - [ ] Team Dispatch Checklist (solo vs team decision matrix)
  - [ ] Session Modes (Micro / Sprint / Full)
  - [ ] Quality Gates (4-tier gate system)
  - [ ] Synthesis Protocol (merging output from 2+ agents)
  - [ ] Retry Limits & Escalation (max 3 reworks)
  - [ ] Rework Protocol (specific corrections)
  - [ ] Context Budget (file-only handoffs at >50%)
  - [ ] Expect Pushback (treat agent questions as valuable)
  - [ ] Session Start Checklist
- [ ] Generic orchestrator uses professional tone (no character personality), but same structural depth
- [ ] Archon agents (Venti, Raiden, Mavuika, Tsaritsa) are in `themes/genshin/archons/`, NOT in `themes/genshin/agents/`
- [ ] Both `themes/genshin/agents/` and `themes/generic/agents/` contain exactly 12 files each

## Test Plan

- Word count comparison: Generic orchestrator within 80% of Genshin orchestrator line count
- Section heading grep: all 14 required sections present in Generic orchestrator
- `ls themes/genshin/agents/ | wc -l` = 12
- `ls themes/generic/agents/ | wc -l` = 12
- `ls themes/genshin/archons/ | wc -l` = 4 (Venti, Raiden, Mavuika, Tsaritsa)
- Read Generic orchestrator — verify no Genshin character references

## Notes

The Generic orchestrator should feel like working with a professional engineering manager — structured, methodical, no personality flavor. Same protocols, different voice. Use role titles (e.g., "Backend Engineer" not "Zhongli") throughout.
