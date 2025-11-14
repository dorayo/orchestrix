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

### Halt Conditions:
- ❌ Story file not found
- ❌ Required architecture documents missing
- ❌ Story malformed or incomplete

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

## Issue Classification

```yaml
# Issue severity classification
issue_classification:
  critical_issues: (blocking - must fix)
    - Incompatible technology versions
    - Non-existent architecture references
    - Impossible technical requirements
    - Major architectural pattern violations
    
  major_issues: (should fix)
    - Naming convention violations
    - Missing important dependencies
    - Suboptimal architecture patterns
    - Incomplete integration specifications
    
  minor_issues: (consider fixing)
    - Style guide variations
    - Optional optimizations
    - Documentation improvements
    - Performance considerations
```

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

### Output 3: Handoff Message

Based on decision:
- **Approved**: "Next: {{#if test_design_needed}}QA please execute command `test-design {story_id}`{{else}}Dev please execute command `implement-story {story_id}`{{/if}}"
- **RequiresRevision**: "Next: SM please execute command `revise-story {story_id}` - {{critical_count}} critical, {{major_count}} major issues"
- **Escalated**: "Story escalated - requires senior architect/human intervention"

---

## 🔄 ERROR HANDLING & FALLBACK

### Common Issues Resolution:
```yaml
error_handling:
  missing_architecture_docs:
    detection: Required architecture file not found
    action: Note missing context, continue with available docs
    report: Flag architecture completeness issue
    
  outdated_references:
    detection: Story references non-existent architecture sections
    action: Mark as documentation reference error
    severity: Major issue requiring SM Agent fix
    
  ambiguous_story_type:
    detection: Cannot determine Backend/Frontend/Full-stack
    action: Load all architecture documents as safety measure
    report: Request story type clarification
```

### Quality Assurance Fallback:
- **Insufficient Architecture**: Continue review with available docs, flag completeness
- **Scoring Edge Cases**: Use conservative scoring, document uncertainty
- **Complex Integrations**: Flag for manual architect review if complexity is high
- **Template Compliance**: Verify story follows story-tmpl.yaml structure

### Manual Override Options:
- **Complex Stories**: Flag for detailed manual review when analysis is insufficient
- **Architecture Updates**: Recommend manual architect review if architecture changes needed
- **Integration Complexity**: Escalate stories with complex cross-system integrations

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