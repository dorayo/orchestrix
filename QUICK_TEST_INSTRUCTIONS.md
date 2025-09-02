# 🚀 Orchestrix IDE 快速测试说明

## 方法一：自动化快速测试（推荐）

### 运行完整自动化测试

```bash
# 在 Orchestrix 项目目录中运行
node tools/quick-ide-test.js
```

这个脚本会：

1. 自动创建临时测试目录
2. 测试 Claude Code 和 Cursor 的各种安装场景
3. 验证生成的文件内容和格式
4. 显示详细的测试结果
5. 自动清理测试目录

### 自定义测试目录

```bash
# 使用指定目录进行测试
node tools/quick-ide-test.js ~/my-test-directory

# 保留测试目录不删除（便于手动检查）
node tools/quick-ide-test.js --no-cleanup
```

## 方法二：手动步骤测试

### 1. 创建测试环境

```bash
# 创建新的测试目录
mkdir ~/orchestrix-manual-test
cd ~/orchestrix-manual-test

# 初始化项目（可选）
npm init -y
```

### 2. 测试 Claude Code

```bash
# 安装 Claude Code（全部 agents）- 使用本地开发版本
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide claude-code

# 检查生成的文件
ls -la .claude/agents/          # SubAgent 文件
ls -la .claude/commands/core/   # Command 文件

# 验证文件内容
head -20 .claude/agents/dev.md
head -20 .claude/commands/core/agents/dev.md
```

### 3. 测试 Cursor

```bash
# 清理之前的安装
rm -rf .claude .orchestrix-core

# 安装 Cursor（单个 agent）- 使用本地开发版本
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide cursor --agent dev

# 检查生成的文件
ls -la .cursor/rules/
head -20 .cursor/rules/dev.mdc
```

### 4. 验证文件质量

```bash
# 检查是否有未替换的占位符
grep -r "{[A-Z_]*}" .claude/ .cursor/ || echo "✅ 无未替换占位符"

# 检查是否有未替换的路径
grep -r "{root}" .claude/ .cursor/ || echo "✅ 无未替换路径"

# 检查 MDC 文件是否有 description
grep "description:" .cursor/rules/*.mdc
```

## 方法三：使用验证脚本

```bash
# 在 Orchestrix 目录中运行验证
node tools/validate-ide-fixes.js

# 测试特定 IDE
node tools/validate-ide-fixes.js --ide claude-code
node tools/validate-ide-fixes.js --ide cursor

# 测试特定 agent
node tools/validate-ide-fixes.js --ide claude-code --agent dev
```

## 🔍 关键检查点

### Claude Code 检查

**SubAgent 文件格式**：

```markdown
---
name: dev
description: "Use for code implementation, debugging, refactoring, and development best practices"
tools: Read, Edit, MultiEdit, Write, Bash, WebSearch
---

# Orchestrix 开发工程师 Agent - Dev

...
```

**Command 文件格式**：

```markdown
# /dev Command

When this command is used, adopt the following agent persona:

# dev

ACTIVATION-PROTOCOL: You are now the Orchestrix Full Stack Developer...
```

### Cursor 检查

**MDC 文件格式**：

```markdown
---
description: "Use for code implementation, debugging, refactoring, and development best practices"
globs: []
alwaysApply: false
---

# DEV Agent Rule

This rule is triggered when the user types `@dev`...
```

## 🎯 预期结果

### 成功标志

✅ **Claude Code**:

- `.claude/agents/` 包含 SubAgent 文件（有 YAML frontmatter）
- `.claude/commands/core/` 包含 Command 文件
- 文件中无 `{PLACEHOLDER}` 或 `{root}` 占位符
- YAML frontmatter 包含有效的 `description` 和 `tools`

✅ **Cursor**:

- `.cursor/rules/` 包含 `.mdc` 文件
- MDC 文件有非空的 `description` 字段
- 包含完整的 YAML 配置块
- 文件格式符合 Cursor 规范

### 失败标志

❌ **常见问题**:

- 文件包含未替换的占位符 `{AGENT_TITLE}`, `{root}` 等
- MDC 文件的 `description` 字段为空
- YAML 格式错误或内容缺失
- 文件路径不正确或缺少文件

## 💡 故障排查

如果测试失败，检查：

1. **网络连接**: 确保可以访问 npm registry
2. **权限问题**: 确保有写入测试目录的权限
3. **Node.js 版本**: 确保使用兼容的 Node.js 版本
4. **Orchestrix 版本**: 确保使用最新的修复版本

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 权限
npm config get prefix

# 清理 npm 缓存
npm cache clean --force

# 使用详细模式安装（本地开发版本）
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide claude-code --verbose
```

## 🚀 快速一键测试

```bash
# 最简单的测试方法
cd /Users/dorayo/Codes/Orchestrix
node tools/quick-ide-test.js
```

这会自动完成所有测试并显示结果！
