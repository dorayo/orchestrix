# Quick Fix Verification Gate

---
metadata:
  type: gate
  threshold: 100%
  on_fail: fix_and_retry
  purpose: "Verify quick fix completeness, consistency, and safety"
---

## Inputs

```yaml
required:
  - impact_report: 'Impact Report from Phase 2'
  - fix_plan: 'Fix Plan from Phase 3'
  - modified_files: 'List of files changed'
```

## Verification Sections

### Section 1: Completeness (Weight: 40%)

| # | Check | Criteria | Status |
|---|-------|----------|--------|
| 1.1 | Impact files processed | Every file in Impact Report reviewed or modified | ⬜ |
| 1.2 | Sync points addressed | Every sync point in Impact Report has action taken | ⬜ |
| 1.3 | Plan items complete | Every item in Fix Plan Modification Checklist is ✅ | ⬜ |
| 1.4 | No orphaned changes | All changes are traceable to Impact Report | ⬜ |

**Validation**:
```
FOR each file in impact_report.directly_affected:
  IF file NOT in modified_files AND NOT explicitly marked "verify only":
    FAIL: "Impact file {file} not processed"

FOR each point in impact_report.sync_points:
  IF point.status != checked:
    FAIL: "Sync point not addressed: {point}"
```

**Result**: PASS if all 4 checks pass | FAIL otherwise

---

### Section 2: Consistency (Weight: 25%)

| # | Check | Criteria | Status |
|---|-------|----------|--------|
| 2.1 | Code style match | Changes follow existing patterns in file | ⬜ |
| 2.2 | Naming convention | New/modified identifiers match surrounding code | ⬜ |
| 2.3 | Error handling | Exception handling matches file's pattern | ⬜ |
| 2.4 | Import style | Import statements follow file's convention | ⬜ |

**Validation**:
```
FOR each modified_file:
  COMPARE change_style WITH surrounding_code_style
  IF mismatch_detected:
    FLAG: "Style inconsistency in {file}: {detail}"
```

**Result**: PASS if ≤1 minor inconsistency | FAIL if >1 or major inconsistency

---

### Section 3: Test Verification (Weight: 25%)

| # | Check | Criteria | Status |
|---|-------|----------|--------|
| 3.1 | Tests pass | All project tests pass | ⬜ |
| 3.2 | Bug fixed | Original bug scenario no longer reproduces | ⬜ |
| 3.3 | Related tests | Tests covering modified code pass | ⬜ |
| 3.4 | No new failures | No previously passing tests now fail | ⬜ |

**Validation**:
```bash
# Run full test suite
npm test  # or project equivalent

# Check for regressions
git stash
npm test > before.log
git stash pop
npm test > after.log
diff before.log after.log  # Should show no new failures
```

**Result**: PASS if all tests pass and no regressions | FAIL otherwise

---

### Section 4: Side Effect Check (Weight: 10%)

| # | Check | Criteria | Status |
|---|-------|----------|--------|
| 4.1 | No new warnings | Lint/build produces no new warnings | ⬜ |
| 4.2 | No unintended changes | Only planned files modified | ⬜ |
| 4.3 | Behavior preserved | Unrelated functionality unchanged | ⬜ |

**Validation**:
```bash
# Check for new warnings
npm run lint 2>&1 | grep -c "warning"  # Compare with baseline

# Verify only planned files changed
git diff --name-only | sort > actual_changes.txt
# Compare with fix_plan.files
```

**Result**: PASS if no new warnings and only planned changes | FAIL otherwise

---

## Gate Decision

```yaml
gate_result:
  section_scores:
    completeness: {0-100}%
    consistency: {0-100}%
    test_verification: {0-100}%
    side_effect_check: {0-100}%

  weighted_score: {calculated}%

  decision: PASS | FAIL

  # PASS criteria: All sections ≥ 80% AND weighted_score ≥ 90%
  # FAIL criteria: Any section < 80% OR weighted_score < 90%
```

## Output Format

```yaml
quick_fix_verification:
  status: PASS | FAIL
  score: {percentage}

  completeness:
    status: PASS | FAIL
    issues: []

  consistency:
    status: PASS | FAIL
    issues: []

  tests:
    status: PASS | FAIL
    passed: {count}
    failed: {count}
    issues: []

  side_effects:
    status: PASS | FAIL
    new_warnings: {count}
    unplanned_changes: []

  blocking_issues: []
  recommendations: []
```

## On Failure

1. Document failed checks
2. Identify root cause of failure
3. Update Fix Plan if needed
4. Re-execute fixes
5. Re-run verification

Max retry: 2 attempts. After 2 failures → Recommend story creation.
