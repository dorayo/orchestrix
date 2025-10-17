# Agent Configuration Files

## 文件说明

### 源文件 (.src.yaml)
这些是开发时编辑的文件，包含 `$include` 指令来引用公共配置：
- `sm.src.yaml` - Scrum Master agent 源文件
- `dev.src.yaml` - Developer agent 源文件  
- `architect.src.yaml` - Architect agent 源文件
- `qa.src.yaml` - QA agent 源文件

### 编译后文件 (.yaml)
这些是自动生成的完整配置文件，包含所有合并后的内容：
- `sm.yaml` - 完整的 SM agent 配置
- `dev.yaml` - 完整的 Dev agent 配置
- `architect.yaml` - 完整的 Architect agent 配置
- `qa.yaml` - 完整的 QA agent 配置

**⚠️ 不要直接编辑 .yaml 文件！** 它们会在编译时被覆盖。

### 公共配置
- `common/common-agent-config.yaml` - 所有 agent 共享的配置
- `common/common-workflow-rules.yaml` - 所有 agent 共享的工作流规则

### 其他 Agent
其他 agent 文件（analyst.yaml, pm.yaml 等）不使用编译系统，可以直接编辑。

## 编译命令

### 编译所有 agent
```bash
node tools/compile-agents.js compile
```

### 编译单个 agent
```bash
node tools/compile-agents.js single orchestrix-core/agents/sm.src.yaml
```

### 监听模式（开发时使用）
```bash
node tools/compile-agents.js compile --watch
```

### 只编译修改过的文件
```bash
node tools/compile-agents.js compile --changed-only
```

## 工作流程

### 修改现有 agent
1. 编辑 `.src.yaml` 文件（例如 `sm.src.yaml`）
2. 运行 `node tools/compile-agents.js compile`
3. 编译后的 `.yaml` 文件会自动更新
4. 提交 `.src.yaml` 和 `.yaml` 文件到 git

### 修改公共配置
1. 编辑 `common/common-agent-config.yaml` 或 `common/common-workflow-rules.yaml`
2. 运行 `node tools/compile-agents.js compile`
3. 所有 4 个 agent 的 `.yaml` 文件都会自动更新
4. 提交所有修改的文件到 git

### 添加新的需要编译的 agent
1. 创建 `new-agent.src.yaml` 文件
2. 添加 `$include` 指令引用公共配置
3. 运行 `node tools/compile-agents.js compile`
4. 新的 `new-agent.yaml` 会自动生成

## 文件大小对比

编译前（源文件）：
- sm.src.yaml: ~100 行
- dev.src.yaml: ~97 行
- architect.src.yaml: ~132 行
- qa.src.yaml: ~121 行
- **总计: ~450 行**

编译后（完整文件）：
- sm.yaml: ~522 行
- dev.yaml: ~519 行
- architect.yaml: ~552 行
- qa.yaml: ~543 行
- **总计: ~2136 行**

**节省**: 源文件减少了约 79% 的重复内容！

## 安装流程

安装器会自动处理编译：
1. 用户运行 `npx orchestrix install`
2. 安装器检测到 `.src.yaml` 文件
3. 自动编译生成完整的 `.yaml` 文件
4. 复制编译后的文件到用户的 `.orchestrix-core/agents/`
5. LLM 读取用户目录中的完整 `.yaml` 文件

## 注意事项

- ✅ 编译后的 `.yaml` 文件没有注释头，节省 LLM token
- ✅ 公共配置只维护一份，修改一处即可
- ✅ 其他 agent（analyst, pm 等）不受影响，保持原样
- ✅ 向后兼容：如果没有 `.src.yaml`，直接使用 `.yaml`
- ⚠️ 始终提交 `.src.yaml` 和编译后的 `.yaml` 到 git
- ⚠️ 不要手动编辑编译后的 `.yaml` 文件
