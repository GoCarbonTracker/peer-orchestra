#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  return new Promise((resolve) => rl.question(question, resolve));
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

function generateSettingsJson(targetDir, { dryRun = false } = {}) {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  const settings = {
    hooks: {
      UserPromptSubmit: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: 'python3 .claude/hooks/agent-router.py',
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
              command: 'python3 .claude/hooks/agent-persona-loader.py',
              timeout: 10,
            },
            {
              type: 'command',
              command: 'python3 .claude/hooks/session-start-peer-memory.py',
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
              command: 'python3 .claude/hooks/session-learning-extractor.py',
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
    const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // Merge hooks: for each event type, append our hook entries if not already present
    if (!existing.hooks) existing.hooks = {};
    for (const [event, newEntries] of Object.entries(settings.hooks)) {
      if (!existing.hooks[event]) {
        // No existing hooks for this event — add ours
        existing.hooks[event] = newEntries;
      } else {
        // Event exists — check each hook command for duplicates before appending
        for (const newEntry of newEntries) {
          for (const newHook of newEntry.hooks) {
            const alreadyExists = existing.hooks[event].some((existingEntry) =>
              existingEntry.hooks &&
              existingEntry.hooks.some((h) => h.command === newHook.command)
            );
            if (!alreadyExists) {
              // Append to the first matcher group, or create a new one
              const targetEntry = existing.hooks[event].find((e) => e.matcher === '');
              if (targetEntry && targetEntry.hooks) {
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

async function main() {
  const { command, flags } = parseArgs(process.argv);

  // --version: print and exit
  if (flags.version) {
    console.log(`peer-orchestra v${getVersion()}`);
    process.exit(0);
  }

  // No command or unknown command
  if (command !== 'init') {
    console.log(`peer-orchestra v${getVersion()}`);
    console.log('');
    console.log('Usage: peer-orchestra init [options]');
    console.log('');
    console.log('Options:');
    console.log('  --theme <name>      Theme to install (genshin, generic)');
    console.log('  --name <name>       Orchestrator persona name');
    console.log('  --dir <path>        Target project directory (default: .)');
    console.log('  --bmad              Enable BMAD workflow integration');
    console.log('  --no-interactive    Skip prompts (requires --theme and --name)');
    console.log('  --dry-run           Show what would be installed without writing files');
    console.log('  --force             Overwrite existing files (default: skip with warning)');
    console.log('  --version, -v       Print version');
    process.exit(command ? 1 : 0);
  }

  const dryRun = !!flags.dryRun;
  const force = !!flags.force;
  const noInteractive = !!flags.noInteractive;

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

  // Resolve theme
  const theme = flags.theme || (noInteractive ? null : 'genshin');
  const themePath = path.join(THEMES_DIR, theme || '');
  if (!theme || !fs.existsSync(themePath)) {
    const available = fs.readdirSync(THEMES_DIR).filter(
      (d) => fs.statSync(path.join(THEMES_DIR, d)).isDirectory()
    );
    console.error(`Error: Theme "${theme || ''}" not found. Available: ${available.join(', ')}`);
    process.exit(3);
  }

  // Resolve orchestrator name
  let name;
  let rl;

  if (noInteractive) {
    name = flags.name;
  } else {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  const version = getVersion();
  console.log(`\n  Peer Orchestra v${version}`);
  console.log(`  Theme: ${theme}`);
  console.log(`  Target: ${targetDir}`);
  if (dryRun) console.log('  Mode: DRY RUN (no files will be written)');
  if (force) console.log('  Mode: FORCE (existing files will be overwritten)');
  console.log('');

  if (!noInteractive) {
    const answer = await ask(rl, '  What is your orchestrator name? (default: your username) ');
    name = answer.trim() || process.env.USER || 'orchestrator';
  }

  console.log(`\n  Setting up ${name}'s orchestra...\n`);

  // 1. Copy agent rules
  const rulesDir = path.join(targetDir, '.claude', 'rules');
  if (!dryRun) fs.mkdirSync(rulesDir, { recursive: true });

  // Existing files are preserved unless --force is passed
  let totalSkipped = 0;

  const themeAgents = path.join(themePath, 'agents');
  if (fs.existsSync(themeAgents)) {
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

  // 2. Create agent-memory directory
  const agentMemoryDir = path.join(targetDir, '.claude', 'agent-memory');
  if (dryRun) {
    console.log('  WOULD CREATE: .claude/agent-memory/ for per-agent learning DBs');
  } else {
    fs.mkdirSync(agentMemoryDir, { recursive: true });
    console.log('  Created .claude/agent-memory/ for per-agent learning DBs');
  }

  // Add to .gitignore if not already there
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
  generateSettingsJson(targetDir, { dryRun });

  // 5. Determine BMAD choice (before CLAUDE.md merge, so template is conditional)
  const bmadDir = path.join(targetDir, '_bmad');
  let installBmad = false;
  if (!fs.existsSync(bmadDir)) {
    if (noInteractive) {
      installBmad = !!flags.bmad;
    } else {
      const answer = await ask(rl, '  Install BMAD workflow engine? (y/n) ');
      installBmad = answer.toLowerCase() === 'y';
    }
  }

  // 6. Merge CLAUDE.md (with BMAD section conditional on choice)
  mergeClaudeMd(targetDir, name, { dryRun, bmad: installBmad });

  // 7. Install BMAD files (if chosen)
  if (installBmad) {
    if (!fs.existsSync(bmadDir)) {
      const bmadTemplate = path.join(TEMPLATES_DIR, 'bmad');
      if (fs.existsSync(bmadTemplate)) {
        if (dryRun) {
          console.log('  WOULD INSTALL: BMAD workflow engine into _bmad/ + _bmad-output/');
        } else {
          copyDir(bmadTemplate, bmadDir, { force, dryRun: false });
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
    console.log('\n  Done! Your orchestra is ready.\n');
    console.log('  Next steps:');
    console.log('  1. Open Terminal 1: claude  (you are the orchestrator)');
    console.log('  2. Open Terminal 2+: claude  (these become your agents)');
    console.log('  3. Tell the orchestrator what to build. It dispatches to agents.\n');
    console.log(`  Built on claude-peers by Louis (https://github.com/louislva/claude-peers-mcp)\n`);
  }

  if (rl) rl.close();
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
