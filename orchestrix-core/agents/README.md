# Agent Configuration Files

## 文件说明

所有 agent 配置都是独立的 `.yaml` 文件，可以直接编辑：

### 核心 Agent 文件
- `analyst.yaml` - 分析师 agent
- `pm.yaml` - 产品经理 agent
- `ux-expert.yaml` - UX 专家 agent
- `architect.yaml` - 架构师 agent
- `po.yaml` - 产品负责人 agent
- `sm.yaml` - Scrum Master agent
- `dev.yaml` - 开发者 agent
- `qa.yaml` - QA agent
- `decision-evaluator.yaml` - 决策评估器 agent
- `orchestrix-orchestrator.yaml` - 协调器 agent
- `orchestrix-master.yaml` - 主控 agent

## 文件结构

每个 agent `.yaml` 文件包含以下标准部分：

```yaml
request_resolution:     # 请求匹配策略
ide_file_resolution:    # IDE 文件路径映射
activation_instructions: # 激活时的行为
agent:                  # Agent 身份定义
workflow_rules:         # 工作流规则
commands:               # 可用命令
dependencies:           # 依赖的任务/模板/数据
```

## 工作流程

### 修改 Agent
1. 直接编辑对应的 `.yaml` 文件
2. 保存文件
3. 提交到 git

### 添加新 Agent
1. 创建新的 `new-agent.yaml` 文件
2. 参考现有 agent 的结构填写所有必需部分
3. 确保包含 `request_resolution`、`ide_file_resolution`、`activation_instructions`、`workflow_rules` 等标准配置
4. 提交到 git

## 安装流程

安装器会处理 agent 文件的复制：
1. 用户运行 `npx orchestrix install`
2. 安装器复制所有 `.yaml` 文件到用户的 `.orchestrix-core/agents/`
3. 复制时会将 `{root}` 替换为实际路径
4. LLM 读取用户目录中的 `.yaml` 文件

## 注意事项

- ✅ 所有 agent 都是独立的完整配置文件
- ✅ 可以直接编辑任何 agent 文件
- ✅ 标准化的激活输出格式（markdown 表格）
- ✅ 统一的工作流规则和 handoff 协议
