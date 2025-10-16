# Architect Technical Review Checklist

---
metadata:
  type: assessment
  threshold: 70%
  on_fail: continue_with_score
  purpose: "System-level architecture review focusing on pattern compliance, integration, scalability, security, and technical feasibility"
  used_by:
    - review-story-technical-accuracy.md
    - review-story-technical-auto.md
  estimated_tokens: 600
  version: 1.1
---

## LLM INSTRUCTIONS

**Review Scope:** System-level architecture (SM already validated tech stack, naming, file structure, docs format)

**Execution:**
1. Complete Prerequisites
2. Score 5 Architecture Review categories (0-10 total)
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

# ARCHITECTURE REVIEW (10 Points)

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

# REVIEW SUMMARY

**Arch Review Score:** ___/10  
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

**Decision file:** `data/decisions/architect-review-result.yaml`

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
