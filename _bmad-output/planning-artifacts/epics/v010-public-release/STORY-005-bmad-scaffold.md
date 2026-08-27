---
story: STORY-005
epic: EPIC-V010-PUBLIC-RELEASE
title: "BMAD Scaffold"
sprint: 1
priority: P1
effort: M
status: planned
assigned: TBD
dependencies: [STORY-001]
traces_to: [FR17, FR18, AR9]
---

# STORY-005: BMAD Scaffold

**As a** developer who wants structured coding workflow for their agents,
**I want** optional BMAD integration during init,
**So that** my agents follow epic -> story -> implement -> verify discipline.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/templates/bmad/` | CREATE directory | Minimal BMAD v6 scaffold |
| `src/templates/bmad/config.yaml` | CREATE | BMAD config with peer-orchestra defaults |
| `src/templates/CLAUDE.md.template` | MODIFY | Add conditional BMAD section |
| `src/index.js` | MODIFY | Wire `--bmad` flag to scaffold BMAD templates |
| `commands/` | VERIFY/MODIFY | Ensure /dispatch, /orchestra-status, /party, /archon-council work as CLAUDE.md instructions (not plugin commands) |

## Acceptance Criteria

- [ ] `src/templates/bmad/` directory exists with minimal BMAD v6 scaffold
- [ ] `src/templates/bmad/config.yaml` has correct defaults for peer-orchestra projects
- [ ] `npx peer-orchestra init --bmad` scaffolds `_bmad/` and `_bmad-output/` directories
- [ ] When BMAD is enabled, CLAUDE.md includes: "ALWAYS follow BMAD workflow before any implementation: epic -> story -> readiness check -> implement"
- [ ] When BMAD is NOT enabled, no BMAD references in installed files
- [ ] `--bmad` flag works in both interactive and non-interactive modes
- [ ] Commands in `commands/` directory are valid CLAUDE.md instruction format (not plugin skill format)
- [ ] `/dispatch` command format matches the structured dispatch protocol from `multi-agent-dispatch.md`

## Test Plan

- Run init with `--bmad` flag — verify `_bmad/` and `_bmad-output/` directories created
- Run init without `--bmad` — verify no BMAD directories or references
- Read installed CLAUDE.md — verify BMAD section present/absent based on flag
- Read `commands/dispatch.md` — verify it's markdown instruction format, not YAML plugin format
- Verify `_bmad/config.yaml` has valid YAML structure

## Notes

The BMAD scaffold should be MINIMAL — just enough for the workflow to function. Don't ship the full BMAD v6 distribution. Include: config.yaml, core workflow pointers, and standard template references. The actual BMAD tooling lives in the BMAD npm package — peer-orchestra just provides the project scaffold.

The 4 commands (`/dispatch`, `/orchestra-status`, `/party`, `/archon-council`) currently exist as plugin command files. They need to work as CLAUDE.md-referenced instructions since there's no plugin to register them.
