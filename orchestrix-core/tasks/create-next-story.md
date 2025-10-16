# Create Next Story Task

## Permission Check

1. Confirm you are SM agent via `{root}/data/story-status-transitions.yaml`
2. Verify `can_create_story: true` and `can_set_initial_status: true`
3. For existing stories: verify status is `Blocked` or `RequiresRevision`
4. On failure: log error, reference responsible agent, HALT

## Sequential Execution

### 0. Load Configuration

1. Load `{root}/core-config.yaml`
2. If missing: HALT with message "core-config.yaml not found. Copy from GITHUB orchestrix-core/core-config.yaml or run Orchestrix installer"
3. Extract: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

### 1. Identify Next Story

1. Locate epic files via `prdSharded` config
2. Load highest `{epicNum}.{storyNum}.story.md` from `devStoryLocation`
3. If story exists:
   - Verify status is 'Done', else alert: "ALERT: Found incomplete story! File: {lastEpicNum}.{lastStoryNum}.story.md Status: [status]. Fix first or accept risk?"
   - Select next sequential story in current epic
   - If epic complete, prompt: "Epic {epicNum} Complete. Options: 1) Begin Epic {epicNum+1} 2) Select specific story 3) Cancel"
   - NEVER auto-skip epics - require user instruction
4. If no stories exist: next is 1.1
5. Announce: "Identified next story: {epicNum}.{storyNum} - {Title}"

### 2. Gather Requirements

1. Extract requirements from epic file
2. If previous story exists, review Dev Agent Record for:
   - Completion notes, debug logs
   - Implementation deviations, technical decisions
   - Challenges, lessons learned
3. Extract insights for current story

### 3. Gather Architecture Context

#### 3.1 Reading Strategy

1. If `architectureSharded: true`: read `{architectureShardedLocation}/index.md`
2. Else: use monolithic `architectureFile`

#### 3.2 Read by Story Type

**All Stories:** tech-stack.md, source-tree.md, coding-standards.md, testing-strategy.md

**Backend/API:** + data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md, external-apis.md

**Frontend/UI:** + frontend-architecture.md, components.md, core-workflows.md, data-models.md

**Full-Stack:** Both Backend + Frontend

#### 3.3 Extract Technical Details

Extract ONLY story-relevant information. Do NOT invent libraries, patterns, or standards.

1. Extract:
   - Data models, schemas, structures
   - API endpoints (implement/consume)
   - Component specs for UI
   - File paths, naming conventions
   - Testing requirements
   - Security/performance considerations
2. Cite sources: `[Source: docs/architecture/{filename}.md#{section}]`

#### 3.4 Field-Level API Contract

For API/shared data structures, create table in Dev Notes under "Field-Level API Contract":

| Field | Type | Required | Description | Source |
|-------|------|----------|-------------|--------|
| userId | string | Yes | Unique user identifier | [Source: data-models.md#User] |

Requirements:
- Include: field names, types, required status, descriptions, sources
- Match casing/naming from architecture docs
- Mark missing info as [MISSING]
- If no fields: note "No shared data fields defined for this story"

### 4. Verify Structure Alignment

1. Cross-reference requirements with `docs/architecture/source-tree.md`
2. Verify file paths, component locations, module names align
3. Document conflicts in "Project Structure Notes"

### 5. Technical Extraction Verification (MANDATORY)

Execute `{root}/checklists/validation/sm-technical-extraction-checklist.md`:

1. Complete ALL sections
2. Mark: [x] Done, [ ] Not Done, [N/A] Not Applicable
3. Explain [ ] Not Done items
4. Achieve ≥80% completion (< 20% Not Done)
5. Quality gates:
   - If > 20% Not Done: HALT, re-examine architecture
   - If critical details missing: request clarification
   - If conflicts: document and flag
6. Documentation:
   - [x] Done items → Dev Notes entries
   - Accurate source references
   - Validated technical assumptions

Failure invalidates story creation.

### 6. Populate Story Template

Create `{devStoryLocation}/{epicNum}.{storyNum}.story.md`:

1. Fill basic info: Title, Status (set by quality check), Story statement, ACs from Epic
2. **Dev Notes (CRITICAL):**
   - Use ONLY verified info from Step 5
   - Include from Steps 2-3, organized:
     - Previous Story Insights
     - Technical Preferences Summary (from technical-preferences.md via architecture)
     - Data Models (schemas, validation, relationships)
     - API Specifications (endpoints, request/response, auth)
     - Component Specifications (UI details, props, state)
     - File Locations (exact paths)
     - Testing Requirements (cases, strategies from testing-strategy.md)
     - Testing Integrity: Tests are AUTHORITATIVE, expectations IMMUTABLE, implementation adapts to tests, modifications need business justification, distinguish requirement tests (immutable) vs implementation tests (adjustable)
     - Technical Constraints (versions, performance, security)
     - Technical Extraction Verification Summary (completion rate, flagged issues)
   - Cite sources: `[Source: docs/architecture/{filename}.md#{section}]`
   - Reference original preferences, note adaptations
   - If missing: state "No specific guidance found in architecture docs"
3. **Tasks/Subtasks:**
   - Generate sequential tasks from: Epic Requirements, Story AC, Architecture
   - Reference architecture docs
   - Include unit testing subtasks per Testing Strategy
   - Link to ACs: `Task 1 (AC: 1, 3)`
4. Add structure alignment notes from Step 4

### 7. Quality Verification

Execute enhanced verification:

1. **Dev Notes Accuracy:**
   - Verify details match Step 5 verified items
   - Confirm source references accurate and accessible
   - Validate no unverified assumptions
2. **Implementation Guidance:**
   - Ensure sufficient guidance
   - Verify technical decisions backed by architecture
   - Confirm file locations/naming explicitly specified
3. **Technical Risk:**
   - Document risks from extraction verification
   - Flag incomplete/conflicting architecture guidance
   - Note external dependencies

### 8. Quality Check & Status Decision

Execute `{root}/tasks/execute-checklist.md` with `{root}/checklists/assessment/sm-story-quality.md`

#### Status Transition Validation

Validate via `{root}/data/story-status-transitions.yaml`:

1. For new stories: SM authorized, allowed statuses: `Blocked`, `AwaitingArchReview`, `TestDesignComplete`, `AwaitingTestDesign`
2. Validate transition allowed, SM has permission, prerequisites met
3. On failure: log error, HALT, provide guidance
4. On success: set status, log transition

#### Phase 1: Structure Validation (100% Required)

1. Check required sections present
2. Verify no unfilled placeholders
3. Validate ACs have corresponding tasks with mapping
4. Verify logical task order
5. If < 100%: set Status = `Blocked`, STOP
6. If = 100%: proceed to Phase 2

#### Phase 2: Technical Quality (If Phase 1 passes)

1. Check technical extraction ≥80% (hard requirement)
2. If < 80%: set Status = `Blocked`, STOP
3. Calculate Technical Quality Score (0-10):
   - Technical Extraction: 50%
   - Implementation Readiness: 50%
4. Detect 7 complexity indicators: API changes, DB schema, new patterns, cross-service, security, performance, architecture docs
5. Make status decisions
6. Update story with status and summary

#### Status Decisions

**Step 1: Architect Review** (`sm-architect-review-needed`)
- Context: `quality_score`, `complexity_indicators`
- Output: `REQUIRED`, `NOT_REQUIRED`, `BLOCKED`
- If `BLOCKED`: Status = `Blocked`, STOP
- If `REQUIRED`: Status = `AwaitingArchReview`, defer test design
- If `NOT_REQUIRED`: proceed to Step 2

**Step 2: Test Design Level** (`sm-test-design-level`)
- Context: `complexity_indicators`, `quality_score`, `security_sensitive`
- Output: `Simple`, `Standard`, `Comprehensive`

**Step 3: Final Status** (`sm-story-status`)
- Context: `architect_review_result`, `test_design_level`
- Output: Final status and next action

#### Report Format

```markdown
## Story Quality Check Report

### Phase 1: Structure Validation
- Result: [PASS/FAIL]
- Completion: [X]% (100% required)
- Failed Items: [list]

### Phase 2: Technical Quality
- Executed: [Yes/No]
- Score: [X.X/10]
  - Technical Extraction: [X]% × 0.50 = [X.X]
  - Implementation Readiness: [X]% × 0.50 = [X.X]
- Extraction Rate: [X]% (≥80% required)

### Complexity Analysis
- Detected: [count]/7
[List indicators]

### Decisions
- Architect Review: [REQUIRED/NOT_REQUIRED/BLOCKED] - [reasoning]
- Test Design Level: [Simple/Standard/Comprehensive] - [reasoning]
- Final Status: [status] - [reasoning]
- Next Action: [action]
```

### 9. Record Change Log

Add entry to Story file "Change Log" section:

```markdown
## Change Log

### {YYYY-MM-DD HH:MM:SS} - SM Story Creation

**Action:** Initial story creation and quality assessment

**Quality Assessment:**
- Structure Validation: {PASS/FAIL} ({rate}%)
- Technical Quality Score: {score}/10
  - Technical Extraction: {score}/10 ({rate}%)
  - Implementation Readiness: {score}/10
- Complexity Indicators: {count}/7
  {List indicators}

**Decisions:**
- Architect Review: {REQUIRED/NOT_REQUIRED/BLOCKED} - {reasoning}
- Test Design Level: {Simple/Standard/Comprehensive} - {reasoning}
- Final Status: `{status}`
- Reasoning: {explanation}

**Next Action:** {what happens next}

---
```

Include: timestamp (YYYY-MM-DD HH:MM:SS), validation result, quality scores, extraction rate, complexity indicators, decision outputs with reasoning, next action.

### 10. Output Handoff Message

Generate message from `sm-story-status` decision task `next_action`:

**Status-Based Messages:**

- `Blocked`: "Story blocked - SM must revise and resubmit"
- `AwaitingArchReview`: "Next: Architect execute 'review-story {epicNum}.{storyNum}'. Note: Test design level ({level}) deferred until approval"
- `AwaitingTestDesign`: "Next: QA execute 'test-design {epicNum}.{storyNum}'. Level: {level}"
  - If security-sensitive: Add "'risk-profile {epicNum}.{storyNum}'. Level: Comprehensive (security-sensitive)"
- `TestDesignComplete`: "Next: Dev execute 'implement-story {epicNum}.{storyNum}'. Note: Simple level - test design not required"
- `Approved`: "Next: Dev execute 'implement-story {epicNum}.{storyNum}'"

Actions:
1. Add message to Story file "Next Steps" section
2. Display prominently to user

### 11. Summary

Two-phase quality assessment with decision-based status complete.

**Process:**
1. Phase 1 (Structure): 100% required, else `Blocked`
2. Phase 2 (Technical): ≥80% extraction required, else `Blocked`. Score (0-10): Technical Extraction 50%, Implementation Readiness 50%. Detect 7 complexity indicators
3. Decisions: `sm-architect-review-needed`, `sm-test-design-level`, `sm-story-status`
4. Handoff message

**Status Outcomes:**
- `Blocked`: SM revise and re-run
- `AwaitingArchReview`: Architect execute `review-story {epicNum}.{storyNum}`
- `AwaitingTestDesign`: QA execute test design per level
- `TestDesignComplete`: Dev execute `implement-story {epicNum}.{storyNum}`

**Benefits:** Structure validated first, ≥80% extraction threshold, complexity detected, reusable decision logic (`{root}/data/decisions/`), consistent workflows, clear handoffs, centralized framework reduces tokens.
