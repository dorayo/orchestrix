# apply-qa-fixes

Implement fixes based on QA results (gate and assessments) for a specific story. This task is for the Dev agent to systematically consume QA outputs and apply code/test changes while only updating allowed sections in the story file.

## Purpose

- Read QA outputs for a story (gate YAML + assessment markdowns)
- Create a prioritized, deterministic fix plan
- Apply code and test changes to close gaps and address issues
- Update only the allowed story sections for the Dev agent

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "2.2"
  - qa_root: from `orchestrix/core-config.yaml` key `qa.qaLocation` (e.g., `docs/project/qa`)
  - story_root: from `orchestrix/core-config.yaml` key `devStoryLocation` (e.g., `docs/project/stories`)

optional:
  - story_title: '{title}' # derive from story H1 if missing
  - story_slug: '{slug}' # derive from title (lowercase, hyphenated) if missing
```

## QA Sources to Read

- Gate (YAML): `{qa_root}/gates/{epic}.{story}-*.yml`
  - If multiple, use the most recent by modified time
- Assessments (Markdown):
  - Test Design: `{qa_root}/assessments/{epic}.{story}-test-design-*.md`
  - Traceability: `{qa_root}/assessments/{epic}.{story}-trace-*.md`
  - Risk Profile: `{qa_root}/assessments/{epic}.{story}-risk-*.md`
  - NFR Assessment: `{qa_root}/assessments/{epic}.{story}-nfr-*.md`

## Agent Permission Check (MANDATORY)

**Execute**: `{root}/tasks/utils/validate-agent-permission.md`

**Input**:
```yaml
agent_id: dev
story_path: {story_path}
action: apply_qa_fixes
```

**On FAIL**:
- Output error_message and guidance
- Show responsible_agent for current status
- HALT - Do NOT proceed with fixes

**On PASS**:
- Log permission validation success
- Proceed with QA fixes

## Prerequisites

- Repository builds and tests run locally (Deno 2)
- Lint and test commands available:
  - `deno lint`
  - `deno test -A`

## Process (Do not skip steps)

### 0) Load Core Config & Locate Story

- Read `orchestrix/core-config.yaml` and resolve `qa_root` and `story_root`
- Locate story file in `{story_root}/{epic}.{story}.*.md`
  - HALT if missing and ask for correct story id/path

### 1) Collect QA Findings

- Parse the latest gate YAML:
  - `gate` (PASS|CONCERNS|FAIL|WAIVED)
  - `review_round` (current QA review round number)
  - `issues_from_previous_round` (if present, for tracking improvement)
  - `top_issues[]` with `id`, `severity`, `finding`, `suggested_action`
  - `nfr_validation.*.status` and notes
  - `trace` coverage summary/gaps
  - `test_design.coverage_gaps[]`
  - `risk_summary.recommendations.must_fix[]` (if present)
- Read any present assessment markdowns and extract explicit gaps/recommendations
- Record the QA review round number for later reference in Dev Agent Record

### 2) Build Deterministic Fix Plan (Priority Order)

Apply in order, highest priority first:

1. High severity items in `top_issues` (security/perf/reliability/maintainability)
2. NFR statuses: all FAIL must be fixed → then CONCERNS
3. Test Design `coverage_gaps` (prioritize P0 scenarios if specified)
4. Trace uncovered requirements (AC-level)
5. Risk `must_fix` recommendations
6. Medium severity issues, then low

Guidance:

- Prefer tests closing coverage gaps before/with code changes
- Keep changes minimal and targeted; follow project architecture and TS/Deno rules

### 3) Apply Changes

- Implement code fixes per plan
- Add missing tests to close coverage gaps (unit first; integration where required by AC)
- Keep imports centralized via `deps.ts` (see `docs/project/typescript-rules.md`)
- Follow DI boundaries in `src/core/di.ts` and existing patterns

### 4) Validate

- Run `deno lint` and fix issues
- Run `deno test -A` until all tests pass
- Iterate until clean

### 5) Update Story (Allowed Sections ONLY)

CRITICAL: Dev agent is ONLY authorized to update these sections of the story file. Do not modify any other sections (e.g., QA Results, Story, Acceptance Criteria, Dev Notes, Testing):

- Tasks / Subtasks Checkboxes (mark any fix subtask you added as done)
- Dev Agent Record →
  - Agent Model Used (if changed)
  - Debug Log References (commands/results, e.g., lint/tests)
  - Completion Notes List (what changed, why, how, and **based on QA review round {review_round}**)
  - File List (all added/modified/deleted files)
- Change Log (new dated entry describing applied fixes and **referencing QA review round {review_round}**)
- Status (see Rule below)

Status Rule (Intelligent Status Setting with Validation):

**Before setting status, validate the transition:**

1. **Validate Transition is Allowed:**
   - Reference `{root}/data/story-status-transitions.yaml`
   - Current status: `InProgress`
   - Target status: `Review` (if fixes complete) or `InProgress` (if work continues)
   - Verify the transition is in the allowed_transitions list
   - Confirm Dev has permission for this status change

2. **Check Prerequisites:**
   - For `Review`: Verify implementation_completed = true AND all_tasks_done = true AND tests_written = true
   - For `InProgress`: No prerequisites (staying in same status)

3. **If validation fails:**
   - Log error with details from story-status-transitions.yaml
   - HALT and inform user of validation failure
   - Do NOT update status

4. **If validation succeeds:**
   - If Dev believes all issues are resolved and quality is satisfactory → set `Status: Review` (triggers re-QA)
   - If significant work remains or Dev is uncertain → keep `Status: InProgress`
   - Note: The status should reflect Dev's assessment of fix completeness, not the previous gate result
   - Log the transition for audit purposes

**Change Log Entry**:

Use template: `{root}/templates/dev-change-log-qa-fixes-tmpl.yaml`

Populate all template variables and append to existing Change Log.

### 6) Output Handoff Message (MANDATORY - FINAL STEP)

**CRITICAL**: This step is MANDATORY and must ALWAYS be executed as the final action of this task.

Use template: `{root}/templates/qa-handoff-message-tmpl.yaml`

Based on status set in step 5:
- **If status = `Review`**: Use `qa_fixes_complete` message
- **If status = `InProgress`**: Use `qa_fixes_in_progress` message

**IMPORTANT**: The handoff command MUST be the final line of your output.

### 7) Do NOT Edit Gate Files

- Dev does not modify gate YAML. If fixes address issues, request QA to re-run `review-story` to update the gate

## Blocking Conditions

- Missing `orchestrix/core-config.yaml`
- Story file not found for `story_id`
- No QA artifacts found (neither gate nor assessments)
  - HALT and request QA to generate at least a gate file (or proceed only with clear developer-provided fix list)

## Completion Checklist

- deno lint: 0 problems
- deno test -A: all tests pass
- All high severity `top_issues` addressed
- NFR FAIL → resolved; CONCERNS minimized or documented
- Coverage gaps closed or explicitly documented with rationale
- Story updated (allowed sections only) including File List and Change Log
- Dev Agent Record includes reference to QA review round number
- Change Log entry references QA review round number
- Status set according to Status Rule (intelligent assessment)
- **MANDATORY**: Clear handoff message output as final step (Step 6)

## Example: Story 2.2

Given gate `docs/project/qa/gates/2.2-*.yml` shows

- `review_round`: 1
- `coverage_gaps`: Back action behavior untested (AC2)
- `coverage_gaps`: Centralized dependencies enforcement untested (AC4)

Fix plan:

- Add a test ensuring the Toolkit Menu "Back" action returns to Main Menu
- Add a static test verifying imports for service/view go through `deps.ts`
- Re-run lint/tests and update Dev Agent Record + File List accordingly
- In Dev Agent Record, note: "Fixes applied based on QA review round 1"
- In Change Log, add entry: "2024-01-15: Applied fixes for QA review round 1 - added missing tests for AC2 and AC4"
- Set Status to `Review` (all issues resolved)
- **Output handoff message**:
  ```
  ✅ QA FIXES COMPLETE
  Story: 2.2 → Status: Review

  All QA-identified issues have been addressed:
  - 2 issues fixed (AC2 and AC4 coverage gaps)
  - All tests passing
  - Ready for QA re-review

  🎯 HANDOFF TO qa: *review 2.2
  ```

## Key Principles

- Deterministic, risk-first prioritization
- Minimal, maintainable changes
- Tests validate behavior and close gaps
- Strict adherence to allowed story update areas
- Gate ownership remains with QA; Dev signals readiness via Status
- Support for multi-round QA reviews with proper tracking
- Intelligent status setting based on Dev's assessment of fix completeness
- **MANDATORY handoff messages for seamless agent transitions in automated workflows**