# qa-epic-integration-test

Execute cross-Story integration tests after each Story completion within an Epic.

## Purpose

Verify that Stories within the same Epic work together correctly.
Individual Stories pass QA independently, but may fail when combined.
This task catches integration bugs between Stories.

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
- Application environment is running
- E2E test files exist for completed stories

## Process

### Step 0: Check Prerequisites

1. Glob: `{story_root}/{epic_id}.*.md`
2. Read each story file and extract Status
3. Count stories with Status = Done

**If Done count < 2**:
- Log: "Only 1 completed story in Epic {epic_id}. Skipping integration test."
- Return: `integration_skipped: true, reason: 'insufficient_stories'`

### Step 1: Identify Integration Touchpoints

For each pair of Done stories in the epic, identify shared resources:

1. Read each story's `Dev Agent Record.file_list`
2. Find **overlapping files** (files modified by multiple stories)
3. Find **dependency chains** (Story A creates API, Story B consumes it)
4. Find **shared data models** (stories that touch the same DB tables/models)

```yaml
integration_touchpoints:
  - stories: ['{epic}.1', '{epic}.2']
    type: 'shared_file'
    resource: 'src/services/auth.ts'
    risk: 'Both stories modify the auth service'
  - stories: ['{epic}.1', '{epic}.3']
    type: 'api_dependency'
    resource: '/api/users'
    risk: 'Story 1 creates endpoint, Story 3 extends it'
  - stories: ['{epic}.2', '{epic}.3']
    type: 'shared_data_model'
    resource: 'User model'
    risk: 'Both stories add fields to User'
```

### Step 2: Design Cross-Story Test Scenarios

For each integration touchpoint, create a test scenario that exercises the combined flow:

```yaml
integration_scenario:
  id: 'EPIC-{epic}-INT-{SEQ}'
  stories_involved: ['{epic}.1', '{epic}.2']
  description: 'User registers (Story 1) then logs in (Story 2)'
  steps:
    - action: 'Complete Story 1 happy path'
      expected: 'User created successfully'
    - action: 'Complete Story 2 happy path using Story 1 output'
      expected: 'Login succeeds with registered credentials'
  priority: P0  # Cross-story flows are always critical
```

### Step 3: Execute Integration Tests

**Method 1: Playwright (if persisted E2E tests exist)**

Run all persisted E2E tests in sequence:
```bash
npx playwright test tests/e2e/story-{epic}.*.spec.ts --reporter=json
```

**Method 2: Manual MCP (if no persisted tests)**

Execute each integration scenario using MCP browser tools:
1. Navigate to application
2. Execute the combined user flow
3. Verify each step produces expected output
4. Capture screenshots at each step

### Step 4: Record Results

```yaml
epic_integration:
  epic_id: '{epic}'
  stories_tested: ['{epic}.1', '{epic}.2', '{epic}.3']
  touchpoints_found: {count}
  scenarios_executed: {count}
  scenarios_passed: {count}
  scenarios_failed: {count}
  issues:
    - id: 'EPIC-{epic}-INT-001'
      severity: CRITICAL
      stories_involved: ['{epic}.1', '{epic}.2']
      finding: 'Registration flow completes but login fails with registered credentials'
      evidence: '{screenshot path}'
      suggested_action: 'Verify Story 1 user creation format matches Story 2 login expectations'
```

## Output

```yaml
integration_result:
  executed: true
  epic_id: '{epic}'
  passed: true | false
  touchpoints: {count}
  scenarios_total: {count}
  scenarios_passed: {count}
  issues: [{severity, finding, evidence}]
```

## Trigger Conditions

This task should be executed:
1. **After each Story QA PASS** within an Epic (if >=2 stories Done)
2. **After the final Story** in an Epic completes (mandatory full integration)
3. **On demand** via SM or PM request
