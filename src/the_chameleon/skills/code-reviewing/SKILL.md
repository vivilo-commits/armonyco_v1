---
name: code-reviewing
description: Performs comprehensive code reviews with focus on quality, security, performance, and best practices. Use AFTER TDD or implementation.
triggers:
  - "Review this..."
  - "Check the code..."
  - "Verify quality..."
---

# Code Reviewing

## Quality Gates
- **Discipline**: Reference `best-practices-enforcing`.
- **Methodology**: Reference `test-driven-developing`.
- **Target**: High readability, 0 linter errors, and robust test coverage.

**Next Step**: Once approved, use [finishing-development](file:///./finishing-development/SKILL.md) to initiate **Phase 5: Manifestation** and final **Phase 6: Annealing**.

## When to use this skill
- User requests a code review or quality audit
- User mentions PR review, pull request analysis
- User asks to check code quality, best practices
- User wants security or performance analysis
- User mentions refactoring opportunities

## Workflow

### 1. Scope Definition
- [ ] Identify files/directories to review
- [ ] Determine review depth (quick scan vs deep analysis)
- [ ] Clarify specific concerns (security, performance, style)

### 2. Multi-Dimensional Analysis
Run these checks in parallel:

#### Code Quality
- **Readability**: Clear naming, proper abstraction levels
- **Maintainability**: DRY principle, single responsibility
- **Complexity**: Cyclomatic complexity, nesting depth
- **Consistency**: Style guide adherence, patterns

#### Security
- **Input Validation**: SQL injection, XSS, CSRF risks
- **Authentication**: Proper auth checks, session handling
- **Secrets**: No hardcoded credentials or API keys
- **Dependencies**: Known vulnerabilities (`npm audit`, `pip check`)

#### Performance
- **Algorithmic**: O(n²) loops, unnecessary iterations
- **Memory**: Leaks, large allocations, caching opportunities
- **I/O**: N+1 queries, blocking operations
- **Bundle Size**: Unused imports, tree-shaking opportunities

#### Architecture
- **Separation of Concerns**: Business logic vs presentation
- **Error Handling**: Proper try-catch, error boundaries
- **Type Safety**: TypeScript strictness, type coverage
- **Testing**: Test coverage, edge cases

### 3. Prioritized Reporting
Categorize findings:
- **P0 (Critical)**: Security vulnerabilities, data loss risks
- **P1 (High)**: Performance bottlenecks, major bugs
- **P2 (Medium)**: Code smells, maintainability issues
- **P3 (Low)**: Style inconsistencies, minor optimizations

### 4. Actionable Recommendations
For each issue:
1. **What**: Describe the problem
2. **Why**: Explain the impact
3. **How**: Provide specific fix with code example
4. **Where**: Link to exact file and line numbers

## Instructions

### Step 1: Initial Scan
```bash
# Run linters and type checkers
npm run lint 2>&1 | tee lint-report.txt
npm run typecheck 2>&1 | tee type-report.txt

# Check for security issues
npm audit --json > security-audit.json

# Analyze bundle size (if applicable)
npx vite-bundle-visualizer
```

### Step 2: Deep Code Analysis
Use `view_file_outline` to understand structure, then `view_code_item` for detailed inspection.

**Focus areas:**
- Functions > 50 lines (complexity risk)
- Files > 500 lines (refactoring candidate)
- Deeply nested code (> 4 levels)
- Repeated patterns (DRY violations)

### Step 3: Pattern Detection
Search for anti-patterns:
```bash
# Find TODO/FIXME comments
rg "TODO|FIXME|HACK|XXX" --json

# Find console.log in production code
rg "console\.(log|debug|info)" --type ts --type tsx

# Find any/unknown types (TypeScript)
rg ": (any|unknown)" --type ts

# Find hardcoded secrets patterns
rg "(api_key|password|secret|token)\s*=\s*['\"]" --ignore-case
```

### Step 4: Generate Report
Create a markdown report with:
1. **Executive Summary**: High-level findings count
2. **Critical Issues**: P0/P1 with immediate action items
3. **Detailed Findings**: Organized by category
4. **Metrics**: Code coverage, type safety %, bundle size
5. **Recommendations**: Prioritized improvement roadmap

## Output Format

```markdown
# Code Review Report

## Summary
- **Files Reviewed**: X
- **Critical Issues**: Y
- **Code Quality Score**: Z/10

## Critical Findings (P0/P1)
### [Category] Issue Title
**Severity**: P0  
**File**: [filename.ts](file:///path/to/file.ts#L123-L145)  
**Impact**: [Describe risk]  
**Fix**:
\```typescript
// Recommended solution
\```

## Recommendations
1. [Priority action]
2. [Next steps]
```

## Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

## Validation Loop
Before finalizing:
- [ ] All P0 issues have concrete fix examples
- [ ] File links are absolute paths with line numbers
- [ ] Recommendations are prioritized and actionable
- [ ] Report is concise (< 500 lines for typical review)
