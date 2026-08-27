#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getVersion } = require('./lib/version');
const { init } = require('./commands/init');
const { uninstall } = require('./commands/uninstall');

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
    } else if (!args[i].startsWith('-') && !parsed.command) {
      parsed.command = args[i];
    }
  }

  return parsed;
}


async function main() {
  const { command, flags } = parseArgs(process.argv);

  if (flags.version) {
    console.log(`peer-orchestra v${getVersion()}`);
    return;
  }

  if (command === 'uninstall') {
    await uninstall(flags);
    return;
  }

  if (command !== 'init') {
    usage();
    process.exit(command ? 1 : 0);
  }

  await init(flags);
}

function usage() {
  console.log(`peer-orchestra v${getVersion()}`);
  console.log('');
  console.log('Usage: peer-orchestra init [options]');
  console.log('       peer-orchestra uninstall [options]');
  console.log('');
  console.log('Options (init):');
  console.log('  --theme <name>      Theme to install (genshin, generic)');
  console.log('  --name <name>       Orchestrator persona name');
  console.log('  --dir <path>        Target project directory (default: .)');
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
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
