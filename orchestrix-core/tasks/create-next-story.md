# Create Next Story Task

## Purpose

To identify the next logical story based on project progress and epic definitions, and then to prepare a comprehensive, self-contained, and actionable story file using the `Story Template`. This task ensures the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research or finding its own context.

## Agent Permission Check

**CRITICAL**: Before proceeding with story creation, verify SM agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm you are the SM (Story Manager) agent
   - Reference `{root}/data/story-status-transitions.yaml`

2. **Check Story Creation Permission:**
   - Verify SM has `can_create_story: true` in agent_permissions
   - Verify SM has `can_set_initial_status: true`
   - Allowed initial statuses: `Blocked`, `AwaitingArchReview`, `Approved`

3. **If this is modifying an existing story:**
   - Read the Story's current `Status` field
   - Verify status is one of: `Blocked`, `RequiresRevision`
   - Confirm SM has permission to modify stories in this status
   - Reference `can_modify_in_statuses` in story-status-transitions.yaml

4. **If permission check fails:**
   - Log error: "SM agent does not have permission to create/modify this story"
   - Reference the responsible agent from story-status-transitions.yaml
   - HALT and inform user of the permission violation
   - Do NOT proceed with story creation/modification

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Load Core Configuration and Check Workflow

- Load `{root}/core-config.yaml` from the project root
- If the file does not exist, HALT and inform the user: "core-config.yaml not found. This file is required for story creation. You can either: 1) Copy it from GITHUB orchestrix-core/core-config.yaml and configure it for your project OR 2) Run the Orchestrix installer against your project to upgrade and add the file automatically. Please add and configure core-config.yaml before proceeding."
- Extract key configurations: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

### 1. Identify Next Story for Preparation

#### 1.1 Locate Epic Files and Review Existing Stories

- Based on `prdSharded` from config, locate epic files (sharded location/pattern or monolithic PRD sections)
- If `devStoryLocation` has story files, load the highest `{epicNum}.{storyNum}.story.md` file
- **If highest story exists:**
  - Verify status is 'Done'. If not, alert user: "ALERT: Found incomplete story! File: {lastEpicNum}.{lastStoryNum}.story.md Status: [current status] You should fix this story first, but would you like to accept risk & override to create the next story in draft?"
  - If proceeding, select next sequential story in the current epic
  - If epic is complete, prompt user: "Epic {epicNum} Complete: All stories in Epic {epicNum} have been completed. Would you like to: 1) Begin Epic {epicNum + 1} with story 1 2) Select a specific story to work on 3) Cancel story creation"
  - **CRITICAL**: NEVER automatically skip to another epic. User MUST explicitly instruct which story to create.
- **If no story files exist:** The next story is ALWAYS 1.1 (first story of first epic)
- Announce the identified story to the user: "Identified next story for preparation: {epicNum}.{storyNum} - {Story Title}"

### 2. Gather Story Requirements and Previous Story Context

- Extract story requirements from the identified epic file
- If previous story exists, review Dev Agent Record sections for:
  - Completion Notes and Debug Log References
  - Implementation deviations and technical decisions
  - Challenges encountered and lessons learned
- Extract relevant insights that inform the current story's preparation

### 3. Gather Architecture Context

#### 3.1 Determine Architecture Reading Strategy

- **If `architectureSharded: true`**: Read `{architectureShardedLocation}/index.md` then follow structured reading order below
- **Else**: Use monolithic `architectureFile` for similar sections

#### 3.2 Read Architecture Documents Based on Story Type

**For ALL Stories:** tech-stack.md, source-tree.md, coding-standards.md, testing-strategy.md

**For Backend/API Stories, additionally:** data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md, external-apis.md

**For Frontend/UI Stories, additionally:** frontend-architecture.md, components.md, core-workflows.md, data-models.md

**For Full-Stack Stories:** Read both Backend and Frontend sections above

#### 3.2.1 Frontend-First Strategy Implementation

**If `frontendFirstStrategy: true` in core-config.yaml**, apply the following story decomposition logic for Full-Stack stories:

**Phase-Based Task Structure:**
- **Phase 1 Tasks**: Frontend implementation with mocked data/APIs
- **Phase 2 Tasks**: Backend implementation to match frontend contracts
- **Phase 3 Tasks**: Integration and end-to-end testing

**CRITICAL**: For Full-Stack stories, automatically decompose into frontend-first phases unless story is explicitly backend-only (e.g., data migration, background jobs, pure API endpoints).

#### 3.3 Extract Story-Specific Technical Details

Extract ONLY information directly relevant to implementing the current story. Do NOT invent new libraries, patterns, or standards not in the source documents.

Extract:

- Specific data models, schemas, or structures the story will use
- API endpoints the story must implement or consume
- Component specifications for UI elements in the story
- File paths and naming conventions for new code
- Testing requirements specific to the story's features
- Security or performance considerations affecting the story

ALWAYS cite source documents: `[Source: docs/architecture/{filename}.md#{section}]`

#### 3.4 Generate Field-Level API Contract Table

If the story involves API communication or any shared data structure between frontend and backend, you MUST extract and define all relevant fields in a contract table format inside the `Dev Notes` section under the heading `Field-Level API Contract`.

- This table MUST include field names, types, required status, descriptions, and original sources
- Field names MUST match casing, structure, and naming conventions defined in architecture documents
- Do NOT invent field names or structures. If missing, explicitly mark as [MISSING] and flag the issue
- This table will serve as the **authoritative reference** for both frontend and backend developers during implementation and integration

**Example Table Format:**

```md
| Field       | Type     | Required | Description             | Source                                  |
|-------------|----------|----------|-------------------------|-----------------------------------------|
| userId      | string   | Yes      | Unique user identifier  | [Source: data-models.md#User]           |
| email       | string   | Yes      | User email address      | [Source: rest-api-spec.md#RegisterUser] |
| avatarUrl   | string   | No       | Profile image URL       | [Source: components.md#UserCard]        |

- This table is MANDATORY if the story involves request/response payloads, database entities, or component props

- If no fields are relevant, include this note: "No shared data fields defined for this story"

### 4. Verify Project Structure Alignment

- Cross-reference story requirements with Project Structure Guide from `docs/architecture/source-tree.md`
- Ensure file paths, component locations, or module names align with defined structures
- Document any structural conflicts in "Project Structure Notes" section within the story draft

### 5. **MANDATORY Technical Detail Extraction Verification**

**CRITICAL:** Before populating the Story Template, execute the technical extraction verification process:

- Execute `{root}/checklists/sm-technical-extraction-checklist.md` as a mandatory quality gate
- **Verification Requirements:**
  - Complete ALL sections of the technical extraction checklist
  - Mark each item as [x] Done, [ ] Not Done, or [N/A] Not Applicable
  - Provide detailed explanations for any [ ] Not Done items
  - Achieve minimum 80% completion rate (< 20% Not Done items)
- **Quality Gates:**
  - If > 20% items marked as [ ] Not Done: HALT and re-examine architecture documents
  - If critical technical details are missing: Request clarification from user or architect
  - If technical preferences conflicts detected: Document and flag for resolution
- **Documentation Requirements:**
  - All [x] Done items MUST have corresponding entries in the upcoming Dev Notes section
  - All source document references MUST be accurate and specific
  - All technical assumptions MUST be validated against architecture documents

**FAILURE TO COMPLETE THIS VERIFICATION STEP INVALIDATES THE ENTIRE STORY CREATION PROCESS**

### 6. Populate Story Template with Full Context

- Create new story file: `{devStoryLocation}/{epicNum}.{storyNum}.story.md` using Story Template
- Fill in basic story information: Title, Status (will be set by quality check), Story statement, Acceptance Criteria from Epic
- **`Dev Notes` section (CRITICAL):**
  - CRITICAL: This section MUST contain ONLY information extracted and verified in Step 5. NEVER invent or assume technical details.
  - Include ALL relevant technical details from Steps 2-3 and verified in Step 5, organized by category:
    - **Previous Story Insights**: Key learnings from previous story
    - **Technical Preferences Summary**: Key technical choices and constraints from original technical-preferences.md (via architecture docs)
    - **Data Models**: Specific schemas, validation rules, relationships [with source references]
    - **API Specifications**: Endpoint details, request/response formats, auth requirements [with source references]
    - **Component Specifications**: UI component details, props, state management [with source references]
    - **File Locations**: Exact paths where new code should be created based on project structure
    - **Testing Requirements**: Specific test cases or strategies from testing-strategy.md
    - **Testing Integrity Requirements**: CRITICAL test rules that must be preserved
      - Tests represent requirements and are AUTHORITATIVE
      - Test expectations, assertions, and acceptance criteria are IMMUTABLE
      - Implementation must adapt to tests, never the reverse
      - Any test modifications require explicit business justification
      - Distinguish requirement tests (immutable) from implementation tests (adjustable)
    - **Technical Constraints**: Version requirements, performance considerations, security rules
    - **Technical Extraction Verification Summary**: Include completion rate and any flagged issues from Step 5
  - Every technical detail MUST include its source reference: `[Source: docs/architecture/{filename}.md#{section}]`
  - Technical Preferences section MUST explicitly reference original preferences and note any adaptations or constraints
  - If information for a category is not found in the architecture docs, explicitly state: "No specific guidance found in architecture docs"
- **`Tasks / Subtasks` section:**
  - Generate detailed, sequential list of technical tasks based ONLY on: Epic Requirements, Story AC, Reviewed Architecture Information
  - Each task must reference relevant architecture documentation
  - Include unit testing as explicit subtasks based on the Testing Strategy
  - Link tasks to ACs where applicable (e.g., `Task 1 (AC: 1, 3)`)
- Add notes on project structure alignment or discrepancies found in Step 4

### 7. Enhanced Story Quality Verification

**CRITICAL:** Execute enhanced quality verification before completing the story:

- **Dev Notes Accuracy Check:**
  - Verify all technical details in Dev Notes correspond to verified items from Step 5
  - Confirm all source references are accurate and accessible
  - Validate that no unverified technical assumptions are included
- **Implementation Guidance Completeness:**
  - Ensure Dev Notes provide sufficient guidance for implementation
  - Verify that all technical decisions are backed by architecture documents
  - Confirm that file locations and naming conventions are explicitly specified
- **Technical Risk Assessment:**
  - Document any technical risks identified during extraction verification
  - Flag any areas where architecture guidance is incomplete or conflicting
  - Note any dependencies on external clarification or decisions

### 8. Comprehensive Quality Check and Status Decision

**Execute Unified Quality Check:**

- Execute `{root}/tasks/execute-checklist.md` with checklist `{root}/checklists/sm-story-creation-comprehensive-checklist.md`
- The comprehensive checklist implements a **two-phase quality assessment system**:

**Status Transition Validation:**

Before setting any status, validate the transition using `{root}/data/story-status-transitions.yaml`:

1. **For new story creation (no current status):**
   - SM is authorized to set initial status
   - Allowed initial statuses: `Blocked`, `AwaitingArchReview`, `TestDesignComplete`, `AwaitingTestDesign`
   - Validate that the target status matches the decision result

2. **Validate transition is allowed:**
   - Check that the target status is in the allowed_transitions list
   - Verify SM has permission to set this status
   - Confirm all prerequisites are met for the transition

3. **If validation fails:**
   - Log error with details from error_messages in config
   - HALT and inform user of the validation failure
   - Provide guidance on correct status or required actions

4. **If validation succeeds:**
   - Proceed with setting the status
   - Log the transition for audit purposes

**Phase 1: Structure Validation (Gate Condition - Must be 100%)**
  1. Check all required template sections are present
  2. Verify no unfilled placeholders remain
  3. Validate all ACs have corresponding tasks with explicit mapping
  4. Verify tasks follow logical implementation order
  5. **If structure validation < 100%:** Immediately set Status = `Blocked`, STOP processing
  6. **If structure validation = 100%:** Proceed to Phase 2

**Phase 2: Technical Quality Assessment (Only if Phase 1 passes)**
  1. Check technical extraction completeness (≥80% required - hard requirement)
  2. **If technical extraction < 80%:** Immediately set Status = `Blocked`, STOP processing
  3. Calculate Technical Quality Score (0-10) with weights:
     - Technical Extraction: 50% (architecture info, technical preferences, source references)
     - Implementation Readiness: 50% (Dev Notes quality, testing strategy, implementability)
  4. Detect complexity indicators (7 indicators: API changes, DB schema, new patterns, cross-service, security, performance, architecture docs)
  5. Make status decisions using decision tasks
  6. Update story file with final status and quality check summary

**Make Status Decisions:**

After completing Phase 2 quality assessment, use the decision-making framework to determine story status:

**Step 1: Architect Review Decision**

Execute `{root}/tasks/make-decision.md` with:
- **decision_type:** `sm-architect-review-needed`
- **context:**
  - `quality_score`: Technical Quality Score from Phase 2
  - `complexity_indicators`: Count of detected complexity indicators

**Decision outputs:** `REQUIRED`, `NOT_REQUIRED`, or `BLOCKED`
- If `BLOCKED`: Set Status = `Blocked`, STOP processing
- If `REQUIRED`: Set Status = `AwaitingArchReview`, proceed to test design level determination (deferred)
- If `NOT_REQUIRED`: Proceed to Step 2

**Step 2: Test Design Level Decision**

Execute `{root}/tasks/make-decision.md` with:
- **decision_type:** `sm-test-design-level`
- **context:**
  - `complexity_indicators`: Count of detected complexity indicators
  - `quality_score`: Technical Quality Score from Phase 2
  - `security_sensitive`: Boolean flag from complexity analysis

**Decision outputs:** `Simple`, `Standard`, or `Comprehensive`

**Step 3: Final Story Status Decision**

Execute `{root}/tasks/make-decision.md` with:
- **decision_type:** `sm-story-status`
- **context:**
  - `architect_review_result`: Result from Step 1
  - `test_design_level`: Result from Step 2

**Decision outputs:** Final story status and next action

**Final Output Format:**

The checklist will generate a comprehensive report including:

```markdown
## Story Quality Check Report

### Phase 1: Structure Validation (Gate Condition)
- **Result:** [PASS / FAIL]
- **Completion Rate:** [X]% (must be 100% to proceed)
- **Failed Items:** [list if any]

### Phase 2: Technical Quality Assessment
- **Executed:** [Yes / No - skipped if Phase 1 failed]
- **Technical Quality Score:** [X.X/10]
  - Technical Extraction: [X]% × 0.50 = [X.X]
  - Implementation Readiness: [X]% × 0.50 = [X.X]
- **Technical Extraction Completion Rate:** [X]% (≥80% required)

### Complexity Analysis
**Detected Indicators:** [count] / 7
[List specific indicators found with brief explanation]

### Decision Results

**Architect Review Decision:**
- **Result:** [REQUIRED / NOT_REQUIRED / BLOCKED]
- **Reasoning:** [From decision task]

**Test Design Level Decision:**
- **Level:** [Simple / Standard / Comprehensive]
- **Reasoning:** [From decision task]

**Final Story Status:**
- **Status:** [Blocked / AwaitingArchReview / AwaitingTestDesign / TestDesignComplete]
- **Next Action:** [From decision task]
- **Reasoning:** [From decision task]
```

### 9. Record Change Log Entry

**Objective:** Automatically record the story creation and status decision in the Change Log for audit trail

**Add Change Log Entry to Story File:**

Locate or create the "Change Log" section in the Story file and add a new entry at the top:

```markdown
## Change Log

### {YYYY-MM-DD HH:MM:SS} - SM Story Creation

**Action:** Initial story creation and quality assessment

**Quality Assessment Results:**
- Structure Validation: {PASS/FAIL} ({completion_rate}%)
- Technical Quality Score: {score}/10
  - Technical Extraction: {score}/10 ({completion_rate}%)
  - Implementation Readiness: {score}/10
- Complexity Indicators Detected: {count}/7
  {List detected indicators if any}

**Decision Results:**
- Architect Review: {REQUIRED/NOT_REQUIRED/BLOCKED} - {reasoning}
- Test Design Level: {Simple/Standard/Comprehensive} - {reasoning}
- Final Status: `{Blocked/AwaitingArchReview/AwaitingTestDesign/TestDesignComplete}`
- Decision Reasoning: {explanation from decision tasks}

**Next Action:** {Based on status - what happens next}

---

{Previous Change Log entries if any}
```

**Change Log Entry Details:**

Include the following information from the quality assessment and decision tasks:
- **Date/Time:** Current timestamp in YYYY-MM-DD HH:MM:SS format
- **Structure Validation Result:** PASS/FAIL and completion percentage
- **Technical Quality Score:** Overall score and component scores
- **Technical Extraction Rate:** Completion percentage (important for decision logic)
- **Complexity Indicators:** Count and list of detected indicators
- **Decision Results:** Outputs from all three decision tasks with reasoning
- **Next Action:** Clear description of what should happen next

**Example Change Log Entry:**

```markdown
## Change Log

### 2024-01-15 14:30:22 - SM Story Creation

**Action:** Initial story creation and quality assessment

**Quality Assessment Results:**
- Structure Validation: PASS (100%)
- Technical Quality Score: 8.2/10
  - Technical Extraction: 8.5/10 (92%)
  - Implementation Readiness: 7.9/10
- Complexity Indicators Detected: 2/7
  - API contract changes (new user registration endpoint)
  - Database schema modifications (user table updates)

**Decision Results:**
- Architect Review: REQUIRED - High quality but high complexity requires architectural validation
- Test Design Level: Standard (deferred until after Architect approval)
- Final Status: `AwaitingArchReview`
- Decision Reasoning: Story requires Architect review before proceeding to test design phase

**Next Action:** Architect should execute `review-story {epicNum}.{storyNum}` to validate architectural decisions

---
```

### 10. Output Handoff Message Based on Final Status

**The decision tasks automatically determine the final status. Output the appropriate handoff message:**

**Generate Handoff Message Based on Status:**

1. **Read the final status** from the story status decision result (Step 8)
2. **Read the next_action** from the decision task output
3. **Generate the appropriate handoff message** based on the decision task recommendations

**Handoff Message Logic:**

Use the `next_action` field from the `sm-story-status` decision task to generate the handoff message.

**If Status = `Blocked`:**
```
Story blocked - SM must revise and resubmit
```

**If Status = `AwaitingArchReview`:**
```
Next: Architect please execute command 'review-story {epicNum}.{storyNum}'
Note: Test design level has been determined ({test_design_level}) but will be applied after Architect approval
```

**If Status = `AwaitingTestDesign`:**

Base message:
```
Next: QA please execute command 'test-design {epicNum}.{storyNum}'
Test Design Level: {test_design_level}
```

**Additional message if security sensitive** (test_design_level = "Comprehensive" OR securitySensitive = true):
```
Next: QA please execute command 'test-design {epicNum}.{storyNum}' and 'risk-profile {epicNum}.{storyNum}'
Test Design Level: Comprehensive (security-sensitive)
```

**If Status = `TestDesignComplete`:**
```
Next: Dev please execute command 'implement-story {epicNum}.{storyNum}'
Note: Test design level is Simple - test design not required
```

**If Status = `Approved`:**
```
Next: Dev please execute command 'implement-story {epicNum}.{storyNum}'
```

**Update Story File with Handoff Message:**

Add the handoff message to the end of the Story file in a "Next Steps" section for easy reference.

**Output Handoff Message to Console:**

Display the handoff message prominently to the user so they know exactly what to do next.

### 11. Summary and Completion

**The two-phase quality assessment with decision-based status determination is now complete.**

**Summary of Process:**

1. **Phase 1 (Structure Validation):** Gate condition requiring 100% completion
   - If failed: Status = `Blocked`, process stops
   - If passed: Proceed to Phase 2

2. **Phase 2 (Technical Quality Assessment):** Scoring and complexity detection
   - Technical Extraction: 50% weight (≥80% completion required)
   - Implementation Readiness: 50% weight
   - If Technical Extraction < 80%: Status = `Blocked`, process stops
   - Calculate Technical Quality Score (0-10)
   - Detect 7 complexity indicators

3. **Decision-Based Status Determination:** Three decision tasks determine final status
   - **Decision 1:** Architect Review Needed (`sm-architect-review-needed`)
   - **Decision 2:** Test Design Level (`sm-test-design-level`)
   - **Decision 3:** Final Story Status (`sm-story-status`)

4. **Handoff Message:** Output appropriate message based on decision results

**Final Status Outcomes:**

- **`Blocked`:** SM must revise Story and re-run quality check
- **`AwaitingArchReview`:** Architect should execute `review-story {epicNum}.{storyNum}`
- **`AwaitingTestDesign`:** QA should execute test design tasks based on level
- **`TestDesignComplete`:** Dev can begin implementation with `implement-story {epicNum}.{storyNum}`

**Quality Assurance:**
This decision-based approach ensures:
- Structure is validated before assessing technical quality
- Technical extraction meets minimum threshold (80%)
- Complexity is properly detected and considered
- Status is determined by reusable decision logic (see `{root}/data/decisions/`)
- Consistent decision-making across all story creation workflows
- Clear handoff messages guide the next steps

**Note:** This approach uses the centralized decision-making framework, reducing token usage and improving maintainability by externalizing decision rules to YAML configuration files.
