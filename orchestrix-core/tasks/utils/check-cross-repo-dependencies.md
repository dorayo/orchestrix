# Check Cross-Repo Dependencies (Utility)

## Purpose

Automatically check if cross-repository dependencies for a story are satisfied. This utility is used by SM and Dev agents to prevent creating/implementing stories when their dependencies are not yet complete.

**Stage**: Stage 2 (Automation)

## Input Parameters

- `story_id`: Story ID (e.g., "1.2")
- `story_definition`: Story object from Epic YAML (contains dependencies, repository, etc.)
- `current_repo_id`: Current repository ID (e.g., "my-ecommerce-web")
- `product_repo_path`: Absolute path to product repository
- `all_stories`: Array of all stories from all epics (for lookup)

## Execution Logic

### Step 1: Check if Story Has Dependencies

```
if story_definition.dependencies is empty OR null:
  return {
    status: "no_dependencies",
    message: "Story has no dependencies",
    blocking_dependencies: []
  }
```

### Step 2: Identify Cross-Repo Dependencies

```
cross_repo_deps = []

for each dep_id in story_definition.dependencies:
  dep_story = find story in all_stories where story.id == dep_id

  if dep_story is null:
    return {
      status: "error",
      message: "Dependency story not found: ${dep_id}",
      blocking_dependencies: [dep_id]
    }

  if dep_story.repository != current_repo_id:
    cross_repo_deps.push({
      story_id: dep_id,
      story_title: dep_story.title,
      repository: dep_story.repository
    })
```

If `cross_repo_deps` is empty:
```
return {
  status: "same_repo_only",
  message: "All dependencies are in the same repository",
  blocking_dependencies: []
}
```

### Step 3: Check Each Cross-Repo Dependency Status

For each dependency in `cross_repo_deps`:

#### 3.1 Resolve Dependency Repository Path

```
dep_repo_name = dep_story.repository
# Extract last part: "my-ecommerce-backend" → "backend"
dep_repo_type = extract_last_segment(dep_repo_name, '-')

# Construct path: product_repo/../backend
dep_repo_path = resolve_path(product_repo_path, '..', dep_repo_type)

if directory_not_exists(dep_repo_path):
  return {
    status: "error",
    message: "Dependency repository not found: ${dep_repo_path}",
    blocking_dependencies: [dep_story.id]
  }
```

#### 3.2 Load Dependency Story File

```
# Pattern: docs/stories/{dep_id}-*/story.md
story_pattern = "${dep_repo_path}/docs/stories/${dep_id}-*/story.md"
story_files = glob(story_pattern)

if story_files is empty:
  # Dependency story not yet created
  return {
    status: "blocked",
    message: "Dependency story ${dep_id} has not been created yet",
    blocking_dependencies: [{
      story_id: dep_id,
      story_title: dep_story.title,
      repository: dep_story.repository,
      repository_path: dep_repo_path,
      status: "not_created",
      action: "Wait for ${dep_story.repository} team to create story ${dep_id}"
    }]
  }

story_file_path = story_files[0]
```

#### 3.3 Extract Status from Story File

```
story_content = read_file(story_file_path)

# Extract status line: **Status**: Done
status_match = regex_match(story_content, /\*\*Status\*\*:\s*(\w+)/)

if status_match is null:
  return {
    status: "error",
    message: "Cannot extract status from ${story_file_path}",
    blocking_dependencies: [dep_id]
  }

dep_status = status_match[1]
```

#### 3.4 Check if Status is "Done"

```
if dep_status != "Done":
  blocking_deps.push({
    story_id: dep_id,
    story_title: dep_story.title,
    repository: dep_story.repository,
    repository_path: dep_repo_path,
    status: dep_status,
    story_file: story_file_path,
    action: "Wait for ${dep_story.repository} team to complete story ${dep_id} (current status: ${dep_status})"
  })
```

### Step 4: Return Final Result

If `blocking_deps` is not empty:
```
return {
  status: "blocked",
  message: "Story is blocked by ${blocking_deps.length} incomplete cross-repo dependencies",
  blocking_dependencies: blocking_deps
}
```

If all dependencies are satisfied:
```
return {
  status: "satisfied",
  message: "All ${cross_repo_deps.length} cross-repo dependencies are satisfied (Status: Done)",
  satisfied_dependencies: cross_repo_deps.map(dep => ({
    story_id: dep.story_id,
    repository: dep.repository,
    status: "Done"
  }))
}
```

## Output Format

### Success (No Dependencies)
```yaml
status: "no_dependencies"
message: "Story has no dependencies"
blocking_dependencies: []
```

### Success (Same Repo Only)
```yaml
status: "same_repo_only"
message: "All dependencies are in the same repository"
blocking_dependencies: []
```

### Success (All Satisfied)
```yaml
status: "satisfied"
message: "All 2 cross-repo dependencies are satisfied (Status: Done)"
satisfied_dependencies:
  - story_id: "1.1"
    repository: "my-ecommerce-backend"
    status: "Done"
```

### Blocked (Incomplete Dependencies)
```yaml
status: "blocked"
message: "Story is blocked by 1 incomplete cross-repo dependencies"
blocking_dependencies:
  - story_id: "1.1"
    story_title: "Backend - User Registration and Login API"
    repository: "my-ecommerce-backend"
    repository_path: "/path/to/backend"
    status: "InProgress"  # or "not_created"
    story_file: "/path/to/backend/docs/stories/1.1-backend-user-auth/story.md"
    action: "Wait for my-ecommerce-backend team to complete story 1.1 (current status: InProgress)"
```

### Error
```yaml
status: "error"
message: "Dependency story not found: 1.1"
blocking_dependencies: ["1.1"]
```

## Usage in Tasks

### SM Agent: create-next-story.md

Replace **Step 2.4 (Manual Warning)** with automated check:

```markdown
#### 2.4 Check Cross-Repo Dependencies (Stage 2: Automated)

Execute: `{root}/tasks/utils/check-cross-repo-dependencies.md`

Input:
- story_id: next_story.id
- story_definition: next_story_definition
- current_repo_id: config.project.repository_id
- product_repo_path: resolved_product_repo_path
- all_stories: all_stories (from Step 2.1)

Result: dependency_check_result

**If dependency_check_result.status = "blocked"**:
```
❌ CANNOT CREATE STORY - BLOCKED BY DEPENDENCIES

Story ${next_story.id} "${next_story.title}" is blocked by ${dependency_check_result.blocking_dependencies.length} incomplete dependencies:

{{#each dependency_check_result.blocking_dependencies}}
- Story {{this.story_id}} "{{this.story_title}}" (Repository: {{this.repository}})
  Status: {{this.status}}
  Location: {{this.story_file}}
  Action: {{this.action}}
{{/each}}

HALT: Cannot proceed until all dependencies are satisfied.
```

**If dependency_check_result.status = "satisfied"**:
```
✅ All cross-repo dependencies satisfied!
{{#each dependency_check_result.satisfied_dependencies}}
- Story {{this.story_id}} ({{this.repository}}): ✓ Done
{{/each}}

Proceeding with story creation...
```

**If dependency_check_result.status = "no_dependencies" or "same_repo_only"**:
Continue to next step.
```

### Dev Agent: implement-story.md

Add dependency check before implementation:

```markdown
### Step 0.5: Check Cross-Repo Dependencies (Stage 2)

**If project.type IN [backend, frontend, ios, android]**:

Execute: `{root}/tasks/utils/check-cross-repo-dependencies.md`

If result.status = "blocked":
  HALT with dependency error message

If result.status = "satisfied" or "no_dependencies":
  Announce: "✓ All dependencies satisfied, proceeding with implementation"
```

## Implementation

This utility should be implemented as a JavaScript module:
- Path: `{root}/utils/dependency-checker.js`
- Export: `async function checkCrossRepoDependencies(params)`
- Can be called directly by agents via Node.js execution

## Error Handling

- **Dependency story not found in epic**: Error status, list missing story ID
- **Dependency repository not found**: Error status, provide expected path
- **Story file not found**: Blocked status with "not_created"
- **Cannot parse status**: Error status, provide file path for manual check
- **Invalid input**: Error status with clear message

## Performance Considerations

- Cache epic YAML loading (already loaded by SM in Step 2.1)
- Use glob patterns for efficient story file lookup
- Parallel status checks for multiple dependencies (if needed in future)

---

**END OF UTILITY TASK**
