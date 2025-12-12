# Review Story Technical Accuracy

Architect reviews SM stories for architecture consistency and feasibility.

**Prerequisites**: Status=`AwaitingArchReview`, SM validation done, arch docs available

## Steps

### 1. Validate
Execute: `utils/validate-status-transition.md` (current: "AwaitingArchReview", agent: "Architect")
- If invalid: HALT
- Check `review_round` (default=1, max=2)

### 2. Load Context
Execute: `utils/load-architecture-context.md` → store as `architecture_context`
- If error: HALT; if partial: continue

### 3. Review
Execute: `{root}/checklists/scoring-architect-technical-review.md`
- This is a scored technical review assessment (0-10 scale)
- Follow embedded scoring instructions and return review score
- context: {story, architecture_context, review_round}
- Store as `review_result`

### 4. Decide
Execute: `make-decision.md`
- type: `architect-review-result`
- context: {architecture_score, critical_issues, review_round}
- Store as `decision_result`

### 5. Determine Status
- Approved + Simple → `Approved`
- Approved + Standard/Comprehensive → `AwaitingTestDesign`
- RequiresRevision → `RequiresRevision`
- Escalated → `Escalated`

### 6. Validate Transition
Execute: `utils/validate-status-transition.md` (current: "AwaitingArchReview", target: {step 5})
- If invalid: HALT

### 7. Update Story

**Status**: {target_status}

**Metadata**:
```yaml
Architect Review Metadata:
  review_round: {+1}
  total_reviews_conducted: {+1}
  Review History:
    - Round: {n}, Date: {ts}, Score: {x}/10, Decision: {result}, Critical: {n}
```

**Review**:
```markdown
---
### R{n} | {date} | {x}/10
{review_result.details}
**Issues**: C:{n} H:{n} M:{n} L:{n}
**Decision**: {result} → {status}
**Next**: {action}
---
```

**Change Log**:
```markdown
### {ts} - Arch R{n}
{x}/10, C:{n} H:{n} M:{n} L:{n}, {result} → `{status}`, {action}
---
```

### 8. Handoff
- `AwaitingTestDesign` → QA: `test-design {story_id}`
- `Approved` → Dev: `develop-story {story_id}`
- `RequiresRevision` → SM: `revise {story_id}`
- `Escalated` → Human required

## Gates
Score ≥8, zero critical, max 2 rounds

## Refs
`checklists/scoring-architect-technical-review.md` | `architect-review-result.yaml` | `load-architecture-context.md` | `validate-status-transition.md`
