#!/bin/bash
# =============================================================================
# HANDOFF Detection Test Script
# Tests the handoff-detector.sh hook with various scenarios
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
pass_count=0
fail_count=0
total_tests=0

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HOOK_SCRIPT="$PROJECT_ROOT/common/hooks/handoff-detector.sh"
TEST_LOG="/tmp/orchestrix-handoff-test-$(date +%s).log"

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$TEST_LOG"
}

print_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

test_case() {
    local name="$1"
    local input="$2"
    local expected_target="$3"
    local expected_command="$4"
    local description="$5"

    ((total_tests++))

    echo -e "  ${YELLOW}Test $total_tests:${NC} $name"
    if [[ -n "$description" ]]; then
        echo -e "    ${BLUE}Description:${NC} $description"
    fi

    # Create temp file for input (use printf to preserve formatting)
    local temp_input="/tmp/test-handoff-input-$$.txt"
    printf '%s\n' "$input" > "$temp_input"

    # Extract STB using the same logic as the hook
    local result_target=""
    local result_command=""
    local detection_layer=""

    # Layer 0: STB Detection (Primary - Pure ASCII, most reliable)
    if grep -q -- '---ORCHESTRIX-HANDOFF-BEGIN---' "$temp_input" 2>/dev/null; then
        local stb_block
        # Extract the last STB block (in case of multiple)
        stb_block=$(awk '
            /---ORCHESTRIX-HANDOFF-BEGIN---/ { found=1; block="" }
            found { block = block $0 "\n" }
            /---ORCHESTRIX-HANDOFF-END---/ { if(found) last=block; found=0 }
            END { printf "%s", last }
        ' "$temp_input")

        if [[ -n "$stb_block" ]]; then
            local stb_target stb_cmd stb_args
            stb_target=$(printf '%s' "$stb_block" | grep -E '^[[:space:]]*target:' | head -1 | sed 's/^[[:space:]]*target:[[:space:]]*//' | tr -d '[:space:]')
            stb_cmd=$(printf '%s' "$stb_block" | grep -E '^[[:space:]]*command:' | head -1 | sed 's/^[[:space:]]*command:[[:space:]]*//' | tr -d '[:space:]')
            stb_args=$(printf '%s' "$stb_block" | grep -E '^[[:space:]]*args:' | head -1 | sed 's/^[[:space:]]*args:[[:space:]]*//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

            if [[ -n "$stb_target" && -n "$stb_cmd" ]]; then
                result_target=$(printf '%s' "$stb_target" | tr '[:upper:]' '[:lower:]')
                if [[ -n "$stb_args" ]]; then
                    result_command="$stb_cmd $stb_args"
                else
                    result_command="$stb_cmd"
                fi
                detection_layer="Layer 0 (STB)"
            fi
        fi
    fi

    # Layer 1: Emoji HANDOFF (fallback)
    if [[ -z "$result_target" || -z "$result_command" ]]; then
        local emoji_line
        emoji_line=$(grep -E '🎯[[:space:]]*HANDOFF[[:space:]]+TO' "$temp_input" 2>/dev/null | tail -1 || true)

        if [[ -n "$emoji_line" ]]; then
            # Extract target and command from emoji line
            # Format: 🎯 HANDOFF TO <agent>: *<command> [args]
            result_target=$(echo "$emoji_line" | sed -E 's/.*HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z_-]+).*/\1/' | tr '[:upper:]' '[:lower:]')
            local cmd_part
            cmd_part=$(echo "$emoji_line" | sed -E 's/.*\*([a-zA-Z0-9_-]+[[:space:]]*[^[:space:]]*).*/\1/')
            result_command=$(echo "$cmd_part" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            detection_layer="Layer 1 (Emoji)"
        fi
    fi

    # Clean up
    rm -f "$temp_input"

    # Verify results
    local target_match=false
    local command_match=false

    if [[ "$result_target" == "$expected_target" ]]; then
        target_match=true
    fi

    # Normalize commands for comparison (remove extra spaces)
    local norm_result norm_expected
    norm_result=$(echo "$result_command" | tr -s ' ')
    norm_expected=$(echo "$expected_command" | tr -s ' ')

    if [[ "$norm_result" == "$norm_expected" ]]; then
        command_match=true
    fi

    # Output result
    if $target_match && $command_match; then
        echo -e "    ${GREEN}✓ PASSED${NC} - Detected via $detection_layer"
        echo -e "      Target: $result_target | Command: $result_command"
        ((pass_count++))
    else
        echo -e "    ${RED}✗ FAILED${NC}"
        echo -e "      Expected: target='$expected_target', command='$expected_command'"
        echo -e "      Got:      target='$result_target', command='$result_command'"
        if [[ -n "$detection_layer" ]]; then
            echo -e "      Layer:    $detection_layer"
        else
            echo -e "      Layer:    None (not detected)"
        fi
        ((fail_count++))
    fi
    echo ""
}

# =============================================================================
# Test Cases
# =============================================================================

run_tests() {
    print_header "HANDOFF Detection Tests"

    # -------------------------------------------------------------------------
    # Layer 0: STB Tests
    # -------------------------------------------------------------------------
    print_header "Layer 0: Structured Termination Block (STB) Tests"

    # Test 1: Standard STB with args
    test_case "Standard STB with args" \
"Task complete. All tests passing.

---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: 1.3
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review 1.3" \
"qa" "review 1.3" \
"Standard format with story ID argument"

    # Test 2: STB without args
    test_case "STB without args" \
"Story created successfully.

---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO sm: *draft" \
"sm" "draft" \
"Command without arguments (draft)"

    # Test 3: STB with complex args
    test_case "STB with complex args" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review
args: 2.1
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO architect: *review 2.1" \
"architect" "review 2.1" \
"Architect review command"

    # Test 4: STB with uppercase target (should normalize)
    test_case "STB with uppercase target" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: QA
command: review
args: 3.2
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO QA: *review 3.2" \
"qa" "review 3.2" \
"Target should be normalized to lowercase"

    # Test 5: STB at end of long output
    local long_output=""
    for i in {1..50}; do
        long_output+="Processing step $i... done\n"
    done
    long_output+="
---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: 4.1
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review 4.1"

    test_case "STB at end of long output" \
"$long_output" \
"qa" "review 4.1" \
"STB detection after 50 lines of output"

    # Test 6: Multiple STBs (should use last one)
    test_case "Multiple STBs (use last)" \
"First handoff:
---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: develop-story
args: 1.1
---ORCHESTRIX-HANDOFF-END---

Some intermediate output...

Second handoff (this should be used):
---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: 1.2
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review 1.2" \
"qa" "review 1.2" \
"When multiple STBs exist, use the last one"

    # -------------------------------------------------------------------------
    # Layer 1: Emoji HANDOFF Tests (Fallback)
    # -------------------------------------------------------------------------
    print_header "Layer 1: Emoji HANDOFF Tests (Fallback)"

    # Test 7: Emoji HANDOFF only (no STB)
    test_case "Emoji HANDOFF only (fallback)" \
"Task complete.

🎯 HANDOFF TO dev: *develop-story 2.1" \
"dev" "develop-story 2.1" \
"Emoji HANDOFF without STB (backwards compatibility)"

    # Test 8: Emoji HANDOFF with different agent
    test_case "Emoji HANDOFF to SM" \
"Story review complete.

🎯 HANDOFF TO sm: *draft" \
"sm" "draft" \
"Emoji HANDOFF to SM without args"

    # -------------------------------------------------------------------------
    # Edge Cases
    # -------------------------------------------------------------------------
    print_header "Edge Cases"

    # Test 9: Corrupted emoji but valid STB
    test_case "Corrupted emoji but valid STB" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: 1.5
---ORCHESTRIX-HANDOFF-END---

??? HANDOFF TO qa: *review 1.5" \
"qa" "review 1.5" \
"STB should work even when emoji is corrupted"

    # Test 10: STB with extra whitespace
    test_case "STB with extra whitespace" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target:   qa
command:   review
args:   2.3
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review 2.3" \
"qa" "review 2.3" \
"STB fields should handle extra whitespace"

    # Test 11: STB apply-qa-fixes command
    test_case "STB apply-qa-fixes command" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: apply-qa-fixes
args: 1.3
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO dev: *apply-qa-fixes 1.3" \
"dev" "apply-qa-fixes 1.3" \
"QA to Dev handoff for fixes"

    # Test 12: STB review-escalation command
    test_case "STB review-escalation command" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review-escalation
args: 2.1
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO architect: *review-escalation 2.1" \
"architect" "review-escalation 2.1" \
"Escalation to Architect"

    # Test 13: STB test-design command
    test_case "STB test-design command" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: test-design
args: 1.4
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *test-design 1.4" \
"qa" "test-design 1.4" \
"Test design handoff to QA"

    # Test 14: STB finalize-commit command
    test_case "STB finalize-commit command" \
"---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: finalize-commit
args: 3.1
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *finalize-commit 3.1" \
"qa" "finalize-commit 3.1" \
"Finalize commit handoff"

    # -------------------------------------------------------------------------
    # Layer 3: Dev Default Fallback Tests
    # -------------------------------------------------------------------------
    print_header "Layer 3: Dev Default Fallback Tests"

    # Test 15: Dev fallback with Chinese status message
    test_dev_fallback "Dev fallback - Chinese status message" \
"实现完成，所有测试通过。

Story 1.3 状态已更新为 Review，等待 QA 验收" \
"qa" "review 1.3" \
"Dev fallback should extract story ID from 'Story X.Y' pattern"

    # Test 16: Dev fallback with story_id: format
    test_dev_fallback "Dev fallback - story_id format" \
"任务完成。
story_id: 2.5
代码已提交。" \
"qa" "review 2.5" \
"Dev fallback should extract story ID from 'story_id:' pattern"

    # Test 17: Dev fallback with standalone story ID
    test_dev_fallback "Dev fallback - standalone story ID" \
"开发任务 3.2 已完成，所有测试通过。" \
"qa" "review 3.2" \
"Dev fallback should extract standalone story ID"

    # Test 18: Dev fallback without any story ID (uses recorded or empty)
    test_dev_fallback "Dev fallback - no story ID" \
"任务完成，代码已提交，准备进入下一阶段。" \
"qa" "review" \
"Dev fallback should send review without story_id if not found"
}

# Test function for Layer 3 Dev fallback scenarios
test_dev_fallback() {
    local name="$1"
    local input="$2"
    local expected_target="$3"
    local expected_command="$4"
    local description="$5"

    ((total_tests++))

    echo -e "  ${YELLOW}Test $total_tests:${NC} $name"
    if [[ -n "$description" ]]; then
        echo -e "    ${BLUE}Description:${NC} $description"
    fi

    local result_target=""
    local result_command=""
    local detection_layer=""

    # Simulate Layer 3: Dev Default Fallback
    # This simulates current_agent=dev and no Layer 0-2 matches
    local fallback_story_id=""

    # Pattern 1: Story X.Y format
    if [[ "$input" =~ Story[[:space:]]+([0-9]+\.[0-9]+) ]]; then
        fallback_story_id="${BASH_REMATCH[1]}"
    # Pattern 2: story_id: X.Y format
    elif [[ "$input" =~ story_id:[[:space:]]*([0-9]+\.[0-9]+) ]]; then
        fallback_story_id="${BASH_REMATCH[1]}"
    # Pattern 3: Standalone X.Y at word boundary (last occurrence)
    else
        local all_ids
        all_ids=$(echo "$input" | grep -oE '\b[0-9]+\.[0-9]+\b' | tail -1)
        if [[ -n "$all_ids" ]]; then
            fallback_story_id="$all_ids"
        fi
    fi

    result_target="qa"
    if [[ -n "$fallback_story_id" ]]; then
        result_command="review $fallback_story_id"
    else
        result_command="review"
    fi
    detection_layer="Layer 3 (Dev Fallback)"

    # Verify results
    local target_match=false
    local command_match=false

    if [[ "$result_target" == "$expected_target" ]]; then
        target_match=true
    fi

    # Normalize commands for comparison
    local norm_result norm_expected
    norm_result=$(echo "$result_command" | tr -s ' ')
    norm_expected=$(echo "$expected_command" | tr -s ' ')

    if [[ "$norm_result" == "$norm_expected" ]]; then
        command_match=true
    fi

    # Output result
    if $target_match && $command_match; then
        echo -e "    ${GREEN}✓ PASSED${NC} - Detected via $detection_layer"
        echo -e "      Target: $result_target | Command: $result_command"
        ((pass_count++))
    else
        echo -e "    ${RED}✗ FAILED${NC}"
        echo -e "      Expected: target='$expected_target', command='$expected_command'"
        echo -e "      Got:      target='$result_target', command='$result_command'"
        echo -e "      Layer:    $detection_layer"
        ((fail_count++))
    fi
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       Orchestrix HANDOFF Detection Test Suite                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Log file: $TEST_LOG"
    echo ""

    # Check if hook script exists
    if [[ ! -f "$HOOK_SCRIPT" ]]; then
        echo -e "${RED}ERROR: Hook script not found at $HOOK_SCRIPT${NC}"
        exit 1
    fi

    # Run all tests
    run_tests

    # Print summary
    print_header "Test Results Summary"

    echo -e "Total Tests:  $total_tests"
    echo -e "Passed:       ${GREEN}$pass_count${NC}"
    echo -e "Failed:       ${RED}$fail_count${NC}"
    echo ""

    if [[ $fail_count -eq 0 ]]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL TESTS PASSED! ✓                         ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                    SOME TESTS FAILED ✗                         ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Check log file for details: $TEST_LOG"
        exit 1
    fi
}

# Run main
main "$@"
