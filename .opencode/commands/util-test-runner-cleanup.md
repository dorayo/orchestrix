---
description: "util-test-runner-cleanup"
---

When this command is used, execute the following task:

# util-test-runner-cleanup

Clean up orphaned test runner processes (vitest, jest, mocha, etc.).

## Purpose

Terminate any test runner processes that may be lingering from incomplete test runs.
This is a utility task that should be called after test execution or during environment cleanup.

## Background

Test runners can become orphaned when:

- Tests timeout but the process isn't properly terminated
- vitest runs in watch mode instead of run mode
- Test execution is interrupted by context compression
- Multiple test runs overlap due to rapid retries

## Inputs

```yaml
optional:
  - story_id: string # Used to locate test-specific tracking files
  - force: boolean # Force kill without graceful shutdown (default: false)
  - dry_run: boolean # Only report what would be killed (default: false)
```

## Process

### Step 1: Identify Test Runner Processes

Detect running test runner processes across common frameworks:

```bash
#!/bin/bash

# Define test runner patterns
TEST_RUNNERS=(
  "vitest"
  "jest"
  "mocha"
  "playwright"
  "cypress"
  "ava"
  "tap"
  "nyc"
)

# Build grep pattern
PATTERN=$(IFS="|"; echo "${TEST_RUNNERS[*]}")

# Find all matching processes (exclude grep itself)
echo "Scanning for test runner processes..."
FOUND_PIDS=()
FOUND_DETAILS=()

for RUNNER in "${TEST_RUNNERS[@]}"; do
  # Get PIDs for this runner
  PIDS=$(pgrep -f "$RUNNER" 2>/dev/null || true)

  if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
      # Get process details
      CMD=$(ps -p $PID -o args= 2>/dev/null || echo "unknown")
      START_TIME=$(ps -p $PID -o lstart= 2>/dev/null || echo "unknown")
      RUNTIME=$(ps -p $PID -o etime= 2>/dev/null || echo "unknown")

      # Skip if this is the cleanup script itself
      if echo "$CMD" | grep -q "util-test-runner-cleanup"; then
        continue
      fi

      FOUND_PIDS+=("$PID")
      FOUND_DETAILS+=("PID=$PID RUNNER=$RUNNER RUNTIME=$RUNTIME CMD='$CMD'")

      echo "  Found: PID=$PID ($RUNNER) running for $RUNTIME"
    done
  fi
done

echo ""
echo "Total test runner processes found: ${#FOUND_PIDS[@]}"
```

### Step 2: Check Tracked Test PIDs (if story_id provided)

If a story_id is provided, check for tracked test process info:

```bash
TRACKING_FILE="/tmp/test-runner-${STORY_ID}.pid"

if [ -f "$TRACKING_FILE" ]; then
  echo "Found tracking file for story ${STORY_ID}"
  TRACKED_PID=$(cat "$TRACKING_FILE")

  if [ -n "$TRACKED_PID" ] && kill -0 "$TRACKED_PID" 2>/dev/null; then
    echo "  Tracked process $TRACKED_PID is still running"
    # Add to kill list if not already there
    if [[ ! " ${FOUND_PIDS[@]} " =~ " ${TRACKED_PID} " ]]; then
      FOUND_PIDS+=("$TRACKED_PID")
    fi
  else
    echo "  Tracked process $TRACKED_PID no longer running"
  fi

  # Clean up tracking file
  rm -f "$TRACKING_FILE"
fi
```

### Step 3: Filter Long-Running Processes

Only kill processes that have been running for more than expected test duration:

```bash
# Threshold: processes running longer than 10 minutes are likely stuck
THRESHOLD_SECONDS=600

PIDS_TO_KILL=()

for i in "${!FOUND_PIDS[@]}"; do
  PID="${FOUND_PIDS[$i]}"

  # Get elapsed time in seconds
  ETIME=$(ps -p $PID -o etimes= 2>/dev/null || echo "0")
  ETIME=$(echo "$ETIME" | tr -d ' ')

  if [ "$ETIME" -gt "$THRESHOLD_SECONDS" ]; then
    echo "Process $PID has been running for ${ETIME}s (>${THRESHOLD_SECONDS}s threshold)"
    PIDS_TO_KILL+=("$PID")
  else
    echo "Process $PID is within normal range (${ETIME}s)"
  fi
done

echo ""
echo "Processes exceeding threshold: ${#PIDS_TO_KILL[@]}"
```

### Step 4: Terminate Processes

If dry_run is false, terminate the identified processes:

```bash
if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY RUN] Would terminate ${#PIDS_TO_KILL[@]} processes"
  for PID in "${PIDS_TO_KILL[@]}"; do
    echo "  Would kill: PID=$PID"
  done
  exit 0
fi

TERMINATED=()
FAILED=()

for PID in "${PIDS_TO_KILL[@]}"; do
  echo "Terminating process $PID..."

  if [ "$FORCE" = "true" ]; then
    # Force kill immediately
    kill -9 $PID 2>/dev/null
    RESULT=$?
  else
    # Graceful shutdown: SIGTERM first
    kill -TERM $PID 2>/dev/null

    # Wait up to 5 seconds for graceful shutdown
    WAIT=0
    while [ $WAIT -lt 5 ]; do
      if ! kill -0 $PID 2>/dev/null; then
        break
      fi
      sleep 1
      WAIT=$((WAIT + 1))
    done

    # Force kill if still running
    if kill -0 $PID 2>/dev/null; then
      echo "  Process $PID did not terminate gracefully, force killing..."
      kill -9 $PID 2>/dev/null
      sleep 1
    fi

    # Check final status
    if kill -0 $PID 2>/dev/null; then
      RESULT=1
    else
      RESULT=0
    fi
  fi

  if [ $RESULT -eq 0 ]; then
    TERMINATED+=("$PID")
    echo "  ✓ Process $PID terminated"
  else
    FAILED+=("$PID")
    echo "  ✗ Failed to terminate process $PID"
  fi
done

echo ""
echo "Cleanup complete: ${#TERMINATED[@]} terminated, ${#FAILED[@]} failed"
```

### Step 5: Cleanup Tracking Files

Remove any orphaned tracking files:

```bash
# Clean up any stale tracking files
for FILE in /tmp/test-runner-*.pid; do
  if [ -f "$FILE" ]; then
    TRACKED_PID=$(cat "$FILE" 2>/dev/null)
    if [ -z "$TRACKED_PID" ] || ! kill -0 "$TRACKED_PID" 2>/dev/null; then
      echo "Removing stale tracking file: $FILE"
      rm -f "$FILE"
    fi
  fi
done

# Clean up test output files older than 1 hour
find /tmp -name "vitest-results*.json" -mmin +60 -delete 2>/dev/null || true
find /tmp -name "jest-results*.json" -mmin +60 -delete 2>/dev/null || true
find /tmp -name "test-output*.log" -mmin +60 -delete 2>/dev/null || true
```

## Output

Return cleanup status:

```yaml
cleanup_result:
  processes_scanned: { count }
  processes_exceeding_threshold: { count }
  terminated:
    - pid: 12345
      runner: vitest
      runtime: "15:32"
      status: terminated_gracefully | force_killed
    - pid: 12346
      runner: jest
      runtime: "08:45"
      status: terminated_gracefully
  failed:
    - pid: 12347
      runner: mocha
      error: "Permission denied"
  tracking_files_cleaned: { count }
  temp_files_cleaned: { count }
  warnings: []
  errors: []
```

## Integration Points

This task should be called from:

1. **`dev-self-review.md` Step 7** - After implementation validation
2. **`qa-review-story.md` Step 8** - After QA review
3. **`qa-run-automated-tests.md`** - After test execution (regardless of result)
4. **`qa-environment-cleanup.md`** - As part of full environment cleanup

## Usage Example

```yaml
# In dev-self-review.md Step 7
execute: util-test-runner-cleanup.md
input:
  story_id: { story_id }
  force: false
on_error: continue # Don't block workflow on cleanup failures
```

## Notes

- This task is idempotent - safe to run multiple times
- Cleanup failures are logged as warnings, not errors
- Does not block parent workflow on failures
- Threshold of 10 minutes is configurable based on project needs
- Always uses graceful shutdown (SIGTERM) before force kill (SIGKILL) unless force=true
