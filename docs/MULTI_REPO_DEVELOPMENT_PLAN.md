# Multi-Repository Development Plan

**Version**: 1.0.0
**Date**: 2025-01-14
**Target Completion**: 3 Phases (6-8 weeks)

## 🎯 Executive Summary

This document provides a detailed implementation plan for adding multi-repository support to Orchestrix, divided into 3 stages over 6-8 weeks.

**Expected Outcomes**:

- ✅ Support frontend-backend separation and multi-platform development
- ✅ Centralized product planning with distributed development
- ✅ API-first development workflow
- ✅ 100% backward compatibility with monorepo projects

---

## 📅 Timeline Overview

| Stage                   | Duration  | Deliverables             | Milestone                            |
| ----------------------- | --------- | ------------------------ | ------------------------------------ |
| **Stage 1: MVP**        | 2 weeks   | Basic multi-repo support | Can create stories in separate repos |
| **Stage 2: Automation** | 2-3 weeks | Auto dependency tracking | Cross-repo coordination automated    |
| **Stage 3: Advanced**   | 2-3 weeks | Contract-first workflow  | Production-ready multi-repo system   |

**Total Duration**: 6-8 weeks

---

## 🏗️ Stage 1: Foundation (MVP) - 2 Weeks

### Objectives

1. ✅ Enable project type configuration (monolith, backend, frontend, ios, android)
2. ✅ Support product repository reference from implementation repos
3. ✅ Create API contracts template
4. ✅ Define Epic cross-repo story mapping format
5. ✅ Manual cross-repo dependency checking

### Week 1: Core Infrastructure

#### Task 1.1: Project Type Configuration (2 days)

**Files to Modify**:

1. `orchestrix-core/core-config.yaml`
2. `tools/installer/lib/config-loader.js`

**Detailed Steps**:

**Step 1: Update core-config.yaml Schema**

```yaml
# orchestrix-core/core-config.yaml

# Add new project configuration section
project:
  name: "My Project" # Existing

  # ✅ NEW: Project type
  type: monolith # Options: monolith | product-planning | backend | frontend | ios | android | flutter | react-native
  # Default: monolith (backward compatible)

  # ✅ NEW: Product repository reference (for implementation repos)
  product_repo:
    enabled: false # Set to true for implementation repos
    path: "" # Relative or absolute path to product repo
    # Example: ../my-product

  # ✅ NEW: Repository identification
  repository_id: "" # Unique ID for this repo (e.g., my-product-backend)

  # ✅ NEW: Story assignment configuration
  story_assignment:
    auto_filter: false # Stage 1: Manual, Stage 2: Auto
    assigned_stories: [] # Empty = all stories, or list like [1.1, 1.4, 2.1]

# Existing fields remain unchanged
version: "1.0.0"

document_locations:
  prd: docs/prd.md
  architecture: docs/architecture
  # ... existing fields ...
```

**Step 2: Add Default Values in Config Loader**

```javascript
// tools/installer/lib/config-loader.js

function loadConfig(configPath) {
  const config = yaml.load(fs.readFileSync(configPath, "utf8"));

  // Apply defaults for backward compatibility
  if (!config.project) {
    config.project = {};
  }

  // Default project type to monolith
  if (!config.project.type) {
    config.project.type = "monolith";
  }

  // Default product_repo to disabled
  if (!config.project.product_repo) {
    config.project.product_repo = {
      enabled: false,
      path: "",
    };
  }

  // Default story_assignment
  if (!config.project.story_assignment) {
    config.project.story_assignment = {
      auto_filter: false,
      assigned_stories: [],
    };
  }

  return config;
}
```

**Step 3: Add Product Repo Path Resolution**

```javascript
// tools/installer/lib/config-loader.js

function resolveDocumentPaths(config) {
  // If product repo is enabled, override document paths
  if (config.project?.product_repo?.enabled) {
    const productPath = config.project.product_repo.path;

    // Resolve relative path
    const absoluteProductPath = path.isAbsolute(productPath) ? productPath : path.resolve(process.cwd(), productPath);

    // Override document locations to point to product repo
    config.document_locations = {
      ...config.document_locations,
      prd: path.join(absoluteProductPath, "docs/prd.md"),
      architecture: path.join(absoluteProductPath, "docs/architecture"),
      api_contracts: path.join(absoluteProductPath, "docs/architecture/api-contracts.md"),
      epics: path.join(absoluteProductPath, "docs/epics"),
      // Local paths for stories remain in implementation repo
      devStoryLocation: config.document_locations.devStoryLocation || "docs/stories",
    };
  }

  return config;
}

// Export for use in agents
module.exports = {
  loadConfig,
  resolveDocumentPaths,
};
```

**Testing**:

- ✅ Verify monolith project loads with default values
- ✅ Verify multi-repo project resolves product repo paths correctly
- ✅ Test relative and absolute product repo paths

**Deliverable**: Configuration system supports project types and product repo references.

---

#### Task 1.2: API Contracts Template (1 day)

**Files to Create**:

1. `orchestrix-core/templates/api-contracts-tmpl.yaml`

**Detailed Steps**:

**Step 1: Create Template File**

Full template content provided in design document (Section 1.2).

Key sections:

- Authentication APIs (login, register, logout)
- User Management APIs
- Components/Schemas definitions
- Error codes reference
- Change log

**Step 2: Add Template to Installer**

```javascript
// tools/installer/lib/installer.js

async function installTemplates() {
  const templates = [
    "story-tmpl.yaml",
    "prd-tmpl.yaml",
    // ... existing templates ...
    "api-contracts-tmpl.yaml", // ✅ NEW
  ];

  for (const template of templates) {
    await copyTemplate(template);
  }
}
```

**Testing**:

- ✅ Verify template is copied during installation
- ✅ Verify template can be loaded and rendered
- ✅ Test Architect can use template to generate api-contracts.md

**Deliverable**: API contracts template ready for use.

---

#### Task 1.3: Epic Story Mapping Schema (1 day)

**Files to Create**:

1. `orchestrix-core/data/epic-story-mapping-schema.yaml`

**Detailed Steps**:

**Step 1: Create Schema File**

Full schema content provided in design document (Section 1.3).

Key fields:

- `epic_id`, `title`, `description`
- `target_repositories` (list of repos involved)
- `stories` array with:
  - `id`, `title`, `repository`, `repository_type`
  - `dependencies` (cross-repo dependencies)
  - `provides_apis` / `consumes_apis`
  - `deliverables`, `priority`

**Step 2: Add Validation Utility**

```javascript
// tools/validators/epic-validator.js (NEW)

const Ajv = require("ajv");

function validateEpic(epicData) {
  const ajv = new Ajv();

  const schema = loadYaml("orchestrix-core/data/epic-story-mapping-schema.yaml");

  const validate = ajv.compile(schema.epic);
  const valid = validate(epicData);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors,
    };
  }

  // Additional validations
  const customValidations = [
    validateNoCyclicDependencies(epicData),
    validateAllDependenciesExist(epicData),
    validateRepositoryTypes(epicData),
    validateAPIReferences(epicData),
  ];

  const customErrors = customValidations.filter((v) => !v.valid);

  return {
    valid: customErrors.length === 0,
    errors: customErrors.flatMap((e) => e.errors || []),
  };
}

function validateNoCyclicDependencies(epic) {
  // Detect cycles in dependency graph
  const visited = new Set();
  const stack = new Set();

  function hasCycle(storyId) {
    if (stack.has(storyId)) return true;
    if (visited.has(storyId)) return false;

    visited.add(storyId);
    stack.add(storyId);

    const story = epic.stories.find((s) => s.id === storyId);
    if (story && story.dependencies) {
      for (const depId of story.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }

    stack.delete(storyId);
    return false;
  }

  for (const story of epic.stories) {
    if (hasCycle(story.id)) {
      return {
        valid: false,
        errors: [`Cyclic dependency detected involving story ${story.id}`],
      };
    }
  }

  return { valid: true };
}

function validateAllDependenciesExist(epic) {
  const storyIds = new Set(epic.stories.map((s) => s.id));
  const errors = [];

  for (const story of epic.stories) {
    if (story.dependencies) {
      for (const depId of story.dependencies) {
        if (!storyIds.has(depId)) {
          errors.push(`Story ${story.id} depends on non-existent story ${depId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validateEpic };
```

**Testing**:

- ✅ Validate correct epic YAML passes validation
- ✅ Detect cyclic dependencies
- ✅ Detect missing dependency references
- ✅ Validate repository types

**Deliverable**: Epic story mapping schema with validation.

---

### Week 1 Summary

**Completed**:

- ✅ Project type configuration system
- ✅ API contracts template
- ✅ Epic story mapping schema and validation

**Ready for**:

- Week 2: Agent and task modifications

---

### Week 2: Agent and Task Modifications

#### Task 1.4: PO Agent - Epic Sharding (2 days)

**Files to Modify**:

1. `orchestrix-core/agents/po.src.yaml`
2. `orchestrix-core/tasks/po-shard-documents.md`

**Detailed Steps**:

**Step 1: Update PO Agent Configuration**

```yaml
# orchestrix-core/agents/po.src.yaml

commands:
  - name: shard-documents
    syntax: "*shard-documents"
    description: "Shard PRD into Epics with cross-repo story mapping (multi-repo) or single-repo epics (monolith)"
    task: tasks/po-shard-documents.md
    context:
      - Load project.type from core-config.yaml
      - If type = product-planning: Create epic YAML files with cross-repo mapping
      - If type = monolith: Use existing single-repo epic format (markdown)
      - Reference: data/epic-story-mapping-schema.yaml for YAML format
      - Validate all dependencies and API references
```

**Step 2: Modify po-shard-documents.md**

Full task content provided in design document (Section 1.4).

Key additions:

1. **Detect project type** at start
2. **Multi-repo logic**:
   - Identify target repositories from architecture
   - Assign stories to repositories
   - Define cross-repo dependencies
   - Map API providers/consumers
   - Create YAML epic files
3. **Validation**:
   - Cross-repo dependency validation
   - API contract validation
   - Repository validation
4. **Handoff**:
   - Multi-repo: List stories per repository
   - Monolith: Existing handoff to SM

**Step 3: Create Example Epic**

```yaml
# Example: my-product/docs/epics/epic-1-user-auth.yaml

epic_id: 1
title: "User Authentication"
description: |
  Implement complete user authentication system across all platforms.

target_repositories: [my-product-backend, my-product-web, my-product-ios]

stories:
  - id: "1.1"
    title: "Backend - User API"
    repository: "my-product-backend"
    repository_type: backend
    dependencies: []
    provides_apis:
      - "POST /api/users"
      - "POST /api/auth/login"
    deliverables:
      - "User model and database"
      - "Registration endpoint"
      - "Login endpoint with JWT"
      - "Unit tests (>80% coverage)"
    priority: P0

  - id: "1.2"
    title: "Frontend - Login UI"
    repository: "my-product-web"
    repository_type: frontend
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/auth/login"
    deliverables:
      - "Login page component"
      - "Auth context provider"
      - "E2E tests"
    priority: P0
```

**Testing**:

- ✅ Verify monolith projects create markdown epics (existing behavior)
- ✅ Verify product-planning projects create YAML epics
- ✅ Validate epic YAML structure
- ✅ Test dependency validation
- ✅ Test API reference validation

**Deliverable**: PO can create cross-repo epic mappings.

---

#### Task 1.5: SM Agent - Repository-Aware Story Creation (2 days)

**Files to Modify**:

1. `orchestrix-core/agents/sm.src.yaml`
2. `orchestrix-core/tasks/sm-create-story.md`

**Detailed Steps**:

**Step 1: Update SM Agent Persona**

```yaml
# orchestrix-core/agents/sm.src.yaml

agent:
  id: sm
  name: Scrum Master
  persona: |
    You are the Scrum Master responsible for creating and managing user stories
    in this repository.

    **Repository Awareness**:
    - Check project.type from core-config.yaml at the start of every task
    - If type = monolith: Create all stories (existing behavior)
    - If type ∈ {backend, frontend, ios, android}:
      * You are in an implementation repository
      * Only create stories assigned to THIS repository
      * Load epic definitions from product repository
      * Check cross-repo dependencies before creating stories
      * Warn user if dependencies are not complete (Stage 1: Manual warning)

    **Multi-Repo Workflow**:
    1. Load all epic YAML files from ${product_repo}/docs/epics/
    2. Filter stories where repository = ${project.repository_id}
    3. Identify next story to create (lowest ID not yet created)
    4. Check dependencies: If story depends on other repos, display warning
    5. Create story using template from epic definition

commands:
  - name: create-next-story
    syntax: "*create-next-story"
    task: tasks/sm-create-story.md
    context:
      - Load project type and repository ID from core-config.yaml
      - Load epic definitions from product repo (if multi-repo)
      - Filter stories by repository assignment (if multi-repo)
      - Check cross-repo dependencies (Stage 1: Manual reminder)
      - Reference: data/epic-story-mapping-schema.yaml
```

**Step 2: Modify sm-create-story.md**

Full task content provided in design document (Section 1.5).

Key sections to add:

````markdown
## 0. Repository Type Detection

**Read core-config.yaml**:

- Extract project.type
- Extract project.repository_id
- Extract project.product_repo.path (if multi-repo)

**Determine mode**:

- If type = monolith: Use existing single-repo logic (SKIP to existing Step 1)
- If type = product-planning: ERROR - Cannot create stories in product repo
- If type ∈ {backend, frontend, ios, android}: **MULTI-REPO MODE** ✅

---

## 1. Load Epic Definitions (Multi-Repo Mode)

### 1.1 Load Epic YAML Files

```bash
PRODUCT_REPO=${project.product_repo.path}
EPICS_DIR=${PRODUCT_REPO}/docs/epics

# Load all epic-*.yaml files
for epic_file in ${EPICS_DIR}/epic-*.yaml; do
  epics+=("$(cat $epic_file | yq)")
done
```
````

### 1.2 Filter Stories for Current Repository

```javascript
const currentRepoId = config.project.repository_id; // e.g., "my-product-backend"

const allStories = epics.flatMap((epic) => epic.stories);

const myStories = allStories.filter((story) => story.repository === currentRepoId);

console.log(`Found ${myStories.length} stories assigned to ${currentRepoId}`);
```

### 1.3 Identify Next Story to Create

```javascript
const existingStories = fs.readdirSync("docs/stories/");
const existingIds = existingStories
  .map((dir) => {
    // Extract story ID from directory name (e.g., "1.1-backend-user-api")
    const match = dir.match(/^(\d+\.\d+)-/);
    return match ? match[1] : null;
  })
  .filter(Boolean);

const nextStory = myStories
  .filter((story) => !existingIds.includes(story.id))
  .sort((a, b) => {
    // Sort by story ID (1.1 < 1.2 < 2.1)
    const [aEpic, aStory] = a.id.split(".").map(Number);
    const [bEpic, bStory] = b.id.split(".").map(Number);
    return aEpic - bEpic || aStory - bStory;
  })[0];

if (!nextStory) {
  console.log("✅ All stories for this repository have been created!");
  exit(0);
}
```

---

## 2. Check Cross-Repo Dependencies (Stage 1: Manual)

```javascript
if (nextStory.dependencies && nextStory.dependencies.length > 0) {
  console.log("\n⚠️  CROSS-REPO DEPENDENCY DETECTED\n");

  console.log(`Story ${nextStory.id} "${nextStory.title}" depends on:\n`);

  for (const depId of nextStory.dependencies) {
    // Find dependency story
    const depStory = allStories.find((s) => s.id === depId);

    console.log(`  - Story ${depId} "${depStory.title}"`);
    console.log(`    Repository: ${depStory.repository}`);

    if (depStory.repository !== currentRepoId) {
      console.log(`    ⚠️  Different repository - Manual verification required`);
    }
  }

  console.log("\n❗ MANUAL ACTION REQUIRED:");
  console.log("Before creating this story, verify that all dependencies are complete.\n");

  console.log("Steps:");
  for (const depId of nextStory.dependencies) {
    const depStory = allStories.find((s) => s.id === depId);
    const depRepoPath = `../${depStory.repository}`; // Assuming sibling directories

    console.log(`  1. Navigate to ${depRepoPath}`);
    console.log(`  2. Check story status: docs/stories/${depId}-*/story.md`);
    console.log(`  3. Verify Status = Done\n`);
  }

  console.log("If any dependency is not Done, DO NOT create this story yet.\n");
  console.log("Continue creating story? (User must manually verify dependencies)");
  // In Stage 1, agent assumes user has verified
}
```

---

## 3. Load Story Template from Epic

```javascript
const storyTemplate = {
  story_id: nextStory.id,
  title: nextStory.title,
  repository: nextStory.repository,
  repository_type: nextStory.repository_type,
  epic_id: currentEpic.epic_id,
  epic_title: currentEpic.title,
  deliverables: nextStory.deliverables,
  priority: nextStory.priority,
  provides_apis: nextStory.provides_apis || [],
  consumes_apis: nextStory.consumes_apis || [],
  dependencies: nextStory.dependencies || [],
  api_contracts_path: `${productRepo}/docs/architecture/api-contracts.md`,
};

// Render story template
const storyContent = renderStoryTemplate(storyTemplate);
```

**Add to story file**:

```markdown
## Multi-Repo Context

- **Repository**: {{repository}}
- **Repository Type**: {{repository_type}}
- **Epic**: Epic {{epic_id}} - {{epic_title}}

{{#if provides_apis}}

### APIs Provided by This Story

{{#each provides_apis}}

- `{{this}}` - See [API Contracts]({{../api_contracts_path}})
  {{/each}}

**Responsibility**: This story MUST implement these APIs exactly as defined in the API contract.
{{/if}}

{{#if consumes_apis}}

### APIs Consumed by This Story

{{#each consumes_apis}}

- `{{this}}` - Defined in [API Contracts]({{../api_contracts_path}})
  {{/each}}

**Responsibility**: This story MUST consume these APIs exactly as defined in the API contract.
{{/if}}

{{#if dependencies}}

### Cross-Repo Dependencies

⚠️ This story depends on the following stories being completed first:

{{#each dependencies}}

- **Story {{this}}** (Repository: {{lookup ../dependency_repos this}})
  - Must be Status = Done before starting this story
  - Check status: `../${repository}/docs/stories/{{this}}-*/story.md`
    {{/each}}
    {{/if}}

---

[Rest of story template continues as normal...]
```

---

## 4. Continue with Existing Story Creation Logic

After multi-repo-specific setup, continue with:

- Technical Preferences extraction (existing logic)
- Structure validation
- Quality assessment
- Architect review routing
- Status initialization
- Handoff output

**No changes needed** to these sections.

````

**Testing**:
- ✅ Monolith mode: Verify existing behavior unchanged
- ✅ Multi-repo mode: Verify SM loads epics from product repo
- ✅ Verify SM filters stories by repository
- ✅ Verify cross-repo dependency warning is displayed
- ✅ Verify story template includes multi-repo context

**Deliverable**: SM can create repository-specific stories with dependency awareness.

---

#### Task 1.6: Architect Agent - API Contract Validation (2 days)

**Files to Modify**:
1. `orchestrix-core/tasks/architect-review-story.md`

**Detailed Steps**:

**Step 1: Add API Contract Validation Section**

Insert after existing validation sections in architect-review-story.md:

```markdown
## API Contract Validation (Multi-Repo Only)

**Check if multi-repo mode**:

```javascript
const projectType = config.project.type;
const isMultiRepo = ['backend', 'frontend', 'ios', 'android', 'flutter', 'react-native'].includes(projectType);

if (!isMultiRepo) {
  // Skip API contract validation for monolith projects
  return;
}
````

**If multi-repo AND story has `provides_apis` or `consumes_apis`**:

---

### For Backend Stories (provides_apis)

**Step 1: Load API Contracts**

```bash
API_CONTRACTS=${product_repo.path}/docs/architecture/api-contracts.md

if [ ! -f "$API_CONTRACTS" ]; then
  # Record as Major Issue
  ISSUES+="Major Issue: API contracts file not found at $API_CONTRACTS"
  # Continue review but flag this issue
fi
```

**Step 2: Load Story's Epic Definition**

```javascript
// Extract epic ID from story ID (e.g., "1.1" → epic 1)
const epicId = parseInt(storyId.split(".")[0]);

// Load epic YAML file
const epicFile = `${productRepo}/docs/epics/epic-${epicId}-*.yaml`;
const epic = loadYaml(epicFile);

// Find this story in epic
const storyDef = epic.stories.find((s) => s.id === storyId);

const providesAPIs = storyDef.provides_apis || [];
const consumesAPIs = storyDef.consumes_apis || [];
```

**Step 3: Validate Each Provided API**

```javascript
for (const apiEndpoint of providesAPIs) {
  // Example: apiEndpoint = "POST /api/users"
  const [method, path] = apiEndpoint.split(" ");

  // Find API definition in api-contracts.md
  const apiDef = findAPIInContract(apiContractsContent, method, path);

  if (!apiDef) {
    addIssue({
      severity: "Critical",
      title: `API endpoint not documented: ${apiEndpoint}`,
      location: "Dev Notes - Technical Approach",
      description: `Story plans to implement ${apiEndpoint} but this endpoint is not defined in api-contracts.md`,
      recommendation: "Add API definition to api-contracts.md OR remove from story scope",
    });
    continue;
  }

  // Validate Request Schema
  const requestValidation = validateRequestSchema(storyContent, apiDef.request_schema);
  if (!requestValidation.valid) {
    addIssue({
      severity: "Major",
      title: `Request schema mismatch for ${apiEndpoint}`,
      location: "Dev Notes - Technical Approach",
      description: requestValidation.errors.join("\n"),
      recommendation: "Update story to match exact request schema from api-contracts.md",
    });
  }

  // Validate Response Schema
  const responseValidation = validateResponseSchema(storyContent, apiDef.response_schema);
  if (!responseValidation.valid) {
    addIssue({
      severity: "Major",
      title: `Response schema mismatch for ${apiEndpoint}`,
      location: "Dev Notes - Response Format",
      description: responseValidation.errors.join("\n"),
      recommendation: "Update story to match exact response schema from api-contracts.md",
    });
  }

  // Validate Error Handling
  const errorValidation = validateErrorHandling(storyContent, apiDef.error_responses);
  if (!errorValidation.valid) {
    addIssue({
      severity: "Major",
      title: `Incomplete error handling for ${apiEndpoint}`,
      location: "Acceptance Criteria",
      description: `Missing error handling for: ${errorValidation.missing_errors.join(", ")}`,
      recommendation: "Add acceptance criteria for all error responses defined in api-contracts.md",
    });
  }

  // Validate Security Requirements
  if (apiDef.security && apiDef.security.authentication) {
    const hasAuth =
      storyContent.includes("authentication") || storyContent.includes("JWT") || storyContent.includes("token");
    if (!hasAuth) {
      addIssue({
        severity: "Critical",
        title: `Security requirements not addressed for ${apiEndpoint}`,
        location: "Dev Notes",
        description: `API contract specifies authentication requirement but story does not mention auth implementation`,
        recommendation: "Add authentication/authorization implementation to story",
      });
    }
  }
}
```

**Helper Functions**:

```javascript
function findAPIInContract(contractContent, method, path) {
  // Parse markdown to find API section
  // Look for heading: ### METHOD /path/to/endpoint
  const regex = new RegExp(`###\\s+${method}\\s+${path.replace(/\//g, "\\/")}`, "i");
  const match = contractContent.match(regex);

  if (!match) return null;

  // Extract API definition section
  const startIndex = match.index;
  const endIndex = contractContent.indexOf("\n###", startIndex + 1);
  const apiSection = contractContent.substring(startIndex, endIndex !== -1 ? endIndex : undefined);

  // Parse request/response schemas from YAML blocks
  const requestSchema = extractYAMLBlock(apiSection, "Request Schema");
  const responseSchema = extractYAMLBlock(apiSection, "Response Schema");
  const errorResponses = extractErrorResponses(apiSection);
  const security = extractSecurityRequirements(apiSection);

  return {
    method,
    path,
    request_schema: requestSchema,
    response_schema: responseSchema,
    error_responses: errorResponses,
    security: security,
  };
}

function validateRequestSchema(storyContent, contractSchema) {
  // Extract request schema from story (Dev Notes or AC)
  // Compare against contract schema
  // Return validation result

  const errors = [];

  // Check required fields
  for (const field of contractSchema.required || []) {
    if (!storyContent.includes(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check field types
  for (const [field, schema] of Object.entries(contractSchema.properties || {})) {
    // Look for field mentions in story
    const fieldRegex = new RegExp(`${field}.*?(?:string|number|boolean|object|array)`, "i");
    const match = storyContent.match(fieldRegex);

    if (match) {
      const storyType = match[0].match(/(string|number|boolean|object|array)/i)[0];
      if (storyType.toLowerCase() !== schema.type.toLowerCase()) {
        errors.push(`Field ${field} type mismatch: story has ${storyType}, contract expects ${schema.type}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

### For Frontend/Mobile Stories (consumes_apis)

**Step 1: Validate API Consumption**

```javascript
for (const apiEndpoint of consumesAPIs) {
  const [method, path] = apiEndpoint.split(" ");

  // Find API definition in contract
  const apiDef = findAPIInContract(apiContractsContent, method, path);

  if (!apiDef) {
    addIssue({
      severity: "Critical",
      title: `Consumed API not documented: ${apiEndpoint}`,
      location: "Multi-Repo Context - APIs Consumed",
      description: `Story plans to consume ${apiEndpoint} but this endpoint is not defined in api-contracts.md`,
      recommendation: "Verify API endpoint exists OR update story to use correct endpoint",
    });
    continue;
  }

  // Check Request Payload Handling
  const mentionsRequest =
    storyContent.includes("request") || storyContent.includes("payload") || storyContent.includes("send");
  if (!mentionsRequest) {
    addIssue({
      severity: "Major",
      title: `Request handling not mentioned for ${apiEndpoint}`,
      location: "Dev Notes",
      description: "Story does not describe how request payload will be constructed",
      recommendation: "Add details about request payload structure and validation",
    });
  }

  // Check Response Handling
  const mentionsResponse = storyContent.includes("response") || storyContent.includes("data");
  if (!mentionsResponse) {
    addIssue({
      severity: "Major",
      title: `Response handling not mentioned for ${apiEndpoint}`,
      location: "Dev Notes",
      description: "Story does not describe how API response will be processed",
      recommendation: "Add details about response data parsing and state management",
    });
  }

  // Check Error Handling
  const errorCodes = apiDef.error_responses.map((e) => e.status);
  const missingErrorHandling = [];

  for (const errorCode of errorCodes) {
    if (!storyContent.includes(errorCode.toString()) && !storyContent.includes("error")) {
      missingErrorHandling.push(errorCode);
    }
  }

  if (missingErrorHandling.length > 0) {
    addIssue({
      severity: "Major",
      title: `Incomplete error handling for ${apiEndpoint}`,
      location: "Acceptance Criteria",
      description: `Story does not mention handling error responses: ${missingErrorHandling.join(", ")}`,
      recommendation: `Add acceptance criteria for error scenarios:\n${apiDef.error_responses.map((e) => `  - ${e.status}: ${e.description}`).join("\n")}`,
    });
  }
}
```

**Step 2: Validate Cross-Repo Dependencies**

```javascript
if (storyDef.dependencies && storyDef.dependencies.length > 0) {
  for (const depId of storyDef.dependencies) {
    // Find dependency story
    const depStory = epic.stories.find((s) => s.id === depId);

    if (depStory.repository !== config.project.repository_id) {
      // Cross-repo dependency
      addNote({
        type: "Cross-Repo Dependency",
        message: `This story depends on Story ${depId} "${depStory.title}" in repository ${depStory.repository}`,
        recommendation: `⚠️  Verify Story ${depId} is completed (Status = Done) before starting this story`,
      });

      // Stage 1: Just add note, no automatic checking
      // Stage 2: Will add automatic dependency status checking
    }
  }
}
```

---

## Scoring Impact (Multi-Repo)

**Add API contract compliance to scoring**:

```javascript
// For multi-repo projects: 11-point scale
const scores = {
  tech_stack_compliance: 0,
  naming_convention_adherence: 0,
  project_structure_alignment: 0,
  api_design_consistency: 0,
  data_model_accuracy: 0,
  architecture_pattern_compliance: 0,
  complete_dependency_mapping: 0,
  integration_feasibility: 0,
  accurate_documentation_references: 0,
  overall_implementation_feasibility: 0,
  api_contract_compliance: 0, // ✅ NEW (only for multi-repo)
};

// Calculate API contract compliance score
if (isMultiRepo && (providesAPIs.length > 0 || consumesAPIs.length > 0)) {
  const apiIssues = issues.filter((i) => i.title.includes("API") || i.title.includes("contract"));

  if (apiIssues.length === 0) {
    scores.api_contract_compliance = 1; // Perfect compliance
  } else {
    const criticalAPIIssues = apiIssues.filter((i) => i.severity === "Critical");
    if (criticalAPIIssues.length > 0) {
      scores.api_contract_compliance = 0; // Critical violations
    } else {
      scores.api_contract_compliance = 0.5; // Minor violations
    }
  }
}

// Calculate total score
const totalPossible = isMultiRepo ? 11 : 10;
const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
const passingThreshold = isMultiRepo ? 8 : 7;

const passed = totalScore >= passingThreshold;
```

**Update review report**:

```markdown
## Technical Accuracy Score

**Project Type**: {{project_type}}
**Scoring Scale**: {{totalPossible}} points

### Score Breakdown

1. Tech Stack Compliance: {{scores.tech_stack_compliance}}/1
2. Naming Convention Adherence: {{scores.naming_convention_adherence}}/1
3. Project Structure Alignment: {{scores.project_structure_alignment}}/1
4. API Design Consistency: {{scores.api_design_consistency}}/1
5. Data Model Accuracy: {{scores.data_model_accuracy}}/1
6. Architecture Pattern Compliance: {{scores.architecture_pattern_compliance}}/1
7. Complete Dependency Mapping: {{scores.complete_dependency_mapping}}/1
8. Integration Feasibility: {{scores.integration_feasibility}}/1
9. Accurate Documentation References: {{scores.accurate_documentation_references}}/1
10. Overall Implementation Feasibility: {{scores.overall_implementation_feasibility}}/1
    {{#if isMultiRepo}}
11. **API Contract Compliance**: {{scores.api_contract_compliance}}/1 ✅
    {{/if}}

**Total Score**: {{totalScore}}/{{totalPossible}}
**Passing Threshold**: {{passingThreshold}}/{{totalPossible}}
**Result**: {{#if passed}}✅ PASS{{else}}❌ FAIL{{/if}}
```

````

**Testing**:
- ✅ Monolith mode: Verify API contract validation is skipped
- ✅ Multi-repo backend: Verify provides_apis validation
- ✅ Multi-repo frontend: Verify consumes_apis validation
- ✅ Verify API not in contract triggers Critical issue
- ✅ Verify schema mismatch triggers Major issue
- ✅ Verify cross-repo dependency note is added

**Deliverable**: Architect validates API contracts during story review.

---

#### Task 1.7: Update Agent Compilation and Testing (1 day)

**Steps**:

1. **Compile all modified agents**:
   ```bash
   node tools/compile-agents.js compile
````

2. **Validate agent configurations**:

   ```bash
   npm run validate
   ```

3. **Test agent installations**:

   ```bash
   # Test monolith installation
   cd test-projects/monolith
   npx orchestrix install

   # Test multi-repo installation
   cd test-projects/product
   npx orchestrix install -i claude-code

   cd test-projects/backend
   npx orchestrix install -i claude-code
   ```

**Testing**:

- ✅ All agents compile successfully
- ✅ Validation passes
- ✅ Monolith installation works (existing behavior)
- ✅ Multi-repo installation works (new behavior)

**Deliverable**: All agents compiled and tested.

---

### Stage 1 Completion Checklist

- [ ] Project type configuration implemented
- [ ] API contracts template created
- [ ] Epic story mapping schema defined
- [ ] PO agent creates cross-repo epics (YAML format)
- [ ] SM agent filters stories by repository
- [ ] SM agent displays cross-repo dependency warnings
- [ ] Architect agent validates API contracts
- [ ] All agents compile successfully
- [ ] Backward compatibility verified (monolith projects work unchanged)
- [ ] Documentation updated
- [ ] Tests pass

**Milestone**: Basic multi-repo support functional. Teams can manually coordinate across repositories.

---

## 🔄 Stage 2: Automation - 2-3 Weeks

### Objectives

1. ✅ Automatic cross-repo dependency checking (no manual verification)
2. ✅ SM auto-filters stories by repository
3. ✅ Story status synchronization across repositories
4. ✅ Dependency status dashboard

### Week 3: Dependency Automation

#### Task 2.1: Cross-Repo Dependency Checker Utility (3 days)

**Files to Create**:

1. `orchestrix-core/tasks/utils/check-cross-repo-dependencies.md`
2. `tools/dependency-checker.js`

**Detailed Steps**:

**Step 1: Create Utility Task**

Full content provided in design document (Section 2.1).

Key functions:

- Load story dependencies from epic YAML
- Resolve repository paths (from config or sibling directories)
- Find dependency story files in other repositories
- Extract status from dependency stories
- Return PASS/HALT result

**Step 2: Create Node.js Implementation**

```javascript
// tools/dependency-checker.js

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

class DependencyChecker {
  constructor(config) {
    this.config = config;
    this.productRepoPath = config.project.product_repo?.path || ".";
  }

  async checkDependencies(storyId) {
    // Load epic definition
    const epic = this.loadEpicForStory(storyId);

    // Find story in epic
    const story = epic.stories.find((s) => s.id === storyId);

    if (!story.dependencies || story.dependencies.length === 0) {
      return {
        result: "PASS",
        message: "No dependencies",
        details: [],
      };
    }

    // Check each dependency
    const results = [];

    for (const depId of story.dependencies) {
      const depResult = await this.checkDependency(depId, epic);
      results.push(depResult);
    }

    // Determine overall result
    const allPassed = results.every((r) => r.pass);

    return {
      result: allPassed ? "PASS" : "HALT",
      message: allPassed
        ? "All dependencies completed"
        : `${results.filter((r) => !r.pass).length} dependencies not complete`,
      failed_dependencies: results.filter((r) => !r.pass),
      details: results,
    };
  }

  async checkDependency(depId, epic) {
    // Find dependency story definition
    const depStory = epic.stories.find((s) => s.id === depId);

    if (!depStory) {
      return {
        dependency: depId,
        status: "NOT_FOUND_IN_EPIC",
        repository: null,
        pass: false,
        error: `Dependency ${depId} not found in epic definition`,
      };
    }

    // Resolve repository path
    const depRepoPath = this.resolveRepositoryPath(depStory.repository);

    // Find story file
    const storyFile = this.findStoryFile(depRepoPath, depId);

    if (!storyFile) {
      return {
        dependency: depId,
        status: "NOT_CREATED",
        repository: depStory.repository,
        repositoryPath: depRepoPath,
        pass: false,
        message: `Story ${depId} has not been created yet in ${depStory.repository}`,
      };
    }

    // Extract status from story file
    const status = this.extractStatusFromStory(storyFile);

    return {
      dependency: depId,
      status: status,
      repository: depStory.repository,
      repositoryPath: depRepoPath,
      storyFile: storyFile,
      pass: status === "Done",
      message: status === "Done" ? `Story ${depId} is complete` : `Story ${depId} is ${status} (not Done yet)`,
    };
  }

  resolveRepositoryPath(repositoryId) {
    // Option 1: Use configured repository mapping
    const repoMap = this.config.repository_mapping;
    if (repoMap && repoMap[repositoryId]) {
      return repoMap[repositoryId].path;
    }

    // Option 2: Auto-resolve from sibling directories (default)
    const currentRepoPath = process.cwd();
    const parentDir = path.dirname(currentRepoPath);
    return path.join(parentDir, repositoryId);
  }

  findStoryFile(repoPath, storyId) {
    const storiesDir = path.join(repoPath, "docs/stories");

    if (!fs.existsSync(storiesDir)) {
      return null;
    }

    // Search for directory matching pattern: {storyId}-*
    const dirs = fs.readdirSync(storiesDir);
    const storyDir = dirs.find((d) => d.startsWith(`${storyId}-`));

    if (!storyDir) {
      return null;
    }

    // Find story.md file
    const storyFile = path.join(storiesDir, storyDir, "story.md");

    return fs.existsSync(storyFile) ? storyFile : null;
  }

  extractStatusFromStory(storyFile) {
    const content = fs.readFileSync(storyFile, "utf8");

    // Extract Status field from markdown
    // Format: "Status: Done" or "**Status**: InProgress"
    const statusMatch = content.match(/\*?\*?Status\*?\*?:\s*(.+)/);

    if (statusMatch) {
      return statusMatch[1].trim();
    }

    return "Unknown";
  }

  loadEpicForStory(storyId) {
    // Extract epic ID from story ID (e.g., "1.1" → epic 1)
    const epicId = parseInt(storyId.split(".")[0]);

    // Load epic YAML file
    const epicsDir = path.join(this.productRepoPath, "docs/epics");
    const files = fs.readdirSync(epicsDir);
    const epicFile = files.find((f) => f.startsWith(`epic-${epicId}-`) && f.endsWith(".yaml"));

    if (!epicFile) {
      throw new Error(`Epic file not found for epic ${epicId}`);
    }

    const epicContent = fs.readFileSync(path.join(epicsDir, epicFile), "utf8");
    return yaml.load(epicContent);
  }

  formatResult(result) {
    if (result.result === "PASS") {
      return `✅ DEPENDENCY CHECK PASSED\n\nAll dependencies completed.\n`;
    }

    let output = "❌ DEPENDENCY CHECK FAILED\n\n";
    output += `Cannot proceed: ${result.failed_dependencies.length} dependencies not complete\n\n`;
    output += "📋 Dependency Status:\n\n";

    for (const dep of result.details) {
      const icon = dep.pass ? "✅" : "❌";
      output += `${icon} Story ${dep.dependency} (${dep.repository}): ${dep.status}\n`;
      if (!dep.pass) {
        output += `   Path: ${dep.repositoryPath}/docs/stories/${dep.dependency}-*/\n`;
      }
    }

    output += "\n⚠️  ACTION REQUIRED:\n";
    output += "Wait for the following stories to be completed before proceeding:\n\n";

    for (const dep of result.failed_dependencies) {
      output += `  - Story ${dep.dependency} (${dep.repository})\n`;
      output += `    Current status: ${dep.status}\n`;
      output += `    Check: ${dep.repositoryPath}/docs/stories/${dep.dependency}-*/story.md\n\n`;
    }

    return output;
  }
}

module.exports = { DependencyChecker };

// CLI usage
if (require.main === module) {
  const config = require("../lib/config-loader").loadConfig("orchestrix-core/core-config.yaml");
  const storyId = process.argv[2];

  if (!storyId) {
    console.error("Usage: node dependency-checker.js <story-id>");
    process.exit(1);
  }

  const checker = new DependencyChecker(config);

  checker
    .checkDependencies(storyId)
    .then((result) => {
      console.log(checker.formatResult(result));
      process.exit(result.result === "PASS" ? 0 : 1);
    })
    .catch((error) => {
      console.error("Error checking dependencies:", error.message);
      process.exit(1);
    });
}
```

**Step 3: Add Repository Mapping to Config**

```yaml
# orchestrix-core/core-config.yaml

# ✅ NEW: Repository mapping (Stage 2)
repository_mapping:
  my-product-backend:
    path: ../my-product-backend
    type: backend

  my-product-web:
    path: ../my-product-web
    type: frontend

  my-product-ios:
    path: ../my-product-ios
    type: ios

# Alternative: Auto-resolve from sibling directories
repository_auto_resolve: true # Default: true
```

**Testing**:

- ✅ Verify dependency checker detects completed dependencies (PASS)
- ✅ Verify dependency checker detects incomplete dependencies (HALT)
- ✅ Verify dependency checker detects non-existent stories
- ✅ Test repository path resolution (config vs auto-resolve)
- ✅ Test CLI usage

**Deliverable**: Automatic cross-repo dependency checking utility.

---

#### Task 2.2: Integrate Dependency Checker into SM and Dev (2 days)

**Files to Modify**:

1. `orchestrix-core/tasks/sm-create-story.md`
2. `orchestrix-core/tasks/implement-story.md`

**Detailed Steps**:

**Step 1: Update sm-create-story.md**

Replace Stage 1 manual dependency warning with automatic check:

````markdown
## 2. Check Cross-Repo Dependencies (Stage 2: Automatic)

**Check if auto-checking is enabled**:

```yaml
# core-config.yaml
project:
  story_assignment:
    auto_filter: true # If true, enable automatic dependency checking
```
````

**If `auto_filter = true`** (Stage 2):

```bash
# Execute dependency checker
node tools/dependency-checker.js {{next_story.id}}

# Capture result
DEPENDENCY_RESULT=$?

if [ $DEPENDENCY_RESULT -ne 0 ]; then
  echo "❌ DEPENDENCY CHECK FAILED"
  echo "Cannot create Story {{next_story.id}} until dependencies are complete."
  exit 1
fi

echo "✅ DEPENDENCY CHECK PASSED"
echo "All dependencies completed, proceeding with story creation."
```

**If `auto_filter = false`** (Stage 1):

```markdown
# Display manual warning (existing Stage 1 logic)
```

````

**Step 2: Update implement-story.md**

Add pre-development dependency check:

```markdown
## 0. Pre-Development Dependency Check (Stage 2)

**Before starting development**:

```bash
# Check if multi-repo mode
if [ "${project.type}" != "monolith" ]; then
  # Execute dependency checker
  node tools/dependency-checker.js {{story_id}}

  if [ $? -ne 0 ]; then
    echo "❌ CANNOT START DEVELOPMENT"
    echo "Dependencies are not complete. Fix dependencies first."
    exit 1
  fi

  echo "✅ Dependencies verified, proceeding with development."
fi
````

**If dependency check fails**:

- HALT development
- Display dependency status
- Exit with error code

**If dependency check passes**:

- Proceed with existing development logic

````

**Testing**:
- ✅ Verify SM halts if dependencies incomplete
- ✅ Verify SM proceeds if dependencies complete
- ✅ Verify Dev halts if dependencies incomplete
- ✅ Verify manual mode still works (backward compatible)

**Deliverable**: Automatic dependency checking integrated into SM and Dev workflows.

---

#### Task 2.3: Story Status Synchronization (2 days)

**Files to Create**:
1. `orchestrix-core/data/story-status-sync.yaml`
2. `orchestrix-core/tasks/utils/sync-story-status.md`
3. `tools/status-sync.js`

**Detailed Steps**:

Full content provided in design document (Section 2.3).

Key components:
- Central status registry in product repo: `docs/story-status-registry.yaml`
- Sync utility that updates registry when story status changes
- Integration points in all status-changing tasks

**Step 1: Create Status Registry Format**

```yaml
# my-product/docs/story-status-registry.yaml

schema_version: "1.0.0"
last_updated: "2025-01-14T15:30:00Z"

stories:
  - story_id: "1.1"
    repository: my-product-backend
    status: Done
    last_updated: "2025-01-14T10:30:00Z"
    epic_id: 1

  - story_id: "1.2"
    repository: my-product-web
    status: InProgress
    last_updated: "2025-01-14T11:00:00Z"
    epic_id: 1

  - story_id: "1.3"
    repository: my-product-ios
    status: Blocked
    last_updated: "2025-01-14T09:00:00Z"
    epic_id: 1
    blocked_reason: "Waiting for Story 1.1 completion"
````

**Step 2: Create Sync Utility**

```javascript
// tools/status-sync.js

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

class StatusSync {
  constructor(config) {
    this.config = config;
    this.productRepoPath = config.project.product_repo?.path || ".";
    this.registryPath = path.join(this.productRepoPath, "docs/story-status-registry.yaml");
  }

  syncStatus(storyId, newStatus, repository) {
    // Load registry
    let registry = this.loadRegistry();

    // Update or insert story status
    const existingIndex = registry.stories.findIndex((s) => s.story_id === storyId && s.repository === repository);

    const statusEntry = {
      story_id: storyId,
      repository: repository,
      status: newStatus,
      last_updated: new Date().toISOString(),
      epic_id: this.extractEpicId(storyId),
    };

    if (existingIndex >= 0) {
      registry.stories[existingIndex] = statusEntry;
    } else {
      registry.stories.push(statusEntry);
    }

    registry.last_updated = new Date().toISOString();

    // Save registry
    this.saveRegistry(registry);

    console.log(`✅ Status synced: Story ${storyId} → ${newStatus}`);

    // If status = Done, check dependent stories
    if (newStatus === "Done") {
      this.notifyDependentStories(storyId);
    }
  }

  loadRegistry() {
    if (!fs.existsSync(this.registryPath)) {
      return {
        schema_version: "1.0.0",
        last_updated: new Date().toISOString(),
        stories: [],
      };
    }

    return yaml.load(fs.readFileSync(this.registryPath, "utf8"));
  }

  saveRegistry(registry) {
    const yamlContent = yaml.dump(registry, { indent: 2 });
    fs.writeFileSync(this.registryPath, yamlContent, "utf8");
  }

  extractEpicId(storyId) {
    return parseInt(storyId.split(".")[0]);
  }

  notifyDependentStories(completedStoryId) {
    // Find stories that depend on this story
    const epicId = this.extractEpicId(completedStoryId);
    const epic = this.loadEpic(epicId);

    const dependentStories = epic.stories.filter(
      (story) => story.dependencies && story.dependencies.includes(completedStoryId)
    );

    if (dependentStories.length > 0) {
      console.log(`\n✅ Story ${completedStoryId} completed!`);
      console.log(`\n📢 Dependent stories can now proceed:\n`);

      for (const depStory of dependentStories) {
        const allDepsComplete = this.checkAllDependenciesComplete(depStory);

        if (allDepsComplete) {
          console.log(`  ✅ Story ${depStory.id} "${depStory.title}" (${depStory.repository})`);
          console.log(`     All dependencies complete, ready to start!`);
        } else {
          console.log(`  ⏳ Story ${depStory.id} "${depStory.title}" (${depStory.repository})`);
          console.log(`     Still waiting for other dependencies`);
        }
      }
    }
  }

  checkAllDependenciesComplete(story) {
    if (!story.dependencies || story.dependencies.length === 0) {
      return true;
    }

    const registry = this.loadRegistry();

    for (const depId of story.dependencies) {
      const depStatus = registry.stories.find((s) => s.story_id === depId);
      if (!depStatus || depStatus.status !== "Done") {
        return false;
      }
    }

    return true;
  }

  loadEpic(epicId) {
    const epicsDir = path.join(this.productRepoPath, "docs/epics");
    const files = fs.readdirSync(epicsDir);
    const epicFile = files.find((f) => f.startsWith(`epic-${epicId}-`) && f.endsWith(".yaml"));

    const epicContent = fs.readFileSync(path.join(epicsDir, epicFile), "utf8");
    return yaml.load(epicContent);
  }
}

module.exports = { StatusSync };

// CLI usage
if (require.main === module) {
  const config = require("../lib/config-loader").loadConfig("orchestrix-core/core-config.yaml");
  const [storyId, newStatus] = process.argv.slice(2);

  if (!storyId || !newStatus) {
    console.error("Usage: node status-sync.js <story-id> <new-status>");
    process.exit(1);
  }

  const sync = new StatusSync(config);
  sync.syncStatus(storyId, newStatus, config.project.repository_id);
}
```

**Step 3: Integrate into Status-Changing Tasks**

**In `qa-review-story.md`**:

````markdown
## Completion Step 6: Update Story Status AND Sync

**Update Status field** AND **Sync to registry**:

```bash
# Update story status
sed -i 's/^Status: .*/Status: Done/' story.md

# Sync to central registry
node tools/status-sync.js {{story_id}} Done

# Verify sync succeeded
if [ $? -eq 0 ]; then
  echo "✅ Status synced to central registry"
else
  echo "⚠️  Warning: Status sync failed (manual sync may be needed)"
fi
```
````

````

**In `sm-create-story.md`** (after story creation):

```markdown
## After Story Creation

**Sync initial status to registry**:

```bash
node tools/status-sync.js {{story_id}} AwaitingArchReview
````

````

**In `architect-review-story.md`** (after review):

```markdown
## Update Story Status AND Sync

```bash
# Update story status
sed -i 's/^Status: .*/Status: {{next_status}}/' story.md

# Sync to registry
node tools/status-sync.js {{story_id}} {{next_status}}
````

````

**Testing**:
- ✅ Verify status sync creates registry file if missing
- ✅ Verify status sync updates existing entries
- ✅ Verify status sync notifies dependent stories when status = Done
- ✅ Verify dependency checker uses registry for status lookup

**Deliverable**: Story status synchronized across repositories.

---

### Week 4: Auto-Filtering and Dashboard

#### Task 2.4: SM Auto-Filter Stories (1 day)

**Files to Modify**:
1. `orchestrix-core/tasks/sm-create-story.md`

**Detailed Steps**:

Update filtering logic to use auto-filter setting:

```markdown
## 1. Load Epic Definitions and Filter Stories

**Check auto-filter setting**:

```yaml
# core-config.yaml
project:
  story_assignment:
    auto_filter: true  # ✅ Enable auto-filtering
````

**If `auto_filter = true`** (Stage 2):

```javascript
// Automatic filtering
const currentRepoId = config.project.repository_id;

// Load all epics
const epicsDir = path.join(productRepo, "docs/epics");
const epicFiles = fs.readdirSync(epicsDir).filter((f) => f.endsWith(".yaml"));

const epics = epicFiles.map((file) => {
  const content = fs.readFileSync(path.join(epicsDir, file), "utf8");
  return yaml.load(content);
});

// Extract all stories
const allStories = epics.flatMap((epic) =>
  epic.stories.map((story) => ({ ...story, epic_id: epic.epic_id, epic_title: epic.title }))
);

// Filter for current repository
const myStories = allStories.filter((story) => story.repository === currentRepoId);

console.log(`✅ Auto-filter enabled: Found ${myStories.length} stories for ${currentRepoId}`);
console.log(`   (Total stories in product: ${allStories.length})`);

// Identify next story to create
const existingStories = listExistingStories("docs/stories/");
const nextStory = findNextStoryToCreate(myStories, existingStories);

if (!nextStory) {
  console.log("✅ All stories for this repository have been created!");
  exit(0);
}
```

**If `auto_filter = false`** (Stage 1):

```markdown
# Manual mode (existing logic)

const allStories = loadAllStories();

// Display stories by repository
console.log("Stories by repository:");
const byRepo = groupBy(allStories, 'repository');

for (const [repo, stories] of Object.entries(byRepo)) {
console.log(`\n  ${repo}:`);
stories.forEach(s => console.log(`    - ${s.id}: ${s.title}`));
}

// Proceed with manual selection
```

````

**Testing**:
- ✅ Verify auto-filter mode only shows stories for current repository
- ✅ Verify manual mode shows all stories (backward compatible)

**Deliverable**: SM automatically filters stories by repository.

---

#### Task 2.5: Cross-Repo Dependency Dashboard (2 days)

**Files to Create**:
1. `tools/multi-repo-dashboard.js`

**Detailed Steps**:

Simplified version of dashboard from design document (full implementation in Stage 3).

**Step 1: Create Basic Dashboard**

```javascript
// tools/multi-repo-dashboard.js (Stage 2: Basic text dashboard)

const { DependencyChecker } = require('./dependency-checker');
const { StatusSync } = require('./status-sync');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class MultiRepoDashboard {
  constructor(config) {
    this.config = config;
    this.productRepoPath = config.project.product_repo?.path || '.';
  }

  generateDashboard(options = {}) {
    const { epic_filter } = options;

    const epics = this.loadAllEpics();
    const statusRegistry = this.loadStatusRegistry();

    let filteredEpics = epics;
    if (epic_filter) {
      filteredEpics = epics.filter(e => e.epic_id === parseInt(epic_filter));
    }

    return this.generateTextDashboard(filteredEpics, statusRegistry);
  }

  loadAllEpics() {
    const epicsDir = path.join(this.productRepoPath, 'docs/epics');
    const files = fs.readdirSync(epicsDir).filter(f => f.endsWith('.yaml'));

    return files.map(file => {
      const content = fs.readFileSync(path.join(epicsDir, file), 'utf8');
      return yaml.load(content);
    });
  }

  loadStatusRegistry() {
    const registryPath = path.join(this.productRepoPath, 'docs/story-status-registry.yaml');

    if (!fs.existsSync(registryPath)) {
      return { stories: [] };
    }

    return yaml.load(fs.readFileSync(registryPath, 'utf8'));
  }

  generateTextDashboard(epics, statusRegistry) {
    let output = '';

    output += '╔════════════════════════════════════════════════════════════════╗\n';
    output += '║         MULTI-REPO STORY DASHBOARD                             ║\n';
    output += '╚════════════════════════════════════════════════════════════════╝\n\n';

    for (const epic of epics) {
      output += `Epic ${epic.epic_id}: ${epic.title}\n`;
      output += '─'.repeat(70) + '\n\n';

      // Group stories by repository
      const byRepo = {};
      for (const story of epic.stories) {
        if (!byRepo[story.repository]) {
          byRepo[story.repository] = [];
        }
        byRepo[story.repository].push(story);
      }

      for (const [repo, stories] of Object.entries(byRepo)) {
        output += `  📦 ${repo}\n`;

        for (const story of stories) {
          const statusEntry = statusRegistry.stories.find(
            s => s.story_id === story.id && s.repository === story.repository
          );

          const status = statusEntry ? statusEntry.status : 'Not Created';
          const statusIcon = this.getStatusIcon(status);

          output += `    ${statusIcon} ${story.id}: ${story.title}\n`;
          output += `       Status: ${status}`;

          if (story.dependencies && story.dependencies.length > 0) {
            output += ` | Depends on: ${story.dependencies.join(', ')}`;
          }

          output += '\n';
        }

        output += '\n';
      }

      // Dependency Graph
      output += '  Dependencies:\n';
      const dependencyGraph = this.buildDependencyGraph(epic.stories);
      output += this.visualizeDependencyGraph(dependencyGraph);

      output += '\n';
    }

    // Summary Statistics
    output += '\n';
    output += '╔════════════════════════════════════════════════════════════════╗\n';
    output += '║  SUMMARY                                                       ║\n';
    output += '╚════════════════════════════════════════════════════════════════╝\n\n';

    const stats = this.calculateStats(epics, statusRegistry);
    output += `  Total Epics: ${stats.total_epics}\n`;
    output += `  Total Stories: ${stats.total_stories}\n`;
    output += `  Completed: ${stats.completed} (${stats.completion_rate}%)\n`;
    output += `  In Progress: ${stats.in_progress}\n`;
    output += `  Not Started: ${stats.not_started}\n`;
    output += `  Blocked: ${stats.blocked}\n`;

    return output;
  }

  getStatusIcon(status) {
    const icons = {
      'Done': '✅',
      'InProgress': '🔄',
      'Review': '👀',
      'Approved': '✔️ ',
      'AwaitingArchReview': '⏳',
      'RequiresRevision': '⚠️ ',
      'Blocked': '🚫',
      'Not Created': '⬜'
    };

    return icons[status] || '❓';
  }

  buildDependencyGraph(stories) {
    const graph = {};

    for (const story of stories) {
      graph[story.id] = {
        title: story.title,
        dependencies: story.dependencies || []
      };
    }

    return graph;
  }

  visualizeDependencyGraph(graph) {
    let output = '';

    for (const [storyId, node] of Object.entries(graph)) {
      if (node.dependencies.length === 0) {
        output += `    ${storyId} (no dependencies)\n`;
      } else {
        output += `    ${storyId} ← ${node.dependencies.join(', ')}\n`;
      }
    }

    return output;
  }

  calculateStats(epics, statusRegistry) {
    const allStories = epics.flatMap(e => e.stories);

    const stats = {
      total_epics: epics.length,
      total_stories: allStories.length,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      blocked: 0
    };

    for (const story of allStories) {
      const statusEntry = statusRegistry.stories.find(
        s => s.story_id === story.id && s.repository === story.repository
      );

      const status = statusEntry ? statusEntry.status : 'Not Created';

      if (status === 'Done') stats.completed++;
      else if (status === 'InProgress' || status === 'Review') stats.in_progress++;
      else if (status === 'Blocked') stats.blocked++;
      else stats.not_started++;
    }

    stats.completion_rate = Math.round((stats.completed / stats.total_stories) * 100);

    return stats;
  }
}

module.exports = { MultiRepoDashboard };

// CLI usage
if (require.main === module) {
  const config = require('../lib/config-loader').loadConfig('orchestrix-core/core-config.yaml');
  const dashboard = new MultiRepoDashboard(config);

  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--epic') {
      options.epic_filter = args[++i];
    }
  }

  const output = dashboard.generateDashboard(options);
  console.log(output);
}
````

**Testing**:

- ✅ Verify dashboard shows all epics and stories
- ✅ Verify story status displayed correctly
- ✅ Verify dependency graph visualization
- ✅ Verify summary statistics
- ✅ Test epic filtering

**Deliverable**: Basic cross-repo dependency dashboard.

---

### Stage 2 Completion Checklist

- [ ] Automatic cross-repo dependency checking implemented
- [ ] SM auto-filters stories by repository
- [ ] Story status synchronization working
- [ ] Cross-repo dependency dashboard functional
- [ ] All tests pass
- [ ] Documentation updated

**Milestone**: Cross-repo coordination fully automated. Teams can work independently with automatic dependency tracking.

---

## 🚀 Stage 3: Advanced Features - 2-3 Weeks

### Objectives

1. ✅ Contract-first development workflow
2. ✅ API contract change impact analysis
3. ✅ Cross-repo integration testing
4. ✅ Advanced dependency dashboard with visualization

### Week 5: Contract-First Workflow

#### Task 3.1: Contract-First Workflow Documentation (1 day)

**Files to Create**:

1. `orchestrix-core/workflows/contract-first-workflow.md`

Full content provided in design document (Section 3.1).

---

#### Task 3.2: Architect Lock API Contract (2 days)

**Files to Create**:

1. `orchestrix-core/tasks/architect-lock-api-contract.md`

Full content provided in design document (Section 3.1).

Key features:

- Validate contract completeness
- Set contract version and status (locked)
- Generate contract hash for integrity
- Create contract changelog
- Notify teams

---

#### Task 3.3: API Contract Change Impact Analysis (2 days)

**Files to Create**:

1. `orchestrix-core/tasks/architect-analyze-contract-changes.md`

Full content provided in design document (Section 3.2).

Key features:

- Parse old and new contracts
- Detect changes (added/removed/modified endpoints)
- Classify changes (breaking vs non-breaking)
- Find affected stories across all repositories
- Generate impact report with recommendations

---

### Week 6: Integration Testing and Dashboard

#### Task 3.4: Cross-Repo Integration Test Orchestration (2 days)

**Files to Create**:

1. `orchestrix-core/data/integration-test-config.yaml`
2. `orchestrix-core/tasks/qa-run-integration-tests.md`

Full content provided in design document (Section 3.3).

Key features:

- Define integration test suites per epic
- Orchestrate test setup across repositories
- Execute test scenarios
- Generate integration test report
- Identify contract violations

---

#### Task 3.5: Advanced Multi-Repo Dashboard (2 days)

**Files to Create/Modify**:

1. `tools/multi-repo-dashboard.js` (enhance Stage 2 version)

Add features:

- HTML output with interactive dependency graph
- D3.js or Mermaid visualization
- Dependency graph with visual flow
- Click-through to story files
- Export to different formats (JSON, CSV)

---

### Week 7: Testing and Documentation

#### Task 3.6: Comprehensive Testing (3 days)

**Test Suites to Create**:

1. **Unit Tests**:
   - Dependency checker logic
   - Status sync logic
   - Epic validator
   - Contract parser

2. **Integration Tests**:
   - Full workflow (PO shard → SM create → Architect review → Dev implement → QA review)
   - Cross-repo dependency resolution
   - Status synchronization
   - Dashboard generation

3. **E2E Tests**:
   - Complete multi-repo project setup
   - Story creation across 3 repositories
   - Dependency blocking and unblocking
   - Contract-first workflow

**Test Projects**:

- Create test-projects/multi-repo-example/
  - product/
  - backend/
  - frontend/
  - ios/

---

#### Task 3.7: Documentation (2 days)

**Documents to Create/Update**:

1. **User Guide**: `docs/MULTI_REPO_USER_GUIDE.md`
   - How to set up multi-repo project
   - How to configure repository references
   - How to use cross-repo features
   - Troubleshooting common issues

2. **Migration Guide**: `docs/MONOLITH_TO_MULTI_REPO_MIGRATION.md`
   - Step-by-step migration from monolith to multi-repo
   - Epic conversion script
   - Configuration changes needed

3. **API Contracts Guide**: `docs/API_CONTRACTS_GUIDE.md`
   - How to write API contracts
   - Contract-first development workflow
   - Contract versioning best practices

4. **Update CLAUDE.md**:
   - Add multi-repo architecture section
   - Update workflow descriptions
   - Add repository type configuration

---

## 📊 Effort Estimation

### Stage 1 (MVP) - 2 Weeks

| Task                                          | Effort      | Assignee     |
| --------------------------------------------- | ----------- | ------------ |
| 1.1 Project Type Configuration                | 2 days      | Backend Dev  |
| 1.2 API Contracts Template                    | 1 day       | Architect/PM |
| 1.3 Epic Story Mapping Schema                 | 1 day       | Backend Dev  |
| 1.4 PO Agent - Epic Sharding                  | 2 days      | Backend Dev  |
| 1.5 SM Agent - Repo-Aware Story Creation      | 2 days      | Backend Dev  |
| 1.6 Architect Agent - API Contract Validation | 2 days      | Backend Dev  |
| 1.7 Agent Compilation and Testing             | 1 day       | QA           |
| **Total**                                     | **11 days** |              |

### Stage 2 (Automation) - 2-3 Weeks

| Task                              | Effort      | Assignee     |
| --------------------------------- | ----------- | ------------ |
| 2.1 Cross-Repo Dependency Checker | 3 days      | Backend Dev  |
| 2.2 Integrate Dependency Checker  | 2 days      | Backend Dev  |
| 2.3 Story Status Synchronization  | 2 days      | Backend Dev  |
| 2.4 SM Auto-Filter Stories        | 1 day       | Backend Dev  |
| 2.5 Cross-Repo Dashboard (Basic)  | 2 days      | Frontend Dev |
| **Total**                         | **10 days** |              |

### Stage 3 (Advanced) - 2-3 Weeks

| Task                                    | Effort      | Assignee     |
| --------------------------------------- | ----------- | ------------ |
| 3.1 Contract-First Workflow Docs        | 1 day       | Tech Writer  |
| 3.2 Architect Lock API Contract         | 2 days      | Backend Dev  |
| 3.3 API Contract Change Impact Analysis | 2 days      | Backend Dev  |
| 3.4 Integration Test Orchestration      | 2 days      | QA           |
| 3.5 Advanced Dashboard (HTML/Viz)       | 2 days      | Frontend Dev |
| 3.6 Comprehensive Testing               | 3 days      | QA           |
| 3.7 Documentation                       | 2 days      | Tech Writer  |
| **Total**                               | **14 days** |              |

**Grand Total**: **35 days** (~7 weeks with 1 person, 5-6 weeks with 2 people)

---

## 🧪 Testing Strategy

### Unit Tests

- Epic validator (cyclic dependencies, missing references)
- Dependency checker (path resolution, status extraction)
- Status sync (registry update, notification)
- Contract parser (schema validation)

### Integration Tests

- Full PO → SM → Architect → Dev → QA workflow
- Cross-repo dependency resolution
- Status synchronization across repos
- Dashboard generation

### End-to-End Tests

- Complete multi-repo project setup (product + 3 implementation repos)
- Story creation and dependency blocking
- Contract-first workflow
- Integration test orchestration

### Backward Compatibility Tests

- Verify monolith projects work unchanged
- Verify existing workflows not broken
- Verify existing configurations load correctly

---

## ⚠️ Risks and Mitigation

### Risk 1: File System Dependencies

**Issue**: Dependency checker assumes sibling directories for repositories.

**Mitigation**:

- Add repository mapping configuration
- Support both relative and absolute paths
- Provide clear error messages if repo not found

### Risk 2: Merge Conflicts in Status Registry

**Issue**: Multiple repos updating status registry simultaneously could cause conflicts.

**Mitigation**:

- Stage 1-2: Accept occasional conflicts (manual resolution)
- Stage 3: Consider using database instead of YAML file
- Add retry logic and conflict detection

### Risk 3: Performance with Large Repos

**Issue**: Dependency checking and dashboard generation slow with many stories.

**Mitigation**:

- Cache epic definitions
- Lazy-load story files
- Optimize dashboard queries
- Consider pagination for large dashboards

### Risk 4: Learning Curve

**Issue**: Multi-repo setup more complex than monolith.

**Mitigation**:

- Comprehensive documentation
- Migration guide with examples
- Video tutorials
- Example multi-repo project

---

## 📦 Deliverables

### Stage 1

- ✅ Project type configuration system
- ✅ API contracts template
- ✅ Epic story mapping schema
- ✅ PO, SM, Architect agents with multi-repo support
- ✅ User documentation (README update)

### Stage 2

- ✅ Automatic dependency checker
- ✅ Status synchronization system
- ✅ Auto-filtering in SM
- ✅ Basic cross-repo dashboard
- ✅ Integration tests

### Stage 3

- ✅ Contract-first workflow
- ✅ Contract change impact analyzer
- ✅ Integration test orchestration
- ✅ Advanced dashboard with visualization
- ✅ Comprehensive documentation
- ✅ Migration guide

---

## 🎯 Success Criteria

### Stage 1 Success

- [ ] Can create product repository with epics
- [ ] Can create backend/frontend repositories with filtered stories
- [ ] Cross-repo dependencies display warnings
- [ ] API contracts template usable
- [ ] Monolith projects work unchanged

### Stage 2 Success

- [ ] Dependency checking automatic and accurate
- [ ] SM auto-filters stories by repository
- [ ] Story status synchronized across repos
- [ ] Dashboard shows all stories and dependencies
- [ ] Integration tests pass

### Stage 3 Success

- [ ] Contract-first workflow documented and functional
- [ ] Contract change impact analysis working
- [ ] Integration tests can be orchestrated
- [ ] Dashboard provides visual dependency graph
- [ ] All documentation complete

---

## 📝 Post-Implementation Tasks

1. **Blog Post**: Announce multi-repo support with examples
2. **Video Tutorial**: Record walkthrough of multi-repo setup
3. **Example Project**: Create public multi-repo example (e-commerce app)
4. **Community Feedback**: Gather feedback and iterate
5. **Performance Optimization**: Profile and optimize based on real usage

---

**END OF DEVELOPMENT PLAN**
