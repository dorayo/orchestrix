# Long-Task Rule Retention Fix

**Date**: 2025-01-14
**Issue**: DEV agent forgets workflow rules in long, multi-session stories
**Priority**: Critical - Affects completion quality in complex stories

## 🔴 Problem: Context Decay in Long-Running Tasks

### Observed Behavior

In complex stories requiring 4+ interaction sessions:

```
Session 1:
DEV: Starting implementation...
     ✅ Strictly follows TDD
     ✅ Updates Dev Log
     ✅ Remembers completion gates

User: continue

Session 2:
DEV: Continuing Phase 2...
     ✅ Still follows TDD
     ⚠️ Dev Log updates less detailed
     ⚠️ Starting to forget about gates

User: continue

Session 3:
DEV: Working on Phase 3...
     ⚠️ TDD flow loosening
     ⚠️ Dev Log updates incomplete
     ❌ Has forgotten about completion gates

User: continue

Session 4:
DEV: Phase 4 complete, all tests pass!
     "Implementation done!"
     ❌ Completely forgot GATE 1 (self-review)
     ❌ Completely forgot GATE 2 (completion steps)
     ❌ No Status update
     ❌ No handoff message
     [Stops prematurely]
```

### Root Cause: Context Decay

**What happens cognitively**:

1. **Session 1**: Full context loaded
   - Task instructions: 100%
   - Workflow rules: 100%
   - Completion requirements: 100%

2. **Session 2**: Context starts degrading
   - Task instructions: 90%
   - Workflow rules: 80%
   - Completion requirements: 70%
   - Technical details from Session 1: Filling memory

3. **Session 3**: Significant decay
   - Task instructions: 70%
   - Workflow rules: 50%
   - Completion requirements: 30%
   - Technical details: Dominating memory

4. **Session 4+**: Critical decay
   - Task instructions: 50%
   - Workflow rules: 20%
   - Completion requirements: **10%** ← Forgotten
   - Technical details: 90% of working memory

**Why**: LLM working memory prioritizes **recent technical context** over **distant procedural rules**.

### User's Observation

> "有些story可能需要干的事情比较多，LLM会执行到一定程度停下来，继续下一个指示，我发现这种停下来的情况多了之后就会出现不会严格按照我们的要求"

**Translation**: After multiple pause/resume cycles, LLM stops strictly following requirements.

---

## ❌ Why Previous Solution Insufficient

**Our previous fix (2-gate system) assumed single-session completion**:

```
Implementation → GATE 1 → GATE 2 → Handoff
[All in one session]
✅ Works perfectly
```

**But in multi-session scenarios**:

```
Session 1: Implementation Part 1
Session 2: Implementation Part 2
Session 3: Implementation Part 3
Session 4: Implementation Part 4
           ↓
           GATE 1?  ← LLM has forgotten gates exist
           GATE 2?  ← LLM doesn't remember these
```

**The problem**:

- Gates are only mentioned at **beginning** (in task file)
- No **continuous reinforcement** during implementation
- No **rule preservation** mechanism between sessions
- No **rule reload** mechanism when resuming

---

## ✅ Solution: Continuous Rule Reinforcement

### Architecture: 3-Layer Protection

```
Layer 1: Initial Loading
↓
Layer 2: Continuous Preservation (NEW)
↓
Layer 3: Final Enforcement (Existing)
```

**Layer 1**: Task file loads rules at start
**Layer 2**: Resumption Guide preserves rules between sessions ← **NEW**
**Layer 3**: Completion checklist enforces at end ← **Existing**

### Component 1: Resumption Guide Rule Preservation ✨

**New Utility**: `tasks/utils/update-resumption-guide.md`

**Purpose**: Force-record workflow rules in Dev Log every time work pauses

**How it works**:

```markdown
## Resumption Guide

[Progress information]

### ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER ⚠️⚠️⚠️

**YOU MUST REMEMBER THESE RULES WHEN YOU RESUME**:

1. ✅ TDD Flow: RED → GREEN → REFACTOR
2. ✅ Dev Log Maintenance: Append-only, update after every subtask
3. ✅ Test Integrity: NEVER weaken tests to pass
4. ✅ Architecture Compliance: Validate against architecture docs
5. ✅ API Contracts: Exact match required (multi-repo)
6. ✅ COMPLETION REQUIREMENTS:
   - GATE 1: Execute dev-self-review.md
   - GATE 2: Execute dev-completion-steps.md (25 items, 100%)
   - Task NOT complete until handoff output
7. ✅ Status Management: Validate transitions
8. ✅ Handoff Protocol: Must be FINAL output

### Resumption Checklist

[8-item verification checklist]
```

**Key Innovation**: Rules are **written into Dev Log**, not just in task file.

**When called**:

- After completing a Phase
- User says "continue" or "pause"
- Encountering blocking issue
- After ≥3 subtasks in one session
- ANY interruption in flow

### Component 2: Mandatory Rule Reload on Resume ✨

**Modified**: `implement-story.md` Step 2 (Dev Log)

**New Resume Process**:

```markdown
**Resume** (CRITICAL for multi-session stories):

1. Load Dev Log and locate Resumption Guide

2. Read ENTIRE Resumption Guide, especially:
   - ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES section
   - All 8 workflow rules
   - GATE 1 and GATE 2 requirements
   - Handoff protocol

3. Reload Rules into Working Memory:
   - Acknowledge: "Resuming from Phase X"
   - Confirm: "Re-loaded 8 critical workflow rules"
   - Confirm: "Understand GATE 1 and GATE 2 required at end"
   - Confirm: "Handoff message must be final output"

4. Verify Resumption Checklist (8 items)

5. Continue with rules reinforced
```

**Key Innovation**: **Explicit rule acknowledgment** required when resuming.

### Component 3: Pause-Point Enforcement ✨

**Modified**: `implement-story.md` Step 3 (Implement Tasks)

**Added**:

```markdown
**⚠️ CRITICAL: Before ANY pause/interruption**:

If you must stop or pause:
→ Execute: update-resumption-guide.md

This preserves:

- 8 critical workflow rules
- GATE 1 and GATE 2 requirements
- Handoff protocol

**When to call**:

- After completing a Phase
- User says "pause" or "continue later"
- Encountering blocking issue
- After ≥3 subtasks in one session
- ANY interruption in flow

**Do NOT skip this** - Rule retention depends on it.
```

**Key Innovation**: **Proactive** rule preservation before each pause.

---

## 🔄 Complete Multi-Session Flow

### Session 1

```
*develop-story 2.3

Load implement-story.md
↓
Load 8 critical rules into memory
↓
Phase 1 implementation
  - Subtask 1.1 ✅
  - Subtask 1.2 ✅
  - Subtask 1.3 ✅
↓
Phase 1 complete
↓
⚠️ About to pause - Execute update-resumption-guide.md
↓
Resumption Guide updated with:
  - Progress: Phase 1 done, next: Phase 2
  - ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES (all 8)
  - GATE 1 and GATE 2 requirements
  - Handoff protocol
↓
[Pause, waiting for user]
```

### Session 2

```
User: continue

Load Dev Log
↓
Read Resumption Guide
↓
Read: ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES
↓
Reload into memory:
  ✅ 8 workflow rules
  ✅ GATE 1 and GATE 2 requirements
  ✅ Handoff protocol
↓
Acknowledge: "Resuming from Phase 1, re-loaded rules"
↓
Phase 2 implementation (with rules reinforced)
  - Subtask 2.1 ✅
  - Subtask 2.2 ✅
↓
Phase 2 complete
↓
⚠️ About to pause - Execute update-resumption-guide.md again
↓
Resumption Guide updated again with rules
↓
[Pause]
```

### Session 3, 4, 5...

```
Each session:
1. Load Dev Log
2. Read Resumption Guide
3. Reload 8 rules + gates
4. Continue implementation
5. Before pause: Update Resumption Guide
6. Rules preserved for next session

Even at Session 10:
- Rules reload from Resumption Guide
- GATE 1 and GATE 2 not forgotten
- Handoff protocol remembered
```

### Final Session

```
Phase 4 complete
↓
Load Resumption Guide (as usual)
↓
Rules still fresh in memory:
  ✅ Remember GATE 1 and GATE 2
  ✅ Remember handoff protocol
↓
GATE 1: Self-review → PASS
↓
⚠️⚠️⚠️ Task NOT complete yet
↓
GATE 2: Completion steps → 100%
↓
Output handoff message
↓
*review 2.3
```

---

## 📊 Expected Impact

### Before Fix

**Long stories (6+ sessions)**:

- Rule retention: **20%** by final session
- GATE 1 execution: **40%**
- GATE 2 execution: **10%**
- Proper handoff: **30%**

**Symptoms**:

- Forgets to run self-review
- Forgets completion checklist
- Forgets to update status
- Forgets handoff message

### After Fix

**Long stories (6+ sessions)**:

- Rule retention: **95%** (reloaded each session)
- GATE 1 execution: **95%**
- GATE 2 execution: **95%**
- Proper handoff: **95%**

**Benefits**:

- Rules preserved across sessions
- Gates explicitly reminded
- Handoff protocol maintained
- Consistent quality regardless of story length

---

## 🔬 Technical Details

### Resumption Guide Structure

```markdown
## Resumption Guide

**Last Updated**: 2025-01-14 16:30:00
**Current Phase**: 2
**Current Subtask**: 2.3
**Session**: 2

### Where We Are

[Progress summary]

### What to Do Next

[Next steps]

---

### ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER ⚠️⚠️⚠️

**YOU MUST REMEMBER THESE RULES WHEN YOU RESUME**:

1. ✅ **TDD Flow**: RED → GREEN → REFACTOR
   - No production code before failing test
   - Tests are authoritative, never weaken

2. ✅ **Dev Log Maintenance**:
   - Append-only, never overwrite
   - Update after EVERY subtask completion
   - Final Summary required before marking complete

3. ✅ **Test Integrity**:
   - NEVER modify test expectations to make tests pass
   - Fix implementation, not tests
   - Document any test changes with business justification

4. ✅ **Architecture Compliance**:
   - Validate against architecture docs
   - Follow naming conventions
   - Use approved technologies only

5. ✅ **API Contracts** (if multi-repo):
   - Request/response schemas must match exactly
   - Error handling for all contract error codes
   - Validate before marking complete

6. ✅ **COMPLETION REQUIREMENTS** (When all tasks done):

   **GATE 1**: Execute `dev-self-review.md`
   - Implementation gate ≥95%
   - Architecture compliance
   - API contract compliance
   - Test integrity
   - DoD critical items 100%

   **GATE 2**: Execute `dev-completion-steps.md` checklist
   - 25 items, 100% required
   - Update Dev Agent Record (7 fields)
   - Update Change Log
   - Update Status to "Review"
   - Output handoff message as FINAL action

   ⚠️ DO NOT SKIP GATE 2 EVEN IF GATE 1 PASSES
   ⚠️ Task is NOT complete until handoff message output

7. ✅ **Status Management**:
   - Only Dev can modify story in InProgress status
   - Must validate transitions via validate-agent-permission.md
   - Status = "Review" ONLY after both gates pass

8. ✅ **Handoff Protocol**:
   - Handoff message must be FINAL output
   - Command `*review {story_id}` must be LAST LINE
   - Nothing after handoff command

---

### Resumption Checklist

When you resume, verify:

- [ ] Read this Resumption Guide completely
- [ ] Understand current phase and subtask
- [ ] Review critical workflow rules above
- [ ] Understand what GATE 1 and GATE 2 are
- [ ] Remember: Task NOT complete until handoff output
- [ ] Check if approaching completion (need gates?)
- [ ] Load architecture documents if needed
- [ ] Review previous session's decisions

**Then proceed with next steps.**
```

### Rule Reload Pattern

**Pattern 1: Visual Attention Grabbing**

```
⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER ⚠️⚠️⚠️
```

Triple warning symbols → High attention

**Pattern 2: Explicit Acknowledgment Required**

```
Acknowledge: "Resuming from Phase X"
Confirm: "Re-loaded 8 critical workflow rules"
Confirm: "Understand GATE 1 and GATE 2 required at end"
```

Forces LLM to consciously reload rules

**Pattern 3: Gate Awareness Reinforcement**

```
**GATE 1**: Execute dev-self-review.md
**GATE 2**: Execute dev-completion-steps.md
⚠️ Task NOT complete until handoff output
```

Repeated in every Resumption Guide

---

## 🎯 Key Design Principles

### 1. External Memory

**Problem**: LLM working memory is limited and prioritizes recent context

**Solution**: Store rules in Dev Log (external file), reload on demand

### 2. Forced Reload

**Problem**: LLM won't spontaneously re-read task instructions mid-flow

**Solution**: Explicit instruction to read Resumption Guide and acknowledge rules

### 3. Repetition for Retention

**Problem**: Single mention of rules at task start is forgotten

**Solution**: Rules appear in Resumption Guide every session, repeated exposure

### 4. Visual Markers

**Problem**: LLM might skim Resumption Guide

**Solution**: ⚠️⚠️⚠️ warnings, bold, explicit section headers

### 5. Acknowledgment Verification

**Problem**: LLM might read but not internalize

**Solution**: Require explicit acknowledgment statements

---

## 📝 Files Modified/Created

### Created (1 file)

1. **tasks/utils/update-resumption-guide.md** (312 lines)
   - Utility for preserving rules between sessions
   - Generates standardized Resumption Guide
   - Includes 8 workflow rules
   - Includes GATE 1 and GATE 2 requirements
   - Includes handoff protocol
   - Includes resumption checklist

### Modified (3 files)

2. **tasks/implement-story.md**
   - Step 2 (Dev Log): Enhanced resume process (+28 lines)
     - Explicit rule reload instructions
     - Acknowledgment requirements
     - Resumption checklist verification
   - Step 3 (Implement): Added pause-point enforcement (+18 lines)
     - Call update-resumption-guide before ANY pause
     - List of when to call
     - Warning about rule retention

3. **agents/dev.src.yaml**
   - Added dependency: `utils/update-resumption-guide.md`

4. **agents/dev.yaml**
   - Compiled from .src.yaml

---

## 🧪 Testing Scenarios

### Test 1: Short Story (1-2 sessions)

**Expected**: Rules maintained, gates executed normally
**Reason**: No context decay in short stories

### Test 2: Medium Story (3-4 sessions)

**Expected**:

- Rules reloaded at each session start
- DEV acknowledges rule reload
- Gates executed at end
- Proper handoff

### Test 3: Long Story (6+ sessions)

**Critical test**:

**Session 1**:

- [ ] Rules loaded initially
- [ ] Resumption Guide updated before pause

**Session 3**:

- [ ] DEV reads Resumption Guide
- [ ] DEV acknowledges: "Re-loaded 8 rules"
- [ ] DEV continues with rules intact

**Session 6** (final):

- [ ] DEV still remembers gates
- [ ] Executes GATE 1
- [ ] Executes GATE 2
- [ ] Outputs handoff message

### Test 4: Complex Story with Blocking

**Scenario**: Story blocks mid-implementation, resumes later

**Expected**:

- [ ] Resumption Guide updated when blocked
- [ ] Rules preserved despite interruption
- [ ] On resume, rules reloaded
- [ ] Quality maintained

---

## 🔄 Integration with Existing Systems

### Complements Previous Fix

**Previous Fix** (Commit c7cc9d1):

- 2-gate system (GATE 1 + GATE 2)
- Completion steps checklist
- Prevents premature termination

**This Fix** (Current):

- Rule preservation between sessions
- Rule reload on resume
- Maintains rule awareness in long stories

**Together**:

```
Multi-session story:
  Session 1: Rules loaded → Preserved in RG
  Session 2: Rules reloaded → Preserved again
  ...
  Session N: Rules still fresh
            ↓
            GATE 1 (remembered)
            ↓
            GATE 2 (remembered)
            ↓
            Handoff (remembered)
```

### Synergy

**Layer 1**: Task file (initial rules)
**Layer 2**: Resumption Guide (preservation) ← NEW
**Layer 3**: Completion checklist (enforcement) ← Previous fix

All three layers protect workflow quality.

---

## 🎓 User Guidance

### For Users

**If DEV forgets rules mid-story**:

```
User: You seem to have forgotten the workflow rules.
      Please read the Resumption Guide in Dev Log
      and reload the 8 critical rules.

[DEV should then explicitly read and acknowledge rules]
```

**If DEV skips Resumption Guide update**:

```
User: Before you pause, update the Resumption Guide
      to preserve workflow rules for next session.

[DEV should execute update-resumption-guide.md]
```

### For DEV Agents

**Every time you resume**:

1. ✅ Read Resumption Guide FIRST
2. ✅ Locate "CRITICAL WORKFLOW RULES" section
3. ✅ Read all 8 rules
4. ✅ Acknowledge reload explicitly
5. ✅ Then continue implementation

**Every time you pause**:

1. ✅ Execute update-resumption-guide.md
2. ✅ Ensure rules are preserved
3. ✅ Then stop/pause

---

## 📊 Success Metrics

**Track after 2 weeks**:

### Primary Metrics

- [ ] Long stories (6+ sessions): Completion rate >95%
- [ ] Rule retention at session 6: >90%
- [ ] GATE 1 execution in long stories: >95%
- [ ] GATE 2 execution in long stories: >95%
- [ ] Proper handoff in long stories: >95%

### Secondary Metrics

- [ ] Resumption Guide update rate: >95%
- [ ] Rule reload acknowledgment rate: >90%
- [ ] User intervention needed: <10% (down from ~40%)

### Quality Indicators

- [ ] Dev Log quality consistent across sessions
- [ ] Test integrity maintained throughout
- [ ] Architecture compliance stable
- [ ] Status updates reliable

---

## 🎯 Conclusion

**Problem Addressed**: Context decay in multi-session stories causing rule forgetting

**Solution**: 3-layer protection system

1. Initial rule loading (task file)
2. Continuous rule preservation (Resumption Guide) ← NEW
3. Final rule enforcement (completion checklist)

**Key Innovations**:

- External memory (Dev Log stores rules)
- Forced reload (explicit on resume)
- Repetition (every session)
- Visual markers (triple warnings)
- Acknowledgment (conscious reload)

**Expected Impact**: 95% rule retention even in 10+ session stories

**Complements**: Previous completion enforcement fix (c7cc9d1)

**Together**: Comprehensive workflow quality protection for all story lengths
