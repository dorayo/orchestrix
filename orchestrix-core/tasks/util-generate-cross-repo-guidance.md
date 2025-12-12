# Generate Cross-Repo Guidance Message

## Purpose

Utility for generating standardized guidance messages when actions need to be performed
in the product repository. Used when escalating from implementation repositories in
multi-repo mode.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| target_agent | string | Yes | Target agent: PM, PO, or Architect |
| target_command | string | Yes | Command to execute (e.g., `*revise-prd`) |
| reason_title | string | Yes | Title describing why cross-repo is needed |
| context | object | Yes | Context information to include |

## Context Object Structure

```yaml
context:
  source_repository: string    # Current repository ID
  summary: string              # Brief description of the change
  details: object              # Additional context fields (varies by use case)
```

## Process

### Step 1: Load Configuration

Read: `{root}/core-config.yaml`

**Extract**:
- `project.mode`: monolith | multi-repo
- `project.multi_repo.role`: product | backend | frontend | ios | android
- `project.multi_repo.product_repo_path`: Path to product repository
- `project.multi_repo.repository_id`: Current repository identifier

---

### Step 2: Determine Message Type

```
IF project.mode = "monolith":
  Return: STANDARD_HANDOFF

IF project.multi_repo.role = "product":
  Return: STANDARD_HANDOFF

ELSE:
  Return: CROSS_REPO_GUIDANCE
```

---

### Step 3: Generate Message

#### IF STANDARD_HANDOFF:

```
🎯 HANDOFF TO {target_agent}: *{target_command}
Context: {context.summary}
{...context.details formatted as key-value pairs}
```

#### IF CROSS_REPO_GUIDANCE:

```
⚠️ {reason_title}

{Additional explanation based on reason_title}

📍 ACTION REQUIRED:
1. Switch to product repository: cd {product_repo_path}
2. Execute: @{target_agent} *{target_command}

Context:
- Source repository: {repository_id}
- {context.summary}
{...context.details formatted as bullet points}

{Footer note about product repository management}
```

---

## Output

```yaml
message_type: "STANDARD_HANDOFF" | "CROSS_REPO_GUIDANCE"
message: "{formatted message}"
```

---

## Reason Title Templates

| Reason Title | Use Case | Footer Note |
|-------------|----------|-------------|
| `PRODUCT-LEVEL CHANGE REQUIRED` | PRD modification needed | "The PRD and Epic definitions are managed in the product repository." |
| `CROSS-REPOSITORY CHANGE DETECTED` | Technical change spans repos | "The proposal has been saved to the product repository for centralized review." |
| `EPIC-LEVEL CHANGE REQUIRED` | Epic restructure needed | "Epic definitions are managed in the product repository." |
| `MVP SCOPE CHANGE REQUIRED` | MVP scope modification | "MVP scope decisions must be made in the product repository." |

---

## Usage Examples

### Example 1: Escalate to PM for PRD Change

```yaml
Input:
  target_agent: "PM"
  target_command: "*revise-prd"
  reason_title: "PRODUCT-LEVEL CHANGE REQUIRED"
  context:
    source_repository: "backend-api"
    summary: "Feature scope needs adjustment"
    details:
      technical_analysis: "API contract change requires feature redesign"
      feature_impact: "User authentication flow"
      mvp_risk: true
      reasoning: "Cannot implement without PRD clarification"

Output (multi-repo implementation repo):
  message_type: "CROSS_REPO_GUIDANCE"
  message: |
    ⚠️ PRODUCT-LEVEL CHANGE REQUIRED

    This change requires PRD modification, which must be done in the product repository.

    📍 ACTION REQUIRED:
    1. Switch to product repository: cd ../my-product
    2. Execute: @pm *revise-prd

    Context:
    - Source repository: backend-api
    - Feature scope needs adjustment
    - Technical analysis: API contract change requires feature redesign
    - Feature impact: User authentication flow
    - MVP risk: true
    - Reasoning: Cannot implement without PRD clarification

    The PRD and Epic definitions are managed in the product repository.
```

### Example 2: Cross-Repo Technical Change

```yaml
Input:
  target_agent: "Architect"
  target_command: "*review-cross-repo-change docs/architecture/proposals/tcp-2025-001.md"
  reason_title: "CROSS-REPOSITORY CHANGE DETECTED"
  context:
    source_repository: "backend-api"
    summary: "Technical change affects multiple repositories"
    details:
      scope: "CROSS_REPO"
      indicators: ["cross_api", "cross_deploy"]
      affected_repos: ["backend-api", "frontend-web", "mobile-ios"]
      proposal_location: "docs/architecture/proposals/tcp-2025-001.md"

Output (multi-repo implementation repo):
  message_type: "CROSS_REPO_GUIDANCE"
  message: |
    ⚠️ CROSS-REPOSITORY CHANGE DETECTED

    This technical change affects multiple repositories and requires coordination
    at the product level.

    📍 ACTION REQUIRED:
    1. Switch to product repository: cd ../my-product
    2. Execute: @architect *review-cross-repo-change docs/architecture/proposals/tcp-2025-001.md

    Context:
    - Source repository: backend-api
    - Technical change affects multiple repositories
    - Scope: CROSS_REPO
    - Indicators: [cross_api, cross_deploy]
    - Affected repos: [backend-api, frontend-web, mobile-ios]
    - Proposal location: docs/architecture/proposals/tcp-2025-001.md

    The proposal has been saved to the product repository for centralized review.
```

### Example 3: Monolith Mode (Standard HANDOFF)

```yaml
Input:
  target_agent: "PM"
  target_command: "*revise-prd"
  reason_title: "PRODUCT-LEVEL CHANGE REQUIRED"
  context:
    source_repository: "monolith"
    summary: "Feature scope needs adjustment"
    details:
      reasoning: "Cannot implement without PRD clarification"

Output (monolith mode):
  message_type: "STANDARD_HANDOFF"
  message: |
    🎯 HANDOFF TO PM: *revise-prd
    Context: Feature scope needs adjustment
    Reasoning: Cannot implement without PRD clarification
```

---

## Integration Notes

This utility is called by:
- `architect-resolve-change.md` - For ESCALATE_TO_PRODUCT and CROSS_REPO scenarios
- `po-correct-course.md` - For ESCALATE_TO_PRODUCT scenarios
- Any task that needs to escalate to product-level agents in multi-repo mode

The utility ensures consistent messaging format across all escalation points.
