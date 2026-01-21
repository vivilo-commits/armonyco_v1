---
name: project-brainstorming
description: Socratic design-first approach. Use BEFORE any creative work, feature addition, or behavior modification.
triggers:
  - "I want to add..."
  - "How should I..."
  - "Design a..."
  - "Brainstorm..."
---

# Project Brainstorming

## The Socratic Flow
1. **Understand Context**: Ask questions ONE AT A TIME.
2. **Explore Approaches**: Present 2-3 options with trade-offs.
3. **Short Segments**: Validate designs in small, digestible blocks.

**Next Step**: Once design is approved, use [using-git-worktrees](file:///./using-git-worktrees/SKILL.md) to set up an isolated workspace.

## When to use this skill

- **BEFORE writing any code** for new features
- Starting a new project or component
- User has an idea but unclear requirements
- Need to explore different approaches
- User mentions: design, plan, spec, requirements, "how should I..."

## Core Principle

**Never jump straight to code. Understand first (Discovery), align data (Schema), design second, implement third.**

**The P.R.I.S.M.A. Planning Rule:** Define the **JSON Data Schema** (Input/Output shapes) in `gemini.md` BEFORE coding begins.

Bad: "I'll build a user dashboard" → starts coding  
Good: "I'll build a user dashboard" → asks questions → explores approaches → validates design → then codes

## Workflow

### Phase 1: Understanding the Idea

#### 1. Check Current Context

```bash
# Understand the project first
ls -la
cat README.md
git log --oneline -10
cat package.json  # or requirements.txt, etc.
```

**Understand:**
- What exists already?
- What's the tech stack?
- What patterns are being used?
- Recent changes/direction

#### 2. Ask Questions (One at a Time)

**CRITICAL: One question per message. Wait for answer before next question.**

**Question Types:**

**P.R.I.S.M.A. Discovery (North Star Questions):**
- **North Star:** What is the singular desired outcome?
- **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
- **Source of Truth:** Where does the primary data live?
- **Payload Delivery:** How and where should the final result be delivered?
- **Behavioral Rules:** How should the system "act"? (Tone, logic constraints, "Do Not" rules).

**Constraint Questions:**
- "Are there performance requirements?"
- "Does this need to work offline?"
- "Any security concerns?"
- "Browser/device support needed?"

**Success Criteria Questions:**
- "How will we know this works?"
- "What does 'done' look like?"
- "What metrics matter?"

**Multiple Choice When Possible:**
```
"For data storage, which approach fits better?

A) Local state (simple, fast, lost on refresh)
B) LocalStorage (persists, limited to 5MB)
C) Backend API (scalable, requires network)

What's your preference?"
```

### Phase 2: Exploring Approaches

#### Present 2-3 Options with Trade-offs

**Format:**
```markdown
I see three approaches:

**Option A: [Name]** (Recommended)
- Pros: [List benefits]
- Cons: [List drawbacks]
- Effort: [Time estimate]
- Why I recommend: [Reasoning]

**Option B: [Name]**
- Pros: [List benefits]
- Cons: [List drawbacks]
- Effort: [Time estimate]

**Option C: [Name]**
- Pros: [List benefits]
- Cons: [List drawbacks]
- Effort: [Time estimate]

Which approach resonates with you?
```

**Lead with your recommendation** and explain why.

### Phase 3: Presenting the Design

#### Break into Digestible Sections (200-300 words each)

**Section 1: Architecture Overview**
```markdown
## Architecture

[High-level approach in 200-300 words]

**Does this direction look right so far?**
```

**Wait for confirmation before continuing.**

**Section 2: Components/Modules**
```markdown
## Components

[Component breakdown in 200-300 words]

**Does this structure make sense?**
```

**Section 3: Data Flow**
```markdown
## Data Flow

[How data moves through the system]

**Is this flow clear?**
```

**Section 4: Error Handling**
```markdown
## Error Handling

[How errors are caught and handled]

**Any concerns with this approach?**
```

**Section 5: Testing Strategy**
```markdown
## Testing

[What will be tested and how]

**Does this testing plan cover your concerns?**
```

#### Be Ready to Backtrack

If user says "actually, I'm not sure about X":
- Go back to that section
- Ask clarifying questions
- Explore alternatives
- Re-present with changes

### Phase 4: Documentation

#### Save Validated Design

```bash
# Create docs directory if needed
mkdir -p docs/plans

# Save design with date
cat > docs/plans/$(date +%Y-%m-%d)-<feature-name>-design.md << 'EOF'
# <Feature Name> Design

## Goal
[One sentence]

## Architecture
[Validated architecture section]

## Components
[Validated components section]

## Data Flow
[Validated data flow section]

## Error Handling
[Validated error handling section]

## Testing Strategy
[Validated testing section]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

---

**Approved by:** [User name]
**Date:** $(date +%Y-%m-%d)
EOF

# Commit the design
git add docs/plans/
git commit -m "docs: add <feature-name> design"
```

### Phase 5: Implementation Handoff

After design is validated and saved:

```markdown
**Design complete and saved to `docs/plans/YYYY-MM-DD-<feature>-design.md`.**

Ready to move to implementation? I'll:

1. Create implementation plan (detailed tasks with TDD)
2. Set up isolated workspace (git worktree if needed)
3. Begin implementation following the plan

Shall we proceed?
```

If yes → Use `plan-writing` skill to create detailed implementation plan

## Key Principles

### 1. One Question at a Time

❌ **BAD:**
```
"What's the user flow? What data do you need? 
How should errors be handled? What's the performance requirement?"
```

✅ **GOOD:**
```
"What's the main user flow for this feature?"
[Wait for answer]
"What data needs to be stored for this flow?"
[Wait for answer]
```

### 2. Multiple Choice Preferred

❌ **BAD:**
```
"How should we handle authentication?"
```

✅ **GOOD:**
```
"For authentication, which approach fits your needs?

A) JWT tokens (stateless, scales well)
B) Session cookies (simpler, server-side state)
C) OAuth (third-party login)

What's your preference?"
```

### 3. YAGNI Ruthlessly

Remove unnecessary features from all designs:

❌ **BAD:**
```
"We'll add user roles, permissions, audit logs, 
export to PDF, email notifications..."
```

✅ **GOOD:**
```
"For MVP, we need:
- User login
- Basic dashboard
- Data display

We can add roles/permissions later if needed. 
Does this minimal scope work?"
```

### 4. Explore Alternatives

Always propose 2-3 approaches before settling:

❌ **BAD:**
```
"We'll use Redux for state management."
```

✅ **GOOD:**
```
"For state management, three options:

A) React Context (simple, built-in)
B) Redux (powerful, more boilerplate)
C) Zustand (lightweight, modern)

Given your app size, I recommend A. Thoughts?"
```

### 5. Incremental Validation

Present design in sections, validate each:

❌ **BAD:**
```
[Presents 10-page design document]
"Does this all look good?"
```

✅ **GOOD:**
```
[Presents architecture section]
"Does this direction look right so far?"
[Wait for confirmation]
[Presents components section]
"Does this structure make sense?"
[Wait for confirmation]
```

### 6. Be Flexible

Go back and clarify when something doesn't make sense:

```
User: "Actually, I'm not sure about the database choice"

Agent: "No problem! Let's revisit that. 
What are your main concerns with the proposed approach?"
[Explores alternatives]
[Re-presents database section with changes]
```

## Example: E-commerce Product Page

### Phase 1: Understanding

**Agent:** "What's the main goal of this product page?"

**User:** "Show product details and let users add to cart"

**Agent:** "For the product data, which source?

A) Static JSON (fast, no backend needed)
B) REST API (dynamic, requires backend)
C) GraphQL (flexible queries, more setup)

What fits your setup?"

**User:** "REST API, we have a backend"

**Agent:** "Should the page work offline or require network?"

**User:** "Network is fine"

### Phase 2: Exploring Approaches

**Agent:**
```
I see two main approaches:

**Option A: Client-Side Rendering** (Recommended)
- Pros: Fast navigation, rich interactions
- Cons: SEO requires extra work
- Effort: 2-3 days
- Why: Your backend is ready, CSR is simpler

**Option B: Server-Side Rendering**
- Pros: Better SEO, faster first paint
- Cons: More complex setup, slower navigation
- Effort: 4-5 days

Given you have an API ready, Option A fits better. Thoughts?
```

**User:** "Let's go with A"

### Phase 3: Presenting Design

**Agent:**
```markdown
## Architecture

Single-page component that fetches product data on mount, 
displays loading state while fetching, shows product details 
when loaded, and provides "Add to Cart" button that updates 
cart state.

**Does this direction look right so far?**
```

**User:** "Yes"

**Agent:**
```markdown
## Components

- ProductPage (container)
  - ProductImage (displays main image + thumbnails)
  - ProductInfo (title, price, description)
  - AddToCartButton (handles cart addition)
  - LoadingSpinner (shown while fetching)
  - ErrorMessage (shown if fetch fails)

**Does this structure make sense?**
```

**User:** "Perfect"

[Continues with Data Flow, Error Handling, Testing sections]

### Phase 4: Documentation

```bash
cat > docs/plans/2026-01-19-product-page-design.md << 'EOF'
# Product Page Design

## Goal
Display product details and enable adding to cart

## Architecture
Client-side rendered React component fetching from REST API

## Components
- ProductPage (container)
- ProductImage (image display)
- ProductInfo (details)
- AddToCartButton (cart interaction)
- LoadingSpinner (loading state)
- ErrorMessage (error state)

## Data Flow
1. Component mounts
2. Fetch product from /api/products/:id
3. Show loading spinner
4. On success: display product
5. On error: show error message
6. Add to cart: POST /api/cart with product ID

## Error Handling
- Network errors: Show "Failed to load product" with retry button
- 404: Show "Product not found"
- Cart errors: Show toast notification

## Testing Strategy
- Unit: Component rendering with mock data
- Integration: API calls with MSW
- E2E: Full user flow with Playwright

## Success Criteria
- [ ] Product displays correctly
- [ ] Add to cart works
- [ ] Loading/error states shown
- [ ] Tests pass
EOF

git add docs/plans/
git commit -m "docs: add product page design"
```

### Phase 5: Handoff

**Agent:**
```
Design complete and saved to `docs/plans/2026-01-19-product-page-design.md`.

Ready to move to implementation? I'll:
1. Create detailed implementation plan with TDD
2. Break into bite-sized tasks
3. Begin implementation

Shall we proceed?
```

## Common Mistakes to Avoid

### Mistake 1: Jumping to Code

❌ **BAD:**
```
User: "I need a dashboard"
Agent: [Starts writing React components]
```

✅ **GOOD:**
```
User: "I need a dashboard"
Agent: "What's the main purpose of this dashboard? 
What data should it display?"
```

### Mistake 2: Asking Too Many Questions at Once

❌ **BAD:**
```
"What's the user flow? What data do you need? 
How should it look? What's the performance requirement? 
Should it work offline?"
```

✅ **GOOD:**
```
"What's the main user flow for this feature?"
[Wait for answer, then ask next question]
```

### Mistake 3: Presenting Entire Design at Once

❌ **BAD:**
```
[Shows 10-page design document]
"Does this all look good?"
```

✅ **GOOD:**
```
[Shows architecture section]
"Does this direction look right so far?"
[Wait for confirmation before showing next section]
```

### Mistake 4: Not Exploring Alternatives

❌ **BAD:**
```
"We'll use MongoDB for the database."
```

✅ **GOOD:**
```
"For the database, three options:
A) PostgreSQL (relational, ACID)
B) MongoDB (document, flexible schema)
C) SQLite (embedded, simple)

Given your data structure, I recommend A. Thoughts?"
```

## Validation Checklist

Before moving to implementation:

- [ ] Asked questions one at a time
- [ ] Explored 2-3 approaches with trade-offs
- [ ] Presented design in sections (200-300 words each)
- [ ] Validated each section before continuing
- [ ] Applied YAGNI (removed unnecessary features)
- [ ] Saved design to `docs/plans/YYYY-MM-DD-<feature>-design.md`
- [ ] Committed design document to git
- [ ] User explicitly approved the design

## Resources

- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
- [Socratic Method](https://en.wikipedia.org/wiki/Socratic_method)
- [Design Thinking](https://www.interaction-design.org/literature/topics/design-thinking)

## Next Steps

After brainstorming complete:
- Use `plan-writing` skill to create detailed implementation plan
- Use `test-driven-developing` skill during implementation
- Use `code-reviewing` skill between tasks
