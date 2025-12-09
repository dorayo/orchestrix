# DEV Handoff Message Template

**Context**: Output this message after GATE 2 checklist shows 100% completion

**Format**: Use this EXACT template:

```
✅ IMPLEMENTATION COMPLETE
Story: {id} → Status: Review
Round: {N} | Gate: {score}% | Tests: {count} | Files: {count}
Dev Log: {path}

Self-Review Results:
✅ Implementation Gate: {score}% (≥95% required)
✅ Architecture Compliance: PASS
✅ API Contract Compliance: {PASS|N_A}
✅ Test Integrity: PASS
✅ DoD Critical Items: 100%

⚠️ Warnings: {list any: open_issues, dev_feedback, minor issues OR "none"}

---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review {story_id}
```

**CRITICAL RULES**:
1. ✅ Handoff message is your FINAL output
2. ✅ Command `*review {story_id}` is LAST LINE
3. ✅ Nothing comes after handoff command
4. ✅ Message must be clearly visible
5. ❌ Do NOT add explanations after handoff
6. ❌ Do NOT say "task complete" after handoff
7. ❌ Do NOT continue to other topics

**Variable Definitions**:
- `{id}`: Story ID (e.g., "2.3")
- `{N}`: Implementation round number
- `{score}`: Implementation gate score percentage
- `{count}`: Number of tests or files
- `{path}`: Full path to dev log file
- `{PASS|N_A}`: "PASS" if multi-repo, "N/A" otherwise
- `{story_id}`: Story ID for handoff command
