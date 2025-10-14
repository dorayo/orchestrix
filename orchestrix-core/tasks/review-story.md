# review-story

Perform a comprehensive test architecture review with quality gate decision. This adaptive, risk-aware review creates both a story update and a detailed gate file.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "1.3"
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md' # Path from core-config.yaml
  - story_title: '{title}' # If missing, derive from story file H1
  - story_slug: '{slug}' # If missing, derive from title (lowercase, hyphenated)
```

## Agent Permission Check

**CRITICAL**: Before proceeding with QA review, verify QA agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm you are the QA agent
   - Reference `{root}/data/story-status-transitions.yaml`

2. **Check Review Permission:**
   - Verify QA has permission to modify stories in `Review` status
   - Reference `can_modify_in_statuses` in agent_permissions
   - Verify QA can perform status changes:
     - Review -> Done
     - Review -> InProgress

3. **If permission check fails:**
   - Log error: "QA agent does not have permission to review this story"
   - Reference the responsible agent from story-status-transitions.yaml
   - HALT and inform user of the permission violation
   - Do NOT proceed with review

## Prerequisites

- Story status must be "Review"
- Developer has completed all tasks and updated the File List
- All automated tests are passing

## Status Transition Validation

Before proceeding with the review, validate that QA is authorized to review this Story:

1. **Check Current Story Status:**
   - Read the Story's `Status` field
   - Verify status is `Review`
   - If status is not `Review`, HALT and inform user:
     ```
     ERROR: Invalid status for QA review
     Current Status: {current_status}
     Expected Status: Review
     
     QA can only review stories with status 'Review'.
     Current responsible agent: {responsible_agent_from_config}
     ```

2. **Validate Agent Permission:**
   - Reference `{root}/data/story-status-transitions.yaml`
   - Confirm QA has permission to modify stories in `Review` status
   - Verify QA can transition to target statuses: `Done`, `InProgress`

3. **If validation fails:**
   - Log error with details from `story-status-transitions.yaml` error_messages
   - HALT and provide guidance on correct workflow
   - Do NOT proceed with review

## Review Process - Adaptive Test Architecture

### 0. Initialize Review Round Tracking

**CRITICAL**: Before starting the review, check and update the QA review round counter:

1. Read the Story file's `QA Review Metadata` section
2. Check the `review_round` field:
   - If field doesn't exist or is 0: Initialize to 1 (first review)
   - If field exists: Increment by 1 (e.g., 1 → 2, 2 → 3)
3. Update the `review_round` field in the Story file
4. Record the current round number for use in determining review standards

**Round Limits:**
- Maximum 3 rounds of QA review allowed
- Each round applies progressively more pragmatic standards
- Round 1: Strict standards (all criteria must be met)
- Round 2: Moderate standards (50% issue reduction + no high severity)
- Round 3: Pragmatic standards (no critical issues + acceptable technical debt)

**If this is Round 4 or higher:**
- STOP the review process
- Prompt user for decision:
  - Option 1: Accept current state and mark as Done (record technical debt)
  - Option 2: Escalate to Architect or SM for re-evaluation
  - Option 3: Continue fixing (last chance, no more automatic reviews)
- Record user decision in QA Review Metadata
- Exit the review task

### 1. Risk Assessment (Determines Review Depth)

**Auto-escalate to deep review when:**

- Auth/payment/security files touched
- No tests added to story
- Diff > 500 lines
- Previous gate was FAIL/CONCERNS
- Story has > 5 acceptance criteria

### 2. Comprehensive Analysis

**Apply analysis depth based on current review round:**

**Apply analysis depth based on review round:**

**A. Requirements Traceability**
- Map each AC to validating tests (Given-When-Then format)
- Identify coverage gaps
- Verify all requirements have test cases

**B. Code Quality Review**
- Architecture and design patterns
- Refactoring opportunities (perform when safe)
- Code duplication, inefficiencies
- Performance, security vulnerabilities
- Best practices adherence

**Architecture Concern Detection:**
If architecture issues detected:
1. Execute decision: `make-decision`
   - Type: `qa-escalate-architect`
   - Context: {concern_description, severity, impact, concern_type, affects_multiple_components, requires_design_change, has_workaround}
2. Apply result:
   - ESCALATE → Document, set Status = Escalated, handoff to Architect, exit
   - DOCUMENT → Document, continue review

**C. Test Architecture Assessment**
- Test coverage adequacy at appropriate levels
- Test level appropriateness (unit vs integration vs e2e)
- Test design quality, maintainability
- Test data management, mock/stub usage
- Edge case and error scenario coverage
- Test execution time, reliability

**D. Non-Functional Requirements (NFRs)**
- Security: Authentication, authorization, data protection
- Performance: Response times, resource usage
- Reliability: Error handling, recovery
- Maintainability: Code clarity, documentation

**E. Testability Evaluation**
- Controllability: Can we control inputs?
- Observability: Can we observe outputs?
- Debuggability: Can we debug failures?

**F. Technical Debt Identification**
- Accumulated shortcuts
- Missing tests
- Outdated dependencies
- Architecture violations

**Round-Specific Standards:**
- Round 1: Strict (all criteria must be met)
- Round 2: Moderate (50% improvement + no high severity)
- Round 3: Pragmatic (no critical issues + acceptable debt)

### 3. Active Refactoring

- Refactor code where safe and appropriate
- Run tests to ensure changes don't break functionality
- Document all changes in QA Results section with clear WHY and HOW
- Do NOT alter story content beyond QA Results section
- Do NOT change story Status or File List; recommend next status only

### 4. Standards Compliance Check

- Verify adherence to `docs/coding-standards.md`
- Check compliance with `docs/unified-project-structure.md`
- Validate testing approach against `docs/testing-strategy.md`
- Ensure all guidelines mentioned in the story are followed

### 5. Acceptance Criteria Validation

- Verify each AC is fully implemented
- Check for any missing functionality
- Validate edge cases are handled

### 6. Documentation and Comments

- Verify code is self-documenting where possible
- Add comments for complex logic if missing
- Ensure any API changes are documented

## Output 1: Update Story File - QA Results Section ONLY

**CRITICAL**: You are ONLY authorized to update the "QA Results" section and "QA Review Metadata" section of the story file. DO NOT modify any other sections.

**QA Results Anchor Rule:**

- If `## QA Results` doesn't exist, append it at end of file
- If it exists, append a new dated entry below existing entries
- Never edit other sections

**QA Review Metadata Update:**

Before appending QA Results, update the `QA Review Metadata` section:

1. Update `review_round` field with current round number
2. Increment `total_reviews_conducted` by 1
3. Append to `review-history` list with:
   - Round number
   - Review date
   - Reviewer ID
   - Gate result
   - Total issues found
   - Critical and High severity issue counts
   - Issues from previous round (if Round 2+)
   - Issues resolved (if Round 2+)
   - Improvement percentage (if Round 2+)
   - Decision

After review and any refactoring, append your results to the story file in the QA Results section:

```markdown
## QA Results

### Review Date: [Date] - Round [N]

### Reviewed By: Quinn (Test Architect)

### Review Round Information

- **Round**: [1/2/3]
- **Standards Applied**: [Strict/Moderate/Pragmatic]
- **Issues from Previous Round**: [count] (if Round 2+)
- **Issues Resolved**: [count] (if Round 2+)
- **Improvement Percentage**: [percentage]% (if Round 2+)

### Code Quality Assessment

[Overall assessment of implementation quality]

### Architecture Concerns Detected

[If architecture concerns are found, document them here. Otherwise, state "None"]

**Concern Type**: [Performance/Security/Scalability/Design/Data Integrity/Technical Debt]
**Severity**: [High/Critical]
**Description**: [Detailed description of the architecture concern]
**Impact**: [Potential impact on system quality, performance, or maintainability]
**Recommendation**: [Suggested approach or questions for Architect]
**Files Affected**: [List of files with architecture concerns]

[If multiple concerns exist, repeat the above structure for each]

**Escalation Required**: [Yes/No]
- If Yes: Story Status will be set to Escalated and Architect will be notified

### Refactoring Performed

[List any refactoring you performed with explanations]

- **File**: [filename]
  - **Change**: [what was changed]
  - **Why**: [reason for change]
  - **How**: [how it improves the code]

### Compliance Check

- Coding Standards: [✓/✗] [notes if any]
- Project Structure: [✓/✗] [notes if any]
- Testing Strategy: [✓/✗] [notes if any]
- All ACs Met: [✓/✗] [notes if any]

### Improvements Checklist

[Check off items you handled yourself, leave unchecked for dev to address]

- [x] Refactored user service for better error handling (services/user.service.ts)
- [x] Added missing edge case tests (services/user.service.test.ts)
- [ ] Consider extracting validation logic to separate validator class
- [ ] Add integration test for error scenarios
- [ ] Update API documentation for new error codes

### Security Review

[Any security concerns found and whether addressed]

### Performance Considerations

[Any performance issues found and whether addressed]

### Files Modified During Review

[If you modified files, list them here - ask Dev to update File List]

### Gate Status

Gate: {STATUS} → qa.qaLocation/gates/{epic}.{story}-{slug}.yml
Risk profile: qa.qaLocation/assessments/{epic}.{story}-risk-{YYYYMMDD}.md
NFR assessment: qa.qaLocation/assessments/{epic}.{story}-nfr-{YYYYMMDD}.md

# Note: Paths should reference core-config.yaml for custom configurations

### Recommended Status

[✓ Ready for Done] / [✗ Changes Required - See unchecked items above]
(Story owner decides final status)

### Technical Debt (Round 3 only, if applicable)

[If Round 3 and accepting technical debt, document here:]

- **Issue**: [description]
- **Impact**: [impact assessment]
- **Severity**: [Low/Medium]
- **Follow-up Plan**: [plan for addressing in future]
```

## Output 2: Create Quality Gate File

**Template and Directory:**

- Render from `../templates/qa-gate-tmpl.yaml`
- Create directory defined in `qa.qaLocation/gates` (see `orchestrix-core/core-config.yaml`) if missing
- Save to: `qa.qaLocation/gates/{epic}.{story}-{slug}.yml`

Gate file structure:

```yaml
schema: 1
story: '{epic}.{story}'
story_title: '{story title}'
gate: PASS|CONCERNS|FAIL|WAIVED
status_reason: '1-2 sentence explanation of gate decision'
reviewer: 'Quinn (Test Architect)'
updated: '{ISO-8601 timestamp}'

# Review round tracking (REQUIRED)
review_round: {current_round}  # 1, 2, or 3
issues_from_previous_round: {count}  # 0 if Round 1, else count from previous gate file
issues_resolved: {count}  # 0 if Round 1, else (issues_from_previous - current_issues)
improvement_percentage: {percentage}  # 0 if Round 1, else (issues_resolved / issues_from_previous) × 100

top_issues: [] # Empty if no issues
waiver: { active: false } # Set active: true only if WAIVED

# Extended fields (optional but recommended):
quality_score: 0-100 # 100 - (20*FAILs) - (10*CONCERNS) or use technical-preferences.md weights
expires: '{ISO-8601 timestamp}' # Typically 2 weeks from review

evidence:
  tests_reviewed: { count }
  risks_identified: { count }
  trace:
    ac_covered: [1, 2, 3] # AC numbers with test coverage
    ac_gaps: [4] # AC numbers lacking coverage

nfr_validation:
  security:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  performance:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  reliability:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  maintainability:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'

recommendations:
  immediate: # Must fix before production
    - action: 'Add rate limiting'
      refs: ['api/auth/login.ts']
  future: # Can be addressed later
    - action: 'Consider caching'
      refs: ['services/data.ts']
```

**Populating Round Tracking Fields:**

1. **review_round**: Use the current round number from Story's QA Review Metadata
2. **issues_from_previous_round**: 
   - If Round 1: Set to 0
   - If Round 2+: Read the previous gate file and count total issues from `top_issues`
3. **issues_resolved**:
   - If Round 1: Set to 0
   - If Round 2+: Calculate as (issues_from_previous_round - current_issues_count)
4. **improvement_percentage**:
   - If Round 1: Set to 0
   - If Round 2+: Calculate as (issues_resolved / issues_from_previous_round) × 100
   - Round to nearest integer

### Gate Decision Criteria

Execute decision: `make-decision`
- Type: `qa-gate-decision`
- Context: {review_round, issues_by_severity, previous_issues}

Apply decision result:
- PASS → Gate = PASS, Status = Done
- CONCERNS → Gate = CONCERNS, Status = InProgress
- FAIL → Gate = FAIL, Status = InProgress or Escalated

WAIVED only when waiver.active: true with reason/approver

### Quality Score Calculation

```text
quality_score = 100 - (20 × number of FAILs) - (10 × number of CONCERNS)
Bounded between 0 and 100
```

If `technical-preferences.md` defines custom weights, use those instead.

### Suggested Owner Convention

For each issue in `top_issues`, include a `suggested_owner`:

- `dev`: Code changes needed
- `sm`: Requirements clarification needed
- `po`: Business decision needed

## Key Principles

- You are a Test Architect providing comprehensive quality assessment
- You have the authority to improve code directly when appropriate
- Always explain your changes for learning purposes
- Balance between perfection and pragmatism
- Focus on risk-based prioritization
- Provide actionable recommendations with clear ownership

## Blocking Conditions

Stop the review and request clarification if:

- Story file is incomplete or missing critical sections
- File List is empty or clearly incomplete
- No tests exist when they were required
- Code changes don't align with story requirements
- Critical architectural issues that require discussion

## Completion

After review:

1. Update the QA Review Metadata section with round tracking information
2. Update the QA Results section in the story file
3. Create the gate file in directory from `qa.qaLocation/gates`
4. **Validate and Update Story Status:**
   
   **Before setting status, validate the transition:**
   
   a. **Check for Architecture Concerns:**
      - If architecture concerns were detected and escalation is required:
        - Set Story Status = Escalated
        - Skip gate decision (no gate file created)
        - Skip remaining validation steps
        - Proceed to Output Handoff Message for Architect
   
   b. **Validate Transition is Allowed (if no escalation):**
      - Reference `{root}/data/story-status-transitions.yaml`
      - Current status: `Review`
      - Target status: One of [`Done`, `InProgress`, `Escalated`]
      - Verify the transition is in the allowed_transitions list
      - Confirm QA has permission for this status change
   
   c. **Check Prerequisites:**
      - For `Done`: Verify qa_gate = PASS AND all_acceptance_criteria_met = true AND no_critical_issues = true
      - For `InProgress`: Verify qa_gate = CONCERNS or FAIL AND has_issues_to_fix = true
      - For `Escalated`: Verify architecture_concerns_detected = true
   
   d. **If validation fails:**
      - Log error with details from story-status-transitions.yaml
      - HALT and inform user of validation failure
      - Do NOT update status
   
   e. **If validation succeeds:**
      - Update Story Status based on gate result and round:
        - If Architecture Concerns Detected → Set Status = Escalated
        - Else if Gate = PASS → Set Status = Done
        - Else if Gate = CONCERNS or FAIL → Set Status = InProgress
      - Log the transition for audit purposes

5. If files were modified, list them in QA Results and ask Dev to update File List
6. Always provide constructive feedback and actionable recommendations

### Output Handoff Message

Based on the final status, output the appropriate handoff message:

- **If Status = Escalated:**
  ```
  Architecture concerns detected. Next: Architect please execute command `review-escalation {story_id}`
  ```

- **If Status = Done:**
  ```
  Story completed!
  ```

- **If Status = InProgress:**
  ```
  Next: Dev please execute command `review-qa {story_id}`
  ```