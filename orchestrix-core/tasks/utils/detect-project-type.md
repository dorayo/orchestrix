# detect-project-type

Detect project type to determine appropriate testing strategy.

## Purpose

Analyze the project structure and dependencies to identify whether it's a web frontend,
web backend, CLI tool, fullstack application, or library. This determines which testing
tools and approaches QA should use.

## Inputs

```yaml
required: []
optional:
  - project_root: string  # Defaults to current working directory
```

## Process

### Step 1: Read Project Configuration

1. **Read package.json** (if exists)
   - Extract `dependencies` and `devDependencies`
   - Check for `bin` field (CLI indicator)
   - Check for `main`, `module`, `exports` fields (library indicator)

2. **Check for framework-specific config files**:
   - `next.config.js/ts` → Next.js
   - `nuxt.config.js/ts` → Nuxt
   - `vite.config.js/ts` → Vite
   - `angular.json` → Angular
   - `svelte.config.js` → SvelteKit
   - `remix.config.js` → Remix

3. **Check for backend indicators**:
   - `Dockerfile` or `docker-compose.yml`
   - `src/routes/` or `src/api/` directories
   - `src/controllers/` directory

### Step 2: Classify Project Type

Apply detection rules in priority order:

```yaml
detection_rules:
  # Priority 1: CLI Tool
  cli_tool:
    indicators:
      - package.json has "bin" field
      - src/cli/ or bin/ directory exists
      - Dependencies include: commander, yargs, inquirer, meow, oclif
    confidence: HIGH if bin field exists, MEDIUM if only cli dependencies

  # Priority 2: Web Frontend (SPA or SSR)
  web_frontend:
    indicators:
      - Dependencies include: react, vue, angular, svelte, solid-js
      - Config files: next.config.*, nuxt.config.*, vite.config.*
      - Directories: src/components/, src/pages/, app/
      - tsconfig.json has jsx settings
    subtypes:
      next: next.config.* exists
      nuxt: nuxt.config.* exists
      vite_react: vite.config.* AND react in dependencies
      create_react_app: react-scripts in dependencies
      angular: angular.json exists
      vue: vue in dependencies (no nuxt)
      svelte: svelte.config.* exists

  # Priority 3: Web Backend (API Server)
  web_backend:
    indicators:
      - Dependencies include: express, fastify, hono, nest, koa, hapi
      - Directories: src/routes/, src/api/, src/controllers/
      - No frontend framework detected
    subtypes:
      express: express in dependencies
      fastify: fastify in dependencies
      nest: @nestjs/core in dependencies
      hono: hono in dependencies

  # Priority 4: Fullstack (Frontend + Backend)
  fullstack:
    indicators:
      - Both frontend AND backend indicators present
      - Monorepo with apps/packages structure
      - Next.js or Nuxt with API routes
    subtypes:
      next_fullstack: next.config.* AND src/app/api/ or pages/api/
      nuxt_fullstack: nuxt.config.* AND server/ directory
      monorepo: packages/ or apps/ directory with multiple projects

  # Priority 5: Library/Package
  library:
    indicators:
      - No bin field
      - No frontend framework
      - No backend framework
      - Has main/module/exports in package.json
      - Primary purpose is to be imported by other projects
    subtypes:
      npm_package: main or module field exists
      typescript_lib: tsconfig.json with declaration: true
```

### Step 3: Determine Test Strategy

Map project type to testing approach:

```yaml
test_strategies:
  cli_tool:
    primary_tool: bash
    actions:
      - Execute CLI commands via Bash
      - Verify stdout/stderr output
      - Check exit codes
      - Test help and version flags
      - Test error handling
    example: |
      # Test basic command
      ./cli --help
      echo "Exit code: $?"

      # Test with arguments
      ./cli create --name "test"

  web_frontend:
    primary_tool: playwright_mcp
    fallback_tool: chrome_devtools_mcp
    actions:
      - Navigate to pages
      - Interact with UI elements
      - Fill and submit forms
      - Verify visual states
      - Check console for errors
      - Validate network requests
    example: |
      # Navigate and snapshot
      mcp__playwright__browser_navigate: http://localhost:3000
      mcp__playwright__browser_snapshot

      # Interact with form
      mcp__playwright__browser_fill_form: [fields]
      mcp__playwright__browser_click: submit button

  web_backend:
    primary_tool: bash_curl
    actions:
      - Send HTTP requests via curl
      - Validate response status codes
      - Check response body structure
      - Test authentication flows
      - Verify error responses
    example: |
      # Health check
      curl -s http://localhost:8080/health

      # API endpoint test
      curl -X POST http://localhost:8080/api/users \
        -H "Content-Type: application/json" \
        -d '{"name": "test"}'

  fullstack:
    primary_tool: combined
    actions:
      - Start both frontend and backend
      - Test API endpoints with curl
      - Test UI with Playwright
      - Verify frontend-backend integration
    startup_order:
      - backend first (wait for ready)
      - frontend second (wait for ready)

  library:
    primary_tool: automated_tests_only
    actions:
      - Run npm test / yarn test
      - Check test coverage
      - No E2E testing needed
    note: "Libraries are tested via unit/integration tests only"
```

### Step 4: Detect Startup Commands

Identify how to start the project for testing:

```yaml
startup_detection:
  # Check package.json scripts
  script_priority:
    - dev        # Development server with hot reload
    - start:dev  # Alternative dev server naming
    - serve      # Static file serving
    - preview    # Production preview
    - start      # Production start (may need build first)

  # Framework-specific defaults
  framework_defaults:
    next: "npm run dev"        # Port 3000
    nuxt: "npm run dev"        # Port 3000
    vite: "npm run dev"        # Port 5173
    cra: "npm start"           # Port 3000
    express: "npm run dev"     # Port 3000/8080
    nest: "npm run start:dev"  # Port 3000

  # Docker detection
  docker:
    docker_compose: "docker-compose up -d"
    dockerfile: "docker build -t test . && docker run -p 3000:3000 test"
```

## Output

Return project detection results:

```yaml
project_type:
  type: web_frontend | web_backend | cli_tool | fullstack | library
  subtype: next | express | npm_package | etc.
  confidence: HIGH | MEDIUM | LOW

test_strategy:
  primary_tool: playwright_mcp | bash | bash_curl | automated_tests_only
  fallback_tool: chrome_devtools_mcp | null
  requires_environment: true | false
  startup_command: "npm run dev"
  expected_port: 3000
  ready_check:
    type: http | tcp | output
    target: "http://localhost:3000" | "listening on port"

detected_indicators:
  frontend_framework: react | vue | angular | svelte | null
  backend_framework: express | fastify | nest | null
  has_cli: true | false
  has_docker: true | false
  package_manager: npm | yarn | pnpm | bun
```

## Example Output

```yaml
# Next.js Fullstack Application
project_type:
  type: fullstack
  subtype: next_fullstack
  confidence: HIGH

test_strategy:
  primary_tool: playwright_mcp
  fallback_tool: chrome_devtools_mcp
  requires_environment: true
  startup_command: "npm run dev"
  expected_port: 3000
  ready_check:
    type: http
    target: "http://localhost:3000"

detected_indicators:
  frontend_framework: react
  backend_framework: null  # Next.js API routes
  has_cli: false
  has_docker: false
  package_manager: npm
```

```yaml
# Express.js API Server
project_type:
  type: web_backend
  subtype: express
  confidence: HIGH

test_strategy:
  primary_tool: bash_curl
  fallback_tool: null
  requires_environment: true
  startup_command: "npm run dev"
  expected_port: 8080
  ready_check:
    type: output
    target: "listening on port 8080"

detected_indicators:
  frontend_framework: null
  backend_framework: express
  has_cli: false
  has_docker: true
  package_manager: npm
```

```yaml
# CLI Tool
project_type:
  type: cli_tool
  subtype: commander_cli
  confidence: HIGH

test_strategy:
  primary_tool: bash
  fallback_tool: null
  requires_environment: false
  startup_command: null
  expected_port: null
  ready_check: null

detected_indicators:
  frontend_framework: null
  backend_framework: null
  has_cli: true
  has_docker: false
  package_manager: npm
```

## Notes

- This detection runs once at the start of QA review
- Results are cached for the duration of the review session
- If detection confidence is LOW, QA should ask user for clarification
- For monorepos, detect the specific package/app being tested
