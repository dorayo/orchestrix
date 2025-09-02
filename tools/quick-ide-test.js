#!/usr/bin/env node

/**
 * Quick IDE Installation Test Script
 * Usage: node quick-ide-test.js [test-directory]
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const os = require('os');

// Simple color functions
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`
};

class QuickIdeTestRunner {
  constructor(testDir = null) {
    this.testDir = testDir || path.join(os.homedir(), `orchestrix-test-${Date.now()}`);
    this.orchestrixPath = path.join(__dirname, '..');
    this.results = {
      successes: [],
      failures: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const prefix = {
      error: colors.red('❌'),
      success: colors.green('✅'),
      warning: colors.yellow('⚠️'),
      info: colors.blue('ℹ️'),
      step: colors.bold('📋')
    }[type];
    
    console.log(`${prefix} ${message}`);
  }

  async setupTestEnvironment() {
    this.log(`Setting up test environment in: ${this.testDir}`, 'step');
    
    try {
      // Create test directory
      await fs.ensureDir(this.testDir);
      
      // Change to test directory
      process.chdir(this.testDir);
      
      // Create package.json for better npm handling
      const packageJson = {
        name: 'orchestrix-test',
        version: '1.0.0',
        private: true
      };
      
      await fs.writeJson(path.join(this.testDir, 'package.json'), packageJson, { spaces: 2 });
      
      this.log('Test environment ready', 'success');
      return true;
      
    } catch (error) {
      this.log(`Failed to setup test environment: ${error.message}`, 'error');
      return false;
    }
  }

  async testIdeInstallation(ide, agent = null) {
    this.log(`Testing ${ide} installation${agent ? ` with agent ${agent}` : ''}...`, 'step');
    
    try {
      // Clean any existing installation
      await this.cleanInstallation();
      
      // Build install command using local development version
      const localInstallerPath = path.join(this.orchestrixPath, 'tools/installer/bin/orchestrix.js');
      const installCmd = `node "${localInstallerPath}" install --ide ${ide}${agent ? ` --agent ${agent}` : ''}`;
      
      this.log(`Running: ${installCmd}`, 'info');
      this.log(`Using local installer from: ${localInstallerPath}`, 'info');
      
      // Execute installation
      const result = execSync(installCmd, {
        cwd: this.testDir,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 60000 // 60 second timeout
      });
      
      this.log(`Installation completed for ${ide}`, 'success');
      
      // Verify installation
      const verification = await this.verifyInstallation(ide, agent);
      
      return verification;
      
    } catch (error) {
      this.log(`Installation failed for ${ide}: ${error.message}`, 'error');
      this.results.failures.push(`${ide} installation failed`);
      return false;
    }
  }

  async verifyInstallation(ide, agent = null) {
    this.log(`Verifying ${ide} installation...`, 'step');
    
    const checks = [];
    
    try {
      // Check basic structure
      const coreExists = await fs.pathExists('.orchestrix-core');
      checks.push({ name: 'Core directory exists', passed: coreExists });
      
      if (ide === 'claude-code') {
        // Check Claude Code specific files
        const claudeExists = await fs.pathExists('.claude');
        const subagentsExist = await fs.pathExists('.claude/agents');
        const commandsExist = await fs.pathExists('.claude/commands');
        
        checks.push({ name: 'Claude directory exists', passed: claudeExists });
        checks.push({ name: 'SubAgents directory exists', passed: subagentsExist });
        checks.push({ name: 'Commands directory exists', passed: commandsExist });
        
        // Check specific agent files if agent specified
        if (agent) {
          const subagentFile = await fs.pathExists(`.claude/agents/${agent}.md`);
          const commandFile = await fs.pathExists(`.claude/commands/core/agents/${agent}.md`);
          
          checks.push({ name: `SubAgent file for ${agent}`, passed: subagentFile });
          checks.push({ name: `Command file for ${agent}`, passed: commandFile });
          
          // Check file content quality
          if (subagentFile) {
            const content = await fs.readFile(`.claude/agents/${agent}.md`, 'utf8');
            const hasYamlFrontmatter = content.includes('---\nname:');
            const hasDescription = content.includes('description:');
            const hasUnreplacedPlaceholders = /{[A-Z_]+}/.test(content);
            
            checks.push({ name: `${agent} SubAgent has YAML frontmatter`, passed: hasYamlFrontmatter });
            checks.push({ name: `${agent} SubAgent has description`, passed: hasDescription });
            checks.push({ name: `${agent} SubAgent has no unreplaced placeholders`, passed: !hasUnreplacedPlaceholders });
          }
        }
        
      } else if (ide === 'cursor') {
        // Check Cursor specific files
        const cursorExists = await fs.pathExists('.cursor');
        const rulesExist = await fs.pathExists('.cursor/rules');
        
        checks.push({ name: 'Cursor directory exists', passed: cursorExists });
        checks.push({ name: 'Rules directory exists', passed: rulesExist });
        
        // Check specific agent files if agent specified
        if (agent) {
          const mdcFile = await fs.pathExists(`.cursor/rules/${agent}.mdc`);
          checks.push({ name: `MDC file for ${agent}`, passed: mdcFile });
          
          // Check MDC file content quality
          if (mdcFile) {
            const content = await fs.readFile(`.cursor/rules/${agent}.mdc`, 'utf8');
            const hasDescription = content.includes('description:') && !content.includes('description: \n');
            const hasGlobs = content.includes('globs: []');
            const hasYamlContent = content.includes('```yaml') && content.includes('agent:');
            
            checks.push({ name: `${agent} MDC has description`, passed: hasDescription });
            checks.push({ name: `${agent} MDC has proper globs`, passed: hasGlobs });
            checks.push({ name: `${agent} MDC has YAML content`, passed: hasYamlContent });
          }
        }
      }
      
      // Count agents/files created
      if (ide === 'claude-code' && await fs.pathExists('.claude/agents')) {
        const subagentFiles = await fs.readdir('.claude/agents');
        const subagentCount = subagentFiles.filter(f => f.endsWith('.md')).length;
        this.log(`Created ${subagentCount} SubAgent files`, 'info');
      }
      
      if (ide === 'cursor' && await fs.pathExists('.cursor/rules')) {
        const ruleFiles = await fs.readdir('.cursor/rules');
        const ruleCount = ruleFiles.filter(f => f.endsWith('.mdc')).length;
        this.log(`Created ${ruleCount} rule files`, 'info');
      }
      
      // Report check results
      const passedChecks = checks.filter(c => c.passed).length;
      const totalChecks = checks.length;
      
      this.log(`Verification: ${passedChecks}/${totalChecks} checks passed`, 'info');
      
      checks.forEach(check => {
        if (check.passed) {
          this.log(`${check.name}`, 'success');
        } else {
          this.log(`${check.name}`, 'error');
        }
      });
      
      if (passedChecks === totalChecks) {
        this.results.successes.push(`${ide} verification passed (${passedChecks}/${totalChecks})`);
        return true;
      } else {
        this.results.failures.push(`${ide} verification failed (${passedChecks}/${totalChecks})`);
        return false;
      }
      
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      this.results.failures.push(`${ide} verification error`);
      return false;
    }
  }

  async cleanInstallation() {
    const directories = ['.claude', '.cursor', '.windsurf', '.orchestrix-core'];
    
    for (const dir of directories) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    }
  }

  async runQuickTest() {
    console.log(colors.bold(colors.blue('🚀 Orchestrix Quick IDE Test Runner\n')));
    
    // Setup test environment
    if (!(await this.setupTestEnvironment())) {
      return false;
    }
    
    // Test scenarios
    const testScenarios = [
      { ide: 'claude-code', agent: null, description: 'Claude Code (全部 agents)' },
      { ide: 'claude-code', agent: 'dev', description: 'Claude Code (dev agent)' },
      { ide: 'cursor', agent: 'dev', description: 'Cursor (dev agent)' },
      { ide: 'cursor', agent: null, description: 'Cursor (全部 agents)' }
    ];
    
    for (const scenario of testScenarios) {
      this.log(`\n${'='.repeat(60)}`, 'info');
      this.log(`Testing: ${scenario.description}`, 'step');
      this.log(`${'='.repeat(60)}`, 'info');
      
      await this.testIdeInstallation(scenario.ide, scenario.agent);
    }
    
    // Print summary
    this.printSummary();
    
    return this.results.failures.length === 0;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(colors.bold('TEST SUMMARY'));
    console.log('='.repeat(60));

    if (this.results.successes.length > 0) {
      console.log(colors.green('\n✅ SUCCESSES:'));
      this.results.successes.forEach(success => {
        console.log(colors.green(`   • ${success}`));
      });
    }

    if (this.results.warnings.length > 0) {
      console.log(colors.yellow('\n⚠️  WARNINGS:'));
      this.results.warnings.forEach(warning => {
        console.log(colors.yellow(`   • ${warning}`));
      });
    }

    if (this.results.failures.length > 0) {
      console.log(colors.red('\n❌ FAILURES:'));
      this.results.failures.forEach(failure => {
        console.log(colors.red(`   • ${failure}`));
      });
    }

    const total = this.results.successes.length + this.results.failures.length + this.results.warnings.length;
    const successRate = total > 0 ? ((this.results.successes.length / total) * 100).toFixed(1) : 0;

    console.log(`\n📊 RESULTS: ${this.results.successes.length}/${total} tests passed (${successRate}%)`);
    console.log(colors.dim(`Test directory: ${this.testDir}`));

    if (this.results.failures.length === 0) {
      console.log(colors.green('\n🎉 All tests passed! Your IDE bug fixes are working correctly.'));
    } else {
      console.log(colors.red('\n💥 Some tests failed. Check the details above.'));
    }
  }

  async cleanup() {
    if (await fs.pathExists(this.testDir)) {
      this.log(`Cleaning up test directory: ${this.testDir}`, 'info');
      await fs.remove(this.testDir);
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let testDir = null;
  
  if (args.length > 0 && !args[0].startsWith('-')) {
    testDir = path.resolve(args[0]);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node quick-ide-test.js [test-directory] [options]

Arguments:
  test-directory   Directory to run tests in (default: ~/orchestrix-test-[timestamp])

Options:
  --help, -h       Show this help message
  --no-cleanup     Don't delete test directory after completion

Examples:
  node quick-ide-test.js
  node quick-ide-test.js ~/my-test-dir
  node quick-ide-test.js --no-cleanup
`);
    process.exit(0);
  }
  
  return {
    testDir,
    cleanup: !args.includes('--no-cleanup')
  };
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const runner = new QuickIdeTestRunner(options.testDir);
  
  runner.runQuickTest().then(success => {
    if (options.cleanup) {
      return runner.cleanup().then(() => success);
    }
    return success;
  }).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(colors.red(`Test failed: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = QuickIdeTestRunner;
