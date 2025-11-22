# Create Next Story (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code SubAgent Default)

**Mission**: Create next comprehensive story from epic requirements, fully automated

### Immediate Action Protocol:
1. **Auto-Load Config**: Read `core-config.yaml` for project structure
2. **Auto-Identify Next**: Determine next story number from existing stories
3. **Auto-Extract Epic**: Load epic requirements from sharded PRD
4. **Auto-Gather Context**: Load relevant architecture documents  
5. **Auto-Generate Story**: Create complete story using story template
6. **Auto-Save**: Write to correct `docs/stories/{epic}.{story}.story.md` path
7. **Auto-Validate**: Confirm story structure and content completeness

### Non-Negotiable Requirements:
- ✅ MUST use story-tmpl.yaml template structure
- ✅ MUST save to template's specified filename pattern
- ✅ MUST populate ALL template sections with relevant content
- ✅ MUST include comprehensive Dev Notes for implementation
- ✅ MUST extract Technical Preferences Summary from architecture
- ✅ MUST create actionable Tasks/Subtasks list

### Auto-Halt Conditions:
- ❌ core-config.yaml not found → Report missing config, halt
- ❌ No epic files found → Report PRD sharding issue, halt  
- ❌ Previous story incomplete → Report status conflict, ask user decision
- ❌ Template loading failure → Report template error, halt

---

## 🎯 AUTOMATED INTELLIGENCE LAYER

### Story Identification Logic:
```yaml
# Smart story numbering
story_identification:
  scan_existing: Check docs/stories/ for highest {epic}.{story} numbers
  status_validation: Verify last story is 'Done' before proceeding
  next_calculation: Auto-calculate next sequential story number
  epic_completion_check: Detect when epic is complete, ask user for next epic
```

### Context Auto-Assembly:
```yaml
# Intelligent context gathering
context_assembly:
  epic_extraction: Extract story definition from docs/prd/epic-{n}*.md
  architecture_loading: 
    - ALWAYS: tech-stack.md, coding-standards.md, testing-strategy.md
    - Backend Stories: data-models.md, backend-architecture.md, rest-api-spec.md
    - Frontend Stories: frontend-architecture.md, components.md, core-workflows.md
    - Full-stack Stories: Load both Backend and Frontend contexts
  previous_story_insights: Extract lessons learned from previous story Dev Agent Records
```

### Story Content Generation:
```yaml
# Auto-populate story template
story_generation:
  status: "Draft" (always start as Draft)
  story_statement: Extract from epic As-a/I-want/So-that format
  acceptance_criteria: Copy numbered list from epic file
  tasks_subtasks: Generate detailed technical breakdown
  dev_notes: Comprehensive implementation guidance including:
    - Technical Preferences Summary with architecture references
    - Testing Standards and integrity rules
    - File locations and naming conventions
    - Specific implementation patterns to follow
```

### Quality Auto-Validation:
```bash
# Post-generation verification
✓ Story file created at correct docs/stories/ location
✓ All story template sections populated
✓ Dev Notes comprehensive enough for dev agent implementation  
✓ Technical Preferences Summary includes architecture source references
✓ Tasks/Subtasks actionable and linked to Acceptance Criteria
✓ Testing integrity rules properly documented
```

---

## 🔧 EXECUTION LOGIC

### Project Structure Auto-Detection:
```yaml
# Auto-load project configuration
config_loading:
  1. Load core-config.yaml from project root
  2. Extract devStoryLocation, prdShardedLocation, architectureShardedLocation
  3. Validate all required paths exist
  4. Set up file access patterns
```

### Story Number Auto-Calculation:
```yaml
# Smart story identification
story_numbering:
  1. Scan devStoryLocation for existing {epic}.{story}.story.md files
  2. Identify highest epic.story numbers
  3. Check last story status (must be 'Done' to proceed)
  4. Calculate next sequential story in current epic
  5. If epic complete, ask user which epic to start next
```

### Epic Content Auto-Extraction:
```yaml
# Epic requirements processing  
epic_processing:
  1. Locate epic file: docs/prd/epic-{currentEpic}*.md
  2. Extract story definition matching next story number
  3. Parse As-a/I-want/So-that statement
  4. Extract numbered acceptance criteria list
  5. Identify story type (Backend/Frontend/Full-stack)
```

### Architecture Context Auto-Loading:
```yaml
# Context-aware architecture loading
architecture_loading:
  base_documents: [tech-stack.md, coding-standards.md, testing-strategy.md]
  story_type_specific:
    backend: + [data-models.md, backend-architecture.md, rest-api-spec.md]
    frontend: + [frontend-architecture.md, components.md, core-workflows.md]
    fullstack: + [all backend and frontend documents]
  extraction_focus: Only details relevant to current story implementation
```

### Story Template Auto-Population:
```yaml
# Complete story document generation
template_population:
  filename: "docs/stories/{{epic_num}}.{{story_num}}.{{story_title_short}}.md"
  sections:
    status: "Draft"
    story: Epic-extracted As-a/I-want/So-that format
    acceptance_criteria: Copy from epic numbered list
    tasks_subtasks: Generated technical breakdown with AC references
    dev_notes: Comprehensive implementation guide with:
      - Technical Preferences Summary (with architecture source refs)
      - Testing Standards (with test integrity rules)
      - Implementation patterns and file locations
      - Previous story lessons learned (if applicable)
```

---

## ⚡ ERROR HANDLING

### Validation Failures:
- **Missing core-config.yaml**: "Configuration file not found. Run Orchestrix installer or copy from orchestrix-core/core-config.yaml"
- **No PRD shards**: "PRD sharding not found. Ensure PO agent has run shard-doc task on PRD"
- **Incomplete previous story**: "Last story {epic}.{story} status is {status}, not 'Done'. Complete previous story first or confirm risk override?"
- **Missing architecture**: "Required architecture documents not found. Ensure architect agent has created architecture documentation"

### Auto-Recovery:
- **Epic completion**: Automatically detect and ask user: "Epic {epic} complete. Start Epic {epic+1}? Or specify which story to create?"
- **Missing story in epic**: Skip missing story numbers and create next available
- **Architecture context partial**: Use available documents, note missing contexts in Dev Notes

### Context Debug Info:
```yaml
debug_information:
  config_status: "core-config.yaml loaded successfully"
  story_target: "Creating story {epic}.{story}: {title}"
  epic_source: "docs/prd/epic-{epic}.md loaded"
  architecture_loaded: ["tech-stack.md", "coding-standards.md", ...]
  template_compliance: "story-tmpl.yaml structure followed"
  output_path: "docs/stories/{epic}.{story}.{title}.md"
```

---

## 🔄 FALLBACK OPTIONS

**Interactive Override**: If auto-generation produces inadequate results, switch to manual mode
**Manual Fallback**: Reference detailed `create-next-story.md` for complex edge cases
**Debug Mode**: Use `*debug` command to see detailed template processing steps

**Technical References**:
- Template: `{root}/templates/story-tmpl.yaml`
- Config: `core-config.yaml` in project root
- Epic source: `docs/prd/epic-*.md` files
- Architecture: `docs/architecture/*.md` files
- Output: `docs/stories/{epic}.{story}.story.md`