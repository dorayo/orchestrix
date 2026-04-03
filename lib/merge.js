'use strict';

const fs = require('fs');
const path = require('path');

const MCP_SERVER_URL = 'https://orchestrix-mcp.youlidao.ai/api/mcp';

/**
 * Deep merge .mcp.json — preserves existing entries, adds/updates orchestrix
 * Returns: 'create' | 'update' | 'skip'
 */
function mergeMcpJson(projectDir) {
  const filePath = path.join(projectDir, '.mcp.json');
  let existing = {};

  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      // Invalid JSON, start fresh but warn
      existing = {};
    }
  }

  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  let changed = false;

  // Add/update orchestrix entry
  const orchestrixEntry = {
    type: 'http',
    url: MCP_SERVER_URL,
    headers: {
      Authorization: 'Bearer ${ORCHESTRIX_LICENSE_KEY}',
    },
  };

  const existingOrchestrix = existing.mcpServers.orchestrix;
  if (!existingOrchestrix) {
    existing.mcpServers.orchestrix = orchestrixEntry;
    changed = true;
  } else {
    // Always ensure URL, type, and headers are up to date
    const needsUpdate =
      existingOrchestrix.url !== orchestrixEntry.url ||
      existingOrchestrix.type !== orchestrixEntry.type ||
      existingOrchestrix.headers?.Authorization !== orchestrixEntry.headers.Authorization;

    if (needsUpdate) {
      existing.mcpServers.orchestrix = { ...existingOrchestrix, ...orchestrixEntry };
      changed = true;
    }
  }

  // Add sequential-thinking if not present (don't overwrite)
  if (!existing.mcpServers['sequential-thinking']) {
    existing.mcpServers['sequential-thinking'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    };
    changed = true;
  }

  if (!changed) {
    return 'skip';
  }

  const action = fs.existsSync(filePath) ? 'update' : 'create';
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
  return action;
}

/**
 * Merge handoff-detector hook into .claude/settings.local.json
 * Returns: 'create' | 'update' | 'skip'
 */
function mergeSettingsLocal(projectDir) {
  const filePath = path.join(projectDir, '.claude', 'settings.local.json');
  let existing = {};

  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      existing = {};
    }
  }

  if (!existing.hooks) {
    existing.hooks = {};
  }
  if (!existing.hooks.Stop) {
    existing.hooks.Stop = [];
  }

  // Check if handoff-detector hook already exists
  const hookCommand = "bash -c 'cd \"$(git rev-parse --show-toplevel)\" && .orchestrix-core/scripts/handoff-detector.sh'";
  const hasHook = existing.hooks.Stop.some((entry) => {
    if (!entry || !entry.hooks) return false;
    return entry.hooks.some((h) => h.command && h.command.includes('handoff-detector'));
  });

  if (hasHook) {
    return 'skip';
  }

  existing.hooks.Stop.push({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: hookCommand,
      },
    ],
  });

  const action = fs.existsSync(filePath) ? 'update' : 'create';

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
  return action;
}

/**
 * Remove orchestrix entry from .mcp.json (for uninstall)
 * Returns: true if file was modified
 */
function removeFromMcpJson(projectDir) {
  const filePath = path.join(projectDir, '.mcp.json');
  if (!fs.existsSync(filePath)) return false;

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!existing.mcpServers || !existing.mcpServers.orchestrix) return false;

    delete existing.mcpServers.orchestrix;
    // Also remove sequential-thinking if we added it
    delete existing.mcpServers['sequential-thinking'];

    // If mcpServers is now empty, remove the whole file
    if (Object.keys(existing.mcpServers).length === 0 && Object.keys(existing).length === 1) {
      fs.unlinkSync(filePath);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove handoff-detector hook from settings.local.json (for uninstall)
 * Returns: true if file was modified
 */
function removeFromSettingsLocal(projectDir) {
  const filePath = path.join(projectDir, '.claude', 'settings.local.json');
  if (!fs.existsSync(filePath)) return false;

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!existing.hooks || !existing.hooks.Stop) return false;

    const before = existing.hooks.Stop.length;
    existing.hooks.Stop = existing.hooks.Stop.filter((entry) => {
      if (!entry || !entry.hooks) return true;
      return !entry.hooks.some((h) => h.command && h.command.includes('handoff-detector'));
    });

    if (existing.hooks.Stop.length === before) return false;

    // Clean up empty structures
    if (existing.hooks.Stop.length === 0) {
      delete existing.hooks.Stop;
    }
    if (Object.keys(existing.hooks).length === 0) {
      delete existing.hooks;
    }

    if (Object.keys(existing).length === 0) {
      fs.unlinkSync(filePath);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  mergeMcpJson,
  mergeSettingsLocal,
  removeFromMcpJson,
  removeFromSettingsLocal,
  MCP_SERVER_URL,
};
