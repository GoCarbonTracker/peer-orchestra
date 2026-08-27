const fs = require('fs');
const path = require('path');

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

module.exports = { ask, copyDir };
