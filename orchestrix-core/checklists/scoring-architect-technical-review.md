# Architect Technical Review Checklist

---
metadata:
  type: assessment
  threshold: 70%
  on_fail: continue_with_score
  purpose: "System-level architecture review focusing on pattern compliance, integration, scalability, security, and technical feasibility"
---

## LLM INSTRUCTIONS

**Review Scope:** System-level architecture (SM already validated tech stack, naming, file structure, docs format)

**Execution:**
1. Complete Prerequisites
2. Score 6 Architecture Review categories (0-11 total)
3. Count critical issues
4. Use make-decision.md with architect-review-result decision type
5. Document Findings

**Scoring:** Full=Excellent/no concerns, Partial=Minor concerns, Zero=Significant issues

---

# ABBREVIATIONS (AC=Acceptance Criteria, Arch=Architecture, Perf=Performance, Sec=Security)

## Prerequisites

| Check | Status |
|-------|--------|
| SM quality validation done | [ ] |
| Story status Draft/Approved | [ ] |
| Complexity indicators documented | [ ] |
| Arch docs accessible | [ ] |
| SM validation results available | [ ] |

---

# ARCHITECTURE REVIEW (11 Points)

## 1. Pattern Compliance (3 pts)

| Item | Status |
|------|--------|
| Follows established arch patterns | [ ] |
| Pattern appropriate for use case | [ ] |
| No anti-patterns introduced | [ ] |
| Pattern usage documented | [ ] |

**Score:** ___/3 | **Issues:** ___

---

## 2. System Integration (2 pts)

| Item | Status |
|------|--------|
| Integration strategy sound | [ ] |
| Cross-service deps identified | [ ] |
| Integration risks mitigated | [ ] |
| Communication patterns followed | [ ] |

**Score:** ___/2 | **Issues:** ___

---

## 3. Scalability & Perf (2 pts)

| Item | Status |
|------|--------|
| Scales w/ expected load | [ ] |
| Perf impact acceptable | [ ] |
| Resource usage reasonable | [ ] |
| No obvious bottlenecks | [ ] |

**Score:** ___/2 | **Issues:** ___

---

## 4. Security Arch (2 pts)

| Item | Status |
|------|--------|
| Aligns w/ security arch | [ ] |
| Security risks addressed | [ ] |
| Sensitive data handling compliant | [ ] |
| Security boundaries appropriate | [ ] |

**Score:** ___/2 | **Issues:** ___

---

## 5. Technical Feasibility (1 pt)

| Item | Status |
|------|--------|
| System-level feasibility confirmed | [ ] |
| No arch blockers | [ ] |
| System complexity manageable | [ ] |
| Arch dependencies viable | [ ] |

**Score:** ___/1 | **Issues:** ___

---

## 6. Data Consistency & Synchronization (1 pt)

**Purpose**: Review whether Story has hidden cross-table data synchronization requirements

| Item | Status |
|------|--------|
| SM completed data sync analysis | [ ] |
| Cross-table sync relationships correctly identified | [ ] |
| Sync responsibility clearly defined (which service/operation is responsible) | [ ] |
| No missing status/expiry field dependencies | [ ] |

**Architect Review Guidelines**:

1. **Validate SM Analysis**: Check if Dev Notes "Data Synchronization Requirements" section is complete
2. **Supplemental Identification**: Based on architecture knowledge, are there sync requirements SM missed?
3. **Sync Timing**: Is sync executed synchronously or asynchronously? How are failures handled?
4. **Consistency Guarantee**: If sync fails, what state will the system be in? Is it acceptable?

**Typical Problem Patterns**:
- Payment success updates subscription status but License expiry not synced
- User status change but associated permissions/roles not updated
- Master table soft delete but dependent table data not cascaded

**Score:** ___/1 | **Issues:** ___

---

## 7. User Journey Continuity (1 pt)

**Purpose**: Verify that user-facing stories connect to form coherent user journeys (skip for non-user-facing stories, award 1 pt automatically).

| Item | Status |
|------|--------|
| Entry points reference implemented or planned stories | [ ] |
| Exit points have defined target stories | [ ] |
| Precondition fallbacks defined (redirect, error state, empty state) | [ ] |
| No dead ends in user journey (every exit leads somewhere) | [ ] |

**Architect Review Guidelines**:

1. **Entry Validation**: Do entry points map to real navigation paths from source stories? Are source stories implemented or planned in the same epic?
2. **Exit Validation**: Do exit points specify concrete target stories? Will users have a clear next action?
3. **Fallback Coverage**: For each precondition, is there a defined behavior when it is NOT met? (redirect to login, show empty state, display error message)
4. **Journey Completeness**: Trace the full user path — does the story create any dead ends where users have no way forward?

**Typical Problem Patterns**:
- Story assumes "user is on dashboard" but no story implements the dashboard navigation
- Success page has no next-step action (dead end)
- Precondition "user has verified email" with no handling for unverified users

**Score:** ___/1 | **Issues:** ___

---

# REVIEW SUMMARY

**Arch Review Score:** ___/12
**Critical Issues Count:** ___  
**Review Round:** ___

---

## Decision

**Use make-decision.md:**
- Decision type: `architect-review-result`
- Inputs:
  - architecture_score: [score from above]
  - critical_issues: [count from above]
  - review_round: [current iteration number]

**Decision file:** `data/decisions-architect-review-result.yaml`

The decision determines: Approved | RequiresRevision | Escalated

---

## Findings

**Key Concerns:** ___

**Recommendations:** ___

**Notes:** ___

---

## Metadata

| Field | Value |
|-------|-------|
| Reviewed By | Architect Agent |
| Review Date | ___ |
| SM Quality Score | ___/10 |
| Review Duration | ___ min |
