# qa-epic-integration-test

Execute journey-driven integration tests after each Story completion within an Epic.

## Purpose

Verify that Stories within the same Epic compose into coherent user journeys.
Individual Stories pass QA independently, but may break when users traverse them in sequence.
This task catches journey breaks, missing navigation paths, and precondition failures between Stories.

## Inputs

```yaml
required:
  - epic_id: '{epic}'  # e.g., "1"
  - completed_story_id: '{epic}.{story}'  # Story that just completed
  - story_root: '{devStoryLocation}'
optional:
  - skip_if_single_story: true  # Skip if only 1 story is Done in epic
```

## Prerequisites

- At least 2 Stories in the Epic have Status = Done
- Application environment is running (for Step 3 execution)
- Done stories have User Journey Context populated (for user-facing stories)

## Process

### Step 0: Check Prerequisites

1. Glob: `{story_root}/{epic_id}.*.md`
2. Read each story file and extract Status
3. Count stories with Status = Done

**If Done count < 2**:
- Log: "Only 1 completed story in Epic {epic_id}. Skipping integration test."
- Return: `integration_skipped: true, reason: 'insufficient_stories'`

### Step 1: Build User Journey Graph

For each Done story in the epic:

1. **Extract Journey Data**: Read the "User Journey Context" dev-notes section
   - Entry Points: `{source_story, navigation_path, precondition}`
   - Exit Points: `{target_story, navigation_path, state_passed}`
   - Precondition Traceability: `{ac_id, given_clause, source_story}`
   - Unmet Precondition Handling: `{precondition, fallback_behavior}`

2. **Build Directed Graph**: Map story connections
   ```yaml
   journey_graph:
     nodes:
       - story_id: '{epic}.1'
         is_user_facing: true
         entry_points: [{source, path}]
         exit_points: [{target, path}]
       - story_id: '{epic}.2'
         is_user_facing: false  # No journey context → technical story
     edges:
       - from: '{epic}.1'
         to: '{epic}.2'
         type: 'exit_to_entry'
         navigation: '{path description}'
         state_passed: '{data/state}'
   ```

3. **Identify Non-User-Facing Stories**: Stories without User Journey Context are technical — include them only in the secondary touchpoint analysis (Step 3b).

### Step 2: Identify Journey Chains

1. **Find Entry Nodes**: Stories with no inbound edges or with entry points from outside the epic (e.g., homepage, external link)

2. **Find Terminal Nodes**: Stories with no outbound edges (user journey ends here)

3. **Trace All Paths**: From each entry node, follow edges to build complete chains:
   ```yaml
   journey_chains:
     - chain_id: 'CHAIN-{epic}-{SEQ}'
       path: ['{epic}.1', '{epic}.3', '{epic}.5']
       status: fully_testable  # All stories Done
       description: 'User registers → verifies email → accesses dashboard'
     - chain_id: 'CHAIN-{epic}-{SEQ}'
       path: ['{epic}.1', '{epic}.4']
       status: partially_testable  # Story {epic}.4 not yet Done
       missing_stories: ['{epic}.4']
   ```

4. **Detect Breaks** (static analysis):
   - **Broken link**: Exit points to story IDs that don't exist in the epic
   - **Orphan story**: User-facing story with no inbound AND no outbound journey connections
   - **Missing entry**: Story assumes a precondition no other story establishes
   - **Dead end**: Story has entry points but no exit points (user has no next step)

### Step 3: Execute Journey Tests

**For each fully testable chain**:

#### 3a. Journey Flow Test (Primary)

1. Start from the chain's real entry point (e.g., homepage, login page)
2. Walk through each story's functionality in sequence:
   - Execute the happy path of Story N
   - Verify navigation to Story N+1 exists (button, link, redirect)
   - Verify data/state passes correctly between stories
   - Verify the GIVEN precondition of Story N+1 is satisfied by Story N's THEN
3. At each transition, verify:
   - Navigation path exists and works
   - Required state/data is available
   - No authentication/authorization gaps
4. Test precondition failure handling:
   - For each defined fallback, trigger the failure condition
   - Verify fallback behavior works (redirect, error message, empty state)

#### 3b. Technical Touchpoint Analysis (Secondary)

For all Done stories (including non-user-facing), check traditional integration points:

1. Read each story's `Dev Agent Record.file_list`
2. Find **overlapping files** (files modified by multiple stories)
3. Find **dependency chains** (Story A creates API, Story B consumes it)
4. Find **shared data models** (stories that touch the same DB tables/models)

```yaml
technical_touchpoints:
  - stories: ['{epic}.1', '{epic}.2']
    type: 'shared_file'
    resource: 'src/services/auth.ts'
    risk: 'Both stories modify the auth service'
  - stories: ['{epic}.1', '{epic}.3']
    type: 'api_dependency'
    resource: '/api/users'
    risk: 'Story 1 creates endpoint, Story 3 extends it'
```

**Execution**: For each touchpoint, verify the combined behavior:
- Shared files: check for conflicting modifications
- API dependencies: verify contract compatibility
- Shared models: verify field additions don't break existing consumers

### Step 4: Detect Breaks (Static Analysis Summary)

Even without running the app, compile all journey breaks found:

```yaml
journey_breaks:
  disconnected_nodes:
    - story_id: '{epic}.3'
      issue: 'No inbound journey connections — users cannot reach this story'
  missing_entry_points:
    - story_id: '{epic}.2'
      precondition: 'User has completed onboarding'
      issue: 'No story in this epic establishes onboarding completion'
  missing_exit_paths:
    - story_id: '{epic}.4'
      issue: 'Story ends with success message but no next-step navigation'
  broken_links:
    - from_story: '{epic}.1'
      to_story: '{epic}.6'
      issue: 'Exit points to Story {epic}.6 which does not exist'
```

### Step 5: Record Results

```yaml
epic_integration:
  epic_id: '{epic}'
  stories_tested: ['{epic}.1', '{epic}.2', '{epic}.3']

  # Journey results
  journey_graph:
    nodes: {count}
    edges: {count}
    chains_identified: {count}
    chains_fully_testable: {count}

  journey_tests:
    chains_executed: {count}
    chains_passed: {count}
    chains_failed: {count}
    journey_coverage: '{chains_tested / chains_identified}%'

  journey_breaks:
    disconnected_nodes: {count}
    missing_entry_points: {count}
    missing_exit_paths: {count}
    broken_links: {count}
    total_breaks: {count}

  # Technical touchpoint results
  technical_touchpoints:
    touchpoints_found: {count}
    touchpoints_verified: {count}
    touchpoints_failed: {count}

  # Per-chain detail
  chain_results:
    - chain_id: 'CHAIN-{epic}-001'
      path: ['{epic}.1', '{epic}.2']
      result: PASS | FAIL
      evidence: ['{screenshot paths}']
      issues: []
    - chain_id: 'CHAIN-{epic}-002'
      path: ['{epic}.1', '{epic}.3']
      result: FAIL
      evidence: ['{screenshot paths}']
      issues:
        - severity: CRITICAL
          finding: 'Navigation from Story 1 success page to Story 3 entry does not exist'
          suggested_action: 'Add redirect or link from registration success to email verification'

  # Overall
  issues:
    - id: 'EPIC-{epic}-INT-001'
      type: journey_break | touchpoint_conflict
      severity: CRITICAL | HIGH | MEDIUM
      stories_involved: ['{epic}.1', '{epic}.2']
      finding: '{description}'
      evidence: '{screenshot path or analysis detail}'
      suggested_action: '{recommendation}'
```

## Output

```yaml
integration_result:
  executed: true
  epic_id: '{epic}'
  passed: true | false
  journey_coverage: '{percentage}'
  chains_total: {count}
  chains_passed: {count}
  journey_breaks: {count}
  touchpoints_verified: {count}
  issues: [{type, severity, finding, evidence}]
```

## Trigger Conditions

This task should be executed:
1. **After each Story QA PASS** within an Epic (if >=2 stories Done)
2. **After the final Story** in an Epic completes (mandatory full integration)
3. **On demand** via SM or PM request
