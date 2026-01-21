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
- **Robust Detection**: Never rely on a single boolean flag (like `human_escalation_triggered`) for critical state. Always check for metadata presence (status, priority, reason) as a fallback to catch data patterns from different automation sources (e.g., n8n). 

## Dashboard & KPI Logic
- **Consistency is King**: Ensure detection logic is identical across `api.ts` (event mapping), `utils.ts` (KPI cards), and specialized clients (e.g., `n8n-client.ts` for Growth metrics).
- **Case Sensitivity**: When filtering by status (e.g., 'Resolved'), always use `.toUpperCase()` or defensive normalization to prevent mismatches between database state and UI logic.

## Debugging Best Practices
- **Data First, Display Second**: When users report "missing data" in UI, ALWAYS verify data exists in the database first before debugging display/filtering logic. Query the database directly with date ranges and counts to establish ground truth.
- **Restrictive Filtering Trap**: Avoid strict `eq` filters on status fields (e.g., `eq: { status: 'OPEN' }`) for non-standardized data. Instead, use inclusive logic (e.g., `status !== 'RESOLVED'`) combined with metadata existence checks to ensure no valid records are hidden due to missing or non-standard status strings.
- **Mock Data Hygiene**: Test/mock data patterns (like `hist-*`, `test-*` prefixes) should be filtered at the query level OR deleted from production databases to prevent inflated counts.
- **Escalation Linkage Healing**: When metadata is sparse (e.g. execution 17816 with double-stringified or missing phone info), use `ai_output` message content to search `vivilo_whatsapp_history` for the session ID. This "Healing Engine" ensures 100% linkage accuracy despite external data variations.
- **Robust Parsing**: Always implement a parser that handles double-stringified JSON for `workflow_output` fields from n8n.
- **Session Deduplication**: When listing interventions, always group by `session_id`/`phone_clean` to avoid duplicate UI entries from multiple triggers in the same conversation.
- **Persistence First**: Prioritize the dedicated `escalations` table as the "Source of Truth" for status, while using `executions` only for discovery of new triggers.
- **Accurate KPIs**: For large historical tables (like `vivilo_whatsapp_history`), use exact count queries (`{ count: 'exact', head: true }`) for accuracy instead of relying on limited fetch arrays.

## UI Cleanup & Premium Styling
- **Redundant Components**: Remove deprecated features (like "Universal Engines") from control panels to reduce cognitive load and simplify the UI.
- **Layout Precision**: Ensure alignment across different sections of settings/profile pages. Use consistent padding and centering for action buttons (especially those with status feedback labels) to maintain a premium feel.
- **Micro-Copy Matters**: Be precise with labels and descriptions (e.g. "Opened At" vs "Reported At") to ensure consistency with industry standards.
