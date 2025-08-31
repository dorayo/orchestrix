#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

async function testTemplateReplacement() {
  console.log('🧪 Testing template replacement fixes...\n');
  
  try {
    // Read the template
    const templatePath = path.join(__dirname, '..', 'templates', 'orchestrix-subagent-template.md');
    const template = await fs.readFile(templatePath, 'utf8');
    
    console.log('📄 Template content (first 10 lines):');
    const templateLines = template.split('\n').slice(0, 10);
    templateLines.forEach((line, i) => console.log(`${String(i+1).padStart(2)}: ${line}`));
    
    // Test placeholder replacement
    const testReplacements = {
      '{AGENT_ID}': 'dev',
      '{COMPLETE_TOOLS_LIST}': "['changes', 'codebase', 'fetch']",
      '{AGENT_SPECIFIC_STARTUP}': `3. Load any active story in \`docs/stories/\` directory (check status != "Done")
4. Check \`.orchestrix-core/core-config.yaml\` for \`devLoadAlwaysFiles\` if present
5. Verify project structure matches Orchestrix standards`
    };
    
    let content = template;
    for (const [placeholder, value] of Object.entries(testReplacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      const beforeCount = (content.match(regex) || []).length;
      content = content.replace(regex, value || '');
      const afterCount = (content.match(regex) || []).length;
      
      console.log(`\n🔄 Replacing ${placeholder}:`);
      console.log(`   Found: ${beforeCount} occurrences`);
      console.log(`   Remaining: ${afterCount} occurrences`);
      console.log(`   ✅ ${beforeCount > 0 && afterCount === 0 ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Check the critical initialization section
    console.log('\n📋 Critical Initialization section:');
    const lines = content.split('\n');
    const startIdx = lines.findIndex(line => line.includes('When invoked, IMMEDIATELY:'));
    if (startIdx !== -1) {
      for (let i = startIdx; i < Math.min(startIdx + 8, lines.length); i++) {
        console.log(`${String(i+1).padStart(3)}: ${lines[i]}`);
      }
    }
    
    console.log('\n✅ Template replacement test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testTemplateReplacement();
