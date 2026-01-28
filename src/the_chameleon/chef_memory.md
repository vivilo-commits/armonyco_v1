# Chef's Memory - Armonyco V1 Elite Consolidation

This document serves as the institutional memory for the Armonyco project. It records architectural decisions, resolved technical debt, and critical logic patterns that must be maintained across future development phases.

## Core Architectural Guardrails

### 1. Data Governance & Sync Logic
- **Authorization Recovery**: If `organizationId` is missing in the API layer, the system must perform an autonomous recovery from the authenticated session's membership. This is handled centrally in `ApiService.ensureOrganizationId()`.
- **Sync Reliability**: Cross-page data synchronization follows a "Sync-on-Demand" pattern. The `syncExecutions` method ensures the local stream is historically accurate before computing current KPIs.
- **Cache Policy**: Dashboard and Growth data use a 5-second in-memory TTL cache to reduce Supabase load while maintaining near-real-time fidelity.

### 2. Institutional Logic Refinements
- **Escalation Counting**: Metrics for "Escalations Avoided" or "Open Interventions" must always use the shared `getEscalationsData` helper. Avoid manual `executions` filtering to prevent count drift.
- **Value Logic**: "Value Saved" is never just hours. It is an aggregation: `(Hours * Rate) + (Autonomous Ops * Cost) + (Resolutions * Value)`.

### Deployment & Operations
- **Vercel Mapping**: Local repo `Armonyco_v1` (remote `vivilo-commits/armonyco_v1`) maps to Vercel project `armonyco-v1-bsvv`, NOT `armonyco-v1`.
- **Subscription Logic**: Validation checks both `subscription_active` (boolean) AND `plan_tier` (string presence). `entitlements` being null strictly blocks access.

### Institutional Logic Refinements (Phase 2)
- [2026-01-29] **Escalation Counting Unified**: Centralized all escalation metrics via `getEscalationsData` helper to ensure consistency between Governance and Growth layers.
- [2026-01-29] **Pedagogical Transparency**: Implemented `KPIExplanationModal` to disclose calculation methods and business value for core institutional metrics.
- [2026-01-29] **Governance Branding**: Corrected misleading units (M -> min) and locked core interface to English for maximum orchestration fidelity.
- [2026-01-29] **Resilience guidance**: Added proactive Force Sync instructions for persistent loading states.

### Institutional Performance & UI Refinement (Phase 3)
- [2026-01-29] **System Stability & Recovery**: Implemented promise-based mutexes for organization ID recovery in `ApiService`, preventing race conditions during initialization that were causing hangs.
- [2026-01-29] **Transactional Fidelity**: Refined `lara` template counting using duration-based heuristics (1 template per 40s) to accurately reflect production automation volume.
- [2026-01-29] **Cognitive Intensity Rebranding**: Standardized decision depth nomenclature to Intelligence Levels (Tactical, Analytical, Strategic, Elite, Sovereign).
- [2026-01-29] **Interface Standardisation**: Synced refresh button aesthetics and removed redundant status badges to align with institutional design tokens.

### Deep Debugging & Data Sync Fidelity (Phase 4)
- [2026-01-29] **Exact Data Aggregations**: Transitioned from in-memory KPI counting (limited to 1k rows) to database-level SUM and exact count queries. This ensures 100% data match with authoritative records (e.g., 1148 messages, 675 templates).
- [2026-01-29] **Initialization Stability**: Added a 10s timeout to ensureOrganizationId recovery process, preventing indefinite "Orchestrating Truth..." hangs if Auth or DB recovery stalls.
- [2026-01-29] **Centralized Heuristics**: Established LARA_TEMPLATE_SECONDS_INTERVAL = 40 as the authoritative constant for orchestration-to-template conversion.

### Auth-Gated Data Fetching (Phase 3.5 Hotfix)
- [2026-01-28] **Race Condition Root Cause**: Infinite loading ("Orchestrating Truth...") was caused by pages fetching data before `organizationId` was set by AuthContext. SessionStorage persistence helped but didn't fully resolve timing issues.
- [2026-01-28] **Solution Pattern**: Modified `usePageData` hook to accept a `ready` parameter (default: true). When `ready` is false, the hook stays in loading state without making API calls.
- [2026-01-28] **Implementation**: All protected pages (Dashboard, Growth, Escalations, Controls, Settings) now pass `!!organizationId` as the ready state. Data fetching only begins after AuthContext confirms the organization ID.
- [2026-01-28] **Key Files**: `usePageData.ts` (ready param), all page components (organizationId gating).
