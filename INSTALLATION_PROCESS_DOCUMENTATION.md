# Orchestrix 安装过程详细文档

## 概述

本文档详细描述了 Orchestrix 框架从源代码到各种 IDE 环境的完整安装过程，包括核心组件、代理、依赖解析、模板替换和 IDE 配置生成的全流程。

## 安装架构总览

```
Source Code → Dependency Resolution → File Copy → Template Processing → IDE Configuration → Final Installation
```

## 核心目录结构

### 源目录结构 (`orchestrix-core/`)

```
orchestrix-core/
├── agents/           # 代理定义文件 (.md)
├── agent-teams/      # 代理团队配置 (.yaml)
├── templates/        # 文档模板 (.md/.yaml)
├── tasks/           # 任务工作流 (.md)
├── checklists/      # 验证检查清单 (.md)
├── workflows/       # 工作流定义 (.yaml)
├── data/           # 参考数据文件 (.md)
├── utils/          # 工具函数文件 (.md)
└── core-config.yaml # 核心配置文件
```

### 目标安装结构 (项目目录)

```
project/
├── .orchestrix-core/     # 核心框架文件
│   ├── agents/
│   ├── templates/
│   ├── tasks/
│   ├── checklists/
│   ├── workflows/
│   ├── data/
│   ├── utils/
│   └── core-config.yaml
├── .{expansion-pack-id}/ # 扩展包专用目录
└── web-bundles/         # Web 代理包
```

## 安装流程详细步骤

### 步骤 1: 安装类型检测和初始化

**文件**: `tools/installer/lib/installer.js:34-218`

1. **目录验证**: 检查目标目录是否存在，处理不存在目录的创建
2. **现有安装检测**: 检查 `.orchestrix-core/install-manifest.yaml`
3. **状态分析**: 确定是全新安装、升级还是修复
4. **扩展包检测**: 扫描 `.{pack-id}/` 目录检测已安装扩展包

### 步骤 2: 依赖解析过程

**文件**: `tools/lib/dependency-resolver.js`

#### 2.1 代理依赖解析 (`resolveAgentDependencies`)

```javascript
// 解析单个代理的所有依赖
async resolveAgentDependencies(agentId) {
  // 1. 读取代理文件内容
  // 2. 提取 YAML 配置块
  // 3. 解析 dependencies 部分
  // 4. 加载所有相关资源文件
  // 5. 返回完整的依赖关系图
}
```

**支持的依赖类型**:

- `tasks` - 任务工作流文件
- `templates` - 文档模板
- `checklists` - 验证检查清单
- `data` - 参考数据文件
- `utils` - 工具函数文件
- `workflows` - 工作流定义 (团队配置)

#### 2.2 团队依赖解析 (`resolveTeamDependencies`)

```javascript
// 解析团队配置的所有代理和资源
async resolveTeamDependencies(teamId) {
  // 1. 自动包含 orchestrix-orchestrator 代理
  // 2. 解析团队配置中的所有代理
  // 3. 支持通配符 "*" 包含所有代理
  // 4. 解析工作流依赖
  // 5. 去重所有资源
}
```

### 步骤 3: 文件复制和模板处理

**文件**: `tools/installer/lib/file-manager.js`

#### 3.1 文件复制策略

**单文件复制**:

- 使用 `copyFile()` 进行普通文件复制
- 使用 `copyFileWithRootReplacement()` 进行模板替换复制

**批量复制**:

- 使用 `copyGlobPattern()` 处理通配符模式
- 使用 `copyDirectoryWithRootReplacement()` 目录级替换

#### 3.2 模板替换机制

**替换规则**:

- 仅对 `.md`, `.yaml`, `.yml` 文件执行 `{root}` 替换
- `{root}` 被替换为目标根目录路径 (如 `.orchestrix-core`)
- 替换在复制过程中实时进行

**替换示例**:

```markdown
# 源文件内容

请参考 {root}/tasks/execute-checklist.md

# 替换后内容

请参考 .orchestrix-core/tasks/execute-checklist.md
```

### 步骤 4: 安装类型处理

#### 4.1 完整安装 (`installType: "full"`)

```javascript
// 复制整个 orchestrix-core 目录
await fileManager.copyDirectoryWithRootReplacement(sourceDir, orchestrixCoreDestDir, ".orchestrix-core");
```

#### 4.2 单代理安装 (`installType: "single-agent"`)

```javascript
// 1. 复制代理主文件
await fileManager.copyFileWithRootReplacement(agentPath, destAgentPath, ".orchestrix-core");

// 2. 解析并复制所有依赖
const dependencies = await configLoader.getAgentDependencies(config.agent);
for (const dep of dependencies) {
  // 处理每个依赖项
}
```

#### 4.3 团队安装 (`installType: "team"`)

```javascript
// 1. 复制团队配置文件
// 2. 解析团队所有代理依赖
// 3. 复制所有相关资源
```

### 步骤 5: IDE 配置生成

**文件**: `tools/installer/lib/ide-setup.js`

#### 5.1 IDE 支持矩阵

| IDE         | 配置文件               | 激活语法      | 自动执行         |
| ----------- | ---------------------- | ------------- | ---------------- |
| Claude Code | `.claude-code/agents/` | `/agent-name` | ✅ SubAgent 模式 |
| Cursor      | `.cursor/rules/`       | `@agent-name` | 手动命令         |
| Windsurf    | `.windsurf/agents/`    | `@agent-name` | 手动命令         |
| Roo Code    | 权限配置               | 模式选择器    | 手动命令         |

#### 5.2 IDE 配置生成流程

1. **读取 IDE 配置**: 从 `config/ide-configurations.yaml`
2. **代理元数据提取**: 解析代理 YAML 配置
3. **依赖映射生成**: 创建依赖关系说明
4. **配置文件生成**: 生成 IDE 特定的配置文件
5. **权限设置**: 配置工具访问权限

### 步骤 6: Web Bundle 生成

**文件**: `tools/builders/web-builder.js`

#### 6.1 Web Bundle 类型

- **单个代理包**: 包含代理 + 所有依赖资源
- **团队包**: 包含整个团队配置
- **自定义包**: 用户选择的特定代理组合

#### 6.2 Bundle 生成过程

1. **依赖解析**: 使用 `DependencyResolver`
2. **内容聚合**: 将所有资源合并到单个文件
3. **格式标准化**: 统一标记和分隔符
4. **输出生成**: 生成 `.txt` 格式的 Web 包

### 步骤 7: 清单文件和版本控制

#### 7.1 安装清单 (`install-manifest.yaml`)

```yaml
version: "1.0.0"
installed_at: "2024-01-01T00:00:00.000Z"
install_type: "single-agent"
agent: "dev"
files:
  - path: ".orchestrix-core/agents/dev.md"
    hash: "abc123def456"
    modified: false
```

#### 7.2 完整性验证

```javascript
// 检查文件完整性和修改状态
async checkFileIntegrity(installDir, manifest) {
  // 比较文件哈希值
  // 检测丢失文件
  // 记录修改状态
}
```

## 关键配置文件和路径

### 配置文件

- `orchestrix-core/core-config.yaml` - 核心框架配置
- `tools/installer/config/install.config.yaml` - 安装器配置
- `tools/installer/config/ide-configurations.yaml` - IDE 配置
- `tools/installer/config/ide-agent-config.yaml` - IDE 代理配置

### 重要路径

- `configLoader.getOrchestrixCorePath()` - 获取核心目录路径
- `path.join(installDir, ".orchestrix-core")` - 目标安装路径
- `path.join(installDir, ".{pack-id}")` - 扩展包安装路径

## 故障排查指南

### 常见问题

1. **依赖解析失败**: 检查 YAML 格式和依赖类型支持
2. **模板替换未执行**: 确认文件扩展名和替换条件
3. **IDE 配置生成错误**: 验证 IDE 配置文件和权限设置
4. **版本不一致**: 检查核心配置版本和清单文件

### 调试命令

```bash
# 检查安装完整性
npx orchestrix status

# 列出可用代理
npx orchestrix list

# 验证单个代理
debugAgent = require('./tools/lib/dependency-resolver');
const deps = await debugAgent.resolveAgentDependencies('dev');
console.log(deps);
```

## 扩展包安装流程

扩展包安装遵循类似流程，但使用专用目录结构：

```
project/
├── .game-development/    # 游戏开发扩展包
│   ├── agents/
│   ├── templates/
│   └── config.yaml
└── .orchestrix-core/    # 核心框架
```

扩展包可以覆盖核心资源，安装器会处理依赖冲突和优先级。

---

本文档提供了 Orchestrix 安装过程的完整技术参考，有助于理解安装逻辑、排查问题并进行自定义扩展。
