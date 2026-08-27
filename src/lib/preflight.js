const fs = require('fs');
const path = require('path');
const { findPython } = require('./python');
const { readSettingsJson } = require('./settings');

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
module.exports = { preflight };
