const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ask, copyDir } = require('../lib/fs-utils');
const { findPython } = require('../lib/python');
const { getStateFilePath, readState, writeState, removeThemeFiles } = require('../lib/state');
const { getInstalledHookCommands, readSettingsJson, generateSettingsJson } = require('../lib/settings');
const { mergeClaudeMd, stripPeerOrchestraSection } = require('../lib/claude-md');
const { preflight } = require('../lib/preflight');

const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

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
  const commandsSrc = path.join(__dirname, '..', '..', 'commands');
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

  console.log('\n  Uninstalled.\n');
}

module.exports = { uninstall };
