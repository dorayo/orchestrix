# 🎯 Agent功能增强修改手册

## 📋 标准流程总览

任何agent功能增强都需要遵循**5层修改体系**，确保功能完整性、版本同步和IDE兼容性。

## 🔧 修改层次架构

### 层次1: 核心定义层

**文件**: `orchestrix-core/agents/{agent-id}.md`

#### 必改内容

```yaml
# 1. 命令扩展
commands:
  - {现有命令}: {描述} + 新增功能描述
  - {新命令}: 执行{新任务文件}

# 2. 依赖扩展
dependencies:
  tasks:
    - {existing-task}.md
    - {new-task}.md  # 新增任务
  data:
    - {new-data-file}.md  # 如有新数据依赖
  templates:
    - {new-template}.yaml  # 如有新模板
```

#### 修改检查清单

- [ ] 命令描述已更新包含新功能
- [ ] 新增任务已加入依赖列表
- [ ] 工具权限已扩展（如有需要）

### 层次2: 任务实现层

**文件**: `orchestrix-core/tasks/{new-task}.md`

#### 任务模板结构

````markdown
# {Task Name} (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE

### Immediate Action Protocol

1. **Auto-Detect**: 自动检测触发条件
2. **Auto-Validate**: 执行验证逻辑
3. **Auto-Report**: 生成结果报告
4. **Auto-Handle**: 错误处理和恢复

### Non-Negotiable Requirements

- ✅ MUST {具体要求1}
- ✅ MUST {具体要求2}
- ✅ MUST {具体要求3}

### Auto-Halt Conditions

- ❌ {错误条件1} → Report and halt
- ❌ {错误条件2} → Report and halt

### Auto-Validation Sequence

1. **检测阶段**: {具体检测步骤}
2. **验证阶段**: {具体验证步骤}
3. **报告阶段**: {具体报告步骤}

### Automated Reporting Template

```markdown
## {Agent} Results

### {功能名称}

- {检查结果1}
- {检查结果2}
- {检查结果3}
```
````

````

### 层次3: 工作流集成层
**文件**: `orchestrix-core/tasks/{workflow-task}.md`

#### 集成位置
- **review-story.md**: 用于story review工作流
- **review-code-auto.md**: 用于代码review工作流
- **validate-{type}-auto.md**: 用于特定验证工作流

#### 集成格式
```markdown
## Automated Validation Integration

During the review process, automatically execute:
1. **{new-validation-task}.md** - {描述} ({优先级/层级})
2. **{existing-task}.md** - {描述}
3. **{next-task}.md** - {描述}
````

### 层次4: IDE配置层

#### Claude Code 命令模式

**文件**: `.claude/commands/Orchestrix/agents/{agent}.md`

```yaml
commands:
  - { command }: execute comprehensive workflow including {all-tasks}
  - validate {type}: execute specific validation task where type can be '{new-type}'

dependencies:
  tasks:
    - { all-tasks-including-new }
```

#### Claude Code 子代理模式

**文件**: `.claude/agents/{agent}.md`

```yaml
**Tasks**:
- `{task}.md` → `.orchestrix-core/tasks/{task}.md`
- `{new-task}.md` → `.orchestrix-core/tasks/{new-task}.md`

**Execution Sequence**:
```

1. Load story file to review
2. {new-validation-step} ({priority}验证)
3. {existing-step} ({description})
4. {next-step} ({description})

````

#### Cursor IDE
**文件**: `.cursor/rules/{agent}.mdc`

```yaml
dependencies:
  tasks:
    - {all-tasks-including-new}
````

### 层次5: 版本同步层

#### 版本同步系统

**文件**: `tools/lib/version-sync.js`

#### 自动更新内容

- 代理定义文件的版本同步
- IDE配置文件的自动更新
- 依赖关系的重新解析

## 📂 修改清单模板

### 核心文件清单

```
必须修改的文件:
├── 核心定义层 (1个文件)
│   └── orchestrix-core/agents/{agent}.md
├── 任务实现层 (1个文件)
│   └── orchestrix-core/tasks/{new-task}.md
├── 工作流集成层 (1-3个文件)
│   ├── orchestrix-core/tasks/review-story.md
│   ├── orchestrix-core/tasks/review-code-auto.md
│   └── orchestrix-core/tasks/validate-{type}-auto.md
├── IDE配置层 (3个文件)
│   ├── .claude/commands/Orchestrix/agents/{agent}.md
│   ├── .claude/agents/{agent}.md
│   └── .cursor/rules/{agent}.mdc
└── 版本同步层 (1个文件)
    └── tools/lib/version-sync.js
```

### 安装脚本增强

**文件**: `tools/installer/lib/ide-setup.js`

#### 关键更新点

1. **YAML解析增强**: 支持新任务依赖提取
2. **版本同步**: 自动同步代理版本变化
3. **IDE配置**: 自动更新所有IDE配置

## 🔄 版本发布流程

### 标准发布步骤

#### 1. 版本确认

```bash
# 确定新版本号
node tools/release-exact.js {version}
```

#### 2. 文件检查

```bash
# 检查所有文件版本同步
node tools/lib/version-sync.js check
```

#### 3. 发布执行

```bash
# 自动更新所有版本文件
node tools/release-exact.js 4.1.3
```

### 自动同步检查

确保安装脚本包含：

- 新任务文件自动部署
- IDE配置自动更新
- 版本号自动传播

## 📋 增强功能验证清单

### 安装验证

- [ ] 所有任务文件正确安装
- [ ] 所有IDE配置同步更新
- [ ] 版本号一致性验证
- [ ] 向后兼容性确认

### 功能验证

- [ ] 新命令可用性测试
- [ ] 验证序列逻辑正确
- [ ] 多IDE环境测试
- [ ] 版本同步验证

## 🎯 快速检查表

### 每次agent增强后必查

1. ✅ 核心agent.md已更新
2. ✅ 新任务.md已创建
3. ✅ 工作流.md已集成
4. ✅ Claude命令模式已更新
5. ✅ Claude子代理已更新
6. ✅ Cursor规则已更新
7. ✅ 版本同步系统已增强
8. ✅ 安装脚本已测试

### 安装测试命令

```bash
# 快速验证
npx orchestrix install --dry-run

# 完整测试
npx orchestrix install
```

## 📊 版本管理

### 版本号策略

- **主版本**: 重大功能变更
- **次版本**: 新agent或功能增强
- **修订版本**: 修复和优化

### 更新标记

- **feat**: 新功能增强
- **fix**: 问题修复
- **docs**: 文档更新

## 🚀 使用手册

### AI增强助手使用

```
# 当需要增强agent时，AI应执行：
1. 分析需求 → 确定修改层次
2. 生成任务 → 创建新任务文件
3. 更新配置 → 所有层次同步
4. 版本同步 → 确保一致性
5. 测试验证 → 完整安装测试
```

### 快速启动模板

```bash
# 创建新agent增强
node tools/create-agent-enhancement.js {agent-name} {enhancement-description}
```

## 📄 附录

### 标准任务文件模板

```
# 保存为: tools/templates/task-enhancement-template.md
# 用于快速创建新验证任务
```

### 版本同步配置模板

```javascript
// 保存为: tools/templates/version-sync-template.js
// 用于快速添加版本同步支持
```

---

**使用此手册，任何AI都能正确、完整地实现agent功能增强！**
