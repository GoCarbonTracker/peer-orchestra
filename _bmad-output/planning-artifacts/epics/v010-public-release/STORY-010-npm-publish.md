---
story: STORY-010
epic: EPIC-V010-PUBLIC-RELEASE
title: "npm Publish & Smoke Test"
sprint: 2
priority: P0
effort: S
status: planned
assigned: TBD
dependencies: [STORY-001, STORY-002, STORY-003, STORY-004, STORY-005, STORY-006, STORY-007, STORY-008, STORY-009]
traces_to: [FR1, FR6, FR11, FR12]
---

# STORY-010: npm Publish & Smoke Test

**As a** the peer-orchestra team,
**I want** the package published to npm and verified via live smoke test,
**So that** `npx peer-orchestra init` works globally for any developer.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| None | PUBLISH | `npm publish` from clean state |

## Pre-Publish Checklist

All must pass before `npm publish`:

- [ ] `npm test` — all tests green
- [ ] `npm pack --dry-run` — file list is clean (no internal files)
- [ ] `grep -r "GoCarbonTracker" src/ themes/ commands/` — zero results
- [ ] `grep -r "CLAUDE_PLUGIN_ROOT" .` — zero results
- [ ] `grep -r "plugin.json" src/ themes/` — zero results
- [ ] `git status` — working tree clean
- [ ] `git tag v0.1.0` — version tag created
- [ ] README.md reviewed — no plugin references, quick start is clear

## Acceptance Criteria

- [ ] `npm publish` succeeds
- [ ] `npx peer-orchestra --version` outputs "peer-orchestra v0.1.0" (from any machine)
- [ ] `npx peer-orchestra init --theme genshin --name Paimon --no-interactive --dir /tmp/smoke-test` completes successfully
- [ ] Smoke test project has: 12 agent files, 4 rule files, 4 hook files, settings.json, CLAUDE.md section, .gitignore entry
- [ ] `npx peer-orchestra init --theme generic --name Commander --no-interactive --dir /tmp/smoke-test-2` also completes
- [ ] Zero GCT references in any installed file (both smoke tests)
- [ ] Package appears on npmjs.com with correct metadata (description, keywords, license)

## Test Plan

**Automated (pre-publish):**
- `npm test` — full suite
- `npm pack --dry-run` — file audit
- Leak detection greps (GCT, plugin)

**Manual smoke test (post-publish):**
1. On a clean machine (or clean npm cache): `npx peer-orchestra init`
2. Verify interactive wizard works
3. Open 2 Claude Code terminals in the scaffolded project
4. Terminal 1: verify orchestrator persona loads
5. Terminal 2: verify agent persona loads
6. Dispatch a simple task — verify structured message received

## Notes

This is the final story. It depends on ALL other stories being complete. The smoke test should be run on a machine that has never had peer-orchestra installed locally — simulating a first-time user experience.

After publish: create a GitHub release with changelog, tag the commit, and update the README badge if applicable.
