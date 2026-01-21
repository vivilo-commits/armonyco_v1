---
name: finishing-development
description: Final checks, cleanup, and deployment. Orchestrates Phase 5 (Trigger).
---

# Finishing Development (Phase 5: Manifestation)

## P.R.I.S.M.A. Phase 5 (Manifestation) Workflow
1. **Cloud Transfer**: Move finalized logic from the local `tools/` and `architecture/` to the production cloud environment.
2. **Automation**: Set up and verify execution triggers (Cron jobs, Webhooks, or Listeners).
3. **Maintenance Log**: Update the **Maintenance Log** in `gemini.md` with final deployment details.
4. **Evolution (Phase 6)**: Invoke `skill-self-regenerating` to capture the final project state as a new superpower baseline.
4. **Cleanup & SRC-Optimization**: 
   - Ensure NO stubs, symlinks, or legacy `.env` files remain in the project root.
   - Verify build artifacts are isolated in `src/dist`.
   - Purge any local `.tmp` or `.agent` stubs; use the unified `src/the_chameleon` only.
5. **Final Review**: Perform a last walkthrough of the stylized result to ensure it meets the North Star goal.

**Rule**: A project is only "Complete" when the payload is in its final cloud destination and the Maintenance Log is updated.
