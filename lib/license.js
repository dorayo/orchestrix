'use strict';

const fs = require('fs');
const path = require('path');
const ui = require('./ui');

/**
 * Resolve license key from multiple sources (priority order):
 * 1. --key CLI flag
 * 2. ORCHESTRIX_LICENSE_KEY env var
 * 3. .env.local file in cwd
 * 4. Interactive prompt
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

  // 3. .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const match = content.match(/^ORCHESTRIX_LICENSE_KEY=(.+)$/m);
    if (match) {
      ui.info('Using license key from .env.local');
      return match[1].trim();
    }
  }

  // 4. Interactive prompt
  const key = await ui.prompt('Enter your Orchestrix license key');
  if (!key) {
    throw new Error('License key is required. Use --key <KEY> or set ORCHESTRIX_LICENSE_KEY env var.');
  }
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
