# DEPRECATED: Correct Course Task

> **DEPRECATION NOTICE**: This file has been superseded by the layered change management system.
>
> Use the following layer-specific tasks instead:
> - **Story-level changes**: `sm-correct-course.md` (SM agent: `*correct-course`)
> - **Epic-level changes**: `po-correct-course.md` (PO agent: `*correct-course`)
> - **Tech-level changes**: `architect-resolve-change.md` (Architect agent: `*resolve-tech-change`)
> - **Product-level changes**: `pm-revise-prd.md` (PM agent: `*revise-prd`)
>
> The new system provides semantic routing based on change description analysis.
> See `data/decisions/change-level-classification.yaml` for routing rules.

---

## Original Purpose (Historical Reference)

This task was a unified change management workflow that guided structured responses to change triggers. It has been replaced by a four-layer architecture where each layer handles changes appropriate to its scope:

| Layer | Agent | Scope | Task |
|-------|-------|-------|------|
| Story | SM | Single story modifications | sm-correct-course.md |
| Epic | PO | Epic structure, multi-story changes | po-correct-course.md |
| Tech | Architect | API, DB schema, architecture | architect-resolve-change.md |
| Product | PM | PRD, MVP scope, features | pm-revise-prd.md |

## Migration Guide

1. When receiving a change description, use `tasks/utils/classify-change-level.md` to determine the appropriate layer
2. Route to the layer-specific task based on classification result
3. Each layer can escalate to higher layers if needed
4. Higher layers cascade changes down after resolution

## Related Files

- Classification utility: `tasks/utils/classify-change-level.md`
- Decision rules: `data/decisions/change-level-classification.yaml`
- Escalation rules: `data/decisions/{agent}-change-escalation.yaml`
- Status transitions: `data/story-status-transitions.yaml`
