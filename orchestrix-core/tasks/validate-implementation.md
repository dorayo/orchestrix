# Validate Implementation

## Purpose

Validate implementation against architecture standards for quick compliance checking during development.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - implementation_files: List of files added/modified

optional:
  - architecture_docs_path: Path to architecture documents (default from core-config.yaml)
```

## Process

### 1. Load Architecture Context

Execute: `{root}/tasks/utils/load-architecture-context.md`

**Base Documents** (always load):
- `docs/architecture/tech-stack.md`
- `docs/architecture/source-tree.md`
- `docs/architecture/coding-standards.md`
- `docs/architecture/testing-strategy.md`

**Story Type Detection**:
- Analyze story content and implementation files
- Detect: Backend / Frontend / Full-stack / Infrastructure

**Additional Documents** (based on type):
- **Backend**: data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md
- **Frontend**: frontend-architecture.md, components.md, core-workflows.md
- **Full-stack**: All of the above

### 2. Tech Stack Compliance

**Validation**:
- Extract technologies/libraries from implementation files
- Cross-reference with tech-stack.md
- Check version compatibility
- Verify usage patterns

**Check For**:
- Unapproved technologies
- Wrong versions
- Deprecated packages
- Missing dependencies

**Severity**:
- Unapproved tech: CRITICAL
- Wrong version: MAJOR
- Deprecated package: MAJOR
- Missing deps: MINOR

### 3. Naming Convention Compliance

**Validation**:
- File names follow coding-standards.md patterns
- Component names follow conventions
- Variable/function names follow standards
- Test file naming correct

**Check For**:
- Incorrect casing (camelCase vs kebab-case vs PascalCase)
- Non-standard prefixes/suffixes
- Reserved word usage
- Inconsistent naming patterns

**Severity**:
- Critical violations: MAJOR
- Minor inconsistencies: MINOR

### 4. File Structure Alignment

**Validation**:
- File paths match source-tree.md structure
- Files in correct directories
- Test files in proper locations
- Config files follow standards

**Check For**:
- Files in wrong directories
- Missing required structure
- Incorrect test file placement
- Config files misplaced

**Severity**:
- Wrong directory for core files: MAJOR
- Test file misplacement: MAJOR
- Minor structure issues: MINOR

### 5. API Pattern Consistency (Backend/Full-stack)

**If applicable**, validate:
- Endpoint structure follows rest-api-spec.md
- HTTP methods correct for operations
- Response format consistency
- Error response patterns
- Authentication patterns

**Check For**:
- Non-standard endpoints
- Incorrect HTTP methods
- Response format violations
- Missing error handling
- Auth pattern violations

**Severity**:
- Security issues: CRITICAL
- Pattern violations: MAJOR
- Minor inconsistencies: MINOR

### 6. Data Model Alignment (Backend/Full-stack)

**If applicable**, validate:
- Models match data-models.md definitions
- Field names and types correct
- Relationships properly defined
- Validation rules consistent

**Check For**:
- Model definition mismatches
- Wrong field types
- Missing required fields
- Incorrect relationships

**Severity**:
- Critical mismatches: MAJOR
- Missing fields: MAJOR
- Type inconsistencies: MINOR

### 7. Testing Strategy Compliance

**Validation**:
- Test file structure follows testing-strategy.md
- Test levels appropriate (unit/integration/e2e)
- Coverage meets requirements
- Test naming conventions

**Check For**:
- Wrong test levels
- Insufficient coverage
- Missing edge cases
- Incorrect test structure

**Severity**:
- Missing critical tests: MAJOR
- Coverage gaps: MAJOR
- Minor test issues: MINOR

### 8. Generate Validation Report

**Structure**:

```yaml
validation_report:
  story_id: {story_id}
  validation_date: {timestamp}
  files_validated: {count}

  compliance_summary:
    tech_stack: {PASS/FAIL}
    naming_conventions: {PASS/FAIL}
    file_structure: {PASS/FAIL}
    api_patterns: {PASS/FAIL/N_A}
    data_models: {PASS/FAIL/N_A}
    testing_strategy: {PASS/FAIL}

  issues:
    critical:
      - issue: {description}
        location: {file:line}
        recommendation: {fix}
    major:
      - issue: {description}
        location: {file:line}
        recommendation: {fix}
    minor:
      - issue: {description}
        location: {file:line}
        recommendation: {fix}

  overall_result: {PASS/FAIL}
  critical_count: {count}
  major_count: {count}
  minor_count: {count}
```

## Decision Logic

**PASS** (Overall compliance acceptable):
- Zero critical issues
- ≤2 major issues
- Minor issues acceptable

**FAIL** (Compliance issues require fixes):
- Any critical issues
- >2 major issues
- Multiple pattern violations

## Output

### On PASS

```yaml
result: PASS
message: "Implementation complies with architecture standards"
compliance_score: {percentage}
minor_issues: {count}
recommendations:
  - {optional improvement 1}
  - {optional improvement 2}
```

### On FAIL

```yaml
result: FAIL
message: "Implementation has architecture compliance issues"
compliance_score: {percentage}
critical_issues: {count}
major_issues: {count}
blocking: true

required_fixes:
  critical:
    - issue: {description}
      file: {path}
      current: {what exists}
      expected: {what's required}
      fix: {how to fix}
  major:
    - issue: {description}
      file: {path}
      current: {what exists}
      expected: {what's required}
      fix: {how to fix}
```

## Usage Context

Called by:
- `dev-self-review.md` (before marking Review)
- Dev agent during implementation (optional, for quick checks)

## Comparison with Architect Review

**This Validation** (Quick, Dev-focused):
- Fast compliance checking
- Focus on obvious violations
- Dev can run multiple times
- Automated pattern matching

**Architect Review** (Comprehensive, Design-focused):
- Deep technical accuracy analysis
- Design pattern evaluation
- Integration feasibility
- Architectural guidance
- 10-point scoring system

**When to Use**:
- Use this: During implementation for quick checks
- Use Architect: For comprehensive design review before Dev starts

## Exit Conditions

**Return to Caller**:
- Validation complete with result (PASS/FAIL)
- Report generated and logged
- Issues documented

**Do NOT**:
- Modify any files
- Update story status
- Make decisions beyond validation

## Key Principles

- **Fast and focused**: Quick compliance checks, not deep analysis
- **Actionable feedback**: Specific locations and fixes
- **Non-blocking for minor issues**: Allow progress with recommendations
- **Critical issues block**: Must fix security and core violations
- **Educational**: Help Dev learn architecture standards

## References

- `tasks/utils/load-architecture-context.md`
- Architecture documents in `docs/architecture/`
- `data/technical-preferences.md`
