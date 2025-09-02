#!/bin/bash

# Orchestrix IDE Testing Demo Script
# 演示如何测试 IDE 安装功能

echo "🎬 Orchestrix IDE 测试演示"
echo "=========================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}方法一：自动化快速测试（推荐）${NC}"
echo "================================"
echo -e "${GREEN}运行命令：${NC}"
echo "node tools/quick-ide-test.js"
echo ""
echo "这会自动："
echo "  ✅ 创建临时测试目录"
echo "  ✅ 测试 Claude Code 完整安装"
echo "  ✅ 测试 Claude Code 单个 agent"
echo "  ✅ 测试 Cursor 单个 agent"
echo "  ✅ 测试 Cursor 完整安装"
echo "  ✅ 验证文件内容和格式"
echo "  ✅ 显示详细结果"
echo "  ✅ 自动清理"

echo -e "\n${BLUE}方法二：手动测试特定场景${NC}"
echo "========================="
echo -e "${GREEN}创建测试目录：${NC}"
echo "mkdir ~/my-orchestrix-test && cd ~/my-orchestrix-test"
echo ""
echo -e "${GREEN}测试 Claude Code：${NC}"
echo "node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide claude-code"
echo "ls -la .claude/agents/"
echo "head -20 .claude/agents/dev.md"
echo ""
echo -e "${GREEN}测试 Cursor：${NC}"
echo "node /Users/dorayo/Codes/Orchestrix/tools/installer/bin/orchestrix.js install --ide cursor --agent dev"
echo "ls -la .cursor/rules/"
echo "head -20 .cursor/rules/dev.mdc"

echo -e "\n${BLUE}方法三：验证脚本${NC}"
echo "================"
echo -e "${GREEN}运行验证：${NC}"
echo "node tools/validate-ide-fixes.js"
echo "node tools/validate-ide-fixes.js --ide claude-code"
echo "node tools/validate-ide-fixes.js --ide cursor --agent dev"

echo -e "\n${YELLOW}🚀 推荐的快速开始：${NC}"
echo "=================="
echo "cd /Users/dorayo/Codes/Orchestrix"
echo "node tools/quick-ide-test.js"
echo ""
echo "这将运行完整的自动化测试套件！"

echo -e "\n${YELLOW}📁 如果要保留测试目录进行手动检查：${NC}"
echo "=================================="
echo "node tools/quick-ide-test.js --no-cleanup"
echo "# 测试目录会保留在 ~/orchestrix-test-[timestamp]"

echo -e "\n${YELLOW}🔍 检查生成文件的关键点：${NC}"
echo "======================="
echo "✅ Claude Code SubAgent 文件应该有 YAML frontmatter"
echo "✅ Cursor MDC 文件应该有非空的 description 字段"
echo "✅ 所有文件都不应该包含 {PLACEHOLDER} 占位符"
echo "✅ 路径引用应该正确替换（不包含 {root}）"

echo -e "\n${GREEN}🎉 现在就试试吧！${NC}"
