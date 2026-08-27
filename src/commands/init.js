const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ask, copyDir } = require('../lib/fs-utils');
const { findPython } = require('../lib/python');
const { getStateFilePath, readState, writeState, removeThemeFiles } = require('../lib/state');
const { getInstalledHookCommands, readSettingsJson, generateSettingsJson } = require('../lib/settings');
const { mergeClaudeMd, stripPeerOrchestraSection } = require('../lib/claude-md');
const { preflight } = require('../lib/preflight');
const { getVersion } = require('../lib/version');

const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

async function init(flags) {
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
  const commandsSrc = path.join(__dirname, '..', '..', 'commands');
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

  // 6. Merge CLAUDE.md
  mergeClaudeMd(targetDir, name, { dryRun });

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

module.exports = { init };
