# Review Story Technical Accuracy (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code SubAgent Default)

**Mission**: Conduct comprehensive technical accuracy review of SM-created story, fully automated

### Immediate Action Protocol:
1. **Auto-Load Story**: Read specified story file from docs/stories/
2. **Auto-Load Architecture**: Load relevant architecture documents based on story type
3. **Auto-Analyze Technical**: Validate all technical components against architecture
4. **Auto-Score Quality**: Calculate technical accuracy score (1-10 scale)
5. **Auto-Generate Report**: Create detailed technical review report
6. **Auto-Update Status**: Set story status based on review results
7. **Auto-Save Results**: Update story file with review findings

### Non-Negotiable Requirements:
- ✅ MUST load all relevant architecture documents for story type
- ✅ MUST validate tech stack, naming, structure, API, data model compliance
- ✅ MUST generate technical accuracy score ≥7/10 to pass
- ✅ MUST identify critical/major/minor issues with specific locations
- ✅ MUST provide actionable recommendations for improvements
- ✅ MUST update story status to Approved/Requires_Revision/Blocked

### Auto-Halt Conditions:
- ❌ Story file not found → Report missing story, halt
- ❌ Architecture documents missing → Report incomplete architecture, halt
- ❌ Story malformed or incomplete → Report structure issues, halt

---

## 🎯 AUTOMATED INTELLIGENCE LAYER

### Architecture Context Auto-Loading:
```yaml
# Smart architecture document loading based on story type
architecture_loading:
  base_documents: 
    - docs/architecture/tech-stack.md
    - docs/architecture/unified-project-structure.md  
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
    
  story_type_detection: Auto-detect from story content and Dev Notes
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
    - File paths align with unified-project-structure.md  
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

### Quality Scoring System:
```yaml
# Automated technical accuracy scoring (10-point scale)
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

### Story Analysis Auto-Process:
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

### Technical Compliance Auto-Check:
```yaml
# Systematic validation against architecture standards
compliance_checking:
  tech_stack_validation:
    - Cross-reference mentioned technologies with tech-stack.md
    - Verify version compatibility
    - Check for deprecated or unsupported technologies
    
  structure_validation:
    - Validate file paths against unified-project-structure.md
    - Check component naming conventions from coding-standards.md
    - Verify test file locations per testing-strategy.md
    
  pattern_validation:
    - Backend: Check service/controller/model patterns
    - Frontend: Validate component/hook/service patterns  
    - API: Verify endpoint structure and response formats
    - Data: Check model definitions and relationships
```

### Issue Classification Auto-System:
```yaml
# Automatic issue severity classification
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

### Report Auto-Generation:
```yaml
# Structured technical review report generation
report_generation:
  overall_assessment:
    - Technical Accuracy Score: X/10
    - Pass/Fail Recommendation
    - Status Decision: Approved/Requires_Revision/Blocked
    
  detailed_analysis:
    - Technical Compliance breakdown (5 sub-scores)
    - Architecture Alignment assessment (3 sub-scores)
    - Implementation Feasibility evaluation (2 sub-scores)
    
  actionable_feedback:
    - Critical issues with exact locations
    - Major issues with recommended solutions
    - Minor issues with optional improvements
    - Next steps for SM Agent
```

---

## ⚡ AUTO-VALIDATION CHECKPOINTS

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

## 📊 AUTOMATED REPORTING FORMAT

### Technical Review Report Auto-Template:
```markdown
## Technical Accuracy Review Report

**Story ID**: {{story_id}}
**Review Date**: {{current_date}}
**Reviewer**: Architect Agent (Auto)
**Architecture Version**: {{architecture_version}}

### Overall Assessment
- **Technical Accuracy Score**: {{score}}/10
- **Recommendation**: {{PASS/CONDITIONAL_PASS/FAIL}}
- **Story Status**: {{Approved/Requires_Revision/Blocked}}

### Detailed Analysis

#### Technical Compliance ({{tech_score}}/5)
- Tech Stack: {{✅/❌}} {{details}}
- Naming Conventions: {{✅/❌}} {{details}}  
- Project Structure: {{✅/❌}} {{details}}
- API Design: {{✅/❌}} {{details}}
- Data Models: {{✅/❌}} {{details}}

#### Architecture Alignment ({{arch_score}}/3)
- Backend Patterns: {{✅/❌}} {{details}}
- Frontend Patterns: {{✅/❌}} {{details}}
- Integration Patterns: {{✅/❌}} {{details}}

#### Implementation Feasibility ({{impl_score}}/2)  
- Dependency Completeness: {{✅/❌}} {{details}}
- Technical Feasibility: {{✅/❌}} {{details}}

### Issues Identified

#### Critical Issues (Must Fix) - {{critical_count}}
{{auto_generated_critical_issues_list}}

#### Major Issues (Should Fix) - {{major_count}}
{{auto_generated_major_issues_list}}

#### Minor Issues (Consider) - {{minor_count}}  
{{auto_generated_minor_issues_list}}

### Auto-Generated Recommendations
{{specific_actionable_recommendations}}

### Next Steps
- {{auto_generated_next_steps_based_on_score}}
```

---

## 🔄 ERROR HANDLING & FALLBACK

### Common Issues Auto-Resolution:
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
- **Complex Integrations**: Flag for manual architect review if complexity exceeds auto-analysis
- **Template Compliance**: Verify story follows story-tmpl.yaml structure

### Manual Override Options:
- **Complex Stories**: Flag for detailed manual review when auto-analysis insufficient
- **Architecture Updates**: Recommend manual architect review if architecture changes needed
- **Integration Complexity**: Escalate stories with complex cross-system integrations

---

## 🎯 SUCCESS CRITERIA

### Auto-Review Success Indicators:
- ✅ Technical accuracy score generated with justification
- ✅ All architecture compliance checks completed
- ✅ Issues classified with specific locations and recommendations
- ✅ Story status updated appropriately (Approved/Requires_Revision/Blocked)
- ✅ Actionable feedback provided for SM Agent next steps

### Quality Gates:
- **Score ≥7/10**: Auto-approve for development
- **Score 5-6/10**: Requires minor fixes, conditional pass  
- **Score <5/10**: Major revision required, blocked status
- **Zero Critical Issues**: No architectural violations or impossible requirements
- **Complete Analysis**: All story components reviewed against relevant architecture

**Fallback Reference**: Use detailed `review-story-technical-accuracy.md` for complex edge cases or manual override situations.