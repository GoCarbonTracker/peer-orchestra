#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function mergeClaudeMd(targetDir, orchestratorName) {
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const templatePath = path.join(TEMPLATES_DIR, 'CLAUDE.md.template');
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace(/\{\{ORCHESTRATOR_NAME\}\}/g, orchestratorName);

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    const marker = '# Peer Orchestra';
    if (existing.includes(marker)) {
      console.log('  CLAUDE.md already has Peer Orchestra section — skipping.');
      return;
    }
    fs.writeFileSync(claudeMdPath, existing + '\n\n' + template);
    console.log('  Merged orchestrator instructions into existing CLAUDE.md');
  } else {
    fs.writeFileSync(claudeMdPath, template);
    console.log('  Created CLAUDE.md with orchestrator instructions');
  }
}

function generateSettingsJson(targetDir) {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  const settings = {
    hooks: {
      UserPromptSubmit: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: 'python3 .claude/hooks/agent-router.py "$PROMPT"',
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
            },
            {
              type: 'command',
              command: 'python3 .claude/hooks/session-start-peer-memory.py',
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
              command: 'python3 .claude/hooks/session-end-peer-memory.py',
            },
            {
              type: 'command',
              command: 'python3 .claude/hooks/session-learning-extractor.py',
            },
          ],
        },
      ],
      PreCompact: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: 'python3 .claude/hooks/session-learning-extractor.py',
            },
          ],
        },
      ],
    },
    plugins: {
      homunculus: true,
    },
  };

  if (fs.existsSync(settingsPath)) {
    console.log('  .claude/settings.json exists — merging hooks and plugins...');
    const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    existing.hooks = { ...existing.hooks, ...settings.hooks };
    existing.plugins = { ...existing.plugins, ...settings.plugins };
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
  } else {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
  console.log('  Configured .claude/settings.json with hooks + homunculus plugin');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== 'init') {
    console.log('Usage: peer-orchestra init [--theme <theme>] [--dir <path>]');
    console.log('');
    console.log('Themes: genshin (default), generic');
    console.log('More themes coming: naruto, marvel, dc');
    process.exit(1);
  }

  const themeIdx = args.indexOf('--theme');
  const theme = themeIdx !== -1 ? args[themeIdx + 1] : 'genshin';
  const dirIdx = args.indexOf('--dir');
  const targetDir = dirIdx !== -1 ? path.resolve(args[dirIdx + 1]) : process.cwd();

  const themePath = path.join(THEMES_DIR, theme);
  if (!fs.existsSync(themePath)) {
    console.error(`Theme "${theme}" not found. Available: ${fs.readdirSync(THEMES_DIR).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n  Peer Orchestra v0.1.0`);
  console.log(`  Theme: ${theme}`);
  console.log(`  Target: ${targetDir}\n`);

  const orchestratorName = await ask('  What is your orchestrator name? (default: your username) ');
  const name = orchestratorName.trim() || process.env.USER || 'orchestrator';

  console.log(`\n  Setting up ${name}'s orchestra...\n`);

  // 1. Copy agent rules
  const rulesDir = path.join(targetDir, '.claude', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });

  // Copy theme-specific agent files
  const themeAgents = path.join(themePath, 'agents');
  if (fs.existsSync(themeAgents)) {
    copyDir(themeAgents, rulesDir);
    console.log(`  Installed ${theme} agent personas into .claude/rules/`);
  }

  // Copy common rules (dispatch, team, self-improvement)
  const commonRules = path.join(TEMPLATES_DIR, 'rules');
  if (fs.existsSync(commonRules)) {
    copyDir(commonRules, rulesDir);
    console.log('  Installed dispatch protocols and common rules');
  }

  // 2. Create agent-memory directory (project-local, per-agent SQLite DBs)
  const agentMemoryDir = path.join(targetDir, '.claude', 'agent-memory');
  fs.mkdirSync(agentMemoryDir, { recursive: true });
  // Add to .gitignore if not already there
  const gitignorePath = path.join(targetDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.claude/agent-memory')) {
      fs.appendFileSync(gitignorePath, '\n# Agent memory DBs (per-project, not tracked)\n.claude/agent-memory/\n');
      console.log('  Added .claude/agent-memory/ to .gitignore');
    }
  }
  console.log('  Created .claude/agent-memory/ for per-agent learning DBs');

  // 3. Copy hooks
  const hooksDir = path.join(targetDir, '.claude', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const templateHooks = path.join(TEMPLATES_DIR, 'hooks');
  if (fs.existsSync(templateHooks)) {
    copyDir(templateHooks, hooksDir);
    console.log('  Installed self-learning hooks (incl. session-learning-extractor)');
  }

  // 4. Generate settings.json
  generateSettingsJson(targetDir);

  // 5. Merge CLAUDE.md
  mergeClaudeMd(targetDir, name);

  // 6. Install BMAD (optional)
  const bmadDir = path.join(targetDir, '_bmad');
  if (!fs.existsSync(bmadDir)) {
    const installBmad = await ask('  Install BMAD workflow engine? (y/n) ');
    if (installBmad.toLowerCase() === 'y') {
      const bmadTemplate = path.join(TEMPLATES_DIR, 'bmad');
      if (fs.existsSync(bmadTemplate)) {
        copyDir(bmadTemplate, bmadDir);
        console.log('  Installed BMAD workflow engine');
      }
    }
  } else {
    console.log('  _bmad/ exists — skipping BMAD install');
  }

  console.log('\n  Done! Your orchestra is ready.\n');
  console.log('  Next steps:');
  console.log('  1. Add shell aliases (if not already set):');
  console.log(`     echo "alias cl='claude --dangerously-skip-permissions'" >> ~/.zshrc`);
  console.log(`     echo "alias clp='claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers'" >> ~/.zshrc`);
  console.log('  2. Open Terminal 1: clp  (you are the orchestrator)');
  console.log('  3. Open Terminal 2+: clp  (these become your agents)');
  console.log('  4. Tell the orchestrator what to build. It dispatches to agents.\n');
  console.log(`  Built on claude-peers by Louis (https://github.com/louislva/claude-peers-mcp)\n`);

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
