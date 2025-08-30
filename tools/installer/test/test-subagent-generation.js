const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

async function testSubagentGeneration() {
  console.log(chalk.blue('Testing Sub Agent Generation...'));
  
  const testCases = [
    {
      agentId: 'dev',
      requiredElements: [
        'tools: Read, Edit, MultiEdit, Write, Bash, WebSearch',
        'NEVER modify test expectations',
        'develop-story',
        '.orchestrix-core/tasks/implement-story-auto.md'
      ]
    },
    {
      agentId: 'sm',
      requiredElements: [
        'tools: Read, Edit, MultiEdit, Write',
        '>80% technical extraction',
        'create-next-story',
        'NOT allowed to implement stories'
      ]
    },
    {
      agentId: 'qa',
      requiredElements: [
        'tools: Read, Edit, MultiEdit, Write, Bash',
        'QA Results section',
        'review-story',
        'code quality and refactoring'
      ]
    }
  ];
  
  for (const testCase of testCases) {
    const subagentPath = path.join(process.cwd(), '.claude', 'agents', `${testCase.agentId}.md`);
    
    try {
      const content = await fs.readFile(subagentPath, 'utf8');
      
      console.log(chalk.yellow(`\nTesting ${testCase.agentId} sub agent...`));
      
      let allPassed = true;
      for (const element of testCase.requiredElements) {
        if (content.includes(element)) {
          console.log(chalk.green(`  ✓ Contains: ${element}`));
        } else {
          console.log(chalk.red(`  ✗ Missing: ${element}`));
          allPassed = false;
        }
      }
      
      if (allPassed) {
        console.log(chalk.green(`  ${testCase.agentId} sub agent: PASSED`));
      } else {
        console.log(chalk.red(`  ${testCase.agentId} sub agent: FAILED`));
      }
      
    } catch (error) {
      console.log(chalk.red(`  Error reading ${testCase.agentId}: ${error.message}`));
    }
  }
}

// 运行测试
testSubagentGeneration().catch(console.error);