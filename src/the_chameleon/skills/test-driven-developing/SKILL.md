---
name: test-driven-developing
description: Enforces the RED-GREEN-REFACTOR cycle.
triggers:
  - "Implement..."
  - "Add feature..."
  - "Fix bug..."
---

# Test-Driven Developing

1. **RED**: Failing test.
2. **GREEN**: Minimal pass.
3. **REFACTOR**: Cleanup while green.

## P.R.I.S.M.A. Testing Rules
- **Handshake Verification**: Tests must verify that `tools/` scripts respond correctly to external Reach services (Phase 2).
- **Deterministic Output**: Every Tool must have a corresponding test that validates its JSON Data Payload shape.

**Rule**: No code before tests. All business logic must be tested via deterministic scripts in `tools/`.
