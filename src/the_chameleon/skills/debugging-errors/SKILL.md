---
name: debugging-errors
description: Systematically debugs errors and issues using proven debugging techniques. Use when anything is "not working".
triggers:
  - "Why is it broken..."
  - "Fix the error..."
  - "Not working..."
  - "Debug..."
---

# Debugging Errors

## The Four Phases
1. **Root Cause Investigation**: Reproduce and trace the issue.
2. **Pattern Analysis**: Compare against working examples.
3. **Hypothesis**: Form a theory and test minimally.
4. **Implementation**: Fix utilizing robust patterns.

### Phase 4: Implementation (P.R.I.S.M.A. Phase 3)
Apply robust patterns to ensure the fix is resilient and follows the A.N.T. architecture. 
**Critical**: Log the root cause and solution in `src/the_chameleon/chef_memory.md` for **Phase 6: Annealing** (Zero-Mistake Rule).

#### Resilience Patterns
- **Custom Error Classes**: Create project-specific hierarchies.
- **Result Types**: Return explicit success/failure objects.
- **Retry with Backoff**: For transient network/API failures.
- **Circuit Breaker**: Prevents cascading failures.
- **Graceful Degradation**: Feed fallback data if primary fails.

**Next Step**: Use [code-reviewing](file:///./code-reviewing/SKILL.md) to verify the fix.
