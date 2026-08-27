const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

function mergeClaudeMd(targetDir, orchestratorName, { dryRun = false } = {}) {
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

module.exports = { mergeClaudeMd, stripPeerOrchestraSection };
