# Revise Story from Architect Feedback

## Purpose

As the **SM Agent**, when a Story status is `RequiresRevision`, you need to revise the Story based on Architect review feedback, re-execute quality checks, and apply intelligent decision logic to determine whether a second round of Architect review is needed.

## Context

This task is part of the Orchestrix optimized workflow, designed to reduce unnecessary review rounds through intelligent decision mechanisms while ensuring critical issues are adequately addressed.

**Key Mechanisms:**
- **Auto-Approval Conditions**: If specific conditions are met after revision, the Story can be auto-approved without a second review
- **Mandatory Review Conditions**: If revision involves Critical issues, a second review must be triggered
- **User Decision Points**: For Medium issue revisions, ask the user whether review is needed
- **Maximum Review Rounds**: Architect review limited to 2 rounds to avoid infinite loops

## Agent Permission Check

**CRITICAL**: Before proceeding with revision, verify SM agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm you are the SM (Story Manager) agent
   - Reference `{root}/data/story-status-transitions.yaml`

2. **Check Revision Permission:**
   - Verify SM has permission to modify stories in `RequiresRevision` status
   - Reference `can_modify_in_statuses` in agent_permissions
   - Verify SM can perform status changes:
     - RequiresRevision -> AwaitingArchReview
     - RequiresRevision -> Approved
     - RequiresRevision -> Blocked

3. **If permission check fails:**
   - Log error: "SM agent does not have permission to revise this story"
   - Reference the responsible agent from story-status-transitions.yaml
   - HALT and inform user of the permission violation
   - Do NOT proceed with revision

## Prerequisites

- Story status is `RequiresRevision`
- Architect Review Results have been appended to the Story file
- Architect Review Metadata records the review round (should be 1)
- You have permission to modify the Story file

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### Step 1: Read and Parse Architect Review Results

**Objective:** Extract key information from Architect feedback to guide revision

1. **Locate Latest Architect Review Results**
   - Open the Story file
   - Find the "Architect Review Results" section
   - Locate the most recent review record (last Review Round)

2. **Extract Key Information**
   
   Extract the following information from the review results:
   
   - **Decision**: approved / revise / escalate
   - **Architecture Score**: X/10
   - **Key Architectural Concerns**: List of main architectural issues
   - **Issue Severity Breakdown**:
     - Critical Issues: [count] - [list]
     - High Severity Issues: [count] - [list]
     - Medium Severity Issues: [count] - [list]
     - Low Severity Issues: [count] - [list]
   - **Recommendations**: Specific improvement suggestions
   - **Review Round**: Current review round number (should be 1)

3. **Analyze Issue Severity Distribution**
   
   Record the following information for subsequent decision-making:
   - Whether Critical issues exist
   - Whether High Severity issues exist
   - Count of Medium and Low issues
   - Specific description and suggested fix for each issue

**Output Example:**
```
Architect Review Analysis:
- Review Round: 1
- Architecture Score: 6.5/10
- Critical Issues: 1
  - API endpoint design does not follow REST conventions
- High Severity Issues: 0
- Medium Severity Issues: 2
  - Data model missing validation rules
  - Testing strategy lacks detail
- Low Severity Issues: 1
  - Documentation reference format inconsistent
```


### Step 2: Revise Story Based on Feedback

**Objective:** Systematically address all issues identified by the Architect

**Revision Priority Order:**
1. Critical Issues (must fix)
2. High Severity Issues (must fix)
3. Medium Severity Issues (should fix)
4. Low Severity Issues (nice to fix)

**Revision Process:**

**2.1 Open Story File for Editing**

1. Locate the Story file at `docs/stories/{epic-num}/{story-num}-{story-title}.md`
2. Create a backup copy before making changes (optional but recommended)
3. Open the file in your editor

**2.2 Update Dev Notes Section**

For each identified issue, update the relevant part of Dev Notes:

**For Data Model Issues:**
- Add missing validation rules with specific constraints
- Correct schema definitions (field types, required/optional, defaults)
- Clarify entity relationships (one-to-many, many-to-many)
- Add missing fields identified by Architect
- Update data types if incorrect
- Example:
  ```yaml
  # Before:
  User:
    - email: string
  
  # After (addressing validation concern):
  User:
    - email: string (required, unique, format: email)
    - emailVerified: boolean (default: false)
    - emailVerificationToken: string (optional, indexed)
  ```

**For API Specification Issues:**
- Fix endpoint designs to follow REST/GraphQL conventions
- Correct HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Add missing request/response examples
- Clarify authentication/authorization requirements
- Add error response specifications
- Update status codes if incorrect
- Example:
  ```yaml
  # Before:
  POST /user/create
  
  # After (addressing REST convention concern):
  POST /api/v1/users
  Authentication: Required (Bearer token)
  Request Body: { email, password, profile }
  Success Response: 201 Created { id, email, createdAt }
  Error Responses:
    - 400 Bad Request: Invalid email format
    - 409 Conflict: Email already exists
  ```

**For Component Specification Issues:**
- Clarify component structure and hierarchy
- Add missing props with types and descriptions
- Correct component patterns (container/presentational, HOC, hooks)
- Add state management details
- Specify event handlers and callbacks
- Example:
  ```typescript
  # Before:
  UserProfile component
  
  # After (addressing missing details concern):
  UserProfile Component:
    Type: Presentational Component
    Props:
      - user: User (required) - User object with profile data
      - onEdit: () => void (required) - Callback when edit button clicked
      - isLoading: boolean (optional, default: false)
    State: None (stateless)
    Events:
      - onClick (edit button) → calls onEdit()
    Styling: Uses UserProfile.module.css
  ```

**For File Location Issues:**
- Verify file paths match actual project structure
- Update paths to follow project conventions
- Ensure directory structure is correct
- Add missing directory creation tasks if needed
- Example:
  ```
  # Before:
  File: components/UserProfile.tsx
  
  # After (addressing structure concern):
  File: src/features/user/components/UserProfile/UserProfile.tsx
  Related Files:
    - src/features/user/components/UserProfile/UserProfile.module.css
    - src/features/user/components/UserProfile/UserProfile.test.tsx
    - src/features/user/components/UserProfile/index.ts
  ```

**For Testing Requirements Issues:**
- Add missing test scenarios (edge cases, error cases)
- Clarify testing approach (unit, integration, e2e)
- Specify test coverage expectations
- Add performance testing requirements if needed
- Add security testing requirements if needed
- Example:
  ```
  # Before:
  Testing: Unit tests for UserProfile
  
  # After (addressing insufficient detail concern):
  Testing Strategy:
    Unit Tests (UserProfile.test.tsx):
      - Renders user data correctly
      - Calls onEdit when edit button clicked
      - Shows loading state when isLoading=true
      - Handles missing optional fields gracefully
      - Validates prop types
    Integration Tests:
      - UserProfile integrates with UserContext
      - Edit flow updates user data correctly
    Coverage Target: ≥ 80% for component logic
  ```

**For Technical Constraints Issues:**
- Add missing version requirements
- Clarify browser/platform compatibility
- Add performance constraints (response time, bundle size)
- Add security constraints (authentication, authorization)
- Add scalability constraints
- Example:
  ```
  # Before:
  Uses React
  
  # After (addressing version concern):
  Technical Constraints:
    - React: ^18.2.0 (hooks required)
    - TypeScript: ^5.0.0 (for type safety)
    - Browser Support: Chrome 90+, Firefox 88+, Safari 14+
    - Bundle Size: Component < 50KB gzipped
    - Performance: First render < 100ms
  ```

**2.3 Update Architecture References**

Ensure all technical details have correct source references:

1. **Verify Reference Format:**
   - Correct format: `[Source: docs/architecture/{filename}.md#{section}]`
   - Incorrect format: `[Source: architecture.md]` (too vague)

2. **Verify Referenced Documents Exist:**
   - Check that `docs/architecture/{filename}.md` actually exists
   - If document doesn't exist, either:
     - Create the document (if you have the information)
     - Remove the reference and mark as "To be documented"
     - Reference a different existing document

3. **Verify Referenced Sections Contain Claimed Information:**
   - Open the referenced document
   - Navigate to the specified section
   - Confirm the section contains the technical detail you're referencing
   - If not found, update the reference to the correct section

4. **Add Missing References:**
   - For any technical detail without a source reference, add one
   - If the information came from an architecture document, reference it
   - If the information is a design decision, document it as such
   - Example:
     ```
     # Before:
     The API uses JWT tokens for authentication.
     
     # After:
     The API uses JWT tokens for authentication.
     [Source: docs/architecture/api-architecture.md#authentication]
     ```

**2.4 Adjust Tasks/Subtasks if Needed**

If the Architect feedback indicates that tasks need adjustment:

1. **Add Missing Tasks:**
   - If Architect identified missing functionality, add tasks to cover it
   - Ensure new tasks have AC mappings
   - Insert tasks in the correct sequence
   - Example:
     ```
     # Architect noted: "Missing email verification task"
     # Add:
     - [ ] Task 3: Implement email verification
       - [ ] 3.1 Generate verification token (AC: 2)
       - [ ] 3.2 Send verification email (AC: 2)
       - [ ] 3.3 Create verification endpoint (AC: 2)
     ```

2. **Reorder Tasks:**
   - If task sequence is incorrect (e.g., testing before implementation)
   - Move tasks to follow logical order
   - Update task numbers if needed
   - Verify dependencies are still correct

3. **Split Complex Tasks:**
   - If Architect noted a task is too large or complex
   - Break it into smaller, more manageable subtasks
   - Ensure each subtask is independently testable
   - Example:
     ```
     # Before:
     - [ ] Task 5: Implement user management
     
     # After (split based on Architect feedback):
     - [ ] Task 5: Implement user management
       - [ ] 5.1 Implement user creation (AC: 1)
       - [ ] 5.2 Implement user update (AC: 2)
       - [ ] 5.3 Implement user deletion (AC: 3)
       - [ ] 5.4 Implement user listing (AC: 4)
     ```

4. **Clarify Task Descriptions:**
   - If task descriptions are ambiguous
   - Add specific details about what needs to be done
   - Add acceptance criteria for the task
   - Example:
     ```
     # Before:
     - [ ] Task 2: Add validation
     
     # After:
     - [ ] Task 2: Add input validation to user registration form
       - Validate email format (RFC 5322)
       - Validate password strength (min 8 chars, 1 uppercase, 1 number)
       - Validate required fields (email, password, name)
       - Display validation errors to user
     ```

5. **Update Task-AC Mappings:**
   - If mappings are incorrect or missing
   - Ensure every task references the ACs it implements
   - Format: `(AC: 1, 3)` or `(AC: 2)`
   - Verify all ACs are covered by at least one task

**2.5 Address Specific Recommendations**

For each recommendation in the Architect review:

1. **Implement the Suggested Change:**
   - Follow the Architect's specific guidance
   - If the recommendation is unclear, interpret it based on best practices
   - Make the change in the appropriate section (Dev Notes, Tasks, etc.)

2. **Document Why the Change Was Made:**
   - Add a comment or note explaining the rationale
   - Reference the Architect review round
   - Example:
     ```
     # Updated API endpoint to follow REST conventions
     # [Architect Review Round 1: Use standard REST resource naming]
     POST /api/v1/users (instead of POST /user/create)
     ```

3. **Verify the Change Resolves the Issue:**
   - Re-read the Architect's concern
   - Confirm your change addresses the root cause
   - If you're unsure, err on the side of being more explicit

**2.6 Prepare Revision Summary**

As you make revisions, document each change for the Change Log:

```
Revision Summary:

Critical Issues Fixed:
- [Issue 1]: [Description of fix]
  - Changed: [What was changed]
  - Location: [Where in the Story]
  - Rationale: [Why this fixes the issue]

High Severity Issues Fixed:
- [Issue 1]: [Description of fix]
  - Changed: [What was changed]
  - Location: [Where in the Story]
  - Rationale: [Why this fixes the issue]

Medium Issues Addressed:
- [Issue 1]: [Description of fix]
  - Changed: [What was changed]
  - Location: [Where in the Story]
  - Rationale: [Why this fixes the issue]

Low Issues Improved:
- [Issue 1]: [Description of fix]
  - Changed: [What was changed]
  - Location: [Where in the Story]
  - Rationale: [Why this fixes the issue]

Additional Improvements:
- [Any other improvements made while revising]
```

**2.7 Save Story File**

1. Save all changes to the Story file
2. Verify the file is valid markdown
3. Ensure no syntax errors were introduced
4. Proceed to Step 3 for quality re-check


### Step 3: Re-execute Quality Check

**Objective:** Validate that revisions have improved Story quality

**3.1 Execute Comprehensive Quality Check**

Run the same quality check process as initial Story creation:

```
Execute: orchestrix-core/tasks/execute-checklist.md
Checklist: orchestrix-core/checklists/sm-story-creation-comprehensive-checklist.md
Story File: docs/stories/{epic-num}/{story-num}-{story-title}.md
```

This will execute a **two-phase quality assessment**:

**Phase 1: Structure Validation (Gate Condition)**
- Must achieve 100% completion to proceed
- Validates:
  - Template compliance (all sections present, no placeholders)
  - AC coverage (all ACs have tasks, explicit mappings)
  - Task sequence & logic (logical order, no circular dependencies)
- **If Phase 1 fails (< 100%):**
  - Status will be set to `Blocked`
  - Phase 2 will be skipped
  - You must return to Step 2 and fix structure issues
  - Do NOT proceed to Step 4

**Phase 2: Technical Quality Assessment (Scoring)**
- Only executed if Phase 1 passes (100%)
- Calculates Technical Quality Score (0-10):
  - Technical Extraction Quality (50% weight)
    - Architecture info completeness
    - Technical preferences alignment
    - Source reference verification
    - **Hard requirement:** Completion rate ≥ 80%
  - Implementation Readiness (50% weight)
    - Dev Notes quality
    - Testing strategy
    - Developer implementability
- Detects Complexity Indicators (0-7):
  - API contract changes
  - Database schema modifications
  - New architectural patterns
  - Cross-service dependencies
  - Security-sensitive operations
  - Performance-critical features
  - Core architecture doc modifications
- Applies Decision Matrix (based on score + complexity)

**Expected Output from Quality Check:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: STRUCTURE VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completion Rate: 100% ✓
Status: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: TECHNICAL QUALITY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Technical Extraction Quality: 8.5/10 (Completion: 95%)
Implementation Readiness: 8.0/10

Technical Quality Score: 8.25/10

Complexity Indicators Detected: 2
- API contract changes
- Database schema modifications

Decision Matrix Result:
- Status Recommendation: AwaitingArchReview
- Architect Review: RECOMMENDED
- Reasoning: High quality but high complexity
```

**3.2 Record Quality Improvement**

Compare new quality metrics with previous Architect review:

**Quality Metrics Comparison:**

```
Previous Architect Review (Round 1):
- Architecture Score: {score}/10
- Key Concerns: {count} issues
  - Critical: {count}
  - High: {count}
  - Medium: {count}
  - Low: {count}

New Quality Assessment (Post-Revision):
- Technical Quality Score: {score}/10
- Structure Validation: {pass/fail}
- Technical Extraction: {completion_rate}%
- Complexity Indicators: {count}

Quality Improvement:
- Score Change: {new_score} - {old_score} = {improvement} points
- Score Improvement %: {(improvement / old_score) * 100}%
- Complexity Change: {old_complexity} → {new_complexity}
```

**Record these metrics for use in Step 4 decision logic.**

**3.3 Verify Issue Resolution**

For each issue from Architect review, verify it's been addressed:

**Issue Resolution Checklist:**

```
Critical Issues (Must be resolved):
- [ ] Issue 1: {description}
      Status: {Resolved / Partially Resolved / Not Resolved}
      Evidence: {What changed in the Story to address this}
- [ ] Issue 2: {description}
      Status: {Resolved / Partially Resolved / Not Resolved}
      Evidence: {What changed in the Story to address this}

High Severity Issues (Must be resolved):
- [ ] Issue 1: {description}
      Status: {Resolved / Partially Resolved / Not Resolved}
      Evidence: {What changed in the Story to address this}

Medium Severity Issues (Should be resolved):
- [ ] Issue 1: {description}
      Status: {Resolved / Partially Resolved / Not Resolved}
      Evidence: {What changed in the Story to address this}

Low Severity Issues (Nice to resolve):
- [ ] Issue 1: {description}
      Status: {Resolved / Partially Resolved / Not Resolved}
      Evidence: {What changed in the Story to address this}
```

**Resolution Summary:**

```
Total Issues from Architect Review: {count}
Issues Resolved: {count}
Issues Partially Resolved: {count}
Issues Not Resolved: {count}

Resolution Rate: {(resolved / total) * 100}%

Critical Issues Resolution: {count}/{total} ({percentage}%)
High Severity Resolution: {count}/{total} ({percentage}%)
Medium Severity Resolution: {count}/{total} ({percentage}%)
Low Severity Resolution: {count}/{total} ({percentage}%)
```

**3.4 Handle Quality Check Failures**

**If Structure Validation Failed (< 100%):**

1. Status will be automatically set to `Blocked`
2. Review the failed structure items
3. Return to Step 2 and fix the structure issues
4. Do NOT proceed to Step 4
5. Re-run this Step 3 after fixes

**If Technical Extraction < 80%:**

1. Status will be automatically set to `Blocked`
2. Review the technical extraction gaps
3. Return to Step 2 and improve technical details
4. Add missing architecture references
5. Clarify technical specifications
6. Re-run this Step 3 after improvements

**If Quality Check Passes:**

Proceed to Step 4 to apply intelligent decision logic.

### Step 4: Re-evaluate Test Design Level

**Objective:** Determine if test design level has changed after revision and handle accordingly

**4.1 Read Current Test Design Metadata**

Locate the "QA Test Design Metadata" section in the Story file and extract:

```
Current Test Design Metadata:
- test_design_level: {Simple / Standard / Comprehensive}
- test_design_status: {NotRequired / Pending / InProgress / Complete}
- test_design_document: {path or empty}
- test_design_completion_date: {date or empty}
```

**4.2 Determine New Test Design Level**

Call the decision system to determine the new test design level based on quality assessment:

```
Execute: orchestrix-core/tasks/make-decision.md
Decision Type: sm-test-design-level
Context:
  complexity_indicators: {count from quality assessment}
  quality_score: {score from quality assessment}
  security_sensitive: {true/false from quality assessment}

Output:
  test_design_level: {Simple / Standard / Comprehensive}
  reasoning: {explanation}
  next_status: {TestDesignComplete / AwaitingTestDesign}
  next_action: {skip_qa_test_design / handoff_to_qa_test_design}
```

**Record the decision result:**

```
New Test Design Level Decision:
- Test Design Level: {Simple / Standard / Comprehensive}
- Reasoning: {from decision output}
- Complexity Indicators: {count}
- Technical Quality Score: {score}/10
- Security Sensitive: {yes/no}
```

**4.3 Compare Test Design Levels**

Compare the current and new test design levels:

```
Test Design Level Comparison:
- Previous Level: {Simple / Standard / Comprehensive}
- New Level: {Simple / Standard / Comprehensive}
- Level Changed: {Yes / No}
- Change Type: {Increased / Decreased / No Change}
```

**4.4 Handle Test Design Level Changes**

Based on the comparison, take appropriate action:

**Case 1: Level Changed from Simple to Standard/Comprehensive**

```
Condition: Previous = Simple AND New = Standard/Comprehensive
Action:
1. Update test_design_level to new level
2. Set test_design_status = Pending
3. Clear test_design_document (if any)
4. Add note in Change Log: "Test design level increased due to revision"
5. Prepare to set Status = AwaitingTestDesign (after decision logic in Step 5)
```

**Case 2: Level Changed from Standard/Comprehensive to Simple**

```
Condition: Previous = Standard/Comprehensive AND New = Simple
Action:
1. Update test_design_level = Simple
2. Set test_design_status = NotRequired
3. Add note in Change Log: "Test design level decreased, test design no longer required"
4. Prepare to set Status = TestDesignComplete (after decision logic in Step 5)
```

**Case 3: Level Unchanged at Standard/Comprehensive AND Test Design Not Started**

```
Condition: Previous = Standard/Comprehensive AND New = Standard/Comprehensive 
          AND test_design_status = Pending
Action:
1. Keep test_design_level unchanged
2. Keep test_design_status = Pending
3. Add note in Change Log: "Test design level unchanged, still awaiting test design"
4. Prepare to set Status = AwaitingTestDesign (after decision logic in Step 5)
```

**Case 4: Level Unchanged at Standard/Comprehensive AND Test Design Complete**

```
Condition: Previous = Standard/Comprehensive AND New = Standard/Comprehensive 
          AND test_design_status = Complete
Action:
1. Keep test_design_level unchanged
2. Add field to QA Test Design Metadata: requires_review = true
3. Add field: review_reason = "Story revised after test design completion"
4. Add note in Change Log: "Test design requires QA review due to story revision"
5. Check if AC changed (compare Change Log for AC modifications)
6. If AC changed:
   - Add field: ac_changed = true
   - Add note: "Acceptance Criteria modified - test scenarios may need updates"
7. If only Dev Notes changed:
   - Add field: ac_changed = false
   - Add note: "Only technical details modified - test design may still be valid"
8. Prepare handoff message for QA to review test design
```

**Case 5: Level Unchanged at Simple**

```
Condition: Previous = Simple AND New = Simple
Action:
1. Keep test_design_level = Simple
2. Keep test_design_status = NotRequired
3. No additional action needed
4. Proceed to Step 5 decision logic
```

**4.5 Update QA Test Design Metadata**

Based on the case above, update the QA Test Design Metadata section:

**For Case 1 (Simple → Standard/Comprehensive):**

```yaml
QA Test Design Metadata:
  test_design_level: {Standard / Comprehensive}
  test_design_status: Pending
  test_design_document: ""
  test_design_completion_date: ""
  level_change_date: {YYYY-MM-DD HH:MM:SS}
  level_change_reason: "Increased from Simple due to revision - complexity/quality changed"
  previous_level: Simple
```

**For Case 2 (Standard/Comprehensive → Simple):**

```yaml
QA Test Design Metadata:
  test_design_level: Simple
  test_design_status: NotRequired
  test_design_document: ""
  test_design_completion_date: ""
  level_change_date: {YYYY-MM-DD HH:MM:SS}
  level_change_reason: "Decreased to Simple due to revision - complexity/quality improved"
  previous_level: {Standard / Comprehensive}
```

**For Case 4 (Unchanged but Complete):**

```yaml
QA Test Design Metadata:
  test_design_level: {Standard / Comprehensive}
  test_design_status: Complete
  test_design_document: {existing path}
  test_design_completion_date: {existing date}
  requires_review: true
  review_reason: "Story revised after test design completion"
  revision_date: {YYYY-MM-DD HH:MM:SS}
  ac_changed: {true / false}
  revision_type: {AC_MODIFIED / DEV_NOTES_ONLY}
  review_instructions: |
    QA Agent should review test design document and:
    - If AC changed: Update affected test scenarios
    - If Dev Notes only: Verify test design still valid, mark "Reviewed - No Changes" if applicable
```

**4.6 Record Test Design Level Decision**

Document the test design level evaluation in the Change Log:

```markdown
**Test Design Level Re-evaluation:**
- Previous Level: {Simple / Standard / Comprehensive}
- New Level: {Simple / Standard / Comprehensive}
- Level Changed: {Yes / No}
- Reasoning: {explanation based on complexity, quality, security}
- Action Taken: {description of action from cases above}
- Test Design Status: {NotRequired / Pending / Complete / Requires Review}
```

### Step 5: Apply Intelligent Decision Logic

**Objective:** Determine next status based on revision quality, issue resolution, and test design level

**5.1 Gather Decision Inputs**

Collect the following information from Steps 1-4:

```
Decision Inputs:
1. Previous Architect Score: {score}/10
2. New Technical Quality Score: {score}/10
3. Quality Score Improvement: {improvement} points
4. Critical Issues Count: {count}
5. Critical Issues Resolved: {count}
6. High Severity Issues Count: {count}
7. High Severity Issues Resolved: {count}
8. Medium Issues Count: {count}
9. Medium Issues Resolved: {count}
10. Low Issues Count: {count}
11. Low Issues Resolved: {count}
12. Structure Validation: {PASS / FAIL}
13. Technical Extraction Rate: {percentage}%
14. Complexity Indicators: {count}
15. Test Design Level: {Simple / Standard / Comprehensive}
16. Test Design Status: {NotRequired / Pending / Complete / Requires Review}
17. Test Design Level Changed: {Yes / No}
```

**5.2 Execute Revision Approval Decision**

Call the decision system to determine if the Story should be auto-approved, require Round 2 review, prompt user, or remain blocked:

```
Execute: orchestrix-core/tasks/make-decision.md
Decision Type: sm-revision-approval
Context:
  previous_architect_score: {score from Step 1}
  new_quality_score: {score from Step 3}
  critical_issues_total: {count from Step 1}
  critical_issues_resolved: {count from Step 3}
  high_issues_total: {count from Step 1}
  high_issues_resolved: {count from Step 3}
  medium_issues_total: {count from Step 1}
  medium_issues_resolved: {count from Step 3}
  structure_validation_passed: {true/false from Step 3}
  technical_extraction_rate: {percentage from Step 3}
  review_round: 1

Output:
  approval_decision: {AUTO_APPROVED / ROUND_2_REVIEW_REQUIRED / USER_DECISION_REQUIRED / BLOCKED}
  reasoning: {explanation}
  next_status: {AwaitingArchReview / Blocked} (only for ROUND_2_REVIEW_REQUIRED and BLOCKED)
  next_action: {check_test_design_for_final_status / handoff_to_architect_round_2 / prompt_user_decision / sm_continue_revision / sm_fix_structure / sm_improve_technical_details}
  metadata: {additional context}
```

**5.3 Handle Decision Result**

Based on the approval decision, take appropriate action:

**If approval_decision = AUTO_APPROVED:**
- Skip Round 2 Review
- Proceed to Step 5.4 to determine final status based on test design level
- Skip Step 6 (no user decision needed)

**If approval_decision = ROUND_2_REVIEW_REQUIRED:**
- Set Status to `AwaitingArchReview`
- Set Review Round to 2
- Test design level will be re-evaluated after Architect approval in Round 2
- Proceed to Step 7 to update metadata and Change Log
- Skip Step 6 (no user decision needed)

**If approval_decision = USER_DECISION_REQUIRED:**
- Proceed to Step 6 to prompt user

**If approval_decision = BLOCKED:**
- Set Status to `Blocked`
- SM must further revise the Story before proceeding
- Proceed to Step 7 to update metadata and Change Log
- Skip Step 6 (no user decision needed)

**5.4 Determine Final Status for Auto-Approved Stories**

If the Story was auto-approved, call the decision system to determine final status based on test design level:

```
Execute: orchestrix-core/tasks/make-decision.md
Decision Type: sm-story-status
Context:
  architect_review_result: APPROVED
  test_design_level: {Simple / Standard / Comprehensive from Step 4}

Output:
  story_status: {TestDesignComplete / AwaitingTestDesign}
  reasoning: {explanation}
  next_action: {handoff_to_dev / handoff_to_qa_test_design}
  metadata: {additional context}
```

**Record the final status decision:**
- Final Status: {TestDesignComplete / AwaitingTestDesign}
- Reasoning: {from decision output}
- Next Action: {handoff_to_dev / handoff_to_qa_test_design}

**Proceed to Step 7 to update metadata and Change Log**

**5.5 Decision Summary**

Display the decision results for documentation:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVISION DECISION RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Approval Decision: {AUTO_APPROVED / ROUND_2_REVIEW_REQUIRED / USER_DECISION_REQUIRED / BLOCKED}
Reasoning: {from decision output}
Next Status: {TestDesignComplete / AwaitingTestDesign / AwaitingArchReview / Blocked}
Next Action: {from decision output}

Quality Metrics:
- Previous Architect Score: {score}/10
- New Quality Score: {score}/10
- Improvement: +{improvement} points
- Issues Resolved: {count}/{total}

Test Design:
- Test Design Level: {Simple / Standard / Comprehensive}
- Test Design Status: {NotRequired / Pending / Complete / Requires Review}
- Level Changed: {Yes / No}

Next Step: {Step 6 (User Decision) / Step 7 (Update Metadata)}
```

### Step 6: User Decision Prompt (If Applicable)

**Trigger:** approval_decision = USER_DECISION_REQUIRED (from Step 5.2)

**Prompt User:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ARCHITECT REVIEW DECISION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Story: [{epicNum}.{storyNum}] {Story Title}
Revision Status: Medium issues addressed
New Quality Score: {score}/10 (Previous Architect Score: {prev_score}/10)

Revision Summary:
- Critical Issues Resolved: {count}
- High Severity Issues Resolved: {count}
- Medium Issues Resolved: {count}
- Low Issues Resolved: {count}

Test Design Status:
- Test Design Level: {Simple / Standard / Comprehensive}
- Test Design Required: {Yes / No}

The Story quality has improved to {score}/10. Medium-level issues have been 
addressed. You can choose to:

1. TRIGGER_ROUND_2_REVIEW - Request Architect validation of changes
2. ACCEPT_RISK_AND_APPROVE - Approve Story and proceed to next phase

Please enter your decision (1 or 2):
```


**Handle User Response:**

**If user selects TRIGGER_ROUND_2_REVIEW:**
1. Set Status to `AwaitingArchReview`
2. Update Architect Review Metadata: `review_status: PENDING`, `review_round: 2`
3. Document decision in Change Log
4. Output handoff message: "Next: Architect please execute command `review-story {story_id}` (Round 2)"
5. **Note:** Test design level will be re-evaluated after Architect approval

**If user selects ACCEPT_RISK_AND_APPROVE:**
1. Call decision system to determine final status based on test design level:
   ```
   Execute: orchestrix-core/tasks/make-decision.md
   Decision Type: sm-story-status
   Context:
     architect_review_result: APPROVED
     test_design_level: {Simple / Standard / Comprehensive from Step 4}
   
   Output:
     story_status: {TestDesignComplete / AwaitingTestDesign}
     reasoning: {explanation}
     next_action: {handoff_to_dev / handoff_to_qa_test_design}
   ```
2. Set Status based on decision output
3. Update metadata with risk acceptance note and user decision
4. Document decision in Change Log
5. Output appropriate handoff message based on next_action

### Step 7: Update Story Metadata and Change Log

**Objective:** Record revision details, test design level changes, and decision for audit trail

**7.1 Update Quality Assessment Metadata**

Locate the "Quality Assessment Metadata" section in the Story file and update it:

**If revision_history doesn't exist, add it:**

```yaml
Quality Assessment Metadata:
  structure_validation_passed: {true/false}
  technical_quality_score: {score}/10
  complexity_indicators_detected: {count}
  architect_review_recommendation: {NOT_NEEDED / OPTIONAL / RECOMMENDED}
  
  revision_history:
    - revision_date: {YYYY-MM-DD HH:MM:SS}
      revision_trigger: architect_feedback_round_1
      previous_architect_score: {score}/10
      new_technical_quality_score: {score}/10
      score_improvement: +{improvement}
      issues_resolved:
        critical: {resolved_count}/{total_count}
        high: {resolved_count}/{total_count}
        medium: {resolved_count}/{total_count}
        low: {resolved_count}/{total_count}
      decision: {auto_approved / round_2_review / user_approved / blocked}
      decision_reasoning: "{explanation}"
```

**If revision_history already exists, append to it:**

```yaml
  revision_history:
    # ... existing revisions ...
    - revision_date: {YYYY-MM-DD HH:MM:SS}
      revision_trigger: architect_feedback_round_1
      previous_architect_score: {score}/10
      new_technical_quality_score: {score}/10
      score_improvement: +{improvement}
      issues_resolved:
        critical: {resolved_count}/{total_count}
        high: {resolved_count}/{total_count}
        medium: {resolved_count}/{total_count}
        low: {resolved_count}/{total_count}
      decision: {auto_approved / round_2_review / user_approved / blocked}
      decision_reasoning: "{explanation}"
```

**7.2 Update QA Test Design Metadata**

Update the "QA Test Design Metadata" section based on test design level changes from Step 4:

**If test design level changed or requires review, update accordingly as documented in Step 4.5**

**7.3 Update Architect Review Metadata**

Locate the "Architect Review Metadata" section and update it based on the decision:

**If Status = Approved (Auto-Approved or User-Approved):**

```yaml
Architect Review Metadata:
  review_required: false
  review_recommendation: NOT_NEEDED
  review_round: 1
  review_status: COMPLETED
  last_revision_date: {YYYY-MM-DD HH:MM:SS}
  revision_quality_improvement: +{improvement}
  auto_approved: true
  auto_approval_reason: "{reason}"
```

**If Status = AwaitingArchReview (Round 2):**

```yaml
Architect Review Metadata:
  review_required: true
  review_recommendation: RECOMMENDED
  review_round: 2
  review_status: PENDING
  last_revision_date: {YYYY-MM-DD HH:MM:SS}
  revision_quality_improvement: +{improvement}
  round_2_trigger: "{reason}"
```

**If Status = Blocked:**

```yaml
Architect Review Metadata:
  review_required: false
  review_recommendation: N/A
  review_round: 1
  review_status: BLOCKED
  last_revision_date: {YYYY-MM-DD HH:MM:SS}
  revision_quality_improvement: +{improvement}
  blocked_reason: "{reason}"
```

**7.4 Add Change Log Entry**

Locate the "Change Log" section (usually near the end of the Story file) and add a new entry at the top:

```markdown
## Change Log

### {YYYY-MM-DD HH:MM:SS} - SM Revision (Post-Architect Review Round 1)

**Trigger:** Architect feedback from Round 1 review

**Quality Metrics:**
- Previous Architect Score: {score}/10
- New Technical Quality Score: {score}/10
- Score Improvement: +{improvement} points ({percentage}% improvement)
- Structure Validation: {PASS/FAIL}
- Technical Extraction: {percentage}%
- Complexity Indicators: {count}

**Issues Addressed:**
- Critical Issues: {resolved_count}/{total_count} resolved
  {List each critical issue and how it was resolved}
- High Severity Issues: {resolved_count}/{total_count} resolved
  {List each high severity issue and how it was resolved}
- Medium Issues: {resolved_count}/{total_count} resolved
  {List each medium issue and how it was resolved}
- Low Issues: {resolved_count}/{total_count} resolved
  {List each low issue and how it was resolved}

**Key Changes Made:**
1. {Specific change 1 - e.g., "Updated API endpoint design to follow REST conventions"}
   - Location: Dev Notes > API Specifications
   - Addresses: Critical Issue #1
   
2. {Specific change 2 - e.g., "Added missing validation rules to User data model"}
   - Location: Dev Notes > Data Models
   - Addresses: High Severity Issue #1
   
3. {Specific change 3 - e.g., "Clarified testing strategy with specific test scenarios"}
   - Location: Dev Notes > Testing Requirements
   - Addresses: Medium Issue #2
   
4. {Specific change 4 - e.g., "Updated architecture references to correct sections"}
   - Location: Dev Notes > Multiple sections
   - Addresses: Low Issue #1

**Decision Logic Applied:**
- Decision Path: {Auto-Approve / Mandatory Review / User Decision / Blocked / Default}
- Decision: {Auto-Approved / Round 2 Review Required / User Approved / Remain Blocked}
- Reasoning: {explanation}

**Next Status:** `{Approved / AwaitingArchReview / Blocked}`

**Next Action:** {handoff message or blocked message}

---

{Previous Change Log entries...}
```

**7.5 Update Story Status Field**

Locate the "Status" field at the top of the Story file and update it:

```yaml
Status: {Approved / AwaitingArchReview / Blocked}
```

**7.6 Save Story File**

1. Save all metadata and Change Log updates
2. Verify the Story file is valid YAML/Markdown
3. Ensure no formatting errors were introduced
4. Proceed to Step 8 to output handoff message

**Example Complete Change Log Entry:**

```markdown
## Change Log

### 2025-10-13 14:30:00 - SM Revision (Post-Architect Review Round 1)

**Trigger:** Architect feedback from Round 1 review

**Quality Metrics:**
- Previous Architect Score: 6.5/10
- New Technical Quality Score: 8.5/10
- Score Improvement: +2.0 points (30.8% improvement)
- Structure Validation: PASS
- Technical Extraction: 95%
- Complexity Indicators: 2

**Issues Addressed:**
- Critical Issues: 1/1 resolved
  - API endpoint design not following REST conventions → Fixed: Changed POST /user/create to POST /api/v1/users
- High Severity Issues: 0/0 resolved
- Medium Issues: 2/2 resolved
  - Data model missing validation rules → Fixed: Added email validation, password strength requirements
  - Testing strategy lacks detail → Fixed: Added specific test scenarios for unit, integration, and e2e tests
- Low Issues: 1/1 resolved
  - Documentation reference format inconsistent → Fixed: Updated all references to standard format

**Key Changes Made:**
1. Updated API endpoint design to follow REST conventions
   - Location: Dev Notes > API Specifications
   - Addresses: Critical Issue #1
   - Changed: POST /user/create → POST /api/v1/users
   - Added: Request/response examples, error codes, authentication requirements
   
2. Added comprehensive validation rules to User data model
   - Location: Dev Notes > Data Models
   - Addresses: Medium Issue #1
   - Added: Email format validation (RFC 5322), password strength rules, required field constraints
   
3. Enhanced testing strategy with specific scenarios
   - Location: Dev Notes > Testing Requirements
   - Addresses: Medium Issue #2
   - Added: Unit test scenarios (5), integration test scenarios (3), coverage target (80%)
   
4. Standardized all architecture references
   - Location: Dev Notes > Multiple sections
   - Addresses: Low Issue #1
   - Updated: 8 references to format [Source: docs/architecture/{file}.md#{section}]

**Decision Logic Applied:**
- Decision Path: Auto-Approve (Significant Improvement)
- Decision: Auto-Approved
- Reasoning: All critical issues resolved, quality score improved by 2+ points, and new score ≥ 8.0

**Next Status:** `Approved`

**Next Action:** Next: Dev please execute command `implement-story 1.2`

---
```

### Step 8: Output Handoff Message
**Objective:** Provide clear next steps based on the final status and test design requirements

**Generate handoff message based on status:**

```
IF Status = TestDesignComplete:
   Output: "Next: Dev please execute command `implement-story {story_id}`"

ELSE IF Status = Approved:
   Output: "Next: Dev please execute command `implement-story {story_id}`"

ELSE IF Status = AwaitingTestDesign AND requires_review = true:
   Output: "Next: QA please review test design for {story_id} - story has been revised"

ELSE IF Status = AwaitingTestDesign:
   Output: "Next: QA please execute command `test-design {story_id}`"

ELSE IF Status = AwaitingArchReview:
   Output: "Next: Architect please execute command `review-story {story_id}` (Round 2)"

ELSE IF Status = Blocked:
   Output: "Story blocked - SM must continue revision"
```

**Final Output Format:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STORY REVISION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Story: [{epicNum}.{storyNum}] {Story Title}

Revision Summary:
- Issues Addressed: {total_count}
- Quality Score: {prev_score}/10 → {new_score}/10 (+{improvement})
- Test Design Level: {Simple / Standard / Comprehensive}
- Test Design Status: {NotRequired / Pending / Complete / Requires Review}
- Decision: {decision_type}
- New Status: `{Status}`

{handoff_message}
```

## Quality Gates

- All Critical issues from Architect review must be addressed
- Quality score must improve or remain high (≥ 7.0)
- Structure validation must pass (100%)
- Technical extraction must meet minimum threshold (≥ 80%)

## Success Criteria

- Story has been revised to address Architect feedback
- Quality check has been re-executed successfully
- Test design level has been re-evaluated based on new quality metrics
- Test design metadata has been updated appropriately
- Intelligent decision logic has been applied correctly
- Story status has been updated appropriately (considering test design requirements)
- Change Log documents all revisions, test design changes, and decisions
- Clear handoff message has been provided (including test design next steps if applicable)

## Risk Mitigation

- **Insufficient Improvement**: If quality score doesn't improve significantly, status set to Blocked
- **Critical Issues Unresolved**: Mandatory Round 2 review triggered
- **Infinite Loop Prevention**: Maximum 2 Architect review rounds enforced
- **User Override**: User can accept risk and approve if medium issues addressed

## Notes for SM Agent

- **Focus on Architect Concerns**: Prioritize issues identified by Architect, especially Critical and High Severity
- **Verify Fixes**: Don't just make changes, verify they actually resolve the issues
- **Document Changes**: Clear documentation helps Architect in Round 2 (if needed)
- **Quality Improvement**: Aim for significant quality score improvement (≥ 2 points) to enable auto-approval
- **Test Design Level Re-evaluation**: Always re-evaluate test design level after revision - complexity and quality changes may affect test design requirements
- **Test Design Coordination**: If test design already complete, mark for QA review when story changes significantly
- **Architecture Alignment**: Ensure all changes align with architecture documents
- **Source References**: Maintain accurate source references for all technical details
- **Auto-Approval Goal**: If possible, meet auto-approval conditions to skip Round 2 review
- **User Communication**: If user decision needed, provide clear context and options including test design status