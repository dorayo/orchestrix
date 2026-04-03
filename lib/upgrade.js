'use strict';

const ui = require('./ui');
const { install } = require('./install');

/**
 * Upgrade is just a force re-install that preserves core-config.yaml
 * (install already skips core-config.yaml if it exists)
 */
async function upgrade(flags) {
  ui.banner();
  ui.info('Upgrading Orchestrix installation...');
  console.log();

  // Re-run install with force flag
  await install({ ...flags, force: true });
}

module.exports = { upgrade };
