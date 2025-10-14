# Review Story Technical Accuracy

## Overview
As the **Architect Agent**, you are responsible for conducting technical accuracy reviews of stories created by the SM Agent. This ensures that all user stories maintain architectural consistency, technical feasibility, and alignment with project standards before they reach the development phase.

## Context
This task is part of the second layer quality assurance in the Orchestrix framework. After the SM Agent creates a story with internal validation, the Architect Agent performs an independent technical accuracy review to catch any technical inconsistencies, architectural misalignments, or feasibility issues.

**Review Trigger Context**: The SM Agent analyzes Stories for complexity indicators and provides a recommendation (RECOMMENDED/OPTIONAL/NOT_NEEDED) to the user. The user then decides whether to trigger this Architect review. By the time you execute this task, the decision to review has already been made. The Story metadata will contain the complexity analysis results showing which indicators were detected.

## Agent Permission Check

**CRITICAL**: Before proceeding with technical review, verify Architect agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm you are the Architect agent
   - Reference `{root}/data/story-status-transitions.yaml`

2. **Check Review Permission:**
   - Verify Architect has permission to modify stories in `AwaitingArchReview` status
   - Reference `can_modify_in_statuses` in agent_permissions
   - Verify Architect can perform status changes:
     - AwaitingArchReview -> Approved
     - AwaitingArchReview -> RequiresRevision
     - AwaitingArchReview -> Escalated

3. **If permission check fails:**
   - Log error: "Architect agent does not have permission to review this story"
   - Reference the responsible agent from story-status-transitions.yaml
   - HALT and inform user of the permission violation
   - Do NOT proceed with review

## Prerequisites
- A story has been created by the SM Agent and passed internal validation
- SM Agent's comprehensive quality validation has been completed (quality score available)
- Complexity analysis results are documented in the Story metadata
- Story status is "AwaitingArchReview"
- Architecture documentation is available in `docs/architecture/` directory
- You have access to the story file in the project

## Core Objectives

**Note**: The SM Agent has already validated technical accuracy basics (tech stack compliance, naming conventions, project structure, documentation format). This review focuses on **architecture-specific concerns** that require deeper architectural expertise.

1. **Validate Architectural Patterns**: Ensure the story follows established architectural patterns and doesn't introduce anti-patterns
2. **Verify System Integration**: Confirm integration approaches are sound and dependencies are manageable
3. **Assess Scalability & Performance**: Evaluate if the approach scales appropriately and has acceptable performance implications
4. **Review Security Architecture**: Validate security approaches align with architectural standards
5. **Ensure Technical Feasibility**: Confirm the story is technically sound at the system level with no architectural blockers

## Step-by-Step Process

### Phase 1: Architecture Context Review
1. **Read Relevant Architecture Documents**
   ```
   Based on story type, read these architecture shards:
   
   **All Stories:**
   - docs/architecture/tech-stack.md
   - docs/architecture/source-tree.md
   - docs/architecture/coding-standards.md
   - docs/architecture/testing-strategy.md
   
   **Backend/API Stories (additional):**
   - docs/architecture/data-models.md
   - docs/architecture/database-schema.md
   - docs/architecture/backend-architecture.md
   - docs/architecture/rest-api-spec.md
   - docs/architecture/external-apis.md
   
   **Frontend/UI Stories (additional):**
   - docs/architecture/frontend-architecture.md
   - docs/architecture/components.md
   - docs/architecture/core-workflows.md
   - docs/architecture/data-models.md
   ```

2. **Establish Technical Baseline**
   - Note current tech stack versions and constraints
   - Identify architectural patterns and conventions
   - Review existing component structure and naming conventions
   - Understand current API contracts and data models

### Phase 2: Story Technical Analysis

**Status Transition Validation**

Before proceeding with the review, validate that the Architect is authorized to review this Story:

1. **Check Current Story Status:**
   - Read the Story's `Status` field
   - Verify status is `AwaitingArchReview`
   - If status is not `AwaitingArchReview`, HALT and inform user:
     ```
     ERROR: Invalid status for Architect review
     Current Status: {current_status}
     Expected Status: AwaitingArchReview
     
     The Architect can only review stories with status 'AwaitingArchReview'.
     Current responsible agent: {responsible_agent_from_config}
     ```

2. **Validate Agent Permission:**
   - Reference `{root}/data/story-status-transitions.yaml`
   - Confirm Architect has permission to modify stories in `AwaitingArchReview` status
   - Verify Architect can transition to target statuses: `Approved`, `RequiresRevision`, `Escalated`

3. **Check Review Round Limits:**
   - Read the Story's `Architect Review Metadata` section
   - Check the `review_round` field to determine current review round (0 = no review yet, 1 = first review, 2 = second review)
   - If `review_round` is 0 or not set, this is the first review (set to 1)
   - If `review_round` is 1, this is the second review (set to 2)
   - If `review_round` is already 2, this should not happen - escalate to user for decision
   - Maximum 2 rounds of architect review are allowed

4. **If validation fails:**
   - Log error with details from `story-status-transitions.yaml` error_messages
   - HALT and provide guidance on correct workflow
   - Do NOT proceed with review

3. **Read and Parse the Story**
   - Carefully read the entire story including Dev Notes
   - Extract all technical components mentioned
   - Identify architectural dependencies
   - Note any external service integrations

4. **Technical Component Validation**
   - **Tech Stack Compliance**: Verify all mentioned technologies align with `tech-stack.md`
   - **Naming Conventions**: Check component, file, and variable names follow `coding-standards.md`
   - **Project Structure**: Ensure file paths match `source-tree.md`
   - **API Design**: Validate endpoints follow patterns in `rest-api-spec.md` (if applicable)
   - **Data Models**: Confirm data structures align with `data-models.md` (if applicable)

5. **Architecture Pattern Validation**
   - **Backend Patterns**: Verify adherence to `backend-architecture.md` patterns (if applicable)
   - **Frontend Patterns**: Check compliance with `frontend-architecture.md` patterns (if applicable)
   - **Component Design**: Ensure UI components follow `components.md` guidelines (if applicable)
   - **Workflow Integration**: Validate alignment with `core-workflows.md` (if applicable)

### Phase 3: Dependency and Integration Analysis
6. **Dependency Chain Validation**
   - Map all technical dependencies mentioned in the story
   - Cross-reference with existing system components
   - Identify missing dependencies or circular dependencies
   - Validate external API dependencies against `external-apis.md` (if applicable)

7. **Integration Point Analysis**
   - Check database interaction patterns against `database-schema.md` (if applicable)
   - Validate API integration approaches
   - Ensure proper error handling and security considerations
   - Review testing approach against `testing-strategy.md`

### Phase 4: Feasibility and Quality Assessment
8. **Implementation Feasibility Check**
   - Assess if story scope is appropriate for development capacity
   - Identify potential technical blockers or complex integrations
   - Evaluate if acceptance criteria are technically measurable
   - Check if story can be completed independently

9. **Documentation Reference Verification**
   - Verify all architecture document references in Dev Notes are accurate
   - Ensure referenced sections exist and contain relevant information
   - Check that source citations follow correct format: `[Source: docs/architecture/{filename}.md#{section}]`
   - Validate that no outdated or non-existent references are included

### Phase 5: Architecture Score and Recommendations

**Note**: Use the streamlined checklist at `orchestrix-core/checklists/architect-technical-review-checklist.md` for detailed scoring guidance.

10. **Generate Architecture Score**
    Calculate based on these architecture-specific criteria (max 10 points):
    - ✅ Architectural Pattern Compliance (3 points)
    - ✅ System Integration Analysis (2 points)
    - ✅ Scalability & Performance (2 points)
    - ✅ Security Architecture (2 points)
    - ✅ Technical Feasibility (1 point)

11. **Provide Detailed Feedback**
    Create an architectural review report including:
    - **Overall Score**: X/10 with outcome recommendation (≥8 to approve)
    - **Architectural Concerns**: List specific architectural issues with severity (Critical/High/Medium/Low)
    - **Pattern Compliance**: Detail any pattern violations or anti-patterns
    - **Integration Risks**: Identify integration challenges or dependencies
    - **Improvement Recommendations**: Specific architectural actions to address issues
    - **Documentation Updates Needed**: If architecture docs need updates

12. **Determine Review Outcome and Update Status**
    
    **Execute Decision Task:**
    
    1. Call `make-decision` task with:
       - decision_type: `architect-review-result`
       - context:
         - architecture_score: [calculated score from step 10]
         - critical_issues: [count of critical issues]
         - review_round: [current review round from metadata]
    
    2. Apply decision result:
       - result: Review outcome (Approved/RequiresRevision/Escalated)
       - reasoning: Explanation for decision
       - next_status: Status to set
       - next_action: Action to take next
    
    **Read Test Design Level (if Approved):**
    
    3. If decision result is `Approved`:
       - Read `test_design_level` from Story's `QA Test Design Metadata` section
       - Expected values: `Simple`, `Standard`, or `Comprehensive`
       - If missing or empty, default to `Standard`
    
    **Determine Final Status:**
    
    4. Set Story Status based on decision result and test design level:
       - If result = `Approved` AND test_design_level = `Simple`:
         - Set Status to `Approved`
         - Reasoning: Story approved, test design not required
       - If result = `Approved` AND test_design_level ∈ {`Standard`, `Comprehensive`}:
         - Set Status to `AwaitingTestDesign`
         - Reasoning: Story approved, requires QA test design
       - If result = `RequiresRevision`:
         - Set Status to `RequiresRevision`
         - Reasoning: From decision result
       - If result = `Escalated`:
         - Set Status to `Escalated`
         - Reasoning: From decision result
    
    **Validate Transition:**
    
    5. Before updating status:
       - Reference `{root}/data/story-status-transitions.yaml`
       - Verify transition from `AwaitingArchReview` to target status is allowed
       - Confirm Architect has permission for this status change
       - If validation fails: HALT and inform user

13. **Update Architect Review Metadata**
    Update the Story's `Architect Review Metadata` section:
    - Increment `review_round` (1 for first review, 2 for second review)
    - Increment `total_reviews_conducted`
    - Append to `review_history` with:
      - Round number
      - Review date (current timestamp)
      - Reviewer ID (Architect Agent)
      - Review score (X/10)
      - Decision (approved/revise/escalate)
      - Critical issues count
      - Key findings summary (brief, 1-2 sentences)

## Quality Gates
- **Architecture Score ≥ 8/10**: Required to approve the story (updated from ≥7)
- **Zero Critical Architectural Issues**: No major architectural violations or blockers
- **Pattern Compliance**: Story must follow established architectural patterns
- **Integration Feasibility**: All integration points must be technically sound
- **SM Validation Complete**: SM Agent's quality validation must be completed first (this review builds on that foundation)
- **Maximum 2 Review Rounds**: After 2 rounds, user decision required if still needs revision

## Output

**Primary Outputs**:
1. Update Story Status field based on review outcome
2. Update Architect Review Metadata section
3. Append review results to the Story file's **"Architect Review Results"** section

**Important Notes**:
- Review findings are appended directly to the Story file, similar to the QA Results pattern
- Do NOT create separate review files
- If the "Architect Review Results" section doesn't exist in the Story, append it
- If the section exists, append the new review below existing entries with a timestamp
- Multiple reviews can be appended over time for audit trail purposes
- Status field must be updated based on review outcome (AwaitingTestDesign/Approved/RequiresRevision/Escalated)
- Architect Review Metadata must be updated with review round, history, and outcome

**Configuration Reference**: 
- For directory configuration, see `architecture.storyReviewsLocation` in `orchestrix-core/core-config.yaml`
- Currently set to `docs/architecture/story-reviews` (available for future gate files if needed)
- This keeps all architecture-related content under the `architecture` namespace

### Step 1: Update Story Status

Update the `Status` field in the Story file based on review outcome:
- If Approved: Set Status to `Approved`
- If Requires Revision: Set Status to `RequiresRevision`
- If Escalated: Set Status to `Escalated`
- If Round 2 and still needs revision: Follow user decision from prompt

### Step 2: Update Architect Review Metadata

Update the `Architect Review Metadata` section in the Story file:

```yaml
Architect Review Metadata:
  Review Rounds:
    review_round: [1 or 2]
    total_reviews_conducted: [increment by 1]
  
  Review History:
    - Round: [1 or 2]
      Date: [YYYY-MM-DD HH:MM:SS]
      Reviewer: Architect Agent
      Score: [X]/10
      Decision: [approved/revise/escalate]
      Critical Issues: [count]
      Key Findings: [brief 1-2 sentence summary]
```

### Step 3: Append Review Results

Append the following to the Story file's "Architect Review Results" section:

```markdown
---

### Review Round: [1 or 2]

### Review Date: [YYYY-MM-DD]

### Reviewed By: Architect Agent

### Architecture Score: [X/10]

### Review Focus Areas

#### 1. Architectural Pattern Compliance: [Score/3]
- **Pattern Consistency**: [Findings - does the story follow established patterns?]
- **Pattern Appropriateness**: [Findings - is the chosen pattern suitable for this use case?]
- **Anti-Patterns**: [Findings - are there any architectural anti-patterns introduced?]

#### 2. System Integration Analysis: [Score/2]
- **Integration Approach**: [Findings - is the integration approach sound?]
- **Cross-Service Dependencies**: [Findings - are dependencies manageable and well-defined?]
- **Integration Risks**: [Findings - what risks exist and how are they mitigated?]

#### 3. Scalability & Performance: [Score/2]
- **Scalability**: [Findings - does this approach scale with expected load?]
- **Performance Implications**: [Findings - are performance implications acceptable?]
- **Resource Usage**: [Findings - is resource usage appropriate?]

#### 4. Security Architecture: [Score/2]
- **Security Alignment**: [Findings - does security approach align with architecture?]
- **Risk Assessment**: [Findings - are security risks properly addressed?]
- **Sensitive Data Handling**: [Findings - is sensitive data handled appropriately?]

#### 5. Technical Feasibility: [Score/1]
- **System-Level Feasibility**: [Findings - is the approach technically sound at system level?]
- **Architectural Blockers**: [Findings - are there any architectural blockers?]

### Key Architectural Concerns

[Provide a summary of the main architectural concerns identified with severity levels. If none, state "No significant architectural concerns identified."]

**Issue Severity Breakdown:**
- Critical Issues: [count] - [list if any]
- High Severity Issues: [count] - [list if any]
- Medium Severity Issues: [count] - [list if any]
- Low Severity Issues: [count] - [list if any]

**Note**: Issue severity is important for SM's auto-approval logic after revision. Clearly categorize each issue.

### Recommendations

[Provide specific, actionable recommendations for addressing any issues or improving the architecture. Include:
- Immediate actions required (if any)
- Architecture documentation updates needed (if any)
- Future considerations for optimization or improvement]

### Outcome

**Decision**: [Decision result from make-decision task]

**Status Updated To**: [Final status based on decision result and test design level]

**Test Design Level**: [Simple/Standard/Comprehensive] (read from Story metadata if Approved)

**Reasoning**: [Use reasoning from decision result]

**Next Steps**: [Based on final status:
- If AwaitingTestDesign: "Next: QA execute command `test-design [story-id]`" (add risk-profile if Comprehensive or security sensitive)
- If Approved: "Next: Dev execute command `implement-story [story-id]`"
- If RequiresRevision: "Next: SM execute command `revise [story-id]`"
- If Escalated: "Story escalated, requires human intervention"]

---
```

## Success Criteria
- Technical review completed within defined quality gates
- All critical and major technical issues identified and documented
- Clear pass/fail recommendation provided with specific reasoning
- Actionable feedback provided for any required improvements
- Architecture consistency maintained across all approved stories

## Risk Mitigation
- **Architectural Drift**: Regular review ensures stories maintain consistency with established patterns
- **Technical Debt**: Early identification of shortcuts or workarounds that could cause future issues
- **Integration Failures**: Validation of dependencies and integration points before development
- **Documentation Inconsistency**: Verification that stories reflect current architecture state

### Step 4: Record Change Log Entry

**Objective:** Automatically record the architect review completion and decision in the Change Log for audit trail

**Add Change Log Entry to Story File:**

Locate the "Change Log" section in the Story file and add a new entry at the top:

```markdown
## Change Log

### {YYYY-MM-DD HH:MM:SS} - Architect Review Round {review_round}

**Action:** Architect technical accuracy review completed

**Review Details:**
- Review Round: {1 or 2}
- Reviewer: Architect Agent
- Architecture Score: {score}/10
- Review Focus: {Architectural patterns, system integration, scalability, security, feasibility}

**Issues Identified:**
- Critical Issues: {count}
  {List critical issues if any}
- High Severity Issues: {count}
  {List high severity issues if any}
- Medium Severity Issues: {count}
  {List medium severity issues if any}
- Low Severity Issues: {count}
  {List low severity issues if any}

**Review Decision:**
- Decision: {AwaitingTestDesign/Approved/RequiresRevision/Escalated}
- Status Updated To: `{AwaitingTestDesign/Approved/RequiresRevision/Escalated}`
- Decision Reasoning: {explanation for the decision}

**Next Action:** {Based on status - what happens next}

---

{Previous Change Log entries}
```

**Change Log Entry Details:**

Include the following information from the architect review:
- **Date/Time:** Current timestamp in YYYY-MM-DD HH:MM:SS format
- **Review Round:** Current review round (1 or 2)
- **Architecture Score:** Overall score out of 10
- **Issues Breakdown:** Count and brief description of issues by severity
- **Review Decision:** Approved/RequiresRevision/Escalated with reasoning
- **Status Change:** What status was set and why
- **Next Action:** Clear description of what should happen next

**Example Change Log Entry:**

```markdown
## Change Log

### 2024-01-15 16:45:33 - Architect Review Round 1

**Action:** Architect technical accuracy review completed

**Review Details:**
- Review Round: 1
- Reviewer: Architect Agent
- Architecture Score: 6.5/10
- Review Focus: Architectural patterns, system integration, scalability, security, feasibility

**Issues Identified:**
- Critical Issues: 1
  - API endpoint design does not follow REST conventions
- High Severity Issues: 0
- Medium Severity Issues: 2
  - Data model missing validation rules
  - Testing strategy lacks integration test details
- Low Severity Issues: 1
  - Documentation reference format inconsistent

**Review Decision:**
- Decision: RequiresRevision
- Status Updated To: `RequiresRevision`
- Decision Reasoning: Architecture score below threshold (6.5/10 < 8.0) and critical API design issue must be addressed

**Next Action:** SM should execute `revise` command to address architectural concerns

---
```

## Final Step: Output Handoff Message

After completing all updates (Status, Metadata, Review Results, and Change Log), output a clear handoff message based on the outcome and test design level:

**Determine Handoff Based on Status and Test Design Level:**

1. **Read Test Design Level** from Story metadata (if not already read in step 12)
2. **Generate appropriate handoff message:**

**If Status = AwaitingTestDesign:**
```
Next: QA please execute command `test-design {story_id}`
```
(If test design level is Comprehensive or security sensitive, add: ` and 'risk-profile {story_id}'`)

**If Status = Approved (Test Design Level = Simple):**
```
Next: Dev please execute command `implement-story {story_id}`
```
Note: Status is Approved because test design level is Simple, so QA test design is not required.

**If Status = RequiresRevision:**
```
Next: SM please execute command `revise {story_id}`
```

**If Status = Escalated:**
```
Story escalated - requires human intervention
```

## Auto-Approval After SM Revision

**Note**: The SM Agent may auto-approve a Story after revision if certain conditions are met, bypassing the need for a 2nd architect review. When reviewing a Story that has been revised, be aware that SM uses decision logic to determine if a 2nd review is needed.

**If SM auto-approves**: This 2nd review will not be triggered.

**If SM requests 2nd review**: Status will be set to `AwaitingArchReview`.

When conducting a 2nd review:
- Check if Critical issues from Round 1 have been addressed
- Verify that quality improvements are substantial
- Focus on whether remaining issues are acceptable or require further revision
- Use `make-decision` task to determine outcome (decision logic accounts for review round)

## Notes for Architect Agent
- **Focus on Architecture**: This review focuses on architecture-specific concerns. SM Agent has already validated technical basics (tech stack, naming, structure, documentation format).
- **Reference SM Results**: SM validation results and quality scores are available in the Story metadata for your reference.
- **Reference Previous Review**: If this is Round 2, review the Round 1 findings to check what was addressed.
- **Be Specific**: Point to exact sections in stories and architecture docs when providing feedback.
- **System Context**: Consider the story in context of the overall system architecture and long-term maintainability.
- **Documentation Updates**: If architecture documentation is outdated, recommend updates rather than accepting misalignment.
- **Append Results**: Always append your review to the Story file's "Architect Review Results" section (don't create separate files).
- **Use Streamlined Checklist**: Reference `orchestrix-core/checklists/architect-technical-review-checklist.md` for detailed scoring guidance.
- **Decision System**: Use `make-decision` task with decision_type `architect-review-result` to determine review outcome. Decision logic is centralized in `orchestrix-core/data/decisions/architect-review-result.yaml`.
- **Status Updates**: Always update the Story Status field based on decision result and test design level.
- **Test Design Routing (CRITICAL)**: When decision result is Approved, read test_design_level from Story metadata to determine final status:
  - If test_design_level = Simple → Status = Approved (skip QA test design)
  - If test_design_level ∈ {Standard, Comprehensive} → Status = AwaitingTestDesign (requires QA test design)
- **Metadata Updates**: Always update Architect Review Metadata with review round, history, and outcome.
- **Issue Severity Tracking**: Clearly mark issues as Critical/High/Medium/Low so SM can apply auto-approval logic. 