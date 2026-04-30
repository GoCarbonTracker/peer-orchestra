---
story: STORY-005
epic: EPIC-V020-SHELL-INTEGRATION
title: "Tests + README + docs/quick-start update"
sprint: 1
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: STORY-001, STORY-002, STORY-003, STORY-004
---

# STORY-005: Tests + README + docs/quick-start update

**As a** peer-orchestra contributor,
**I want** the new shell-integration feature covered by tests and
documented in the canonical user docs,
**So that** v0.2.0 ships with the same quality bar as v0.1.0 and new
users discover the feature without reading source.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `tests/shell-installer-test.js` | CREATE | Unit tests for STORY-002 |
| `tests/editor-settings-patcher-test.js` | CREATE | Unit tests for STORY-003 |
| `tests/setup-shell-command-test.js` | CREATE | Integration tests for STORY-004 |
| `tests/fixtures/shell/` | CREATE | Sample rc files (empty, populated, with-existing-block, malformed) |
| `tests/fixtures/editor/` | CREATE | Sample settings.json files (empty, jsonc, populated, malformed) |
| `tests/fixtures/agents/` | CREATE | Sample `.claude/rules/agent-*.md` files for shortcut-derivation tests |
| `README.md` | EDIT | Add `setup-shell` to the Quick Start flow |
| `docs/quick-start.md` | EDIT | Add a section showing the canonical journey: `init` → `setup-shell` → typed agent name |
| `docs/setup-shell.md` | CREATE | Reference doc — what gets installed, where, how to uninstall, troubleshooting |
| `package.json` | EDIT | Bump version to `0.2.0`, add `setup-shell` to keywords if appropriate |
| `CHANGELOG.md` | EDIT (or CREATE if missing) | v0.2.0 entry |

## Test Coverage Targets

- Shell installer: 100% of branches in `installShellBlock`
  (install/replace/uninstall/dry-run, missing file, malformed
  markers)
- Editor patcher: 100% of branches in `patchEditorSettings`
  (install/no-op/update/restore/uninstall, missing file, jsonc,
  malformed)
- Setup-shell command: snapshot tests on stdout summary +
  integration assertion that shell installer and editor patcher are
  invoked with correct args based on flag combinations

## README Edits

Insert after the existing "Install" section:

```markdown
### Activate Shell Shortcuts

```bash
npx peer-orchestra setup-shell
```

This adds a small block to your shell rc file so you can launch any
agent by name:

```bash
furina       # launches Claude as Furina with a "Furina" tab title
xiao         # launches as Xiao
orchestrator # launches as the orchestrator
```

Each tab is auto-titled with the agent's name. Removable cleanly
with `npx peer-orchestra setup-shell --uninstall`.
```

## docs/quick-start.md Edits

Add a "Step 3" section showing:

1. After `init`, run `setup-shell`
2. Reload shell (`source ~/.zshrc`)
3. Open a new terminal tab in your editor and type one agent name
4. Confirm the tab title shows the agent's name

## docs/setup-shell.md (new)

Sections:

1. **What it installs** — the marker block in your shell rc, the two
   editor settings keys, the agent-derived shortcuts
2. **Where** — exact file paths per platform
3. **How to verify** — `which furina` (or your agent name) shows the
   function definition; `echo $TERM_PROGRAM` confirms editor
4. **How to uninstall** — `--uninstall` flag; manual removal
   instructions
5. **Troubleshooting** — common cases:
   - "Shortcut name not found" → reload shell or run
     `peer_orch_shortcuts` manually
   - "Tab title still shows numbers" → check `TERM_PROGRAM`; for
     Apple Terminal / iTerm2 / etc., manual instructions linked
   - "Re-running gave me two blocks" → bug, file an issue
6. **Per-terminal manual instructions** — for Apple Terminal, iTerm2,
   Warp, Tabby, Hyper

## Acceptance Criteria

- [ ] All test files exist and pass (`npm test` exits 0)
- [ ] Existing `tests/scaffold-test.js` and
  `tests/extractor-test.js` continue to pass (no regressions from
  the version bump or any incidental edits)
- [ ] README's Quick Start ends with the user able to type a single
  agent name and get a titled tab
- [ ] `docs/quick-start.md` reflects the three-step journey
- [ ] `docs/setup-shell.md` exists and is linked from both README
  and quick-start
- [ ] `package.json` version is `0.2.0`
- [ ] `CHANGELOG.md` has a v0.2.0 entry summarizing the new command,
  the new env var, the supported shells, and the supported editors
- [ ] No GCT or external-project references in any new doc or test
  fixture (this is OSS, ship neutral)

## Test Plan

- Run `npm test` → exits 0 with new tests included
- Spot-check rendered docs in a Markdown previewer for layout
- Smoke run: `npm pack && npx ./peer-orchestra-0.2.0.tgz setup-shell
  --dry-run` in a scratch dir produces sensible output
- Manual: install in a fresh VM / container, follow README step by
  step, confirm a typed agent name launches Claude with a titled tab
  (this is the v0.2.0 release-gate manual test)

## Dependencies

- STORY-001 (templates)
- STORY-002 (installer)
- STORY-003 (editor patcher)
- STORY-004 (command)

## Notes

- The CHANGELOG.md format follows Keep a Changelog style if a prior
  changelog exists; otherwise a minimal `## [0.2.0] - 2026-04-30`
  block with subsections (Added, Changed, Removed) is sufficient
- Manual VM test is the gate for actual `npm publish` — don't
  publish based on `npm test` alone
- If any test needs to assert against a real `~/.zshrc`, that test
  is wrong — rewrite to use the temp-fixture harness from STORY-002
