const fs = require('fs');
const path = require('path');

function getStateFilePath(targetDir) {
  return path.join(targetDir, '.claude', '.peer-orchestra.json');
}

function readState(targetDir) {
  const statePath = getStateFilePath(targetDir);
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeState(targetDir, state, { dryRun = false } = {}) {
  if (dryRun) return;
  const statePath = getStateFilePath(targetDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

// Removes a previous theme's persona files (agents/ + archons/) from .claude/rules/,
// by name, so switching --theme doesn't leave both sets installed side by side.
function removeThemeFiles(rulesDir, themeDirPath, { dryRun = false } = {}) {
  let removed = 0;
  for (const sub of ['agents', 'archons']) {
    const dir = path.join(themeDirPath, sub);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const target = path.join(rulesDir, entry.name);
      if (fs.existsSync(target)) {
        if (dryRun) {
          console.log(`  WOULD REMOVE (stale theme): .claude/rules/${entry.name}`);
        } else {
          fs.unlinkSync(target);
        }
        removed++;
      }
    }
  }
  return removed;
}

// Runs before any filesystem write. Hard-fails on Node version and unparseable existing
// settings.json (both would corrupt or crash a partial install); only warns on missing
// Python since hooks can be made to work later and shouldn't block scaffolding.
module.exports = { getStateFilePath, readState, writeState, removeThemeFiles };
