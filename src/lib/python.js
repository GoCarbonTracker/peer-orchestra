const { spawnSync } = require('child_process');

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
module.exports = { findPython };
