# Implementation Shortcuts Gate

---
metadata:
  type: gate
  threshold: 100%
  on_fail: halt
  purpose: "Detect common developer shortcuts and anti-patterns that compromise code quality"
  scope: "Hardcoding, leftover code, exception handling, stub implementations, test integrity, dependencies"
---

## Purpose

Comprehensive checklist for detecting developer shortcuts and anti-patterns that often slip through standard code review. This gate ensures production-ready code without hidden quality issues.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: Path to story file
  - implementation_files: List of files modified in this story

optional:
  - language: Primary language (auto-detected if not provided)
  - framework: Framework in use (auto-detected if not provided)
```

## Process

### 1. Hardcoding Detection (Weight: 25%)

**Objective**: Identify values that should be externalized to configuration

#### 1.1 Hardcoded URLs / API Endpoints

**Pattern Search** (regex examples):
```regex
# HTTP/HTTPS URLs
https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
# Localhost references
localhost:\d+
127\.0\.0\.1
# API paths with version
/api/v\d+/
```

**Exceptions** (NOT violations):
- URLs in test files for mock servers
- Documentation URLs in comments
- Schema definitions (e.g., JSON Schema $id)

**Severity**: HIGH

#### 1.2 Hardcoded Configuration Values

**Pattern Search**:
```regex
# Timeout values
timeout\s*[:=]\s*\d+
# Retry counts
retry\s*[:=]\s*\d+
maxRetries\s*[:=]\s*\d+
# Page sizes
pageSize\s*[:=]\s*\d+
limit\s*[:=]\s*\d+
# Port numbers
port\s*[:=]\s*\d{4,5}
```

**Exceptions**:
- Constants with clear semantic names (e.g., `const DEFAULT_TIMEOUT = 30000`)
- Test fixtures

**Severity**: MEDIUM

#### 1.3 Hardcoded Credentials

**Pattern Search**:
```regex
# API keys
api[_-]?key\s*[:=]\s*["'][^"']+["']
# Passwords
password\s*[:=]\s*["'][^"']+["']
# Tokens
token\s*[:=]\s*["'][A-Za-z0-9+/=]{20,}["']
# Secrets
secret\s*[:=]\s*["'][^"']+["']
# Connection strings
(mongodb|postgres|mysql|redis)://[^"'\s]+
```

**Exceptions**: NONE - Credentials in code are ALWAYS violations

**Severity**: CRITICAL

#### 1.4 Hardcoded Environment-Specific Values

**Pattern Search**:
```regex
# IP addresses
\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}
# Domain names (excluding common CDNs and known services)
[a-z0-9-]+\.(internal|local|dev|staging|prod)\.[a-z]+
# Environment-specific paths
/home/[a-z]+/
/Users/[A-Za-z]+/
C:\\Users\\
```

**Exceptions**:
- `0.0.0.0`, `127.0.0.1` in server binding
- Test fixtures

**Severity**: HIGH

#### 1.5 Hardcoded UI Text (i18n Violations)

**Objective**: Detect user-facing text that should be externalized for internationalization

**Pattern Search** (in non-test, non-config files):
```regex
# Button/label text in JSX/TSX
<(button|label|span|p|h[1-6]|div|a)([^>]*)>[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ffA-Za-z\s]{3,}<
# Placeholder/title/alt attributes with text
(placeholder|title|alt|aria-label)\s*=\s*["'][A-Za-z\u4e00-\u9fff]{3,}["']
# Error messages
(throw\s+new\s+Error|reject|throw)\s*\(\s*["'][A-Za-z\u4e00-\u9fff\s]{10,}["']
# Alert/confirm/prompt dialogs
(alert|confirm|prompt)\s*\(\s*["'][^"']{5,}["']
# Toast/notification messages
(toast|notify|message|snackbar)\s*[.(]\s*["'][^"']{5,}["']
# Console messages to user (not debug)
console\.(warn|error)\s*\(\s*["'][A-Za-z\u4e00-\u9fff]{10,}["']
```

**Language-Specific Patterns**:

```regex
# React/Vue - text content in components
return\s*\(\s*<[^>]+>\s*["']?[A-Za-z\u4e00-\u9fff\s]{5,}["']?\s*<

# Python - f-strings with user text
f["'][^"']*\{[^}]+\}[^"']*[A-Za-z\u4e00-\u9fff]{5,}["']

# Mobile (Swift/Kotlin)
(Text|Label|Button)\s*\(\s*["'][A-Za-z\u4e00-\u9fff]{3,}["']
```

**Common Violations**:
- `<button>Submit</button>` → Should use `t('submit')` or `{t('submit')}`
- `placeholder="Enter your email"` → Should use i18n function
- `throw new Error("User not found")` → Should use error code + i18n
- `alert("Operation successful!")` → Should use i18n
- `toast.success("Saved!")` → Should use i18n

**Exceptions**:
- Test files (`*.test.*`, `*.spec.*`, `__tests__/`)
- Storybook files (`*.stories.*`)
- Console.log for debugging (covered in Section 2)
- Technical identifiers (class names, IDs, data attributes)
- Comments and documentation strings
- Log messages for developers (not user-facing)
- Projects without i18n requirement (check for i18n library in dependencies)

**Auto-Detection of i18n Requirement**:
Check if project has i18n library:
```bash
# package.json
grep -E "(i18next|react-intl|vue-i18n|@angular/localize|formatjs)" package.json

# Python
grep -E "(babel|gettext|django.utils.translation)" requirements.txt

# If no i18n library: Mark as WARNING, not violation
```

**Severity**:
- MEDIUM (if i18n library exists but text not externalized)
- LOW (if no i18n library in project - just a recommendation)

#### 1.6 Magic Numbers / Strings

**Pattern Search**:
```regex
# Unexplained numbers in conditions
if\s*\([^)]*[<>=]+\s*\d{2,}
# Repeated string literals (same string 3+ times)
# Array indices beyond 0/1
\[\d{2,}\]
```

**Exceptions**:
- Well-known values (HTTP status codes: 200, 400, 401, 403, 404, 500)
- Mathematical constants
- Loop bounds based on known array lengths

**Severity**: LOW (unless in critical business logic, then MEDIUM)

---

### 2. Leftover Code Detection (Weight: 20%)

**Objective**: Identify code that should not be in production

#### 2.1 TODO/FIXME/HACK Comments

**Pattern Search**:
```regex
# Common markers
//\s*(TODO|FIXME|HACK|XXX|BUG|TEMP|TEMPORARY)
#\s*(TODO|FIXME|HACK|XXX|BUG|TEMP|TEMPORARY)
/\*\s*(TODO|FIXME|HACK|XXX)
```

**Severity**:
- TODO in implemented code: LOW (reminder)
- FIXME in production path: MEDIUM
- HACK: HIGH (indicates known bad solution)

#### 2.2 Console/Debug Statements

**Pattern Search** (language-specific):
```regex
# JavaScript/TypeScript
console\.(log|debug|info|warn|error|trace|dir|table)
debugger;

# Python
print\s*\(
pdb\.(set_trace|pm|post_mortem)
breakpoint\(\)

# Java
System\.out\.print
e\.printStackTrace\(\)

# Go
fmt\.Print
log\.Print
```

**Exceptions**:
- Structured logging to proper logger
- Error handling with proper logger

**Severity**: HIGH

#### 2.3 Commented-Out Code

**Pattern Search**:
```regex
# Multiple consecutive commented lines with code patterns
(//.*[{};]\n){3,}
(#.*[=:()]\n){3,}
```

**Heuristic**: Commented lines containing syntax characters (`;`, `{`, `}`, `()`, `=`)

**Severity**: MEDIUM

#### 2.4 Debug-Only Code

**Pattern Search**:
```regex
# Debug flags
if\s*\(?\s*(DEBUG|debug|isDebug|IS_DEBUG)
# Development-only blocks
if\s*\(process\.env\.NODE_ENV\s*===?\s*['"]development['"]
# Artificial delays
sleep\(
Thread\.sleep\(
setTimeout\(.*, \d{4,}\)  # delays > 1 second
```

**Severity**: HIGH (can severely impact production performance)

---

### 3. Exception Handling Anti-patterns (Weight: 20%)

**Objective**: Identify poor exception handling that hides bugs

#### 3.1 Empty Catch Blocks

**Pattern Search**:
```regex
# JavaScript/TypeScript
catch\s*\([^)]*\)\s*\{\s*\}

# Python
except(\s+\w+)?:\s*pass

# Java
catch\s*\([^)]+\)\s*\{\s*\}

# Go
if err != nil \{\s*\}
```

**Severity**: CRITICAL

#### 3.2 Log-Only Exception Handling

**Pattern Search**:
```regex
# Catch that only logs and continues
catch\s*\([^)]+\)\s*\{\s*(console|logger|log)\.[a-z]+\([^)]+\);\s*\}
```

**Note**: This is acceptable ONLY if:
- The error is truly non-critical
- There's a comment explaining why it's safe to continue
- The function can legitimately continue with default behavior

**Severity**: MEDIUM (context-dependent)

#### 3.3 Swallowed Exceptions (Silent Failures)

**Pattern Search**:
```regex
# Return default value in catch without logging
catch\s*\([^)]*\)\s*\{\s*return\s*(null|undefined|false|\[\]|\{\}|0|""|'');?\s*\}
```

**Severity**: HIGH

#### 3.4 Overly Broad Catch

**Pattern Search**:
```regex
# JavaScript/TypeScript
catch\s*\(\s*\w+\s*\)  # without type annotation

# Python
except\s*:
except\s+Exception\s*:
except\s+BaseException\s*:

# Java
catch\s*\(\s*(Exception|Throwable)\s+

# Go - not applicable (explicit error handling)
```

**Severity**: MEDIUM (should catch specific exceptions)

---

### 4. Stub Implementation Detection (Weight: 15%)

**Objective**: Identify incomplete implementations masquerading as complete

#### 4.1 Fake Return Values

**Pattern Search**:
```regex
# Empty returns from non-void functions
return\s*(null|undefined|None|nil|\[\]|\{\}|0|false|""|'');?\s*$

# Placeholder implementations
throw\s+new\s+(Error|NotImplementedError)\s*\(\s*["']Not implemented
raise\s+NotImplementedError
panic\("not implemented"\)
```

**Context Check**: Verify if return value matches function signature expectation

**Severity**: CRITICAL (if in production code path)

#### 4.2 TODO Without Implementation

**Pattern Search**:
```regex
# Function body is just TODO
\{\s*//\s*TODO[^}]*\}
def\s+\w+\([^)]*\):\s*#\s*TODO\s*\n\s*pass
```

**Severity**: CRITICAL

#### 4.3 Mock Data in Production Code

**Pattern Search**:
```regex
# Hardcoded test/mock data
(test|mock|fake|dummy|sample)[A-Z][a-z]*\s*=
# Lorem ipsum
lorem\s+ipsum
# Example.com
example\.(com|org|net)
# Test user data
(test|demo)@
john\.?doe
jane\.?doe
```

**Exception**: Files in `/test/`, `/tests/`, `/__tests__/`, `*.test.*`, `*.spec.*`

**Severity**: HIGH

#### 4.4 Placeholder Functions

**Pattern Search**:
```regex
# Empty functions
function\s+\w+\([^)]*\)\s*\{\s*\}
def\s+\w+\([^)]*\):\s*pass
func\s+\w+\([^)]*\)\s*\{\s*\}

# Functions that only throw not implemented
function\s+\w+[^{]*\{\s*throw\s
```

**Severity**: HIGH

---

### 5. Test Integrity Issues (Weight: 10%)

**Objective**: Ensure tests are meaningful and not bypassed

#### 5.1 Skipped Tests

**Pattern Search**:
```regex
# JavaScript/TypeScript (Jest, Mocha, Jasmine)
(it|test|describe)\.skip\(
x(it|describe)\(
xit\(
xdescribe\(
pending\(\)

# Python
@pytest\.mark\.skip
@unittest\.skip
self\.skipTest\(

# Java
@Ignore
@Disabled

# Go
t\.Skip\(
```

**Severity**: MEDIUM (unless skipping security/critical tests, then HIGH)

#### 5.2 Weakened Assertions

**Git Diff Analysis**: Compare current assertions with previous version
```regex
# Changed from strict to loose
- expect\(.*\)\.toEqual\(
+ expect\(.*\)\.toContain\(

- assertEquals\(
+ assertTrue\(.*\.contains\(

- assert\s+\w+\s*==
+ assert\s+\w+\s+in\s+
```

**Severity**: HIGH (requires justification in commit message)

#### 5.3 Empty Test Cases

**Pattern Search**:
```regex
# Empty test body
it\(['"][^'"]+['"]\s*,\s*\(\)\s*=>\s*\{\s*\}\)
test\(['"][^'"]+['"]\s*,\s*\(\)\s*=>\s*\{\s*\}\)
def\s+test_\w+\([^)]*\):\s*pass
```

**Severity**: MEDIUM

#### 5.4 Happy-Path-Only Tests

**Heuristic Analysis**:
- Count assertions vs code paths
- Check for negative test cases (expect error, expect failure)
- Verify edge case coverage

**Red Flags**:
- No tests with "error", "fail", "invalid", "edge" in name
- No `expect(...).toThrow()` or equivalent
- No boundary value tests

**Severity**: MEDIUM

---

### 6. Dependency Hygiene (Weight: 10%)

**Objective**: Ensure clean, secure dependency management

#### 6.1 Unused Dependencies

**Analysis**:
- Parse package.json/requirements.txt/go.mod/pom.xml
- Search for imports/requires in code
- Flag dependencies not imported anywhere

**Command Examples**:
```bash
# JavaScript
npx depcheck

# Python
pip-autoremove --leaves

# Go
go mod tidy -v
```

**Severity**: LOW

#### 6.2 Dev Dependencies in Production

**Analysis**:
- Check if devDependencies are imported in non-test files
- Common violations: testing libraries, build tools imported at runtime

**Pattern Search**:
```regex
# In src/ files (not test files)
require\(['"]jest
import.*from ['"]@testing-library
from pytest import
```

**Severity**: HIGH

#### 6.3 Duplicate Dependencies

**Analysis**:
- Multiple versions of same package in lock file
- Conflicting peer dependencies

**Severity**: MEDIUM

#### 6.4 Outdated/Vulnerable Dependencies

**Command Examples**:
```bash
# JavaScript
npm audit
yarn audit

# Python
pip-audit
safety check

# Go
govulncheck ./...
```

**Severity**: CRITICAL (if known vulnerabilities), MEDIUM (if outdated)

---

## Output Format

```yaml
implementation_shortcuts:
  result: PASS | FAIL
  overall_score: {percentage}

  sections:
    - name: "Hardcoding Detection"
      weight: 25%
      score: {percentage}
      passed: {true|false}
      findings:
        critical: []
        high: []
        medium: []
        low: []

    - name: "Leftover Code Detection"
      weight: 20%
      score: {percentage}
      passed: {true|false}
      findings: []

    - name: "Exception Handling Anti-patterns"
      weight: 20%
      score: {percentage}
      passed: {true|false}
      findings: []

    - name: "Stub Implementation Detection"
      weight: 15%
      score: {percentage}
      passed: {true|false}
      findings: []

    - name: "Test Integrity Issues"
      weight: 10%
      score: {percentage}
      passed: {true|false}
      findings: []

    - name: "Dependency Hygiene"
      weight: 10%
      score: {percentage}
      passed: {true|false}
      findings: []

  summary:
    critical_count: {count}
    high_count: {count}
    medium_count: {count}
    low_count: {count}

  top_issues:
    - severity: CRITICAL
      category: "Hardcoded Credentials"
      location: "src/config/db.ts:42"
      description: "Database password hardcoded in source"
      required_action: "Move to environment variable or secrets manager"
```

## Decision Logic

**PASS**:
- Zero CRITICAL findings
- Zero HIGH findings in Hardcoding or Exception Handling sections
- Overall score >= 80%

**FAIL**:
- Any CRITICAL finding OR
- Any HIGH finding in Hardcoding (1.3, 1.4) or Exception Handling (3.1, 3.3) OR
- Overall score < 80%

## Usage

**Called by**:
- `dev-implementation-gate.md` - As Section 11
- Direct execution for focused shortcut analysis

**Returns**:
- Structured findings for each section
- Overall pass/fail decision
- Specific locations and required actions for all issues
