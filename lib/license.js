'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const ui = require('./ui');

// License key format: orch_{tier}_{identifier}
// Examples: orch_live_xxx, orch_trial_xxx, ORCH-TEAM-xxx
const KEY_PATTERN = /^(orch_[a-z]+_[\w]+|ORCH-[A-Z]+-[\w-]+)$/;

function isValidKeyFormat(key) {
  return KEY_PATTERN.test(key);
}

/**
 * Resolve license key from multiple sources (priority order):
 * 1. --key CLI flag
 * 2. ORCHESTRIX_LICENSE_KEY env var
 * 3. .orchestrix-key hidden file (project dir → home dir)
 * 4. .env.local file in cwd
 * 5. Interactive prompt (saves to .orchestrix-key for next time)
 */
async function resolveKey(flags) {
  // 1. CLI flag
  if (flags.key) {
    return flags.key;
  }

  // 2. Environment variable
  if (process.env.ORCHESTRIX_LICENSE_KEY) {
    ui.info('Using license key from ORCHESTRIX_LICENSE_KEY env var');
    return process.env.ORCHESTRIX_LICENSE_KEY;
  }

  // 3. .orchestrix-key hidden file (project dir first, then home dir)
  const keyLocations = [
    path.join(process.cwd(), '.orchestrix-key'),
    path.join(os.homedir(), '.orchestrix-key'),
  ];
  for (const keyPath of keyLocations) {
    if (fs.existsSync(keyPath)) {
      const raw = fs.readFileSync(keyPath, 'utf-8').trim();
      if (raw && isValidKeyFormat(raw)) {
        const rel = keyPath.startsWith(process.cwd()) ? '.orchestrix-key' : '~/.orchestrix-key';
        ui.info(`Using license key from ${rel}`);
        return raw;
      }
    }
  }

  // 4. .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const match = content.match(/^ORCHESTRIX_LICENSE_KEY=(.+)$/m);
    if (match) {
      ui.info('Using license key from .env.local');
      return match[1].trim();
    }
  }

  // 5. Interactive prompt
  const key = await ui.prompt('Enter your Orchestrix license key');
  if (!key) {
    throw new Error('License key is required. Use --key <KEY> or set ORCHESTRIX_LICENSE_KEY env var.');
  }

  // Save to ~/.orchestrix-key for future use
  const globalKeyPath = path.join(os.homedir(), '.orchestrix-key');
  fs.writeFileSync(globalKeyPath, key + '\n', { mode: 0o600 });
  ui.success(`License key saved to ~/.orchestrix-key`);

  return key;
}

/**
 * Write license key to .env.local (append if file exists, create if not)
 */
function writeKeyToEnvLocal(key) {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  let content = '';

  if (fs.existsSync(envLocalPath)) {
    content = fs.readFileSync(envLocalPath, 'utf-8');

    // Check if key already exists
    if (content.match(/^ORCHESTRIX_LICENSE_KEY=/m)) {
      const existingMatch = content.match(/^ORCHESTRIX_LICENSE_KEY=(.+)$/m);
      if (existingMatch && existingMatch[1].trim() === key) {
        return 'skip'; // Same key, no change needed
      }
      ui.warn('ORCHESTRIX_LICENSE_KEY already exists in .env.local with a different value');
      ui.warn('Please update it manually if needed');
      return 'skip';
    }

    // Append with newline separator
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content += `ORCHESTRIX_LICENSE_KEY=${key}\n`;
  } else {
    content = `ORCHESTRIX_LICENSE_KEY=${key}\n`;
  }

  fs.writeFileSync(envLocalPath, content);
  return fs.existsSync(envLocalPath) ? 'update' : 'create';
}

module.exports = { resolveKey, writeKeyToEnvLocal };
