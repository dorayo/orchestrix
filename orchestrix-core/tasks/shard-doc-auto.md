# Shard Document (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code SubAgent Default)

**Mission**: Automatically split large documents into organized, development-ready shards, fully automated

### Immediate Action Protocol:
1. **Auto-Load Config**: Check core-config.yaml for markdownExploder setting
2. **Auto-Detect Method**: Use md-tree command if available, fallback to manual parsing  
3. **Auto-Parse Document**: Identify level 2 sections and extract content
4. **Auto-Create Shards**: Generate properly named files with adjusted heading levels
5. **Auto-Generate Index**: Create navigation index for sharded documents
6. **Auto-Validate**: Verify content integrity and completeness
7. **Auto-Report**: Provide comprehensive sharding completion summary

### Non-Negotiable Requirements:
- ✅ MUST preserve ALL content integrity (code blocks, diagrams, formatting)
- ✅ MUST properly adjust heading levels (## → # in sharded files)
- ✅ MUST handle markdown context (## inside code blocks ≠ section headers)
- ✅ MUST create proper index.md with section navigation
- ✅ MUST generate development-friendly file structure
- ✅ MUST validate sharding completeness and accuracy

### Auto-Halt Conditions:
- ❌ Source document not found → Report missing document, halt
- ❌ Target directory creation fails → Report permission issue, halt
- ❌ Content parsing errors → Report malformed document, halt
- ❌ Critical content loss detected → Report parsing failure, halt

---

## 🎯 AUTOMATED SHARDING ENGINE

### Config & Method Auto-Detection:
```yaml
# Smart method selection for optimal performance
method_detection:
  config_check:
    - Load core-config.yaml from project root
    - Check markdownExploder setting
    - Determine available tools and capabilities
    
  tool_availability:
    md_tree_preferred: 
      - Check for @kayvan/markdown-tree-parser installation
      - Use md-tree explode command if available
      - Provides optimal performance and reliability
      
    manual_fallback:
      - Use intelligent manual parsing if md-tree unavailable
      - Apply advanced markdown-aware parsing logic
      - Handle edge cases with fenced code blocks and diagrams
```

### Document Parsing Auto-Intelligence:
```yaml
# Advanced markdown-aware content extraction
parsing_intelligence:
  section_identification:
    - Scan document for level 2 headings (##)
    - Apply markdown context awareness (ignore ## in code blocks)
    - Handle edge cases with fenced content and mermaid diagrams
    - Map section boundaries with precision
    
  content_extraction:
    - Extract complete section content until next level 2 heading
    - Preserve all subsections, code blocks, tables, lists
    - Maintain template markup {{placeholders}} exactly
    - Keep all markdown links and references intact
    
  structure_analysis:
    - Identify introduction content before first level 2 section
    - Map hierarchical section relationships
    - Detect special content types (code, diagrams, tables)
```

### File Generation Auto-System:
```yaml
# Systematic shard file creation
file_generation:
  filename_conversion:
    - Convert section headings to lowercase-dash-case
    - Remove special characters and normalize spaces
    - Example: "## Tech Stack & Dependencies" → "tech-stack-dependencies.md"
    
  heading_adjustment:
    - Level 2 (##) becomes Level 1 (#) in shard
    - All subsection levels decrease by 1 appropriately
    - Maintain proper markdown heading hierarchy
    
  content_writing:
    - Write adjusted content to properly named files
    - Preserve all formatting including significant whitespace
    - Maintain exact content integrity
```

---

## 🔧 EXECUTION LOGIC

### Auto-Method Selection:
```yaml
# Optimal sharding method determination
method_selection:
  preferred_md_tree:
    condition: markdownExploder=true AND md-tree available
    command: "md-tree explode {source_file} {target_folder}"
    advantages: [optimal_performance, reliable_parsing, edge_case_handling]
    
  manual_intelligent:
    condition: md-tree unavailable OR markdownExploder=false
    process: Advanced manual parsing with markdown intelligence
    advantages: [universal_availability, custom_logic, fine_control]
    
  error_handling:
    md_tree_missing: "Install: npm install -g @kayvan/markdown-tree-parser"
    config_guidance: "Set markdownExploder: true in core-config.yaml"
    fallback_notification: "Using intelligent manual parsing method"
```

### Manual Parsing Auto-Logic:
```yaml
# Advanced markdown-aware parsing when md-tree unavailable
manual_parsing:
  document_analysis:
    1. Read complete document content
    2. Identify markdown context boundaries (code blocks, diagrams)
    3. Map genuine level 2 section headers (outside code blocks)
    4. Extract introduction content before first section
    
  section_extraction:
    1. For each identified level 2 section:
       - Extract heading and all content until next level 2
       - Include subsections, code blocks, diagrams, tables
       - Preserve nested markdown elements
       - Handle multi-line content with embedded ##
    
  content_validation:
    - Verify fenced code blocks captured completely
    - Confirm mermaid diagrams preserved with full syntax
    - Check table formatting maintained
    - Validate list indentation and nesting preserved
```

### Index Generation Auto-Process:
```yaml
# Comprehensive navigation index creation
index_generation:
  content_structure:
    header: Original document title and introduction
    sections_list: Linked list of all sharded files
    navigation: Clear section organization for development use
    
  link_format:
    - Clean section names for display
    - Proper relative links to shard files  
    - Organized presentation for developer navigation
    
  template:
    ```markdown
    # {{original_title}}
    
    {{introduction_content_if_any}}
    
    ## Sections
    
    {{auto_generated_section_links}}
    ```
```

---

## ⚡ AUTO-VALIDATION SYSTEM

### Content Integrity Checks:
```bash
✓ All level 2 sections identified and extracted
✓ No content loss during sharding process
✓ Code blocks preserved with complete syntax
✓ Mermaid diagrams maintained with full markup
✓ Tables and lists formatted correctly
✓ Template placeholders {{variables}} preserved exactly
✓ Links and references remain intact
```

### Structure Validation:
```bash
✓ Proper filename generation (lowercase-dash-case)
✓ Heading levels adjusted correctly (## → # in shards)
✓ Subsection hierarchy maintained appropriately
✓ Index file created with proper navigation links
✓ Target folder structure organized correctly
```

### Quality Assurance:
```bash
✓ Sharding process reversible (could reconstruct original)
✓ All files created successfully in target location
✓ No malformed markdown syntax introduced
✓ Development team can navigate shards effectively
```

---

## 📊 AUTOMATED REPORTING

### Sharding Completion Report:
```markdown
## Document Sharding Complete

**Source Document**: {{source_document_path}}
**Target Location**: {{target_folder_path}}
**Sharding Method**: {{md_tree/manual_intelligent}}
**Processing Time**: {{completion_time}}

### Sharding Summary
- **Total Sections**: {{section_count}}
- **Files Created**: {{file_count + 1}} (including index.md)
- **Content Integrity**: ✅ {{validation_status}}
- **Method Used**: {{sharding_method_details}}

### Generated Files
{{auto_generated_file_list_with_descriptions}}

### Content Validation Results
- **Code Blocks**: {{code_block_count}} preserved
- **Diagrams**: {{diagram_count}} maintained  
- **Tables**: {{table_count}} formatted correctly
- **Links**: {{link_count}} references intact
- **Template Markup**: {{template_count}} placeholders preserved

### Development Ready Structure
```
{{target_folder}}/
├── index.md (navigation hub)
{{auto_generated_file_structure}}
```

### Next Steps for Development Team
- SM Agent can reference individual epic files from {{target_folder}}/
- Dev Agent can access specific architecture sections as needed
- All content remains searchable and properly organized
- Original document preserved alongside shards for reference
```

---

## 🛠️ ERROR HANDLING & RECOVERY

### Parsing Issue Management:
```yaml
error_handling:
  malformed_markdown:
    detection: Invalid markdown syntax or structure
    action: Attempt smart recovery, flag problematic sections
    fallback: Manual inspection of specific content areas
    
  code_block_complexity:
    detection: Nested or complex fenced content
    action: Use conservative parsing to preserve content
    validation: Extra verification of code block integrity
    
  large_document_performance:
    detection: Performance degradation on very large documents
    action: Process in chunks, provide progress feedback
    optimization: Use streaming approach for memory efficiency
```

### Content Validation Failures:
```yaml
validation_recovery:
  content_loss_detected:
    action: Halt process, report specific loss location
    recovery: Re-parse problematic section with enhanced logic
    escalation: Request manual review of complex sections
    
  heading_structure_issues:
    action: Apply conservative heading adjustment rules
    validation: Extra verification of heading hierarchy
    documentation: Note any structural anomalies in report
    
  file_creation_errors:
    action: Retry with sanitized filenames
    fallback: Use generic naming with section mapping
    reporting: Document filename generation issues
```

### Tool Availability Issues:
```yaml
tool_management:
  md_tree_unavailable:
    notification: "md-tree command not found, using intelligent manual parsing"
    recommendation: "Install @kayvan/markdown-tree-parser for optimal performance"
    action: Proceed with manual method automatically
    
  config_inconsistencies:
    detection: markdownExploder setting vs tool availability
    guidance: Provide specific configuration recommendations
    action: Use best available method regardless of config
```

---

## 🎯 SUCCESS CRITERIA

### Sharding Success Indicators:
- ✅ All document content preserved with perfect integrity
- ✅ Proper file structure created for development team use
- ✅ Navigation index enables efficient section access
- ✅ Markdown formatting and special content maintained
- ✅ Development-friendly organization facilitates story creation
- ✅ Sharding process completed without content loss

### Quality Gates:
- **Content Integrity**: 100% preservation of original content
- **Structure Quality**: Proper heading adjustments and file organization  
- **Development Utility**: SM/Dev agents can efficiently access relevant sections
- **Navigation Clarity**: Index provides clear section overview and access
- **Format Preservation**: All markdown elements maintained correctly

### PO Quality Control:
- **Phase Transition Readiness**: Documents properly prepared for development phase
- **Team Accessibility**: Development team can efficiently navigate requirements
- **Architecture Integration**: Technical documentation appropriately organized
- **Story Creation Support**: SM Agent has necessary context for story generation

**Fallback Reference**: Use detailed `shard-doc.md` for complex edge cases or when auto-sharding encounters unresolvable parsing issues.

**Development Impact**: This task is critical for transitioning from Planning Phase to Development Phase, enabling the SM → Architect → Dev → QA development cycle to operate efficiently with properly organized documentation.