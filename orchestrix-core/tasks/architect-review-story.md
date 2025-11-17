# Architect Review Story - Technical Accuracy

## Mission

Conduct comprehensive technical accuracy review of SM-created story against architecture standards.

### Execution Steps:
1. Load story file from docs/stories/
2. Load relevant architecture documents based on story type
3. Validate all technical components against architecture
4. Calculate technical accuracy score (0-10 scale)
5. Generate detailed review report
6. Update story status based on review results
7. Save results to story file and external report

### Requirements:
- ✅ Load all relevant architecture documents for story type
- ✅ Validate tech stack, naming, structure, API, data model compliance
- ✅ Generate technical accuracy score (≥7/10 to pass)
- ✅ Identify critical/major/minor issues with specific locations
- ✅ Provide actionable recommendations
- ✅ Check test design level from Story metadata
- ✅ Update story status appropriately (AwaitingTestDesign/Approved/RequiresRevision/Escalated)

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
```yaml
# Smart architecture document loading based on story type
architecture_loading:
  base_documents: 
    - docs/architecture/tech-stack.md
    - docs/architecture/source-tree.md  
    - docs/architecture/coding-standards.md
    - docs/architecture/testing-strategy.md
    
  backend_additional:
    - docs/architecture/data-models.md
    - docs/architecture/database-schema.md
    - docs/architecture/backend-architecture.md
    - docs/architecture/rest-api-spec.md
    - docs/architecture/external-apis.md
    
  frontend_additional:
    - docs/architecture/frontend-architecture.md
    - docs/architecture/components.md
    - docs/architecture/core-workflows.md
    - docs/architecture/data-models.md
    
  story_type_detection: Detect from story content and Dev Notes
```

### Technical Validation Engine:
```yaml
# Comprehensive technical compliance checking
validation_engine:
  tech_stack_compliance: 
    - Verify all technologies mentioned exist in tech-stack.md
    - Check version compatibility and constraints
    - Validate library/framework usage patterns
    
  naming_conventions:
    - Component names follow coding-standards.md
    - File paths align with source-tree.md  
    - Variable/method names follow established patterns
    
  architecture_patterns:
    - Backend: Validate against backend-architecture.md patterns
    - Frontend: Check frontend-architecture.md compliance
    - Integration: Verify core-workflows.md alignment
    
  api_data_consistency:
    - API endpoints follow rest-api-spec.md patterns
    - Data models align with data-models.md definitions
    - Database interactions match database-schema.md
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
# Systematic validation against architecture standards
compliance_checking:
  tech_stack_validation:
    - Cross-reference mentioned technologies with tech-stack.md
    - Verify version compatibility
    - Check for deprecated or unsupported technologies
    
  structure_validation:
    - Validate file paths against source-tree.md
    - Check component naming conventions from coding-standards.md
    - Verify test file locations per testing-strategy.md
    
  pattern_validation:
    - Backend: Check service/controller/model patterns
    - Frontend: Validate component/hook/service patterns
    - API: Verify endpoint structure and response formats
    - Data: Check model definitions and relationships
```

## API Contract Validation (Multi-Repo Only)

```yaml
# Multi-repository API contract compliance checking
# Only execute if project.mode = multi-repo AND role ∈ {backend, frontend, ios, android}

api_contract_validation:
  enabled_when: project.mode = 'multi-repo' AND project.multi_repo.role IN ['backend', 'frontend', 'ios', 'android']

  initialization:
    - Load core-config.yaml and check project.mode and project.multi_repo.role
    - If project.mode = 'single-repo': SKIP this validation
    - If project.multi_repo.role = 'product': SKIP this validation
    - If multi-repo implementation: Load story's epic YAML to get provides_apis/consumes_apis
    - Load api-contracts.md from product repo (if exists)

  for_backend_stories:
    # Stories with provides_apis field
    validation_steps:
      1. Extract provides_apis list from story's epic definition
         Example: ["POST /api/users", "GET /api/users/:id"]

      2. For each API endpoint:
         a. Verify endpoint exists in api-contracts.md
            - If not found: CRITICAL ISSUE
            - "API endpoint not documented in api-contracts.md"

         b. Validate Request Schema:
            - Load request schema from api-contracts.md
            - Check story Dev Notes for request structure
            - Verify all required fields present
            - Verify field types match
            - If mismatch: MAJOR ISSUE with details

         c. Validate Response Schema:
            - Load success response schema from api-contracts.md
            - Check story Dev Notes for response structure
            - Verify response structure matches
            - If mismatch: MAJOR ISSUE with details

         d. Validate Error Handling:
            - Load error responses from api-contracts.md
            - Verify story mentions handling all error cases
            - If missing: MAJOR ISSUE listing missing error codes

         e. Validate Security Requirements:
            - Check if api-contracts.md specifies auth requirements
            - Verify story mentions authentication implementation
            - Check rate limiting if specified
            - If missing: CRITICAL ISSUE

  for_frontend_mobile_stories:
    # Stories with consumes_apis field
    validation_steps:
      1. Extract consumes_apis list from story's epic definition

      2. For each API endpoint:
         a. Verify endpoint exists in api-contracts.md
            - If not found: CRITICAL ISSUE

         b. Check Request Payload Handling:
            - Verify story mentions sending correct request structure
            - If mismatch or missing: MAJOR ISSUE

         c. Check Response Handling:
            - Verify story mentions handling success response
            - Verify story mentions handling all error codes
            - If incomplete: MAJOR ISSUE "Incomplete error handling"

         d. Validate Cross-Repo Dependencies:
            - Load story dependencies from epic YAML
            - For dependencies in different repo: Add NOTE
            - "Cross-repo dependency: Story X in repo Y"
            - "⚠️ Verify Story X is completed before starting"

  scoring_impact:
    # For multi-repo projects: 11-point scale (adds API contract compliance)
    # For monolith: 10-point scale (existing)
    api_contract_compliance_score:
      weight: 1 point (only for multi-repo)
      calculation:
        - All APIs match contracts: 1 point
        - Minor mismatches (naming): 0.5 points
        - Major mismatches (missing fields, wrong types): 0 points

      passing_threshold:
        - Multi-repo: ≥8/11 (~73%)
        - Monolith: ≥7/10 (70%)
```

**Example API Contract Issue (Backend Story)**:
```markdown
### Major Issue: Response Schema Mismatch

**Location**: Dev Notes - Technical Approach

**Problem**:
Story plans to return:
```json
{
  "userId": "123",
  "userEmail": "user@example.com"
}
```

But api-contracts.md specifies:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "timestamp"
}
```

**Missing fields**: `id` (should be UUID not number), `created_at`
**Extra/Wrong fields**: `userId`, `userEmail` (wrong naming)

**Recommendation**:
Update story to follow exact schema from api-contracts.md Section 2.1.
Use `id` (UUID) instead of `userId` (number).
Add `created_at` timestamp field.
```

**Example API Contract Issue (Frontend Story)**:
```markdown
### Major Issue: Incomplete Error Handling

**Location**: Acceptance Criteria

**Problem**:
Story only mentions handling success case (200 OK).

API contract specifies error responses:
- 401 Unauthorized (invalid credentials)
- 400 Bad Request (validation errors)
- 500 Internal Server Error

**Missing**:
- No mention of displaying error messages to user
- No handling of 401 (should redirect to login)
- No handling of 400 (should show validation errors)

**Recommendation**:
Add acceptance criteria:
- AC4: Display validation errors from 400 response
- AC5: Redirect to login page on 401 response
- AC6: Show generic error message on 500 response
```

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

## Validation Checkpoints

### Pre-Review Validation:
```bash
✓ Story file exists and is readable
✓ Story has required sections (Status, Story, AC, Tasks, Dev Notes)
✓ Architecture documents are accessible
✓ Story type can be determined from content
```

### During Review Validation:
```bash  
✓ All mentioned technologies found in tech-stack.md
✓ File paths align with project structure standards
✓ API patterns follow established specifications  
✓ Data models match architecture definitions
✓ Integration approaches are feasible
```

### Post-Review Validation:
```bash
✓ Technical accuracy score calculated correctly
✓ All issues classified and documented with locations
✓ Recommendations are specific and actionable
✓ Story status updated based on review results
✓ Report saved to story file or separate review document
```

---

## 📊 OUTPUT FILES

### Output 1: Detailed Review Report

**Save to**: `{architect.storyReviewsLocation}/{story_id}-arch-review-r{review_round}.md`

Use template: `{root}/templates/architect-review-tmpl.yaml`

**Include**:
- Complete technical analysis
- All issues (Critical, Major, Minor) with details
- Architecture guidance and recommendations
- Metadata (review duration, docs reviewed, etc.)

### Output 2: Update Story File

**Update Story section**: `Architect Review Metadata`

```yaml
review_round: {{current_round}}
total_reviews_conducted: {{total_count}}
review_history:
  - round: {{current_round}}
    date: {{review_date}}
    reviewer: {{reviewer_id}}
    score: {{review_score}}
    decision: {{decision}}
    critical_issues: {{critical_count}}
    key_findings: {{brief_summary}}
```

**Update Story section**: `Architect Review Summary`

```markdown
- **Total Reviews**: {{total_reviews}}
- **Latest Review**: {{latest_review_date}}
- **Latest Score**: {{latest_score}}/10
- **Latest Decision**: {{latest_decision}}
- **Critical Issues (Latest)**: {{latest_critical_count}}

### Review Documents
- Round {{round}}: [Arch Review R{{round}}](docs/architecture/story-reviews/{{story_id}}-arch-review-r{{round}}.md) - Score: {{score}}/10 - Decision: {{decision}} - {{date}}
```

**Update Story section**: `Change Log`

Add entry:
```
| {{date}} {{time}} | Architect | AwaitingArchReview → {{next_status}} | Score: {{score}}/10, {{critical_count}} critical issues [Review R{{round}}](docs/architecture/story-reviews/{{story_id}}-arch-review-r{{round}}.md) |
```

**Update Story**: `Status` field to {{next_status}}

### Output 3: Handoff Message (REQUIRED - MUST BE FINAL OUTPUT)

Based on decision, output the appropriate handoff using exact format:

#### If Approved + Test Design Needed:
```
✅ ARCHITECT REVIEW COMPLETE
Story: {story_id} → Status: AwaitingTestDesign
Score: {score}/10 | Decision: Approved
Test Design Level: {test_design_level}

Review: docs/architecture/story-reviews/{story_id}-arch-review-r{round}.md

🎯 HANDOFF TO qa: *test-design {story_id}
```

#### If Approved + No Test Design (Simple):
```
✅ ARCHITECT REVIEW COMPLETE
Story: {story_id} → Status: Approved
Score: {score}/10 | Decision: Approved

Review: docs/architecture/story-reviews/{story_id}-arch-review-r{round}.md

🎯 HANDOFF TO dev: *develop-story {story_id}
```

#### If Requires Revision:
```
⚠️ ARCHITECT REVIEW COMPLETE - REVISION REQUIRED
Story: {story_id} → Status: RequiresRevision
Score: {score}/10 | Critical: {critical_count} | Major: {major_count}

Review: docs/architecture/story-reviews/{story_id}-arch-review-r{round}.md

🎯 HANDOFF TO sm: *revise-story {story_id}
```

#### If Escalated:
```
🚨 ESCALATED TO SENIOR ARCHITECT
Story: {story_id} → Status: Escalated
Reason: {escalation_reason}

Review: docs/architecture/story-reviews/{story_id}-arch-review-r{round}.md

⚠️ Requires human intervention
```

**CRITICAL**: The handoff command (e.g., `*test-design {story_id}`) MUST be clearly visible as the final line of your output.

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
- ✅ Story status updated appropriately (AwaitingTestDesign/Approved/Requires_Revision/Blocked)
- ✅ Actionable feedback provided for next agent

### Quality Gates:
- **Score ≥7/10 + Test Design Level = Simple**: Approve for development (Status = Approved)
- **Score ≥7/10 + Test Design Level ∈ {Standard, Comprehensive}**: Transition to QA test design (Status = AwaitingTestDesign)
- **Score 5-6/10**: Requires minor fixes, conditional pass  
- **Score <5/10**: Major revision required, blocked status
- **Zero Critical Issues**: No architectural violations or impossible requirements
- **Complete Analysis**: All story components reviewed against relevant architecture

**Fallback Reference**: Use detailed `review-story-technical-accuracy.md` for complex edge cases or manual override situations.