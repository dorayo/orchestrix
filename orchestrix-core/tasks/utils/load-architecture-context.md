# Load Architecture Context Utility

## Purpose
Load relevant architecture documents based on story type, supporting both sharded and monolithic architecture configurations.

## Input Parameters
- `story_type`: Backend | Frontend | FullStack

## Output
Returns a structured context object containing loaded architecture information.

## Execution

### Step 0: Read Configuration from core-config.yaml

**CRITICAL**: Always read architecture paths from the LOCAL `core-config.yaml`, never hardcode or guess paths.

```bash
# Read architecture configuration from LOCAL core-config.yaml
ARCH_FILE=$(grep "architectureFile:" core-config.yaml | awk '{print $2}')
ARCH_SHARDED=$(grep "architectureSharded:" core-config.yaml | awk '{print $2}')
ARCH_LOCATION=$(grep "architectureShardedLocation:" core-config.yaml | awk '{print $2}')

# Validate configuration
if [ -z "$ARCH_FILE" ]; then
  echo "❌ ERROR: architectureFile not found in core-config.yaml"
  exit 1
fi

# Determine which path to use based on sharded setting
if [ "$ARCH_SHARDED" = "true" ]; then
  ARCHITECTURE_PATH="$ARCH_LOCATION"
  ARCHITECTURE_MODE="sharded"
  echo "📁 Using sharded architecture from: $ARCHITECTURE_PATH"
else
  ARCHITECTURE_PATH="$ARCH_FILE"
  ARCHITECTURE_MODE="monolithic"
  echo "📄 Using monolithic architecture from: $ARCHITECTURE_PATH"
fi

# Verify the path exists
if [ ! -e "$ARCHITECTURE_PATH" ]; then
  echo "⚠️ WARNING: Architecture path does not exist: $ARCHITECTURE_PATH"
  echo "Please ensure architecture document exists before loading context"
  exit 1
fi
```

**Important Notes**:
- NEVER try to load architecture from product repository path (e.g., `../product-repo/docs/`)
- Implementation repositories have their OWN architecture documents in their LOCAL `docs/` directory
- The `core-config.yaml` in each repository points to its OWN architecture, not the product repo's
- Product repo has `system-architecture.md`, implementation repos have `architecture.md`

### Step 1: Determine Loading Strategy

**If `ARCH_SHARDED = true` (sharded mode):**
- Read index file from `$ARCHITECTURE_PATH/index.md`
- Parse index to identify available architecture documents
- Use index to locate specific document files in `$ARCHITECTURE_PATH` directory

**If `ARCH_SHARDED = false` (monolithic mode):**
- Use monolithic architecture file at `$ARCHITECTURE_PATH`
- Parse sections within the single file

**Error Handling:**
- If ARCHITECTURE_PATH not found: Already handled in Step 0
- If index.md missing (sharded mode): Log warning, attempt to discover files automatically in `$ARCHITECTURE_PATH`

### Step 2: Load Documents by Story Type

#### Documents Loaded for All Story Types:
1. `tech-stack.md` - Technology stack and dependencies
2. `source-tree.md` - Project structure and file organization
3. `coding-standards.md` - Code style and conventions
4. `testing-strategy.md` - Testing approach and frameworks

#### Additional Documents for Backend/API Stories:
5. `data-models.md` - Data structures and entities
6. `database-schema.md` - Database design and relationships
7. `backend-architecture.md` - Backend system architecture
8. `rest-api-spec.md` - API endpoints and contracts
9. `external-apis.md` - Third-party integrations

#### Additional Documents for Frontend/UI Stories:
5. `frontend-architecture.md` - Frontend system architecture
6. `components.md` - UI component library and patterns
7. `core-workflows.md` - User flows and interactions
8. `data-models.md` - Frontend data structures

#### Documents for Full-Stack Stories:
- Load all Backend documents (items 1-9)
- Load all Frontend documents (items 1-4, 5-8)
- Deduplicate common documents (tech-stack, source-tree, coding-standards, testing-strategy, data-models)

**Loading Process:**
1. Build list of required documents based on story_type
2. For each document in the list:
   - Attempt to read document
   - If found: Parse and extract key information
   - If not found: Log warning, continue with remaining documents
3. Track which documents were successfully loaded
4. Track which documents were missing

### Step 3: Extract Key Information

For each loaded document, extract:
- **tech-stack.md**: Languages, frameworks, libraries, versions
- **source-tree.md**: Directory structure, key file locations
- **coding-standards.md**: Naming conventions, patterns, rules
- **testing-strategy.md**: Test types, coverage requirements, tools
- **data-models.md**: Entity definitions, relationships
- **database-schema.md**: Tables, columns, constraints, indexes
- **backend-architecture.md**: Services, layers, patterns
- **rest-api-spec.md**: Endpoints, methods, request/response formats
- **external-apis.md**: Third-party services, authentication, endpoints
- **frontend-architecture.md**: State management, routing, architecture patterns
- **components.md**: Component hierarchy, props, usage
- **core-workflows.md**: User journeys, screen flows

### Step 4: Return Structured Context

Return context object in the following format:

```yaml
context:
  status: success | partial | error
  story_type: Backend | Frontend | FullStack
  architecture_mode: sharded | monolithic
  
  documents_loaded:
    - tech-stack.md
    - source-tree.md
    - coding-standards.md
    # ... list of successfully loaded documents
  
  documents_missing:
    - external-apis.md
    # ... list of documents that could not be loaded
  
  tech_stack:
    languages: [list]
    frameworks: [list]
    libraries: [list]
    versions: {key: value}
  
  file_structure:
    root_directory: path
    key_directories: [list]
    important_files: [list]
  
  standards:
    naming_conventions: {description}
    code_patterns: [list]
    prohibited_patterns: [list]
  
  testing:
    frameworks: [list]
    coverage_requirements: {description}
    test_types: [list]
  
  # Backend-specific (if applicable)
  backend:
    architecture_pattern: {description}
    services: [list]
    data_models: [list]
    database_schema: {description}
    api_endpoints: [list]
    external_integrations: [list]
  
  # Frontend-specific (if applicable)
  frontend:
    architecture_pattern: {description}
    state_management: {description}
    routing: {description}
    components: [list]
    workflows: [list]
  
  metadata:
    loaded_at: timestamp
    total_documents_requested: number
    total_documents_loaded: number
    load_success_rate: percentage
```

## Error Handling

### Document Not Found
- **Action**: Log warning with document name
- **Recovery**: Continue loading remaining documents
- **Impact**: Mark context status as "partial" if some documents missing

### Parse Error
- **Action**: Log error with document name and parse issue
- **Recovery**: Mark document as unavailable, continue with others
- **Impact**: Add to documents_missing list

### Architecture Location Invalid
- **Action**: Log error with provided path
- **Recovery**: Return error context with empty data
- **Impact**: Mark context status as "error"

### Index File Missing (Sharded Mode)
- **Action**: Log warning
- **Recovery**: Attempt to discover architecture files by scanning directory
- **Impact**: May result in incomplete document list

### No Documents Loaded
- **Action**: Log critical error
- **Recovery**: Return error context
- **Impact**: Mark context status as "error", halt calling task

## Usage Examples

### Example 1: Backend Story with Sharded Architecture
```markdown
Execute: utils/load-architecture-context.md
- story_type: Backend

# Utility reads from core-config.yaml:
#   architectureSharded: true
#   architectureShardedLocation: docs/architecture

Result: Context with Backend + common documents loaded from docs/architecture/
```

### Example 2: Frontend Story with Monolithic Architecture
```markdown
Execute: utils/load-architecture-context.md
- story_type: Frontend

# Utility reads from core-config.yaml:
#   architectureSharded: false
#   architectureFile: docs/architecture.md

Result: Context with Frontend + common sections extracted from docs/architecture.md
```

### Example 3: Full-Stack Story
```markdown
Execute: utils/load-architecture-context.md
- story_type: FullStack

# Utility reads from core-config.yaml automatically

Result: Context with all Backend + Frontend documents loaded
```

## Integration with Tasks

This utility is designed to be called from:
- `create-next-story.md` - Load architecture for Dev Notes population
- `develop-story.md` - Load architecture for implementation guidance
- `review-story-technical-accuracy.md` - Load architecture for technical review

### Integration Pattern:
```markdown
# In calling task:

### Step X: Load Architecture Context

Execute: utils/load-architecture-context.md
- story_type: {extracted from epic or story}

# Note: The utility automatically reads architecture_sharded and
# architecture_location from the LOCAL core-config.yaml

Store result in `architecture_context` variable.

If context.status = "error":
  HALT with message: "Cannot load architecture: {context.error}"

If context.status = "partial":
  Log warning: "Some architecture documents missing: {context.documents_missing}"
  Continue with available context

Use `architecture_context` for subsequent steps:
- Tech stack: architecture_context.tech_stack
- File structure: architecture_context.file_structure
- Standards: architecture_context.standards
- Backend info: architecture_context.backend (if applicable)
- Frontend info: architecture_context.frontend (if applicable)
```

## Performance Considerations

- **Caching**: Consider caching loaded architecture context for the session
- **Lazy Loading**: Only parse documents that are actually needed
- **Incremental Loading**: Load common documents first, then type-specific
- **Size Limits**: Warn if individual documents exceed reasonable size (>50KB)

## Validation

Before returning context, validate:
1. At least one document was successfully loaded
2. All required fields in context object are present
3. story_type matches loaded document set
4. No circular references in extracted data

## Token Optimization

This utility reduces token consumption by:
- Loading only relevant documents (not all architecture files)
- Extracting key information (not full document content)
- Providing structured data (easier for LLM to process)
- Avoiding repeated architecture loading across tasks

**Estimated Token Savings**: ~300 tokens per task that uses this utility
