# Story文件瘦身优化总结

## 🎯 优化目标

解决Story文件在完成后膨胀到15K-30K tokens的问题，导致SM创建下一个story时无法有效读取参考。

## 📊 问题分析

### Before优化前的Token分布

```
✅ Story基础部分            ~500 tokens   (Status, Story, AC, Dev Notes)
⚠️ Tasks/Subtasks          ~1,500 tokens  (4 phases完成后全是✅)
✅ Quality Assessment       ~800 tokens   (只看一次的metadata)
❌ Architect Review Results ~2,000-4,000  (详细findings每轮)
❌❌ QA Results (每轮)       ~3,000-6,000  (3轮 = 9K-18K!)
✅ Dev Agent Record         ~300 tokens   (已优化)
⚠️ Change Log              ~1,000 tokens  (必要audit trail)

总计: 15,000-30,000 tokens 😱
```

### 最大膨胀源

1. **QA Results** - 每轮3K-6K tokens × 3轮 = **9K-18K tokens**
2. **Architect Review** - 每轮2K-4K tokens × 2轮 = **4K-8K tokens**

---

## 💡 优化方案

### 核心思路

**Story文件 = 控制面板 (Dashboard)**

- 只包含：metadata, summary, key metrics, references
- 作为navigation hub指向详细报告

**详细报告 = 外部文件 (External Reports)**

- 按agent分类存储：Architect, QA, Dev
- 统一命名规则：`{story-id}-{agent}-r{round}.md`
- 按需查阅

---

## 🛠️ 实施内容

### 1. 新增配置路径

**文件**: `orchestrix-core/core-config.yaml`

```yaml
architect:
  storyReviewsLocation: docs/architecture/story-reviews
qa:
  qaReviewsLocation: docs/qa/reviews
```

### 2. 创建模板文件

**新文件**:

- `orchestrix-core/templates/architect-review-tmpl.yaml`
- `orchestrix-core/templates/qa-review-tmpl.yaml`

### 3. 更新Story Template

**文件**: `orchestrix-core/templates/story-tmpl.yaml`

#### 变更1: Architect Review Results → Architect Review Summary

**Before** (2K-4K tokens):

```markdown
## Architect Review Results

### Review Date: 2025-01-17 - Round 1

...完整的detailed analysis...
...所有issues的详细描述...
...长篇recommendations...
```

**After** (200 tokens):

```markdown
## Architect Review Summary

- **Total Reviews**: 2
- **Latest Review**: 2025-01-17
- **Latest Score**: 7.5/10
- **Latest Decision**: RequiresRevision
- **Critical Issues (Latest)**: 3

### Review Documents

- Round 1: [Arch Review R1](docs/architecture/story-reviews/1.3-arch-review-r1.md) - Score: 7.5/10 - Decision: RequiresRevision - 2025-01-17
- Round 2: [Arch Review R2](docs/architecture/story-reviews/1.3-arch-review-r2.md) - Score: 8.5/10 - Decision: Approved - 2025-01-18
```

#### 变更2: QA Results → QA Review Summary

**Before** (9K-18K tokens for 3 rounds):

```markdown
## QA Results

### Review Date: 2025-01-18 - Round 1

...完整的3000+ tokens...

### Review Date: 2025-01-18 - Round 2

...完整的3000+ tokens...

### Review Date: 2025-01-18 - Round 3

...完整的3000+ tokens...
```

**After** (500 tokens):

```markdown
## QA Review Summary

- **Total Reviews**: 3
- **Latest Review**: 2025-01-18 15:00
- **Latest Gate**: PASS
- **Final Quality Score**: 95/100
- **Total Issues Found**: 15
- **Total Issues Resolved**: 14
- **Overall Improvement**: 93%

### Review History

- **Round 1** (01-18 09:00): [QA Review R1](docs/qa/reviews/1.3-qa-r1.md) - FAIL - 15 issues
- **Round 2** (01-18 12:00): [QA Review R2](docs/qa/reviews/1.3-qa-r2.md) - CONCERNS - 7 issues (53% improvement)
- **Round 3** (01-18 15:00): [QA Review R3](docs/qa/reviews/1.3-qa-r3.md) - PASS - 1 issue (93% improvement)

### Final Gate

- **Gate File**: [1.3-final.yml](docs/qa/gates/1.3-final.yml)
- **Gate Result**: PASS
```

#### 变更3: Change Log 表格化

**Before** (free-form text):

```markdown
## Change Log

### 2025-01-17 10:00 - Story Created

- SM created story
- Status: Blocked → AwaitingArchReview

### 2025-01-17 14:00 - Architect Review Complete

- Architect completed review
- Score: 7.5/10
  ...很长...
```

**After** (table format):

```markdown
## Change Log

| Date        | Agent     | Status Transition                     | Details/Link                                                                                 |
| ----------- | --------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| 01-17 10:00 | SM        | Created → AwaitingArchReview          | Story created                                                                                |
| 01-17 14:00 | Architect | AwaitingArchReview → RequiresRevision | Score: 7.5/10, 3 critical [Review R1](docs/architecture/story-reviews/1.3-arch-review-r1.md) |
| 01-17 16:00 | SM        | RequiresRevision → Approved           | Revised per feedback                                                                         |
| 01-17 18:00 | Dev       | Approved → InProgress                 | [Dev Log](docs/dev/logs/1.3-dev-log.md)                                                      |
| 01-18 09:00 | QA        | Review → InProgress                   | R1: FAIL, 15 issues [QA R1](docs/qa/reviews/1.3-qa-r1.md)                                    |
| 01-18 12:00 | QA        | Review → InProgress                   | R2: CONCERNS, 7 issues [QA R2](docs/qa/reviews/1.3-qa-r2.md)                                 |
| 01-18 15:00 | QA        | Review → Done                         | R3: PASS ✅ [QA R3](docs/qa/reviews/1.3-qa-r3.md)                                            |
```

### 4. 更新Architect Task

**文件**: `orchestrix-core/tasks/review-story-technical-auto.md`

**变更**: 输出到外部文件

**Output 1**: 创建详细review report

- 路径: `docs/architecture/story-reviews/{story-id}-arch-review-r{round}.md`
- 使用template: `architect-review-tmpl.yaml`

**Output 2**: 更新Story的Architect Review Metadata和Summary sections

**Output 3**: 更新Change Log（表格格式）

### 5. 更新QA Task

**文件**: `orchestrix-core/tasks/review-story.md`

**变更**: 输出到外部文件

**Output 1**: 创建详细review report

- 路径: `docs/qa/reviews/{story-id}-qa-r{round}.md`
- 使用template: `qa-review-tmpl.yaml`

**Output 2**: 更新Story的QA Review Metadata和Summary sections

**Output 3**: 创建Gate file (unchanged)

**Output 4**: 更新Change Log（表格格式）

---

## 📁 新目录结构

```
docs/
├── stories/
│   ├── 1.1.feature-a.md          # 精简版 (~3K tokens) ✨
│   ├── 1.2.feature-b.md
│   └── 1.3.user-auth.md
│
├── architecture/
│   └── story-reviews/            # ← 新增
│       ├── 1.1-arch-review-r1.md
│       ├── 1.1-arch-review-r2.md
│       ├── 1.2-arch-review-r1.md
│       └── 1.3-arch-review-r1.md
│
├── qa/
│   ├── reviews/                  # ← 新增
│   │   ├── 1.1-qa-r1.md
│   │   ├── 1.1-qa-r2.md
│   │   ├── 1.1-qa-r3.md
│   │   ├── 1.2-qa-r1.md
│   │   └── 1.3-qa-r1.md
│   ├── gates/
│   │   ├── 1.1-final.yml
│   │   └── 1.3-final.yml
│   └── assessments/
│       ├── 1.3-test-design.md
│       └── 1.3-risk.md
│
└── dev/
    └── logs/
        ├── 1.1-dev-log.md
        ├── 1.2-dev-log.md
        └── 1.3-dev-log.md
```

---

## 📈 优化效果

### Token减少对比表

| 部分                   | Before            | After           | 减少              | 减少比例   |
| ---------------------- | ----------------- | --------------- | ----------------- | ---------- |
| Architect Review (2轮) | 2,000-4,000       | 200             | 1,800-3,800       | **90-95%** |
| QA Results (3轮)       | 9,000-18,000      | 500             | 8,500-17,500      | **94-97%** |
| Change Log             | 1,000             | 600             | 400               | **40%**    |
| **Story总计**          | **15,000-30,000** | **2,500-4,000** | **10,500-26,000** | **70-87%** |

### 平均Story文件大小

- **Before**: ~22,500 tokens (取中值)
- **After**: ~3,250 tokens
- **减少**: **19,250 tokens (85.6%)**

---

## 🎯 用户体验改进

### SM创建新Story时

**Before**:

```
尝试读取 1.2.previous-story.md (25,000 tokens) 😱
→ 超出context window
→ 或占用大量token预算
→ 只能读Summary或根本读不完
→ 缺少关键的lessons learned
```

**After**:

```
读取 1.2.previous-story.md (3,000 tokens) ✅
→ 完整overview: status, metrics, decisions
→ 获得完整的Change Log audit trail
→ Review summaries: scores, key issues
→ 所有detailed reports的links

如需深入了解：
→ Architect担心什么架构问题？点击arch-review
→ QA发现的主要bug类型？点击qa-r3
→ Dev遇到什么技术难点？点击dev-log
```

### 其他好处

1. **更快的加载** - Story文件从25K降到3K
2. **更清晰的结构** - 控制面板 + 详细报告分离
3. **更好的可维护性** - 修改review template不影响story
4. **更好的audit trail** - 表格化的Change Log清晰追溯
5. **更好的协作** - 不同角色可以focus自己的review文件

---

## ✅ 向后兼容性

### 现有Story

- **无影响** - 已创建的story继续按原格式工作
- **可选迁移** - 可以手动拆分大型story（如果需要）

### 新Story

- **自动使用新结构** - SM创建新story时自动采用新template
- **Architect和QA自动输出外部文件**

---

## 🚀 实施状态

### 已完成 ✅

1. ✅ 更新 core-config.yaml (新增paths)
2. ✅ 创建 architect-review-tmpl.yaml
3. ✅ 创建 qa-review-tmpl.yaml
4. ✅ 更新 story-tmpl.yaml (Architect Review Summary)
5. ✅ 更新 story-tmpl.yaml (QA Review Summary)
6. ✅ 更新 story-tmpl.yaml (Change Log表格化)
7. ✅ 更新 review-story-technical-auto.md (外部化)
8. ✅ 更新 review-story.md (外部化)

### 测试建议

1. **测试Architect Review流程**
   - SM创建story → Architect review
   - 验证外部文件创建：`docs/architecture/story-reviews/{story-id}-arch-review-r1.md`
   - 验证Story中只有summary和link
   - 验证Change Log更新

2. **测试QA Review流程**
   - Dev完成 → QA review R1/R2/R3
   - 验证每轮创建外部文件：`docs/qa/reviews/{story-id}-qa-r{N}.md`
   - 验证Story中只有cumulative summary
   - 验证Review History追踪所有轮次

3. **测试SM读取Previous Story**
   - 完成一个story（经过完整流程）
   - SM创建下一个story，读取previous story
   - 验证token大小合理（<4K）
   - 验证可以获取key learnings

---

## 💡 未来可选优化

### P2优先级（可选）

1. **Tasks压缩** - Story完成后，将详细的tasks checklist移到archive

   ```markdown
   ## Tasks Summary

   ✅ All 14 tasks completed (4 phases)
   [Detailed Checklist](docs/stories/.archive/1.3-tasks-detail.md)
   ```

   节省额外: ~1,000 tokens

2. **Executive Summary生成** - Done story自动生成ultra-compact summary
   ```markdown
   # Story 1.3 Executive Summary

   - What: User authentication with JWT
   - Quality: 8.5/10, PASS
   - Duration: 2 days
   - Key Learning: Rate limiting middleware needed
   - References: [Full Story](1.3.user-auth.md)
   ```
   For quick reference: ~200 tokens

---

## 🎉 总结

通过这次优化，我们：

1. ✅ **解决了核心问题** - Story文件从25K降到3K (87%减少)
2. ✅ **改善了用户体验** - SM可以有效读取previous story
3. ✅ **保持了完整性** - 所有详细信息仍然可访问
4. ✅ **提升了可维护性** - 结构更清晰，更易维护
5. ✅ **保持了向后兼容** - 现有story不受影响

**哲学**: 学习Dev的优秀模式，将Story作为控制面板，详细报告外部化。Keep It Simple, Keep It Organized!

---

**修改文件统计**:

- 配置文件: 1个
- 新增template: 2个
- Story template: 3处修改
- Task文件: 2个
- **总计**: 8个文件修改/新增

**代码行数**: ~200行

**破坏性**: 无（向后兼容）

**效果**: **85%+ token减少** 🎉
