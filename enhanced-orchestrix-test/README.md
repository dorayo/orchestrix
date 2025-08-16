# Orchestrix Claude Code Subagents

这些是经过完整集成的Orchestrix Claude Code Subagent文件，完全保留了原始Orchestrix工作流程。

## 📁 文件说明

### dev.md - Full Stack Developer (Jiangtao)

- **角色**: Expert Senior Software Engineer & Implementation Specialist
- **命令**: 5个 (`*help`, `*run-tests`, `*explain`, `*exit`, `*develop-story`)
- **核心原则**: 4个关键开发约束
- **推荐模型**: claude-3-7-sonnet-20250219
- **工具权限**: Read, Edit, MultiEdit, Write, Bash, WebSearch

### qa.md - Senior Developer & QA Architect (James)

- **角色**: Senior Developer & Test Architect
- **命令**: 4个 (`*help`, `*review`, `*create-doc`, `*exit`)
- **核心原则**: 10个质量保证原则
- **推荐模型**: claude-opus-4-1-20250805
- **工具权限**: Read, Edit, Write, Bash

### pm.md - Product Manager (Liangning)

- **角色**: Investigative Product Strategist & Market-Savvy PM
- **命令**: 5个 (`*help`, `*create-doc`, `*yolo`, `*doc-out`, `*exit`)
- **核心原则**: 8个产品管理原则
- **推荐模型**: claude-sonnet-4-20250514
- **工具权限**: Read, Edit, Write, Bash, WebSearch

### sm.md - Scrum Master (Bob)

- **角色**: Technical Scrum Master - Story Preparation Specialist
- **命令**: 6个 (`*help`, `*draft`, `*validate`, `*correct-course`, `*checklist`, `*exit`)
- **核心原则**: 5个Story创建原则
- **推荐模型**: claude-opus-4-20250514
- **工具权限**: Read, Write

## 🔄 使用方法

1. 将这些.md文件复制到Claude Code项目的 `.claude/agents/` 目录下
2. 在Claude Code中选择对应的subagent
3. Agent会按照完整的Orchestrix工作流程运行：
   - 执行完整的激活序列（dev: 15步，其他: 12步）
   - 使用 `*help` 查看可用命令
   - 遵循所有Orchestrix核心原则和约束
   - 按照项目的core-config.yaml规范工作

## ✨ 主要特性

✅ **完整激活序列** - 确保agent正确初始化，采用正确的persona
✅ **命令系统集成** - 包含所有\*命令和子工作流程
✅ **依赖文件系统** - tasks, templates, checklists完整映射
✅ **项目配置集成** - 自动读取并遵循core-config.yaml规范
✅ **质量门控保持** - 保留所有Orchestrix关键约束和规则
✅ **智能模型选择** - 根据workflow quality gates分配最优模型
✅ **工具权限控制** - 基于agent职责分配Claude Code工具权限

## 🎯 推荐工作流程

当你提出新项目需求时，推荐的agent协作顺序：

1. **Analysis Agent** → 深度市场研究和竞品分析
2. **PO Agent** → 创建详细的PRD文档
3. **Architect Agent** → 设计技术架构和系统设计
4. **SM Agent** → 使用`*draft`将需求分解为具体story
5. **Dev Agent** → 使用`*develop-story`逐个实现功能
6. **QA Agent** → 使用`*review`进行代码审查和质量保证

## 🚀 核心优势

- **需求追踪完整**: 从模糊想法到具体实现，每一步都有文档记录
- **质量层层把关**: 多个agent协作确保最终交付质量
- **工作流程标准化**: 每个agent都有明确的职责和标准化工作方式
- **无缝协作**: agents之间通过标准化文档和workflow进行协作

现在你的Claude Code完全支持Orchestrix工作方式！🚀
