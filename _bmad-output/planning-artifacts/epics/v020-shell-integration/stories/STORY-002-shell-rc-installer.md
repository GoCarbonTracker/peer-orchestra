---
story: STORY-002
epic: EPIC-V020-SHELL-INTEGRATION
title: "Shell-RC Installer Utility (idempotent + reversible)"
sprint: 1
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: STORY-001
---

# STORY-002: Shell-RC Installer Utility (idempotent + reversible)

**As a** peer-orchestra user on a fresh machine,
**I want** the shell snippet from STORY-001 inserted into my rc file
between sentinel markers,
**So that** my shell auto-loads the launcher on every new terminal
without manual editing, and removal is one command.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `src/utils/shell-installer.js` | CREATE | Pure JS module — reads template, writes guarded block to target rc file, supports install/dry-run/uninstall modes |
| `src/utils/shell-detector.js` | CREATE | Detects user's shell from `$SHELL` and returns `{shell: 'zsh'\|'bash'\|'fish'\|'unsupported', rcPath: '/abs/path'}` |

## API Contract

```js
// shell-installer.js exports:
installShellBlock({
  shell,        // 'zsh' | 'bash'
  rcPath,       // absolute path to ~/.zshrc, ~/.bashrc, etc.
  templatePath, // absolute path to peer-orchestra.zsh or .bash
  mode,         // 'install' | 'dry-run' | 'uninstall'
})
  -> { written: boolean, action: 'inserted'|'replaced'|'removed'|'no-op',
       diff: string /* unified diff text for dry-run */ }
```

## Marker Convention

```
# >>> peer-orchestra >>>
# Managed by peer-orchestra. Do not edit between these markers —
# changes will be overwritten by `npx peer-orchestra setup-shell`.
# Run `npx peer-orchestra setup-shell --uninstall` to remove cleanly.

<contents of src/templates/shell/peer-orchestra.<shell>>

# <<< peer-orchestra <<<
```

## Acceptance Criteria

- [ ] `installShellBlock({mode: 'install'})` inserts the block at the
  end of the rc file when no markers exist
- [ ] Re-running `installShellBlock({mode: 'install'})` replaces the
  existing block atomically (markers + content), never produces
  duplicates
- [ ] `installShellBlock({mode: 'uninstall'})` removes the entire
  block (markers + content + the explanatory comment) and leaves
  surrounding lines untouched
- [ ] `installShellBlock({mode: 'dry-run'})` returns a unified diff
  string and writes nothing
- [ ] If the target rc file does not exist, install creates it with
  just the block
- [ ] If the target rc file exists but is missing a trailing newline,
  install adds one before the block (no joining lines)
- [ ] `shell-detector.js` returns `unsupported` for csh, ksh, fish (in
  v0.2.0), and for an empty `$SHELL`
- [ ] `shell-detector.js` resolves the rc path correctly: zsh →
  `~/.zshrc`, bash → `~/.bashrc` on Linux and `~/.bash_profile` on
  macOS (preferring `.bashrc` if it exists)
- [ ] Both modules export only pure functions — no top-level
  side effects, no `process.exit`, no console writes from the utility
  itself (the command layer in STORY-004 handles user-facing output)

## Test Plan

Tests use temp-fixture rc files in `os.tmpdir()` — never touch the
real user rc.

- Install into an empty fixture file → contains markers + block
- Install twice into same fixture → still contains exactly one block
- Install, then uninstall → file restored to byte-equivalent of
  original (preserve user content above and below)
- Install into fixture with existing markers from a prior version →
  replaces cleanly
- Install into fixture with malformed markers (only opening, no
  closing) → reports an error and writes nothing
- Dry-run mode: file mtime unchanged after call
- `shell-detector` test matrix: zsh, bash on macOS, bash on Linux,
  fish, unsupported

## Dependencies

- STORY-001 (templates must exist before the installer can read them)

## Notes

- Use Node's built-in `fs` only — no `simple-git`, no `mock-fs`. The
  test harness can stand up real temp dirs.
- File writes use `fs.writeFileSync(path, content, {encoding: 'utf8',
  mode: 0o644})` to preserve sensible defaults
- The dry-run diff format is "unified" (3 lines of context, `---` /
  `+++` headers) so a user can paste it into a code review tool if
  curious
