#!/usr/bin/env node

/**
 * Test script to verify Claude Code subagent frontmatter fix
 * 
 * This script:
 * 1. Reinstalls orchestrix in the modern-saas-boilerplate directory
 * 2. Compares generated subagent files with the expected format
 * 3. Reports any issues found
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const TARGET_DIR = path.resolve(__dirname, '../../modern-saas-boilerplate');
const AGENTS_DIR = path.join(TARGET_DIR, '.claude', 'agents');

// Expected frontmatter fields for Claude Code
const REQUIRED_FIELDS = ['name', 'description'];
const OPTIONAL_FIELDS = ['model', 'color'];

// Test agents to check
const TEST_AGENTS = ['sm', 'dev', 'architect', 'qa'];

async function main() {
  console.log(chalk.blue('\n🧪 Testing Claude Code Subagent Fix\n'));
  
  // Step 1: Reinstall orchestrix
  console.log(chalk.yellow('📦 Reinstalling orchestrix in target directory...'));
  try {
    execSync(`cd "${TARGET_DIR}" && orchestrix install --ide claude-code --skip-confirmation`, {
      stdio: 'inherit'
    });
    console.log(chalk.green('✓ Installation complete\n'));
  } catch (error) {
    console.error(chalk.red('✗ Installation failed:'), error.message);
    process.exit(1);
  }
  
  // Step 2: Check generated files
  console.log(chalk.yellow('🔍 Checking generated subagent files...\n'));
  
  let allPassed = true;
  
  for (const agentId of TEST_AGENTS) {
    const agentPath = path.join(AGENTS_DIR, `${agentId}.md`);
    
    console.log(chalk.dim(`Checking ${agentId}.md...`));
    
    if (!fs.existsSync(agentPath)) {
      console.log(chalk.red(`  ✗ File not found: ${agentPath}`));
      allPassed = false;
      continue;
    }
    
    const content = fs.readFileSync(agentPath, 'utf-8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.log(chalk.red(`  ✗ No frontmatter found`));
      allPassed = false;
      continue;
    }
    
    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    const fields = {};
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        fields[match[1]] = match[2];
      }
    }
    
    // Check required fields
    let agentPassed = true;
    for (const field of REQUIRED_FIELDS) {
      if (!fields[field]) {
        console.log(chalk.red(`  ✗ Missing required field: ${field}`));
        agentPassed = false;
        allPassed = false;
      }
    }
    
    // Check for old fields that should NOT exist
    const OLD_FIELDS = ['ID', 'Icon', 'When To Use', 'Tools', 'Persona', 'Style', 'Identity', 'Focus'];
    for (const oldField of OLD_FIELDS) {
      if (fields[oldField]) {
        console.log(chalk.red(`  ✗ Found old field that should be removed: ${oldField}`));
        agentPassed = false;
        allPassed = false;
      }
    }
    
    if (agentPassed) {
      console.log(chalk.green(`  ✓ ${agentId}.md has correct frontmatter format`));
      console.log(chalk.dim(`    - name: ${fields.name}`));
      console.log(chalk.dim(`    - description: ${fields.description?.substring(0, 50)}...`));
      if (fields.model) console.log(chalk.dim(`    - model: ${fields.model}`));
      if (fields.color) console.log(chalk.dim(`    - color: ${fields.color}`));
    }
    
    console.log('');
  }
  
  // Step 3: Compare with manual file
  console.log(chalk.yellow('📋 Comparing with manually created file...\n'));
  const manualFilePath = path.join(AGENTS_DIR, 'deployment-orchestrator.md');
  
  if (fs.existsSync(manualFilePath)) {
    const manualContent = fs.readFileSync(manualFilePath, 'utf-8');
    const manualFrontmatter = manualContent.match(/^---\n([\s\S]*?)\n---/);
    
    if (manualFrontmatter) {
      console.log(chalk.dim('Manual file frontmatter format:'));
      console.log(chalk.dim(manualFrontmatter[1]));
      console.log('');
    }
  }
  
  // Final report
  console.log(chalk.blue('━'.repeat(60)));
  if (allPassed) {
    console.log(chalk.green('\n✅ All tests passed! Claude Code subagents should now be recognized.\n'));
    console.log(chalk.dim('Next steps:'));
    console.log(chalk.dim('1. Restart Claude Code'));
    console.log(chalk.dim('2. Check if subagents appear in the agent selector'));
  } else {
    console.log(chalk.red('\n❌ Some tests failed. Please review the errors above.\n'));
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
