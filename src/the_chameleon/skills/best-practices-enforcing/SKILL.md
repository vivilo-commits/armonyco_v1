---
name: best-practices-enforcing
description: Enforces coding best practices including simplicity, DRY, and refactoring.
triggers:
  - "Apply best practices..."
  - "Refactor..."
  - "Clean up code..."
---

# Best Practices Enforcing

## Principle 13: Systematic Refactoring
**Refactoring = Improving code structure WITHOUT changing behavior.**

### Workflow
1. **Assess**: Identify smells (Long Method, duplication).
2. **Execute**: 
   - Extract Function/Variable.
   - Guard Clauses (Early returns).
   - Declarative Loops (map/filter).
3. **Validate**: Run tests after EVERY small change.

## Principle 14: Self-Annealing (Phase 6: The Repair Loop)
1. **Analyze**: Read the stack trace. Do not guess.
2. **Patch**: Fix the script.
3. **Test**: Verify the fix works.
4. **Update Architecture**: Update `src/the_chameleon/chef_memory.md` so the error never repeats.

**Rule**: If project logic changes, update architecture before updating the code.
