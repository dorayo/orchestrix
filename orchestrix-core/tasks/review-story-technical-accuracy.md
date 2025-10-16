# Review Story Technical Accuracy

## Overview
Architect Agent conducts technical accuracy reviews of SM-created stories to ensure architectural consistency, technical feasibility, and project standards alignment.

**Context**: Second-layer QA after SM validation. Review decision already made by user based on SM complexity analysis. Story metadata contains complexity indicators.

## Permission Check

1. Verify Architect agent identity
2. Check permission to modify `AwaitingArchReview` status (ref: `{root}/data/story-status-transitions.yaml`)
3. Verify allowed transitions: AwaitingArchReview → Approved/RequiresRevision/Escalated
4. If fails: HALT, log error, inform user

## Prerequisites
- Story created by SM, passed internal validation
- Quality score available, complexity analysis documented
- Status = `AwaitingArchReview`
- Architecture docs available in `docs/architecture/`

## Objectives

Focus on architecture-specific concerns (SM already validated tech stack, naming, structure, docs format):

1. Validate architectural patterns (no anti-patterns)
2. Verify system integration (sound approach, manageable dependencies)
3. Assess scalability & performance
4. Review security architecture alignment
5. Ensure technical feasibility (no architectural blockers)

## Process

### Phase 1: Architecture Context

1. **Read Architecture Docs** (based on story type):
   - All: tech-stack, source-tree, coding-standards, testing-strategy
   - Backend/API: +data-models, database-schema, backend-architecture, rest-api-spec, external-apis
   - Frontend/UI: +frontend-architecture, components, core-workflows, data-models

2. **Establish Baseline**:
   - Note tech stack versions/constraints
   - Identify patterns/conventions
   - Review component structure/naming
   - Understand API contracts/data models

### Phase 2: Story Analysis

**Status Validation**:
1. Read Story `Status` field, verify = `AwaitingArchReview`
2. Confirm Architect permission (ref: `story-status-transitions.yaml`)
3. Check `review_round` in Architect Review Metadata (0/unset=1st, 1=2nd, 2=escalate)
4. Max 2 rounds allowed
5. If fails: HALT, log error

**Story Review**:
3. Read entire story + Dev Notes
4. Extract technical components, dependencies, integrations

**Component Validation**:
5. Tech stack compliance (tech-stack.md)
6. Naming conventions (coding-standards.md)
7. Project structure (source-tree.md)
8. API design (rest-api-spec.md, if applicable)
9. Data models (data-models.md, if applicable)

**Pattern Validation**:
10. Backend patterns (backend-architecture.md, if applicable)
11. Frontend patterns (frontend-architecture.md, if applicable)
12. Component design (components.md, if applicable)
13. Workflow integration (core-workflows.md, if applicable)

### Phase 3: Dependencies & Integration

14. **Dependency Validation**:
    - Map dependencies, cross-reference with system
    - Identify missing/circular dependencies
    - Validate external APIs (external-apis.md)

15. **Integration Analysis**:
    - Check DB patterns (database-schema.md)
    - Validate API integration
    - Verify error handling/security
    - Review testing approach (testing-strategy.md)

### Phase 4: Feasibility & Quality

16. **Feasibility Check**:
    - Assess scope vs capacity
    - Identify blockers/complex integrations
    - Verify AC measurability
    - Check story independence

17. **Doc Reference Verification**:
    - Verify architecture doc references accuracy
    - Ensure sections exist
    - Check citation format: `[Source: docs/architecture/{file}.md#{section}]`
    - Validate no outdated references

### Phase 5: Score & Decision

18. **Calculate Score** (max 10, ref: `assessment/architect-technical-review-checklist.md`):
    - Architectural Pattern Compliance: 3pts
    - System Integration: 2pts
    - Scalability & Performance: 2pts
    - Security Architecture: 2pts
    - Technical Feasibility: 1pt

19. **Generate Feedback**:
    - Overall score (≥8 to approve)
    - Architectural concerns (Critical/High/Medium/Low)
    - Pattern violations/anti-patterns
    - Integration risks
    - Improvement recommendations
    - Doc updates needed

20. **Execute Decision**:
    1. Call `make-decision` with decision_type: `architect-review-result`, context: {architecture_score, critical_issues, review_round}
    2. Apply result: Approved/RequiresRevision/Escalated + reasoning
    3. If Approved: Read `test_design_level` from QA Test Design Metadata (default: Standard)
    4. Set Status:
       - Approved + Simple → `Approved`
       - Approved + Standard/Comprehensive → `AwaitingTestDesign`
       - RequiresRevision → `RequiresRevision`
       - Escalated → `Escalated`
    5. Validate transition (ref: `story-status-transitions.yaml`)

21. **Update Metadata**:
    - Increment `review_round` (1st=1, 2nd=2)
    - Increment `total_reviews_conducted`
    - Append `review_history`: round, date, reviewer, score, decision, critical_issues, key_findings

## Quality Gates
- Architecture Score ≥ 8/10
- Zero critical issues
- Pattern compliance
- Integration feasibility
- SM validation complete
- Max 2 review rounds

## Output

Append review to Story file (no separate files):
1. Update Status field
2. Update Architect Review Metadata
3. Append to "Architect Review Results" section

### 1. Update Status
Set based on decision result and test_design_level (see Phase 5, step 20)

### 2. Update Metadata
```yaml
Architect Review Metadata:
  Review Rounds:
    review_round: [1/2]
    total_reviews_conducted: [+1]
  Review History:
    - Round: [1/2]
      Date: [YYYY-MM-DD HH:MM:SS]
      Reviewer: Architect Agent
      Score: [X]/10
      Decision: [approved/revise/escalate]
      Critical Issues: [count]
      Key Findings: [1-2 sentences]
```

### 3. Append Review Results

```markdown
---
### Review Round: [1/2] | Date: [YYYY-MM-DD] | Reviewer: Architect Agent
### Architecture Score: [X/10]

### Review Focus Areas
1. **Pattern Compliance [Score/3]**: Pattern consistency, appropriateness, anti-patterns
2. **System Integration [Score/2]**: Integration approach, dependencies, risks
3. **Scalability & Performance [Score/2]**: Scalability, performance, resource usage
4. **Security [Score/2]**: Security alignment, risk assessment, data handling
5. **Feasibility [Score/1]**: System-level feasibility, blockers

### Architectural Concerns
[Summary with severity. If none: "No significant concerns"]

**Issues**: Critical: [count], High: [count], Medium: [count], Low: [count]
[List issues by severity]

### Recommendations
[Actionable recommendations: immediate actions, doc updates, future considerations]

### Outcome
**Decision**: [from make-decision]
**Status**: [Approved/AwaitingTestDesign/RequiresRevision/Escalated]
**Test Design Level**: [Simple/Standard/Comprehensive] (if Approved)
**Reasoning**: [from decision]
**Next**: [QA test-design/Dev implement-story/SM revise/Escalated]
---
```

## Success Criteria
- Review completed within quality gates
- Critical/major issues identified
- Clear recommendation with reasoning
- Actionable feedback provided
- Architecture consistency maintained

### 4. Record Change Log

Add entry to Story's Change Log:

```markdown
## Change Log
### {YYYY-MM-DD HH:MM:SS} - Architect Review Round {1/2}
**Action**: Architect review completed
**Score**: {X}/10
**Issues**: Critical: {count}, High: {count}, Medium: {count}, Low: {count}
**Decision**: {Approved/RequiresRevision/Escalated}
**Status**: `{new_status}`
**Reasoning**: {explanation}
**Next**: {action}
---
```

### 5. Output Handoff

Based on final status:
- `AwaitingTestDesign`: "Next: QA execute `test-design {story_id}`" (add `risk-profile` if Comprehensive/security-sensitive)
- `Approved`: "Next: Dev execute `implement-story {story_id}`"
- `RequiresRevision`: "Next: SM execute `revise {story_id}`"
- `Escalated`: "Story escalated - requires human intervention"

## Notes
- Focus on architecture (SM validated basics)
- Reference SM results in metadata
- For Round 2: check Round 1 issues addressed
- Be specific with doc references
- Consider system context/maintainability
- Recommend doc updates if outdated
- Append to Story file (no separate files)
- Use `assessment/architect-technical-review-checklist.md` for scoring
- Use `make-decision` with `architect-review-result` decision type
- Update Status based on decision + test_design_level
- Mark issues as Critical/High/Medium/Low for SM auto-approval logic 