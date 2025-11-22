# Review Escalated Issue

## Overview
As the **Architect Agent**, you are responsible for reviewing architecture concerns escalated by the QA Agent during their review process. This task handles situations where QA identifies potential architecture issues (performance bottlenecks, security vulnerabilities, scalability concerns) that require architectural expertise.

## Context
This task is triggered when QA sets Story Status to `Escalated` with `architecture_concern: true` in the QA Gate. The QA Agent has identified issues beyond their scope that require architectural review and guidance.

## Agent Permission Check

**CRITICAL**: Before proceeding, verify Architect agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm you are the Architect agent
   - Reference `{root}/data/story-status-transitions.yaml`

2. **Check Escalation Review Permission:**
   - Verify Architect has permission to modify stories in `Escalated` status
   - Reference `can_modify_in_statuses` in agent_permissions
   - Verify Architect can perform status changes:
     - Escalated -> InProgress (requires Dev fixes)
     - Escalated -> Review (no changes needed, QA continues)

3. **If permission check fails:**
   - Log error: "Architect agent does not have permission to review escalated issues"
   - Reference the responsible agent from story-status-transitions.yaml
   - HALT and inform user of the permission violation
   - Do NOT proceed with review

## Prerequisites
- Story status is "Escalated"
- QA Gate file exists with `architecture_concern: true`
- QA has documented the escalation reason
- Architecture documentation is available in `docs/architecture/` directory

## Core Objectives

1. **Understand QA's Concern**: Review the architecture concern raised by QA
2. **Assess Architecture Impact**: Evaluate if the concern is valid and requires changes
3. **Provide Guidance**: Offer architectural recommendations or confirm current approach
4. **Set Next Steps**: Determine if Dev needs to make changes or if QA can continue review

## Step-by-Step Process

### Phase 1: Validate Escalation Context

1. **Verify Story Status**
   - Read the Story's `Status` field
   - Verify status is `Escalated`
   - If status is not `Escalated`, HALT and inform user:
     ```
     ERROR: Invalid status for escalation review
     Current Status: {current_status}
     Expected Status: Escalated
     
     The Architect can only review escalated issues with status 'Escalated'.
     ```

2. **Validate Agent Permission**
   - Reference `{root}/data/story-status-transitions.yaml`
   - Confirm Architect has permission to modify stories in `Escalated` status
   - Verify Architect can transition to target statuses: `InProgress`, `Review`

3. **Read QA Gate File**
   - Locate the QA Gate file in `docs/qa/gates/` directory
   - Verify `architecture_concern: true`
   - Read `escalation_reason` field
   - Review `top_issues` related to architecture

### Phase 2: Architecture Context Review

4. **Read Relevant Architecture Documents**
   ```
   Based on the escalation reason, read relevant architecture shards:
   
   **Common Documents:**
   - docs/architecture/tech-stack.md
   - docs/architecture/backend-architecture.md (if backend concern)
   - docs/architecture/frontend-architecture.md (if frontend concern)
   - docs/architecture/database-schema.md (if data concern)
   - docs/architecture/rest-api-spec.md (if API concern)
   
   **Security Concerns:**
   - docs/architecture/security-architecture.md (if exists)
   
   **Performance Concerns:**
   - docs/architecture/performance-requirements.md (if exists)
   ```

5. **Read Story and Implementation**
   - Read the complete Story file
   - Review Dev Notes and implementation approach
   - Review Dev Log to understand what was implemented
   - Identify the specific code or design causing the concern

### Phase 3: Architecture Assessment

6. **Evaluate the Concern**
   - Assess if QA's concern is valid from an architectural perspective
   - Determine severity: Critical / High / Medium / Low
   - Identify root cause of the architecture issue
   - Consider impact on:
     - System scalability
     - Performance
     - Security
     - Maintainability
     - Integration with other components

7. **Determine Required Action**
   - **Requires Changes**: Architecture issue is valid and must be fixed
   - **No Changes Needed**: Concern is not valid or acceptable as-is
   - **Needs Clarification**: Requires more information from Dev or QA

### Phase 4: Provide Architectural Guidance

8. **Document Architecture Review**
   Create a review addressing:
   - **Concern Validation**: Is the concern valid?
   - **Architecture Analysis**: Detailed analysis of the issue
   - **Impact Assessment**: What are the consequences if not addressed?
   - **Recommendations**: Specific actions to resolve the issue
   - **Alternative Approaches**: If applicable, suggest alternatives

9. **Determine Next Status**
   Based on the assessment:
   
   **If Changes Required (Status = InProgress):**
   - Condition: Architecture concern is valid and requires code changes
   - Action: Set Story Status to `InProgress`
   - Reasoning: Dev must implement architectural fixes
   - Handoff: "Next: Dev execute command `develop-story {story-id}` to address architecture concerns"
   
   **If No Changes Needed (Status = Review):**
   - Condition: Concern is not valid or current approach is acceptable
   - Action: Set Story Status to `Review`
   - Reasoning: QA can continue review with architectural clarification
   - Handoff: "Next: QA execute command `review {story-id}` to continue review"

### Phase 5: Update Story and Output Results

10. **Update Story Status Field (CRITICAL - DO NOT SKIP)**

**Determine target status** from Step 9 decision:
- `next_status` = InProgress (if changes required) OR Review (if no changes needed)

**Execute status transition validation**:

Execute `{root}/tasks/utils/validate-status-transition.md`:

```yaml
story_path: {{story_file_path}}
agent: architect
current_status: Escalated
target_status: {{next_status from Step 9}}
context:
  escalation_review_complete: true
  changes_required: {{true if InProgress, false if Review}}
  concern_valid: {{true/false}}
```

**On validation PASS**:

1. **Update Story.status field directly**:
   - Find Story metadata YAML block
   - Update `status: {{next_status}}`
   - Save the file

2. **Verify update**:
   ```bash
   # Re-read Story file
   # Extract Story.status
   # Confirm: status == {{next_status}}
   ```

3. **If verification fails**: HALT with error - Status update failed

**On validation FAIL**:
- HALT with error message
- Do NOT proceed to append results
- Report validation error to user

**Example Status Update Code** (pseudocode):
```python
# Read story file
story_content = read_file(story_path)

# Find Story YAML block
story_yaml_block = extract_yaml_block(story_content, "Story")

# Update status field
story_yaml_block['status'] = next_status

# Replace in content
updated_content = replace_yaml_block(story_content, "Story", story_yaml_block)

# Write back
write_file(story_path, updated_content)

# Verify
verify_status = extract_yaml_block(read_file(story_path), "Story")['status']
assert verify_status == next_status, "Status update failed"
```

11. **Append Architect Review Results**
    Append to the Story file's "Architect Review Results" section:
    
    ```markdown
    ---
    
    ### Escalation Review Date: {YYYY-MM-DD}
    
    ### Reviewed By: Architect Agent
    
    ### Escalation Context
    - **Escalated By**: QA Agent
    - **Escalation Reason**: {escalation_reason from QA Gate}
    - **QA Concerns**: {summary of top_issues from QA Gate}
    
    ### Architecture Assessment
    
    #### Concern Validation
    {Is the concern valid? Explain why or why not}
    
    #### Architecture Analysis
    {Detailed analysis of the architecture issue}
    
    #### Impact Assessment
    - **Severity**: {Critical/High/Medium/Low}
    - **Scalability Impact**: {assessment}
    - **Performance Impact**: {assessment}
    - **Security Impact**: {assessment}
    - **Maintainability Impact**: {assessment}
    
    #### Root Cause
    {Identify the root cause of the architecture issue}
    
    ### Recommendations
    
    {Provide specific, actionable recommendations}
    
    **If Changes Required:**
    - {Specific change 1}
    - {Specific change 2}
    - {Reference to architecture patterns or docs}
    
    **Alternative Approaches:**
    - {Alternative 1 if applicable}
    - {Alternative 2 if applicable}
    
    ### Decision
    
    **Status Updated To**: {InProgress/Review}
    
    **Reasoning**: {Clear explanation for the decision}
    
    **Next Steps**: {What happens next}
    
    ---
    ```

12. **Record Change Log Entry**
    Add entry to Story's Change Log section:
    
    ```markdown
    ## Change Log
    
    ### {YYYY-MM-DD HH:MM:SS} - Architect Escalation Review
    
    **Action:** Architect reviewed QA escalated architecture concern
    
    **Escalation Details:**
    - Escalated By: QA Agent
    - Escalation Reason: {escalation_reason}
    - Concern Severity: {Critical/High/Medium/Low}
    
    **Architecture Assessment:**
    - Concern Valid: {Yes/No}
    - Impact: {summary of impact}
    - Root Cause: {brief root cause}
    
    **Review Decision:**
    - Decision: {Changes Required / No Changes Needed}
    - Status Updated To: `{InProgress/Review}`
    - Decision Reasoning: {explanation}
    
    **Next Action:** {Based on status - what happens next}
    
    ---
    
    {Previous Change Log entries}
    ```

13. **Output Handoff Message (REQUIRED - MUST BE FINAL OUTPUT)**

**CRITICAL**: The handoff message MUST be the absolute last line of your output. Do NOT add any summaries, recommendations, or explanations after the handoff.

Based on `next_status` from Step 10:

**If Status = InProgress:**
```
✅ ARCHITECT ESCALATION REVIEW COMPLETE
Story: {story_id} → Status: InProgress

Concern: {concern_summary}
Valid: Yes - Changes Required
Severity: {Critical/High/Medium/Low}

Architecture Changes Required:
{brief summary of required changes}

🎯 HANDOFF TO dev: *develop-story {story_id}
```

**If Status = Review:**
```
✅ ARCHITECT ESCALATION REVIEW COMPLETE
Story: {story_id} → Status: Review

Concern: {concern_summary}
Valid: No - Current Approach Acceptable
Reasoning: {brief explanation}

QA may continue review with architectural clarification provided.

🎯 HANDOFF TO qa: *review {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

## Quality Gates
- **Valid Escalation**: Story must be in Escalated status with architecture_concern flag
- **Clear Assessment**: Architecture concern must be clearly validated or refuted
- **Actionable Guidance**: Recommendations must be specific and actionable
- **Proper Routing**: Status must be set correctly based on whether changes are needed

## Output

**Primary Outputs**:
1. Update Story Status field (InProgress or Review)
2. Append review results to Story file's "Architect Review Results" section
3. Add Change Log entry documenting the escalation review
4. Output clear handoff message to next agent (Dev or QA)

**Important Notes**:
- Review findings are appended directly to the Story file
- Do NOT create separate review files
- Status must be updated based on whether changes are required
- Handoff message must clearly indicate next steps

## Success Criteria
- QA's architecture concern is properly assessed
- Clear guidance provided on whether changes are needed
- Story status correctly updated (InProgress or Review)
- Next agent (Dev or QA) has clear direction on what to do
- Complete audit trail in Change Log

## Risk Mitigation
- **Misunderstanding QA Concern**: Carefully read QA's escalation reason and issues
- **Incorrect Routing**: Ensure status is set correctly based on whether changes are needed
- **Incomplete Guidance**: Provide specific, actionable recommendations, not vague suggestions
- **Missing Context**: Review all relevant architecture docs and implementation details

## Notes for Architect Agent
- **Focus on QA's Concern**: Address the specific architecture concern raised by QA
- **Be Decisive**: Clearly state whether changes are required or not
- **Provide Context**: Explain your reasoning so Dev/QA understands the architectural perspective
- **Reference Docs**: Point to specific architecture documents or patterns
- **Consider Trade-offs**: Sometimes architectural concerns are acceptable trade-offs for MVP or specific constraints
- **Update Status**: Always update the Story Status field based on your decision
- **Clear Handoff**: Ensure the next agent knows exactly what to do
