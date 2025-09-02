const fs = require('fs').promises;
const path = require('path');
const IdeSetup = require('../lib/ide-setup');

async function debugEnhancedDetailed() {
  console.log('=== 详细调试Enhanced Template ===\n');
  
  try {
    // 1. 检查模板文件
    const templatePath = path.join(__dirname, '..', 'templates', 'orchestrix-subagent-enhanced-template.md');
    console.log('1. 检查模板文件路径:', templatePath);
    
    const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
    console.log('   模板文件存在:', templateExists);
    
    if (templateExists) {
      const template = await fs.readFile(templatePath, 'utf8');
      console.log('   模板文件长度:', template.length);
      console.log('   模板前5行:');
      template.split('\n').slice(0, 5).forEach((line, i) => {
        console.log(`     ${i+1}: ${line}`);
      });
    }
    
    // 2. 读取agent文件
    console.log('\n2. 读取dev agent文件');
    let agentPath = path.join(__dirname, '..', '..', '..', 'orchestrix-core', 'agents', 'dev.yaml');
    if (!await fs.pathExists(agentPath)) {
      agentPath = path.join(__dirname, '..', '..', '..', 'orchestrix-core', 'agents', 'dev.md');
    }
    const agentContent = await fs.readFile(agentPath, 'utf8');
    console.log('   Agent文件路径:', agentPath);
    console.log('   Agent文件长度:', agentContent.length);
    
    // 3. 测试metadata提取
    console.log('\n3. 测试metadata提取');
    const ideSetup = IdeSetup;
    const metadata = ideSetup.extractCompleteAgentMetadata(agentContent, 'dev');
    console.log('   Metadata keys:', Object.keys(metadata));
    console.log('   Agent title:', metadata.agent?.title);
    console.log('   Agent name:', metadata.agent?.name);
    
    // 4. 测试替换值生成
    console.log('\n4. 测试替换值生成');
    const replacements = await ideSetup.generateAllReplacements('dev', metadata, agentContent);
    console.log('   替换值数量:', Object.keys(replacements).length);
    console.log('   关键替换值:');
    console.log('     {AGENT_ID}:', replacements['{AGENT_ID}']);
    console.log('     {COMPLETE_TOOLS_LIST}:', replacements['{COMPLETE_TOOLS_LIST}']);
    console.log('     {AGENT_SPECIFIC_STARTUP}:', replacements['{AGENT_SPECIFIC_STARTUP}']?.substring(0, 100) + '...');
    
    // 5. 测试完整的enhanced生成
    console.log('\n5. 测试完整的enhanced生成');
    const result = await ideSetup.generateEnhancedSubagentContent('dev', agentContent, '/tmp');
    console.log('   生成结果长度:', result.length);
    
    // 检查关键占位符是否被替换
    const checks = [
      '{AGENT_ID}',
      '{COMPLETE_TOOLS_LIST}',
      '{AGENT_SPECIFIC_STARTUP}'
    ];
    
    console.log('\n6. 检查占位符替换结果:');
    for (const placeholder of checks) {
      const exists = result.includes(placeholder);
      console.log(`   ${placeholder}: ${exists ? '❌ 未替换' : '✅ 已替换'}`);
    }
    
    // 显示生成结果的前20行
    console.log('\n7. 生成结果前20行:');
    result.split('\n').slice(0, 20).forEach((line, i) => {
      console.log(`     ${i+1}: ${line}`);
    });
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugEnhancedDetailed();
