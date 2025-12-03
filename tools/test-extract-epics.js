#!/usr/bin/env node
/**
 * Test suite for extract-epics.js
 *
 * 用法: node tools/test-extract-epics.js
 */

const fs = require('fs');
const path = require('path');
const { extractEpics, extractYamlBlocks, validateEpicStructure, slugify } = require('./extract-epics');

// 测试计数器
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected true');
  }
}

// =====================================================
// slugify 测试
// =====================================================

console.log('\n📋 slugify 函数测试:');

test('英文标题转换', () => {
  assertEqual(slugify('User Authentication'), 'user-authentication');
});

test('中英混合标题 - 提取英文部分', () => {
  assertEqual(slugify('工作流配置和步骤执行器 (Workflow Configuration and Step Executors)'), 'workflow-configuration-and-step-executors');
});

test('纯中文标题 - 返回 untitled', () => {
  assertEqual(slugify('用户认证系统'), 'untitled');
});

test('带特殊字符的标题', () => {
  assertEqual(slugify("User's Data & Settings"), 'user-s-data-settings');
});

test('多个连字符压缩', () => {
  assertEqual(slugify('Epic --- Test --- Title'), 'epic-test-title');
});

test('带括号的英文', () => {
  assertEqual(slugify('Genesis & The Island (Foundation)'), 'genesis-the-island-foundation');
});

// =====================================================
// extractYamlBlocks 测试
// =====================================================

console.log('\n📋 extractYamlBlocks 函数测试:');

test('提取单个 YAML 块', () => {
  const content = `
# Test

\`\`\`yaml
key: value
\`\`\`
`;
  const blocks = extractYamlBlocks(content);
  assertEqual(blocks.length, 1);
  assertTrue(blocks[0].yaml.includes('key: value'));
});

test('提取多个 YAML 块', () => {
  const content = `
\`\`\`yaml
block: 1
\`\`\`

\`\`\`yaml
block: 2
\`\`\`
`;
  const blocks = extractYamlBlocks(content);
  assertEqual(blocks.length, 2);
});

test('忽略其他代码块', () => {
  const content = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`yaml
epic_id: 1
\`\`\`

\`\`\`bash
echo "hello"
\`\`\`
`;
  const blocks = extractYamlBlocks(content);
  assertEqual(blocks.length, 1);
  assertTrue(blocks[0].yaml.includes('epic_id'));
});

test('处理空内容', () => {
  const blocks = extractYamlBlocks('');
  assertEqual(blocks.length, 0);
});

test('处理无 YAML 块的内容', () => {
  const content = '# Just markdown\n\nNo yaml here.';
  const blocks = extractYamlBlocks(content);
  assertEqual(blocks.length, 0);
});

// =====================================================
// validateEpicStructure 测试
// =====================================================

console.log('\n📋 validateEpicStructure 函数测试:');

test('有效的 Epic 结构', () => {
  const epic = {
    epic_id: 1,
    title: 'Test Epic',
    stories: [
      { id: '1.1', title: 'Story 1', repository_type: 'backend' }
    ]
  };
  const result = validateEpicStructure(epic);
  assertTrue(result.valid, 'Should be valid');
  assertEqual(result.errors.length, 0);
});

test('缺少 epic_id', () => {
  const epic = {
    title: 'Test Epic',
    stories: [{ id: '1.1', title: 'Story 1', repository_type: 'backend' }]
  };
  const result = validateEpicStructure(epic);
  assertTrue(!result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('epic_id')));
});

test('缺少 title', () => {
  const epic = {
    epic_id: 1,
    stories: [{ id: '1.1', title: 'Story 1', repository_type: 'backend' }]
  };
  const result = validateEpicStructure(epic);
  assertTrue(!result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('title')));
});

test('缺少 stories', () => {
  const epic = {
    epic_id: 1,
    title: 'Test Epic'
  };
  const result = validateEpicStructure(epic);
  assertTrue(!result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('stories')));
});

test('story 缺少必须字段', () => {
  const epic = {
    epic_id: 1,
    title: 'Test Epic',
    stories: [
      { id: '1.1' }  // 缺少 title 和 repository_type
    ]
  };
  const result = validateEpicStructure(epic);
  assertTrue(!result.valid, 'Should be invalid');
  assertTrue(result.errors.length >= 2);
});

test('epic_id 为 0 应该有效', () => {
  const epic = {
    epic_id: 0,
    title: 'Technical Debt',
    stories: [{ id: '0.1', title: 'Fix bug', repository_type: 'backend' }]
  };
  const result = validateEpicStructure(epic);
  assertTrue(result.valid, 'epic_id: 0 should be valid');
});

// =====================================================
// extractEpics 完整流程测试
// =====================================================

console.log('\n📋 extractEpics 完整流程测试:');

// 创建临时测试目录
const testDir = '/tmp/test-extract-epics-suite';
const testPrdPath = path.join(testDir, 'test-prd.md');
const testOutputDir = path.join(testDir, 'output');

// 清理并创建测试目录
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}
fs.mkdirSync(testDir, { recursive: true });

test('文件不存在时返回错误', () => {
  const result = extractEpics('/non/existent/file.md', testOutputDir);
  assertTrue(!result.success);
  assertTrue(result.errors.some(e => e.includes('不存在')));
});

test('成功提取 Epic', () => {
  const prdContent = `
# Test PRD

## Epics

\`\`\`yaml
epic_id: 1
title: "User Authentication"
description: |
  Implement user auth system.

stories:
  - id: "1.1"
    title: "Backend Auth API"
    repository_type: backend
    acceptance_criteria:
      - "AC1: Login works"
    priority: P0
\`\`\`

\`\`\`yaml
epic_id: 2
title: "Product Catalog"
description: |
  Build product catalog.

stories:
  - id: "2.1"
    title: "Product List API"
    repository_type: backend
    priority: P0
  - id: "2.2"
    title: "Product List UI"
    repository_type: frontend
    priority: P1
\`\`\`
`;
  fs.writeFileSync(testPrdPath, prdContent);

  const result = extractEpics(testPrdPath, testOutputDir);

  assertTrue(result.success);
  assertEqual(result.epics, 2);
  assertEqual(result.stories, 3);
  assertTrue(result.repositoryTypes.has('backend'));
  assertTrue(result.repositoryTypes.has('frontend'));
  assertTrue(result.extractedFiles.includes('epic-1-user-authentication.yaml'));
  assertTrue(result.extractedFiles.includes('epic-2-product-catalog.yaml'));

  // 验证文件内容
  const epic1Path = path.join(testOutputDir, 'epic-1-user-authentication.yaml');
  assertTrue(fs.existsSync(epic1Path), 'Epic 1 file should exist');
});

test('处理包含非 Epic YAML 块的 PRD', () => {
  const prdContent = `
# Test PRD

\`\`\`yaml
# This is a config block, not an epic
config:
  version: 1.0
\`\`\`

\`\`\`yaml
epic_id: 1
title: "Only Epic"
stories:
  - id: "1.1"
    title: "Story"
    repository_type: backend
\`\`\`
`;
  const prdPath2 = path.join(testDir, 'test-prd-2.md');
  const outputDir2 = path.join(testDir, 'output-2');
  fs.writeFileSync(prdPath2, prdContent);

  const result = extractEpics(prdPath2, outputDir2);

  assertEqual(result.epics, 1);
  assertEqual(result.extractedFiles.length, 1);
});

test('处理中英混合标题的 Epic', () => {
  const prdContent = `
\`\`\`yaml
epic_id: 3
title: "工作流配置 (Workflow Config)"
stories:
  - id: "3.1"
    title: "Setup"
    repository_type: backend
\`\`\`
`;
  const prdPath3 = path.join(testDir, 'test-prd-3.md');
  const outputDir3 = path.join(testDir, 'output-3');
  fs.writeFileSync(prdPath3, prdContent);

  const result = extractEpics(prdPath3, outputDir3);

  assertTrue(result.extractedFiles[0].includes('workflow-config'));
});

// =====================================================
// 清理并报告结果
// =====================================================

// 清理测试目录
fs.rmSync(testDir, { recursive: true });

console.log('\n═══════════════════════════════════════════════════════');
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('═══════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
