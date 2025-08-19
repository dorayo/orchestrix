# Create Document from Template (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code Default)

**Mission**: Generate complete document using template, fully automated

### Immediate Action Protocol:
1. **Auto-Load Template**: `{template_name}` from `.orchestrix-core/templates/`
2. **Auto-Extract**: Parse `output.filename`, sections, variables  
3. **Auto-Generate**: Complete ALL template sections intelligently
4. **Auto-Save**: Write to template's specified path
5. **Auto-Validate**: Confirm structure compliance
6. **Present Result**: Show user the completed document

### Non-Negotiable Requirements:
- ✅ MUST use template's exact `output.filename` path
- ✅ MUST populate ALL template sections  
- ✅ MUST apply template conditional logic
- ✅ MUST leave NO `{{variables}}` unfilled

### Auto-Halt Conditions:
- ❌ Template not found → List available templates, ask user to specify
- ❌ Template malformed → Report specific error, halt
- ❌ Output path invalid → Report path issue, halt

---

## 🎯 AUTOMATED INTELLIGENCE LAYER

### Variable Auto-Population Strategy:
```yaml
# Smart defaults for common variables
project_name: Extract from core-config.yaml or ask user
output_path: Use template.output.filename exactly
sections: Process all template.sections[] in order
conditions: Auto-evaluate template conditional logic
```

### Content Generation Intelligence:
- **Business sections**: Generate based on template instructions + available context
- **Technical sections**: Reference architecture docs if available
- **User sections**: Create realistic but generic examples if no specific data
- **Conditional sections**: Auto-evaluate conditions, include/exclude appropriately

### Quality Auto-Validation:
```bash
# Post-generation checks
✓ File created at correct location
✓ All template sections present  
✓ No unfilled {{variables}}
✓ Conditional logic properly applied
✓ Content follows template structure
```

---

## 🔧 COMMAND OVERRIDES (When Automation Needs Help)

**Manual Mode**: `*interactive` - Switch to step-by-step mode
**Debug Mode**: `*debug` - Show detailed template processing
**Preview Mode**: `*preview` - Generate content but don't save file

---

## ⚡ EXECUTION LOGIC

### Template Processing Flow:
```
1. LOAD: .orchestrix-core/templates/{name}
2. PARSE: Extract structure + metadata  
3. GENERATE: Auto-complete all sections
4. VALIDATE: Check completeness
5. SAVE: Write to template.output.filename
6. REPORT: Present final document to user
```

### Error Recovery:
- **Missing template** → Auto-list available options
- **Invalid YAML** → Report syntax error location  
- **Undefined variables** → Use intelligent defaults or prompt
- **Path conflicts** → Confirm overwrite or rename

### Context Intelligence:
- Check for existing project files (core-config.yaml, docs/, etc.)
- Auto-reference available architecture/PRD documents
- Generate coherent content based on project context
- Maintain consistency with established project patterns

---

## 🔄 FALLBACK OPTIONS

**Interactive Override**: Use `*interactive` command for step-by-step processing
**Debug Override**: Use `*debug` command to see detailed template processing
**Manual Fallback**: Available if auto-generation fails or produces inadequate results

**Technical Debug Info** (if needed):
- Template path: `.orchestrix-core/templates/{name}`
- Expected output: `{template.output.filename}`
- Auto-validation checkpoints: Template structure, variable completion, file placement
- Context sources: core-config.yaml, existing docs/, architecture references