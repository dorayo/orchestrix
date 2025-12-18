# PO Change Router

## Purpose

Analyze incoming change requests and route them to the appropriate handler.
PO acts as an intelligent router for changes when the user is unsure whether
the change is technical or product-related.

## Command

```
*route-change <change_description>
```

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Free-form description of the requested change |

## Process

### Step 1: Analyze Change Type

Parse `change_description` to identify semantic indicators:

**Technical Change Indicators:**
- Keywords: architecture, API, database, schema, performance, security, infrastructure
- Patterns: refactor, migration, integration, endpoint, service, cache, index
- Context: system design, tech stack, scalability, latency

**Product Change Indicators:**
- Keywords: feature, requirement, user story, MVP, scope, priority
- Patterns: PRD, product, business, user experience, workflow
- Context: product direction, market, customer need, business rule

**Mixed Change Indicators:**
- Contains both technical AND product keywords
- Example: "Add data export feature (needs new API and background jobs)"

### Step 2: Determine Routing

Based on analysis, determine the appropriate route:

```yaml
IF clearly_technical AND NOT product_indicators:
  route_to: ARCHITECT
  command: "*resolve-change"

ELSE IF clearly_product AND NOT technical_indicators:
  route_to: PM
  command: "*revise-prd"

ELSE IF mixed_change (both indicators present):
  route_to: PM
  command: "*revise-prd"
  note: "Product-first principle - product decisions drive technical implementation"

ELSE (unable to determine):
  action: ASK_USER
  question: "Could you clarify if this change is primarily about product requirements or technical implementation?"
```

### Step 3: Execute Routing

**IF route_to == ARCHITECT:**

Output:
```

🎯 HANDOFF TO ARCHITECT: *resolve-change
Context: {change_description}
Classification: Technical change
Indicators: [{technical_keywords_found}]
```

**IF route_to == PM:**

Output:
```

🎯 HANDOFF TO PM: *revise-prd
Context: {change_description}
Classification: Product change {{#if mixed}}(mixed - product first){{/if}}
Indicators: [{product_keywords_found}]
{{#if mixed}}
Note: This appears to be a mixed change. PM will handle product aspects first.
If technical changes are needed, PM will generate a Product Proposal that
triggers a subsequent Technical Proposal from Architect.
{{/if}}
```

**IF action == ASK_USER:**

Output:
```
I need clarification to route this change request properly.

The change description: "{change_description}"

Could you help me understand:
1. Is this primarily about **what** the product should do (product change)?
2. Or about **how** the system should implement something (technical change)?

Options:
- "Product" - Route to PM for PRD revision
- "Technical" - Route to Architect for technical design
- Provide more context for me to determine
```

## Output

**Success - Routed to Architect:**
```yaml
routing_result:
  destination: ARCHITECT
  command: "*resolve-change"
  change_type: technical
  indicators_matched: [{list}]
  change_description: "{original_description}"
```

**Success - Routed to PM:**
```yaml
routing_result:
  destination: PM
  command: "*revise-prd"
  change_type: product | mixed
  indicators_matched: [{list}]
  change_description: "{original_description}"
  {{#if mixed}}
  mixed_note: "Product-first routing for mixed changes"
  {{/if}}
```

**Pending - User Clarification Needed:**
```yaml
routing_result:
  destination: PENDING
  action: ASK_USER
  reason: "Unable to determine change type from description"
  change_description: "{original_description}"
```

## Examples

### Example 1: Clear Technical Change

**Input:** "The API response time is too slow, need to optimize database queries"

**Analysis:**
- Technical indicators: API, optimize, database queries
- Product indicators: none
- Result: Technical change

**Output:**
```

🎯 HANDOFF TO ARCHITECT: *resolve-change
Context: The API response time is too slow, need to optimize database queries
Classification: Technical change
Indicators: [API, optimize, database]
```

### Example 2: Clear Product Change

**Input:** "Users are requesting a dark mode feature for the application"

**Analysis:**
- Technical indicators: none
- Product indicators: users, feature, requesting
- Result: Product change

**Output:**
```

🎯 HANDOFF TO PM: *revise-prd
Context: Users are requesting a dark mode feature for the application
Classification: Product change
Indicators: [users, feature, requesting]
```

### Example 3: Mixed Change

**Input:** "Need to add data export functionality, will require new background job system"

**Analysis:**
- Technical indicators: background job system
- Product indicators: data export functionality, add
- Result: Mixed change (product-first)

**Output:**
```

🎯 HANDOFF TO PM: *revise-prd
Context: Need to add data export functionality, will require new background job system
Classification: Product change (mixed - product first)
Indicators: [data export, functionality, background job]
Note: This appears to be a mixed change. PM will handle product aspects first.
If technical changes are needed, PM will generate a Product Proposal that
triggers a subsequent Technical Proposal from Architect.
```

### Example 4: Ambiguous Change

**Input:** "The login is problematic"

**Analysis:**
- Technical indicators: possible (login could be API/performance issue)
- Product indicators: possible (login could be UX/flow issue)
- Result: Unable to determine

**Output:**
```
I need clarification to route this change request properly.

The change description: "The login is problematic"

Could you help me understand:
1. Is this primarily about **what** the product should do (product change)?
2. Or about **how** the system should implement something (technical change)?

Options:
- "Product" - Route to PM for PRD revision (e.g., login flow design issues)
- "Technical" - Route to Architect for technical design (e.g., login API performance)
- Provide more context for me to determine
```

## Notes

- PO does NOT process changes directly - only routes them
- Product-first principle: When in doubt between product and technical, route to PM
- Mixed changes go to PM first; PM will coordinate with Architect if needed
- This task replaces the old `po-correct-course.md` with a simpler routing model
