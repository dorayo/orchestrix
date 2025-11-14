# Document an Existing Project

## Purpose

Generate comprehensive documentation for existing projects optimized for AI development agents. This task creates structured reference materials that enable AI agents to understand project context, conventions, and patterns for effective contribution to any codebase.

## Task Instructions

### 1. Initial Project Analysis

**CRITICAL:** First, check if a PRD or requirements document exists in context. If yes, use it to focus your documentation efforts on relevant areas only.

**IF PRD EXISTS**:

- Review the PRD to understand what enhancement/feature is planned
- Identify which modules, services, or areas will be affected
- Focus documentation ONLY on these relevant areas
- Skip unrelated parts of the codebase to keep docs lean

**IF NO PRD EXISTS**:
Ask the user:

"I notice you haven't provided a PRD or requirements document. To create more focused and useful documentation, I recommend one of these options:

1. **Create a PRD first** - Would you like me to help create a brownfield PRD before documenting? This helps focus documentation on relevant areas.

2. **Provide existing requirements** - Do you have a requirements document, epic, or feature description you can share?

3. **Describe the focus** - Can you briefly describe what enhancement or feature you're planning? For example:
   - 'Adding payment processing to the user service'
   - 'Refactoring the authentication module'
   - 'Integrating with a new third-party API'

4. **Document everything** - Or should I proceed with comprehensive documentation of the entire codebase? (Note: This may create excessive documentation for large projects)

Please let me know your preference, or I can proceed with full documentation if you prefer."

Based on their response:

- If they choose option 1-3: Use that context to focus documentation
- If they choose option 4 or decline: Proceed with comprehensive analysis below

Begin by conducting analysis of the existing project. Use available tools to:

1. **Project Structure Discovery**: Examine the root directory structure, identify main folders, and understand the overall organization
2. **Technology Stack Identification**: Look for package.json, requirements.txt, Cargo.toml, pom.xml, etc. to identify languages, frameworks, and dependencies
3. **Build System Analysis**: Find build scripts, CI/CD configurations, and development commands
4. **Existing Documentation Review**: Check for README files, docs folders, and any existing documentation
5. **Code Pattern Analysis**: Sample key files to understand coding patterns, naming conventions, and architectural approaches

Ask the user these elicitation questions to better understand their needs:

- What is the primary purpose of this project?
- Are there any specific areas of the codebase that are particularly complex or important for agents to understand?
- What types of tasks do you expect AI agents to perform on this project? (e.g., bug fixes, feature additions, refactoring, testing)
- Are there any existing documentation standards or formats you prefer?
- What level of technical detail should the documentation target? (junior developers, senior developers, mixed team)
- Is there a specific feature or enhancement you're planning? (This helps focus documentation)

### 2. Deep Codebase Analysis

CRITICAL: Before generating documentation, conduct extensive analysis of the existing codebase:

1. **Explore Key Areas**:
   - Entry points (main files, index files, app initializers)
   - Configuration files and environment setup
   - Package dependencies and versions
   - Build and deployment configurations
   - Test suites and coverage

2. **Ask Clarifying Questions**:
   - "I see you're using [technology X]. Are there any custom patterns or conventions I should document?"
   - "What are the most critical/complex parts of this system that developers struggle with?"
   - "Are there any undocumented 'tribal knowledge' areas I should capture?"
   - "What technical debt or known issues should I document?"
   - "Which parts of the codebase change most frequently?"

3. **Map the Reality**:
   - Identify ACTUAL patterns used (not theoretical best practices)
   - Find where key business logic lives
   - Locate integration points and external dependencies
   - Document workarounds and technical debt
   - Note areas that differ from standard patterns

**IF PRD PROVIDED**: Also analyze what would need to change for the enhancement

### 3. Core Documentation Generation

[[LLM: Generate a comprehensive BROWNFIELD architecture document that reflects the ACTUAL state of the codebase.

**CRITICAL**: This is NOT an aspirational architecture document. Document what EXISTS, including:

- Technical debt and workarounds
- Inconsistent patterns between different parts
- Legacy code that can't be changed
- Integration constraints
- Performance bottlenecks

**Document Structure**:

# [Project Name] Existing System Analysis

## Introduction

This document captures the CURRENT STATE of the [Project Name] codebase, including technical debt, workarounds, and real-world patterns. It serves as an intermediate analysis document to inform brownfield PRD and architecture planning.

### Document Scope

[If PRD provided: "Focused on areas relevant to: {enhancement description}"]
[If no PRD: "Comprehensive documentation of entire system"]

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| [Date] | 1.0 | Initial brownfield analysis | [Analyst] |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/index.js` (or actual entry point)
- **Configuration**: `config/app.config.js`, `.env.example`
- **Core Business Logic**: `src/services/`, `src/domain/`
- **API Definitions**: `src/routes/` or link to OpenAPI spec
- **Database Models**: `src/models/` or link to schema files
- **Key Algorithms**: [List specific files with complex logic]

### If PRD Provided - Enhancement Impact Areas

[Highlight which files/modules will be affected by the planned enhancement]

## High Level Architecture

### Technical Summary

[Overall architecture style, patterns, and key design decisions]

### Repository Structure Reality Check

- Type: [Monorepo/Polyrepo/Hybrid]
- Package Manager: [npm/yarn/pnpm]
- Notable: [Any unusual structure decisions]

## Tech Stack

Document the actual technology stack used in the project:

| Category | Technology | Version | Notes |
|----------|------------|---------|--------|
| Runtime | Node.js | 16.x | [Any constraints] |
| Framework | Express | 4.18.2 | [Custom middleware?] |
| Database | PostgreSQL | 13 | [Connection pooling setup] |

etc...

## Source Tree

### Project Structure (Actual)

```text
project-root/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic (NOTE: inconsistent patterns between user and payment services)
│   ├── models/          # Database models (Sequelize)
│   ├── utils/           # Mixed bag - needs refactoring
│   └── legacy/          # DO NOT MODIFY - old payment system still in use
├── tests/               # Jest tests (60% coverage)
├── scripts/             # Build and deployment scripts
└── config/              # Environment configs
```

### Key Modules and Their Purpose

- **User Management**: `src/services/userService.js` - Handles all user operations
- **Authentication**: `src/middleware/auth.js` - JWT-based, custom implementation
- **Payment Processing**: `src/legacy/payment.js` - CRITICAL: Do not refactor, tightly coupled
- **[List other key modules with their actual files]**

## Coding Standards

Document the actual coding conventions, patterns, and standards used in this project:

### Code Style and Conventions

- **Language Style Guide**: [ESLint config, Prettier config, or other style guides]
- **Naming Conventions**:
  - Files: [kebab-case, camelCase, etc.]
  - Variables: [camelCase, snake_case, etc.]
  - Classes: [PascalCase, etc.]
  - Constants: [UPPER_SNAKE_CASE, etc.]
- **Code Organization**: [How code is structured within files]

### Linting and Formatting

- **Linter**: [ESLint, Pylint, etc.]
- **Formatter**: [Prettier, Black, etc.]
- **Configuration Files**: [.eslintrc.js, .prettierrc, etc.]
- **Pre-commit Hooks**: [Husky, lint-staged, etc.]

### Testing Conventions

- **Test Framework**: [Jest, Mocha, PyTest, etc.]
- **Test File Naming**: [*.test.js, *.spec.js, test_*.py, etc.]
- **Test Organization**: [co-located with source, separate test directory]
- **Coverage Requirements**: [Minimum coverage percentage]

### Documentation Standards

- **Code Comments**: [When and how to comment]
- **API Documentation**: [JSDoc, Swagger, etc.]
- **README Standards**: [What should be documented]

### Common Patterns and Practices

- **Error Handling**: [Try-catch patterns, error classes, etc.]
- **Async Patterns**: [Promises, async/await, callbacks]
- **Dependency Injection**: [How dependencies are managed]
- **Configuration Management**: [Environment variables, config files]

### Project-Specific Conventions

- **[Any specific patterns unique to this project]**
- **[Legacy patterns that must be maintained]**
- **[New patterns introduced for enhancements]**

## Data Models and APIs

### Data Models

Instead of duplicating, reference actual model files:
- **User Model**: See `src/models/User.js`
- **Order Model**: See `src/models/Order.js`
- **Related Types**: TypeScript definitions in `src/types/`

### API Specifications

- **OpenAPI Spec**: `docs/api/openapi.yaml` (if exists)
- **Postman Collection**: `docs/api/postman-collection.json`
- **Manual Endpoints**: [List any undocumented endpoints discovered]

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Payment Service**: Legacy code in `src/legacy/payment.js` - tightly coupled, no tests
2. **User Service**: Different pattern than other services, uses callbacks instead of promises
3. **Database Migrations**: Manually tracked, no proper migration tool
4. **[Other significant debt]**

### Workarounds and Gotchas

- **Environment Variables**: Must set `NODE_ENV=production` even for staging (historical reason)
- **Database Connections**: Connection pool hardcoded to 10, changing breaks payment service
- **[Other workarounds developers need to know]**

## Gaps and Recommendations

Document missing elements, improvement opportunities, and recommendations for future enhancements:

### Missing Documentation

- **API Documentation**: [What APIs lack documentation]
- **Architecture Diagrams**: [Missing visual representations]
- **Deployment Guides**: [Gaps in operational documentation]
- **[Other documentation gaps]**

### Code Quality Improvements

- **Test Coverage**: [Areas needing better test coverage]
- **Code Duplication**: [Repeated code that should be refactored]
- **Complex Methods**: [Functions/methods that need simplification]
- **[Other code quality issues]**

### Architecture Improvements

- **Separation of Concerns**: [Areas where responsibilities are mixed]
- **Dependency Management**: [Tight coupling that should be loosened]
- **Scalability Concerns**: [Bottlenecks or scaling limitations]
- **[Other architectural improvements]**

### Technology Updates

- **Outdated Dependencies**: [Libraries needing updates]
- **Framework Versions**: [Framework upgrades to consider]
- **Security Vulnerabilities**: [Known security issues in dependencies]
- **[Other technology recommendations]**

### Process Improvements

- **CI/CD Pipeline**: [Automation opportunities]
- **Monitoring and Logging**: [Observability gaps]
- **Error Handling**: [Areas needing better error management]
- **[Other process improvements]**

### Prioritized Recommendations

1. **High Priority**: [Critical improvements needed before enhancement]
2. **Medium Priority**: [Should address soon]
3. **Low Priority**: [Nice to have, can defer]

## Integration Points and External Dependencies

### External Services

| Service | Purpose | Integration Type | Key Files |
|---------|---------|------------------|-----------|
| Stripe | Payments | REST API | `src/integrations/stripe/` |
| SendGrid | Emails | SDK | `src/services/emailService.js` |

etc...

### Internal Integration Points

- **Frontend Communication**: REST API on port 3000, expects specific headers
- **Background Jobs**: Redis queue, see `src/workers/`
- **[Other integrations]**

## Development and Deployment

### Local Development Setup

1. Actual steps that work (not ideal steps)
2. Known issues with setup
3. Required environment variables (see `.env.example`)

### Build and Deployment Process

- **Build Command**: `npm run build` (webpack config in `webpack.config.js`)
- **Deployment**: Manual deployment via `scripts/deploy.sh`
- **Environments**: Dev, Staging, Prod (see `config/environments/`)

## Testing Reality

### Current Test Coverage

- Unit Tests: 60% coverage (Jest)
- Integration Tests: Minimal, in `tests/integration/`
- E2E Tests: None
- Manual Testing: Primary QA method

### Running Tests

```bash
npm test           # Runs unit tests
npm run test:integration  # Runs integration tests (requires local DB)
```

## If Enhancement PRD Provided - Impact Analysis

### Files That Will Need Modification

Based on the enhancement requirements, these files will be affected:
- `src/services/userService.js` - Add new user fields
- `src/models/User.js` - Update schema
- `src/routes/userRoutes.js` - New endpoints
- [etc...]

### New Files/Modules Needed

- `src/services/newFeatureService.js` - New business logic
- `src/models/NewFeature.js` - New data model
- [etc...]

### Integration Considerations

- Will need to integrate with existing auth middleware
- Must follow existing response format in `src/utils/responseFormatter.js`
- [Other integration points]

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run migrate     # Run database migrations
npm run seed        # Seed test data
```

### Debugging and Troubleshooting

- **Logs**: Check `logs/app.log` for application logs
- **Debug Mode**: Set `DEBUG=app:*` for verbose logging
- **Common Issues**: See `docs/troubleshooting.md`]]

### 4. Document Delivery

1. **In Web UI (Gemini, ChatGPT, Claude)**:
   - Present the entire document in one response (or multiple if too long)
   - Tell user to copy and save as `docs/existing-system-analysis.md`
   - This is an intermediate document for understanding the current system

2. **In IDE Environment**:
   - Create the document as `docs/existing-system-analysis.md`
   - Inform user this document captures the existing system's real state
   - This document will be used as input for creating brownfield PRD and architecture documents

The document should be comprehensive enough that future agents can understand:

- The actual state of the system (not idealized)
- Where to find key files and logic
- What technical debt exists
- What constraints must be respected
- If PRD provided: What needs to change for the enhancement]]

### 5. Quality Assurance

CRITICAL: Before finalizing the document:

1. **Accuracy Check**: Verify all technical details match the actual codebase
2. **Completeness Review**: Ensure all major system components are documented
3. **Focus Validation**: If user provided scope, verify relevant areas are emphasized
4. **Clarity Assessment**: Check that explanations are clear for AI agents
5. **Navigation**: Ensure document has clear section structure for easy reference

Apply the advanced elicitation task after major sections to refine based on user feedback.

## Success Criteria

- Single comprehensive existing system analysis document created
- Document reflects REALITY including technical debt and workarounds
- Key sections capture actual current state:
  - **Tech Stack**: Current technology choices and versions (as-is, not idealized)
  - **Source Tree**: Actual project structure and organization
  - **Coding Standards**: Real conventions and patterns used (including poor practices)
- Key files and modules are referenced with actual paths
- Models/APIs reference source files rather than duplicating content
- If PRD provided: Clear impact analysis showing what needs to change
- Document enables understanding of the actual codebase for planning enhancements
- Technical constraints and "gotchas" are clearly documented
- **Gaps and Recommendations** section identifies improvement opportunities
- Document serves as input for brownfield PRD and architecture planning

## Notes

- This task creates an INTERMEDIATE analysis document, not the final architecture document
- Output file: `docs/existing-system-analysis.md`
- This document is NOT sharded (it's input for creating final architecture.md)
- This document is NOT loaded by Dev agents (they load docs/architecture/ from final architecture.md)
- References actual files rather than duplicating content when possible
- Documents technical debt, workarounds, and constraints honestly
- The goal is to provide realistic context for enhancement planning
- **Section Naming**: Sections match architecture template structure for easier reference when creating brownfield architecture
- **Next Steps**: Use this document as input for:
  1. `@pm *create-doc brownfield-prd-tmpl.yaml` (create enhancement PRD)
  2. `@architect *create-doc brownfield-architecture-tmpl.yaml` (create enhancement architecture with improved standards)