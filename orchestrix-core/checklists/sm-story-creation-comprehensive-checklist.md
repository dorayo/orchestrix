# SM Story Creation Checklist

# ABBREVIATIONS (AC=Acceptance Criteria, NFR=Non-Functional Req, DoD=Definition of Done, Q=Quality, C=Complexity, S=Section, P=Phase, Arch=Architect, Std=Standard, Comp=Comprehensive, Eval=Evaluate, Req=Requirement, Refs=References, Prefs=Preferences, Perf=Performance, Auth=Authentication, Docs=Documents, Calc=Calculate)

[[LLM: TWO-PHASE PROCESS:
PHASE 1: Structure Validation (Gate) - Must = 100% to proceed
PHASE 2: Technical Quality (Scoring) - Only if Phase 1 passes
Auto-assign status via Decision Matrix]]

## Prerequisites
- Story file created from template
- Epic requirements extracted
- Architecture docs reviewed
- Dev Notes populated

---

# PHASE 1: STRUCTURE VALIDATION (GATE - MUST = 100%)

[[LLM: GATE CONDITION. Any fail → Status="Blocked", STOP]]

| Category | Item | Pass |
|----------|------|------|
| **Template** | All sections present | [ ] |
| | No placeholders remain | [ ] |
| | Standard structure followed | [ ] |
| | Status field set | [ ] |
| **AC Coverage** | All ACs have tasks | [ ] |
| | Task-AC mapping explicit | [ ] |
| | Tasks cover all AC reqs | [ ] |
| | No ACs without tasks | [ ] |
| **Task Logic** | Logical order | [ ] |
| | Dependencies clear | [ ] |
| | No circular deps | [ ] |
| | Frontend-first applied | [ ] |

**Completion: ___/12 (___%)** | **GATE:** [ ] PASS (100%) → Phase 2 | [ ] FAIL → Blocked

[[LLM: If FAIL: Status="Blocked", list issues, STOP. Do NOT proceed to Phase 2]]

---

# PHASE 2: TECHNICAL QUALITY (SCORING)

[[LLM: Only if Phase 1 = 100%. Calc score 0-10 from Sections 2+3]]

**Execute:** [ ] Yes (P1 passed) | [ ] No (P1 failed)

## Section 2: Technical Extraction (Weight: 50%)

[[LLM: Mark [x] Done, [ ] Not Done, [N/A]. If completion < 80% → Status="Blocked"]]

| Category | Item | Status |
|----------|------|--------|
| **Arch Info** | Data models + refs | [ ] |
| | API specs + refs | [ ] |
| | Tech stack + refs | [ ] |
| | File structure | [ ] |
| | Integration points | [ ] |
| **Tech Prefs** | Patterns consistent | [ ] |
| | Tech choices comply | [ ] |
| | No conflicts | [ ] |
| | Perf/security addressed | [ ] |
| **Source Refs** | Format: [Source: docs/...] | [ ] |
| | Docs exist/accessible | [ ] |
| | Sections match claims | [ ] |
| | No invented details | [ ] |

**Score: ___% (Done/Total)** | **Completion: ___% (Done/(Total-N/A))**

**HARD REQ:** [ ] PASS (≥80%) | [ ] FAIL (<80%) → Blocked

[[LLM: If <80%: Status="Blocked", note "Tech Extraction <80%", STOP]]

## Section 3: Implementation Readiness (Weight: 50%)

| Category | Item | Status |
|----------|------|--------|
| **Dev Notes** | Data models detailed | [ ] |
| | API specs complete | [ ] |
| | File locations explicit | [ ] |
| | Integration clear | [ ] |
| | Error handling addressed | [ ] |
| **Testing** | Approach outlined | [ ] |
| | Scenarios identified | [ ] |
| | Follows testing-strategy.md | [ ] |
| | Integrity reqs documented | [ ] |
| **Implementability** | Steps sequenced | [ ] |
| | Tools/tech specified | [ ] |
| | Config/setup documented | [ ] |
| | No extensive research needed | [ ] |

**Score: ___% (Done/Total)**

---

## Technical Quality Score

[[LLM: Only if P1=100% AND S2≥80%]]

**Formula:** `Score = (S2 × 0.50) + (S3 × 0.50)`

**Calc:**
- S2: ___% × 0.50 = ___
- S3: ___% × 0.50 = ___
- **Score: ___/10**

**Status:** [ ] Calculated | [ ] Not calc (P1 fail) | [ ] Not calc (S2<80%)

---

# COMPLEXITY DETECTION

[[LLM: Detect 7 indicators. Used in Decision Matrix. Only if Phase 2 completed]]

**Execute:** [ ] Yes (P2 done) | [ ] No (P1/P2 failed)

| # | Indicator | Pattern | Detected |
|---|-----------|---------|----------|
| 1 | API Changes | endpoint, REST, GraphQL, route | [ ] |
| 2 | DB Schema | schema, migration, table, column | [ ] |
| 3 | New Patterns | new pattern, design pattern, arch change | [ ] |
| 4 | Cross-Service | multiple services, integration | [ ] |
| 5 | Security | auth, encryption, permissions, PII | [ ] |
| 6 | Performance | optimization, caching, real-time | [ ] |
| 7 | Core Docs | modify data-models.md, rest-api-spec.md | [ ] |

**Total: ___/7**

---

# TEST DESIGN LEVEL

[[LLM: Determine level. If Arch review needed (Q 6.0-7.9 OR C≥2) → mark "Deferred", re-eval after Arch approval]]

**Execute:** After Complexity, before Decision Matrix

| Level | Criteria | Result |
|-------|----------|--------|
| **Simple** | C=0 AND Q≥8.5 AND No Security | [ ] |
| **Standard** | C=1-2 OR Q=7.0-8.4 | [ ] |
| **Comprehensive** | C≥3 OR Security Sensitive | [ ] |

**Level:** ___ | **Status:** ___ (NotRequired/Pending/Deferred)

**Defer if:** [ ] Arch review needed (Q 6.0-7.9 OR C≥2)

---

# DECISION MATRIX

[[LLM: Apply only if all prereqs passed. CRITICAL: Arch review BEFORE test design when needed]]

## Prereq Check

| Check | Status |
|-------|--------|
| P1 (Structure) | [ ] PASS (100%) / [ ] FAIL → Blocked |
| P2 (Tech Extract) | [ ] PASS (≥80%) / [ ] FAIL → Blocked |
| Tech Quality Score | [ ] Calc: ___/10 / [ ] Not calc |

**If any fail:** Status="Blocked", STOP

---

## ARCH REVIEW PRIORITY PRINCIPLE

[[LLM: CRITICAL: Arch review ALWAYS BEFORE test design when needed
- If Arch needed → Status=AwaitingArchReview, Test="Deferred"
- After Arch approval → Re-eval test level → AwaitingTestDesign/TestDesignComplete
- Prevents wasted test effort if Arch requires revisions]]

---

## Matrix Rules

| Quality | Complexity | Arch Review | Test Level | Status |
|---------|------------|-------------|------------|--------|
| **≥8.0** | 0 | NOT_NEEDED | Simple (eval now) | TestDesignComplete |
| | 1 | OPTIONAL (skip) | Std/Simple (eval now) | AwaitingTestDesign / TestDesignComplete |
| | 2+ | REQUIRED | Deferred | AwaitingArchReview |
| **6.0-7.9** | Any | REQUIRED | Deferred | AwaitingArchReview |
| **<6.0** | Any | N/A | N/A | Blocked |

**Inputs:**
- Quality: ___/10
- Complexity: ___/7
- Test Level: ___
- Security: [ ] Yes / [ ] No

**Result:**
- **Status:** `___`
- **Test Level:** `___`
- **Test Status:** `___`
- **Arch Review:** `___`
- **Reasoning:** ___
- **Quality:** ___ (excellent/good/insufficient)
- **Risk:** ___ (low/medium/high)

---

## Status Logic

```
IF Structure < 100%: Status="Blocked" (structure fail)
ELIF Tech Extract < 80%: Status="Blocked" (extract <80%)
ELIF Quality < 6.0: Status="Blocked" (quality low)
ELIF Q≥8.0 AND C=0 AND !Security:
  Test="Simple", Status="TestDesignComplete", Arch="NOT_NEEDED"
ELIF Q≥8.0 AND C=1:
  Arch="OPTIONAL" (skip)
  IF Q≥8.5 AND !Security: Test="Simple", Status="TestDesignComplete"
  ELSE: Test="Standard", Status="AwaitingTestDesign"
ELIF Q≥8.0 AND C≥2:
  Status="AwaitingArchReview", Arch="REQUIRED", Test="Deferred"
ELIF Q 6.0-7.9:
  Status="AwaitingArchReview", Arch="REQUIRED", Test="Deferred"
```

---

## Next Steps

| Status | Action | Coordination |
|--------|--------|--------------|
| **Blocked** | SM revise, re-run check | - |
| **AwaitingArchReview** | Arch: `review-story-technical-accuracy` | Test level deferred, re-eval after Arch |
| **AwaitingTestDesign** | QA: `test-design` (Std) or `test-design`+`risk-profile` (Comp) | Only after Arch (if needed) |
| **TestDesignComplete** | Dev: `implement-story` | Both Arch+Test done (if needed) |

---

## Status Flow

```
PRINCIPLE: Arch Review → Test Design → Dev

Path 1: Arch Required (Q 6.0-7.9 OR C≥2)
Blocked → AwaitingArchReview → [Re-eval Test] → AwaitingTestDesign → TestDesignComplete → Approved → Done

Path 2: No Arch (Q≥8.0 AND C≤1)
[Eval Test Now] → AwaitingTestDesign → TestDesignComplete → Approved → Done

Path 3: Skip Both (Q≥8.5 AND C=0 AND !Security)
TestDesignComplete → Approved → Done
```

