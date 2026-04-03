'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { mergeMcpJson, mergeSettingsLocal, removeFromMcpJson, removeFromSettingsLocal } = require('../lib/merge');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o8x-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('mergeMcpJson', () => {
  it('creates .mcp.json with actual key', () => {
    const action = mergeMcpJson(tmpDir, 'orch_live_test_key_123');
    assert.equal(action, 'create');

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.ok(content.mcpServers.orchestrix);
    assert.ok(content.mcpServers['sequential-thinking']);
    assert.equal(content.mcpServers.orchestrix.type, 'http');
    assert.equal(content.mcpServers.orchestrix.headers.Authorization, 'Bearer orch_live_test_key_123');
  });

  it('merges into existing .mcp.json preserving other entries', () => {
    const existing = {
      mcpServers: {
        myServer: { command: 'node', args: ['server.js'] },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    const action = mergeMcpJson(tmpDir, 'orch_live_test_key_123');
    assert.equal(action, 'update');

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.ok(content.mcpServers.myServer, 'existing entry preserved');
    assert.ok(content.mcpServers.orchestrix, 'orchestrix added');
    assert.ok(content.mcpServers['sequential-thinking'], 'sequential-thinking added');
  });

  it('skips when orchestrix already has same key', () => {
    const existing = {
      mcpServers: {
        orchestrix: {
          type: 'http',
          url: 'https://orchestrix-mcp.youlidao.ai/api/mcp',
          headers: { Authorization: 'Bearer orch_live_test_key_123' },
        },
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    const action = mergeMcpJson(tmpDir, 'orch_live_test_key_123');
    assert.equal(action, 'skip');
  });

  it('updates headers when key changes', () => {
    const existing = {
      mcpServers: {
        orchestrix: {
          type: 'http',
          url: 'https://orchestrix-mcp.youlidao.ai/api/mcp',
          headers: { Authorization: 'Bearer ORCH-TEAM-SOME-HARDCODED-KEY' },
        },
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    const action = mergeMcpJson(tmpDir, 'orch_live_new_key');
    assert.equal(action, 'update');

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.equal(
      content.mcpServers.orchestrix.headers.Authorization,
      'Bearer orch_live_new_key',
      'headers updated to new key'
    );
  });

  it('does not overwrite existing sequential-thinking config', () => {
    const existing = {
      mcpServers: {
        'sequential-thinking': { command: 'custom', args: ['--flag'] },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    mergeMcpJson(tmpDir);

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.equal(content.mcpServers['sequential-thinking'].command, 'custom');
  });
});

describe('mergeSettingsLocal', () => {
  it('creates settings.local.json when none exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const action = mergeSettingsLocal(tmpDir);
    assert.equal(action, 'create');

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8'));
    assert.ok(content.hooks.Stop.length > 0);
    assert.ok(content.hooks.Stop[0].hooks[0].command.includes('handoff-detector'));
  });

  it('appends hook to existing settings without clobbering', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const existing = {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'echo existing' }] },
        ],
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.local.json'),
      JSON.stringify(existing)
    );

    const action = mergeSettingsLocal(tmpDir);
    assert.equal(action, 'update');

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8'));
    assert.equal(content.hooks.Stop.length, 2, 'both hooks present');
    assert.equal(content.hooks.Stop[0].hooks[0].command, 'echo existing');
    assert.ok(content.hooks.Stop[1].hooks[0].command.includes('handoff-detector'));
  });

  it('skips when handoff-detector already configured', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const existing = {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'bash handoff-detector.sh' }] },
        ],
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.local.json'),
      JSON.stringify(existing)
    );

    const action = mergeSettingsLocal(tmpDir);
    assert.equal(action, 'skip');
  });
});

describe('removeFromMcpJson', () => {
  it('removes orchestrix entries from .mcp.json', () => {
    const existing = {
      mcpServers: {
        orchestrix: { type: 'http', url: 'https://example.com' },
        'sequential-thinking': { command: 'npx', args: [] },
        myServer: { command: 'node' },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    const result = removeFromMcpJson(tmpDir);
    assert.ok(result);

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'));
    assert.ok(!content.mcpServers.orchestrix);
    assert.ok(!content.mcpServers['sequential-thinking']);
    assert.ok(content.mcpServers.myServer, 'other entries preserved');
  });

  it('deletes .mcp.json if only orchestrix entries remain', () => {
    const existing = {
      mcpServers: {
        orchestrix: { type: 'http' },
        'sequential-thinking': { command: 'npx' },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(existing));

    removeFromMcpJson(tmpDir);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.mcp.json')));
  });
});

describe('removeFromSettingsLocal', () => {
  it('removes handoff-detector hook', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const existing = {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'echo keep' }] },
          { hooks: [{ type: 'command', command: 'bash handoff-detector.sh' }] },
        ],
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.local.json'),
      JSON.stringify(existing)
    );

    const result = removeFromSettingsLocal(tmpDir);
    assert.ok(result);

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8'));
    assert.equal(content.hooks.Stop.length, 1);
    assert.equal(content.hooks.Stop[0].hooks[0].command, 'echo keep');
  });
});
