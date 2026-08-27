---
story: STORY-001
epic: EPIC-V020-SHELL-INTEGRATION
title: "Shell Templates (zsh + bash snippets)"
sprint: 1
priority: P0
effort: S
status: planned
assigned: TBD
dependencies: none
---

# STORY-001: Shell Templates (zsh + bash snippets)

**As a** peer-orchestra user,
**I want** a portable shell snippet that defines the universal launcher
function and auto-derives per-agent shortcuts,
**So that** the same launch ergonomics work in zsh and bash without
duplicating logic across rc-file editors.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `src/templates/shell/peer-orchestra.zsh` | CREATE | zsh-flavored snippet (uses `${(C)var}` for capitalization, zsh-style function definitions) |
| `src/templates/shell/peer-orchestra.bash` | CREATE | bash-flavored snippet (uses `tr '[:lower:]' '[:upper:]'` for capitalization) |
| `src/templates/shell/README.md` | CREATE | Documents what the snippets do, how they are inserted by the installer, and the marker convention |

## Snippet Contents (both shells)

Each snippet defines:

1. **`peer_orch_launch()`** — universal launcher. Takes optional first
   arg = persona name. Sets `PEER_AGENT=<name>`, sends OSC title escape
   to the controlling tty, spawns a background watchdog (fast-burst
   phase + steady-state re-sends per Epic D4), then `exec`s
   `claude --dangerously-skip-permissions
   --dangerously-load-development-channels server:claude-peers`.
2. **`peer_orch_shortcuts()`** — auto-derives per-agent shortcuts by
   scanning `<project>/.claude/rules/agent-*.md` and `eval`-defining a
   function for each. Skips `agent-common.md`. Title-cases the persona
   name (`furina` → "Furina") for display.
3. **A short comment block** at the top describing what the block does
   and pointing to the upstream installer (`npx peer-orchestra
   setup-shell`).
4. **Calls `peer_orch_shortcuts`** once at the end so shortcuts are
   live in every new shell.

## Acceptance Criteria

- [ ] `src/templates/shell/peer-orchestra.zsh` exists and is valid zsh
  (passes `zsh -n` parse check)
- [ ] `src/templates/shell/peer-orchestra.bash` exists and is valid
  bash (passes `bash -n` parse check)
- [ ] Both snippets define `peer_orch_launch` and
  `peer_orch_shortcuts` functions
- [ ] Both snippets call `peer_orch_shortcuts` at the bottom
- [ ] Both snippets honor a `PEER_ORCH_PROJECT_DIR` env override; if
  unset, fall back to scanning `$PWD/.claude/rules/agent-*.md`
- [ ] Watchdog implementation uses two-phase cadence per Epic D4
- [ ] Watchdog is killed on normal `claude` exit and on SIGINT/SIGTERM
  via `trap`
- [ ] Comment block names the marker pair (`# >>> peer-orchestra >>>`
  / `# <<< peer-orchestra <<<`) so a user grepping the file can find
  the source

## Test Plan

- `zsh -n src/templates/shell/peer-orchestra.zsh` exits 0
- `bash -n src/templates/shell/peer-orchestra.bash` exits 0
- Sourcing `peer-orchestra.zsh` in a sub-shell defines both expected
  functions (`typeset -f peer_orch_launch` returns non-empty)
- Sourcing in a project with three sample `agent-*.md` files yields
  three new shell functions whose names match the agent files
- A snippet with `PEER_ORCH_PROJECT_DIR` pointing at a fixture dir
  reads agents from there, not from `$PWD`

## Dependencies

None. This story produces two static template files.

## Notes

- Both snippets must be self-contained — no `source` of helper files
  that may not exist on the user's machine
- Capitalization for the OSC title uses the simplest portable approach
  per shell (`${(C)var}` in zsh, `tr` pipe in bash) — no `python` /
  `awk` shellouts
- Keep total snippet size under ~80 lines per shell so users can
  inspect it before trusting it
