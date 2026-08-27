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

function runUninstall(dir, extraFlags = '--force') {
  execSync(`node "${INIT_SCRIPT}" uninstall --dir "${dir}" ${extraFlags}`, {
    stdio: 'pipe',
    timeout: 15000,
  });
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
  assert(!settings.hooks.PreCompact, 'PreCompact NOT configured (re-scans whole transcript)');
  assert(!!settings.hooks.UserPromptSubmit, 'UserPromptSubmit configured');
  assert(settings.plugins?.homunculus === true, 'homunculus plugin enabled');
  const allHooks = Object.values(settings.hooks).flatMap((e) => e.flatMap((m) => m.hooks));
  assert(allHooks.every((h) => typeof h.timeout === 'number'), 'every hook has a timeout');
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
// TEST SUITE 4: No BMAD Coupling
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 4: No BMAD Coupling');
console.log(`${'='.repeat(60)}\n`);

// BMAD was removed in v0.3.0 — peer-orchestra scaffolds multi-agent
// structure, not one particular planning methodology. These assertions
// exist so the coupling cannot silently return.
const noBmadDir = path.join(BASE_DIR, 'no-bmad-test');
fs.mkdirSync(noBmadDir, { recursive: true });
runInit(noBmadDir, '--theme genshin --name Paimon');

assert(!fileExists(noBmadDir, '_bmad'), 'no _bmad/ directory created');
assert(!fileExists(noBmadDir, '_bmad-output'), 'no _bmad-output/ directory created');
assert(!fileContains(noBmadDir, 'CLAUDE.md', 'BMAD'), 'no BMAD content in CLAUDE.md');

// The removed --bmad flag must not resurrect the behaviour if a user
// still has it in a script; unknown flags are ignored, not honoured.
const legacyFlagDir = path.join(BASE_DIR, 'legacy-bmad-flag-test');
fs.mkdirSync(legacyFlagDir, { recursive: true });
runInit(legacyFlagDir, '--theme genshin --name Paimon --bmad');
assert(!fileExists(legacyFlagDir, '_bmad'), 'legacy --bmad flag creates nothing');

// ============================================================
// TEST SUITE 5: Overwrite Safety
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 5: Overwrite Safety');
console.log(`${'='.repeat(60)}\n`);

const safetyDir = path.join(BASE_DIR, 'overwrite-safety-test');
fs.mkdirSync(safetyDir, { recursive: true });
runInit(safetyDir, '--theme genshin --name Paimon');

const SENTINEL = 'USER-EDIT-MUST-SURVIVE';
const editedPersona = path.join(safetyDir, '.claude/rules/agent-albedo.md');
const editedHook = path.join(safetyDir, '.claude/hooks/agent-router.py');
fs.writeFileSync(editedPersona, SENTINEL);
fs.writeFileSync(editedHook, SENTINEL);

console.log('Re-init without --force (user edits must survive):');
runInit(safetyDir, '--theme genshin --name Paimon');
assert(fs.readFileSync(editedPersona, 'utf-8') === SENTINEL, 'edited persona preserved');
assert(fs.readFileSync(editedHook, 'utf-8') === SENTINEL, 'edited hook preserved');

console.log('\nRe-init with --force (framework files update):');
runInit(safetyDir, '--theme genshin --name Paimon --force');
assert(fs.readFileSync(editedPersona, 'utf-8') !== SENTINEL, 'edited persona overwritten with --force');
assert(fs.readFileSync(editedHook, 'utf-8') !== SENTINEL, 'edited hook overwritten with --force');

console.log('\nSlash commands and archons installed:');
assert(fileExists(safetyDir, '.claude/commands/dispatch.md'), '.claude/commands/dispatch.md installed');
assert(fileExists(safetyDir, '.claude/commands/party.md'), '.claude/commands/party.md installed');
assert(fileExists(safetyDir, '.claude/commands/orchestra-status.md'), '.claude/commands/orchestra-status.md installed');
assert(fileExists(safetyDir, '.claude/commands/archon-council.md'), '.claude/commands/archon-council.md installed');
assert(fileExists(safetyDir, '.claude/rules/agent-venti.md'), 'genshin archon personas installed');

// ============================================================
// TEST SUITE 6: Uninstall Round-Trip
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 6: Uninstall Round-Trip');
console.log(`${'='.repeat(60)}\n`);

const rtDir = path.join(BASE_DIR, 'roundtrip-test');
fs.mkdirSync(path.join(rtDir, '.claude'), { recursive: true });
fs.writeFileSync(path.join(rtDir, '.claude/settings.json'), '{\n  "mySetting": true\n}\n');
fs.writeFileSync(path.join(rtDir, 'CLAUDE.md'), '# My Project\n\nMy notes.\n');
fs.writeFileSync(path.join(rtDir, '.gitignore'), 'node_modules/\n');
const rtBefore = ['.claude/settings.json', 'CLAUDE.md', '.gitignore']
  .map((f) => fs.readFileSync(path.join(rtDir, f), 'utf-8'));

runInit(rtDir, '--theme genshin --name Paimon');
assert(fileExists(rtDir, '.claude/commands/dispatch.md'), 'commands installed before uninstall');

runUninstall(rtDir);

console.log('\nEverything peer-orchestra installed is removed:');
assert(!fileExists(rtDir, '.claude/commands/dispatch.md'), 'slash commands removed');
assert(!fileExists(rtDir, '.claude/rules/agent-zhongli.md'), 'personas removed');
assert(!fileExists(rtDir, '.claude/hooks/agent-router.py'), 'hooks removed');

console.log('\nUser-authored files restored byte-for-byte:');
const rtAfter = ['.claude/settings.json', 'CLAUDE.md', '.gitignore']
  .map((f) => fs.readFileSync(path.join(rtDir, f), 'utf-8'));
assert(rtAfter[0] === rtBefore[0], 'settings.json restored exactly');
assert(rtAfter[1] === rtBefore[1], 'CLAUDE.md restored exactly');
assert(rtAfter[2] === rtBefore[2], '.gitignore restored exactly');

// ============================================================
// TEST SUITE 7: Hooks Reach The Model
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 7: Hooks Reach The Model');
console.log(`${'='.repeat(60)}\n`);

// Claude Code reads hookSpecificOutput.additionalContext. A bare
// {"message": ...} payload is silently discarded, which previously made
// the persona and memory hooks inert. These assertions pin the contract.
const hookDir = path.join(BASE_DIR, 'hook-output-test');
fs.mkdirSync(hookDir, { recursive: true });
runInit(hookDir, '--theme genshin --name Paimon');

function runHook(script, stdin, env = {}) {
  return execSync(`python3 "${path.join(hookDir, '.claude/hooks', script)}"`, {
    input: stdin,
    cwd: hookDir,
    env: { ...process.env, ...env },
    encoding: 'utf-8',
    timeout: 15000,
  });
}

let personaOut = {};
try {
  personaOut = JSON.parse(runHook('agent-persona-loader.py', '{}', { PEER_AGENT: 'zhongli' }));
} catch (e) {
  personaOut = {};
}
const personaCtx = personaOut.hookSpecificOutput?.additionalContext || '';
assert(!!personaOut.hookSpecificOutput, 'persona-loader uses hookSpecificOutput envelope');
assert(personaOut.hookSpecificOutput?.hookEventName === 'SessionStart', 'persona-loader declares SessionStart');

// The point of the hook: the persona CONTENT must be injected, not its filename.
const personaFile = fs.readFileSync(path.join(hookDir, '.claude/rules/agent-zhongli.md'), 'utf-8');
const personaBody = personaFile.trim().split('\n').slice(1, 6).join('\n');
assert(personaCtx.length > 1000, `persona content injected, not just a filename (got ${personaCtx.length} chars)`);
assert(personaCtx.includes(personaBody.split('\n')[1] || 'Role'), 'injected context contains the real persona body');

// The router must read the key Claude Code actually sends: user_prompt.
const routerOut = runHook(
  'agent-router.py',
  JSON.stringify({ hook_event_name: 'UserPromptSubmit', user_prompt: 'write tests for the parser' })
);
assert(routerOut.trim().length > 0, 'router responds to a user_prompt payload');
const routerJson = JSON.parse(routerOut);
assert(!!routerJson.hookSpecificOutput, 'router uses hookSpecificOutput envelope');

// ============================================================
// TEST SUITE 8: Theme Parity
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUITE 8: Theme Parity');
console.log(`${'='.repeat(60)}\n`);

// The two themes are meant to differ in flavour, not substance. Generic
// personas once averaged 34 lines against genshin's 77, missing Session
// Start in 11 of 12 files — a user picking --theme generic got a weaker
// framework. Nothing asserted parity, so the drift went unnoticed.
const THEMES_ROOT = path.join(__dirname, '..', 'themes');
const REQUIRED_SECTIONS = ['## Session Start', '## Abilities', '## Domain Rules'];

for (const theme of ['generic', 'genshin']) {
  const agentDir = path.join(THEMES_ROOT, theme, 'agents');
  // The orchestrator coordinates rather than executes — it owns no files and
  // has no domain, so it legitimately carries Role/Rules instead of
  // Abilities/Domain Rules. Compare the domain personas only.
  const files = fs
    .readdirSync(agentDir)
    .filter((f) => f.endsWith('.md') && f !== 'agent-orchestrator.md');
  for (const section of REQUIRED_SECTIONS) {
    const missing = files.filter(
      (f) => !fs.readFileSync(path.join(agentDir, f), 'utf-8').includes(section)
    );
    assert(missing.length === 0, `${theme}: every persona has "${section}"${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
  }
}

// Substance parity: neither theme should be a hollow copy of the other.
function avgLines(theme) {
  const dir = path.join(THEMES_ROOT, theme, 'agents');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const total = files.reduce(
    (n, f) => n + fs.readFileSync(path.join(dir, f), 'utf-8').split('\n').length, 0
  );
  return total / files.length;
}
const genericAvg = avgLines('generic');
const genshinAvg = avgLines('genshin');
const ratio = genericAvg / genshinAvg;
assert(
  ratio > 0.75,
  `generic theme has comparable substance to genshin (${genericAvg.toFixed(0)} vs ${genshinAvg.toFixed(0)} avg lines, ratio ${ratio.toFixed(2)})`
);

// Fictional flavour must not leak into the generic theme.
const genericLeaks = findLeaks(path.join(THEMES_ROOT, 'generic'), [
  'Genshin', 'Zhongli', 'Nahida', 'Albedo', 'Furina', 'Kaveh',
  'Alhaitham', 'Xiao', 'Yelan', 'Neuvillette', 'Ganyu', 'Paimon', 'Archon',
]);
assert(genericLeaks.length === 0, `no fictional character names in the generic theme${genericLeaks.length ? ` (found: ${genericLeaks.join(', ')})` : ''}`);

// ============================================================
// Cleanup & Summary
// ============================================================
fs.rmSync(BASE_DIR, { recursive: true, force: true });

console.log(`\n${'='.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}\n`);
process.exit(failed > 0 ? 1 : 0);
