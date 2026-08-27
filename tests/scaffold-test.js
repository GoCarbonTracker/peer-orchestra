#!/usr/bin/env node

/**
 * Scaffold smoke test — verifies peer-orchestra init creates correct file structure.
 * Tests both themes, merge idempotency, hook presence, and leak detection.
 * Run: node tests/scaffold-test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_DIR = path.join(os.tmpdir(), 'peer-orchestra-test-' + Date.now());
const INIT_SCRIPT = path.join(__dirname, '..', 'src', 'index.js');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.log(`  FAIL: ${message}`);
    failed++;
  }
}

function fileExists(dir, filePath) {
  return fs.existsSync(path.join(dir, filePath));
}

function fileContains(dir, filePath, text) {
  if (!fileExists(dir, filePath)) return false;
  return fs.readFileSync(path.join(dir, filePath), 'utf-8').includes(text);
}

function fileNotContains(dir, filePath, text) {
  if (!fileExists(dir, filePath)) return true;
  return !fs.readFileSync(path.join(dir, filePath), 'utf-8').toLowerCase().includes(text.toLowerCase());
}

function runInit(dir, extraFlags = '') {
  execSync(`node "${INIT_SCRIPT}" init --no-interactive --dir "${dir}" ${extraFlags}`, {
    stdio: 'pipe',
    timeout: 15000,
  });
}

/**
 * Recursively check all files for leak strings. Returns array of leak descriptions.
 */
function findLeaks(dir, patterns) {
  const leaks = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      leaks.push(...findLeaks(fullPath, patterns));
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
      for (const p of patterns) {
        if (content.includes(p.toLowerCase())) {
          leaks.push(`"${p}" found in ${path.relative(dir, fullPath)}`);
        }
      }
    }
  }
  return leaks;
}

// ============================================================
// TEST SUITE 1: Genshin Theme
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 1: Genshin Theme Scaffold');
console.log(`${'='.repeat(60)}\n`);

const genshinDir = path.join(BASE_DIR, 'genshin-test');
fs.mkdirSync(genshinDir, { recursive: true });
runInit(genshinDir, '--theme genshin --name Paimon');

// Core files
console.log('Core files:');
assert(fileExists(genshinDir, 'CLAUDE.md'), 'CLAUDE.md created');
assert(fileExists(genshinDir, '.claude/settings.json'), 'settings.json created');

// All 12 Genshin agents
console.log('\nGenshin agents (12):');
const genshinAgents = ['orchestrator', 'nahida', 'zhongli', 'albedo', 'furina', 'kaveh',
                       'alhaitham', 'xiao', 'yelan', 'neuvillette', 'ganyu', 'lisa'];
for (const agent of genshinAgents) {
  assert(fileExists(genshinDir, `.claude/rules/agent-${agent}.md`), `agent-${agent}.md`);
}

// Common rules (4)
console.log('\nCommon rules (4):');
const commonRules = ['agent-common.md', 'multi-agent-dispatch.md', 'self-improvement.md', 'team-dispatch.md'];
for (const rule of commonRules) {
  assert(fileExists(genshinDir, `.claude/rules/${rule}`), rule);
}

// Hooks (4)
console.log('\nHooks (4):');
const hooks = ['agent-router.py', 'agent-persona-loader.py', 'session-start-peer-memory.py', 'session-learning-extractor.py'];
for (const hook of hooks) {
  assert(fileExists(genshinDir, `.claude/hooks/${hook}`), hook);
}
assert(!fileExists(genshinDir, '.claude/hooks/session-end-peer-memory.py'), 'no session-end-peer-memory.py (deleted placeholder)');

// settings.json structure
console.log('\nSettings.json:');
try {
  const settings = JSON.parse(fs.readFileSync(path.join(genshinDir, '.claude/settings.json'), 'utf-8'));
  assert(!!settings.hooks, 'has hooks');
  assert(!!settings.hooks.SessionStart, 'SessionStart configured');
  assert(!!settings.hooks.SessionEnd, 'SessionEnd configured');
  assert(!!settings.hooks.PreCompact, 'PreCompact configured');
  assert(!!settings.hooks.UserPromptSubmit, 'UserPromptSubmit configured');
  assert(settings.plugins?.homunculus === true, 'homunculus plugin enabled');
} catch {
  assert(false, 'settings.json is valid JSON');
}

// CLAUDE.md content
console.log('\nCLAUDE.md:');
assert(fileContains(genshinDir, 'CLAUDE.md', '# Peer Orchestra'), 'has Peer Orchestra header');
assert(fileContains(genshinDir, 'CLAUDE.md', 'Paimon'), 'has orchestrator name');

// .gitignore
console.log('\n.gitignore:');
assert(fileExists(genshinDir, '.claude/agent-memory'), 'agent-memory dir created');

// Agent file structure
console.log('\nAgent structure:');
for (const agent of genshinAgents) {
  const p = `.claude/rules/agent-${agent}.md`;
  if (fileExists(genshinDir, p)) {
    const hasIdentity = fileContains(genshinDir, p, '**Identity:**') || fileContains(genshinDir, p, 'Identity:');
    const hasRole = fileContains(genshinDir, p, '## Role') || fileContains(genshinDir, p, '**Role:**');
    assert(hasIdentity || hasRole, `agent-${agent}.md has Identity or Role`);
  }
}

// Leak detection
console.log('\nLeak detection (Genshin):');
const gctLeaks = findLeaks(genshinDir, ['GoCarbonTracker', 'go-carbon-insights', 'hypergraph-rag']);
assert(gctLeaks.length === 0, `no GCT references (found ${gctLeaks.length})`);
if (gctLeaks.length > 0) gctLeaks.forEach((l) => console.log(`    LEAK: ${l}`));

const pluginLeaks = findLeaks(genshinDir, ['CLAUDE_PLUGIN_ROOT', 'claude-plugin', 'plugin.json']);
assert(pluginLeaks.length === 0, `no plugin references (found ${pluginLeaks.length})`);
if (pluginLeaks.length > 0) pluginLeaks.forEach((l) => console.log(`    LEAK: ${l}`));

// ============================================================
// TEST SUITE 2: Generic Theme
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 2: Generic Theme Scaffold');
console.log(`${'='.repeat(60)}\n`);

const genericDir = path.join(BASE_DIR, 'generic-test');
fs.mkdirSync(genericDir, { recursive: true });
runInit(genericDir, '--theme generic --name Commander');

// All 12 Generic agents
console.log('Generic agents (12):');
const genericAgents = ['orchestrator', 'backend-engineer', 'data-specialist', 'data-processor',
                       'technical-writer', 'frontend-engineer', 'devops-engineer', 'qa-engineer',
                       'researcher', 'auditor', 'reporter', 'tooling-engineer'];
for (const agent of genericAgents) {
  assert(fileExists(genericDir, `.claude/rules/agent-${agent}.md`), `agent-${agent}.md`);
}

// Common rules present
console.log('\nCommon rules:');
for (const rule of commonRules) {
  assert(fileExists(genericDir, `.claude/rules/${rule}`), rule);
}

// Hooks present
console.log('\nHooks:');
for (const hook of hooks) {
  assert(fileExists(genericDir, `.claude/hooks/${hook}`), hook);
}

// CLAUDE.md
console.log('\nCLAUDE.md:');
assert(fileContains(genericDir, 'CLAUDE.md', 'Commander'), 'has orchestrator name');

// Leak detection (generic)
console.log('\nLeak detection (Generic):');
const genericGctLeaks = findLeaks(genericDir, ['GoCarbonTracker', 'go-carbon-insights', 'hypergraph-rag']);
assert(genericGctLeaks.length === 0, `no GCT references (found ${genericGctLeaks.length})`);
if (genericGctLeaks.length > 0) genericGctLeaks.forEach((l) => console.log(`    LEAK: ${l}`));

// ============================================================
// TEST SUITE 3: Merge Idempotency
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 3: Merge Idempotency');
console.log(`${'='.repeat(60)}\n`);

const idemDir = path.join(BASE_DIR, 'idempotency-test');
fs.mkdirSync(idemDir, { recursive: true });

// Pre-populate with existing config
fs.mkdirSync(path.join(idemDir, '.claude'), { recursive: true });
fs.writeFileSync(path.join(idemDir, '.claude', 'settings.json'), JSON.stringify({
  hooks: {
    SessionStart: [{
      matcher: '',
      hooks: [{ type: 'command', command: 'python3 my-custom-hook.py' }],
    }],
  },
  plugins: { 'my-custom-plugin': true },
}, null, 2));
fs.writeFileSync(path.join(idemDir, 'CLAUDE.md'), '# My Existing Project\n\nSome existing content.\n');
fs.writeFileSync(path.join(idemDir, '.gitignore'), 'node_modules/\n.env\n');

// First init
runInit(idemDir, '--theme genshin --name Paimon');

// Verify merge preserves existing config
console.log('After first init:');
const settings1 = JSON.parse(fs.readFileSync(path.join(idemDir, '.claude/settings.json'), 'utf-8'));

// Custom hook preserved
const sessionStartHooks1 = settings1.hooks.SessionStart.flatMap((e) => e.hooks.map((h) => h.command));
assert(sessionStartHooks1.includes('python3 my-custom-hook.py'), 'custom hook preserved after init');
assert(sessionStartHooks1.includes('python3 .claude/hooks/agent-persona-loader.py'), 'peer-orchestra hook added');

// Custom plugin preserved
assert(settings1.plugins['my-custom-plugin'] === true, 'custom plugin preserved');
assert(settings1.plugins.homunculus === true, 'homunculus added');

// CLAUDE.md preserved
const claudeMd1 = fs.readFileSync(path.join(idemDir, 'CLAUDE.md'), 'utf-8');
assert(claudeMd1.includes('# My Existing Project'), 'existing CLAUDE.md content preserved');
assert(claudeMd1.includes('# Peer Orchestra'), 'Peer Orchestra section added');

// .gitignore
const gitignore1 = fs.readFileSync(path.join(idemDir, '.gitignore'), 'utf-8');
assert(gitignore1.includes('node_modules/'), 'existing .gitignore entries preserved');
assert(gitignore1.includes('.claude/agent-memory'), 'agent-memory added to .gitignore');

// Second init — idempotency
console.log('\nAfter second init (idempotency):');
runInit(idemDir, '--theme genshin --name Paimon');

const settings2 = JSON.parse(fs.readFileSync(path.join(idemDir, '.claude/settings.json'), 'utf-8'));

// No duplicate hooks
const sessionStartHooks2 = settings2.hooks.SessionStart.flatMap((e) => e.hooks.map((h) => h.command));
const uniqueHooks2 = [...new Set(sessionStartHooks2)];
assert(sessionStartHooks2.length === uniqueHooks2.length, `no duplicate SessionStart hooks (${sessionStartHooks2.length} total, ${uniqueHooks2.length} unique)`);

// Check per-event dedup (same command can appear in different events, e.g., extractor in SessionEnd + PreCompact)
let perEventDupes = 0;
for (const [event, entries] of Object.entries(settings2.hooks)) {
  const cmds = entries.flatMap((e) => e.hooks.map((h) => h.command));
  if (cmds.length !== [...new Set(cmds)].length) perEventDupes++;
}
assert(perEventDupes === 0, `no per-event duplicate hooks (${perEventDupes} events with dupes)`);

// No duplicate CLAUDE.md sections
const claudeMd2 = fs.readFileSync(path.join(idemDir, 'CLAUDE.md'), 'utf-8');
const peerOrchestraCount = (claudeMd2.match(/# Peer Orchestra/g) || []).length;
assert(peerOrchestraCount === 1, `CLAUDE.md has exactly 1 Peer Orchestra section (found ${peerOrchestraCount})`);

// No duplicate .gitignore entries
const gitignore2 = fs.readFileSync(path.join(idemDir, '.gitignore'), 'utf-8');
const memoryLines = gitignore2.split('\n').filter((l) => l.includes('.claude/agent-memory'));
assert(memoryLines.length === 1, `agent-memory appears once in .gitignore (found ${memoryLines.length})`);

// ============================================================
// TEST SUITE 4: BMAD Integration
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 4: BMAD Integration');
console.log(`${'='.repeat(60)}\n`);

const bmadDir = path.join(BASE_DIR, 'bmad-test');
fs.mkdirSync(bmadDir, { recursive: true });
runInit(bmadDir, '--theme genshin --name Paimon --bmad');

console.log('BMAD enabled:');
assert(fileExists(bmadDir, '_bmad/config.yaml'), '_bmad/config.yaml created');
assert(fileExists(bmadDir, '_bmad-output/planning-artifacts/plans/STATUS.md'), 'STATUS.md created');
assert(fileExists(bmadDir, '_bmad-output/planning-artifacts/lessons.md'), 'lessons.md created');
assert(fileContains(bmadDir, 'CLAUDE.md', 'BMAD Workflow'), 'CLAUDE.md has BMAD section');

const noBmadDir = path.join(BASE_DIR, 'no-bmad-test');
fs.mkdirSync(noBmadDir, { recursive: true });
runInit(noBmadDir, '--theme genshin --name Paimon');

console.log('\nBMAD disabled:');
assert(!fileExists(noBmadDir, '_bmad'), 'no _bmad/ directory');
assert(!fileContains(noBmadDir, 'CLAUDE.md', 'BMAD Workflow'), 'no BMAD section in CLAUDE.md');

// ============================================================
// Cleanup & Summary
// ============================================================
fs.rmSync(BASE_DIR, { recursive: true, force: true });

console.log(`\n${'='.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}\n`);
process.exit(failed > 0 ? 1 : 0);
