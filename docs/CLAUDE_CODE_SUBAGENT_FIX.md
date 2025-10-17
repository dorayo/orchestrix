# Claude Code Subagent 识别问题修复

## 问题描述

在 `modern-saas-boilerplate` 项目中安装 Orchestrix 后，自动生成的 Claude Code subagent 文件（sm、dev、architect、qa 等）无法被 Claude Code 识别，但手动创建的 `deployment-orchestrator.md` 可以被正常识别。

## 根本原因

通过对比分析发现，问题出在 **frontmatter 格式不兼容**：

### ❌ 自动生成的文件（无法识别）

```yaml
---
ID: sm
Icon: 🏃
When To Use: Story creation, epic mgmt, retrospectives, agile guidance
Tools: Read, Edit, MultiEdit, Write
Persona: Technical SM - Story Prep Specialist
Style: Task-oriented, efficient, precise
Identity: Story expert for AI dev agents
Focus: Crystal-clear stories for AI implementation
Customization:
  - "All tech details MUST reference architecture docs with [Source: ...] format"
  - "Story preparation only - never implement code"
---
```

### ✅ 手动创建的文件（可以识别）

```yaml
---
name: deployment-orchestrator
description: Use this agent when the user needs assistance with deploying the project...
model: sonnet
color: cyan
---
```

## Claude Code 的 Subagent 识别规范

经过分析手动创建的文件，Claude Code 识别 subagent 需要以下 frontmatter 字段：

### 必需字段：

- **`name`**: agent 的唯一标识符
- **`description`**: agent 的详细描述和使用场景

### 可选字段：

- **`model`**: 推荐的模型（opus, sonnet, sonnet-3.7 等）
- **`color`**: UI 中显示的颜色标识

### 不应出现的字段：

- `ID`, `Icon`, `When To Use`, `Tools`, `Persona`, `Style`, `Identity`, `Focus`, `Customization`（这些是 Orchestrix 内部使用的字段）

## 修复方案

### 1. 更新模板文件

修改 `/tools/installer/templates/orchestrix-subagent-structured-template.md`：

**修改前：**

```yaml
---
ID: {{agent.id}}
Icon: {{agent.icon}}
When To Use: {{agent.whenToUse}}
Tools: {{agent.tools[]}}
Persona: {{agent.persona.role}}
Style: {{agent.persona.style}}
Identity: {{agent.persona.identity}}
Focus: {{agent.persona.focus}}
{{?agent.customization}}Customization: {{agent.customization[]}}{{/agent.customization}}
---
```

**修改后：**

```yaml
---
name: { { agent.id } }
description: { { agent.whenToUse } }
model: { { agent.model | sonnet } }
color: { { agent.color | blue } }
---
```

### 2. 支持默认值语法

修改 `ide-setup.js` 中的 `resolveTemplatePath` 方法，支持 `{{field | default}}` 语法：

```javascript
// Handle conditional paths with | separator (fallback/default values)
if (path.includes(" | ")) {
  const paths = path.split(" | ").map((p) => p.trim());
  for (const p of paths) {
    // Check if this is a plain value (not a path)
    if (!p.includes(".") && !p.includes("[")) {
      // This is a default value, return it directly
      return p;
    }
    const value = this.resolveTemplatePath(p, data, agentId);
    if (value && value !== "") {
      return value;
    }
  }
  return "";
}
```

### 3. 添加 model 和 color 映射

在 `ide-setup.js` 中添加两个新方法：

```javascript
// Get recommended model for each agent type
getAgentModel(agentId) {
  const modelMap = {
    'orchestrix-master': 'opus',
    'orchestrix-orchestrator': 'opus',
    'qa': 'opus',
    'sm': 'opus',
    'architect': 'sonnet',
    'analyst': 'sonnet',
    'pm': 'sonnet',
    'dev': 'sonnet-3.7',
    'po': 'sonnet-3.7',
    'ux-expert': 'sonnet-3.7'
  };
  return modelMap[agentId] || 'sonnet';
}

// Get color for each agent type
getAgentColor(agentId) {
  const colorMap = {
    'orchestrix-master': 'purple',
    'orchestrix-orchestrator': 'pink',
    'qa': 'red',
    'sm': 'orange',
    'architect': 'cyan',
    'analyst': 'blue',
    'pm': 'green',
    'dev': 'teal',
    'po': 'yellow',
    'ux-expert': 'magenta'
  };
  return colorMap[agentId] || 'blue';
}
```

### 4. 更新 metadata 提取逻辑

修改 `extractAgentMetadataRobust` 和 `getDefaultMetadata` 方法，确保 model 和 color 字段被包含在 metadata 和 agent 对象中。

## 测试方法

使用提供的测试脚本验证修复：

```bash
cd /Users/dorayo/Codes/Orchestrix
chmod +x tools/test-claude-code-fix.js
node tools/test-claude-code-fix.js
```

测试脚本会：

1. 在 `modern-saas-boilerplate` 中重新安装 orchestrix
2. 检查生成的 subagent 文件格式
3. 验证必需字段是否存在
4. 确认旧字段已被移除
5. 与手动创建的文件进行对比

## 验证步骤

1. **重新安装 Orchestrix**

   ```bash
   cd ~/Codes/modern-saas-boilerplate
   orchestrix install --ide claude-code
   ```

2. **检查生成的文件**

   ```bash
   head -20 .claude/agents/sm.md
   head -20 .claude/agents/dev.md
   ```

3. **验证 frontmatter 格式**
   确保生成的文件包含：
   - ✅ `name` 字段
   - ✅ `description` 字段
   - ✅ `model` 字段
   - ✅ `color` 字段
   - ❌ 不包含 `ID`, `Icon`, `When To Use` 等旧字段

4. **在 Claude Code 中测试**
   - 重启 Claude Code
   - 打开项目
   - 检查 agent 选择器中是否出现 sm、dev、architect、qa 等 agent
   - 尝试激活并使用这些 agent

## Agent 模型和颜色配置

| Agent                   | Model      | Color   | 说明                   |
| ----------------------- | ---------- | ------- | ---------------------- |
| orchestrix-master       | opus       | purple  | 终极决策者，最强智能   |
| orchestrix-orchestrator | opus       | pink    | 编排专家，协调多 agent |
| qa                      | opus       | red     | 质量守门员，强推理     |
| sm                      | opus       | orange  | Story 质量核心         |
| architect               | sonnet     | cyan    | 系统设计专家           |
| analyst                 | sonnet     | blue    | 战略洞察分析           |
| pm                      | sonnet     | green   | 产品战略规划           |
| dev                     | sonnet-3.7 | teal    | 执行专家，高效实现     |
| po                      | sonnet-3.7 | yellow  | 需求整理管理           |
| ux-expert               | sonnet-3.7 | magenta | 设计建议支持           |

## 预期效果

修复后，自动生成的 subagent 文件应该：

1. ✅ 使用 Claude Code 兼容的 frontmatter 格式
2. ✅ 包含清晰的 `name` 和 `description` 字段
3. ✅ 包含适合的 `model` 推荐
4. ✅ 包含可识别的 `color` 标识
5. ✅ 能够在 Claude Code 的 agent 选择器中显示
6. ✅ 能够被正常激活和使用

## 相关文件

- 模板文件: `/tools/installer/templates/orchestrix-subagent-structured-template.md`
- 安装逻辑: `/tools/installer/lib/ide-setup.js`
- 测试脚本: `/tools/test-claude-code-fix.js`
- 配置文件: `/tools/installer/config/ide-agent-config.yaml`

## 后续优化建议

1. **Description 格式优化**
   - 当前 description 直接使用 `whenToUse` 字段
   - 可以考虑生成更详细的描述，包含使用场景示例

2. **动态 model 选择**
   - 考虑从 agent 配置文件中读取推荐模型
   - 允许用户自定义每个 agent 的模型偏好

3. **Color 主题支持**
   - 支持多套颜色主题
   - 允许用户自定义 agent 颜色

4. **自动化测试**
   - 将 frontmatter 格式验证加入 CI/CD
   - 确保模板修改不会破坏 Claude Code 兼容性

## 总结

这次修复解决了 Claude Code subagent 识别问题的根本原因：frontmatter 格式不兼容。通过将内部使用的详细字段（ID, Icon, Tools 等）简化为 Claude Code 期望的简洁格式（name, description, model, color），生成的 subagent 文件现在可以被 Claude Code 正确识别和使用。

所有 Orchestrix 的内部元数据和详细配置仍然保留在文件内容中（frontmatter 之后的部分），确保功能不受影响。
