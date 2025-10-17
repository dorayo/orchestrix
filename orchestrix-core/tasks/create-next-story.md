# Create Next Story Task

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- For existing stories: status must be `Blocked` or `RequiresRevision`
- On failure: HALT with error

## Execution

### 1. Load Configuration

Load `{root}/core-config.yaml`. If missing: HALT with "core-config.yaml not found".

Extract: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

### 2. Identify Next Story

1. Locate epic files via `prdSharded` config
2. Load highest `{epicNum}.{storyNum}.story.md` from `devStoryLocation`
3. If story exists:
   - Verify status is 'Done', else alert incomplete story
   - Select next sequential story in current epic
   - If epic complete, prompt: "Epic {epicNum} Complete. Options: 1) Begin Epic {epicNum+1} 2) Select specific story 3) Cancel"
   - NEVER auto-skip epics
4. If no stories: next is 1.1
5. Announce: "Identified next story: {epicNum}.{storyNum} - {Title}"

### 3. Gather Requirements

1. Extract requirements from epic file
2. If previous story exists, review Dev Agent Record for insights
3. Extract relevant information for current story

### 4. Load Architecture Context

Execute `{root}/tasks/utils/load-architecture-context.md`:
- `story_type`: From epic (Backend | Frontend | FullStack)
- `architecture_sharded`: From config
- `architecture_location`: From config

Use returned `context` for Dev Notes. Cite sources: `[Source: docs/architecture/{file}.md#{section}]`

### 5. Verify Structure Alignment

Cross-reference requirements with `context.file_structure`. Document conflicts in "Project Structure Notes".

### 6. Populate Story Template

Create `{devStoryLocation}/{epicNum}.{storyNum}.story.md` using `{root}/templates/story-tmpl.yaml`:
- Fill all sections per template
- Use `context` from Step 4 for Dev Notes
- Include structure alignment from Step 5
- Follow Field-Level API Contract format for API/shared data stories

### 7. Quality Assessment

Execute `{root}/tasks/execute-checklist.md`:
- Checklist: `{root}/checklists/assessment/sm-story-quality.md`
- Context: Story file from Step 6

Extract from result:
- `quality_score` (0-10)
- `complexity_indicators`
- `security_sensitive`
- Structure validation status (must be 100%)
- Technical quality status (must be ≥80%)

If validation fails: Set Status = `Blocked`, document in Change Log, HALT

### 8. Execute Decisions

Run via `{root}/tasks/make-decision.md`:

**A. Architect Review:**
- Type: `sm-architect-review-needed`
- Context: `quality_score`, `complexity_indicators`
- Store result as `architect_review_decision`

**B. Test Design Level:**
- Type: `sm-test-design-level`
- Context: `complexity_indicators`, `quality_score`, `security_sensitive`
- Store result as `test_design_decision`

**C. Story Status:**
- Type: `sm-story-status`
- Context: `architect_review_result`, `test_design_level`
- Apply: Set story status to `result.next_status`

### 9. Record Change Log

Add entry to Story Change Log:
- Story creation action
- Quality assessment summary
- Decision results with reasoning
- Final status and next action

### 10. Output Handoff

Based on `next_action` from Step 8C, output the appropriate handoff message:

- If `next_action` = `handoff_to_architect`:
  ```
  Next: Architect please execute command `review-story {epicNum}.{storyNum}`
  ```

- If `next_action` = `handoff_to_dev`:
  ```
  Next: Dev please execute command `implement-story {epicNum}.{storyNum}`
  ```

- If `next_action` = `handoff_to_qa_test_design`:
  ```
  Next: QA please execute command `test-design {epicNum}.{storyNum}`
  ```

- If `next_action` = `sm_revise_story`:
  ```
  Story blocked - SM must revise before proceeding
  ```


