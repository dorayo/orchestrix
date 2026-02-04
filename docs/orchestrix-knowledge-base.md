# Orchestrix Knowledge Base

## Overview

Orchestrix is a universal AI Agent framework that coordinates specialized agents to complete complex software projects through standardized workflows.

**Core Philosophy**: Coordination over Control | Specialization over Generalization | Standardization over Randomization

## Agent System

| Team        | Agents                                | Environment  |
| ----------- | ------------------------------------- | ------------ |
| Planning    | Analyst, PM, UX-Expert, Architect, PO | Web (Gemini) |
| Development | SM, Dev, QA                           | IDE          |

## Agent Commands

### Analyst 📊

| Command                    | Description                      |
| -------------------------- | -------------------------------- |
| `*brainstorm {topic}`      | Structured brainstorming session |
| `*research-prompt {topic}` | Deep research prompt/plan        |
| `*create-doc {template}`   | Generate document via template   |

**Output**: `project-brief.md`

---

### PM 📋

| Command                  | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `*create-doc {template}` | Generate document via template                           |
| `*revise-prd`            | Handle PRD-level changes, create PCP                     |
| `*start-iteration`       | Start new iteration (post-MVP, requires sharded PRD)     |
| `*status [--verbose]`    | View project status, health metrics, and recommendations |

**Output**: `prd.md`, `docs/proposals/product/PCP-YYYY-NNN.md`

---

### UX-Expert 🎨

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `*create-doc {template}` | Create from template (or list templates) |
| `*generate-ui-prompt`    | Craft AI frontend generation prompt      |

**Output**: `front-end-spec.md`

---

### Architect 🏗️

| Command                         | Description                             |
| ------------------------------- | --------------------------------------- |
| `*review {story_id}`            | Review Story technical solution         |
| `*create-doc {template}`        | Generate document from template         |
| `*resolve-change`               | Handle technical changes, generate TCP  |
| `*create-system-architecture`   | Generate system-level architecture      |
| `*create-backend-architecture`  | Generate backend detailed architecture  |
| `*create-frontend-architecture` | Generate frontend detailed architecture |
| `*create-mobile-architecture`   | Generate mobile detailed architecture   |
| `*document-project`             | Document existing codebase              |
| `*aggregate-system-analysis`    | Aggregate repo analysis (Product repo)  |
| `*extract-api-contracts`        | Extract API docs from backend code      |
| `*research {topic}`             | Deep technical research                 |

**Output**: `architecture.md`, `docs/proposals/tech/TCP-YYYY-NNN.md`

---

### PO 📝

| Command                          | Description                                     |
| -------------------------------- | ----------------------------------------------- |
| `*execute-checklist {checklist}` | Run a checklist (default: po-master-validation) |
| `*shard`                         | Shard PRD and Architecture documents            |
| `*route-change`                  | Route change request to PM or Architect         |
| `*assemble [prd\|arch\|both]`    | Assemble sharded docs for export                |

**Output**: Sharded docs in `docs/prd/`, `docs/architecture/`

---

### SM 🏃

| Command                                                       | Description                               |
| ------------------------------------------------------------- | ----------------------------------------- |
| `*draft [{story_id}]`                                         | Create next Story (or check specified)    |
| `*draft-bugfix "{bug}" [--source {story_id}] [--files "..."]` | Create bugfix story (from Dev escalation) |
| `*revise {story_id}`                                          | Revise Story based on Architect feedback  |
| `*apply-proposal [{proposal_id}]`                             | Apply proposal to create/update Stories   |
| `*story-checklist {story_id}`                                 | Validate Story quality                    |
| `*init-registries`                                            | Initialize/refresh cumulative registries  |

**Output**: `docs/stories/{epic}.{story}-{title}.md`

---

### Dev 💻

| Command                                  | Description                                    |
| ---------------------------------------- | ---------------------------------------------- |
| `*develop-story {story_id}`              | Implement Story (TDD mode)                     |
| `*quick-develop {story_id}`              | Quick implementation (trivial/simple)          |
| `*quick-fix "{bug}" [--files "{paths}"]` | Lightweight bug fix (no story, scope ≤3 files) |
| `*self-review {story_id}`                | Self-review (required before QA)               |
| `*apply-qa-fixes {story_id}`             | Fix QA-reported issues                         |
| `*run-tests`                             | Execute lint and test suite                    |

**Output**: Implementation code + Tests

---

### QA 🧪

| Command                       | Description                             |
| ----------------------------- | --------------------------------------- |
| `*review {story_id}`          | Review Story code quality (4-dimension) |
| `*quick-verify {story_id}`    | Quick verification (trivial/simple)     |
| `*test-design {story_id}`     | Design test scenarios (complex Story)   |
| `*finalize-commit {story_id}` | Create git commit for completed Story   |
| `*nfr-assess {story_id}`      | Assess NFRs (security, performance)     |
| `*trace {story_id}`           | Map requirements to Given/When/Then     |
| `*risk-profile {story_id}`    | Generate risk assessment matrix         |
| `*smoke-test {epic_id}`       | Post-epic end-to-end smoke test         |

**Output**: QA Report + Git Commit

---

## Story Format

| Element        | Format                            | Example                                       |
| -------------- | --------------------------------- | --------------------------------------------- |
| Story ID       | `{epic}.{story}`                  | `1.1`, `2.3`                                  |
| Story Filename | `{epic}.{story}-{kebab-title}.md` | `1.3-user-authentication-api.md`              |
| Story Path     | `docs/stories/{filename}`         | `docs/stories/1.3-user-authentication-api.md` |

## Workflow

### Standard 8-Step Workflow

**Phase 1 (Planning)**: Analyst → PM → UX-Expert → Architect → PM → PO
**Phase 2 (Development)**: SM → (Architect review) → Dev ↔ QA loop

### Development Iteration Flow

```
SM *draft
    ↓
┌───────┴───────┐
↓               ↓
Approved        AwaitingArchReview
↓               ↓
Dev             Architect *review {id}
                ├─ Approved → Dev
                └─ RequiresRevision → SM *revise {id}
    ↓
Dev *develop-story {id}
    ↓
Dev *self-review {id}
    ↓
QA *review {id}
├─ PASS → QA *finalize-commit {id} → Done
└─ FAIL → Dev *apply-qa-fixes {id} → QA *review
```

### Post-MVP Iteration

```
PM *start-iteration → UX-Expert (if UI) → Architect → SM → Dev → QA
```

## Story Status (8 States)

| Status               | Responsible | Next Command                       |
| -------------------- | ----------- | ---------------------------------- |
| `Blocked`            | SM          | `*draft` or `*revise {id}`         |
| `AwaitingArchReview` | Architect   | `*review {id}`                     |
| `RequiresRevision`   | SM          | `*revise {id}`                     |
| `Approved`           | Dev         | `*develop-story {id}`              |
| `InProgress`         | Dev         | Continue or `*apply-qa-fixes {id}` |
| `Review`             | QA          | `*review {id}`                     |
| `Done`               | -           | Next story                         |
| `Escalated`          | Human       | Manual decision                    |

## Quality Gates

| Gate             | Threshold                     | Action                |
| ---------------- | ----------------------------- | --------------------- |
| SM Story Quality | Score ≥ 8.0 + Complexity ≤ 1  | Auto-Approved         |
| SM Story Quality | Score < 8.0 OR Complexity > 1 | → Architect Review    |
| Architect Review | Score ≥ 7/10 + No Critical    | Approved              |
| Architect Review | Max 2 rounds                  | Prevent infinite loop |
| QA Review        | Max 3 rounds                  | Progressive standards |

**QA Auto-Commit**: Gate=PASS + Status=Done → Auto git commit

## Change Handling

### Entry Point (PO `*route-change`)

| Change Type | Keywords                             | Route To                    |
| ----------- | ------------------------------------ | --------------------------- |
| Technical   | API, database, performance, security | Architect `*resolve-change` |
| Product     | feature, user story, MVP, scope      | PM `*revise-prd`            |
| Mixed       | Both types                           | PM (product-first)          |

### Change Handling Flow

```
User raises change
    ↓
[PO *route-change]
    ↓
┌───────┴───────┐
↓               ↓
Technical       Product/Mixed
↓               ↓
Architect       PM *revise-prd
*resolve-change     ↓
↓               Creates PCP
Creates TCP         ↓
↓               Needs tech change?
↓         ┌──NO──┴──YES──┐
↓         ↓              ↓
↓      Direct→SM    Architect
↓                   *resolve-change
↓                       ↓
↓                   Creates TCP
↓                       ↓
└───────────→[SM *apply-proposal]←───────────┘
                    ↓
              Create/Update Stories
                    ↓
              Standard Dev Flow
```

### Proposal System

| Type            | ID Format      | Location                  | Generator |
| --------------- | -------------- | ------------------------- | --------- |
| Product (PCP)   | `PCP-YYYY-NNN` | `docs/proposals/product/` | PM        |
| Technical (TCP) | `TCP-YYYY-NNN` | `docs/proposals/tech/`    | Architect |

**SM Proposal Processing**:

```bash
SM *apply-proposal PCP-2025-003   # Specific proposal
SM *apply-proposal                # Auto-discover draft proposals
```

**Processing Order**: If linked PCP+TCP exist, process PCP first (product-first)

## Handoff Format

```
🎯 HANDOFF TO {agent}: *{command} {args}
```

| From         | To        | Handoff Example                                                                 |
| ------------ | --------- | ------------------------------------------------------------------------------- |
| SM           | Architect | `🎯 HANDOFF TO architect: *review 1.1`                                          |
| SM           | Dev       | `🎯 HANDOFF TO dev: *develop-story 1.1`                                         |
| Architect    | Dev       | `🎯 HANDOFF TO dev: *develop-story 1.1`                                         |
| Architect    | SM        | `🎯 HANDOFF TO SM: *revise 1.1`                                                 |
| Dev          | QA        | `🎯 HANDOFF TO qa: *review 1.1`                                                 |
| Dev          | SM        | `🎯 HANDOFF TO SM: *draft-bugfix "{bug}" --source {story_id} --files "{files}"` |
| QA           | Dev       | `🎯 HANDOFF TO dev: *apply-qa-fixes 1.1`                                        |
| QA           | SM        | `🎯 HANDOFF TO sm: *draft`                                                      |
| PO           | PM        | `🎯 HANDOFF TO PM: *revise-prd`                                                 |
| PO           | Architect | `🎯 HANDOFF TO ARCHITECT: *resolve-change`                                      |
| PM/Architect | SM        | `🎯 HANDOFF TO SM: *apply-proposal PCP-2025-001`                                |

## Quick Reference

### Project Status

```
PM *status           # View project health, bottlenecks, recommendations
PM *status --verbose # Include detailed story breakdown
```

### New Project

```
Analyst *create-doc → PM *create-doc → UX-Expert *create-doc
→ Architect *create-doc → PM (review) → PO *execute-checklist
→ PO *shard → SM *draft → Dev → QA (repeat)
```

### Change Request

```
PO *route-change → (PM or Architect) → SM *apply-proposal → Dev → QA
```

### New Iteration

```
PM *start-iteration → (UX-Expert if UI) → Architect → SM *draft → Dev → QA
```

### Story Cycle

```
SM *draft → (Architect *review) → Dev *develop-story → Dev *self-review → QA *review → QA *finalize-commit
```

### Bug Fix

```
Dev *quick-fix "{bug}" [--files "{paths}"]
    ↓
Phase 1: Context Loading (trace source story via git blame)
Phase 2: Impact Analysis (list affected files)
    ↓
Scope ≤ 3 files? ─── YES → Phase 3-5: Fix & Verify → Done
    │
    NO (escalate)
    ↓
🎯 HANDOFF TO SM: *draft-bugfix "{bug}" --source {story_id} --files "{files}"
    ↓
SM creates bugfix story under source Epic (or Maintenance Epic)
    ↓
Dev *quick-develop {bugfix_story_id}
```
