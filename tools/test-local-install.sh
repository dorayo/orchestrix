#!/bin/bash

# Local Orchestrix Installation Test Script
# 使用本地开发版本测试 IDE 安装功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRIX_ROOT="$(dirname "$SCRIPT_DIR")"
LOCAL_INSTALLER="$ORCHESTRIX_ROOT/tools/installer/bin/orchestrix.js"

echo -e "${BOLD}${BLUE}🚀 Orchestrix 本地开发版本安装测试${NC}"
echo -e "${BLUE}=======================================${NC}"

# 检查本地安装器是否存在
if [ ! -f "$LOCAL_INSTALLER" ]; then
    echo -e "${RED}❌ 错误: 本地安装器未找到${NC}"
    echo -e "${RED}   路径: $LOCAL_INSTALLER${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 本地安装器路径: $LOCAL_INSTALLER${NC}"

# 显示用法
show_usage() {
    echo -e "\n${BOLD}用法:${NC}"
    echo -e "  ./test-local-install.sh <test-directory> <ide> [options]"
    echo -e "\n${BOLD}参数:${NC}"
    echo -e "  test-directory  测试目录路径"
    echo -e "  ide             IDE 类型 (claude-code, cursor, windsurf)"
    echo -e "  options         可选：--full (完整安装) 或 --interactive (交互模式)"
    echo -e "\n${BOLD}示例:${NC}"
    echo -e "  ./test-local-install.sh ~/test-claude claude-code"
    echo -e "  ./test-local-install.sh ~/test-cursor cursor --full"
    echo -e "  ./test-local-install.sh ~/test-all claude-code --interactive"
}

# 检查参数
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ 参数不足${NC}"
    show_usage
    exit 1
fi

TEST_DIR="$1"
IDE="$2"
OPTIONS="${@:3}"  # 获取所有剩余参数作为选项

# 验证 IDE 类型
case "$IDE" in
    claude-code|cursor|windsurf)
        ;;
    *)
        echo -e "${RED}❌ 不支持的 IDE: $IDE${NC}"
        echo -e "${YELLOW}支持的 IDE: claude-code, cursor, windsurf${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}📁 测试配置:${NC}"
echo -e "   测试目录: $TEST_DIR"
echo -e "   IDE: $IDE"
echo -e "   选项: ${OPTIONS:-"默认"}"

# 创建测试目录
echo -e "\n${BLUE}📋 创建测试环境...${NC}"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 初始化项目
echo '{"name": "orchestrix-test", "version": "1.0.0", "private": true}' > package.json

# 构建安装命令
INSTALL_CMD="node '$LOCAL_INSTALLER' install --ide $IDE"
if [ -n "$OPTIONS" ]; then
    INSTALL_CMD="$INSTALL_CMD $OPTIONS"
fi

echo -e "\n${BLUE}🔧 运行安装命令:${NC}"
echo -e "${YELLOW}$INSTALL_CMD${NC}"

# 执行安装
if eval $INSTALL_CMD; then
    echo -e "\n${GREEN}✅ 安装完成${NC}"
else
    echo -e "\n${RED}❌ 安装失败${NC}"
    exit 1
fi

# 验证安装结果
echo -e "\n${BLUE}🔍 验证安装结果...${NC}"

# 检查基础目录
if [ -d ".orchestrix-core" ]; then
    echo -e "${GREEN}✅ .orchestrix-core 目录存在${NC}"
    CORE_AGENTS=$(ls .orchestrix-core/agents/*.md 2>/dev/null | wc -l)
    echo -e "   核心 agents: $CORE_AGENTS 个"
else
    echo -e "${RED}❌ .orchestrix-core 目录不存在${NC}"
fi

# IDE 特定检查
case "$IDE" in
    claude-code)
        if [ -d ".claude" ]; then
            echo -e "${GREEN}✅ .claude 目录存在${NC}"
            
            if [ -d ".claude/agents" ]; then
                SUBAGENT_COUNT=$(ls .claude/agents/*.md 2>/dev/null | wc -l)
                echo -e "   SubAgents: $SUBAGENT_COUNT 个"
                
                # 检查第一个 SubAgent 文件的质量
                FIRST_SUBAGENT=$(ls .claude/agents/*.md 2>/dev/null | head -1)
                if [ -n "$FIRST_SUBAGENT" ]; then
                    echo -e "\n${BLUE}📄 检查 SubAgent 文件质量:${NC}"
                    
                    # 检查 YAML frontmatter
                    if head -5 "$FIRST_SUBAGENT" | grep -q "^name:"; then
                        echo -e "${GREEN}✅ YAML frontmatter 存在${NC}"
                    else
                        echo -e "${RED}❌ YAML frontmatter 缺失${NC}"
                    fi
                    
                    # 检查 description
                    if head -10 "$FIRST_SUBAGENT" | grep -q "^description:.*[^[:space:]]"; then
                        echo -e "${GREEN}✅ Description 字段有内容${NC}"
                    else
                        echo -e "${RED}❌ Description 字段为空${NC}"
                    fi
                    
                    # 检查未替换的占位符
                    if grep -q "{[A-Z_]*}" "$FIRST_SUBAGENT"; then
                        echo -e "${RED}❌ 发现未替换的占位符${NC}"
                        grep -n "{[A-Z_]*}" "$FIRST_SUBAGENT" | head -3
                    else
                        echo -e "${GREEN}✅ 无未替换的占位符${NC}"
                    fi
                fi
            fi
            
            if [ -d ".claude/commands" ]; then
                COMMAND_COUNT=$(find .claude/commands -name "*.md" 2>/dev/null | wc -l)
                echo -e "   Commands: $COMMAND_COUNT 个"
            fi
        else
            echo -e "${RED}❌ .claude 目录不存在${NC}"
        fi
        ;;
        
    cursor)
        if [ -d ".cursor" ]; then
            echo -e "${GREEN}✅ .cursor 目录存在${NC}"
            
            if [ -d ".cursor/rules" ]; then
                RULE_COUNT=$(ls .cursor/rules/*.mdc 2>/dev/null | wc -l)
                echo -e "   Rules: $RULE_COUNT 个"
                
                # 检查第一个 MDC 文件的质量
                FIRST_RULE=$(ls .cursor/rules/*.mdc 2>/dev/null | head -1)
                if [ -n "$FIRST_RULE" ]; then
                    echo -e "\n${BLUE}📄 检查 MDC 文件质量:${NC}"
                    
                    # 检查 description
                    if head -10 "$FIRST_RULE" | grep -q "^description:.*[^[:space:]]"; then
                        echo -e "${GREEN}✅ Description 字段有内容${NC}"
                    else
                        echo -e "${RED}❌ Description 字段为空${NC}"
                    fi
                    
                    # 检查 YAML 内容
                    if grep -q "```yaml" "$FIRST_RULE" && grep -q "agent:" "$FIRST_RULE"; then
                        echo -e "${GREEN}✅ YAML 配置存在${NC}"
                    else
                        echo -e "${RED}❌ YAML 配置缺失${NC}"
                    fi
                    
                    # 检查未替换的路径
                    if grep -q "{root}" "$FIRST_RULE"; then
                        echo -e "${RED}❌ 发现未替换的路径占位符${NC}"
                        grep -n "{root}" "$FIRST_RULE" | head -3
                    else
                        echo -e "${GREEN}✅ 无未替换的路径占位符${NC}"
                    fi
                fi
            fi
        else
            echo -e "${RED}❌ .cursor 目录不存在${NC}"
        fi
        ;;
esac

# 显示目录结构
echo -e "\n${BLUE}📁 生成的目录结构:${NC}"
tree -a -L 3 . 2>/dev/null || find . -type d | head -20

# 提供下一步建议
echo -e "\n${BLUE}💡 下一步建议:${NC}"
echo -e "1. 检查生成的文件内容:"
case "$IDE" in
    claude-code)
        echo -e "   ${YELLOW}head -30 .claude/agents/dev.md${NC}"
        echo -e "   ${YELLOW}head -20 .claude/commands/core/agents/dev.md${NC}"
        ;;
    cursor)
        echo -e "   ${YELLOW}head -30 .cursor/rules/dev.mdc${NC}"
        ;;
esac

echo -e "2. 查看完整目录结构:"
echo -e "   ${YELLOW}tree -a .${NC}"

echo -e "3. 清理测试目录:"
echo -e "   ${YELLOW}rm -rf $TEST_DIR${NC}"

echo -e "\n${GREEN}🎉 测试完成！${NC}"
