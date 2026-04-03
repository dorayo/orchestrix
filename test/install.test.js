'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o8x-install-test-'));
  // Initialize as git repo
  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('install --offline', () => {
  it('creates all expected files', async () => {
    const { install } = require('../lib/install');
    await install({ offline: true, force: true, key: 'test_key_123' });

    // Check slash commands
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'o.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'o-help.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'o-status.md')));

    // Check .mcp.json
    assert.ok(fs.existsSync(path.join(tmpDir, '.mcp.json')));
    const mcp = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.ok(mcp.mcpServers.orchestrix);

    // Check core-config
    assert.ok(fs.existsSync(path.join(tmpDir, '.orchestrix-core', 'core-config.yaml')));

    // Check scripts
    assert.ok(fs.existsSync(path.join(tmpDir, '.orchestrix-core', 'scripts', 'start-orchestrix.sh')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.orchestrix-core', 'scripts', 'handoff-detector.sh')));

    // Check scripts are executable
    fs.accessSync(
      path.join(tmpDir, '.orchestrix-core', 'scripts', 'start-orchestrix.sh'),
      fs.constants.X_OK
    );

    // Check hooks
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'settings.local.json')));

    // Check .env.local
    assert.ok(fs.existsSync(path.join(tmpDir, '.env.local')));
    const envContent = fs.readFileSync(path.join(tmpDir, '.env.local'), 'utf-8');
    assert.ok(envContent.includes('ORCHESTRIX_LICENSE_KEY=test_key_123'));
  });

  it('is idempotent (safe to run twice)', async () => {
    const { install } = require('../lib/install');
    await install({ offline: true, force: true, key: 'test_key_123' });
    await install({ offline: true, force: true, key: 'test_key_123' });

    // .mcp.json should not have duplicate entries
    const mcp = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.equal(Object.keys(mcp.mcpServers).length, 2); // orchestrix + sequential-thinking

    // settings.local.json should not have duplicate hooks
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8')
    );
    assert.equal(settings.hooks.Stop.length, 1);

    // .env.local should not have duplicate keys
    const envContent = fs.readFileSync(path.join(tmpDir, '.env.local'), 'utf-8');
    const keyCount = (envContent.match(/ORCHESTRIX_LICENSE_KEY/g) || []).length;
    assert.equal(keyCount, 1);
  });

  it('preserves existing .mcp.json entries', async () => {
    // Create existing .mcp.json
    fs.writeFileSync(
      path.join(tmpDir, '.mcp.json'),
      JSON.stringify({ mcpServers: { myTool: { command: 'node' } } })
    );

    const { install } = require('../lib/install');
    await install({ offline: true, force: true, key: 'test_key_123' });

    const mcp = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.ok(mcp.mcpServers.myTool, 'existing entry preserved');
    assert.ok(mcp.mcpServers.orchestrix, 'orchestrix added');
  });

  it('does not overwrite existing core-config.yaml', async () => {
    fs.mkdirSync(path.join(tmpDir, '.orchestrix-core'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.orchestrix-core', 'core-config.yaml'),
      'custom: true\n'
    );

    const { install } = require('../lib/install');
    await install({ offline: true, force: true, key: 'test_key_123' });

    const config = fs.readFileSync(
      path.join(tmpDir, '.orchestrix-core', 'core-config.yaml'),
      'utf-8'
    );
    assert.ok(config.includes('custom: true'), 'original content preserved');
  });

  it('respects --no-hooks and --no-scripts flags', async () => {
    const { install } = require('../lib/install');
    await install({ offline: true, force: true, key: 'test_key_123', noHooks: true, noScripts: true });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.claude', 'settings.local.json')));
    assert.ok(!fs.existsSync(path.join(tmpDir, '.orchestrix-core', 'scripts', 'start-orchestrix.sh')));
  });
});
