# qa-environment-cleanup

Clean up the test environment after E2E testing.

## Purpose

Gracefully shut down all processes and containers started by qa-environment-setup.md.
Ensures no orphan processes remain and ports are freed for future use.

## Principle

**Who starts it, shuts it down.** This task is the counterpart to qa-environment-setup.md
and must always be executed at the end of QA review, regardless of test results.

## Inputs

```yaml
required:
  - story_id: string  # Used to locate environment info file
optional:
  - force: boolean    # Force kill without graceful shutdown (default: false)
  - skip_verification: boolean  # Skip port release verification (default: false)
```

## Process

### Step 1: Load Environment Info

Read the startup information stored by qa-environment-setup.md:

```bash
ENV_FILE="/tmp/qa-environment-${STORY_ID}.yaml"

if [ ! -f "$ENV_FILE" ]; then
  echo "No environment file found. Nothing to clean up."
  exit 0
fi

# Parse environment info
# (In practice, read YAML and extract values)
```

Expected file structure:
```yaml
started_at: "2025-01-15T10:30:00Z"
process_ids:
  - pid: 12345
    type: "node"
    command: "npm run dev"
docker_containers:
  - container_id_1
  - container_id_2
port: 3000
url: "http://localhost:3000"
package_manager: "npm"
```

### Step 2: Stop Node Processes

For each process started by QA:

```bash
for PID in ${PROCESS_IDS}; do
  if kill -0 $PID 2>/dev/null; then
    echo "Stopping process $PID..."

    # Step 2a: Graceful shutdown (SIGTERM)
    kill -TERM $PID 2>/dev/null

    # Wait up to 10 seconds for graceful shutdown
    WAIT=0
    while [ $WAIT -lt 10 ]; do
      if ! kill -0 $PID 2>/dev/null; then
        echo "Process $PID terminated gracefully"
        break
      fi
      sleep 1
      WAIT=$((WAIT + 1))
    done

    # Step 2b: Force kill if still running
    if kill -0 $PID 2>/dev/null; then
      echo "Process $PID did not terminate gracefully. Force killing..."
      kill -9 $PID 2>/dev/null
      sleep 1

      if kill -0 $PID 2>/dev/null; then
        echo "WARNING: Failed to kill process $PID"
      else
        echo "Process $PID force killed"
      fi
    fi
  else
    echo "Process $PID already stopped"
  fi
done
```

### Step 3: Stop Docker Containers

If Docker containers were started:

```bash
if [ -n "${CONTAINER_IDS}" ]; then
  echo "Stopping Docker containers..."

  # Stop containers gracefully
  docker stop ${CONTAINER_IDS} 2>/dev/null

  # Optionally remove containers
  # docker rm ${CONTAINER_IDS} 2>/dev/null

  echo "Docker containers stopped"
fi

# If using docker-compose
if [ -f "docker-compose.yml" ]; then
  docker-compose down 2>/dev/null
fi
```

### Step 4: Verify Port Release

Confirm the port is now available:

```bash
PORT=${ENVIRONMENT_PORT}

# Wait briefly for OS to release the port
sleep 2

if lsof -i :${PORT} -t 2>/dev/null; then
  echo "WARNING: Port ${PORT} still in use after cleanup"

  # Get details about what's using it
  BLOCKING_PID=$(lsof -i :${PORT} -t 2>/dev/null)
  BLOCKING_CMD=$(ps -p $BLOCKING_PID -o comm= 2>/dev/null)

  echo "Blocking process: PID=${BLOCKING_PID} CMD=${BLOCKING_CMD}"

  # Attempt to kill if it's a node process (likely our server)
  if [ "$BLOCKING_CMD" = "node" ]; then
    kill -9 $BLOCKING_PID 2>/dev/null
    sleep 1
  fi
else
  echo "Port ${PORT} is now available"
fi
```

### Step 5: Clean Up Temporary Files

Remove temporary files created during testing:

```bash
# Remove environment info file
rm -f "/tmp/qa-environment-${STORY_ID}.yaml"

# Remove server log files
rm -f "/tmp/qa-server-*.log"

# Remove any test artifacts in temp
rm -rf "/tmp/qa-test-${STORY_ID}/"

echo "Temporary files cleaned up"
```

### Step 6: Verify Cleanup

Final verification that everything is cleaned up:

```yaml
verification:
  processes_stopped: true | false
  containers_stopped: true | false
  port_available: true | false
  temp_files_removed: true | false
  all_clean: true | false
```

## Output

Return cleanup status:

```yaml
cleanup_complete: true | false
processes_terminated:
  - pid: 12345
    status: "terminated_gracefully" | "force_killed" | "already_stopped" | "failed"
containers_stopped:
  - container_id: "abc123"
    status: "stopped" | "failed"
port_released: true | false
port: 3000
temp_files_removed: true | false
duration_seconds: 5.2
warnings: []  # Any issues encountered
errors: []    # Critical failures
```

## Error Handling

### Process Kill Failed

```yaml
# Not a blocking error - log and continue
warning:
  type: PROCESS_KILL_FAILED
  pid: 12345
  message: "Could not terminate process 12345. May require manual cleanup."
  suggestion: "Run: sudo kill -9 12345"
action: CONTINUE
```

### Port Still Occupied

```yaml
# Not a blocking error for cleanup - log warning
warning:
  type: PORT_STILL_OCCUPIED
  port: 3000
  blocking_pid: 67890
  message: "Port 3000 still in use after cleanup attempt."
  suggestion: "Manually kill the process or use a different port next time."
action: CONTINUE
```

### Docker Cleanup Failed

```yaml
warning:
  type: DOCKER_CLEANUP_FAILED
  containers: ["abc123", "def456"]
  message: "Failed to stop some Docker containers."
  suggestion: "Run: docker stop abc123 def456"
action: CONTINUE
```

## Integration with QA Review

This task is called at the end of qa-review-story.md:

```yaml
# In qa-review-story.md Step 8

execute: qa-environment-cleanup.md
input:
  story_id: {story_id}
  force: false

# Always execute, even if previous steps failed
on_error: continue

# Log cleanup result but don't block handoff
log_result: true
```

## Best Practices

1. **Always execute cleanup** - Even if tests fail or are interrupted
2. **Graceful shutdown first** - Give processes chance to clean up
3. **Log everything** - Helps diagnose orphan process issues
4. **Don't block on failures** - Cleanup issues shouldn't prevent handoff
5. **Verify port release** - Prevent "port in use" errors in next run

## Notes

- This task should be idempotent - safe to run multiple times
- Cleanup failures are logged as warnings, not errors
- The handoff message should still be sent even if cleanup has issues
- Consider adding a periodic cleanup job for orphaned test processes
