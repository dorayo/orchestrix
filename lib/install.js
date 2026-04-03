'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ui = require('./ui');
const { resolveKey, writeKeyToEnvLocal } = require('./license');
const { mergeMcpJson, mergeSettingsLocal } = require('./merge');
const { validateKey } = require('./mcp-client');
const commands = require('./embedded/commands');
const { CORE_CONFIG_TEMPLATE } = require('./embedded/config');
const scripts = require('./embedded/scripts');

const TOTAL_STEPS = 5;

async function install(flags) {
  ui.banner();
  const projectDir = process.cwd();

  // ────────────────────────────────────────
  // Phase 1: Pre-flight
  // ────────────────────────────────────────
  ui.step(1, TOTAL_STEPS, 'Pre-flight checks');

  // Check Node version
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersion < 18) {
    throw new Error(`Node.js >= 18 required (current: ${process.versions.node})`);
  }

  // Check git repo
  let isGitRepo = false;
  let repoName = path.basename(projectDir);
  try {
    execSync('git rev-parse --show-toplevel', { stdio: 'pipe', cwd: projectDir });
    isGitRepo = true;
    repoName = path.basename(execSync('git rev-parse --show-toplevel', { stdio: 'pipe', cwd: projectDir }).toString().trim());
  } catch {
    ui.warn('Not a git repository — proceeding anyway');
  }

  // Detect existing installation
  const hasExisting = fs.existsSync(path.join(projectDir, '.orchestrix-core'));
  if (hasExisting && !flags.force) {
    ui.info('Existing Orchestrix installation detected — will upgrade');
  }

  ui.success(`Project: ${repoName}`);

  // ────────────────────────────────────────
  // Phase 2: License Key
  // ────────────────────────────────────────
  ui.step(2, TOTAL_STEPS, 'License key');

  let licenseKey;
  if (flags.offline) {
    ui.info('Offline mode — skipping license validation');
    licenseKey = flags.key || process.env.ORCHESTRIX_LICENSE_KEY || '';
  } else {
    licenseKey = await resolveKey(flags);

    // Validate key
    const validation = await validateKey(licenseKey);
    if (validation.valid) {
      ui.success(`License valid (tier: ${validation.tier})`);
    } else {
      ui.warn(`License validation failed: ${validation.error}`);
      ui.info('Continuing with embedded files (offline mode)');
      flags.offline = true;
    }
  }

  // ────────────────────────────────────────
  // Phase 3: Write slash commands
  // ────────────────────────────────────────
  ui.step(3, TOTAL_STEPS, 'Installing files');
  console.log();

  // Ensure directories
  const dirs = [
    path.join(projectDir, '.claude', 'commands'),
    path.join(projectDir, '.orchestrix-core', 'scripts'),
    path.join(projectDir, '.orchestrix-core', 'runtime'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Write slash commands (always overwrite — these are Orchestrix-owned)
  for (const [filename, content] of Object.entries(commands)) {
    const filePath = path.join(projectDir, '.claude', 'commands', filename);
    fs.writeFileSync(filePath, content);
    ui.fileAction(fs.existsSync(filePath) ? 'overwrite' : 'create', `.claude/commands/${filename}`);
  }

  // ────────────────────────────────────────
  // Phase 4: MCP config, scripts, hooks
  // ────────────────────────────────────────

  // .mcp.json
  if (!flags.noMcp) {
    const mcpAction = mergeMcpJson(projectDir);
    ui.fileAction(mcpAction, '.mcp.json');
  } else {
    ui.fileAction('skip', '.mcp.json (--no-mcp)');
  }

  // core-config.yaml (only create if missing)
  const configPath = path.join(projectDir, '.orchestrix-core', 'core-config.yaml');
  if (!fs.existsSync(configPath)) {
    // Substitute placeholders
    let config = CORE_CONFIG_TEMPLATE
      .replace(/\{\{PROJECT_NAME\}\}/g, repoName)
      .replace(/\{\{REPO_ID\}\}/g, repoName)
      .replace(/\{\{TEST_COMMAND\}\}/g, detectTestCommand(projectDir));
    fs.writeFileSync(configPath, config);
    ui.fileAction('create', '.orchestrix-core/core-config.yaml');
  } else {
    ui.fileAction('skip', '.orchestrix-core/core-config.yaml (exists)');
  }

  // tmux scripts (Pro feature, always install from embedded)
  if (!flags.noScripts) {
    try {
      const startScript = scripts.getStartScript();
      const handoffScript = scripts.getHandoffScript();

      const startPath = path.join(projectDir, '.orchestrix-core', 'scripts', 'start-orchestrix.sh');
      const handoffPath = path.join(projectDir, '.orchestrix-core', 'scripts', 'handoff-detector.sh');

      fs.writeFileSync(startPath, startScript);
      fs.chmodSync(startPath, 0o755);
      ui.fileAction('create', '.orchestrix-core/scripts/start-orchestrix.sh');

      fs.writeFileSync(handoffPath, handoffScript);
      fs.chmodSync(handoffPath, 0o755);
      ui.fileAction('create', '.orchestrix-core/scripts/handoff-detector.sh');
    } catch (err) {
      ui.warn(`Scripts: ${err.message}`);
    }
  } else {
    ui.fileAction('skip', '.orchestrix-core/scripts/ (--no-scripts)');
  }

  // Hooks (settings.local.json)
  if (!flags.noHooks) {
    const hookAction = mergeSettingsLocal(projectDir);
    ui.fileAction(hookAction, '.claude/settings.local.json');
  } else {
    ui.fileAction('skip', '.claude/settings.local.json (--no-hooks)');
  }

  // License key to .env.local
  if (licenseKey) {
    const keyAction = writeKeyToEnvLocal(licenseKey);
    ui.fileAction(keyAction, '.env.local');
  }

  // ────────────────────────────────────────
  // Phase 5: Post-install checks
  // ────────────────────────────────────────
  console.log();
  ui.step(5, TOTAL_STEPS, 'Post-install');

  // Check .gitignore
  if (isGitRepo) {
    const gitignorePath = path.join(projectDir, '.gitignore');
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    }

    const missingEntries = [];
    if (!gitignoreContent.includes('.env.local')) {
      missingEntries.push('.env.local');
    }
    if (!gitignoreContent.includes('.orchestrix-core/runtime')) {
      missingEntries.push('.orchestrix-core/runtime/');
    }

    if (missingEntries.length > 0) {
      ui.warn(`Add to .gitignore: ${missingEntries.join(', ')}`);
    } else {
      ui.success('.gitignore covers sensitive files');
    }
  }

  // Summary
  ui.done();

  ui.log('Next steps:');
  ui.log('');
  ui.log('  1. Open this project in Claude Code');
  ui.log('  2. Type /o dev to activate the Developer agent');
  ui.log('  3. Type /o-help to see all available agents');
  ui.log('');
  if (!flags.noScripts) {
    ui.log('  tmux automation (multi-agent):');
    ui.log('  bash .orchestrix-core/scripts/start-orchestrix.sh');
    ui.log('');
  }
  ui.log(`  ${ui.colors.dim}For meta-orchestrator: npx orchestrix-yuri install${ui.colors.reset}`);
  ui.log('');
}

/**
 * Detect test command from project configuration
 */
function detectTestCommand(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts && pkg.scripts.test) {
        return `npm run test`;
      }
    } catch { /* ignore */ }
  }

  // Python
  if (fs.existsSync(path.join(projectDir, 'pyproject.toml'))) {
    return 'pytest';
  }

  // Go
  if (fs.existsSync(path.join(projectDir, 'go.mod'))) {
    return 'go test ./...';
  }

  // Rust
  if (fs.existsSync(path.join(projectDir, 'Cargo.toml'))) {
    return 'cargo test';
  }

  return 'npm run test';
}

module.exports = { install };
