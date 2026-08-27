const fs = require('fs');
const path = require('path');

function getInstalledHookCommands(pythonBin) {
  return {
    UserPromptSubmit: [`${pythonBin} .claude/hooks/agent-router.py`],
    SessionStart: [
      `${pythonBin} .claude/hooks/agent-persona-loader.py`,
      `${pythonBin} .claude/hooks/session-start-peer-memory.py`,
    ],
    SessionEnd: [`${pythonBin} .claude/hooks/session-learning-extractor.py`],
  };
}

function readSettingsJson(settingsPath) {
  let raw;
  try {
    raw = fs.readFileSync(settingsPath, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read ${settingsPath}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Could not parse ${settingsPath} as JSON — ${err.message}. ` +
      'Fix or remove the invalid JSON in this file, then re-run.'
    );
  }
}

function generateSettingsJson(targetDir, { dryRun = false, pythonBin = 'python3' } = {}) {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  const hookCommands = getInstalledHookCommands(pythonBin);
  const settings = {
    hooks: {
      UserPromptSubmit: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: hookCommands.UserPromptSubmit[0],
              timeout: 10,
            },
          ],
        },
      ],
      SessionStart: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: hookCommands.SessionStart[0],
              timeout: 10,
            },
            {
              type: 'command',
              command: hookCommands.SessionStart[1],
              timeout: 10,
            },
          ],
        },
      ],
      SessionEnd: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: hookCommands.SessionEnd[0],
              timeout: 10,
            },
          ],
        },
      ],
    },
    plugins: {
      homunculus: true,
    },
  };

  if (dryRun) {
    if (fs.existsSync(settingsPath)) {
      console.log('  WOULD MERGE: hooks and plugins into existing .claude/settings.json');
    } else {
      console.log('  WOULD CREATE: .claude/settings.json with hooks + homunculus plugin');
    }
    return;
  }

  if (fs.existsSync(settingsPath)) {
    console.log('  .claude/settings.json exists — merging hooks and plugins...');
    const existing = readSettingsJson(settingsPath);

    // Merge hooks: for each event type, append our hook entries if not already present
    if (!existing.hooks) existing.hooks = {};
    for (const [event, newEntries] of Object.entries(settings.hooks)) {
      if (!Array.isArray(existing.hooks[event])) {
        // No existing hooks for this event, or a hand-written non-array value — add ours
        existing.hooks[event] = newEntries;
      } else {
        // Event exists — check each hook command for duplicates before appending
        for (const newEntry of newEntries) {
          for (const newHook of newEntry.hooks) {
            const alreadyExists = existing.hooks[event].some((existingEntry) =>
              Array.isArray(existingEntry.hooks) &&
              existingEntry.hooks.some((h) => h.command === newHook.command)
            );
            if (!alreadyExists) {
              // Append to the first matcher group, or create a new one
              const targetEntry = existing.hooks[event].find(
                (e) => e.matcher === '' && Array.isArray(e.hooks)
              );
              if (targetEntry) {
                targetEntry.hooks.push(newHook);
              } else {
                existing.hooks[event].push(newEntry);
              }
            }
          }
        }
      }
    }

    // Merge plugins: preserve existing, add ours
    existing.plugins = { ...existing.plugins, ...settings.plugins };
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
  } else {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
  console.log('  Configured .claude/settings.json with hooks + homunculus plugin');
}

// Probe for a working Python 3.8+ interpreter. Tries python3 first (correct on macOS/Linux
// and modern Windows), then python and py as Windows fallbacks. Returns the first working
// command name, or null if none found.
module.exports = { getInstalledHookCommands, readSettingsJson, generateSettingsJson };
