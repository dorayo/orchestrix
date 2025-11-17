# 幂等性检查策略 (Idempotency Checks)

## 目标

防止 Agent 重复执行已完成的工作，节省 token 并提高效率。

## 原则

每个任务在开始实际工作前，应该：

1. **快速检查**：在任务的前 3 步内完成检查
2. **明确提示**：清楚告知用户工作已完成
3. **提供选项**：告知用户下一步应该做什么
4. **立即退出**：不执行任何重复工作

## 检查策略

### SM - Create Next Story (`create-next-story.md`)

**检查点**：Story 文件是否已存在

```yaml
check_logic:
  - Read story file: docs/stories/{epic}.{story}.md
  - If file exists AND status != "Blocked":
      output: |
        ℹ️ STORY ALREADY EXISTS
        Story: {epic}.{story}
        Status: {current_status}

        This story has already been created.

        Next actions:
        - If status is "AwaitingArchReview": *review-story {epic}.{story}
        - If status is "RequiresRevision": *revise-story {epic}.{story}
        - If status is "Approved": *implement-story {epic}.{story}
        - To create a different story: *draft (will create next story)

      HALT: Do not create duplicate story
```

### Architect - Review Story (`architect-review-story.md`)

**检查点**：Story 状态和 Review 文件

```yaml
check_logic:
  - Read story file
  - Check status
  - Check for existing review file: docs/architecture/story-reviews/{story_id}-arch-review-r*.md

  - If status in ["Approved", "AwaitingTestDesign", "InProgress", "Review", "Done"]:
      output: |
        ℹ️ STORY ALREADY REVIEWED
        Story: {story_id}
        Status: {current_status}
        Last Review: {review_file}

        Architect review already completed.

        Next actions:
        - If status is "Approved": Story ready for Dev (*implement-story {story_id})
        - If status is "AwaitingTestDesign": QA needs to design tests (*test-design {story_id})
        - If status is "Review" or "Done": Story in Dev/QA workflow
        - To re-review: First set status to "RequiresRevision" via SM

      HALT: Review already completed
```

### Dev - Implement Story (`implement-story.md`)

**检查点**：Story 状态

```yaml
check_logic:
  - Read story file
  - Check status

  - If status in ["Review", "Done"]:
      output: |
        ℹ️ STORY ALREADY IMPLEMENTED
        Story: {story_id}
        Status: {current_status}
        Dev Log: {dev_log_path}

        Implementation already completed.

        Next actions:
        - If status is "Review": QA is reviewing (*review {story_id})
        - If status is "Done": Story complete, ready for deployment
        - To re-implement: Wait for QA feedback or use *review-qa {story_id}

      HALT: Implementation already completed

  - If status not in ["Approved", "TestDesignComplete"]:
      output: |
        ⚠️ STORY NOT READY FOR IMPLEMENTATION
        Story: {story_id}
        Current Status: {current_status}

        Story must be Approved or have TestDesignComplete status.

        Required status: Approved | TestDesignComplete
        Current status: {current_status}

        Next actions:
        - If "AwaitingArchReview": Wait for Architect (*review-story {story_id})
        - If "RequiresRevision": SM needs to revise (*revise-story {story_id})
        - If "AwaitingTestDesign": QA needs test design (*test-design {story_id})

      HALT: Prerequisites not met
```

### QA - Review Story (`qa-review-story.md`)

**检查点**：Story 状态和 QA Review 文件

```yaml
check_logic:
  - Read story file
  - Check status
  - Check for existing QA review: docs/qa/reviews/{story_id}-qa-r*.md

  - If status == "Done":
      # Check last QA review result
      - Read last review file
      - If Gate == "PASS":
          output: |
            ℹ️ STORY ALREADY PASSED QA
            Story: {story_id}
            Status: Done
            Last QA Review: {review_file}
            Gate: PASS

            Story has already passed QA review.

            Next actions:
            - Story is ready for deployment
            - To create git commit: *finalize-commit {story_id}
            - To start next story: Switch to SM and run *draft

          HALT: QA already passed

  - If status not in ["Review"]:
      output: |
        ⚠️ STORY NOT READY FOR QA REVIEW
        Story: {story_id}
        Current Status: {current_status}

        Story must be in "Review" status for QA.

        Required status: Review
        Current status: {current_status}

        Next actions:
        - If "Approved": Dev needs to implement (*implement-story {story_id})
        - If "InProgress": Wait for Dev to complete
        - If "AwaitingArchReview": Wait for Architect review

      HALT: Prerequisites not met
```

## 实现检查的位置

在每个任务的开始部分添加：

```markdown
## Step 0: Idempotency Check (Fast Exit)

**Purpose**: Avoid redundant work by checking if task already completed

**Read Story File**: docs/stories/{story_id}.md

**Extract**:

- Story.status
- [Agent-specific fields, e.g., Dev Log, Review files]

**Check Completion**:

- [Agent-specific logic as defined above]

**If Already Completed**:

- Output completion message
- Suggest next action
- HALT immediately

**If Not Completed**:

- Log: "Check passed, proceeding with [task name]"
- Continue to Step 1
```

## 效益

### Token 节省

假设每个任务平均消耗：

- SM draft story: 10,000 tokens
- Architect review: 15,000 tokens
- Dev implement: 30,000 tokens
- QA review: 20,000 tokens

幂等性检查消耗：约 500 tokens（读取 story 文件 + 基本判断）

**节省比例**：

- SM: 95% (9,500 tokens saved)
- Architect: 96.7% (14,500 tokens saved)
- Dev: 98.3% (29,500 tokens saved)
- QA: 97.5% (19,500 tokens saved)

### 用户体验

- ✅ 即时反馈（< 5 秒 vs 1-5 分钟）
- ✅ 明确的下一步指引
- ✅ 避免混淆和错误
- ✅ 更快的开发循环

## 示例输出

### 成功案例（Story 已完成）

```
📖 Reading story file: docs/stories/2.3.md

ℹ️ STORY ALREADY IMPLEMENTED
Story: 2.3
Status: Review
Dev Log: docs/dev/logs/2.3-implement.md

Implementation already completed.

Next actions:
- QA is reviewing this story
- To check QA status: Switch to QA window and run *review 2.3
- To start new story: Switch to SM window and run *draft

HALT: Implementation already completed ✋
```

### 快速检查通过

```
📖 Reading story file: docs/stories/2.3.md

✅ Idempotency check passed
Story: 2.3
Status: Approved
Ready for: Implementation

Proceeding with implementation...
```

## 配置选项（未来扩展）

可以在 `core-config.yaml` 添加：

```yaml
idempotency:
  enabled: true # 启用幂等性检查
  strict: true # 严格模式：不允许重复执行
  warnings: true # 显示警告而不是 HALT
```

## 相关文件

- `orchestrix-core/tasks/create-next-story.md`
- `orchestrix-core/tasks/architect-review-story.md`
- `orchestrix-core/tasks/implement-story.md`
- `orchestrix-core/tasks/qa-review-story.md`

## 版本历史

- v1.0 (2025-11-17): 初始设计
