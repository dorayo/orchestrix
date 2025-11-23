# 统一 Agent 操作验证工具

## 目的

高效验证 Agent 操作的合法性,合并权限检查和状态转换验证,减少重复文件读取。

**优化效果**:
- 只读取一次 `story-status-transitions.yaml`
- 只读取一次 Story 文件
- 一次性完成所有验证
- Token 消耗减少 ~40%

## 输入参数

```yaml
required:
  - agent_id: 当前 Agent 标识符 (sm, architect, dev, qa)
  - story_path: Story 文件路径
  - action: 正在执行的操作 (implement, review, revise, create, etc.)

optional:
  - target_status: 目标状态 (如果涉及状态转换)
  - skip_transition_check: 跳过转换验证 (默认: false)
```

## 执行流程

### Step 1: 一次性加载所有配置 (优化关键)

**读取文件** (只读一次):
1. `{root}/data/story-status-transitions.yaml` → `rules`
2. `{story_path}` → 提取 `Status` 字段 → `current_status`

**错误处理**:
- 配置文件缺失 → HALT with "FATAL: story-status-transitions.yaml not found"
- Story 文件缺失 → HALT with "ERROR: Story file not found: {story_path}"
- Status 字段缺失 → HALT with "ERROR: Story missing Status field"

### Step 2: Agent 身份验证

**验证 Agent 存在**:
```yaml
agent_exists = agent_id IN rules.permissions.keys()
```

**错误处理**:
- Agent 不存在 → FAIL with "Unknown agent: {agent_id}"
- Agent 无权限配置 → FAIL with "Agent {agent_id} has no permissions"

### Step 3: 状态合法性检查

**验证当前状态有效**:
```yaml
status_valid = current_status IN rules.statuses.keys()
```

**错误处理**:
- 状态无效 → FAIL with "Invalid status: {current_status}"
- 包含有效状态列表供参考

### Step 4: 修改权限验证

**检查 Agent 是否可以修改当前状态的 Story**:
```yaml
can_modify = current_status IN rules.permissions[agent_id].modify
```

**权限矩阵**:
| Agent | 可修改的状态 |
|-------|-------------|
| SM | Blocked, RequiresRevision |
| Architect | AwaitingArchReview, Escalated |
| Dev | Approved, TestDesignComplete, InProgress |
| QA | AwaitingTestDesign, TestDesignComplete, Review |

**权限拒绝处理**:
```yaml
if not can_modify:
  responsible_agent = rules.statuses[current_status].agent
  return FAIL with:
    error_type: UNAUTHORIZED
    error_message: "{agent_id} cannot {action} story in status {current_status}"
    responsible_agent: {responsible_agent}
    guidance: "Story is in {current_status}, managed by {responsible_agent}"
```

### Step 5: 状态转换验证 (如果提供 target_status)

**跳过条件**:
- `skip_transition_check = true`
- `target_status` 未提供

**验证转换合法性**:
```yaml
transition_key = "{current_status} -> {target_status}"
transition_allowed = transition_key IN rules.permissions[agent_id].changes
```

**检查转换是否在允许列表中**:
1. 查找 `permissions[agent_id].changes`
2. 检查是否包含 `{current_status} -> {target_status}`
3. 如果不在列表中,获取所有允许的转换

**转换拒绝处理**:
```yaml
if not transition_allowed:
  allowed_transitions = [t for t in rules.permissions[agent_id].changes if t.startswith(current_status)]
  return FAIL with:
    error_type: INVALID_TRANSITION
    error_message: "Transition {current_status} -> {target_status} not allowed for {agent_id}"
    attempted_transition: "{current_status} -> {target_status}"
    allowed_transitions: {allowed_transitions}
    guidance: "{agent_id} can only transition from {current_status} to: {allowed_targets}"
```

### Step 6: 特殊前置条件验证 (如果适用)

**检查是否有特殊验证规则**:
```yaml
transition_full_key = "{current_status}_to_{target_status}"
has_special_validation = transition_full_key IN rules.validation.special
```

**特殊验证规则示例**:
- `AwaitingArchReview -> Approved`: 必须检查 test_level = "Simple"
- `InProgress -> Blocked`: 必须检查 blocking issue 已记录
- `Review -> Escalated`: 必须检查 arch concern 已记录

**特殊验证失败处理**:
```yaml
if special_validation_failed:
  return FAIL with:
    error_type: SPECIAL_VALIDATION_FAILED
    error_message: {special_rule.error}
    required_fields: {special_rule.required}
    guidance: {special_rule.hint}
```

### Step 7: 生成验证结果

**成功场景**:
```yaml
result:
  validation: PASS
  agent: {agent_id}
  current_status: {current_status}
  action: {action}
  permitted: true
  message: "Agent {agent_id} authorized to {action} story in status {current_status}"

  # 如果提供了 target_status
  transition_valid: true
  target_status: {target_status}
  transition_message: "Transition {current_status} -> {target_status} is allowed"
  prerequisites: {list of prereq from transition rules}
```

**失败场景**:
```yaml
result:
  validation: FAIL
  agent: {agent_id}
  current_status: {current_status}
  action: {action}
  permitted: false
  error_type: {UNAUTHORIZED | INVALID_TRANSITION | SPECIAL_VALIDATION_FAILED}
  error_message: "{详细错误消息}"

  # UNAUTHORIZED 特定字段
  responsible_agent: {responsible_agent}
  guidance: "{责任 Agent 和建议操作}"

  # INVALID_TRANSITION 特定字段
  attempted_transition: "{current_status} -> {target_status}"
  allowed_transitions: [list of valid transitions]

  # SPECIAL_VALIDATION_FAILED 特定字段
  special_validation_error: "{specific error}"
  required_fields: [list of missing fields]
```

## 输出场景示例

### 场景 1: Dev 实现 Approved Story (成功)

**输入**:
```yaml
agent_id: dev
story_path: docs/dev/stories/1.1.implement-auth.md
action: implement
```

**输出**:
```yaml
result:
  validation: PASS
  agent: dev
  current_status: Approved
  action: implement
  permitted: true
  message: "Agent dev authorized to implement story in status Approved"
```

### 场景 2: Dev 尝试修改 Blocked Story (失败 - 无权限)

**输入**:
```yaml
agent_id: dev
story_path: docs/dev/stories/1.2.user-profile.md
action: implement
```

**输出**:
```yaml
result:
  validation: FAIL
  agent: dev
  current_status: Blocked
  action: implement
  permitted: false
  error_type: UNAUTHORIZED
  error_message: "dev cannot implement story in status Blocked"
  responsible_agent: SM
  guidance: "Story is in Blocked status, managed by SM. SM must revise the story first."
```

### 场景 3: Dev 完成实现并转换到 Review (成功)

**输入**:
```yaml
agent_id: dev
story_path: docs/dev/stories/1.1.implement-auth.md
action: complete_implementation
target_status: Review
```

**输出**:
```yaml
result:
  validation: PASS
  agent: dev
  current_status: InProgress
  action: complete_implementation
  permitted: true
  message: "Agent dev authorized to complete_implementation story in status InProgress"
  transition_valid: true
  target_status: Review
  transition_message: "Transition InProgress -> Review is allowed"
  prerequisites:
    - impl_done: true
    - tasks_done: true
    - tests_written: true
```

### 场景 4: QA 尝试非法转换 (失败 - 转换无效)

**输入**:
```yaml
agent_id: qa
story_path: docs/dev/stories/1.3.dashboard.md
action: mark_done
target_status: Approved
```

**输出**:
```yaml
result:
  validation: FAIL
  agent: qa
  current_status: Review
  action: mark_done
  permitted: true
  error_type: INVALID_TRANSITION
  error_message: "Transition Review -> Approved not allowed for qa"
  attempted_transition: "Review -> Approved"
  allowed_transitions:
    - "Review -> Done"
    - "Review -> InProgress"
    - "Review -> Escalated"
  guidance: "QA can only transition from Review to: Done, InProgress, or Escalated"
```

### 场景 5: Architect 违反特殊验证规则 (失败 - 特殊验证)

**输入**:
```yaml
agent_id: architect
story_path: docs/dev/stories/2.1.payment.md
action: approve_story
target_status: Approved
```

**当前 Story 的 test_level = "Standard"**

**输出**:
```yaml
result:
  validation: FAIL
  agent: architect
  current_status: AwaitingArchReview
  action: approve_story
  permitted: true
  error_type: SPECIAL_VALIDATION_FAILED
  error_message: "Cannot -> Approved with Std/Comp test level. Use AwaitingTestDesign."
  special_validation_error: "Test level is Standard, not Simple"
  required_fields: ["test_level must be Simple"]
  guidance: "For Standard/Comprehensive test levels, use AwaitingTestDesign instead of Approved"
```

## 使用示例

### 在 develop-story.md 中使用

```markdown
## Prerequisites

Execute: `{root}/tasks/utils/validate-agent-action.md`

Input:
```yaml
agent_id: dev
story_path: {story_path}
action: implement
```

If result.validation = FAIL:
  - Output result.error_message
  - Output result.guidance
  - HALT
```

### 在 qa-review-story.md 中使用 (带状态转换)

```markdown
## Validation

Execute: `{root}/tasks/utils/validate-agent-action.md`

Input:
```yaml
agent_id: qa
story_path: {story_path}
action: review
target_status: Done
```

If result.validation = FAIL:
  - Log result.error_message
  - If error_type = INVALID_TRANSITION:
    - Output result.allowed_transitions
  - HALT
```

### 在 create-next-story.md 中使用 (只验证权限)

```markdown
## Permission Check

Execute: `{root}/tasks/utils/validate-agent-action.md`

Input:
```yaml
agent_id: sm
story_path: {new_story_path}
action: create
skip_transition_check: true
```

If result.validation = FAIL:
  - Output result.error_message
  - HALT
```

## 性能优化对比

### 旧方案 (两次验证)
```
1. validate-agent-permission.md:
   - 读取 story-status-transitions.yaml (~2000 tokens)
   - 读取 Story 文件 (~500 tokens)
   - 权限检查逻辑 (~300 tokens)
   Total: ~2800 tokens

2. validate-status-transition.md:
   - 读取 story-status-transitions.yaml (~2000 tokens)
   - 读取 Story 文件 (~500 tokens)
   - 转换检查逻辑 (~400 tokens)
   Total: ~2900 tokens

总计: ~5700 tokens
```

### 新方案 (统一验证)
```
validate-agent-action.md:
   - 读取 story-status-transitions.yaml (~2000 tokens)
   - 读取 Story 文件 (~500 tokens)
   - 权限 + 转换检查逻辑 (~500 tokens)
   Total: ~3000 tokens

总计: ~3000 tokens
节省: ~2700 tokens (47% 减少)
```

## 日志记录

**每次验证都应记录**:
```yaml
log_entry:
  timestamp: {iso_timestamp}
  agent: {agent_id}
  story: {story_id from path}
  current_status: {status}
  action: {action}
  target_status: {target_status if provided}
  result: {PASS/FAIL}
  error_type: {error_type if failed}
  error_message: {error_message if failed}
```

## 关键原则

- **一次读取**: 所有配置文件只读一次
- **快速失败**: 按顺序验证,遇到错误立即返回
- **清晰错误**: 提供可操作的指导信息
- **完整验证**: 在一个工具中完成所有检查
- **向后兼容**: 可以替换现有的两个验证工具

## 迁移指南

**替换旧工具引用**:

旧代码:
```markdown
Execute: utils/validate-agent-permission.md
Execute: utils/validate-status-transition.md
```

新代码:
```markdown
Execute: utils/validate-agent-action.md
```

## 参考文件

- `data/story-status-transitions.yaml` - 权限和转换规则
- `tasks/utils/validate-agent-permission.md` - 旧权限验证工具 (可废弃)
- `tasks/utils/validate-status-transition.md` - 旧转换验证工具 (可废弃)
