# 👨‍🍳 Chef's Memory - Armonyco DecisionOS™

## 📌 Project Lessons & Recipes

### Database & Security (RLS)
- **Message Log Visibility**: `vivilo_whatsapp_history` requires a specific RLS policy for the `authenticated` role using `organization_id`. Without it, the Message Log appears empty even if data exists in the table.
- **Multi-Tenant Integrity**: Always use standard `supabaseFetch` via `api.ts` which automatically injects `organization_id` filters.
- **Hook & Singleton Race Conditions**: 
  1. `useEffect` hooks defined *above* an early return still execute. Add explicit guards inside them.
  2. Syncing singletons (like `api.organizationId`) in `useEffect` (post-render) is too late for child components (like `Dashboard`) that trigger fetches during their first render. Always sync singletons **synchronously** during state updates in the parent Context to ensure the value is available to the entire tree on the same tick.

### UI/UX & Design System (The Chameleon)
- **AppCard Padding**: `AppCard` has default padding (`medium`). Adding manual padding (like `p-10`) to a component wrapping `AppCard` or to the `AppCard` itself via `className` without setting `padding="none"` results in "giant" cards that break the visual scale.
- **Grid Density**: For high-density grids (e.g., 5-6 columns), use `p-4` or `p-6` instead of the default `p-8` to maintain professional proportions.
- **Construct Alignment**: Align section icons with the 5 Core Constructs:
    - **AEM (Activity)**: Activity
    - **ASRS (ShieldCheck)**: Shield
    - **AOS (Cpu)**: Cpu
    - **AIM (Zap)**: Zap
    - **AGS (BarChart3)**: BarChart
- **Radius Tokens**: Use `rounded-2xl` (Medium) for internal grid items and `rounded-[2.5rem]` (Large) for major page-level containers.

## 🛠️ Resolved Issues
- **[2026-01-26] Blank Message Log**: Resolved by adding RLS policy and verifying `api.ts` fetch logic.
- [2026-01-26] Giant Controls Cards: Reduced padding and radius in `Controls/index.tsx` to match institutional standards.
- [2026-01-27] Smart Escalations History: Implemented "Smart Merge" in `api.ts` to combine `escalations` table (status) with `executions` table (history), fixing the "missing history" issue.
- [2026-01-27] Org ID Init Bug: Resolved `organization_id` being null on first load by adding dependency to `App.tsx` useEffect.
- [2026-01-27] Guest Labeling: Refined `phone_clean` to clearly distinguish unnamed guests as "Guest #[ExecutionID]".
- [2026-01-27] Real-time Sync & API Resilience:
    1. **Sync**: Used `window.dispatchEvent(new CustomEvent('escalation-updated'))` to trigger cross-component updates (Sidebar count) without prop-drilling or excessive polling.
    2. **Resilience**: Increased `API_TIMEOUT_MS` to 20s in `usePageData.ts` to accommodate cloud cold starts.
    3. **Structural Guard**: Fixed a critical `ApiService` class closure bug that was causing "Something went wrong" errors by breaking the data layer. Always verify class scoping in large singleton files.
- [2026-01-27] Institutional Iconography: Aligned navigation with "The Chameleon" standards: Controls → `Cpu`, Escalations → `Activity`, Growth → `BarChart3`.
- [2026-01-27] Escalation Resolution Stability:
    1. **ON CONFLICT Fix (42P10)**: The `auto_insert_escalation` trigger on `executions` requires a unique constraint on `escalations(execution_id, organization_id)`. Without it, UPDATE/INSERT operations fail silently with `42P10`.
    2. **ID Cleaning**: Execution IDs may arrive as "Guest #18685" or "AR018685". Always use `id.replace(/[^0-9]/g, '')` to extract the numeric `execution_id` before querying `executions`/`escalations`.
    3. **Supabase Timeout**: Cloud triggers (like `auto_insert_escalation`) add latency. Use `Promise.race` with a 30s timeout to prevent infinite hangs while still allowing complex operations to complete.
    4. **Frontend RBAC**: Viewers cannot resolve escalations. This is enforced in `AuthContext.canResolveEscalations`, not RLS. RLS allows all organization members to UPDATE for flexibility; UI gates actions.

### Institutional Identity (The Governor)
- **Terminology**: Use authoritative terms. "AI Resolution" → "Autonomous Resolution", "Revenue Captured" → "Revenue Governed".
- **Visuals**: No generic colors (green/blue/purple) in Settings/Admin areas. Use strict **Gold & Stone** (`text-gold-start` / `bg-gold-start/10`) to enforce the premium institutional feel.
- **Value Logic**: "Value Saved" is never just hours. It is an aggregation: `(Hours * Rate) + (Autonomous Ops * Cost) + (Resolutions * Value)`.

### Deployment & Operations
- **Vercel Mapping**: Local repo `Armonyco_v1` (remote `vivilo-commits/armonyco_v1`) maps to Vercel project `armonyco-v1-bsvv`, NOT `armonyco-v1`.
- **Subscription Logic**: Validation checks both `subscription_active` (boolean) AND `plan_tier` (string presence). `entitlements` being null strictly blocks access.

