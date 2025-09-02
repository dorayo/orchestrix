# Orchestrix IDE 安装手动测试指南

## 概述

本指南将帮你在全新目录中手动测试 Orchestrix 的 IDE 安装功能，验证生成的 agent 内容是否符合预期。

## 🚀 快速开始

### 步骤 1: 创建测试环境

```bash
# 1. 创建新的测试目录
mkdir ~/orchestrix-ide-test
cd ~/orchestrix-ide-test

# 2. 初始化为 npm 项目（可选，但推荐）
npm init -y

# 3. 确认目录为空
ls -la
```

### 步骤 2: 运行自动化测试脚本

```bash
# 在 Orchestrix 项目目录中运行验证脚本
cd /Users/dorayo/Codes/Orchestrix

# 运行完整验证
node tools/validate-ide-fixes.js

# 或者测试特定 IDE
node tools/validate-ide-fixes.js --ide claude-code
node tools/validate-ide-fixes.js --ide cursor

# 测试特定 agent
node tools/validate-ide-fixes.js --ide claude-code --agent dev
```

## 🔧 手动安装测试流程

### 方案 A: 使用本地开发版本（推荐用于测试修复）

```bash
# 回到测试目录
cd ~/orchestrix-ide-test

# 1. 安装完整的 Claude Code 支持
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide claude-code

# 2. 安装特定 agent 到 Cursor
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide cursor --agent dev

# 3. 安装团队配置
node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --team team-fullstack --ide claude-code
```

### 方案 B: 使用 NPX 安装（npm 社区版本）

```bash
# 回到测试目录
cd ~/orchestrix-ide-test

# 使用已发布的版本（用于对比测试）
npx orchestrix install --ide claude-code
```

## 📋 验证检查清单

### Claude Code 验证

#### 1. SubAgent 模式检查

```bash
# 检查 SubAgent 目录结构
ls -la .claude/agents/

# 验证 SubAgent 文件格式
head -20 .claude/agents/dev.md
```

**预期结果**:

```markdown
---
name: dev
description: "Use for code implementation, debugging, refactoring, and development best practices"
tools: Read, Edit, MultiEdit, Write, Bash, WebSearch
---

# Orchestrix 开发工程师 Agent - Dev

You are Dev, the Orchestrix 开发工程师 agent. You are a 软件开发工程师.

## CRITICAL INITIALIZATION

When invoked, IMMEDIATELY:

1. Understand you are operating within the Orchestrix framework
2. Check for `.orchestrix-core/` directory structure
3. Load any active story in `docs/stories/` directory (check status != "Done")
   ...
```

#### 2. Command 模式检查

```bash
# 检查 Command 目录结构
ls -la .claude/commands/core/agents/
ls -la .claude/commands/core/tasks/

# 验证命令文件内容
head -10 .claude/commands/core/agents/dev.md
```

**预期结果**:

```markdown
# /dev Command

When this command is used, adopt the following agent persona:

# dev

ACTIVATION-PROTOCOL: You are now the Orchestrix Full Stack Developer...
```

### Cursor 验证

#### MDC 文件检查

```bash
# 检查 Cursor 规则目录
ls -la .cursor/rules/

# 验证 MDC 文件格式
head -15 .cursor/rules/dev.mdc
```

**预期结果**:

```markdown
---
description: "Use for code implementation, debugging, refactoring, and development best practices"
globs: []
alwaysApply: false
---

# DEV Agent Rule

This rule is triggered when the user types `@dev` and activates the 开发工程师 agent persona.

## Agent Activation

CRITICAL: Read the full YAML, start activation to alter your state of being...
```

## 🧪 详细验证脚本

创建专用的测试脚本：

````bash
# 创建验证脚本
cat > ~/orchestrix-ide-test/verify-installation.sh << 'EOF'
#!/bin/bash

# Orchestrix IDE Installation Verification Script
echo "🔍 Orchestrix IDE Installation Verification"
echo "============================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description: $file${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: $file (NOT FOUND)${NC}"
        return 1
    fi
}

check_directory() {
    local dir="$1"
    local description="$2"

    if [ -d "$dir" ]; then
        local count=$(ls -1 "$dir" 2>/dev/null | wc -l)
        echo -e "${GREEN}✅ $description: $dir ($count files)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: $dir (NOT FOUND)${NC}"
        return 1
    fi
}

check_file_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ $description: Pattern found${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Pattern not found in $file${NC}"
        return 1
    fi
}

# 主要检查项目
echo -e "\n${BLUE}📁 基础目录结构检查${NC}"
check_directory ".orchestrix-core" "核心框架目录"
check_directory ".orchestrix-core/agents" "代理目录"
check_directory ".orchestrix-core/tasks" "任务目录"

echo -e "\n${BLUE}🤖 Claude Code 检查${NC}"
if [ -d ".claude" ]; then
    check_directory ".claude/agents" "SubAgent 目录"
    check_directory ".claude/commands" "Command 目录"

    # 检查 SubAgent 文件
    if [ -f ".claude/agents/dev.md" ]; then
        check_file_content ".claude/agents/dev.md" "name: dev" "SubAgent YAML frontmatter"
        check_file_content ".claude/agents/dev.md" "tools:" "SubAgent tools 配置"
        check_file_content ".claude/agents/dev.md" "description:" "SubAgent description"
    fi

    # 检查 Command 文件
    if [ -f ".claude/commands/core/agents/dev.md" ]; then
        check_file_content ".claude/commands/core/agents/dev.md" "/dev Command" "Command 标题"
        check_file_content ".claude/commands/core/agents/dev.md" "adopt the following agent persona" "Command 说明"
    fi
else
    echo -e "${YELLOW}⚠️  Claude Code 未安装${NC}"
fi

echo -e "\n${BLUE}🎯 Cursor 检查${NC}"
if [ -d ".cursor" ]; then
    check_directory ".cursor/rules" "Cursor 规则目录"

    # 检查 MDC 文件
    if [ -f ".cursor/rules/dev.mdc" ]; then
        check_file_content ".cursor/rules/dev.mdc" "description:" "MDC description 字段"
        check_file_content ".cursor/rules/dev.mdc" "globs: \[\]" "MDC globs 配置"
        check_file_content ".cursor/rules/dev.mdc" "Agent Activation" "MDC 激活说明"
    fi
else
    echo -e "${YELLOW}⚠️  Cursor 未安装${NC}"
fi

echo -e "\n${BLUE}🔧 内容质量检查${NC}"

# 检查是否有空的占位符
echo -e "\n${YELLOW}🔍 检查空占位符${NC}"
find . -name "*.md" -path "./.claude/*" -o -path "./.cursor/*" | while read file; do
    if grep -q "{[A-Z_]*}" "$file" 2>/dev/null; then
        echo -e "${RED}❌ 发现未替换的占位符: $file${NC}"
        grep -n "{[A-Z_]*}" "$file" | head -3
    fi
done

# 检查路径引用
echo -e "\n${YELLOW}🔍 检查路径引用${NC}"
find . -name "*.md" -path "./.claude/*" -o -path "./.cursor/*" | while read file; do
    if grep -q "{root}" "$file" 2>/dev/null; then
        echo -e "${RED}❌ 发现未替换的路径占位符: $file${NC}"
        grep -n "{root}" "$file" | head -3
    fi
done

# 检查 YAML 格式
echo -e "\n${YELLOW}🔍 检查 YAML 格式${NC}"
if command -v node >/dev/null 2>&1; then
    find . -name "*.md" -path "./.claude/*" -o -path "./.cursor/*" | while read file; do
        if grep -q "```yaml" "$file"; then
            # 简单的 YAML 验证
            yaml_content=$(sed -n '/```yaml/,/```/p' "$file" | sed '1d;$d')
            if [ -n "$yaml_content" ]; then
                echo -e "${GREEN}✅ YAML 内容存在: $file${NC}"
            else
                echo -e "${RED}❌ YAML 内容为空: $file${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠️  Node.js 未安装，跳过 YAML 验证${NC}"
fi

echo -e "\n${BLUE}📊 安装总结${NC}"
echo "============================================"

# 统计文件数量
if [ -d ".claude" ]; then
    subagent_count=$(ls -1 .claude/agents/*.md 2>/dev/null | wc -l)
    command_count=$(find .claude/commands -name "*.md" 2>/dev/null | wc -l)
    echo -e "Claude Code SubAgents: ${GREEN}$subagent_count${NC}"
    echo -e "Claude Code Commands: ${GREEN}$command_count${NC}"
fi

if [ -d ".cursor" ]; then
    cursor_count=$(ls -1 .cursor/rules/*.mdc 2>/dev/null | wc -l)
    echo -e "Cursor Rules: ${GREEN}$cursor_count${NC}"
fi

core_agents=$(ls -1 .orchestrix-core/agents/*.md 2>/dev/null | wc -l)
echo -e "Core Agents: ${GREEN}$core_agents${NC}"

echo -e "\n${GREEN}🎉 验证完成！${NC}"
EOF

# 给脚本执行权限
chmod +x verify-installation.sh
````

## 🚀 完整测试工作流

### 完整的测试会话示例

```bash
# 1. 创建测试环境
mkdir ~/orchestrix-test-$(date +%Y%m%d-%H%M%S)
cd ~/orchestrix-test-$(date +%Y%m%d-%H%M%S)

# 2. 安装 Claude Code（完整安装）
echo "=== 测试 Claude Code 完整安装 ==="
npx orchestrix install --ide claude-code

# 3. 运行验证
./verify-installation.sh > claude-code-results.txt

# 4. 清理并测试 Cursor
rm -rf .claude .orchestrix-core
echo "=== 测试 Cursor 单个 agent ==="
npx orchestrix install --ide cursor --agent dev

# 5. 再次验证
./verify-installation.sh > cursor-results.txt

# 6. 查看结果
echo "=== Claude Code 结果 ==="
cat claude-code-results.txt

echo "=== Cursor 结果 ==="
cat cursor-results.txt
```

## 🔍 问题排查

### 常见问题和解决方案

#### 问题 1: 安装失败

```bash
# 检查 npm 权限
npm config get prefix
npm config get cache

# 清理缓存重试
npm cache clean --force
npx orchestrix install --ide claude-code --verbose
```

#### 问题 2: 生成的文件有问题

```bash
# 检查特定文件内容
cat .claude/agents/dev.md | head -50
cat .cursor/rules/dev.mdc | head -50

# 检查是否有错误占位符
grep -r "{[A-Z_]*}" .claude/ .cursor/ || echo "无未替换占位符"
```

#### 问题 3: 文件结构不正确

```bash
# 查看完整目录结构
tree -a . || find . -type f | sort

# 检查权限
ls -la .claude/ .cursor/ .orchestrix-core/
```

## 📈 性能基准测试

```bash
# 创建性能测试脚本
cat > performance-test.sh << 'EOF'
#!/bin/bash

echo "🚀 Orchestrix 安装性能测试"

for ide in claude-code cursor; do
    for i in {1..3}; do
        echo "测试 $ide - 第 $i 次"
        rm -rf .claude .cursor .orchestrix-core

        start_time=$(date +%s.%N)
        npx orchestrix install --ide $ide --quiet
        end_time=$(date +%s.%N)

        duration=$(echo "$end_time - $start_time" | bc)
        echo "$ide 安装时间: ${duration}s"
    done
done
EOF

chmod +x performance-test.sh
./performance-test.sh
```

## 🎯 自动化测试集成

将测试集成到 CI/CD 中：

```bash
# 创建 CI 测试脚本
cat > ci-test.sh << 'EOF'
#!/bin/bash
set -e

echo "🤖 CI/CD 自动化测试"

# 测试所有 IDE
for ide in claude-code cursor windsurf; do
    echo "测试 $ide..."

    # 清理
    rm -rf .claude .cursor .windsurf .orchestrix-core

    # 安装
    npx orchestrix install --ide $ide

    # 验证
    if ! ./verify-installation.sh; then
        echo "❌ $ide 测试失败"
        exit 1
    fi

    echo "✅ $ide 测试通过"
done

echo "🎉 所有测试通过！"
EOF
```

使用这个指南，你就可以在任何新目录中完整测试 Orchestrix 的 IDE 安装功能，并验证生成的 agent 内容是否符合预期！
