---
story: STORY-004
epic: EPIC-V020-SHELL-INTEGRATION
title: "`setup-shell` Command + CLI Wiring"
sprint: 1
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: STORY-002, STORY-003
---

# STORY-004: `setup-shell` Command + CLI Wiring

**As a** peer-orchestra user who has just run `npx peer-orchestra
init`,
**I want** a single follow-up command that installs both the shell
shortcut block and the editor settings patch,
**So that** my agent launchers and tab titles are live in one step
without me touching `~/.zshrc` or editor preferences manually.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `src/commands/setup-shell.js` | CREATE | Command logic — orchestrates shell-installer (STORY-002) + editor-settings-patcher (STORY-003), prints user-facing summary |
| `src/index.js` | EDIT | Add `setup-shell` to the arg parser, route to the new command, surface `--uninstall` and `--dry-run` flags |
| `src/commands/setup-shell.help.txt` | CREATE | Help text printed by `npx peer-orchestra setup-shell --help` |

## Command Surface

```
npx peer-orchestra setup-shell [options]

Options:
  --uninstall      Remove the peer-orchestra shell block and restore
                   editor settings to their pre-install state
  --dry-run        Show what would be changed without writing files
  --shell <name>   Force shell type (zsh|bash). Default: detect from
                   $SHELL
  --no-editor      Skip the VS Code-family settings patch
  --no-shell       Skip the shell-rc patch (only patch editor)
  --project <dir>  Project directory whose `.claude/rules/agent-*.md`
                   the shortcuts should derive from. Default: $PWD
  --help           Show this help and exit
```

## User-Facing Output

On `install` success:

```
peer-orchestra setup-shell

Shell:    zsh   ~/.zshrc                        ✓ inserted
Editor:   Cursor   ~/Library/Application Support/Cursor/User/settings.json
                                                ✓ updated
Editor:   VS Code  (not installed)              — skipped

Detected agents in /path/to/project/.claude/rules/:
  albedo, alhaitham, furina, ganyu, kaveh, lisa,
  nahida, neuvillette, xiao, yelan, zhongli, orchestrator

Reload your shell:
  source ~/.zshrc

Then launch any agent by typing its name:
  furina
  xiao
  orchestrator

To remove: npx peer-orchestra setup-shell --uninstall
```

On `dry-run`, prints the unified diffs from each patcher under each
tool heading. Writes nothing.

On `uninstall`, prints which blocks were removed / which settings were
restored.

## Acceptance Criteria

- [ ] `setup-shell` (no flags) installs both the shell block and the
  editor patch, prints the summary above
- [ ] `setup-shell --dry-run` writes no files; prints diffs from
  shell-installer and editor-settings-patcher
- [ ] `setup-shell --uninstall` removes the shell block AND restores
  editor settings; prints what was removed/restored
- [ ] `setup-shell --no-editor` runs shell installer only;
  `setup-shell --no-shell` runs editor patcher only
- [ ] `setup-shell --shell bash` overrides shell detection
- [ ] `setup-shell --project /custom/path` reads agents from
  `/custom/path/.claude/rules/`, propagates the path into the
  installed snippet via `PEER_ORCH_PROJECT_DIR`
- [ ] If `$SHELL` resolves to an unsupported shell (csh, ksh, fish in
  v0.2.0), command exits 1 and prints the snippet path so the user
  can manually source it
- [ ] If neither Cursor nor VS Code is installed, command prints
  per-terminal manual instructions for Apple Terminal, iTerm2, Warp,
  Tabby, and Hyper, then continues with the shell install (does NOT
  exit 1)
- [ ] `--help` prints the help text and exits 0
- [ ] Exit codes: 0 success, 1 unrecoverable error (malformed
  settings.json, write permission denied, etc.), 2 invalid args
- [ ] No interactive prompts — designed to be CI/automation-safe by
  default

## Test Plan

- Mock-fs harness: install into a temp HOME with a fixture `.zshrc`
  and a fixture Cursor settings file → both written, summary printed
  to a captured stdout
- Mock-fs: `--dry-run` → no file writes occur (mtime check)
- Mock-fs: install, then uninstall → both files restored to
  byte-equivalent of pre-install
- `--no-editor` flag → editor patcher not invoked (assertion via
  spy)
- `--no-shell` flag → shell installer not invoked
- Unsupported shell → command exits 1 with snippet path in stderr
- Neither editor installed → command continues, prints manual
  instructions, exits 0
- Snapshot test on the user-facing summary string

## Dependencies

- STORY-002 (shell-installer)
- STORY-003 (editor-settings-patcher)

## Notes

- All user-facing strings live inside `setup-shell.js` (or in
  `setup-shell.help.txt` for the help block). The utility modules
  remain print-free
- Use the same arg-parser style as `src/index.js` — no `commander`,
  no `yargs`. Keep the dependency footprint flat
- Snapshots for stdout output should normalize the home directory
  path so tests work on any machine
