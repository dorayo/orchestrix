'use strict';

const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function log(msg = '') {
  console.log(`  ${msg}`);
}

function success(msg) {
  console.log(`  ${colors.green}✓${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`  ${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`  ${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function header(msg) {
  console.log();
  console.log(`  ${colors.bold}${msg}${colors.reset}`);
  console.log();
}

function step(num, total, msg) {
  console.log(`  ${colors.dim}[${num}/${total}]${colors.reset} ${msg}`);
}

function fileAction(action, filePath) {
  const actionColors = {
    create: colors.green,
    update: colors.yellow,
    merge: colors.cyan,
    skip: colors.gray,
    overwrite: colors.yellow,
  };
  const c = actionColors[action] || colors.reset;
  console.log(`  ${c}${action.padEnd(10)}${colors.reset} ${filePath}`);
}

async function prompt(question, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const suffix = defaultValue ? ` (${defaultValue})` : '';

  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

async function confirm(question, defaultYes = false) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = await prompt(`${question} ${hint}`);
  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

function banner() {
  console.log();
  console.log(`  ${colors.magenta}${colors.bold}orchestrix${colors.reset} ${colors.dim}— Orchestrix Installer${colors.reset}`);
  console.log();
}

function done() {
  console.log();
  console.log(`  ${colors.green}${colors.bold}Done!${colors.reset}`);
  console.log();
}

module.exports = {
  colors,
  log,
  success,
  warn,
  error,
  info,
  header,
  step,
  fileAction,
  prompt,
  confirm,
  banner,
  done,
};
