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

## Principle 15: Institutional High-Fidelity Output
1. **European Currency Parsing**: Standardized logic for `€ 1.234,56` patterns.
   - Dots are thousand separators, commas are decimals.
   - Remove currency symbols and whitespace before parsing.
2. **Print Media Visibility**:
   - When isolating a modal for printing (hiding `body`), use `#target, #target * { visibility: visible }` to ensure all nested components inherit visibility correctly.
   - Use `-webkit-print-color-adjust: exact` to force rendering of gradients and dark backgrounds in PDFs.

## Principle 17: UI Cleanliness & Institutional Shield
1. **Defensive Normalization**:
   - When filtering by status or strings, always use `.toUpperCase()` or defensive normalization to prevent mismatches between DB state and UI logic.
2. **Aggressive Sanitization**:
   - Strip LLM "reasoning" indicators (e.g., "time: ", "plan: ", "Think:") from operator-facing contexts.
   - Maintain an institutional, non-technical appearance at all times.
