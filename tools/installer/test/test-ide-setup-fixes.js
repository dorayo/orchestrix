/**
 * Test file for IDE setup bug fixes
 * Run with: node test-ide-setup-fixes.js
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

// Import the modules we need to test
const ideSetup = require('../lib/ide-setup');
const { extractYamlFromAgent } = require('../../lib/yaml-utils');

class IdeSetupTester {
  constructor() {
    this.testResults = [];
    this.testCount = 0;
    this.passCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  assert(condition, testName, errorMessage = '') {
    this.testCount++;
    if (condition) {
      this.passCount++;
      this.log(`PASS: ${testName}`, 'success');
      this.testResults.push({ name: testName, status: 'PASS' });
    } else {
      this.log(`FAIL: ${testName} - ${errorMessage}`, 'error');
      this.testResults.push({ name: testName, status: 'FAIL', error: errorMessage });
    }
  }

  // Test 1: YAML 提取一致性测试
  testYamlExtractionConsistency() {
    this.log('Testing YAML extraction consistency...');
    
    const testContent = {
      withCRLF: "# Test Agent\n\n```yaml\r\nagent:\r\n  name: test\r\n```",
      withLF: "# Test Agent\n\n```yaml\nagent:\n  name: test\n```",
      withSpaces: "# Test Agent\n\n```yaml   \nagent:\n  name: test\n  ```",
      withYml: "# Test Agent\n\n```yml\nagent:\n  name: test\n```"
    };

    // Test different line ending formats
    const result1 = extractYamlFromAgent(testContent.withCRLF);
    const result2 = extractYamlFromAgent(testContent.withLF);
    
    this.assert(
      result1 && result2 && result1.includes('agent:') && result2.includes('agent:'),
      'YAML extraction handles different line endings',
      `CRLF result: ${result1}, LF result: ${result2}`
    );

    // Test with spaces
    const result3 = extractYamlFromAgent(testContent.withSpaces);
    this.assert(
      result3 && result3.includes('agent:'),
      'YAML extraction handles whitespace variations',
      `Spaces result: ${result3}`
    );

    // Test yml extension
    const result4 = extractYamlFromAgent(testContent.withYml);
    this.assert(
      result4 && result4.includes('agent:'),
      'YAML extraction supports yml extension',
      `Yml result: ${result4}`
    );
  }

  // Test 2: 元数据安全访问测试
  testMetadataSafeAccess() {
    this.log('Testing metadata safe access...');
    
    const ideSetupInstance = new ideSetup.IdeSetup();
    
    // Test with empty YAML
    const emptyContent = "# Test Agent\n\nNo YAML here";
    const metadata = ideSetupInstance.extractAgentMetadataRobust(emptyContent, 'test');
    
    this.assert(
      metadata && metadata.agent && metadata.persona,
      'Default metadata structure created for empty YAML',
      `Metadata: ${JSON.stringify(metadata, null, 2)}`
    );

    this.assert(
      metadata.name && metadata.title && metadata.role,
      'Safe fallback values provided',
      `Name: ${metadata.name}, Title: ${metadata.title}, Role: ${metadata.role}`
    );
  }

  // Test 3: 路径替换测试
  testPathReplacement() {
    this.log('Testing smart path replacement...');
    
    const ideSetupInstance = new ideSetup.IdeSetup();
    
    const testContent = 'Load {root}/tasks/test.md and {root}/data/config.yaml';
    
    // Test core package replacement
    const coreResult = ideSetupInstance.smartPathReplacement(testContent, 'core', '.orchestrix-core');
    this.assert(
      coreResult === 'Load .orchestrix-core/tasks/test.md and .orchestrix-core/data/config.yaml',
      'Core package path replacement works correctly',
      `Core result: ${coreResult}`
    );

    // Test expansion package replacement
    const expansionResult = ideSetupInstance.smartPathReplacement(testContent, 'expansion', '.game-dev');
    this.assert(
      expansionResult.includes('.orchestrix-core/tasks/') && expansionResult.includes('.game-dev/data/'),
      'Expansion package preserves core dependencies',
      `Expansion result: ${expansionResult}`
    );
  }

  // Test 4: 占位符默认值测试
  testPlaceholderDefaults() {
    this.log('Testing placeholder defaults...');
    
    const ideSetupInstance = new ideSetup.IdeSetup();
    const defaults = ideSetupInstance.getPlaceholderDefaults('testAgent');
    
    this.assert(
      defaults['{AGENT_TITLE}'] === 'TestAgent',
      'Agent title default generated correctly',
      `Title: ${defaults['{AGENT_TITLE}']}`
    );

    this.assert(
      defaults['{COMPLETE_TOOLS_LIST}'] && defaults['{COMPLETE_TOOLS_LIST}'].length > 0,
      'Tools list default provided',
      `Tools: ${defaults['{COMPLETE_TOOLS_LIST}']}`
    );

    this.assert(
      Object.keys(defaults).length > 10,
      'Comprehensive default values provided',
      `Defaults count: ${Object.keys(defaults).length}`
    );
  }

  // Test 5: 模板依赖性测试
  async testTemplateDependency() {
    this.log('Testing template dependency handling...');
    
    const ideSetupInstance = new ideSetup.IdeSetup();
    const nonExistentPath = '/tmp/non-existent-template.md';
    
    try {
      // This should not throw an error but handle gracefully
      await ideSetupInstance.ensureTemplateExists(nonExistentPath);
      this.assert(true, 'Template dependency handled gracefully');
    } catch (error) {
      this.assert(false, 'Template dependency handling', error.message);
    }
  }

  // Test 6: 路径解析器测试
  testPathResolver() {
    this.log('Testing path resolver...');
    
    const ideSetupInstance = new ideSetup.IdeSetup();
    const resolver = ideSetupInstance.createPathResolver('/test', 'core', '.orchestrix-core');
    
    this.assert(
      typeof resolver.resolveAgentPath === 'function',
      'Path resolver has agent path method'
    );

    this.assert(
      typeof resolver.resolveTaskPath === 'function',
      'Path resolver has task path method'
    );

    this.assert(
      typeof resolver.resolveDependencyPath === 'function',
      'Path resolver has dependency path method'
    );

    const agentPath = resolver.resolveAgentPath('test');
    this.assert(
      agentPath.includes('.orchestrix-core/agents/test') && (agentPath.endsWith('.yaml') || agentPath.endsWith('.md')),
      'Agent path resolved correctly with YAML or MD extension',
      `Agent path: ${agentPath}`
    );
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting IDE Setup Bug Fix Tests...');
    
    try {
      this.testYamlExtractionConsistency();
      this.testMetadataSafeAccess();
      this.testPathReplacement();
      this.testPlaceholderDefaults();
      await this.testTemplateDependency();
      this.testPathResolver();
      
      this.log(`\n=== TEST SUMMARY ===`);
      this.log(`Total Tests: ${this.testCount}`);
      this.log(`Passed: ${this.passCount}`);
      this.log(`Failed: ${this.testCount - this.passCount}`);
      this.log(`Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`);
      
      if (this.passCount === this.testCount) {
        this.log('🎉 All tests passed!', 'success');
        return true;
      } else {
        this.log('❌ Some tests failed. Check the details above.', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IdeSetupTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = IdeSetupTester;
