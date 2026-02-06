# SM Apply Proposal

## Purpose

Read proposal files (Product or Technical) and create or update Stories accordingly.
SM is the execution layer that transforms proposals into actionable Stories.

## Command

```
*apply-proposal [proposal_id]
```

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| proposal_id | string | No | Specific proposal ID (e.g., PCP-2025-001 or TCP-2025-001). If omitted, auto-discover draft proposals. |

## Process

### Step 1: Determine Proposals to Process

**IF proposal_id is provided:**

1. Parse proposal type from ID prefix:
   - `PCP-*` → Product proposal in `docs/proposals/product/`
   - `TCP-*` → Technical proposal in `docs/proposals/tech/`

2. Locate and read the proposal file:
   - Pattern: `{proposal_dir}/{proposal_id}-*.md`
   - Example: `docs/proposals/product/PCP-2025-001-mvp-scope-reduction.md`

3. Validate proposal status is `draft`:
   - Read YAML frontmatter
   - IF status != "draft": Output error and **HALT**

4. Set: `proposals_to_process = [proposal]`

**ELSE (no proposal_id - auto-discover):**

Execute Step 1a: Auto-Discovery

#### Step 1a: Auto-Discovery of Draft Proposals

1. Scan product proposals directory:
   ```
   Glob: docs/proposals/product/PCP-*.md
   ```
   - For each file, read YAML frontmatter
   - Filter where status == "draft"
   - Sort by proposal_id descending (latest first)
   - Record: `latest_product_proposal`

2. Scan technical proposals directory:
   ```
   Glob: docs/proposals/tech/TCP-*.md
   ```
   - For each file, read YAML frontmatter
   - Filter where status == "draft"
   - Sort by proposal_id descending (latest first)
   - Record: `latest_tech_proposal`

3. Determine processing list:

```yaml
IF no draft proposals found:
  Output: "No pending proposals found. All proposals have been applied."
  HALT

IF only product proposal exists:
  proposals_to_process = [latest_product_proposal]

IF only tech proposal exists:
  proposals_to_process = [latest_tech_proposal]

IF both exist:
  # Check for bidirectional linkage
  product_links_to = latest_product_proposal.linkage.related_tech_proposal
  tech_links_to = latest_tech_proposal.linkage.related_product_proposal

  IF product_links_to == latest_tech_proposal.id OR tech_links_to == latest_product_proposal.id:
    # Linked proposals - process product first (product-first principle)
    proposals_to_process = [latest_product_proposal, latest_tech_proposal]
    processing_mode = "linked"
  ELSE:
    # Unlinked proposals - ask user which to process
    Output: "Found multiple unlinked draft proposals:"
    Output: "1. {latest_product_proposal.id}: {latest_product_proposal.title}"
    Output: "2. {latest_tech_proposal.id}: {latest_tech_proposal.title}"
    Output: "Which proposal should I process? (Enter 1, 2, or 'both')"
    AWAIT user_response
    # Set proposals_to_process based on response
```

### Step 2: Process Each Proposal

```
FOR EACH proposal IN proposals_to_process:
```

#### Step 2.1: Load Proposal Content

1. Read full proposal file
2. Parse YAML frontmatter for metadata and linkage
3. Extract "Story Requirements" section

#### Step 2.2: Load Context

1. Read `core-config.yaml`:
   - `devStoryLocation`: Story files directory (default: docs/stories)
   - `prdShardedLocation`: PRD/Epic location (default: docs/prd)
   - `project.mode`: monolith or multi-repo

2. Read `templates/story-tmpl.yaml` for Story format reference

3. Scan existing story files to get real story IDs:
   ```
   Glob: {devStoryLocation}/*.md
   Pattern: {epic}.{story}-*.md
   Extract: existing_story_ids = Set["{epic}.{story}" from each filename]
   ```

4. Calculate `max_story_id` for each affected Epic:
   ```
   For each epic_id in proposal.story_requirements:
     ids_in_epic = [id for id in existing_story_ids where id.startswith("{epic_id}.")]
     max_story_id[epic_id] = max(story_numbers) or 0
   ```

5. Initialize batch tracking:
   ```
   batch_assigned_ids = Set()
   ```

6. Validate Epic existence:
   ```
   For each epic_id in proposal.story_requirements:
     epic_file = Glob: {prdShardedLocation}/epic-{epic_id}-*.yaml
     IF NOT found:
       Output: "⚠️ Warning: Epic {epic_id} not found in {prdShardedLocation}/"
   ```

#### Step 2.3: Process Story Requirements

```
FOR EACH requirement IN proposal.story_requirements:
```

**IF action == "create":**

1. Determine Story ID (with collision detection):
   ```
   IF suggested_story_id provided:
     IF suggested_story_id IN existing_story_ids:
       new_id = "{epic_id}.{max_story_id[epic_id] + 1}"
     ELIF suggested_story_id IN batch_assigned_ids:
       new_id = "{epic_id}.{max_story_id[epic_id] + 1}"
     ELSE:
       new_id = suggested_story_id
   ELSE:
     new_id = "{epic_id}.{max_story_id[epic_id] + 1}"

   batch_assigned_ids.add(new_id)
   max_story_id[epic_id] = max(max_story_id[epic_id], int(new_id.split('.')[1]))
   ```

2. Similarity check against existing stories:
   ```
   existing_stories = Read: {devStoryLocation}/{epic_id}.*-*.md
   For each story in existing_stories:
     similarity = compare(story.title, requirement.title)
     IF similarity > 0.7:
       Output:
         "⚠️ Potential duplicate: '{requirement.title}' similar to Story {story.id}: '{story.title}' ({similarity}%)"
         "Consider: action=modify, target_story_id={story.id}"
   ```

3. Generate Story file using `story-tmpl.yaml`:
   - Fill Story section (As a... I want... So that...)
   - Expand `acceptance_criteria_hints` into full ACs:
     - Use Given/When/Then format where applicable
     - Ensure measurable success criteria
   - Generate Tasks with TDD structure:
     ```
     - [ ] AC{N}: {ac_title}
       - [ ] Write test for AC{N}
       - [ ] Implement to pass test
       - [ ] Verify & refactor
     ```
   - Populate Dev Notes from `technical_notes` if present
   - Set initial status: `AwaitingArchReview`

4. IF proposal contains "Risk Assessment":
   - Extract risks with severity >= "high"
   - Add to Dev Notes:
     ```
     ## Risks (from {proposal_id})
     | Risk | Severity | Mitigation |
     |------|----------|------------|
     {extracted_risks}
     ```

5. Write Story file:
   - Path: `{devStoryLocation}/{new_id}-{title_slug}.md`

6. Record: `created_stories.append(new_id)`

**IF action == "modify":**

1. Locate target Story file:
   ```
   Glob: {devStoryLocation}/{target_story_id}-*.md
   ```

2. Read existing Story content

3. Apply modifications based on `modification_type`:
   - `ac_add`: Add new AC at end of AC list, add corresponding Task
   - `ac_modify`: Update specified AC content
   - `ac_delete`: Remove AC and corresponding Task
   - `scope_change`: Update Story description and ACs

4. Update Change Log section:
   ```
   | {date} | SM | Modified | Applied proposal {proposal_id}: {change_description} |
   ```

5. Write updated Story file

6. Record: `modified_stories.append(target_story_id)`

**IF action == "delete":**

1. Locate target Story file

2. Update Story status to `Deprecated`

3. Add Change Log entry:
   ```
   | {date} | SM | → Deprecated | Deprecated via proposal {proposal_id} |
   ```

4. Record: `deprecated_stories.append(target_story_id)`

#### Step 2.4: Update Proposal Status

1. Verify processing completeness:
   ```
   total = len(proposal.story_requirements)
   processed = len(created_stories) + len(modified_stories) + len(deprecated_stories)

   IF total != processed:
     Output:
       "❌ Incomplete processing"
       "Expected: {total}, Processed: {processed}"
       "Unprocessed: {list unprocessed requirements}"
     HALT (do not update proposal status)
   ```

2. Read proposal file
3. Update frontmatter: `status: draft` → `status: applied`
4. Add to approval record:
   ```
   | {date} | SM | applied | Stories created/modified as specified |
   ```
5. Write updated proposal file

#### Step 2.5: Apply Document Changes (Optional)

**For PCP with PRD Changes:**

1. IF proposal contains "## PRD Changes" section:
   - Parse affected_sections
   - For each section:
     - Locate: `{prdShardedLocation}/section-{name}.md`
     - Apply changes OR flag for manual review
   - Record: `prd_sections_updated = [list]`

**For TCP with Architecture Changes:**

1. IF proposal contains architecture changes in "## Proposed Solution":
   - Add to each created story's Dev Notes:
     ```
     ## Architecture Context (from {proposal_id})
     - {key_decisions}
     - {api_changes}
     - {database_changes}
     ```

### Step 3: Handle Linked Proposals (if applicable)

**IF processing_mode == "linked":**

After processing the product proposal:
1. Check if product proposal created new Stories
2. When processing the linked technical proposal:
   - Technical requirements may modify Stories created by product proposal
   - OR create additional technical Stories

Ensure both proposals reference each other:
- Product proposal: `related_tech_proposal` should be set
- Technical proposal: `related_product_proposal` should be set

If not already set, update the linkage fields.

### Step 4: Generate Summary and Handoff

1. Compile processing summary:
   ```yaml
   summary:
     proposals_processed: [{proposal_ids}]
     stories_created: [{story_ids}]
     stories_modified: [{story_ids}]
     stories_deprecated: [{story_ids}]
     first_story_for_review: "{first_created_or_modified_story_id}"
   ```

2. Determine first Story for Architect review:
   - Prefer newly created Stories over modified ones
   - Order by Story ID (epic.story format)

3. Output HANDOFF to Architect

## Output

**Success:**
```yaml
result: SUCCESS
proposals_processed:
  - id: "{proposal_id}"
    type: product | technical
    status: applied
stories_created:
  - id: "{story_id}"
    title: "{story_title}"
    epic: "{epic_id}"
stories_modified:
  - id: "{story_id}"
    changes: ["{change_descriptions}"]
stories_deprecated:
  - id: "{story_id}"
first_review_story: "{story_id}"
```

**HANDOFF:**
```

🎯 HANDOFF TO ARCHITECT: *review {first_story_id}

Proposal(s) Applied:
{{#each proposals_processed}}
- {{id}}: {{title}} ({{type}})
{{/each}}

Stories Created:
{{#each stories_created}}
- Story {{id}}: {{title}}
{{/each}}

{{#if stories_modified}}
Stories Modified:
{{#each stories_modified}}
- Story {{id}}: {{changes}}
{{/each}}
{{/if}}

{{#if stories_deprecated}}
Stories Deprecated:
{{#each stories_deprecated}}
- Story {{id}}
{{/each}}
{{/if}}

Please review Story {{first_review_story}} first, then continue with remaining stories.
```

**No Proposals Found:**
```
No pending proposals found.

To create a proposal:
- For product changes: @pm *revise-prd <change_description>
- For technical changes: @architect *resolve-change <change_description>
- If unsure: @po *route-change <change_description>
```

**Error - Proposal Not Found:**
```yaml
result: ERROR
error: "Proposal {proposal_id} not found"
searched_paths:
  - docs/proposals/product/{proposal_id}-*.md
  - docs/proposals/tech/{proposal_id}-*.md
suggestion: "Verify the proposal ID and ensure the proposal file exists"
```

**Error - Invalid Status:**
```yaml
result: ERROR
error: "Proposal {proposal_id} has status '{current_status}', expected 'draft'"
suggestion: "Only draft proposals can be applied. This proposal may have already been processed."
```

## Examples

### Example 1: Apply Specific Product Proposal

**Command:** `*apply-proposal PCP-2025-003`

**Process:**
1. Locate `docs/proposals/product/PCP-2025-003-*.md`
2. Read and parse proposal
3. Process story requirements:
   - Create Story 4.1: "User data export UI"
   - Create Story 4.2: "Export format selection"
4. Update proposal status to `applied`
5. Output HANDOFF

**Output:**
```

🎯 HANDOFF TO ARCHITECT: *review 4.1

Proposal(s) Applied:
- PCP-2025-003: Data Export Feature (product)

Stories Created:
- Story 4.1: User data export UI
- Story 4.2: Export format selection

Please review Story 4.1 first, then continue with remaining stories.
```

### Example 2: Auto-Discover Linked Proposals

**Command:** `*apply-proposal` (no argument)

**Process:**
1. Scan for draft proposals
2. Find PCP-2025-003 (links to TCP-2025-004)
3. Find TCP-2025-004 (links to PCP-2025-003)
4. Process in order: PCP first, then TCP
5. Create Stories from both proposals
6. Update both proposal statuses

**Output:**
```

🎯 HANDOFF TO ARCHITECT: *review 4.1

Proposal(s) Applied:
- PCP-2025-003: Data Export Feature (product)
- TCP-2025-004: Background Job Queue System (technical)

Stories Created:
- Story 4.1: User data export UI
- Story 4.2: Export format selection
- Story 4.3: Implement job queue infrastructure
- Story 4.4: Export task processor

Please review Story 4.1 first, then continue with remaining stories.
```

### Example 3: Modify Existing Story

**Proposal Content (excerpt):**
```yaml
story_requirements:
  - epic_id: 2
    action: modify
    target_story_id: 2.3
    modification_type: ac_add
    changes:
      - type: ac_add
        content: "Account lockout after 3 failed login attempts"
```

**Result:**
- Story 2.3 updated with new AC
- Corresponding Task added
- Change Log updated

## Notes

- SM validates story ID uniqueness and detects potential duplicates (similarity > 70% triggers warning)
- Story quality assessment (`scoring-sm-story-quality.md`) should be run after Story creation
- Epic existence is validated; missing Epic triggers warning but does not block processing
- Completeness verification ensures all story_requirements are processed before marking proposal as applied
- Story file naming: `{epic}.{story}-{kebab-title}.md` (dash before slug, not dot)
- High-severity risks from proposal are automatically added to Story Dev Notes
- This task replaces the old `sm-correct-course.md` and `sm-create-tech-story.md`
