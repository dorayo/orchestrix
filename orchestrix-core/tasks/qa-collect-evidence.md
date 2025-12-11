# qa-collect-evidence

Collect and organize test evidence for issue reporting.

## Purpose

Gather screenshots, logs, and other artifacts that document issues found during testing.
Organize evidence in a structured format that can be referenced in Gate files and handoffs.

## Inputs

```yaml
required:
  - story_id: string
  - issues: array  # Issues found during testing
optional:
  - project_root: string  # Defaults to current working directory
```

## Evidence Directory Structure

```
docs/qa/evidence/{story_id}/
├── screenshots/
│   ├── {story_id}-{step}-{timestamp}.png
│   └── ...
├── logs/
│   ├── {story_id}-console-{timestamp}.log
│   ├── {story_id}-network-{timestamp}.log
│   └── {story_id}-test-output-{timestamp}.log
└── recordings/
    └── {story_id}-flow-{timestamp}.webm  (optional)
```

## Process

### Step 1: Create Evidence Directory

```bash
EVIDENCE_DIR="docs/qa/evidence/${STORY_ID}"

# Create directory structure
mkdir -p "${EVIDENCE_DIR}/screenshots"
mkdir -p "${EVIDENCE_DIR}/logs"
mkdir -p "${EVIDENCE_DIR}/recordings"

echo "Evidence directory created: ${EVIDENCE_DIR}"
```

### Step 2: Collect Screenshots

For each issue that needs visual evidence:

#### Using Playwright MCP

```yaml
tool: mcp__playwright__browser_take_screenshot
params:
  filename: "docs/qa/evidence/{story_id}/screenshots/{story_id}-{issue_id}-{timestamp}.png"
  type: "png"

# For full page screenshots
tool: mcp__playwright__browser_take_screenshot
params:
  filename: "docs/qa/evidence/{story_id}/screenshots/{story_id}-fullpage-{timestamp}.png"
  fullPage: true
```

#### Using Chrome DevTools MCP

```yaml
tool: mcp__chrome-devtools__take_screenshot
params:
  filePath: "docs/qa/evidence/{story_id}/screenshots/{story_id}-{issue_id}-{timestamp}.png"
  format: "png"
```

### Step 3: Collect Console Logs

Capture browser console output:

#### Using Playwright MCP

```yaml
tool: mcp__playwright__browser_console_messages
params:
  level: "info"  # Includes error, warning, info, debug

# Save to file
save_output_to: "docs/qa/evidence/{story_id}/logs/{story_id}-console-{timestamp}.log"
```

#### Using Chrome DevTools MCP

```yaml
tool: mcp__chrome-devtools__list_console_messages
params:
  types: ["error", "warn", "log"]
  pageSize: 100

# Save to file
save_output_to: "docs/qa/evidence/{story_id}/logs/{story_id}-console-{timestamp}.log"
```

### Step 4: Collect Network Logs

Capture network request failures:

#### Using Playwright MCP

```yaml
tool: mcp__playwright__browser_network_requests
params:
  includeStatic: false

# Filter and save failed requests
filter: status >= 400 OR status == 0
save_output_to: "docs/qa/evidence/{story_id}/logs/{story_id}-network-{timestamp}.log"
```

#### Using Chrome DevTools MCP

```yaml
tool: mcp__chrome-devtools__list_network_requests
params:
  pageSize: 100
  resourceTypes: ["xhr", "fetch", "document"]

# Save to file
save_output_to: "docs/qa/evidence/{story_id}/logs/{story_id}-network-{timestamp}.log"
```

### Step 5: Collect CLI/API Output

For CLI and API testing, capture command output:

```bash
# CLI output
{CLI_COMMAND} 2>&1 | tee "docs/qa/evidence/${STORY_ID}/logs/${STORY_ID}-cli-${TIMESTAMP}.log"

# API response
curl -v "${API_URL}" 2>&1 | tee "docs/qa/evidence/${STORY_ID}/logs/${STORY_ID}-api-${TIMESTAMP}.log"
```

### Step 6: Organize Evidence by Issue

Link evidence to specific issues:

```yaml
issue_evidence_mapping:
  - issue_id: "E2E-001"
    severity: HIGH
    finding: "Login button unresponsive after validation error"
    evidence:
      screenshots:
        - path: "screenshots/1.3-E2E-001-before-20250115T100000.png"
          description: "Form with validation error displayed"
          timestamp: "2025-01-15T10:00:00Z"
        - path: "screenshots/1.3-E2E-001-after-20250115T100005.png"
          description: "Button still disabled after fixing error"
          timestamp: "2025-01-15T10:00:05Z"
      logs:
        - path: "logs/1.3-console-20250115T100000.log"
          description: "Console output showing no errors"
      reproduction_steps: |
        1. Navigate to /login
        2. Enter invalid email format (e.g., "notanemail")
        3. Click Login button
        4. Observe validation error appears
        5. Correct the email to valid format
        6. Click Login button again
        7. EXPECTED: Login attempt should be made
        8. ACTUAL: Button remains disabled

  - issue_id: "E2E-002"
    severity: MEDIUM
    finding: "Console error on dashboard load"
    evidence:
      screenshots:
        - path: "screenshots/1.3-E2E-002-dashboard-20250115T100100.png"
          description: "Dashboard page with visible content"
      logs:
        - path: "logs/1.3-console-20250115T100100.log"
          description: "Console showing TypeError"
      reproduction_steps: |
        1. Login with valid credentials
        2. Navigate to /dashboard
        3. Open browser DevTools Console
        4. EXPECTED: No errors
        5. ACTUAL: TypeError: Cannot read property 'map' of undefined
```

### Step 7: Generate Evidence Index

Create an index file for easy navigation:

```yaml
# docs/qa/evidence/{story_id}/evidence-index.yaml
story_id: "1.3"
generated_at: "2025-01-15T10:15:00Z"
total_issues: 2
total_files: 6

issues:
  - id: "E2E-001"
    severity: HIGH
    files:
      - type: screenshot
        path: "screenshots/1.3-E2E-001-before-20250115T100000.png"
      - type: screenshot
        path: "screenshots/1.3-E2E-001-after-20250115T100005.png"
      - type: log
        path: "logs/1.3-console-20250115T100000.log"

  - id: "E2E-002"
    severity: MEDIUM
    files:
      - type: screenshot
        path: "screenshots/1.3-E2E-002-dashboard-20250115T100100.png"
      - type: log
        path: "logs/1.3-console-20250115T100100.log"

orphan_files:  # Files not linked to specific issues
  - path: "logs/1.3-test-output-20250115T095500.log"
    description: "Automated test output"
```

### Step 8: Validate Evidence

Verify all referenced evidence files exist:

```bash
# Check all files in index
for FILE in $(yq '.issues[].files[].path' evidence-index.yaml); do
  if [ ! -f "${EVIDENCE_DIR}/${FILE}" ]; then
    echo "WARNING: Missing evidence file: ${FILE}"
  fi
done

# Check file sizes (flag very large files)
find "${EVIDENCE_DIR}" -type f -size +5M -exec echo "WARNING: Large file: {}" \;
```

## Output

Return evidence collection summary:

```yaml
evidence_collected: true
evidence_directory: "docs/qa/evidence/1.3"

files:
  screenshots: 4
  logs: 3
  recordings: 0
  total: 7
  total_size_kb: 2340

issues_with_evidence:
  - issue_id: "E2E-001"
    evidence_count: 3
    has_screenshot: true
    has_logs: true
    has_reproduction_steps: true

  - issue_id: "E2E-002"
    evidence_count: 2
    has_screenshot: true
    has_logs: true
    has_reproduction_steps: true

index_file: "docs/qa/evidence/1.3/evidence-index.yaml"

warnings:
  - "No recording captured for E2E-001 (complex flow)"
```

## Best Practices

1. **Timestamp everything** - Include timestamps in filenames for chronological ordering
2. **Descriptive names** - Use issue IDs and step names in filenames
3. **Keep files small** - Compress images, truncate long logs
4. **Always include reproduction steps** - Make issues reproducible
5. **Link evidence to issues** - Never leave orphan evidence files
6. **Capture before/after** - Show state change for UI issues

## Notes

- Evidence files are stored in the project repository for persistence
- Gate file references evidence paths for Dev to review
- Evidence is not deleted after story completion (serves as documentation)
- Consider .gitignore for very large files (video recordings)
