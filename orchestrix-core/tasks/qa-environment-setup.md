# qa-environment-setup

Start the test environment for E2E testing.

## Purpose

Prepare and start the application server(s) needed for E2E testing.
Handles port conflict detection, process startup, and readiness verification.

## Principle

**Who starts it, shuts it down.** QA is responsible for cleaning up any
processes started during testing.

## Inputs

```yaml
required:
  - project_type: object  # From detect-project-type.md output
  - test_strategy: object # From detect-project-type.md output
optional:
  - custom_port: number   # Override default port
  - skip_if_running: boolean  # Skip startup if port already responding (default: false)
```

## Process

### Step 1: Check Prerequisites

1. **Verify project requires environment**:
   ```yaml
   if test_strategy.requires_environment == false:
     return:
       environment_ready: true
       environment_url: null
       process_ids: []
       message: "No environment needed for this project type"
   ```

2. **Detect package manager**:
   ```bash
   # Check for lock files in order of priority
   if [ -f "bun.lockb" ]; then
     PACKAGE_MANAGER="bun"
   elif [ -f "pnpm-lock.yaml" ]; then
     PACKAGE_MANAGER="pnpm"
   elif [ -f "yarn.lock" ]; then
     PACKAGE_MANAGER="yarn"
   else
     PACKAGE_MANAGER="npm"
   fi
   ```

### Step 2: Check Port Availability

1. **Get expected port**:
   ```yaml
   port: custom_port OR test_strategy.expected_port OR 3000
   ```

2. **Check if port is in use**:
   ```bash
   # macOS/Linux
   lsof -i :${PORT} -t 2>/dev/null
   ```

3. **If port is occupied**:

   **Option A: Skip if running (when skip_if_running=true)**
   ```yaml
   # Verify the existing process is our app
   curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}
   if response == 200:
     return:
       environment_ready: true
       environment_url: "http://localhost:${PORT}"
       process_ids: []  # Not our process
       reused_existing: true
       message: "Reusing existing server on port ${PORT}"
   ```

   **Option B: Kill existing process (default behavior)**
   ```bash
   # Get PID using the port
   PID=$(lsof -i :${PORT} -t 2>/dev/null)

   if [ -n "$PID" ]; then
     echo "Port ${PORT} in use by PID ${PID}. Attempting to terminate..."

     # Try graceful shutdown first
     kill -TERM $PID 2>/dev/null
     sleep 2

     # Check if still running
     if kill -0 $PID 2>/dev/null; then
       echo "Process did not terminate gracefully. Force killing..."
       kill -9 $PID 2>/dev/null
       sleep 1
     fi

     # Verify port is now free
     if lsof -i :${PORT} -t 2>/dev/null; then
       # HALT - cannot proceed
       echo "ERROR: Failed to free port ${PORT}"
       exit 1
     fi
   fi
   ```

### Step 3: Start Environment

Based on project type, start the appropriate server:

#### Web Frontend / Fullstack

```bash
# Start development server in background
${PACKAGE_MANAGER} run ${test_strategy.startup_command} &
SERVER_PID=$!

echo "Started server with PID: ${SERVER_PID}"
```

#### Web Backend

```bash
# Start API server in background
${PACKAGE_MANAGER} run ${test_strategy.startup_command} &
SERVER_PID=$!

echo "Started API server with PID: ${SERVER_PID}"
```

#### Docker-based

```bash
# Start with docker-compose
docker-compose up -d

# Get container IDs for cleanup
CONTAINER_IDS=$(docker-compose ps -q)
```

### Step 4: Wait for Ready

Implement readiness check based on `test_strategy.ready_check.type`:

#### HTTP Ready Check

```bash
PORT=${test_strategy.expected_port}
URL=${test_strategy.ready_check.target}
MAX_WAIT=60  # seconds
INTERVAL=2

echo "Waiting for server at ${URL}..."

elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200\|301\|302"; then
    echo "Server is ready!"
    break
  fi
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))
  echo "Waiting... (${elapsed}s/${MAX_WAIT}s)"
done

if [ $elapsed -ge $MAX_WAIT ]; then
  echo "ERROR: Server failed to start within ${MAX_WAIT} seconds"
  # Cleanup and exit
  kill -TERM $SERVER_PID 2>/dev/null
  exit 1
fi
```

#### TCP Ready Check

```bash
PORT=${test_strategy.expected_port}
MAX_WAIT=60
INTERVAL=2

echo "Waiting for port ${PORT}..."

elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  if nc -z localhost $PORT 2>/dev/null; then
    echo "Port ${PORT} is open!"
    break
  fi
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))
done

if [ $elapsed -ge $MAX_WAIT ]; then
  echo "ERROR: Port ${PORT} not available within ${MAX_WAIT} seconds"
  exit 1
fi
```

#### Output Ready Check

```bash
READY_TEXT="${test_strategy.ready_check.target}"
LOG_FILE="/tmp/qa-server-${PORT}.log"
MAX_WAIT=60
INTERVAL=2

# Start server with output capture
${PACKAGE_MANAGER} run ${test_strategy.startup_command} > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "Waiting for '${READY_TEXT}' in output..."

elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  if grep -q "$READY_TEXT" "$LOG_FILE" 2>/dev/null; then
    echo "Server is ready!"
    break
  fi
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))
done

if [ $elapsed -ge $MAX_WAIT ]; then
  echo "ERROR: Ready message not found within ${MAX_WAIT} seconds"
  cat "$LOG_FILE"  # Show logs for debugging
  exit 1
fi
```

### Step 5: Verify Environment

After server is ready, perform basic verification:

```bash
# Verify the server responds correctly
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${URL}")

if [ "$RESPONSE" -ge 200 ] && [ "$RESPONSE" -lt 400 ]; then
  echo "Environment verified: HTTP ${RESPONSE}"
else
  echo "WARNING: Server returned HTTP ${RESPONSE}"
fi
```

### Step 6: Record Startup Info

Store information needed for cleanup:

```yaml
# Write to temporary file for qa-environment-cleanup.md
/tmp/qa-environment-${story_id}.yaml:
  started_at: "ISO-8601 timestamp"
  process_ids:
    - pid: ${SERVER_PID}
      type: "node"
      command: "${startup_command}"
  docker_containers: ${CONTAINER_IDS}  # if applicable
  port: ${PORT}
  url: "${URL}"
  package_manager: "${PACKAGE_MANAGER}"
```

## Output

Return environment status:

```yaml
environment_ready: true | false
environment_url: "http://localhost:3000"
process_ids:
  - pid: 12345
    type: "node"
    command: "npm run dev"
container_ids: []  # Docker container IDs if applicable
startup_log: "Server started in 5.2s"
reused_existing: false
error: null  # Error message if failed
```

## Error Handling

### Port Conflict - Cannot Kill

```yaml
error:
  type: PORT_CONFLICT
  port: 3000
  blocking_pid: 12345
  message: "Port 3000 is in use and could not be freed. Please manually stop the process."
  suggestion: "Run: kill -9 12345"
action: HALT
```

### Startup Timeout

```yaml
error:
  type: STARTUP_TIMEOUT
  port: 3000
  waited: 60
  message: "Server failed to start within 60 seconds"
  logs: "... last 20 lines of startup log ..."
action: HALT
```

### Missing Dependencies

```yaml
error:
  type: MISSING_DEPENDENCIES
  message: "node_modules not found. Run npm install first."
  suggestion: "Run: npm install"
action: HALT
```

## Notes

- Always use background processes (`&`) to avoid blocking
- Store PIDs for reliable cleanup
- Use reasonable timeouts (60s for dev servers, 120s for Docker)
- Capture startup logs for debugging failed starts
- Check for common startup errors (port in use, missing deps, build failures)
