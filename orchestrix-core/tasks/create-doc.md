# Create Document from Template (YAML Driven)

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

When this task is invoked, follow the resolved mode exactly. Do NOT deviate from the mode's workflow.

---

## Mode Resolution

Determine the effective document generation mode using this priority:

1. **CLI flag** (highest priority): `--interactive` → interactive, `--draft` → draft-first
2. **Template YAML** `workflow.mode` field
3. **Default**: `draft-first`

**Backward compatibility:** `--yolo` maps to `draft-first` (emit note: "Note: --yolo is deprecated, using draft-first mode.")

---

## Critical: Template Discovery

**Template resolution when not explicitly provided:**

1. **Single template available** → Auto-select and proceed (no user prompt needed)
2. **Multiple templates available** → List numbered options for user selection
3. **No templates available** → Ask user to provide template path

---

## Mode: draft-first (DEFAULT)

### Core Principle

> 先看到才能决定有没有问题。Generate the complete draft first, then let the user review and refine.

### Phase 1: Context & Quick Questions

1. **Parse YAML template** - Load template metadata, sections, and workflow config
2. **Load available inputs** - Read existing docs referenced in section instructions (PRD, Project Brief, etc.)
3. **Scan decision points** - Identify all sections with `elicit: true` to build a decision inventory
4. **Identify critical unknowns** - Variables and information that AI cannot reasonably infer from available context
5. **Ask 2-5 blocking questions** - Project-level questions only, NOT per-section questions
   - Focus on: project name, target users, key constraints, platform choices, or anything the template needs but no input doc provides
   - If sufficient context exists from input documents, skip questions and proceed directly
6. **Wait for answers** before proceeding to Phase 2

### Phase 2: Generate Complete Draft

Process ALL sections sequentially, including `elicit: true` sections:

1. **For each section:**
   - Check condition → skip if unmet
   - Check agent permissions (owner/editors) → note restrictions in document
   - Draft content using section instruction and available context
   - **IF `elicit: true`**: AI makes its best judgment and records a Decision Record:
     ```
     section_id | decision | reasoning | confidence (high/medium/low) | alternatives
     ```
   - Continue to next section immediately (NO stop, NO user interaction)

2. **Save complete document** to the template's `output.filename` path

3. **Announce:**
   ```
   📄 初稿已生成并保存到 {filepath}
   ```

### Phase 3: Decision Review

Present a categorized summary of all decisions made during generation:

**Format:**

```
## 关键决策与待确认项

### 🔴 需要确认 (低置信度)
1. **[Section Title]** — 选择了 X
   - 原因: [reasoning]
   - 备选: Y, Z

### 🟡 建议审阅 (中等置信度)
2. **[Section Title]** — 选择了 X
   - 原因: [reasoning]
   - 备选: Y

### 🟢 已按常规处理 (高置信度)
3. **[Section Title]** — 采用了 X（行业惯例）

---
请查看文档后告诉我：
1. 以上决策有需要调整的吗？
2. 有其他想补充或修改的内容吗？
3. 如需对某个章节做深度探索，可以使用 `*elicit {section_id}`
```

**Rules:**
- Only list sections where AI had to make a meaningful decision (skip trivial sections)
- 🔴 Low confidence: AI lacked sufficient context or had multiple equally valid options
- 🟡 Medium confidence: AI had a reasonable default but the user might prefer differently
- 🟢 High confidence: Industry standard or clearly derived from input documents
- If no decisions were needed (all info from inputs), state this briefly and ask for general feedback

### Phase 4: Iterative Refinement

1. **User provides feedback** → Revise the corresponding sections → Save updated document
2. **User invokes `*elicit {section_id}`** → Execute advanced-elicitation task on that section → Apply results → Save
3. **User provides new input or ideas** → Incorporate into relevant sections → Save → Present any new decisions if significant
4. **Loop** until user is satisfied or explicitly approves

**After each revision, briefly summarize what changed.** Do not re-present the entire decision list unless the user requests it.

---

## Mode: interactive (opt-in via `--interactive`)

**Activation:** `*create-doc {template} --interactive` or template has `workflow.mode: interactive`

### Processing Flow

1. **Parse YAML template** - Load template metadata and sections
2. **Set preferences** - Show current mode (Interactive), confirm output file
3. **Process each section:**
   - Skip if condition unmet
   - Check agent permissions (owner/editors) - note if section is restricted to specific agents
   - Draft content using section instruction
   - Present content + detailed rationale
   - **IF `elicit: true`** → MANDATORY 1-9 options format (see below)
   - Save to file if possible
4. **Continue until complete**

### Mandatory Elicitation Format (interactive mode only)

**When `elicit: true`, this is a HARD STOP requiring user interaction:**

1. Present section content
2. Provide detailed rationale (explain trade-offs, assumptions, decisions made)
3. **STOP and present numbered options 1-9:**
   - **Option 1:** Always "Proceed to next section"
   - **Options 2-9:** Select 8 methods from data/elicitation-methods
   - End with: "Select 1-9 or just type your question/feedback:"
4. **WAIT FOR USER RESPONSE** - Do not proceed until user selects option or provides feedback

### Elicitation Results Flow (interactive mode only)

After user selects elicitation method (2-9):

1. Execute method from data/elicitation-methods
2. Present results with insights
3. Offer options:
   - **1. Apply changes and update section**
   - **2. Return to elicitation menu**
   - **3. Ask any questions or engage further with this elicitation**

---

## Shared Rules (All Modes)

### Agent Permissions

When processing sections with agent permission fields:

- **owner**: Note which agent role initially creates/populates the section
- **editors**: List agent roles allowed to modify the section
- **readonly**: Mark sections that cannot be modified after creation

**For sections with restricted access:**

- Include a note in the generated document indicating the responsible agent
- Example: "_(This section is owned by dev-agent and can only be modified by dev-agent)_"

### Detailed Rationale

Whether presented per-section (interactive) or as decision records (draft-first), rationale must explain:

- Trade-offs and choices made (what was chosen over alternatives and why)
- Key assumptions made during drafting
- Decisions that need user attention
- Areas that might need validation

### Custom Elicitation Options

If the template defines `workflow.custom_elicitation`, these options:
- **Interactive mode**: Replace default options 2-9
- **Draft-first mode**: Available during Phase 4 via `*elicit {section_id}`

---

## Phase 5: Template-Based Handoff (MANDATORY)

After document generation is complete and user has approved, output handoff based on template.

### Handoff Routing Table

| Template | Agent | Next Target | Command |
|----------|-------|-------------|---------|
| project-brief-tmpl | Analyst | PM | `*create-doc prd` |
| prd-tmpl | PM | Conditional | See below |
| brownfield-prd-tmpl | PM | Conditional | See below |
| front-end-spec-tmpl | UX-Expert | Architect | `*create-doc architecture` |
| architecture-tmpl | Architect | PO | `*shard` |
| Other templates | Any | None | Terminal |

### PRD Conditional Handoff Logic

After generating PRD, check for frontend/mobile work (in order, stop at first TRUE):

1. Does "User Interface Design Goals" section contain actual content (not empty/N/A)?
2. Does "Repository Details" table include type = `frontend`, `ios`, `android`, or `mobile`?
3. Do any Epic stories have `repository_type` = frontend/ios/android/mobile?

**Decision**:
- **ANY check TRUE** → `🎯 HANDOFF TO ux-expert: *create-doc front-end-spec`
- **ALL checks FALSE** → `🎯 HANDOFF TO architect: *create-doc architecture`

### Handoff Output Format

```
📄 DOCUMENT GENERATION COMPLETE

Document: {output_filepath}
Template: {template_id}
{For PRD: Project Type: has-frontend | backend-only}

🎯 HANDOFF TO {target_agent}: *{command}
```

**CRITICAL**: The `🎯 HANDOFF TO` line must be the FINAL output. No content after it.

### Terminal Templates (No Handoff)

For templates without defined next step (market-research-tmpl, competitor-analysis-tmpl):

```
📄 DOCUMENT GENERATION COMPLETE

Document: {output_filepath}
Template: {template_id}

No automatic next step. Suggested actions:
- Review document with stakeholders
- Use findings to inform other planning documents
```
