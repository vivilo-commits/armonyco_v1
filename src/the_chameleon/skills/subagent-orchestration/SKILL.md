---
name: subagent-orchestration
description: Use when executing implementation plans with independent tasks. Orchestrates subagents with a two-stage review process (spec compliance then code quality).
triggers:
  - "Orchestrate..."
  - "Execute plan..."
  - "Run tasks..."
  - "Delegate to subagents..."
---

High-quality execution through "Controller" patterns and P.R.I.S.M.A. Phase 3 orchestration.

## P.R.I.S.M.A. Phase 3: Implementation (Architect)
- **Layer 1: Architecture (`architecture/`)**: Technical SOPs in Markdown.
- **Layer 2: Navigation**: Your reasoning layer. Route data between SOPs and Tools.
- **Layer 3: Tools (`tools/`)**: Atomic, testable Python scripts for deterministic execution.

**The Golden Rule**: If logic changes, update the SOP in `architecture/` before updating the code in `tools/`.

## The Controller Pattern
- **Role**: You are the Controller. You read the plan, extract tasks, and dispatch Subagents.
- **Isolation**: Fresh subagent per task to prevent context pollution.
- **Context Curation**: Provide the subagent exactly what they need (task text + relevant files).

## Two-Stage Review Process (MANDATORY)
After a subagent reports completion, you MUST perform two distinct reviews:

### Stage 1: Spec Compliance Review
- Does the code do EXACTLY what the task asked for?
- Is there missing functionality or extra, unrequested code?
- If ❌ → Dispatch subagent again to fix spec gaps.

### Stage 2: Code Quality Review
- Once spec is ✅, review for: Best Practices, TDD Rigor, Performance, Security.
- Reference `best-practices-enforcing` and `code-reviewing`.
- If ❌ → Dispatch subagent again to fix quality issues.

## Execution Workflow
1. Read/Extract ALL tasks from plan upfront.
2. For each task:
   - Dispatch implementer subagent.
   - Run **Spec Review**.
   - Run **Quality Review**.
   - Mark task complete in progress tracker.
3. Finish when all tasks are ✅.

## Self-Annealing (Phase 6: The Repair Loop)
When a subagent fails or an error occurs:
1. **Analyze**: Read stack trace. Do not guess.
2. **Patch**: Fix the Python script in `tools/`.
3. **Test**: Verify the fix works.
4. **Update Architecture**: Update the corresponding `.md` in `architecture/` with the learning (Phase 6 persistence).

## Red Flags
- Skipping any review stage.
- Starting quality review before spec compliance is confirmed.
- Executing complex logic directly in the LLM instead of building a deterministic `tools/` script.
- Letting a subagent read the entire plan.
