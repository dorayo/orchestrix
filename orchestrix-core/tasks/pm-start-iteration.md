# PM - Start New Iteration

## Purpose

Start a new iteration after MVP completion by creating new Epics and updating PRD shard files.
This task assumes the PRD has been sharded (prdSharded: true).

## Prerequisites

1. PRD is sharded: `prd.prdSharded: true` in `core-config.yaml`
2. Shard directory exists: `docs/prd/`
3. At least one MVP iteration has been completed

## Process

### Step 1: Validate Shard Status

Read `{root}/core-config.yaml`:

1. Confirm `prd.prdSharded: true`
2. Get `prd.prdShardedLocation` (default: `docs/prd`)
3. Get `dev.devLogLocation` (default: `docs/dev/logs`) → derive `devDocLocation` as parent directory

**IF NOT sharded:**

```
❌ PRD not yet sharded

Please execute initial sharding first:


🎯 HANDOFF TO PO: *shard

Return to execute *start-iteration after sharding is complete.
```

HALT

### Step 2: Load Product Context

Read shard files in order to build complete product understanding:

**2.1 Read PRD Section Files**

Read in the following order (filenames may vary slightly, use Glob to match):

1. `*goals*.md` → Product goals and background
2. `*requirements*.md` → Functional and non-functional requirements
3. `*user-interface*.md` or `*ui-goals*.md` → UI design goals
4. `*technical-assumptions*.md` → Technical assumptions
5. `*epic-list*.md` → Epic summary list
6. `*epics*.md` → Epic detailed definitions (contains YAML blocks)

**2.2 Read Existing Epic Files**

```bash
# Read all Epic YAML files
ls docs/prd/epic-*.yaml
```

Parse each Epic file to extract:
- `epic_id` value
- `title` value
- Story count

**2.3 Determine Next Epic ID**

```
current_max_epic_id = MAX(all epic_id values)
next_epic_id = current_max_epic_id + 1
```

**2.4 Output Product Overview**

Present current product state to user:

```
📖 Current Product Overview
═══════════════════════════════════════════════════════

Product Goals: {goals summary}

Existing Epics:
  - Epic 1: {title} ({story_count} stories)
  - Epic 2: {title} ({story_count} stories)
  ...

Next Available Epic ID: {next_epic_id}

═══════════════════════════════════════════════════════
```

### Step 2.5: Load Technical Context

Load technical context to enable technology-aware requirements discussion.

**2.5.1 Load Cumulative Registries**

Check and read the following files (if exist):

```
{devDocLocation}/database-registry.md  → Existing tables and fields
{devDocLocation}/api-registry.md       → Existing API endpoints
{devDocLocation}/models-registry.md    → Existing models and types
```

Extract key information:
- Database: table names, field counts, key entities
- API: endpoint count, endpoints by resource
- Models: interface count, key types

**2.5.2 Load Key Architecture Sections**

Read architecture documents for system capabilities:

```
docs/architecture/3-tech-stack.md      → Available technologies
docs/architecture/5-components.md      → Existing modules/services
docs/architecture/8-database-schema.md → Current database structure
docs/architecture/9-rest-api-spec.md   → Current API endpoints
```

**2.5.3 Output Technical Overview**

```
🔧 Technical Context Overview
═══════════════════════════════════════════════════════

📊 Database:
   - Tables: {count} ({table_names_summary})
   - Key entities: {entity_list}

🌐 API Endpoints:
   - Total: {count} endpoints
   - By resource: {resource_summary}

🧱 Components:
   - Backend: {backend_components_list}
   - Frontend: {frontend_components_list}

═══════════════════════════════════════════════════════
```

**IF cumulative registries do not exist:**
- First iteration or first use of enhanced flow
- Output: "No implementation data yet. Architecture documents available for reference."
- Continue execution

### Step 3: Requirements Discussion

Interact with user to collect new iteration information with technical awareness.

**3.1 Present System Capabilities**

Before collecting requirements, inform user of current system state:

```
💡 Current System Capabilities:

Existing Features:
  ✓ {feature_1} ({implementation_detail})
  ✓ {feature_2} ({implementation_detail})

Available for Reuse:
  • {component_1} ({purpose})
  • {component_2} ({purpose})

Database Ready:
  • {table_list} tables exist
  • Can extend existing tables or add new ones
```

**3.2 Collect New Feature Requirements**

Ask user:
- What features should this new iteration implement?
- Please describe the core value and user scenarios for each feature

**3.3 Identify Technical Impact**

As requirements are collected, identify technical implications:

| Requirement | Technical Impact | Impact Type |
|-------------|------------------|-------------|
| {requirement_1} | {impact_description} | New API / DB Change / New Component |

**3.4 Output Technical Impact Summary**

```
📋 Technical Impact Summary:

New APIs Required:
  • {HTTP_METHOD} {endpoint} ({purpose})

Database Changes:
  • New: {table_name} ({reason})
  • Modify: {table_name} - add {field} ({reason})

New Components:
  • Backend: {component_list}
  • Frontend: {component_list}

Technology Decisions Needed:
  ⚠️ {decision_point} - {options}
```

**3.5 Determine Epic Planning**

Based on requirements discussion, determine:
- How many new Epics to create
- Title and description for each Epic
- Story overview for each Epic

**3.6 Ask About Section Updates**

Ask user if existing sections need updates:

```
📋 Do any of the following sections need updates?

[1] Goals and Background Context (1-goals-and-background-context.md)
[2] Requirements (2-requirements.md)
[3] UI Design Goals (3-user-interface-design-goals.md)
[4] Technical Assumptions (4-technical-assumptions.md)

Enter section numbers to update (e.g., 1,2) or "none" to skip:
```

### Step 4: Existing Implementation Reusability Analysis

CRITICAL: Before creating new Epics, perform deep analysis of existing codebase to identify reusable implementations and potential conflicts. This prevents duplicate work and ensures new features integrate properly with existing code.

**4.1 Deep Scan Codebase Structure**

Scan the project source directories to understand existing implementation:

```bash
# Identify main source directories
ls -la src/ || ls -la app/ || ls -la lib/

# List all modules/services/components
find src -type d -name "services" -o -name "modules" -o -name "components" | head -20

# List key implementation files
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -50
```

For each new requirement from Step 3, identify potentially related existing code:

| Requirement | Search Keywords | Related Directories to Scan |
|-------------|-----------------|----------------------------|
| {requirement_1} | {keyword_1}, {keyword_2} | src/services/, src/modules/ |

**4.2 Read Key Implementation Files**

For each requirement, read existing implementations that may be relevant:

1. Search for related service/module files:
   ```bash
   grep -r "{keyword}" src/ --include="*.ts" -l | head -10
   ```

2. Read identified files to understand:
   - Current implementation approach
   - Existing interfaces and types
   - Error handling patterns
   - Integration points with other modules

**4.3 Classify Existing Implementations**

For each new requirement, classify existing implementations into four categories:

**Category A: Directly Reusable**
- Existing implementation fully satisfies the requirement
- No code changes needed, only integration

**Category B: Requires Extension**
- Existing implementation partially satisfies the requirement
- Can be extended without breaking existing functionality
- Document specific extension points

**Category C: Has Conflicts**
- Existing implementation logic conflicts with new requirement
- Requires refactoring or architectural decision
- Document specific conflict points and impact

**Category D: New Implementation**
- No existing implementation available
- Must be built from scratch
- Document suggested location and patterns to follow

**4.4 Generate Reusability Analysis Report**

Output structured analysis report for user review:

```
═══════════════════════════════════════════════════════
🔍 EXISTING IMPLEMENTATION REUSABILITY ANALYSIS
═══════════════════════════════════════════════════════

## Analysis for: {Epic/Requirement Title}

### ✅ Category A: Directly Reusable

| Component | Location | Current Capability | Reuse Strategy |
|-----------|----------|-------------------|----------------|
| {component_name} | {file_path} | {what_it_does} | {how_to_reuse} |

**Recommendation**: Reference these in Epic as dependencies, avoid reimplementation.

---

### 🔧 Category B: Requires Extension

| Component | Location | Current Capability | Extension Needed |
|-----------|----------|-------------------|------------------|
| {component_name} | {file_path} | {current_feature} | {what_to_add} |

**Recommendation**: Extend existing modules rather than creating new ones.

---

### ⚠️ Category C: Has Conflicts

| Component | Location | Conflict Point | Impact | Resolution Options |
|-----------|----------|---------------|--------|-------------------|
| {component_name} | {file_path} | {conflict_desc} | {impact_level} | {option_1}, {option_2} |

**⚠️ ATTENTION REQUIRED**: These conflicts must be resolved before implementation.

**Conflict Details**:
1. {conflict_1_detailed_explanation}
   - Current behavior: {current}
   - Required behavior: {required}
   - Suggested resolution: {resolution}

---

### 🆕 Category D: New Implementation

| Feature | Reason | Suggested Location | Patterns to Follow |
|---------|--------|-------------------|-------------------|
| {feature_name} | {why_new} | {suggested_path} | {existing_pattern_ref} |

**Recommendation**: Follow existing codebase patterns from {reference_file}.

═══════════════════════════════════════════════════════

## 📊 SUMMARY

| Category | Count | Items |
|----------|-------|-------|
| Directly Reusable | {n} | {list} |
| Requires Extension | {n} | {list} |
| Has Conflicts | {n} | {list} |
| New Implementation | {n} | {list} |

## ❓ USER DECISION REQUIRED

Based on this analysis:

1. **Adopt reuse recommendations?** (Y/N)
   - If Y: Epic will reference existing implementations
   - If N: Please specify which items to override

2. **Conflict resolution approach?**
   - For each conflict, choose resolution option or provide alternative

3. **Adjust requirements based on findings?**
   - Some requirements may be simplified by leveraging existing code
   - Some may need adjustment to avoid major refactoring

Please provide your decisions before proceeding to Epic creation.
═══════════════════════════════════════════════════════
```

**4.5 Wait for User Confirmation**

HALT and wait for user to:
1. Review the reusability analysis report
2. Confirm or modify reuse recommendations
3. Decide on conflict resolution approaches
4. Optionally adjust requirements based on findings

**IF user requests requirement adjustments:**
- Return to Step 3.5 to update Epic planning
- Re-run affected parts of Step 4 analysis

**IF user confirms analysis:**
- Proceed to Step 5 with reuse decisions recorded
- Reuse analysis will be embedded in Epic YAML

### Step 5: Analyze Impact Scope

Based on Step 3 and Step 4 results, generate affected files list:

```yaml
files_to_update:
  required:  # Must update
    - "5-epic-list.md"      # Append new Epic summary
    - "6-epics.md"          # Append new Epic YAML blocks
    - "8-next-steps.md"     # Complete replacement

  new_files:  # Need to create
    - "epic-{n}-{title-slug}.yaml"  # One file per new Epic

  new_directories:  # Create if not exist
    - "docs/front-end-spec/"  # For epic-specific front-end specs

  optional:  # Based on user selection
    - "1-goals-and-background-context.md"  # If selected [1]
    - "2-requirements.md"                   # If selected [2]
    - "3-user-interface-design-goals.md"   # If selected [3]
    - "4-technical-assumptions.md"         # If selected [4]
```

Confirm impact scope with user:

```
📁 This iteration will update the following files:

Required Updates:
  ✓ docs/prd/5-epic-list.md
  ✓ docs/prd/6-epics.md
  ✓ docs/prd/8-next-steps.md (complete replacement)

New Files:
  ✓ docs/prd/epic-{n}-{title}.yaml

Optional Updates:
  {list based on user selection}

Continue? [Y/n]
```

### Step 6: Create New Epics

Generate YAML format content for each new Epic using ENHANCED AC STRUCTURE.
Incorporate reusability analysis results from Step 4.

**6.1 Enhanced Epic YAML Format**

CRITICAL: Each AC must be a COMPLETE requirement unit. Dev agents will implement directly
from this specification without needing to consult PRD or architecture documents.

Follow the format defined in `prd-tmpl.yaml`:

```yaml
epic_id: {next_epic_id}
title: "{Epic Title}"
description: |
  {Epic description - 2-3 sentences explaining goals and value}

# ============================================================
# REUSE ANALYSIS - From Step 4 findings
# ============================================================
reuse_analysis:
  directly_reusable:
    # Category A items - existing code to reference, not reimplement
    - component: "{component_name}"
      location: "{file_path}"
      capability: "{what_it_does}"
      usage: "{how_this_epic_uses_it}"

  requires_extension:
    # Category B items - existing code to extend
    - component: "{component_name}"
      location: "{file_path}"
      current_capability: "{what_it_does_now}"
      extension_needed: "{what_to_add}"
      affected_stories: ["{story_id}"]

  conflicts:
    # Category C items - conflicts requiring resolution
    - component: "{component_name}"
      location: "{file_path}"
      conflict: "{conflict_description}"
      resolution: "{chosen_resolution}"
      affected_stories: ["{story_id}"]

  new_implementations:
    # Category D items - new code to create
    - feature: "{feature_name}"
      suggested_location: "{file_path}"
      pattern_reference: "{existing_file_to_follow}"
      affected_stories: ["{story_id}"]

stories:
  - id: "{epic_id}.1"
    title: "{Story Title}"
    repository_type: backend | frontend | ios | android | mobile | monolith
    estimated_complexity: low | medium | high
    priority: P0 | P1 | P2

    # ============================================================
    # ENHANCED ACCEPTANCE CRITERIA - Complete Requirement Specs
    # ============================================================
    acceptance_criteria:
      - id: AC1
        title: "{Concise AC title - 5-10 words}"

        # REQUIRED: Scenario in GIVEN/WHEN/THEN format
        scenario:
          given: "{Precondition state}"
          when: "{User action or system trigger}"
          then:
            - "{Expected outcome 1}"
            - "{Expected outcome 2}"

        # REQUIRED: Business rules governing this AC (minimum 1)
        business_rules:
          - id: "BR-1.1"
            rule: "{Business rule description}"

        # CONDITIONAL: Required when AC involves form input or API request
        data_validation:
          - field: "{field_name}"
            type: "string | number | boolean | email | date | array | object"
            required: true | false
            rules: "{Validation rules - format, length, pattern, range}"
            error_message: "{User-facing error message}"

        # REQUIRED: Error scenarios and handling (minimum 1)
        error_handling:
          - scenario: "{Error condition description}"
            code: "{HTTP status or error code}"
            message: "{User-facing error message}"
            action: "{System behavior on this error}"

        # OPTIONAL: UI interaction details (for frontend/mobile only)
        interaction:
          - trigger: "{User action}"
            behavior: "{UI response - loading states, animations, feedback}"

        # RECOMMENDED: Concrete examples (Specification by Example)
        examples:
          - input: "{Example input data}"
            expected: "{Expected output or behavior}"

      - id: AC2
        # ... same structure

    # ============================================================
    # API & Dependency Tracking
    # ============================================================
    provides_apis: []     # Backend: ["POST /api/xxx", "GET /api/xxx/:id"]
    consumes_apis: []     # Frontend/Mobile: ["POST /api/xxx"]
    dependencies: []      # Story IDs: ["4.1"]

    # ============================================================
    # SM Hints - Populated by UX-Expert and Architect AFTER PM creates Epic
    # ============================================================
    sm_hints:
      front_end_spec: null  # UX-Expert fills: {file, sections}
      architecture: null     # Architect fills: {files}

  - id: "{epic_id}.2"
    # ... more Stories with same structure
```

**6.2 Field Requirements Reference**

| Field | Required | Condition | Description |
|-------|----------|-----------|-------------|
| id | YES | Always | AC identifier: AC1, AC2, etc. |
| title | YES | Always | Concise AC title (5-10 words) |
| scenario | YES | Always | GIVEN/WHEN/THEN structure |
| business_rules | YES | Always | Minimum 1 rule per AC |
| data_validation | CONDITIONAL | When AC has form/API input | Field-level validation specs |
| error_handling | YES | Always | Minimum 1 error scenario |
| interaction | NO | Only for UI stories | UI behavior details |
| examples | RECOMMENDED | Always | Specification by Example |

**6.3 Story repository_type Determination**

Determine repository_type based on Story content:
- Involves API, database, backend logic → `backend`
- Involves Web UI → `frontend`
- Involves iOS app → `ios`
- Involves Android app → `android`
- Generic mobile → `mobile`
- Monolithic app → `monolith`

**6.4 Validation Before Confirmation**

Before presenting to user, verify each Story:

- [ ] Every AC has at least 1 business rule
- [ ] Every AC with data input has data_validation section
- [ ] Every AC has at least 1 error_handling scenario
- [ ] Examples cover both success and failure cases
- [ ] UI stories have interaction section
- [ ] All field error_message values are user-friendly

**6.5 Confirm Epic Content with User**

After generating complete YAML for each Epic, present to user for confirmation:

```
📋 Epic {n}: {title}

```yaml
{complete YAML content with enhanced AC structure}
```

Please confirm or suggest modifications:
```

### Step 7: Update Files

Execute file update operations.

**7.1 Update 5-epic-list.md**

Append new Epic summary at end of file:

```markdown
- **Epic {n}: {title}** - {one sentence goal description}
```

**7.2 Update 6-epics.md**

Append complete Epic definition at end of file (with YAML fence):

```markdown

## Epic {n}: {title}

**Epic Summary:** {2-3 sentence description}

**Target Repositories:** {backend, frontend, ios, android - auto-detected from stories}

```yaml
{complete Epic YAML}
```
```

**7.3 Create Standalone Epic Files**

Create a standalone YAML file for each new Epic:

- Filename format: `epic-{n}-{title-slug}.yaml`
- Location: `docs/prd/`
- Content: Pure YAML (no markdown fence)

title-slug rules:
- Lowercase
- Spaces replaced with hyphens
- Special characters removed
- Example: "Advanced Search" → "advanced-search"

**7.4 Create Front-End Spec Directory**

If UI Stories exist in new Epics:

```bash
mkdir -p docs/front-end-spec
```

**7.5 Update Other Sections** (if user selected)

Based on optional updates list from Step 5:
- Interact with user to confirm specific update content
- Append or modify corresponding sections

### Step 8: Generate next-steps.md

**Completely replace** the `8-next-steps.md` file with enhanced handoff instructions.

**8.1 Determine UI Involvement**

Check `repository_type` of all Stories in new Epics:
- Contains `frontend`, `ios`, `android`, or `mobile` → UI involved
- Otherwise → No UI involved

**8.2 Analyze Epic Content**

For each new Epic, analyze Stories to determine:
- Which architecture sections need updates
- Which front-end components need design
- Specific focus areas based on requirements

**8.3 Write next-steps.md**

Generate `8-next-steps.md` as executable prompts for downstream agents. Each `🎯 HANDOFF TO {agent}:` section is a complete prompt that the target agent will execute directly—replace all placeholders with actual values from this iteration.

**Structure**:

```markdown
# Next Steps

Auto-generated by PM *start-iteration. Follow guidance in order.

---

{IF UI involved:}

🎯 HANDOFF TO ux-expert:

## Part 1: Create Epic Front-End Specifications

Create dedicated front-end spec for each UI-involved Epic:

**Output Files:**
{for each new Epic with UI stories:}
- `docs/front-end-spec/epic-{N}-front-end-spec.md`

**Document Structure:**

Each spec MUST use this structure for SM traceability:

```
# Epic {N}: {Title} - Front-End Specification

## Overview
{Brief overview of UI requirements}

## Story {N}.1: {Story Title}
### Component Design
- {Component name and purpose}
- {Props and state requirements}

### Interaction Patterns
- {User interactions}
- {State transitions}

### Responsive Behavior
- {Breakpoint considerations}

## Story {N}.2: {Story Title}
...
```

**Files to Read:**
- `docs/prd/3-user-interface-design-goals.md`
{for each new Epic:}
- `docs/prd/epic-{N}-{title-slug}.yaml`

**Focus Areas:**
{generate 3-5 specific bullet points based on Epic content}

---

## Part 2: Update Epic YAML with SM Hints

After completing spec, update Epic YAML to establish SM traceability.

**Files to Modify:**
{for each new Epic:}
- `docs/prd/epic-{N}-{title-slug}.yaml`

**For each frontend Story**, populate `sm_hints.front_end_spec`:

```yaml
sm_hints:
  front_end_spec:
    file: "epic-{N}-front-end-spec.md"
    sections:
      - "Story {N}.{M}: {Story Title}"
      - "{Component name}"
      - "{Pattern name}"
  architecture: null  # Architect fills this
```

---

{ALWAYS:}

🎯 HANDOFF TO architect:

## Part 1: Update Architecture Documents

**Files to Read:**
- `docs/prd/4-technical-assumptions.md`
{for each new Epic:}
- `docs/prd/epic-{N}-{title-slug}.yaml`
{if UI involved:}
- `docs/front-end-spec/epic-{N}-front-end-spec.md`

**Architecture Files to Update:**
{list ONLY files that need updates based on Epic content:}
- `docs/architecture/{section-file}.md` - {specific reason}

**Focus Areas:**
{generate 3-5 specific bullet points based on Epic content}

---

## Part 2: Update Cumulative Registries

Pre-register technical elements planned for this iteration:

| Change Type | Registry to Update | Status |
|-------------|-------------------|--------|
| New API endpoints | `{devDocLocation}/api-registry.md` | planned |
| New tables/fields | `{devDocLocation}/database-registry.md` | planned |
| New models/types | `{devDocLocation}/models-registry.md` | planned |

Mark status as `planned`. Dev updates to `implemented` after completion.

---

## Part 3: Update Epic YAML with SM Hints

After completing architecture updates, update Epic YAML to establish SM traceability.

**Files to Modify:**
{for each new Epic:}
- `docs/prd/epic-{N}-{title-slug}.yaml`

**For each Story**, populate `sm_hints.architecture`:

```yaml
sm_hints:
  front_end_spec:
    file: "epic-{N}-front-end-spec.md"  # Already filled by UX-Expert
    sections:
      - "Story {N}.{M}: {Story Title}"
  architecture:
    files:
      - "{architecture-file}#{section-anchor}"
      - "{architecture-file}#{section-anchor}"
```

**Mapping Guidelines:**

| Story Type | Architecture References |
|------------|------------------------|
| Backend API | `9-rest-api-spec.md#endpoint-name`, `5-components.md#ServiceName` |
| Database ops | `8-database-schema.md#table-name`, `5-components.md#RepositoryName` |
| Frontend | `5-components.md#ComponentName`, `9-rest-api-spec.md#consumed-endpoints` |
| Auth-related | `14-security.md#auth-section`, `5-components.md#AuthService` |

---

## Completion Checklist

Before handing off to SM:

- [ ] All Epic front-end specs created (if UI involved)
- [ ] All Epic YAML files have `sm_hints.front_end_spec` populated (for UI stories)
- [ ] All architecture documents updated
- [ ] Cumulative registries updated with planned elements
- [ ] All Epic YAML files have `sm_hints.architecture` populated

---

🎯 HANDOFF TO sm:

## Step 1: Commit Planning Documents

Before creating stories, commit all planning phase changes:

```bash
git add docs/prd/ docs/front-end-spec/ docs/architecture/ docs/dev/
git commit -m "docs(planning): prepare iteration {N} - {Epic titles}"
```

## Step 2: Create Stories

SM can now create Stories with:
- `sm_hints.front_end_spec` → Precise front-end design references
- `sm_hints.architecture` → Precise architecture references

Execute: *create-next-story
```

### Step 9: Output Summary

Output completion report:

```
═══════════════════════════════════════════════════════
✅ NEW ITERATION CREATED
═══════════════════════════════════════════════════════

📋 New Epics Created:
{for each new Epic:}
   - Epic {n}: {title} ({story_count} stories)

🔍 Reusability Analysis Summary:
   - Directly Reusable: {count} components
   - Requires Extension: {count} components
   - Conflicts Resolved: {count} items
   - New Implementations: {count} features

📁 Files Updated:
   - docs/prd/5-epic-list.md (appended)
   - docs/prd/6-epics.md (appended)
   - docs/prd/8-next-steps.md (complete replacement)
{for each new Epic:}
   - docs/prd/epic-{n}-{title-slug}.yaml (new)
{if other sections updated:}
   - docs/prd/{section-filename} (updated)

═══════════════════════════════════════════════════════
🎯 NEXT STEPS
═══════════════════════════════════════════════════════

Please review docs/prd/8-next-steps.md for detailed guidance.

{IF UI involved:}
1. First: @ux-expert - Create epic front-end specs and update Epic YAML
2. Then: @architect - Update architecture docs and Epic YAML

{ELSE:}
Execute: @architect - Update architecture docs and Epic YAML

After Epic YAML files have sm_hints populated:
SM → Dev → QA

═══════════════════════════════════════════════════════
```

## Output

**On Success:**
- Updated PRD shard files
- Newly created Epic YAML files with `sm_hints` placeholders
- Completely replaced 8-next-steps.md with enhanced handoff instructions

**On Failure:**
- Error reason
- Remediation steps
- No files modified
