---
name: using-git-worktrees
description: The "Isolation Superpower". Use when starting feature work that needs isolation or before executing plans. Creates isolated git worktrees with smart directory selection and safety verification.
triggers:
  - "Create workspace..."
  - "Isolated branch..."
  - "New worktree..."
  - "Split repo..."
---

# Using Git Worktrees

Isolated workspaces sharing the same repository. Work on multiple branches without switching.

## Priority Order for Worktree Directory
1. **Existing Directories**: Use `.worktrees/` (preferred) or `worktrees/` if they exist.
2. **CLAUDE.md**: Check if a preference is documented.
3. **User Input**: Ask if neither exists.

## Quality & Safety Gates
- **MUST** verify directory is ignored by git (`git check-ignore`). If not, add to `.gitignore` and commit immediately.
- **MUST** run project setup (`npm install`, etc.) in the new worktree.
- **MUST** verify clean test baseline before starting work.

## Implementation Steps
1. Detect project name.
2. Create worktree: `git worktree add <path> -b <branch-name>`.
3. CD into worktree.
4. Run auto-detected setup (npm, cargo, pip, etc.).
5. Run tests. If they fail → report baseline issue. If they pass → ready to code.

## Red Flags
- Skipping ignore verification (pollutes git status).
- Proceeding with failing baseline tests.
- Assuming directory location without checking conventions.
