---
story: STORY-003
epic: EPIC-V020-SHELL-INTEGRATION
title: "VS Code-family Editor Settings Patcher"
sprint: 1
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: none
---

# STORY-003: VS Code-family Editor Settings Patcher

**As a** peer-orchestra user running terminals inside Cursor or VS
Code,
**I want** the editor's `settings.json` patched so terminal tabs honor
the OSC title escapes my shell sends,
**So that** every peer terminal shows its persona name in the tab
sidebar instead of generic numbering like `1.zsh` or `2.1.123`.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `src/utils/editor-settings-patcher.js` | CREATE | Pure JS module — locates Cursor / VS Code user settings.json files, merges the two required keys without disturbing existing user keys |
| `src/utils/editor-detector.js` | CREATE | Detects which VS Code-family editors are installed by checking for the `User/settings.json` path. Returns an array of `{editor, settingsPath}` objects |

## Settings Keys to Write

Per Epic D6:

```json
{
  "terminal.integrated.tabs.title": "${sequence}",
  "terminal.integrated.tabs.description": "${task}${separator}${cwdFolder}"
}
```

## API Contract

```js
// editor-settings-patcher.js exports:
patchEditorSettings({
  settingsPath, // absolute path to User/settings.json
  mode,         // 'install' | 'dry-run' | 'uninstall'
})
  -> { written: boolean,
       action: 'inserted'|'updated'|'restored'|'no-op',
       priorValues: {tabsTitle?, tabsDescription?} | null,
       diff: string /* JSON-aware diff for dry-run */ }
```

## Detected Paths

| Platform | Editor | Settings path |
|----------|--------|---------------|
| macOS    | Cursor | `~/Library/Application Support/Cursor/User/settings.json` |
| macOS    | VS Code | `~/Library/Application Support/Code/User/settings.json` |
| Linux    | Cursor | `~/.config/Cursor/User/settings.json` |
| Linux    | VS Code | `~/.config/Code/User/settings.json` |
| Windows  | (out of scope for v0.2.0) | — |

## Acceptance Criteria

- [ ] Patcher merges the two required keys into existing
  `settings.json` without touching any other keys
- [ ] If the file uses JSON-with-comments (jsonc) format, comments and
  trailing commas are preserved (use a jsonc-aware parser, not
  `JSON.parse`)
- [ ] If the file does not exist, patcher creates it with just the
  two keys (and a top-level `{}` wrapper) and `mode: 0o644`
- [ ] If the file is malformed JSON beyond jsonc tolerance, patcher
  reports an error and writes nothing — user must hand-fix first
- [ ] On `mode: 'install'`, if the keys already exist with the
  expected values, the call is a `no-op` and writes nothing
- [ ] On `mode: 'install'`, if the keys exist with different values,
  the patcher records the prior values in `priorValues` and writes
  the new values
- [ ] On `mode: 'uninstall'`, the patcher restores the prior values if
  they were captured during a previous install. If no prior state was
  captured, it removes the two keys outright. State is persisted in a
  sibling file `peer-orchestra.state.json` next to `settings.json`
- [ ] `mode: 'dry-run'` returns a JSON-aware diff and writes nothing
- [ ] `editor-detector.js` returns an empty array if neither Cursor
  nor VS Code is installed; the command layer in STORY-004 should
  treat this as "fall back to manual instructions"

## Test Plan

Tests use temp-fixture settings files — never touch real editor
preferences.

- Empty settings.json → patcher writes `{"terminal.integrated...": ...}`
- Pre-populated settings.json with unrelated keys (e.g.
  `editor.fontSize`) → those keys preserved verbatim, tabs keys
  appended
- jsonc settings.json with `// comment` lines → comments preserved
  after patch
- Settings.json with the two keys already at the expected values →
  patcher reports `no-op`
- Settings.json with the two keys at different values → patcher
  captures prior values into state file, writes new values
- Install, then uninstall → settings.json restored byte-equivalent to
  pre-install
- Malformed JSON (unbalanced braces) → patcher errors, file
  unchanged
- `editor-detector` returns the right array for each platform
  (mocked filesystem)

## Dependencies

None. Independent of STORY-001 / STORY-002.

## Notes

- Use `comment-json` or a similar jsonc-aware parser. Prefer
  zero-dependency if possible; if not, vet for license + maintenance
  before adding to `package.json`
- The state file (`peer-orchestra.state.json`) is the only side
  effect outside `settings.json` itself. Document its existence in
  STORY-005's README update so users know it's safe to gitignore
- Do NOT attempt to live-reload the editor. Instruct the user via
  command output (STORY-004) that new terminal tabs will pick up the
  change; existing tabs need a fresh tab to test
