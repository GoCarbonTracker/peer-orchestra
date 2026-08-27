#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
  return pkg.version;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { command: null, flags: {} };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' || args[i] === '-v') {
      parsed.flags.version = true;
    } else if (args[i] === '--no-interactive') {
      parsed.flags.noInteractive = true;
    } else if (args[i] === '--dry-run') {
      parsed.flags.dryRun = true;
    } else if (args[i] === '--force') {
      parsed.flags.force = true;
    } else if (args[i] === '--theme' && i + 1 < args.length) {
      parsed.flags.theme = args[++i];
    } else if (args[i] === '--name' && i + 1 < args.length) {
      parsed.flags.name = args[++i];
    } else if (args[i] === '--dir' && i + 1 < args.length) {
      parsed.flags.dir = args[++i];
    } else if (args[i] === '--bmad') {
      parsed.flags.bmad = true;
    } else if (!args[i].startsWith('-') && !parsed.command) {
      parsed.command = args[i];
    }
  }

  return parsed;
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
    rl.once('close', () => resolve(''));
  });
}

function copyDir(src, dest, { force = false, dryRun = false, baseDir = null } = {}) {
  if (!dryRun && !fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const root = baseDir || dest;
  let copied = 0;
  let skipped = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '__pycache__' || entry.name.startsWith('.')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      const sub = copyDir(srcPath, destPath, { force, dryRun, baseDir: root });
      copied += sub.copied;
      skipped += sub.skipped;
    } else {
      const relPath = path.relative(root, destPath);
      if (!force && fs.existsSync(destPath)) {
        console.log(`  SKIP (exists): ${relPath}`);
        skipped++;
      } else {
        if (dryRun) {
          console.log(`  WOULD COPY: ${relPath}`);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
        copied++;
      }
    }
  }
  return { copied, skipped };
}

function mergeClaudeMd(targetDir, orchestratorName, { dryRun = false, bmad = false } = {}) {
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const templatePath = path.join(TEMPLATES_DIR, 'CLAUDE.md.template');
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace(/\{\{ORCHESTRATOR_NAME\}\}/g, orchestratorName);

  // Strip BMAD section if not enabled
  if (!bmad) {
    template = template.replace(/<!-- BMAD_SECTION_START -->[\s\S]*?<!-- BMAD_SECTION_END -->\n?/, '');
  } else {
    template = template.replace(/<!-- BMAD_SECTION_START -->\n?/, '');
    template = template.replace(/<!-- BMAD_SECTION_END -->\n?/, '');
  }

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    const marker = '# Peer Orchestra';
    if (existing.includes(marker)) {
      console.log('  CLAUDE.md already has Peer Orchestra section — skipping.');
      return;
    }
    if (dryRun) {
      console.log('  WOULD MERGE: orchestrator instructions into existing CLAUDE.md');
    } else {
      fs.writeFileSync(claudeMdPath, existing + '\n\n' + template);
      console.log('  Merged orchestrator instructions into existing CLAUDE.md');
    }
  } else {
    if (dryRun) {
      console.log('  WOULD CREATE: CLAUDE.md with orchestrator instructions');
    } else {
      fs.writeFileSync(claudeMdPath, template);
      console.log('  Created CLAUDE.md with orchestrator instructions');
    }
  }
}

// Hook command strings this tool installs, keyed by event. Used both to generate
// settings.json and (by uninstall) to identify and strip exactly these entries.
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
function findPython() {
  const candidates = process.platform === 'win32' ? ['python3', 'python', 'py'] : ['python3', 'python'];
  for (const cmd of candidates) {
    const result = spawnSync(cmd, ['--version'], { encoding: 'utf-8' });
    if (result.error || result.status !== 0) continue;
    const versionOut = `${result.stdout || ''}${result.stderr || ''}`;
    const match = versionOut.match(/Python (\d+)\.(\d+)/);
    if (!match) continue;
    const [, major, minor] = match.map(Number);
    if (major > 3 || (major === 3 && minor >= 8)) {
      return cmd;
    }
  }
  return null;
}

// State file recording which theme + version is installed, so a later `init` with a
// different --theme can clean up the previous theme's persona files instead of leaving
// both sets to coexist in .claude/rules/.
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
function preflight(targetDir) {
  console.log('  Preflight checks:');

  const [nodeMajor] = process.versions.node.split('.').map(Number);
  if (nodeMajor < 18) {
    console.error(`  FAIL: Node ${process.versions.node} detected — peer-orchestra requires Node >= 18.`);
    process.exit(5);
  }
  console.log(`  OK: Node ${process.versions.node}`);

  const pythonBin = findPython();
  if (pythonBin) {
    console.log(`  OK: Python interpreter found (${pythonBin})`);
  } else {
    console.log('  WARN: No working python3/python interpreter found.');
    console.log('        The 4 scaffolded hooks are Python scripts and will fail on every');
    console.log('        session until Python 3.8+ is installed and on PATH.');
  }

  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      readSettingsJson(settingsPath);
      console.log('  OK: existing .claude/settings.json parses as JSON');
    } catch (err) {
      console.error(`  FAIL: ${err.message}`);
      process.exit(6);
    }
  }

  console.log('');
  return { pythonBin: pythonBin || 'python3' };
}

// Strips the `# Peer Orchestra` section mergeClaudeMd() injected. The template is a
// single H1 section with no closing marker, so the block runs from the `# Peer Orchestra`
// heading to the next top-level heading (if the user has content after it) or EOF.
function stripPeerOrchestraSection(content) {
  const marker = '# Peer Orchestra';
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) return { content, removed: false };

  const rest = content.slice(startIdx + marker.length);
  const nextHeadingMatch = rest.match(/\n# /);
  const endIdx = nextHeadingMatch
    ? startIdx + marker.length + nextHeadingMatch.index + 1
    : content.length;

  // Trim trailing blank lines left before the marker (from the '\n\n' the merge added).
  let before = content.slice(0, startIdx).replace(/\n+$/, '');
  const after = content.slice(endIdx);
  let result = after ? `${before}${before ? '\n\n' : ''}${after}` : before;
  if (result && !result.endsWith('\n')) result += '\n';
  return { content: result, removed: true };
}

async function uninstall(flags) {
  const dryRun = !!flags.dryRun;
  const noInteractive = !!flags.noInteractive || !!flags.force;
  const interactive = !noInteractive && !!process.stdin.isTTY;
  const targetDir = flags.dir ? path.resolve(flags.dir) : process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Target directory does not exist: ${targetDir}`);
    process.exit(4);
  }

  console.log(`\n  Peer Orchestra uninstall`);
  console.log(`  Target: ${targetDir}`);
  if (dryRun) console.log('  Mode: DRY RUN (no files will be removed)');
  console.log('');

  // Build the list of planned removals before touching anything, so --dry-run and the
  // confirmation prompt show the real plan.
  const plan = { files: [], dirs: [], settingsChanges: false, claudeMdChange: false, gitignoreChange: false };

  const state = readState(targetDir);
  const rulesDir = path.join(targetDir, '.claude', 'rules');

  // Persona files: prefer the recorded theme (exact set actually installed); fall back
  // to scanning all known themes if no state file exists (older install / state lost).
  const themesToClean = state && state.theme ? [state.theme] : fs.existsSync(THEMES_DIR)
    ? fs.readdirSync(THEMES_DIR).filter((d) => fs.statSync(path.join(THEMES_DIR, d)).isDirectory())
    : [];
  for (const themeName of themesToClean) {
    const themeDirPath = path.join(THEMES_DIR, themeName);
    for (const sub of ['agents', 'archons']) {
      const dir = path.join(themeDirPath, sub);
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const target = path.join(rulesDir, entry.name);
        if (fs.existsSync(target)) plan.files.push(target);
      }
    }
  }

  // Common rules files (known filenames peer-orchestra ships).
  const commonRules = path.join(TEMPLATES_DIR, 'rules');
  if (fs.existsSync(commonRules)) {
    for (const entry of fs.readdirSync(commonRules, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const target = path.join(rulesDir, entry.name);
      if (fs.existsSync(target)) plan.files.push(target);
    }
  }

  // Hooks (known filenames).
  const templateHooks = path.join(TEMPLATES_DIR, 'hooks');
  const hooksDir = path.join(targetDir, '.claude', 'hooks');
  if (fs.existsSync(templateHooks) && fs.existsSync(hooksDir)) {
    for (const entry of fs.readdirSync(templateHooks, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const target = path.join(hooksDir, entry.name);
      if (fs.existsSync(target)) plan.files.push(target);
    }
  }

  // Slash commands (known filenames).
  const commandsSrc = path.join(__dirname, '..', 'commands');
  const commandsDir = path.join(targetDir, '.claude', 'commands');
  if (fs.existsSync(commandsSrc) && fs.existsSync(commandsDir)) {
    for (const entry of fs.readdirSync(commandsSrc, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const target = path.join(commandsDir, entry.name);
      if (fs.existsSync(target)) plan.files.push(target);
    }
  }

  // agent-memory/ is fully owned by peer-orchestra (created empty by init).
  const agentMemoryDir = path.join(targetDir, '.claude', 'agent-memory');
  if (fs.existsSync(agentMemoryDir)) plan.dirs.push(agentMemoryDir);

  // State file itself.
  const statePath = getStateFilePath(targetDir);
  if (fs.existsSync(statePath)) plan.files.push(statePath);

  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  let settingsExisting = null;
  if (fs.existsSync(settingsPath)) {
    try {
      settingsExisting = readSettingsJson(settingsPath);
      plan.settingsChanges = true;
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(6);
    }
  }

  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath) && fs.readFileSync(claudeMdPath, 'utf-8').includes('# Peer Orchestra')) {
    plan.claudeMdChange = true;
  }

  const gitignorePath = path.join(targetDir, '.gitignore');
  if (fs.existsSync(gitignorePath) && fs.readFileSync(gitignorePath, 'utf-8').includes('.claude/agent-memory')) {
    plan.gitignoreChange = true;
  }

  const totalChanges =
    plan.files.length + plan.dirs.length + (plan.settingsChanges ? 1 : 0) +
    (plan.claudeMdChange ? 1 : 0) + (plan.gitignoreChange ? 1 : 0);

  if (totalChanges === 0) {
    console.log('  Nothing to uninstall — no peer-orchestra files found.\n');
    return;
  }

  console.log('  This will remove:');
  for (const f of plan.files) console.log(`    - ${path.relative(targetDir, f)}`);
  for (const d of plan.dirs) console.log(`    - ${path.relative(targetDir, d)}/ (and its contents)`);
  if (plan.settingsChanges) console.log('    - peer-orchestra hook entries + homunculus plugin flag from .claude/settings.json');
  if (plan.claudeMdChange) console.log('    - the "# Peer Orchestra" section from CLAUDE.md');
  if (plan.gitignoreChange) console.log('    - the .claude/agent-memory/ line from .gitignore');
  console.log('');
  console.log('  _bmad/ and _bmad-output/ are left untouched (they may contain your planning work).');
  console.log('  Use --force to also skip this confirmation, or remove them manually if desired.\n');

  if (dryRun) {
    console.log('  Dry run complete — nothing was removed.\n');
    return;
  }

  if (interactive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await ask(rl, '  Proceed with uninstall? (y/n) ');
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('  Aborted — nothing was removed.\n');
      return;
    }
  } else if (!noInteractive) {
    // Non-TTY stdin without --force/--no-interactive: refuse to guess, same posture as
    // init's non-TTY handling — don't destroy files with no way to confirm.
    console.error('  Refusing to uninstall without confirmation in a non-interactive shell.');
    console.error('  Re-run with --force (or --no-interactive) to skip the confirmation prompt.');
    process.exit(2);
  }

  for (const f of plan.files) fs.unlinkSync(f);
  for (const d of plan.dirs) fs.rmSync(d, { recursive: true, force: true });

  if (plan.settingsChanges && settingsExisting) {
    const hookCommands = getInstalledHookCommands('python3');
    // Match by command string regardless of which interpreter preflight picked at
    // install time (python3/python/py) — strip any hook whose command ends with the
    // known script path, not just an exact python3 match.
    const scriptPaths = Object.values(hookCommands).flat().map((cmd) => cmd.split(' ').slice(1).join(' '));
    for (const event of Object.keys(settingsExisting.hooks || {})) {
      if (!Array.isArray(settingsExisting.hooks[event])) continue;
      for (const entry of settingsExisting.hooks[event]) {
        if (!Array.isArray(entry.hooks)) continue;
        entry.hooks = entry.hooks.filter((h) => !scriptPaths.some((p) => h.command && h.command.endsWith(p)));
      }
      settingsExisting.hooks[event] = settingsExisting.hooks[event].filter(
        (entry) => Array.isArray(entry.hooks) && entry.hooks.length > 0
      );
      if (settingsExisting.hooks[event].length === 0) delete settingsExisting.hooks[event];
    }
    if (settingsExisting.plugins) delete settingsExisting.plugins.homunculus;
    // Drop the containers themselves if we emptied them — leaving `"hooks": {}`
    // behind in a file that never had one is residue, not a clean uninstall.
    if (settingsExisting.hooks && Object.keys(settingsExisting.hooks).length === 0) {
      delete settingsExisting.hooks;
    }
    if (settingsExisting.plugins && Object.keys(settingsExisting.plugins).length === 0) {
      delete settingsExisting.plugins;
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settingsExisting, null, 2) + '\n');
  }

  if (plan.claudeMdChange) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    const { content } = stripPeerOrchestraSection(existing);
    if (content.trim()) {
      fs.writeFileSync(claudeMdPath, content);
    } else {
      fs.unlinkSync(claudeMdPath);
    }
  }

  if (plan.gitignoreChange) {
    const existing = fs.readFileSync(gitignorePath, 'utf-8');
    const cleaned = existing
      .replace(/\n?# Agent memory DBs \(per-project, not tracked\)\n\.claude\/agent-memory\/\n?/, '\n')
      // Collapse the blank line the removal leaves behind, so the file comes
      // back exactly as the user had it.
      .replace(/\n{2,}$/, '\n');
    if (cleaned.trim()) {
      fs.writeFileSync(gitignorePath, cleaned);
    } else {
      fs.unlinkSync(gitignorePath);
    }
  }

  console.log('\n  Uninstalled. _bmad/ and _bmad-output/ (if present) were left in place.\n');
}

async function main() {
  const { command, flags } = parseArgs(process.argv);

  // --version: print and exit
  if (flags.version) {
    console.log(`peer-orchestra v${getVersion()}`);
    process.exit(0);
  }

  // uninstall: reverse everything init does
  if (command === 'uninstall') {
    await uninstall(flags);
    return;
  }

  // No command or unknown command
  if (command !== 'init') {
    console.log(`peer-orchestra v${getVersion()}`);
    console.log('');
    console.log('Usage: peer-orchestra init [options]');
    console.log('       peer-orchestra uninstall [options]');
    console.log('');
    console.log('Options (init):');
    console.log('  --theme <name>      Theme to install (genshin, generic)');
    console.log('  --name <name>       Orchestrator persona name');
    console.log('  --dir <path>        Target project directory (default: .)');
    console.log('  --bmad              Enable BMAD workflow integration');
    console.log('  --no-interactive    Skip prompts (requires --theme and --name)');
    console.log('  --dry-run           Show what would be installed without writing files');
    console.log('  --force             Overwrite existing files (default: skip with warning)');
    console.log('  --version, -v       Print version');
    console.log('');
    console.log('Options (uninstall):');
    console.log('  --dir <path>        Target project directory (default: .)');
    console.log('  --dry-run           Show what would be removed without deleting anything');
    console.log('  --force             Skip the confirmation prompt');
    console.log('  --no-interactive    Skip the confirmation prompt');
    process.exit(command ? 1 : 0);
  }

  const dryRun = !!flags.dryRun;
  const force = !!flags.force;
  const noInteractive = !!flags.noInteractive;
  // Only prompt when the user actually asked for interactive mode AND stdin is a real
  // TTY. Piped/redirected stdin (CI, automation, `printf ... | node index.js`) has no
  // human to answer prompts — readline's question callback never fires after EOF, so
  // treat it the same as --no-interactive rather than hanging.
  const interactive = !noInteractive && !!process.stdin.isTTY;

  // Validate non-interactive mode requires --theme and --name
  if (noInteractive && (!flags.theme || !flags.name)) {
    console.error('Error: --no-interactive requires both --theme and --name flags.');
    console.error('');
    console.error('Example: npx peer-orchestra init --theme genshin --name Paimon --no-interactive');
    process.exit(2);
  }

  // Resolve target directory and check writability
  const targetDir = flags.dir ? path.resolve(flags.dir) : process.cwd();
  const dirToCheck = fs.existsSync(targetDir) ? targetDir : path.dirname(targetDir);
  try {
    fs.accessSync(dirToCheck, fs.constants.W_OK);
    // Create the target directory if it doesn't exist
    if (!fs.existsSync(targetDir) && !dryRun) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } catch {
    console.error(`Error: Target directory is not writable: ${targetDir}`);
    process.exit(4);
  }

  // Preflight checks — must run before any scaffolding write. Fails fast on Node version
  // and unparseable existing settings.json; warns (does not block) on missing Python.
  const { pythonBin } = preflight(targetDir);

  // Available themes (used for the theme prompt and error messages)
  const availableThemes = fs.readdirSync(THEMES_DIR).filter(
    (d) => fs.statSync(path.join(THEMES_DIR, d)).isDirectory()
  );

  // Resolve orchestrator name / set up readline
  let name;
  let rl;

  if (!interactive) {
    name = flags.name;
  } else {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  const version = getVersion();
  console.log(`\n  Peer Orchestra v${version}`);
  console.log(`  Target: ${targetDir}`);
  if (dryRun) console.log('  Mode: DRY RUN (no files will be written)');
  if (force) console.log('  Mode: FORCE (existing files will be overwritten)');
  console.log('');

  // Resolve theme — respect --theme when passed, otherwise prompt (interactive only),
  // otherwise default to genshin.
  let theme = flags.theme;
  if (!theme && interactive) {
    const answer = await ask(
      rl,
      `  Which theme? (${availableThemes.join(', ')}) (default: genshin) `
    );
    theme = answer.trim() || 'genshin';
  }
  theme = theme || 'genshin';

  const themePath = path.join(THEMES_DIR, theme);
  if (!fs.existsSync(themePath)) {
    console.error(`Error: Theme "${theme}" not found. Available: ${availableThemes.join(', ')}`);
    process.exit(3);
  }
  console.log(`  Theme: ${theme}`);
  console.log('');

  if (interactive) {
    const answer = await ask(rl, '  What is your orchestrator name? (default: your username) ');
    name = answer.trim() || process.env.USER || 'orchestrator';
  } else {
    name = name || process.env.USER || 'orchestrator';
  }

  console.log(`\n  Setting up ${name}'s orchestra...\n`);

  // 1. Copy agent rules
  const rulesDir = path.join(targetDir, '.claude', 'rules');
  if (!dryRun) fs.mkdirSync(rulesDir, { recursive: true });

  // Existing files are preserved unless --force is passed
  let totalSkipped = 0;

  // If a different theme was previously installed, remove its persona files first so
  // switching themes doesn't leave both sets coexisting in .claude/rules/.
  const priorState = readState(targetDir);
  if (priorState && priorState.theme && priorState.theme !== theme) {
    const priorThemePath = path.join(THEMES_DIR, priorState.theme);
    if (fs.existsSync(priorThemePath)) {
      const removed = removeThemeFiles(rulesDir, priorThemePath, { dryRun });
      if (removed > 0) {
        console.log(`  Removed ${removed} stale "${priorState.theme}" persona file(s) from .claude/rules/`);
      }
    }
  }

  const themeAgents = path.join(themePath, 'agents');
  if (fs.existsSync(themeAgents)) {
    // Note: agent-orchestrator.md ships in every theme's agents/ dir with the same
    // filename. removeThemeFiles() above already deletes the *prior* theme's copy on a
    // theme switch, so this copyDir call writes the new theme's orchestrator file fresh
    // (not skipped) even without --force — it always tracks the currently installed theme.
    const result = copyDir(themeAgents, rulesDir, { force, dryRun });
    totalSkipped += result.skipped;
    console.log(`  Installed ${theme} agent personas into .claude/rules/ (${result.copied} files)`);
  }

  // Archon personas ship with the genshin theme only
  const themeArchons = path.join(themePath, 'archons');
  if (fs.existsSync(themeArchons)) {
    const result = copyDir(themeArchons, rulesDir, { force, dryRun });
    totalSkipped += result.skipped;
    console.log(`  Installed ${theme} archon personas into .claude/rules/ (${result.copied} files)`);
  }

  const commonRules = path.join(TEMPLATES_DIR, 'rules');
  if (fs.existsSync(commonRules)) {
    const result = copyDir(commonRules, rulesDir, { force, dryRun });
    totalSkipped += result.skipped;
    console.log(`  Installed dispatch protocols and common rules (${result.copied} files)`);
  }

  // Record installed theme + version for future theme-switch cleanup.
  writeState(targetDir, { theme, version }, { dryRun });

  // 2. Create agent-memory directory
  const agentMemoryDir = path.join(targetDir, '.claude', 'agent-memory');
  if (dryRun) {
    console.log('  WOULD CREATE: .claude/agent-memory/ for per-agent learning DBs');
  } else {
    fs.mkdirSync(agentMemoryDir, { recursive: true });
    console.log('  Created .claude/agent-memory/ for per-agent learning DBs');
  }

  // Add to .gitignore if not already there — create it when it doesn't exist yet, so
  // .claude/agent-memory/*.db (extracted session content) is never left unignored.
  const gitignorePath = path.join(targetDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.claude/agent-memory')) {
      if (dryRun) {
        console.log('  WOULD APPEND: .claude/agent-memory/ to .gitignore');
      } else {
        fs.appendFileSync(gitignorePath, '\n# Agent memory DBs (per-project, not tracked)\n.claude/agent-memory/\n');
        console.log('  Added .claude/agent-memory/ to .gitignore');
      }
    }
  } else {
    if (dryRun) {
      console.log('  WOULD CREATE: .gitignore with .claude/agent-memory/');
    } else {
      fs.writeFileSync(gitignorePath, '# Agent memory DBs (per-project, not tracked)\n.claude/agent-memory/\n');
      console.log('  Created .gitignore with .claude/agent-memory/');
    }
  }

  // 3. Copy hooks
  const hooksDir = path.join(targetDir, '.claude', 'hooks');
  if (!dryRun) fs.mkdirSync(hooksDir, { recursive: true });
  const templateHooks = path.join(TEMPLATES_DIR, 'hooks');
  if (fs.existsSync(templateHooks)) {
    const result = copyDir(templateHooks, hooksDir, { force, dryRun });
    totalSkipped += result.skipped;
    console.log(`  Installed self-learning hooks (${result.copied} files)`);
  }

  // 4. Copy slash commands
  const commandsSrc = path.join(__dirname, '..', 'commands');
  if (fs.existsSync(commandsSrc)) {
    const commandsDir = path.join(targetDir, '.claude', 'commands');
    if (!dryRun) fs.mkdirSync(commandsDir, { recursive: true });
    const result = copyDir(commandsSrc, commandsDir, { force, dryRun });
    totalSkipped += result.skipped;
    console.log(`  Installed slash commands into .claude/commands/ (${result.copied} files)`);
  }

  if (totalSkipped > 0) {
    console.log(`\n  ${totalSkipped} existing file(s) left untouched. Re-run with --force to update framework files.`);
  }

  // 5. Generate settings.json
  generateSettingsJson(targetDir, { dryRun, pythonBin });

  // 6. Determine BMAD choice (before CLAUDE.md merge, so template is conditional)
  const bmadDir = path.join(targetDir, '_bmad');
  let installBmad = false;
  if (!fs.existsSync(bmadDir)) {
    if (!interactive) {
      installBmad = !!flags.bmad;
    } else {
      const answer = await ask(rl, '  Install BMAD workflow engine? (y/n) ');
      installBmad = answer.toLowerCase() === 'y';
    }
  }

  // 7. Merge CLAUDE.md (with BMAD section conditional on choice)
  mergeClaudeMd(targetDir, name, { dryRun, bmad: installBmad });

  // 8. Install BMAD files (if chosen)
  if (installBmad) {
    if (!fs.existsSync(bmadDir)) {
      const bmadTemplate = path.join(TEMPLATES_DIR, 'bmad');
      if (fs.existsSync(bmadTemplate)) {
        if (dryRun) {
          console.log('  WOULD INSTALL: BMAD workflow engine into _bmad/ + _bmad-output/');
        } else {
          copyDir(bmadTemplate, bmadDir, { force, dryRun: false });
          // copyDir is a raw file copy — substitute the placeholders config.yaml ships with.
          const bmadConfigPath = path.join(bmadDir, 'config.yaml');
          if (fs.existsSync(bmadConfigPath)) {
            let bmadConfig = fs.readFileSync(bmadConfigPath, 'utf-8');
            bmadConfig = bmadConfig
              .replace(/\{\{PROJECT_NAME\}\}/g, path.basename(targetDir))
              .replace(/\{\{USER_NAME\}\}/g, name);
            fs.writeFileSync(bmadConfigPath, bmadConfig);
          }
          // Create _bmad-output/ directory structure
          const bmadOutputDir = path.join(targetDir, '_bmad-output');
          fs.mkdirSync(path.join(bmadOutputDir, 'planning-artifacts', 'plans'), { recursive: true });
          fs.mkdirSync(path.join(bmadOutputDir, 'planning-artifacts', 'epics'), { recursive: true });
          fs.mkdirSync(path.join(bmadOutputDir, 'implementation-artifacts'), { recursive: true });
          fs.writeFileSync(
            path.join(bmadOutputDir, 'planning-artifacts', 'plans', 'STATUS.md'),
            '# Project Status\n\n_No epics yet. Use BMAD workflow to create them._\n'
          );
          fs.writeFileSync(
            path.join(bmadOutputDir, 'planning-artifacts', 'lessons.md'),
            '# Lessons Learned\n\n_Format: [date] | what went wrong | rule to prevent it_\n'
          );
          console.log('  Installed BMAD workflow engine + output scaffolding');
        }
      }
    } else {
      console.log('  _bmad/ exists — skipping BMAD install');
    }
  }

  if (dryRun) {
    console.log('\n  Dry run complete — no files were written.\n');
  } else {
    // Pick a real non-orchestrator agent name from the installed theme for the example
    // command below — agent identity resolves from PEER_AGENT (see
    // agent-persona-loader.py), not from which terminal you happen to open.
    let exampleAgent = 'agent-name';
    if (fs.existsSync(themeAgents)) {
      const agentFile = fs.readdirSync(themeAgents).find((f) => f !== 'agent-orchestrator.md' && f.endsWith('.md'));
      if (agentFile) exampleAgent = agentFile.replace(/^agent-/, '').replace(/\.md$/, '');
    }

    console.log('\n  Done! Your orchestra is ready.\n');
    console.log(`  Installed into ${targetDir}:`);
    console.log(`    - ${theme} personas in .claude/rules/`);
    console.log('    - self-learning hooks in .claude/hooks/');
    console.log('    - slash commands in .claude/commands/: /dispatch, /party, /orchestra-status, /archon-council');
    console.log('    - hooks + homunculus plugin registered in .claude/settings.json');
    if (installBmad) console.log('    - BMAD workflow engine in _bmad/ + _bmad-output/');
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Open Terminal 1: claude  (this is the orchestrator — no PEER_AGENT needed)');
    console.log(`  2. Open Terminal 2+: PEER_AGENT=${exampleAgent} claude  (sets which agent persona loads —`);
    console.log('     an unset PEER_AGENT terminal always becomes the orchestrator, never a persona)');
    console.log('  3. Tell the orchestrator what to build — it dispatches via /dispatch or /party.');
    console.log('  4. Requires the claude-peers MCP server for dispatch to actually reach agent terminals.\n');
    console.log(`  Built on claude-peers by Louis (https://github.com/louislva/claude-peers-mcp)\n`);
  }

  if (rl) rl.close();
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
