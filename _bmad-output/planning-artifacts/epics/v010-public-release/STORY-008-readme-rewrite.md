---
story: STORY-008
epic: EPIC-V010-PUBLIC-RELEASE
title: "README Rewrite"
sprint: 2
priority: P1
effort: M
status: planned
assigned: TBD
dependencies: [STORY-002]
traces_to: [FR16, FR18]
---

# STORY-008: README Rewrite

**As a** developer discovering peer-orchestra on GitHub or npm,
**I want** a clear README that gets me from zero to first dispatch in under 2 minutes,
**So that** I can understand and adopt the tool without reading lengthy documentation.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `README.md` | REWRITE | Full rewrite for npx model |
| `docs/quick-start.md` | CREATE | Detailed quick start guide |
| `docs/theme-creation-guide.md` | CREATE | How to create and contribute themes |
| `docs/agent-customization.md` | CREATE | How to modify installed agents |

## Acceptance Criteria

**README.md:**
- [ ] Zero references to "plugin", "claude plugin install", or `.claude-plugin/`
- [ ] Quick start: `npx peer-orchestra init` prominently featured
- [ ] Prerequisites clearly stated: Claude Code + claude-peers MCP
- [ ] Agent team roster table (both themes)
- [ ] Architecture diagram updated (no `.claude-plugin/` in tree)
- [ ] Five layers table updated
- [ ] Commands table shows /dispatch, /orchestra-status, /party, /archon-council
- [ ] Team patterns table (TDD Loop, Build+Validate, Research+Docs, Implement+Review)
- [ ] Self-learning + evolution section
- [ ] Contributing section with theme creation focus
- [ ] < 250 lines total
- [ ] "Your real AI team." tagline prominent

**docs/quick-start.md:**
- [ ] Step-by-step: install prerequisites -> run init -> open terminals -> dispatch first task
- [ ] Estimated time: < 2 minutes
- [ ] Screenshots or code blocks for each step

**docs/theme-creation-guide.md:**
- [ ] Agent persona file format specification
- [ ] Required fields: Identity, Domain, Abilities, Domain Rules, Self-Learning
- [ ] How to submit a theme PR
- [ ] Scaffold test as quality gate

**docs/agent-customization.md:**
- [ ] How to modify installed agent files
- [ ] How to add/remove agents
- [ ] How to adjust dispatch protocol

## Test Plan

- Read README.md aloud — can a newcomer follow it to first dispatch in < 2 min?
- Word count: < 250 lines
- `grep -i "plugin" README.md` — zero results
- `grep -i "claude plugin install" README.md` — zero results
- All internal links resolve
- Code blocks are syntactically correct

## Notes

The current README (232 lines) is well-structured but references the plugin model throughout. The rewrite should preserve the good structure (What Is This, Quick Start, The Team, Architecture, Commands, Self-Learning, Contributing) while updating all references to the npx model.
