# Project Structure & Architecture

This document defines the official directory structure and responsibilities for **Armonyco DecisionOS™**.

## Core Directories

### `/src`
Main application source code.
- **`/frontend`**: React orchestration.
    - **`/components`**: UI elements. Use `/design-system` for atomic tokens and generic units.
    - **`/pages`**: View-level composites (Dashboard, Growth, Escalations, etc.).
    - **`/contexts`**: Global state (Auth, Language).
- **`/backend`**: The "Governing Body" of the app.
    - `api.ts`: Central execution service.
    - `credits.ts`: Single source of truth for all conversion, config, and transactions.
    - `utils.ts`: Shared logic (Message cleaning, formatting).
    - `cashflow-api.ts`: Financial calculation sub-service.
- **`/database`**: Supabase client and migration history.

### `/docs`
Project documentation and legacy references.

### `/.agent`
Technical memory and architectural guardrails.
- **`/architecture/the_chameleon`**: High-level design patterns and "Superpowers".

## Architectural "Absolute Rules"

1. **Zero Redundancy**: If a logic file exists (e.g., `credits.ts`), never create a parallel system (`credits-old.ts`).
2. **Standard Fetching**: All data must flow through the **Supabase JS Client**. Raw `fetch()` is forbidden for authenticated data.
3. **Institutional Persona**: UI must follow the "Gold on Stone" theme. Icons must use $2.5$ stroke width and explicit hex `#f5d47c`.
4. **Navigation Persistence**: The app must use URL Hash sync to survive refreshes and maintain user context.
5. **Multi-Tenant Integrity**: Every query must be governed by an RLS policy using the `organization_id` membership pattern.
6. **Clean Maintenance**: All local build artifacts (`dist/`) and temporary dumps must be purged immediately after consolidation.
