# Architect Technical Review Checklist

# ABBREVIATIONS (AC=Acceptance Criteria, Arch=Architecture, Perf=Performance, Sec=Security, Std=Standard, Comp=Comprehensive, Req=Required, Docs=Documents, Refs=References, Mgmt=Management)

[[LLM: Focus on system-level arch concerns. SM already validated tech stack, naming, file structure, docs format. Review complements (not duplicates) SM validation]]

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

[[LLM: Score each category. Total ≥7 → Approved, <7 → Revise]]

## 1. Pattern Compliance (3 pts)

| Item | Status |
|------|--------|
| Follows established arch patterns | [ ] |
| Pattern appropriate for use case | [ ] |
| No anti-patterns introduced | [ ] |
| Pattern usage documented | [ ] |

**Score:** ___/3 | **Issues:** ___

**Scoring:** 3=Excellent, 2=Good/minor concerns, 1=Issues not critical, 0=Significant violations

---

## 2. System Integration (2 pts)

| Item | Status |
|------|--------|
| Integration strategy sound | [ ] |
| Cross-service deps identified | [ ] |
| Integration risks mitigated | [ ] |
| Communication patterns followed | [ ] |

**Score:** ___/2 | **Issues:** ___

**Scoring:** 2=Sound w/ risk mitigation, 1=Acceptable/minor concerns, 0=Significant risks

---

## 3. Scalability & Perf (2 pts)

| Item | Status |
|------|--------|
| Scales w/ expected load | [ ] |
| Perf impact acceptable | [ ] |
| Resource usage reasonable | [ ] |
| No obvious bottlenecks | [ ] |

**Score:** ___/2 | **Issues:** ___

**Scoring:** 2=Excellent considerations, 1=Acceptable/minor concerns, 0=Significant issues

---

## 4. Security Arch (2 pts)

| Item | Status |
|------|--------|
| Aligns w/ security arch | [ ] |
| Security risks addressed | [ ] |
| Sensitive data handling compliant | [ ] |
| Security boundaries appropriate | [ ] |

**Score:** ___/2 | **Issues:** ___

**Scoring:** 2=Excellent alignment, 1=Acceptable/minor considerations, 0=Concerns present

---

## 5. Technical Feasibility (1 pt)

| Item | Status |
|------|--------|
| System-level feasibility confirmed | [ ] |
| No arch blockers | [ ] |
| System complexity manageable | [ ] |
| Arch dependencies viable | [ ] |

**Score:** ___/1 | **Issues:** ___

**Scoring:** 1=Feasible, 0=Concerns/blockers

---

# REVIEW SUMMARY

## Total Score

**Arch Review Score:** ___/10

## Outcome Decision

| Outcome | Criteria | Action |
|---------|----------|--------|
| **Approved** | Score ≥7 | Status="Approved", document approval+notes |
| **Revise** | Score <7 | Status="Blocked", provide revision reqs to SM |
| **Escalate** | Complex/novel/conflicting | Human architect review needed |

**Selected:** ___ | **Reasoning:** ___

---

## Findings

**Key Concerns:** ___

**Recommendations:** ___

**Advisory Notes** (Approved): ___

**Revision Reqs** (Revise): ___

**Escalation Reason** (Escalate): ___

---

## Metadata

| Field | Value |
|-------|-------|
| Reviewed By | Architect Agent |
| Review Date | ___ |
| SM Quality Score (ref) | ___/10 |
| Complexity Indicators (ref) | ___ |
| Review Duration | ___ min |
