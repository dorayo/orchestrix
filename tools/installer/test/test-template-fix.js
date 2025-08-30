const fs = require('fs').promises;
const path = require('path');
const IdeSetup = require('../lib/ide-setup');

async function testTemplateFix() {
  console.log('Testing template fix...');
  
  try {
    // 读取dev agent文件进行测试
    const agentPath = path.join(__dirname, '..', '..', '..', 'orchestrix-core', 'agents', 'dev.md');
    const agentContent = await fs.readFile(agentPath, 'utf8');
    
    console.log('✓ Agent content loaded');
    
    // 测试enhanced template生成
    const ideSetup = IdeSetup;
    const result = await ideSetup.generateEnhancedSubagentContent('dev', agentContent, '/tmp');
    
    console.log('✓ Enhanced template generated');
    
    // 检查关键占位符是否被正确替换
    const checks = [
      { placeholder: '{AGENT_ID}', shouldNotExist: true, description: 'AGENT_ID placeholder should be replaced' },
      { placeholder: '{COMPLETE_TOOLS_LIST}', shouldNotExist: true, description: 'COMPLETE_TOOLS_LIST placeholder should be replaced' },
      { placeholder: 'name: dev', shouldExist: true, description: 'Agent name should be replaced' },
      { placeholder: 'tools: Read, Edit, MultiEdit, Write, Bash, WebSearch', shouldExist: true, description: 'Tools list should be replaced' }
    ];
    
    let allPassed = true;
    for (const check of checks) {
      const exists = result.includes(check.placeholder);
      const passed = check.shouldNotExist ? !exists : exists;
      
      if (passed) {
        console.log(`✓ ${check.description}`);
      } else {
        console.log(`✗ ${check.description}`);
        allPassed = false;
      }
    }
    
    // 检查缩进问题
    const lines = result.split('\n');
    const initLine = lines.findIndex(line => line.includes('When invoked, IMMEDIATELY:'));
    if (initLine >= 0) {
      const step3Line = lines[initLine + 3]; // 第3步应该在第4行
      if (step3Line && step3Line.startsWith('3. ')) {
        console.log('✓ Step 3 indentation is correct');
      } else {
        console.log('✗ Step 3 indentation is incorrect');
        console.log('Step 3 line:', step3Line);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 All tests PASSED!');
    } else {
      console.log('\n❌ Some tests FAILED!');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testTemplateFix();
