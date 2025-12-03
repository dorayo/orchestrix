#!/usr/bin/env node
/**
 * Epic YAML Extractor
 *
 * 从 PRD 文档中提取 Epic YAML 块，生成独立的 epic-{n}-{title-slug}.yaml 文件
 * 用于 PO 分片任务，替代 LLM 提取，提高效率和一致性
 *
 * 用法:
 *   node tools/extract-epics.js <prd-file> [output-dir]
 *   node tools/extract-epics.js docs/prd.md docs/prd
 *
 * 功能:
 *   1. 读取 PRD markdown 文件
 *   2. 提取所有包含 epic_id 的 YAML 代码块
 *   3. 解析 YAML 并验证结构
 *   4. 生成 slug 化的文件名
 *   5. 输出到指定目录
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

/**
 * 将标题转换为 slug 格式
 * @param {string} title - Epic 标题
 * @returns {string} slug 格式的标题
 */
function slugify(title) {
  return title
    .toLowerCase()
    // 移除中文字符，只保留英文部分
    .replace(/[\u4e00-\u9fa5]+/g, '')
    // 移除括号和括号内的内容（如果括号内是中文）
    .replace(/\s*\([^)]*[\u4e00-\u9fa5][^)]*\)\s*/g, '')
    // 保留括号内的英文
    .replace(/\(([^)]+)\)/g, '-$1-')
    // 替换特殊字符为连字符
    .replace(/[^a-z0-9]+/g, '-')
    // 移除首尾连字符
    .replace(/^-+|-+$/g, '')
    // 压缩多个连字符
    .replace(/-+/g, '-')
    // 如果结果为空，使用默认值
    || 'untitled';
}

/**
 * 从 markdown 内容中提取所有 YAML 代码块
 * @param {string} content - markdown 文件内容
 * @returns {Array<{yaml: string, startLine: number}>} YAML 块数组
 */
function extractYamlBlocks(content) {
  const blocks = [];
  const lines = content.split('\n');

  let inYamlBlock = false;
  let currentBlock = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '```yaml') {
      inYamlBlock = true;
      currentBlock = [];
      startLine = i + 1;
    } else if (line.trim() === '```' && inYamlBlock) {
      inYamlBlock = false;
      if (currentBlock.length > 0) {
        blocks.push({
          yaml: currentBlock.join('\n'),
          startLine
        });
      }
    } else if (inYamlBlock) {
      currentBlock.push(line);
    }
  }

  return blocks;
}

/**
 * 验证 Epic YAML 结构
 * @param {object} epicData - 解析后的 YAML 对象
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateEpicStructure(epicData) {
  const errors = [];

  // 必须字段检查
  if (!epicData.epic_id && epicData.epic_id !== 0) {
    errors.push('缺少必须字段: epic_id');
  } else if (typeof epicData.epic_id !== 'number') {
    errors.push(`epic_id 必须是数字，当前类型: ${typeof epicData.epic_id}`);
  }

  if (!epicData.title) {
    errors.push('缺少必须字段: title');
  }

  if (!epicData.stories || !Array.isArray(epicData.stories)) {
    errors.push('缺少必须字段: stories (必须是数组)');
  } else {
    // 验证每个 story
    epicData.stories.forEach((story, index) => {
      if (!story.id) {
        errors.push(`Story ${index + 1} 缺少 id 字段`);
      }
      if (!story.title) {
        errors.push(`Story ${story.id || index + 1} 缺少 title 字段`);
      }
      if (!story.repository_type) {
        errors.push(`Story ${story.id || index + 1} 缺少 repository_type 字段`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 格式化 YAML 输出，确保一致的格式
 * @param {object} epicData - Epic 数据对象
 * @returns {string} 格式化后的 YAML 字符串
 */
function formatEpicYaml(epicData) {
  // 使用 js-yaml 的 dump 函数，配置合适的选项
  return yaml.dump(epicData, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    // 多行字符串使用 | 样式
    styles: {
      '!!str': 'literal'
    }
  });
}

/**
 * 主函数：提取 Epic YAML 文件
 * @param {string} prdPath - PRD 文件路径
 * @param {string} outputDir - 输出目录路径
 * @returns {{success: boolean, epics: number, errors: string[]}} 执行结果
 */
function extractEpics(prdPath, outputDir) {
  const result = {
    success: true,
    epics: 0,
    stories: 0,
    repositoryTypes: new Set(),
    extractedFiles: [],
    errors: [],
    warnings: []
  };

  // 检查 PRD 文件是否存在
  if (!fs.existsSync(prdPath)) {
    result.success = false;
    result.errors.push(`PRD 文件不存在: ${prdPath}`);
    return result;
  }

  // 读取 PRD 内容
  const content = fs.readFileSync(prdPath, 'utf8');

  // 提取 YAML 块
  const yamlBlocks = extractYamlBlocks(content);

  if (yamlBlocks.length === 0) {
    result.warnings.push('未找到 YAML 代码块');
    return result;
  }

  // 过滤出包含 epic_id 的块
  const epicBlocks = [];

  for (const block of yamlBlocks) {
    try {
      const data = yaml.load(block.yaml);
      if (data && (data.epic_id !== undefined || data.epic_id === 0)) {
        epicBlocks.push({
          data,
          startLine: block.startLine
        });
      }
    } catch (e) {
      result.warnings.push(`YAML 解析失败 (行 ${block.startLine}): ${e.message}`);
    }
  }

  if (epicBlocks.length === 0) {
    result.warnings.push('未找到包含 epic_id 的 YAML 块');
    return result;
  }

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 处理每个 Epic
  for (const block of epicBlocks) {
    const epicData = block.data;

    // 验证结构
    const validation = validateEpicStructure(epicData);
    if (!validation.valid) {
      result.warnings.push(`Epic ${epicData.epic_id || '?'} 验证警告: ${validation.errors.join('; ')}`);
      // 继续处理，只是记录警告
    }

    // 生成文件名
    const slug = slugify(epicData.title);
    const filename = `epic-${epicData.epic_id}-${slug}.yaml`;
    const outputPath = path.join(outputDir, filename);

    // 格式化并写入
    const yamlContent = formatEpicYaml(epicData);
    fs.writeFileSync(outputPath, yamlContent, 'utf8');

    // 统计
    result.epics++;
    result.extractedFiles.push(filename);

    if (epicData.stories) {
      result.stories += epicData.stories.length;
      epicData.stories.forEach(story => {
        if (story.repository_type) {
          result.repositoryTypes.add(story.repository_type);
        }
      });
    }
  }

  return result;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);

  // 帮助信息
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}Epic YAML Extractor${colors.reset}

从 PRD 文档中提取 Epic YAML 块，生成独立的 epic-{n}-{title-slug}.yaml 文件

${colors.yellow}用法:${colors.reset}
  node tools/extract-epics.js <prd-file> [output-dir]

${colors.yellow}参数:${colors.reset}
  prd-file    PRD markdown 文件路径
  output-dir  输出目录 (默认: docs/prd)

${colors.yellow}示例:${colors.reset}
  node tools/extract-epics.js docs/prd.md docs/prd
  node tools/extract-epics.js ./prd.md ./epics

${colors.yellow}输出:${colors.reset}
  docs/prd/epic-1-user-authentication.yaml
  docs/prd/epic-2-product-catalog.yaml
  ...
`);
    process.exit(0);
  }

  // 参数验证
  const prdPath = args[0];
  const outputDir = args[1] || 'docs/prd';

  if (!prdPath) {
    console.error(`${colors.red}错误: 请指定 PRD 文件路径${colors.reset}`);
    console.error(`用法: node tools/extract-epics.js <prd-file> [output-dir]`);
    process.exit(1);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Epic YAML Extractor${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.dim}PRD 文件: ${prdPath}${colors.reset}`);
  console.log(`${colors.dim}输出目录: ${outputDir}${colors.reset}`);
  console.log();

  // 执行提取
  const result = extractEpics(prdPath, outputDir);

  // 输出结果
  if (result.errors.length > 0) {
    console.log(`${colors.red}❌ 错误:${colors.reset}`);
    result.errors.forEach(err => console.log(`   ${colors.red}${err}${colors.reset}`));
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  警告:${colors.reset}`);
    result.warnings.forEach(warn => console.log(`   ${colors.yellow}${warn}${colors.reset}`));
    console.log();
  }

  if (result.epics > 0) {
    console.log(`${colors.green}✅ 提取完成${colors.reset}`);
    console.log();
    console.log(`📋 统计:`);
    console.log(`   Epic 数量: ${result.epics}`);
    console.log(`   Story 数量: ${result.stories}`);
    console.log(`   Repository 类型: ${[...result.repositoryTypes].join(', ') || 'N/A'}`);
    console.log();
    console.log(`📁 生成的文件:`);
    result.extractedFiles.forEach(file => {
      console.log(`   ${colors.green}✓${colors.reset} ${file}`);
    });
  } else if (result.success) {
    console.log(`${colors.yellow}ℹ️  未找到 Epic YAML 块${colors.reset}`);
  }

  console.log();
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);

  // 退出码
  process.exit(result.errors.length > 0 ? 1 : 0);
}

// 导出函数供其他模块使用
module.exports = {
  extractEpics,
  extractYamlBlocks,
  validateEpicStructure,
  slugify
};

// 作为 CLI 运行
if (require.main === module) {
  main();
}
