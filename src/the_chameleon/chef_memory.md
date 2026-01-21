# 👨‍🍳 Chef's Memory: Structural Optimization (2026-01-21)

This log captures specific project "recipes" and lessons to ensure zero-mistake repetition in future tasks.

## 🚀 Triumphs (Do This Again)
- **SRC-Isolation**: Moving `.env`, `.vercel`, and `the_chameleon` to `src/` creates a cleaner, more institutional root.
- **Explicit outDir**: Instead of symlinks, configure `vite.config.ts` and `vercel.json` to explicitly point to `src/dist`.
- **Flat Architecture**: Keeping the architecture folder (`the_chameleon`) visible and shallow (no nested `.agent/architecture`) avoids agent confusion and user "folder-fatigue".
- **Hash-First Navigation**: Syncing the app view with `#` in the URL survives refreshes and provides a premium, stateful experience.

## ⚠️ Lessons (Avoid These Pitfalls)
- **Root Symlinks**: Avoid creating symlinks (like `ln -s src/.vercel .vercel`) in the root. They clutter the UI and can lead to pathing errors in some CLI contexts. Configure the tools directly instead.
- **Hidden Folders**: Do not use `.` prefixes for central folders like `.the_chameleon` if the user wants them accessible and visible. Use `the_chameleon/`.
- **Environment Context**: When moving `.env` to a subfolder, **always** update the build tool (e.g., `vite.config.ts` -> `envDir: 'src'`) immediately to prevent logic breakage.
- **Skill Recovery**: If folders seem "missing" after a move, check parent directories or `git status` before assuming deletion.

---
*Capture every structural shift here to supercharge the Chameleon's evolution.*
- **Optimization Hub**: Standardized currency utilities in `utils.ts` and re-exported from specialized APIs to ensure 100% logic consistency across Dashboard/Growth pages.

## Multi-Tenancy Hardening
- **Trigger Security**: Database triggers (e.g., `upsert_escalation_from_execution`) MUST always filter by `organization_id` when performing lookups to prevent cross-tenant collisions.
- **n8n plumbing**: Automation hubs often omit tenant context when interacting via generic IDs (like `code`). Always verify `organization_id` in both the sender and receiver workflows.

## Data Unification
- **Hybrid Sources**: When transitioning schemas (e.g., from `executions` to `escalations`), use a unified API accessor that merges both sources in memory and provides a consistent interface to the frontend.

## Debugging Best Practices
- **Data First, Display Second**: When users report "missing data" in UI, ALWAYS verify data exists in the database first before debugging display/filtering logic. Query the database directly with date ranges and counts to establish ground truth.
- **Mock Data Hygiene**: Test/mock data patterns (like `hist-*`, `test-*` prefixes) should be filtered at the query level OR deleted from production databases to prevent inflated counts.
