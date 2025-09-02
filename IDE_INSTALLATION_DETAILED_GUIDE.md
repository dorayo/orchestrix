# Orchestrix IDE 安装详细指南 - Claude Code & Cursor 专版

## 概述

本文档详细说明了 Orchestrix 框架在 **Claude Code** 和 **Cursor** 两个 IDE 环境中的完整安装流程，包括双模式集成、配置生成、文件结构和使用方法。

## 目录

1. [Claude Code 双模式集成](#claude-code-双模式集成)
2. [Cursor IDE 集成](#cursor-ide-集成)
3. [安装流程对比](#安装流程对比)
4. [故障排查指南](#故障排查指南)
5. [最佳实践](#最佳实践)

---

## Claude Code 双模式集成

### 1. 双模式架构概览

Claude Code 支持两种不同的代理集成模式：

```
Claude Code 双模式
├── SubAgent 模式 (.claude/agents/)
│   ├── 智能上下文感知
│   ├── 增强的依赖映射
│   └── 自动化工作流执行
└── Command 模式 (.claude/commands/)
    ├── 传统命令调用
    ├── 手动触发执行
    └── 兼容性保证
```

### 2. SubAgent 模式详细流程

#### 2.1 安装过程

**代码位置**: `tools/installer/lib/ide-setup.js:143-198`

```javascript
async setupClaudeCode(installDir, selectedAgent, runTests = false) {
  // 步骤 1: 启用增强模板系统
  const useEnhancedTemplate = true;

  // 步骤 2: 检查并创建模板
  const templatePath = path.join(__dirname, '..', 'templates', 'orchestrix-subagent-template.md');

  // 步骤 3: 生成优化的 SubAgent
  subagentsCount = await this.setupClaudeCodeSubagentsEnhanced(installDir, selectedAgent);
}
```

#### 2.2 SubAgent 生成流程

**方法**: `setupClaudeCodeSubagentsEnhanced()`

```
1. 创建目录结构
   └── .claude/agents/

2. 遍历代理列表
   ├── 解析代理元数据
   ├── 提取 YAML 配置
   └── 应用增强模板

3. 生成最终文件
   ├── {agent-id}.md
   ├── 智能占位符替换
   └── 上下文感知配置
```

#### 2.3 增强模板系统

**模板文件**: `tools/installer/templates/orchestrix-subagent-template.md`

**关键占位符**:

```yaml
{AGENT_ID}              # 代理标识符
{AGENT_TITLE}           # 代理显示名称
{AGENT_ROLE}            # 核心角色定义
{PRIMARY_USE_CASES}     # 主要使用场景
{MANDATORY_TRIGGERS}    # 强制触发条件
{COMPLETE_TOOLS_LIST}   # 完整工具列表
{AGENT_SPECIFIC_STARTUP} # 代理专用启动流程
{CORE_PRINCIPLES_LIST}  # 核心原则列表
{COMMANDS_WITH_DESCRIPTIONS} # 命令和描述
{DEPENDENCY_MAPPING}    # 依赖关系映射
```

#### 2.4 元数据提取过程

**方法**: `extractCompleteAgentMetadata()`

````javascript
// 基础元数据提取
const metadata = this.extractAgentMetadata(agentContent);

// 增强信息提取
const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);

// 特定代理的专用配置
if (agentId === "dev") {
  // 提取测试完整性规则
  metadata.testIntegrityRules = this.parseListSection(testRulesMatch[1]);
}

if (agentId === "qa") {
  // 提取故事文件权限
  metadata.storyFilePermissions = this.parseListSection(storyPermMatch[1]);
}
````

#### 2.5 生成的 SubAgent 文件结构

```markdown
---
name: dev
description: "Orchestrix 开发工程师 - 软件开发工程师. Use PROACTIVELY for 故事实现和代码开发. MUST BE USED when 需要编写或修改代码文件."
tools: file_search,create_file,edit_file,run_shell_command,read_file
---

# Orchestrix 开发工程师 Agent - 开发工程师

You are 开发工程师, the Orchestrix 开发工程师 agent. You are a 软件开发工程师.

## CRITICAL INITIALIZATION

When invoked, IMMEDIATELY:

1. Understand you are operating within the Orchestrix framework
2. Check for `.orchestrix-core/` directory structure
3. Load the current story context from docs/stories/
4. Verify test integrity rules are in place
5. Check compilation environment status

## Core Identity & Principles

**Role**: 软件开发工程师
**Style**: 实用主义，注重代码质量和测试覆盖
**Identity**: 你是一位经验丰富的软件开发工程师
**Focus**: 故事实现、代码开发、测试编写、技术债务管理

**CORE PRINCIPLES**:

- 编写高质量、可维护的代码
- 遵循项目的编码标准和架构指南
- 确保所有代码变更都有相应的测试
- 在实现前充分理解需求和技术规范
```

### 3. Command 模式详细流程

#### 3.1 安装过程

**方法**: `setupClaudeCodeForPackage()`

```
目录结构创建:
.claude/commands/
├── {slash-prefix}/
│   ├── agents/
│   │   ├── dev.md
│   │   ├── qa.md
│   │   └── ...
│   └── tasks/
│       ├── implement-story.md
│       ├── review-code.md
│       └── ...
```

#### 3.2 命令文件生成

**代理命令生成**:

```markdown
# /dev Command

When this command is used, adopt the following agent persona:

[完整的代理 YAML 配置]
```

**任务命令生成**:

```markdown
# /implement-story Task

When this command is used, execute the following task:

[完整的任务工作流]
```

#### 3.3 扩展包支持

```javascript
// 扩展包命令设置
const expansionPacks = await this.getInstalledExpansionPacks(installDir);
for (const packInfo of expansionPacks) {
  const packSlashPrefix = await this.getExpansionPackSlashPrefix(packInfo.path);
  const packAgents = await this.getExpansionPackAgents(packInfo.path);
  const packTasks = await this.getExpansionPackTasks(packInfo.path);

  await this.setupClaudeCodeForPackage(installDir, packInfo.name, packSlashPrefix, packAgents, packTasks, rootPath);
}
```

### 4. Claude Code 完整目录结构

```
project/
├── .claude/
│   ├── agents/                    # SubAgent 模式
│   │   ├── dev.md                # 开发工程师 SubAgent
│   │   ├── qa.md                 # 质量保证 SubAgent
│   │   ├── architect.md          # 架构师 SubAgent
│   │   ├── pm.md                 # 产品经理 SubAgent
│   │   └── ...
│   └── commands/                  # Command 模式
│       ├── core/                 # 核心系统命令
│       │   ├── agents/
│       │   │   ├── dev.md        # /dev 命令
│       │   │   ├── qa.md         # /qa 命令
│       │   │   └── ...
│       │   └── tasks/
│       │       ├── implement-story.md  # /implement-story 命令
│       │       ├── review-code.md      # /review-code 命令
│       │       └── ...
│       └── {expansion-pack}/     # 扩展包命令
│           ├── agents/
│           └── tasks/
└── .orchestrix-core/             # 核心框架文件
```

---

## Cursor IDE 集成

### 1. Cursor 架构概览

Cursor 使用单一的规则系统，通过 `.mdc` 文件提供代理激活功能：

```
Cursor 集成
└── Rules 模式 (.cursor/rules/)
    ├── 基于 @symbol 触发
    ├── MDC 格式文件
    └── 完整 YAML 嵌入
```

### 2. Cursor 安装流程

#### 2.1 安装过程

**代码位置**: `tools/installer/lib/ide-setup.js:77-140`

```javascript
async setupCursor(installDir, selectedAgent) {
  // 步骤 1: 创建规则目录
  const cursorRulesDir = path.join(installDir, ".cursor", "rules");

  // 步骤 2: 获取代理列表
  const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

  // 步骤 3: 生成 MDC 规则文件
  for (const agentId of agents) {
    // 生成每个代理的 .mdc 文件
  }
}
```

#### 2.2 MDC 文件生成流程

```
1. 创建目录结构
   └── .cursor/rules/

2. 遍历代理列表
   ├── 查找代理文件路径
   ├── 读取代理内容
   └── 提取 YAML 配置

3. 生成 MDC 文件
   ├── 添加 frontmatter
   ├── 嵌入完整 YAML
   └── 生成使用说明
```

#### 2.3 MDC 文件结构

````markdown
---
description:
globs: []
alwaysApply: false
---

# DEV Agent Rule

This rule is triggered when the user types `@dev` and activates the 开发工程师 agent persona.

## Agent Activation

CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:

```yaml
agent:
  name: "开发工程师"
  role: "软件开发工程师"
  style: "实用主义，注重代码质量和测试覆盖"
  # ... 完整的 YAML 配置
```
````

## File Reference

The complete agent definition is available in [.orchestrix-core/agents/dev.md](mdc:.orchestrix-core/agents/dev.md).

## Usage

When the user types `@dev`, activate this 开发工程师 persona and follow all instructions defined in the YAML configuration above.

```

### 3. Cursor 完整目录结构

```

project/
├── .cursor/
│ └── rules/
│ ├── dev.mdc # 开发工程师规则
│ ├── qa.mdc # 质量保证规则
│ ├── architect.mdc # 架构师规则
│ ├── pm.mdc # 产品经理规则
│ └── ...
└── .orchestrix-core/ # 核心框架文件

```

---

## 安装流程对比

### 1. 核心差异对比

| 特性 | Claude Code | Cursor |
|------|-------------|--------|
| **集成模式** | 双模式 (SubAgent + Command) | 单模式 (Rules) |
| **文件格式** | .md (增强模板) | .mdc (frontmatter) |
| **触发方式** | 直接选择 SubAgent / /命令 | @symbol 触发 |
| **配置复杂度** | 高 (智能模板系统) | 中 (标准化 MDC) |
| **扩展包支持** | 完整支持 | 基础支持 |
| **自动化程度** | 高 (SubAgent 自动执行) | 中 (手动触发) |

### 2. 安装时间对比

```

Claude Code 安装流程:
├── SubAgent 生成: ~2-5秒 (10个代理)
├── Command 生成: ~1-3秒 (核心命令)
├── 扩展包处理: ~1-2秒 (每个包)
└── 总计: ~4-10秒

Cursor 安装流程:
├── MDC 生成: ~1-2秒 (10个代理)
├── YAML 提取: ~0.5秒
└── 总计: ~1.5-2.5秒

```

### 3. 文件大小对比

```

Claude Code 文件大小:
├── SubAgent 文件: ~3-8KB (每个)
├── Command 文件: ~1-3KB (每个)
└── 总大小: ~50-150KB

Cursor 文件大小:
├── MDC 文件: ~2-5KB (每个)
└── 总大小: ~20-50KB

````

---

## 故障排查指南

### 1. Claude Code 常见问题

#### 问题 1: SubAgent 模板生成失败
```bash
# 症状
⚠️  Enhanced template not found, creating default template...

# 解决方案
# 检查模板文件是否存在
ls -la tools/installer/templates/orchestrix-subagent-template.md

# 手动创建模板
npx orchestrix install --ide claude-code --test-template
````

#### 问题 2: 占位符替换不完整

````bash
# 症状
生成的 SubAgent 文件中包含未替换的 {PLACEHOLDER}

# 解决方案
# 检查代理 YAML 格式
grep -A 10 "```yaml" .orchestrix-core/agents/dev.md

# 重新生成
npx orchestrix install --ide claude-code --force
````

#### 问题 3: 命令模式文件缺失

```bash
# 症状
.claude/commands/ 目录为空或不完整

# 解决方案
# 检查代理和任务文件
ls -la .orchestrix-core/agents/
ls -la .orchestrix-core/tasks/

# 强制重新安装
npx orchestrix install --ide claude-code --clean
```

### 2. Cursor 常见问题

#### 问题 1: MDC frontmatter 格式错误

```bash
# 症状
Cursor 无法识别 .mdc 文件

# 解决方案
# 检查 frontmatter 格式
head -10 .cursor/rules/dev.mdc

# 验证 YAML 语法
npx js-yaml .cursor/rules/dev.mdc
```

#### 问题 2: @symbol 触发失效

```bash
# 症状
输入 @dev 没有激活代理

# 解决方案
# 检查文件权限
chmod 644 .cursor/rules/*.mdc

# 重启 Cursor IDE
# 清除 Cursor 缓存
```

### 3. 通用故障排查

#### 调试命令集合

```bash
# 检查安装状态
npx orchestrix status

# 验证代理依赖
npx orchestrix validate

# 重新安装特定 IDE
npx orchestrix install --ide claude-code --clean
npx orchestrix install --ide cursor --clean

# 检查文件完整性
find .claude -name "*.md" | wc -l
find .cursor -name "*.mdc" | wc -l

# 查看详细日志
npx orchestrix install --ide claude-code --verbose
```

---

## 最佳实践

### 1. Claude Code 最佳实践

#### SubAgent 模式推荐用法

```markdown
场景 1: 开发新功能

1. 直接选择 "dev" SubAgent
2. SubAgent 自动发现项目结构
3. 执行智能化开发流程

场景 2: 代码审查

1. 选择 "qa" SubAgent
2. 自动执行完整性检查
3. 生成审查报告

场景 3: 架构设计

1. 选择 "architect" SubAgent
2. 分析技术需求
3. 生成架构文档
```

#### Command 模式推荐用法

```markdown
场景 1: 特定任务执行
/implement-story # 实现特定故事
/review-code # 执行代码审查
/create-doc # 创建文档

场景 2: 快速代理切换
/dev # 切换到开发模式
/qa # 切换到QA模式
/architect # 切换到架构模式
```

### 2. Cursor 最佳实践

#### 代理激活流程

```markdown
1. 项目分析阶段
   @analyst # 需求分析
   @pm # 产品规划

2. 架构设计阶段  
   @architect # 技术架构
   @ux-expert # 用户体验

3. 开发实现阶段
   @dev # 功能开发
   @qa # 质量保证

4. 项目管理阶段
   @sm # 敏捷管理
   @po # 产品负责
```

### 3. 性能优化建议

#### Claude Code 优化

```yaml
建议配置:
- 选择性安装: 仅安装需要的代理
- 定期清理: 删除unused命令文件
- 模板缓存: 重用SubAgent模板

# 选择性安装示例
npx orchestrix install --ide claude-code --agent dev,qa,architect
```

#### Cursor 优化

```yaml
建议配置:
- 规则分组: 按功能组织MDC文件
- 文件命名: 使用语义化名称
- 定期更新: 保持与核心框架同步

# 规则文件重命名示例
mv dev.mdc 01-dev-engineer.mdc
mv qa.mdc 02-qa-specialist.mdc
```

### 4. 扩展包集成策略

```yaml
推荐顺序:
1. 核心框架安装
2. 基础IDE配置
3. 扩展包安装
4. 自定义配置

# 游戏开发扩展包示例
npx orchestrix install expansion orchestrix-2d-phaser-game-dev
npx orchestrix install --ide claude-code --refresh
```

---

## 结语

本指南提供了 Claude Code 和 Cursor 的完整 IDE 集成方案。两个 IDE 各有特色：

- **Claude Code**: 适合需要高度自动化和智能化开发流程的团队
- **Cursor**: 适合需要简单直接的代理切换和规则管理的开发者

根据团队需求选择合适的 IDE 集成方案，可以显著提升 Orchestrix 框架的使用效率。

---

_文档版本: v1.0.0_  
_最后更新: 2024年_  
_适用于: Orchestrix v1.0.0+_
