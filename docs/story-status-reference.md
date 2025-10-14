# Story 状态转换参考文档

## 概述

本文档详细说明 Orchestrix 框架中 Story 的所有状态、负责人、转换规则和常见场景，为开发团队提供完整的状态管理指南。

## 状态定义

### 1. Blocked

- **含义**: Story 质量不达标，需要 SM 修订
- **负责人**: SM Agent
- **下一步行动**:
  - SM 修订 Story 内容
  - 重新执行质量检查
- **触发条件**:
  - 结构验证完成率 < 100%
  - 技术提取完成率 < 80%
  - 技术质量分数 < 6.0
- **允许转换到**: `AwaitingArchReview`, `Approved`, `Blocked`

### 2. AwaitingArchReview

- **含义**: 等待 Architect 技术审查
- **负责人**: Architect Agent
- **下一步行动**:
  - Architect 执行技术审查
- **触发条件**:
  - 技术质量分数 ≥ 8.0 且复杂度指标 ≥ 2
  - 技术质量分数 6.0-7.9（任何复杂度）
  - SM 修订后需要第2轮审查
- **允许转换到**: `Approved`, `RequiresRevision`, `Escalated`

### 3. RequiresRevision

- **含义**: Architect 审查发现问题，需要 SM 修订
- **负责人**: SM Agent
- **下一步行动**:
  - SM 基于 Architect 反馈修订 Story
  - 重新执行质量检查
- **触发条件**:
  - Architect 审查评分 < 7/10
  - 存在 Critical 级别问题
- **允许转换到**: `AwaitingArchReview`, `Approved`, `Blocked`

### 4. Approved

- **含义**: Story 已批准，可以开始开发
- **负责人**: Dev Agent
- **下一步行动**:
  - Dev 开始实现功能
- **触发条件**:
  - 技术质量分数 ≥ 8.0 且复杂度指标 ≤ 1
  - Architect 审查评分 ≥ 7/10 且无 Critical 问题
  - SM 修订后满足自动批准条件
- **允许转换到**: `InProgress`

### 5. InProgress

- **含义**: Dev 正在实现功能或修复 QA 发现的问题
- **负责人**: Dev Agent
- **下一步行动**:
  - Dev 完成实现
  - Dev 修复 QA 问题
- **触发条件**:
  - Dev 开始实现功能
  - QA 审查发现问题需要修复
- **允许转换到**: `Review`

### 6. Review

- **含义**: 等待 QA 审查
- **负责人**: QA Agent
- **下一步行动**:
  - QA 执行代码审查和测试
- **触发条件**:
  - Dev 完成所有任务和测试
- **允许转换到**: `Done`, `InProgress`

### 7. Done

- **含义**: Story 已完成
- **负责人**: 无
- **下一步行动**: 无
- **触发条件**:
  - QA 审查通过 (Gate = PASS)
  - 所有验收标准满足
  - 无 Critical 问题
- **允许转换到**: 无（终态）

### 8. Escalated

- **含义**: 需要人工介入决策
- **负责人**: Human
- **下一步行动**:
  - 人工评估和决策
- **触发条件**:
  - Architect 发现需要人工介入的复杂问题
  - 审查轮次超限需要决策
- **允许转换到**: `AwaitingArchReview`, `Approved`, `Blocked`

## 状态转换矩阵

| 当前状态               | 可转换到           | 负责Agent | 触发条件                      |
| ---------------------- | ------------------ | --------- | ----------------------------- |
| **Blocked**            | AwaitingArchReview | SM        | 质量检查通过，需要审查        |
| **Blocked**            | Approved           | SM        | 高质量 + 低复杂度             |
| **Blocked**            | Blocked            | SM        | 修订后仍不达标                |
| **AwaitingArchReview** | Approved           | Architect | 审查评分 ≥ 7，无Critical问题  |
| **AwaitingArchReview** | RequiresRevision   | Architect | 审查评分 < 7 或有Critical问题 |
| **AwaitingArchReview** | Escalated          | Architect | 需要人工介入                  |
| **RequiresRevision**   | AwaitingArchReview | SM        | 修订完成，触发第2轮审查       |
| **RequiresRevision**   | Approved           | SM        | 满足自动批准条件              |
| **RequiresRevision**   | Blocked            | SM        | 修订后质量仍不足              |
| **Approved**           | InProgress         | Dev       | 开始实现                      |
| **InProgress**         | Review             | Dev       | 实现完成                      |
| **Review**             | Done               | QA        | QA审查通过                    |
| **Review**             | InProgress         | QA        | QA发现问题                    |
| **Escalated**          | AwaitingArchReview | Human     | 决定重新审查                  |
| **Escalated**          | Approved           | Human     | 决定批准                      |
| **Escalated**          | Blocked            | Human     | 决定修订                      |

## 质量评估决策矩阵

### 两阶段评估流程

```
阶段一：结构验证（门控条件）
├─ 通过 (100%) → 继续阶段二
└─ 不通过 (< 100%) → Status = Blocked

阶段二：技术质量评估
├─ 技术提取 < 80% → Status = Blocked
└─ 技术提取 ≥ 80% → 计算技术质量分数 (0-10)

复杂度检测：检测 7 个复杂度指标 (0-7)

决策矩阵：
├─ 技术分数 ≥ 8.0 + 复杂度 0 → Status = Approved
├─ 技术分数 ≥ 8.0 + 复杂度 1 → Status = Approved (可选审查)
├─ 技术分数 ≥ 8.0 + 复杂度 ≥ 2 → Status = AwaitingArchReview
├─ 技术分数 6.0-7.9 + 任何复杂度 → Status = AwaitingArchReview
└─ 技术分数 < 6.0 → Status = Blocked
```

### 复杂度指标

1. **API 契约变更** - 修改现有API接口
2. **数据库模式修改** - 变更数据库结构
3. **新架构模式** - 引入新的架构模式
4. **跨服务依赖** - 涉及多个服务交互
5. **安全敏感操作** - 涉及安全相关功能
6. **性能关键特性** - 对性能有重要影响
7. **核心架构文档修改** - 需要更新架构文档

## 审查轮次管理

### Architect 审查（最多2轮）

| 轮次      | 触发条件                    | 通过标准                  | 失败处理                  |
| --------- | --------------------------- | ------------------------- | ------------------------- |
| **第1轮** | Status = AwaitingArchReview | 评分 ≥ 7 + 无Critical问题 | Status = RequiresRevision |
| **第2轮** | SM修订后                    | 评分 ≥ 7 + 无Critical问题 | 询问用户决策              |

**自动批准条件**（跳过第2轮）：

- 所有Critical问题已解决
- 质量分数提升 ≥ 2分
- 最终质量分数 ≥ 8.0
- 仅修订了Minor级别问题

### QA 审查（最多3轮，渐进式标准）

| 轮次      | 质量标准 | 通过条件                           | 失败处理            |
| --------- | -------- | ---------------------------------- | ------------------- |
| **第1轮** | 严格     | 所有标准满足 + 无Critical/High问题 | Status = InProgress |
| **第2轮** | 适中     | 问题减少≥50% + 无High问题          | Status = InProgress |
| **第3轮** | 务实     | 无Critical问题                     | 询问用户决策        |

## 常见场景的状态转换示例

### 场景1：高质量Story直接批准

```
SM创建Story → 质量检查 → 技术分数8.5 + 复杂度0 → Approved → Dev实现
```

### 场景2：需要Architect审查的Story

```
SM创建Story → 质量检查 → 技术分数7.0 + 复杂度1 → AwaitingArchReview
→ Architect审查通过 → Approved → Dev实现
```

### 场景3：需要修订的Story

```
SM创建Story → 质量检查 → 技术分数5.0 → Blocked → SM修订
→ 质量检查 → 技术分数8.0 + 复杂度2 → AwaitingArchReview
→ Architect审查发现问题 → RequiresRevision → SM修订
→ 满足自动批准条件 → Approved → Dev实现
```

### 场景4：QA发现问题需要修复

```
Dev完成实现 → Review → QA第1轮审查发现问题 → InProgress
→ Dev修复 → Review → QA第2轮审查问题减少50% → Done
```

### 场景5：复杂问题需要升级

```
AwaitingArchReview → Architect发现复杂架构问题 → Escalated
→ 人工决策 → Approved/Blocked/AwaitingArchReview
```

## Agent Handoff 消息格式

### 标准消息格式

```
Next: [Agent名称] 请执行命令 `[命令名称] [参数]`
```

### 具体消息映射

| 状态转换               | Handoff 消息                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| SM → Architect         | `Next: Architect 请执行命令 \`review-story {story_id}\``             |
| SM → Dev (创建后)      | `Next: Dev 请执行命令 \`implement-story {story_id}\``                |
| Architect → SM         | `Next: SM 请执行命令 \`revise {story_id}\``                          |
| Architect → Dev        | `Next: Dev 请执行命令 \`implement-story {story_id}\``                |
| SM → Architect (第2轮) | `Next: Architect 请执行命令 \`review-story {story_id}\` (第2轮审查)` |
| SM → Dev (修订后)      | `Next: Dev 请执行命令 \`implement-story {story_id}\``                |
| Dev → QA               | `Next: QA 请执行命令 \`review {story_id}\``                          |
| QA → Dev               | `Next: Dev 请执行命令 \`review-qa {story_id}\``                      |
| QA → 完成              | `Story 已完成！`                                                     |

### 特殊情况消息

| 状态      | 消息                                   |
| --------- | -------------------------------------- |
| Blocked   | `Story 被阻塞，需要 SM 修订后重新提交` |
| Escalated | `Story 已升级，需要人工介入决策`       |

## 错误处理和验证

### 常见错误类型

1. **无效状态转换**
   - 错误：尝试从 `Done` 转换到其他状态
   - 处理：拒绝转换，提示允许的转换目标

2. **未授权Agent操作**
   - 错误：Dev 尝试在 `AwaitingArchReview` 状态修改Story
   - 处理：拒绝操作，指示负责的Agent

3. **前置条件不满足**
   - 错误：质量检查未通过就尝试转换到 `Approved`
   - 处理：拒绝转换，列出缺失的条件

### 验证规则

- ✅ 强制执行允许的状态转换路径
- ✅ 验证Agent权限
- ✅ 检查前置条件
- ✅ 记录所有状态转换用于审计
- ✅ 允许Human Agent手动覆盖

## 性能和监控

### 关键指标

- **Story生命周期**：各状态平均停留时间、总周期时长
- **质量评估**：平均质量分数、结构验证通过率
- **审查效率**：平均审查轮次、自动批准率、升级率
- **Agent性能**：SM修订成功率、Dev首次通过率

### 告警阈值

- 平均审查轮次 > 2.0 → 检查决策矩阵阈值
- 自动批准率 < 30% → 检查质量标准
- 升级率 > 10% → 检查工作流程和培训

## 最佳实践建议

### 对SM Agent

1. 创建Story时确保结构完整，避免进入 `Blocked` 状态
2. 技术提取完成率保持在90%以上
3. 修订时重点关注Critical问题，争取自动批准

### 对Architect Agent

1. 第1轮审查要严格，避免第2轮反复
2. 明确区分Critical、Medium、Minor问题级别
3. 提供具体的修订建议

### 对Dev Agent

1. 实现前仔细阅读Dev Notes和Tasks
2. 完成后进行自检，减少QA轮次
3. 修复QA问题时要彻底，避免反复

### 对QA Agent

1. 第1轮审查要全面，发现所有问题
2. 后续轮次关注问题解决情况
3. 第3轮后要务实，平衡质量和效率

## 故障排除

### Story卡在某个状态

1. 检查负责Agent是否正确
2. 验证前置条件是否满足
3. 查看错误日志确定具体问题

### 审查轮次过多

1. 检查质量标准是否过于严格
2. 分析常见问题类型，改进模板
3. 加强Agent培训

### 自动批准率过低

1. 调整决策矩阵阈值
2. 改进质量评估算法
3. 优化Story模板和指导

---

_本文档基于 Agent Handoff Optimization 规范 v1.0，对应需求 9 和 1.8_
