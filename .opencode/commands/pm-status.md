---
description: "PM - Project Status & Planning Recommendations"
---

When this command is used, execute the following task:

# PM - Project Status & Planning Recommendations

## Purpose

Provide a comprehensive view of current project status, including product progress,
story health metrics, active proposals, and actionable next-step recommendations.
This is a READ-ONLY diagnostic task that helps stakeholders understand project state
and make informed planning decisions.

## Command

```
*status [--verbose]
```

| Parameter | Type | Required | Description                            |
| --------- | ---- | -------- | -------------------------------------- |
| --verbose | flag | No       | Include detailed story-level breakdown |

## Process

### Step 1: Load Project Configuration

Read `.orchestrix-core/core-config.yaml` to determine project structure:

1. Extract `project.mode` (monolith or multi-repo)
2. Extract `prd.prdSharded` and `prd.prdShardedLocation`
3. Extract `dev.devLogLocation` → derive `devDocLocation`
4. Extract `project.multi_repo.role` if multi-repo mode

**IF config load fails:**

```
❌ Configuration Error

Cannot read core-config.yaml. Ensure Orchestrix is properly initialized.

```

HALT

### Step 2: Load Product Context

**2.1 Read PRD Content**

**IF prdSharded = true:**

- Read `{prdShardedLocation}/*goals-context.md` → Product goals (glob: matches with or without numeric prefix)
- Read `{prdShardedLocation}/*requirements.md` → Requirements
- Read `{prdShardedLocation}/*epic-list.md` → Epic summary
- Read `{prdShardedLocation}/*next-steps.md` → Pending actions

**ELSE:**

- Read `docs/prd.md` or equivalent PRD file
- Extract goals, requirements, and epic sections

**2.2 Read Epic YAML Files**

```bash
ls docs/prd/epic-*.yaml 2>/dev/null || echo "No epic files"
```

For each Epic file, extract:

- `epic_id`, `title`, `description`
- Story count and `repository_type` distribution
- `sm_hints` population status (front_end_spec, architecture)

**2.3 Read Story Files**

```bash
ls docs/stories/*.md 2>/dev/null || echo "No story files"
```

For each Story file, extract:

- Story ID (from filename pattern `{epic}.{story}-*.md`)
- Status (from YAML frontmatter or status field)
- Assigned agent (if any)

### Step 3: Load Technical Context (Optional)

Check cumulative registries existence:

```
{devDocLocation}/database-registry.md
{devDocLocation}/api-registry.md
{devDocLocation}/models-registry.md
```

If exist, extract summary counts:

- Database: table count, key entities
- API: endpoint count by HTTP method
- Models: interface/type count

### Step 4: Scan Active Proposals

**4.1 Product Proposals**

```bash
ls docs/proposals/product/PCP-*.md 2>/dev/null
```

For each PCP file with `status: draft`:

- Extract `id`, `title`, `change_type`
- Note `related_tech_proposal` if linked

**4.2 Technical Proposals**

```bash
ls docs/proposals/tech/TCP-*.md 2>/dev/null
```

For each TCP file with `status: draft`:

- Extract `id`, `title`, `change_scope`
- Note `related_product_proposal` if linked

### Step 5: Compute Status Metrics

**5.1 Epic Progress Matrix**

For each Epic, compute:

| Metric        | Formula                                        |
| ------------- | ---------------------------------------------- |
| Total Stories | Count of stories in Epic                       |
| Completed     | Stories with status = `Done`                   |
| In Progress   | Stories with status = `InProgress` or `Review` |
| Blocked       | Stories with status = `Blocked` or `Escalated` |
| Not Started   | Stories with status = `Draft` or `Approved`    |
| Progress %    | (Completed / Total) × 100                      |

**5.2 Overall Health Score**

Calculate weighted health score:

```
health_score = (
  (completed_ratio × 40) +
  (in_progress_ratio × 30) +
  (not_blocked_ratio × 20) +
  (sm_hints_populated_ratio × 10)
)
```

Health classification:

- 80-100: 🟢 Healthy
- 60-79: 🟡 Attention Needed
- 40-59: 🟠 At Risk
- 0-39: 🔴 Critical

**5.3 Bottleneck Detection**

Identify potential bottlenecks:

- Stories in `AwaitingArchReview` > 3 → "Architect Review Backlog"
- Stories in `Blocked` > 2 → "Blocked Stories Require Attention"
- Stories in `Review` > 3 → "QA Review Backlog"
- Proposals with `status: draft` > 2 → "Pending Change Decisions"

### Step 6: Generate Recommendations

Based on collected data, generate prioritized recommendations:

**6.1 Immediate Actions** (P0)

Conditions that require immediate attention:

- Blocked stories without documented blockers
- Escalated stories pending resolution
- Draft proposals older than 7 days
- Missing `sm_hints` on approved stories

**6.2 Short-term Actions** (P1)

Recommended within current iteration:

- Stories ready for next status transition
- Proposals ready for review
- Epics approaching completion

**6.3 Planning Suggestions** (P2)

Strategic recommendations:

- New iteration readiness (if current Epic > 80% done)
- PRD sharding recommendation (if not sharded and > 3 Epics)
- Architecture documentation gaps

### Step 7: Output Status Report

Generate structured status report:

```
═══════════════════════════════════════════════════════════════════════════════
📊 PROJECT STATUS REPORT
Generated: {timestamp}
═══════════════════════════════════════════════════════════════════════════════

## 🎯 Product Overview

**Project**: {project_name from config}
**Mode**: {monolith | multi-repo ({role})}
**PRD Status**: {Sharded | Single File}

**Product Goals Summary**:
{2-3 sentence summary from PRD goals section}

───────────────────────────────────────────────────────────────────────────────

## 📈 Epic Progress

| Epic | Title | Progress | Stories | Status |
|------|-------|----------|---------|--------|
| {id} | {title} | {progress_bar} {%} | {done}/{total} | {status_emoji} |

**Overall Progress**: {total_done}/{total_stories} stories ({overall_percentage}%)

───────────────────────────────────────────────────────────────────────────────

## 📋 Story Status Distribution

| Status | Count | Percentage | Responsible |
|--------|-------|------------|-------------|
| Done | {n} | {%} | - |
| Review | {n} | {%} | QA |
| InProgress | {n} | {%} | Dev |
| Approved | {n} | {%} | Dev (ready) |
| AwaitingArchReview | {n} | {%} | Architect |
| Blocked | {n} | {%} | SM |
| Escalated | {n} | {%} | Architect/Human |

───────────────────────────────────────────────────────────────────────────────

## 🔄 Active Proposals

{IF proposals exist:}

| ID | Type | Title | Status | Linked |
|----|------|-------|--------|--------|
| {id} | PCP/TCP | {title} | {status} | {linked_proposal_id or "-"} |

{ELSE:}
No active proposals.

───────────────────────────────────────────────────────────────────────────────

## ⚠️ Bottlenecks & Risks

{IF bottlenecks detected:}

{for each bottleneck:}
- **{bottleneck_type}**: {description}
  - Affected: {story_ids or count}
  - Recommended Action: {action}

{ELSE:}
✅ No significant bottlenecks detected.

───────────────────────────────────────────────────────────────────────────────

## 🔧 Technical Context

{IF registries exist:}

| Registry | Items | Last Updated |
|----------|-------|--------------|
| Database Tables | {count} | {date} |
| API Endpoints | {count} | {date} |
| Models/Types | {count} | {date} |

{ELSE:}
Technical registries not yet initialized.

───────────────────────────────────────────────────────────────────────────────

## 🎯 RECOMMENDATIONS

### P0 - Immediate Actions
{numbered list of P0 recommendations with specific commands}

### P1 - This Iteration
{numbered list of P1 recommendations}

### P2 - Planning Horizon
{numbered list of P2 recommendations}

───────────────────────────────────────────────────────────────────────────────

## 🚀 Suggested Next Steps

Based on current status, recommended workflow:

{IF blocked stories exist:}
1. Resolve blocked stories first
   🎯 HANDOFF TO sm: *revise {blocked_story_id}

{ELSE IF awaiting_arch_review stories exist:}
1. Clear Architect review queue
   🎯 HANDOFF TO architect: *review {story_id}

{ELSE IF all_epics_complete:}
1. Start new iteration
   🎯 HANDOFF TO pm: *start-iteration

{ELSE IF proposals_pending:}
1. Process pending proposals
   🎯 HANDOFF TO po: *route-change

{ELSE:}
1. Continue standard development flow
   🎯 HANDOFF TO sm: *create-next-story

═══════════════════════════════════════════════════════════════════════════════
```

### Step 8: Verbose Output (Optional)

**IF --verbose flag provided:**

Append detailed story breakdown after main report:

```
═══════════════════════════════════════════════════════════════════════════════
📝 DETAILED STORY BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════

### Epic {id}: {title}

| Story | Title | Status | Agent | Last Updated |
|-------|-------|--------|-------|--------------|
| {id} | {title} | {status} | {agent} | {date} |

{for each story with issues:}
⚠️ {story_id}: {issue_description}

───────────────────────────────────────────────────────────────────────────────
```

## Output

**On Success:**

- Structured status report displayed to user
- No files modified (read-only operation)
- Actionable recommendations with specific handoff commands

**On Partial Data:**

- Report generated with available data
- Missing sections noted with `[Data not available]`
- Suggestions for initializing missing components

**On Failure:**

- Error description
- Suggested remediation steps
- No partial output (fail cleanly)

## Integration Points

This task complements other PM commands:

| Scenario             | Follow-up Command        |
| -------------------- | ------------------------ |
| New iteration needed | `*start-iteration`       |
| PRD changes required | `*revise-prd`            |
| Need deeper research | `*create-doc {template}` |

## Notes

- This is a diagnostic command; it never modifies files
- Run periodically to maintain project visibility
- Output can be shared with stakeholders for status updates
- Health score algorithm can be customized in future versions
