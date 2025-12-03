# Classify Proposal Scope

## Purpose

Determine whether a technical proposal has LOCAL or CROSS_REPO scope in multi-repo mode.
This classification drives where the proposal is stored and how it is routed.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| impact_analysis | object | Yes | Impact analysis from architect-resolve-change.md Step 3 |
| project_mode | string | No | Project mode from core-config. Default: read from config |

## Impact Analysis Object Structure

```yaml
impact_analysis:
  # API Impact
  api_contracts_affected: boolean      # Any API contract changes
  api_consumers_external: boolean      # APIs consumed by other repositories

  # Data Impact
  shared_schema_affected: boolean      # Shared database schema changes
  shared_data_structures: boolean      # Shared data models/DTOs

  # Architecture Impact
  system_architecture_affected: boolean # System-level architecture changes
  new_services_added: boolean          # New services or components
  messaging_changes: boolean           # Message queue/event changes

  # Deployment Impact
  deployment_coordination_needed: boolean  # Multi-repo deployment order
  breaking_changes: boolean               # Breaking changes requiring sync
```

## Process

### Step 1: Load Project Mode (if not provided)

**IF project_mode not provided**:

Read: `{root}/core-config.yaml`

Extract: `project.mode`

**IF project.mode = "monolith"**:
- Set `scope = "LOCAL"`
- Skip to Output (monolith always LOCAL)

---

### Step 2: Extract Cross-Repo Indicators

From `impact_analysis`, evaluate these indicators:

| Indicator | Condition | Weight |
|-----------|-----------|--------|
| `cross_api` | `api_contracts_affected = true AND api_consumers_external = true` | Critical |
| `cross_schema` | `shared_schema_affected = true` | Critical |
| `cross_data` | `shared_data_structures = true` | High |
| `cross_arch` | `system_architecture_affected = true OR new_services_added = true` | Critical |
| `cross_messaging` | `messaging_changes = true` | High |
| `cross_deploy` | `deployment_coordination_needed = true OR breaking_changes = true` | Critical |

---

### Step 3: Apply Classification Rules

**CROSS_REPO** if ANY of these conditions are true:

1. **API Contract Changes Affecting Other Repos**
   ```
   api_contracts_affected = true AND api_consumers_external = true
   ```
   - Rationale: Changes to APIs consumed by other repos require coordination

2. **Shared Database Schema Changes**
   ```
   shared_schema_affected = true
   ```
   - Rationale: Schema changes may affect multiple repos reading same data

3. **System Architecture Changes**
   ```
   system_architecture_affected = true OR new_services_added = true
   ```
   - Rationale: Architectural changes require product-level visibility

4. **Messaging/Event Changes**
   ```
   messaging_changes = true
   ```
   - Rationale: Event schema changes affect all consumers

5. **Deployment Coordination Required**
   ```
   deployment_coordination_needed = true OR breaking_changes = true
   ```
   - Rationale: Multi-repo deployment order must be coordinated

**OTHERWISE**: `scope = "LOCAL"`

---

### Step 4: Generate Classification Result

**Store**:
```yaml
scope: "LOCAL" | "CROSS_REPO"
indicators_triggered: [{indicator_name}, ...]
confidence: "HIGH" | "MEDIUM"  # HIGH if critical indicators, MEDIUM if only high-weight
```

---

## Output

```yaml
result:
  scope: "LOCAL" | "CROSS_REPO"
  indicators_triggered:
    - "{indicator_name}"
  reasoning: "{explanation of why this scope was chosen}"
  confidence: "HIGH" | "MEDIUM"
  recommendations:
    storage_location: "local" | "product_repo"
    handoff_target: "SM" | "Product Architect"
```

---

## Decision Matrix

| Scenario | API External | Schema | Architecture | Deploy Coord | Result |
|----------|-------------|--------|--------------|--------------|--------|
| Internal refactor | No | No | No | No | LOCAL |
| Internal API change (no external consumers) | Yes, internal | No | No | No | LOCAL |
| API change with external consumers | Yes, external | No | No | No | CROSS_REPO |
| Database migration (shared DB) | No | Yes | No | No | CROSS_REPO |
| New microservice | No | No | Yes | Yes | CROSS_REPO |
| Performance optimization | No | No | No | No | LOCAL |
| Event schema change | No | No | No | Yes | CROSS_REPO |

---

## Usage Examples

### Example 1: Local Refactoring

```yaml
Input:
  impact_analysis:
    api_contracts_affected: false
    shared_schema_affected: false
    system_architecture_affected: false
    deployment_coordination_needed: false

Output:
  scope: "LOCAL"
  indicators_triggered: []
  reasoning: "No cross-repo indicators detected. Change is contained within current repository."
  confidence: "HIGH"
  recommendations:
    storage_location: "local"
    handoff_target: "SM"
```

### Example 2: API Contract Change

```yaml
Input:
  impact_analysis:
    api_contracts_affected: true
    api_consumers_external: true
    shared_schema_affected: false
    system_architecture_affected: false
    deployment_coordination_needed: true

Output:
  scope: "CROSS_REPO"
  indicators_triggered:
    - "cross_api"
    - "cross_deploy"
  reasoning: "API changes affect external consumers. Deployment coordination required."
  confidence: "HIGH"
  recommendations:
    storage_location: "product_repo"
    handoff_target: "Product Architect"
```

### Example 3: Database Schema Change

```yaml
Input:
  impact_analysis:
    api_contracts_affected: false
    shared_schema_affected: true
    system_architecture_affected: false
    deployment_coordination_needed: false

Output:
  scope: "CROSS_REPO"
  indicators_triggered:
    - "cross_schema"
  reasoning: "Shared database schema changes may affect multiple repositories."
  confidence: "HIGH"
  recommendations:
    storage_location: "product_repo"
    handoff_target: "Product Architect"
```

---

## Integration Notes

This utility is called by:
- `architect-resolve-change.md` (Step 3.5) - To determine proposal storage location
- Decision rule: `data/decisions/proposal-scope.yaml`

The scope classification directly affects:
1. Where the technical proposal is stored
2. Who receives the HANDOFF (local SM vs Product Architect)
3. Whether coordination across repos is required
