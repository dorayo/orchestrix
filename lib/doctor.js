'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ui = require('./ui');
const { validateKey } = require('./mcp-client');
const { resolveKey } = require('./license');

async function doctor(flags) {
  ui.banner();
  ui.header('Health Check');

  const projectDir = process.cwd();
  let allGood = true;

  // 1. Node.js version
  const nodeVersion = process.versions.node;
  const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);
  if (nodeMajor >= 18) {
    ui.success(`Node.js ${nodeVersion}`);
  } else {
    ui.error(`Node.js ${nodeVersion} (need >= 18)`);
    allGood = false;
  }

  // 2. tmux
  try {
    const tmuxVersion = execSync('tmux -V', { stdio: 'pipe' }).toString().trim();
    ui.success(`tmux: ${tmuxVersion}`);
  } catch {
    ui.warn('tmux not installed (needed for multi-agent automation)');
    ui.log(`  Install: brew install tmux (macOS) or sudo apt install tmux (Linux)`);
  }

  // 3. .mcp.json
  const mcpPath = path.join(projectDir, '.mcp.json');
  if (fs.existsSync(mcpPath)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      if (mcp.mcpServers && mcp.mcpServers.orchestrix) {
        ui.success(`.mcp.json: orchestrix entry found (${mcp.mcpServers.orchestrix.url})`);
      } else {
        ui.error('.mcp.json: missing orchestrix entry');
        allGood = false;
      }
    } catch {
      ui.error('.mcp.json: invalid JSON');
      allGood = false;
    }
  } else {
    ui.error('.mcp.json: not found');
    allGood = false;
  }

  // 4. License key + MCP server
  try {
    const key = await resolveKey({ ...flags, key: flags.key || process.env.ORCHESTRIX_LICENSE_KEY });
    const result = await validateKey(key);
    if (result.valid) {
      ui.success(`MCP server: reachable (tier: ${result.tier})`);
    } else {
      ui.warn(`MCP server: ${result.error}`);
    }
  } catch {
    ui.warn('License key not found — MCP server check skipped');
  }

  // 5. Slash commands
  const commandsDir = path.join(projectDir, '.claude', 'commands');
  const expectedCommands = ['o.md', 'o-help.md', 'o-status.md'];
  const foundCommands = expectedCommands.filter((f) => fs.existsSync(path.join(commandsDir, f)));
  if (foundCommands.length === expectedCommands.length) {
    ui.success(`Slash commands: ${foundCommands.length}/${expectedCommands.length} installed`);
  } else {
    ui.error(`Slash commands: ${foundCommands.length}/${expectedCommands.length} installed`);
    allGood = false;
  }

  // 6. Core config
  const configPath = path.join(projectDir, '.orchestrix-core', 'core-config.yaml');
  if (fs.existsSync(configPath)) {
    ui.success('core-config.yaml: found');
  } else {
    ui.error('core-config.yaml: not found');
    allGood = false;
  }

  // 7. Scripts
  const scriptsDir = path.join(projectDir, '.orchestrix-core', 'scripts');
  const expectedScripts = ['start-orchestrix.sh', 'handoff-detector.sh'];
  const foundScripts = expectedScripts.filter((f) => {
    const p = path.join(scriptsDir, f);
    if (!fs.existsSync(p)) return false;
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return true;
    } catch {
      ui.warn(`${f}: exists but not executable (chmod +x)`);
      return false;
    }
  });
  if (foundScripts.length === expectedScripts.length) {
    ui.success(`Scripts: ${foundScripts.length}/${expectedScripts.length} installed + executable`);
  } else {
    ui.warn(`Scripts: ${foundScripts.length}/${expectedScripts.length} ready`);
  }

  // 8. Hooks
  const settingsPath = path.join(projectDir, '.claude', 'settings.local.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const hasHook = settings.hooks?.Stop?.some((entry) =>
        entry.hooks?.some((h) => h.command?.includes('handoff-detector'))
      );
      if (hasHook) {
        ui.success('Hooks: handoff-detector configured');
      } else {
        ui.warn('Hooks: settings.local.json exists but no handoff-detector hook');
      }
    } catch {
      ui.warn('Hooks: settings.local.json invalid JSON');
    }
  } else {
    ui.warn('Hooks: settings.local.json not found');
  }

  // 9. .gitignore
  const gitignorePath = path.join(projectDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (content.includes('.env.local')) {
      ui.success('.gitignore: .env.local covered');
    } else {
      ui.warn('.gitignore: .env.local not listed');
    }
  }

  // Result
  console.log();
  if (allGood) {
    ui.success('All checks passed');
  } else {
    ui.info('Some checks failed — run "npx orchestrix install" to fix');
  }
  console.log();
}

module.exports = { doctor };
