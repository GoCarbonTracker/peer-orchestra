---
story: STORY-002
epic: EPIC-V010-PUBLIC-RELEASE
title: "CLI Hardening"
sprint: 1
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: [STORY-001]
traces_to: [FR1, FR2, FR3, FR4, FR5, NFR1, NFR7, NFR8]
---

# STORY-002: CLI Hardening

**As a** developer running `npx peer-orchestra init`,
**I want** the CLI to support non-interactive mode, dry-run, force overwrite, and version flags,
**So that** I can use it in CI pipelines, preview changes before applying, and check the installed version.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/index.js` | MODIFY | Add `--no-interactive`, `--dry-run`, `--force`, `--version` flags; read version from package.json |
| `package.json` | MODIFY | Ensure `version` field is correct (0.1.0) |

## Acceptance Criteria

- [ ] `npx peer-orchestra --version` prints version from package.json (e.g., "peer-orchestra v0.1.0")
- [ ] `npx peer-orchestra init --theme genshin --name Paimon --no-interactive` completes without prompts
- [ ] `npx peer-orchestra init --theme genshin --name Paimon --no-interactive` fails with exit code 2 if `--theme` or `--name` missing
- [ ] `npx peer-orchestra init --dry-run` prints what would be installed without writing any files
- [ ] `npx peer-orchestra init --force` overwrites existing `.claude/rules/` files
- [ ] Default mode (no `--force`) skips existing agent files with a warning message
- [ ] Exit code 3 when theme not found (e.g., `--theme naruto`)
- [ ] Exit code 4 when target directory not writable
- [ ] Version string is NOT hardcoded — read dynamically from package.json
- [ ] Works on macOS and Linux (WSL)

## Test Plan

- Run `node src/index.js --version` — verify output matches package.json version
- Run `echo "Paimon" | node src/index.js init --theme genshin --dir /tmp/test-proj` — interactive mode still works
- Run `node src/index.js init --theme genshin --name Paimon --no-interactive --dir /tmp/test-proj` — non-interactive completes
- Run `node src/index.js init --no-interactive --dir /tmp/test-proj` — exits with code 2 (missing required flags)
- Run `node src/index.js init --theme naruto --name Test --no-interactive --dir /tmp/test-proj` — exits with code 3
- Run `node src/index.js init --dry-run --theme genshin --name Paimon --dir /tmp/test-proj` — no files created, output shows plan
- Run init twice without `--force` — second run skips existing files with warning
- Run init twice with `--force` — second run overwrites files

## Notes

The existing `src/index.js` uses `readline` for interactive prompts. Add argument parsing at the top of `main()` to detect flags before entering interactive mode. Keep it simple — no CLI framework dependency, just `process.argv` parsing.
