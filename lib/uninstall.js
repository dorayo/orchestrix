'use strict';

const fs = require('fs');
const path = require('path');
const ui = require('./ui');
const { removeFromMcpJson, removeFromSettingsLocal } = require('./merge');

async function uninstall(flags) {
  ui.banner();
  ui.header('Uninstalling Orchestrix');

  const projectDir = process.cwd();

  // 1. Remove slash commands
  const commandsDir = path.join(projectDir, '.claude', 'commands');
  const commandFiles = ['o.md', 'o-help.md', 'o-status.md'];
  for (const f of commandFiles) {
    const p = path.join(commandsDir, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      ui.fileAction('remove', `.claude/commands/${f}`);
    }
  }

  // 2. Remove from .mcp.json
  if (removeFromMcpJson(projectDir)) {
    ui.fileAction('update', '.mcp.json (removed orchestrix entries)');
  }

  // 3. Remove handoff hook from settings.local.json
  if (removeFromSettingsLocal(projectDir)) {
    ui.fileAction('update', '.claude/settings.local.json (removed hook)');
  }

  // 4. Remove .orchestrix-core (ask unless --force or --yes)
  const orchestrixDir = path.join(projectDir, '.orchestrix-core');
  if (fs.existsSync(orchestrixDir)) {
    let shouldRemove = flags.force || flags.yes;
    if (!shouldRemove) {
      shouldRemove = await ui.confirm('Remove .orchestrix-core/ (includes project config)?', false);
    }

    if (shouldRemove) {
      fs.rmSync(orchestrixDir, { recursive: true, force: true });
      ui.fileAction('remove', '.orchestrix-core/');
    } else {
      ui.fileAction('skip', '.orchestrix-core/ (preserved)');
    }
  }

  // Note: We do NOT remove .env.local or ORCHESTRIX_LICENSE_KEY from it
  ui.info('.env.local preserved (manage license key manually)');

  ui.done();
}

module.exports = { uninstall };
