---
name: plan-writing
description: Create detailed implementation plans with bite-sized tasks (2-5 mins) and TDD focus. Use AFTER brainstorming and workspace setup.
triggers:
  - "Write a plan..."
  - "How do we implement..."
  - "Create a task list..."
---

# Plan Writing

## Strict Requirements
- **Bite-sized Tasks**: 2-5 minutes each.
- **TDD First**: Every task must include verification steps/tests.
- **Data-First Rule**: Coding/Planning only begins once the **JSON Data Schema** is confirmed in `gemini.md`.
- **Chef's Memory**: Before writing a new plan, search `src/the_chameleon/` for previous implementation plans to avoid repeating past errors (e.g., root clutter, hidden folder pathing).
- **A.N.T. Ready**: Plans must include tasks for updating SOPs and skills in `src/the_chameleon/` (P.R.I.S.M.A. Phase 3-6).
- **Exact Details**: Include absolute file paths and code snippets.

**Next Step**: Use [subagent-orchestration](file:///./subagent-orchestration/SKILL.md) to execute the plan.

## When to use this skill

- Have an approved design/spec
- About to implement a multi-step feature
- Need to break work into manageable tasks
- Before touching any code
- User says: "let's implement", "create a plan", "how should we build this"

## Core Principle

**Write plans assuming the engineer has zero context and questionable taste.**

Document everything they need:
- Which files to touch for each task
- Complete code (not "add validation")
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Workflow

### Phase 1: Announce and Prepare

```markdown
**I'm using the plan-writing skill to create the implementation plan.**

This will break the work into bite-sized tasks (2-5 minutes each) 
following Test-Driven Development principles.
```

### Phase 2: Task Granularity

**Each step is ONE action (2-5 minutes):**

❌ **BAD: Too large**
```
Task 1: Implement user authentication
```

✅ **GOOD: Bite-sized**
```
Task 1.1: Write failing test for login validation
Task 1.2: Run test to verify it fails
Task 1.3: Implement minimal login validation
Task 1.4: Run test to verify it passes
Task 1.5: Commit
```

**The RED-GREEN-REFACTOR cycle:**
1. Write failing test (RED)
2. Run to verify failure
3. Write minimal code (GREEN)
4. Run to verify pass
5. Refactor if needed
6. Commit

### Phase 3: Plan Document Structure

#### Header (Required)

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Prerequisites:**
- [ ] Design approved in `docs/plans/YYYY-MM-DD-<feature>-design.md`
- [ ] Development environment set up
- [ ] Tests passing on main branch

---
```

#### Task Structure

```markdown
## Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.spec.ts`

### Step 1: Write the failing test

Create `tests/path/to/test.spec.ts`:

\```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from '@/path/to/module';

describe('functionName', () => {
  it('should handle specific behavior', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
\```

### Step 2: Run test to verify it fails

\```bash
npm test tests/path/to/test.spec.ts
\```

**Expected output:**
```
FAIL tests/path/to/test.spec.ts
  ✕ should handle specific behavior
    ReferenceError: functionName is not defined
```

### Step 3: Write minimal implementation

Create `src/path/to/module.ts`:

\```typescript
export function functionName(input: InputType): OutputType {
  return expected; // Minimal implementation
}
\```

### Step 4: Run test to verify it passes

\```bash
npm test tests/path/to/test.spec.ts
\```

**Expected output:**
```
PASS tests/path/to/test.spec.ts
  ✓ should handle specific behavior
```

### Step 5: Commit

\```bash
git add tests/path/to/test.spec.ts src/path/to/module.ts
git commit -m "feat: add functionName with test"
\```

---
```

### Phase 4: Plan Quality Standards

#### Must Include:

✅ **Exact file paths** (not "create a file")
```
Create: `src/components/UserProfile/UserProfile.tsx`
Modify: `src/App.tsx:45-67`
```

✅ **Complete code** (not "add validation")
```typescript
// ✅ GOOD: Complete code
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ BAD: Vague instruction
// Add email validation
```

✅ **Exact commands** with expected output
```bash
# ✅ GOOD: Exact command + expected output
npm test tests/auth/login.spec.ts

Expected:
FAIL: ReferenceError: login is not defined

# ❌ BAD: Vague instruction
Run the tests
```

✅ **TDD cycle** for every feature
```
1. Write failing test
2. Verify it fails
3. Write minimal code
4. Verify it passes
5. Commit
```

#### Principles to Apply:

**DRY (Don't Repeat Yourself):**
```
// If you see duplication in the plan:
Task 3.1: Extract shared validation logic
Task 3.2: Update both components to use shared logic
```

**YAGNI (You Aren't Gonna Need It):**
```
// Remove features not in the approved design:
❌ Task 5: Add user roles and permissions
✅ Focus only on approved features
```

**Frequent Commits:**
```
// After each passing test:
git commit -m "feat: add specific feature"
```

### Phase 5: Save Plan

```bash
# Save to docs/plans with date
cat > docs/plans/$(date +%Y-%m-%d)-<feature-name>-implementation.md << 'EOF'
[Complete plan content]
EOF

# Commit the plan
git add docs/plans/
git commit -m "docs: add <feature-name> implementation plan"
```

### Phase 6: Execution Handoff

After saving the plan:

```markdown
**Plan complete and saved to `src/the_chameleon/plans/YYYY-MM-DD-<feature>-implementation.md`.**

Ready to execute? I'll follow the plan step-by-step using Test-Driven Development.

Shall we begin implementation?
```

If yes → Use `test-driven-developing` skill to execute the plan

## Example: User Login Feature

### Complete Plan

```markdown
# User Login Implementation Plan

**Goal:** Implement email/password login with validation

**Architecture:** React component with form validation, API call to /auth/login, JWT token storage

**Tech Stack:** React, TypeScript, Vitest, MSW (for API mocking)

**Prerequisites:**
- [x] Design approved in `docs/plans/2026-01-19-login-design.md`
- [x] Development environment set up
- [x] Tests passing on main branch

---

## Task 1: Email Validation

**Files:**
- Create: `src/utils/validation.ts`
- Create: `tests/utils/validation.spec.ts`

### Step 1: Write the failing test

Create `tests/utils/validation.spec.ts`:

\```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/utils/validation';

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });

  it('should reject empty email', () => {
    expect(validateEmail('')).toBe(false);
  });
});
\```

### Step 2: Run test to verify it fails

\```bash
npm test tests/utils/validation.spec.ts
\```

**Expected output:**
```
FAIL tests/utils/validation.spec.ts
  ✕ should accept valid email
    ReferenceError: validateEmail is not defined
```

### Step 3: Write minimal implementation

Create `src/utils/validation.ts`:

\```typescript
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
\```

### Step 4: Run test to verify it passes

\```bash
npm test tests/utils/validation.spec.ts
\```

**Expected output:**
```
PASS tests/utils/validation.spec.ts
  ✓ should accept valid email
  ✓ should reject invalid email
  ✓ should reject empty email
```

### Step 5: Commit

\```bash
git add tests/utils/validation.spec.ts src/utils/validation.ts
git commit -m "feat: add email validation with tests"
\```

---

## Task 2: Login Form Component

**Files:**
- Create: `src/components/LoginForm/LoginForm.tsx`
- Create: `tests/components/LoginForm.spec.tsx`

### Step 1: Write the failing test

Create `tests/components/LoginForm.spec.tsx`:

\```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/LoginForm/LoginForm';

describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    render(<LoginForm onSubmit={() => {}} />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should call onSubmit with form data', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
\```

### Step 2: Run test to verify it fails

\```bash
npm test tests/components/LoginForm.spec.tsx
\```

**Expected output:**
```
FAIL tests/components/LoginForm.spec.tsx
  ✕ should render email and password inputs
    Error: LoginForm is not defined
```

### Step 3: Write minimal implementation

Create `src/components/LoginForm/LoginForm.tsx`:

\```typescript
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
\```

### Step 4: Run test to verify it passes

\```bash
npm test tests/components/LoginForm.spec.tsx
\```

**Expected output:**
```
PASS tests/components/LoginForm.spec.tsx
  ✓ should render email and password inputs
  ✓ should call onSubmit with form data
```

### Step 5: Commit

\```bash
git add tests/components/LoginForm.spec.tsx src/components/LoginForm/
git commit -m "feat: add LoginForm component with tests"
\```

---

[Continue with remaining tasks...]
```

## Common Mistakes to Avoid

### Mistake 1: Vague Instructions

❌ **BAD:**
```
Task 1: Add validation
Task 2: Create the component
Task 3: Test it
```

✅ **GOOD:**
```
Task 1.1: Write failing test for email validation
Task 1.2: Run test to verify it fails
Task 1.3: Implement validateEmail function
Task 1.4: Run test to verify it passes
Task 1.5: Commit
```

### Mistake 2: Missing File Paths

❌ **BAD:**
```
Create a validation utility
```

✅ **GOOD:**
```
Create: `src/utils/validation.ts`
Test: `tests/utils/validation.spec.ts`
```

### Mistake 3: Incomplete Code

❌ **BAD:**
```
Add email validation logic
```

✅ **GOOD:**
```typescript
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Mistake 4: No Expected Output

❌ **BAD:**
```
Run the tests
```

✅ **GOOD:**
```bash
npm test tests/utils/validation.spec.ts

Expected output:
FAIL tests/utils/validation.spec.ts
  ✕ should accept valid email
    ReferenceError: validateEmail is not defined
```

### Mistake 5: Skipping TDD Cycle

❌ **BAD:**
```
Task 1: Implement login function
```

✅ **GOOD:**
```
Task 1.1: Write failing test for login
Task 1.2: Verify test fails
Task 1.3: Implement minimal login
Task 1.4: Verify test passes
Task 1.5: Commit
```

## Plan Quality Checklist

Before saving the plan:

- [ ] Every task has exact file paths
- [ ] Every task includes complete code (not "add X")
- [ ] Every task follows TDD cycle (test → fail → code → pass → commit)
- [ ] Commands include expected output
- [ ] Tasks are bite-sized (2-5 minutes each)
- [ ] DRY principle applied (no duplication)
- [ ] YAGNI applied (no unnecessary features)
- [ ] Frequent commits (after each passing test)
- [ ] Plan saved to `docs/plans/YYYY-MM-DD-<feature>-implementation.md`
- [ ] Plan committed to git

## Resources

- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

## Next Steps

After plan complete:
- Use `test-driven-developing` skill to execute the plan
- Use `code-reviewing` skill between tasks
- Use `debugging-errors` skill if issues arise
