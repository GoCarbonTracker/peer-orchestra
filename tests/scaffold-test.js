#!/usr/bin/env node

/**
 * Scaffold smoke test — verifies peer-orchestra init creates correct file structure.
 * Run: node tests/scaffold-test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TEST_DIR = path.join(os.tmpdir(), 'peer-orchestra-test-' + Date.now());
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

function fileExists(filePath) {
  return fs.existsSync(path.join(TEST_DIR, filePath));
}

function fileContains(filePath, text) {
  if (!fileExists(filePath)) return false;
  return fs.readFileSync(path.join(TEST_DIR, filePath), 'utf-8').includes(text);
}

function noGctLeaks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git') continue;
      if (noGctLeaks(fullPath) === false) return false;
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('go-carbon-insights') || content.includes('hypergraph-rag')) {
        console.log(`    LEAK in ${fullPath}`);
        return false;
      }
    }
  }
  return true;
}

// Setup
console.log(`\nScaffold Test — peer-orchestra`);
console.log(`Test dir: ${TEST_DIR}\n`);
fs.mkdirSync(TEST_DIR, { recursive: true });

// Run init with piped input for the orchestrator name prompt
const initScript = path.join(__dirname, '..', 'src', 'index.js');
try {
  execSync(`echo "testuser\nn" | node "${initScript}" init --theme genshin --dir "${TEST_DIR}"`, {
    stdio: 'pipe',
    timeout: 10000,
  });
} catch (e) {
  console.log('Init output:', e.stdout?.toString());
  console.log('Init errors:', e.stderr?.toString());
}

// Test: Core files exist
console.log('File structure:');
assert(fileExists('CLAUDE.md'), 'CLAUDE.md created');
assert(fileExists('.claude/settings.json'), '.claude/settings.json created');
assert(fileExists('.claude/rules/agent-common.md'), 'agent-common.md installed');
assert(fileExists('.claude/rules/multi-agent-dispatch.md'), 'dispatch protocol installed');
assert(fileExists('.claude/rules/team-dispatch.md'), 'team dispatch installed');
assert(fileExists('.claude/rules/self-improvement.md'), 'self-improvement rules installed');

// Test: Genshin agents exist
console.log('\nGenshin agents:');
const agents = ['orchestrator', 'nahida', 'zhongli', 'albedo', 'furina', 'kaveh',
                'alhaitham', 'xiao', 'yelan', 'neuvillette', 'ganyu', 'lisa'];
for (const agent of agents) {
  assert(fileExists(`.claude/rules/agent-${agent}.md`), `agent-${agent}.md installed`);
}

// Test: Hooks exist
console.log('\nHooks:');
assert(fileExists('.claude/hooks/agent-router.py'), 'agent-router hook installed');
assert(fileExists('.claude/hooks/agent-persona-loader.py'), 'persona loader hook installed');
assert(fileExists('.claude/hooks/session-start-peer-memory.py'), 'session start hook installed');
assert(fileExists('.claude/hooks/session-end-peer-memory.py'), 'session end hook installed');

// Test: Settings.json is valid JSON
console.log('\nConfiguration:');
try {
  const settings = JSON.parse(fs.readFileSync(path.join(TEST_DIR, '.claude/settings.json'), 'utf-8'));
  assert(settings.hooks !== undefined, 'settings.json has hooks configured');
  assert(settings.hooks.SessionStart !== undefined, 'SessionStart hooks configured');
  assert(settings.hooks.UserPromptSubmit !== undefined, 'UserPromptSubmit hooks configured');
  assert(settings.plugins?.homunculus === true, 'homunculus plugin enabled');
} catch {
  assert(false, 'settings.json is valid JSON');
}

// Test: CLAUDE.md has orchestrator name
console.log('\nContent:');
assert(fileContains('CLAUDE.md', 'testuser') || fileContains('CLAUDE.md', 'Orchestrator'), 'CLAUDE.md has orchestrator reference');

// Test: No GCT-specific references leaked
console.log('\nLeak check:');
assert(noGctLeaks(TEST_DIR), 'No GCT-specific references in scaffolded files');

// Test: Each agent file has required sections
console.log('\nAgent structure:');
for (const agent of agents) {
  const agentPath = `.claude/rules/agent-${agent}.md`;
  if (fileExists(agentPath)) {
    assert(fileContains(agentPath, '**Identity:**') || fileContains(agentPath, '**Role:**'),
      `agent-${agent}.md has Identity/Role section`);
  }
}

// Cleanup
fs.rmSync(TEST_DIR, { recursive: true, force: true });

// Summary
console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
