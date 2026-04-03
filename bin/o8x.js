#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const command = args[0];
const flags = parseFlags(args.slice(1));

function parseFlags(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--key' && i + 1 < argv.length) {
      result.key = argv[++i];
    } else if (arg === '--offline') {
      result.offline = true;
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--no-hooks') {
      result.noHooks = true;
    } else if (arg === '--no-scripts') {
      result.noScripts = true;
    } else if (arg === '--no-mcp') {
      result.noMcp = true;
    } else if (arg === '--yes' || arg === '-y') {
      result.yes = true;
    } else {
      result._.push(arg);
    }
  }
  return result;
}

async function main() {
  if (command === 'install' || command === 'i') {
    const { install } = require('../lib/install');
    await install(flags);
  } else if (command === 'doctor' || command === 'dr') {
    const { doctor } = require('../lib/doctor');
    await doctor(flags);
  } else if (command === 'upgrade' || command === 'up') {
    const { upgrade } = require('../lib/upgrade');
    await upgrade(flags);
  } else if (command === 'uninstall' || command === 'rm') {
    const { uninstall } = require('../lib/uninstall');
    await uninstall(flags);
  } else if (command === '--version' || command === '-v' || command === '-V') {
    const { version } = require('../package.json');
    console.log(version);
  } else if (command === '--help' || command === '-h' || !command) {
    printHelp();
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "o8x --help" for usage information.');
    process.exit(1);
  }
}

function printHelp() {
  const { version } = require('../package.json');
  console.log(`
  orchestrix v${version} — Install Orchestrix multi-agent infrastructure

  Usage:
    npx orchestrix install [options]       Install into current project
    npx orchestrix doctor                  Check installation health
    npx orchestrix upgrade                 Upgrade to latest from MCP server
    npx orchestrix uninstall               Remove Orchestrix files from project
    npx orchestrix --version               Show version
    npx orchestrix --help                  Show this help message

  Install options:
    --key <KEY>          License key (skips interactive prompt)
    --offline            Use embedded files only (no MCP fetch)
    --force              Overwrite all files without confirmation
    --no-hooks           Skip Stop hook installation
    --no-scripts         Skip tmux scripts installation
    --no-mcp             Skip .mcp.json modification
    -y, --yes            Skip confirmations

  Examples:
    npx orchestrix install                           Interactive install
    npx orchestrix install --key orch_live_xxx       Install with key
    npx orchestrix install --offline                 Offline install (embedded files)
    npx orchestrix doctor                            Health check
  `);
}

main().catch((err) => {
  console.error(`\n  Error: ${err.message}`);
  process.exit(1);
});
