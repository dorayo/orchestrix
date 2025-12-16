# Architect Review Story - Technical Accuracy

## Mission

Conduct comprehensive technical accuracy review of SM-created story against architecture standards.

## Step 0: Idempotency Check (MANDATORY - Fast Exit to Save Tokens)

**Purpose**: Prevent re-reviewing already approved stories

**Read Story File**: Use glob pattern `docs/stories/{story_id}.*.md` to find the story file (handles both `5.2.md` and `5.2.20241117.md` formats)

**Extract**:
- Story.status
- Story metadata (test_design_level if available)

**Check if Already Reviewed**:

- **If status = "Approved"**:
  ```
  ℹ️ STORY ALREADY APPROVED (Simple - No Test Design)
  Story: {story_id}
  Status: Approved

  Architect review already completed. Story ready for Dev implementation.

  ---ORCHESTRIX-HANDOFF-BEGIN---
  target: dev
  command: develop-story
  args: {story_id}
  ---ORCHESTRIX-HANDOFF-END---

  🎯 HANDOFF TO dev: *develop-story {story_id}
  ```
  **HALT: Review completed, Dev handoff sent ✋**

- **If status = "AwaitingTestDesign"**:
  ```
  ℹ️ STORY ALREADY APPROVED (Needs Test Design)
  Story: {story_id}
  Status: AwaitingTestDesign
  Test Design Level: {test_design_level}

  Architect review already completed. Forwarding to QA for test design.

  ---ORCHESTRIX-HANDOFF-BEGIN---
  target: qa
  command: test-design
  args: {story_id}
  ---ORCHESTRIX-HANDOFF-END---

  🎯 HANDOFF TO qa: *test-design {story_id}
  ```
  **HALT: Review completed, QA handoff sent ✋**

- **If status in ["InProgress", "Review", "Done"]**:
  ```
  ℹ️ STORY ALREADY IN DEV/QA WORKFLOW
  Story: {story_id}
  Status: {current_status}

  Story has passed Architect review and is now in development workflow.

  💡 TIP: Story is beyond review stage. No action needed.

  (No HANDOFF - story in later stages)
  ```
  **HALT: Story beyond review stage ✅**

- **If status = "Blocked"**:
  ```
  ⚠️ STORY BLOCKED
  Story: {story_id}
  Status: Blocked

  Story is blocked. SM needs to resolve blockers first.

  Next action: SM must fix blockers via *correct-course {story_id}

  (No HANDOFF - waiting for SM)
  ```
  **HALT: Story blocked ⛔**

**If status in ["Draft", "AwaitingArchReview", "RequiresRevision"]**:
- ✅ Log: "Idempotency check passed - proceeding with review"
- Continue to Execution Steps

---

### Execution Steps:
1. Load story file from docs/stories/
2. **Execute `utils/load-architecture-context.md`** to load architecture documents
3. Validate all technical components against `architecture_context`
4. Calculate technical accuracy score (0-10 scale)
5. Determine next status using decision system
6. Update story Status field with new status
7. Save Architect Review Results to story file

### Requirements:
- ✅ Load all relevant architecture documents for story type
- ✅ Validate tech stack, naming, structure, API, data model compliance
- ✅ Generate technical accuracy score (≥7/10 to pass)
- ✅ Identify critical/major/minor issues with specific locations
- ✅ Provide actionable recommendations
- ✅ Check test design level from Story metadata
- ✅ Determine next status via make-decision.md (Step 5)
- ✅ Validate status transition via validate-status-transition.md (Step 6)
- ✅ Update Story.status field directly (Step 6)
- ✅ Verify status update successful (Step 6)

### Halt Conditions (ONLY when review cannot proceed):
- ❌ Story file not found or cannot be read
- ❌ Story completely malformed (unparseable, no structure)

### Record as Issues (DO NOT Halt):
- ⚠️ Architecture documents missing → Continue with available docs, flag as Major Issue
- ⚠️ Story incomplete or missing sections → Record as Critical Issue, set RequiresRevision
- ⚠️ Missing entities/dependencies → Record as Major Issue, set RequiresRevision
- ⚠️ Outdated references → Record as Major Issue, set RequiresRevision
- ⚠️ Technical conflicts → Record with appropriate severity, decide status based on score

---

## Architecture Context Loading

**CRITICAL**: Use the standardized architecture loading utility. NEVER hardcode paths.

### Step 2: Load Architecture Context

Execute `{root}/tasks/util-load-architecture-context.md`:

```yaml
input:
  story_type: {{detected_story_type}}  # Backend | Frontend | FullStack
```

**Story Type Detection**:
- Analyze story content and Dev Notes
- Backend: API endpoints, database, services mentioned
- Frontend: UI components, pages, user interactions mentioned
- FullStack: Both backend and frontend elements present

**Documents Loaded by Story Type**:
```yaml
# The utility loads different documents based on story_type
architecture_loading:
  base_documents:  # Always loaded
    - *tech-stack.md
    - *source-tree.md
    - *coding-standards.md
    - *testing-strategy.md

  backend_additional:  # Loaded for Backend/FullStack stories
    - *data-models.md
    - *database-schema.md
    - *backend-architecture.md
    - *rest-api-spec.md
    - *external-apis.md

  frontend_additional:  # Loaded for Frontend/FullStack stories
    - *frontend-architecture.md
    - *components.md
    - *core-workflows.md
    - *data-models.md
```

**Expected Output** (stored as `architecture_context`):
```yaml
context:
  status: success | partial | error
  story_type: Backend | Frontend | FullStack
  architecture_mode: sharded | monolithic

  documents_loaded:
    - tech-stack.md
    - source-tree.md
    - coding-standards.md
    - testing-strategy.md
    # + type-specific documents

  documents_missing: []  # Any documents that could not be loaded

  tech_stack: { ... }
  file_structure: { ... }
  standards: { ... }
  testing: { ... }
  backend: { ... }   # If Backend/FullStack
  frontend: { ... }  # If Frontend/FullStack
```

**Error Handling**:
- If `context.status = "error"`: Record as Major Issue, continue with available info
- If `context.status = "partial"`: Log missing docs, continue with loaded context
- If `context.status = "success"`: Proceed with full context

### Technical Validation Engine:
```yaml
# Comprehensive technical compliance checking using architecture_context
validation_engine:
  tech_stack_compliance:
    - Verify all technologies mentioned exist in architecture_context.tech_stack
    - Check version compatibility and constraints
    - Validate library/framework usage patterns

  naming_conventions:
    - Component names follow architecture_context.standards.naming_conventions
    - File paths align with architecture_context.file_structure
    - Variable/method names follow established patterns

  architecture_patterns:
    - Backend: Validate against architecture_context.backend patterns
    - Frontend: Check architecture_context.frontend compliance
    - Integration: Verify workflow alignment

  api_data_consistency:
    - API endpoints follow architecture_context.backend.api_endpoints patterns
    - Data models align with architecture_context.backend.data_models definitions
    - Database interactions match architecture_context.backend.database_schema
```

## Quality Scoring System

```yaml
# Technical accuracy scoring (10-point scale)
scoring_criteria:
  tech_stack_compliance: 1 point (all technologies valid and current)
  naming_convention_adherence: 1 point (follows coding standards)
  project_structure_alignment: 1 point (correct file paths/locations)
  api_design_consistency: 1 point (follows established API patterns)
  data_model_accuracy: 1 point (aligns with data model definitions)
  architecture_pattern_compliance: 1 point (follows architectural patterns)
  complete_dependency_mapping: 1 point (all dependencies identified)
  integration_feasibility: 1 point (realistic integration approach)
  accurate_documentation_references: 1 point (valid source citations)
  overall_implementation_feasibility: 1 point (story can be implemented)
  
scoring_thresholds:
  pass: ≥7/10 (story approved for development)
  conditional: 5-6/10 (minor fixes required)
  fail: <5/10 (major revision required)
```

---

## 🔧 EXECUTION LOGIC

## Story Analysis Process
```yaml
# Comprehensive story technical analysis
story_analysis:
  1. Load and parse story file structure
  2. Extract all technical components from:
     - Story description
     - Acceptance Criteria  
     - Tasks/Subtasks
     - Dev Notes (especially Technical Preferences Summary)
  3. Identify story type (Backend/Frontend/Full-stack)
  4. Map technical dependencies and integrations
  5. Validate against loaded architecture documents
```

## Technical Compliance Check
```yaml
# Systematic validation against architecture_context
compliance_checking:
  tech_stack_validation:
    - Cross-reference mentioned technologies with architecture_context.tech_stack
    - Verify version compatibility
    - Check for deprecated or unsupported technologies

  structure_validation:
    - Validate file paths against architecture_context.file_structure
    - Check component naming conventions from architecture_context.standards
    - Verify test file locations per architecture_context.testing

  pattern_validation:
    - Backend: Check service/controller/model patterns from architecture_context.backend
    - Frontend: Validate component/hook/service patterns from architecture_context.frontend
    - API: Verify endpoint structure and response formats
    - Data: Check model definitions and relationships
```

## API Contract Validation (Multi-Repo Only)

**Execute if**: `project.mode = 'multi-repo'` AND `role ∈ {backend, frontend, ios, android}`

**For Backend** (provides_apis):
- Verify each endpoint exists in api-contracts.md
- Validate request/response schemas match contract
- Verify error handling (401/400/500) mentioned
- Validate security requirements (auth, rate limiting)

**For Frontend/Mobile** (consumes_apis):
- Verify endpoints exist in api-contracts.md
- Verify request payload and response handling mentioned
- Check cross-repo dependencies resolved

**Scoring**: Multi-repo uses 11-point scale (adds API contract compliance), passing ≥8/11 (~73%)

## Issue Classification

```yaml
# Issue severity classification
issue_classification:
  critical_issues: (blocking - must fix before approval)
    - Incompatible technology versions
    - Impossible technical requirements
    - Major architectural pattern violations
    - Story fundamentally incomplete (missing all ACs or Tasks)

  major_issues: (must fix, but can complete review)
    - Missing entities/dependencies (e.g., User entity not defined)
    - Non-existent architecture references (e.g., referencing missing docs)
    - Missing important dependencies or integrations
    - Naming convention violations
    - Suboptimal architecture patterns
    - Incomplete integration specifications
    - Outdated references to architecture sections

  minor_issues: (recommend fixing)
    - Style guide variations
    - Optional optimizations
    - Documentation improvements
    - Performance considerations
```

**IMPORTANT**: Missing entities, dependencies, or architecture references should be recorded as Major Issues and reported in the review. The Architect should COMPLETE the review, calculate a score (which will be lower due to issues), and set status to RequiresRevision. NEVER halt the review process for these issues.

### Test Design Level Check:
```yaml
# Check test design level to determine correct status transition
test_design_routing:
  1. Read Story's QA Test Design Metadata section
  2. Extract test_design_level field (Simple/Standard/Comprehensive)
  3. If review passes (score ≥7 AND no critical issues):
     - If test_design_level = Simple: Set Status to Approved
     - If test_design_level ∈ {Standard, Comprehensive}: Set Status to AwaitingTestDesign
  4. If review fails: Set Status to RequiresRevision or Escalated
```

## Report Generation
```yaml
# Structured technical review report generation
report_generation:
  overall_assessment:
    - Technical Accuracy Score: X/10
    - Pass/Fail Recommendation
    - Test Design Level: Simple/Standard/Comprehensive
    - Status Decision: AwaitingTestDesign/Approved/Requires_Revision/Blocked

  detailed_analysis:
    - Technical Compliance breakdown (5 sub-scores)
    - Architecture Alignment assessment (3 sub-scores)
    - Implementation Feasibility evaluation (2 sub-scores)

  actionable_feedback:
    - Critical issues with exact locations
    - Major issues with recommended solutions
    - Minor issues with optional improvements
    - Next steps for appropriate agent (QA/Dev/SM)
```

---

## Story Status Update (CRITICAL - DO NOT SKIP)

**Execute AFTER report generation, BEFORE saving outputs**

### Step 5: Determine Next Status

Execute `{root}/tasks/make-decision.md`:

```yaml
decision_type: architect-review-result
context:
  review_score: {{technical_accuracy_score}}
  critical_issues_count: {{critical_count}}
  test_design_level: {{test_design_level from Story metadata}}
  review_round: {{current_round}}
result:
  next_status: (AwaitingTestDesign | Approved | RequiresRevision | Escalated)
  next_agent: (qa | dev | sm | architect)
  handoff_action: (test-design | develop-story | revise-story | escalate)
```

### Step 6: Update Story Status Field

**CRITICAL**: This step updates the actual Story.status field, not just metadata.

Execute `{root}/tasks/util-validate-agent-action.md`:

```yaml
agent_id: architect
story_path: {{story_file_path}}
action: update_status
target_status: {{next_status from Step 5}}
```

**On validation PASS**:

1. **Update Story.status field directly**:
   - Find the Story metadata YAML block
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
- Do NOT proceed to save outputs
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

---

## Validation Checkpoints

### Pre-Review Validation:
```bash
✓ Story file exists and is readable
✓ Story has required sections (Status, Story, AC, Tasks, Dev Notes)
✓ Architecture context loaded via load-architecture-context.md
✓ Story type can be determined from content
```

### During Review Validation:
```bash
✓ All mentioned technologies found in architecture_context.tech_stack
✓ File paths align with architecture_context.file_structure
✓ API patterns follow architecture_context.backend.api_endpoints
✓ Data models match architecture_context.backend.data_models
✓ Integration approaches are feasible
```

### Post-Review Validation:
```bash
✓ Technical accuracy score calculated correctly
✓ All issues classified and documented with locations
✓ Recommendations are specific and actionable
✓ Next status determined via decision system (Step 5)
✓ Status transition validated via validate-status-transition.md (Step 6)
✓ Story.status field updated and verified (Step 6)
✓ Architect Review Results saved to story file (Step 7)
```

---

## 📊 OUTPUT FILES

### Output 1: Story Status Update (MUST be done first)

**CRITICAL**: Update Story.status BEFORE generating other outputs.

**Update Story field**: `Story.status = {{next_status}}`

**Verify**:
- Re-read Story file
- Confirm status field shows {{next_status}}
- If verification fails: HALT

### Output 2: Update Story - Architect Review Results (SM Readable Format)

Update or create `## Architect Review Results` section in Story. This section is read by SM when story requires revision.

```markdown
## Architect Review Results

### Review Date: {{review_date}}
### Reviewed By: {{reviewer_name}}
### Architecture Score: {{score}}/10
### Review Round: {{review_round}}

### Decision: {{decision}}

### Issues

#### Critical Issues ({{critical_count}})
{{#each critical_issues}}
- **{{title}}** ({{location}}): {{description}}
  - Fix: {{fix}}
{{/each}}

#### High Issues ({{major_count}})
{{#each major_issues}}
- **{{title}}** ({{location}}): {{description}}
  - Fix: {{fix}}
{{/each}}

#### Medium Issues ({{medium_count}})
{{#each medium_issues}}
- **{{title}}** ({{location}}): {{description}}
  - Recommendation: {{recommendation}}
{{/each}}

#### Low Issues ({{minor_count}})
{{#each minor_issues}}
- {{title}} ({{location}}): {{suggestion}}
{{/each}}

### Recommendations
{{#each recommendations}}
- {{item}}
{{/each}}
```

**Notes**:
- If section exists, replace it entirely with updated values
- This is the primary data source for SM's `revise-story-from-architect-feedback.md` task
- No separate report file generated (all info is in Story)

**Update Story section**: `Change Log`

Add entry:
```
| {{date}} {{time}} | Architect | AwaitingArchReview → {{next_status}} | Score: {{score}}/10, {{critical_count}} critical / {{major_count}} major issues |
```

### Output 3: Handoff Message and Skill Execution (REQUIRED)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST complete BOTH sub-steps:
1. Output human-readable handoff message
2. Execute the handoff skill

---

### Step 3.1: Output Human-Readable Handoff Message

Based on decision, output ONE of the following messages:

#### If Approved + Test Design Needed:
```
✅ ARCHITECT REVIEW COMPLETE
Story: {story_id} → Status: AwaitingTestDesign
Score: {score}/10 | Test Design: {test_design_level}

🎯 HANDOFF TO qa: *test-design {story_id}
```

#### If Approved + No Test Design (Simple):
```
✅ ARCHITECT REVIEW COMPLETE
Story: {story_id} → Status: Approved
Score: {score}/10 | Ready for Dev

🎯 HANDOFF TO dev: *develop-story {story_id}
```

#### If Requires Revision:
```
⚠️ ARCHITECT REVIEW - REVISION REQUIRED
Story: {story_id} → Status: RequiresRevision
Score: {score}/10 | Critical: {critical_count} | Major: {major_count}

🎯 HANDOFF TO sm: *revise-story {story_id}
```

#### If Escalated:
```
🚨 ESCALATED TO SENIOR ARCHITECT
Story: {story_id} → Status: Escalated
Reason: {escalation_reason}

⚠️ Requires human intervention (No automated handoff)
```

---

### Step 3.2: Execute Handoff Skill (MANDATORY - tmux Automation)

**CRITICAL**: After outputting the message above, you MUST invoke the `handoff` skill (except for Escalated status).

**USE the `handoff` skill** with parameters based on decision:

| Decision | Target Agent | Command |
|----------|--------------|---------|
| Approved + Test Design | qa | `*test-design {story_id}` |
| Approved + Simple | dev | `*develop-story {story_id}` |
| Requires Revision | sm | `*revise-story {story_id}` |
| Escalated | (none) | No skill execution - human intervention |

The skill will automatically:
1. Send the command to target agent's tmux window
2. Clear your current context
3. Reload your agent for the next task

**STOP**: After skill execution completes, your response is complete. No additional output.

---

## 🔄 ERROR HANDLING & FALLBACK

### Handling Common Issues (DO NOT Halt)

```yaml
error_handling:
  missing_architecture_docs:
    detection: Required architecture file not found
    action: Continue review with available docs
    report: Add as Major Issue - "Architecture documentation incomplete"
    impact: Lower architecture_score, flag for SM to complete docs

  missing_entities_dependencies:
    detection: Story references entities/models that don't exist (e.g., User entity)
    action: Complete review, record all missing references
    report: Add as Major Issue - "Missing entity definition: {entity_name}"
    impact: Lower data_model_score, set status RequiresRevision
    severity: Major

  outdated_references:
    detection: Story references non-existent architecture sections
    action: Record specific missing sections
    report: Add as Major Issue - "References outdated section: {section_name}"
    impact: Lower documentation_score
    severity: Major

  ambiguous_story_type:
    detection: Cannot determine Backend/Frontend/Full-stack
    action: Load all architecture documents as safety measure
    report: Add as Minor Issue - "Story type unclear, please specify"
    impact: Minimal, request clarification

  incomplete_story_sections:
    detection: Missing ACs, Tasks, or Dev Notes
    action: Complete review, identify all missing sections
    report: Add as Critical Issue - "Missing required section: {section_name}"
    impact: Lower completeness_score significantly
    severity: Critical
```

### Fallback Strategy:
- **Missing Architecture Docs**: Continue with available docs, note gaps as Major Issues
- **Missing Dependencies**: Record all missing items, complete review, set RequiresRevision
- **Scoring with Issues**: Lower score based on severity (Critical: -2pts, Major: -1pt, Minor: -0.5pt)
- **Complex Integrations**: Flag for additional manual review but still complete current review
- **Uncertainty**: Use conservative scoring, document assumptions

### When to Actually Halt:
1. **Story file not found**: Cannot review what doesn't exist
2. **Completely unparseable**: File is corrupted or not markdown
3. **No identifiable structure**: Cannot extract any sections

**Everything else**: Complete the review, record issues, calculate score, set appropriate status.

### Example: Handling Missing Entity

**Scenario**: Story references "User entity" but it's not defined in data-models.md

**WRONG Approach** ❌:
```
Error: User entity not found in architecture
HALT review process
Return error to user
```

**CORRECT Approach** ✅:
```
1. Continue review of all other aspects
2. Record issue:
   - Type: Major Issue
   - Title: "Missing entity definition: User"
   - Description: "Story references User entity in AC2 and Task 3.1, but User entity is not defined in data-models.md"
   - Location: "AC2, Task 3.1"
   - Impact: "Cannot validate data model compliance"
   - Recommendation: "SM should define User entity in data-models.md or remove references"
3. Lower data_model_score by 1 point (missing entity)
4. Complete full review, generate report
5. Calculate final score (e.g., 6.5/10 due to missing entity)
6. Set status: RequiresRevision
7. Handoff: "SM please execute 'revise-story {id}' - Missing entity definitions"
```

---

## 🎯 SUCCESS CRITERIA

### Review Success Indicators:
- ✅ Technical accuracy score generated with justification
- ✅ All architecture compliance checks completed
- ✅ Issues classified with specific locations and recommendations
- ✅ Next status determined via make-decision.md (Step 5)
- ✅ Status transition validated (Step 6)
- ✅ **Story.status field updated and verified** (Step 6 - CRITICAL)
- ✅ Architect Review Results updated in Story (Output 2)
- ✅ Actionable feedback provided for next agent
- ✅ Handoff message with correct next action (Output 3)

### Quality Gates:
- **Score ≥7/10 + Test Design Level = Simple**: Approve for development (Status = Approved)
- **Score ≥7/10 + Test Design Level ∈ {Standard, Comprehensive}**: Transition to QA test design (Status = AwaitingTestDesign)
- **Score 5-6/10**: Requires minor fixes, conditional pass  
- **Score <5/10**: Major revision required, blocked status
- **Zero Critical Issues**: No architectural violations or impossible requirements
- **Complete Analysis**: All story components reviewed against relevant architecture

**Fallback Reference**: Use detailed `review-story-technical-accuracy.md` for complex edge cases or manual override situations.