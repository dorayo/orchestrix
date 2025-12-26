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

  Next action: SM must fix blockers via *revise {story_id}

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
5. **Determine test design level** (use existing or calculate dynamically)
6. Determine next status using decision system
7. Update story Status field with new status
8. Save Architect Review Results to story file

### Requirements:
- ✅ Load all relevant architecture documents for story type
- ✅ Validate tech stack, naming, structure, API, data model compliance
- ✅ Generate technical accuracy score (≥7/10 to pass)
- ✅ Identify critical/major/minor issues with specific locations
- ✅ Provide actionable recommendations
- ✅ Determine test design level (use existing OR calculate dynamically) (Step 5)
- ✅ Determine next status via make-decision.md (Step 6)
- ✅ Validate status transition via validate-status-transition.md (Step 7)
- ✅ Update Story.status field directly (Step 7)
- ✅ Verify status update successful (Step 7)

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

**IMPORTANT**: This utility automatically:
- Reads `core-config.yaml` for architecture configuration
- Uses **Glob tool first** to match files with any prefix (e.g., `3-tech-stack.md`, `12-coding-standards.md`)
- Handles both sharded and monolithic architecture modes
- Returns structured `architecture_context` with tech_stack, standards, file_structure, etc.

**DO NOT** directly read files like `docs/architecture/tech-stack.md` or `docs/architecture/coding-standards.md` - use the utility which handles file discovery correctly.

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

### Step 5: Determine Test Design Level

**Purpose**: Determine test design level to route correctly after review passes. This step bridges the gap for Stories created via `*apply-proposal` that bypass SM's quality assessment.

**Step A: Read Existing Test Design Level**

1. Read Story's "QA Test Design Metadata" section
2. Extract `test_design_level` field

**Step B: Calculate Test Design Level If Not Set**

**IF `test_design_level` is set (Simple/Standard/Comprehensive)**:
- Use existing value
- Skip to Step C

**ELSE (test_design_level not set or empty)**:

This happens when Story was created via `*apply-proposal` (skips SM quality assessment).

1. **Extract Complexity Indicators from Story Content**:

   Count the following indicators (0-8):
   ```yaml
   complexity_indicators:
     api_contract_changes: Story mentions new/modified API endpoints
     db_schema_modifications: Story mentions database schema changes
     new_arch_patterns: Story introduces new architectural patterns
     cross_service_deps: Story affects multiple services/modules
     security_operations: Story involves auth/authz/encryption/access control
     performance_critical: Story has explicit performance requirements
     core_doc_modifications: Story requires changes to core documentation
     data_sync_requirements: Story involves DB writes with cross-table sync needs
   ```

2. **Determine Security Sensitivity**:
   ```yaml
   security_sensitive: true
   IF Story involves any of:
     - Authentication/authorization logic
     - Encryption/decryption operations
     - Access control modifications
     - Sensitive data handling (PII, credentials, tokens)
     - Security audit logging
   ELSE:
     security_sensitive: false
   ```

3. **Map Review Score to Quality Score**:
   ```yaml
   quality_score: {{technical_accuracy_score}}  # Use Architect's review score (0-10)
   ```

4. **Execute Test Design Level Decision**:

   Execute `{root}/tasks/make-decision.md`:

   ```yaml
   decision_type: sm-test-design-level
   context:
     complexity_indicators: {{counted_indicators}}  # Number 0-8
     quality_score: {{technical_accuracy_score}}    # Number 0-10
     security_sensitive: {{is_security_sensitive}}  # Boolean
   ```

   **Decision Output**:
   ```yaml
   test_design_level: Simple | Standard | Comprehensive
   reasoning: "..."
   metadata:
     test_design_required: true | false
     test_levels: [unit, integration, e2e, security]
   ```

5. **Update Story Metadata**:

   Add or update "QA Test Design Metadata" section in Story:
   ```markdown
   ## QA Test Design Metadata

   | Field | Value |
   |-------|-------|
   | test_design_level | {{calculated_test_design_level}} |
   | complexity_indicators | {{counted_indicators}} |
   | security_sensitive | {{is_security_sensitive}} |
   | calculated_by | Architect (post-review) |
   | calculation_date | {{current_date}} |
   ```

**Step C: Apply Test Design Routing**

```yaml
test_design_routing:
  IF review passes (score ≥7 AND no critical issues):
    IF test_design_level == Simple:
      → Set Status to Approved
      → HANDOFF to Dev
    IF test_design_level ∈ {Standard, Comprehensive}:
      → Set Status to AwaitingTestDesign
      → HANDOFF to QA for test design

  IF review fails:
    → Set Status to RequiresRevision or Escalated
    → HANDOFF to SM
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

### Step 6: Determine Next Status

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

### Step 7: Update Story Status Field

**CRITICAL**: This step updates the actual Story.status field, not just metadata.

Execute `{root}/tasks/util-validate-agent-action.md`:

```yaml
agent_id: architect
story_path: {{story_file_path}}
action: update_status
target_status: {{next_status from Step 6}}
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
✓ Test design level determined (existing or calculated) (Step 5)
✓ Next status determined via decision system (Step 6)
✓ Status transition validated via validate-status-transition.md (Step 7)
✓ Story.status field updated and verified (Step 7)
✓ Architect Review Results saved to story file (Step 8)
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

### Output 3: Handoff Message (REQUIRED)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**🚨 CRITICAL - READ CAREFULLY 🚨**

You MUST output the HANDOFF message in the **EXACT FORMAT** shown below.
- The `🎯 HANDOFF TO` line is parsed by automation scripts
- Any deviation will break the automation pipeline
- Do NOT write "Handoff to...", "Next step:", or any other variant
- Do NOT add explanatory text before or after the handoff block

**OUTPUT EXACTLY ONE OF THESE BLOCKS** (copy format precisely):

Based on decision:

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

### ❌ PROHIBITED OUTPUT PATTERNS

You MUST NOT:
- Write "Handoff to SM" or "Handoff to Dev" (WRONG - use 🎯 HANDOFF TO)
- Write "Next Step:" or "Next step is..." (WRONG - use exact format above)
- Add explanatory paragraphs about the review
- Output a summary table after the handoff block
- Output anything after `🎯 HANDOFF TO` line

**🛑 STOP HERE**: The `🎯 HANDOFF TO` line must be your ABSOLUTE FINAL output.
Do not add ANY text after it. The automation hook handles the rest.

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
- ✅ Test design level determined (Step 5)
- ✅ Next status determined via make-decision.md (Step 6)
- ✅ Status transition validated (Step 7)
- ✅ **Story.status field updated and verified** (Step 7 - CRITICAL)
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