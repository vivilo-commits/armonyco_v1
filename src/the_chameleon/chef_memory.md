# 👨‍🍳 Chef's Memory - Armonyco DecisionOS™

## 📌 Project Lessons & Recipes

### Database & Security (RLS)
- **Message Log Visibility**: `vivilo_whatsapp_history` requires a specific RLS policy for the `authenticated` role using `organization_id`. Without it, the Message Log appears empty even if data exists in the table.
- **Multi-Tenant Integrity**: Always use standard `supabaseFetch` via `api.ts` which automatically injects `organization_id` filters.

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
- **[2026-01-26] Giant Controls Cards**: Reduced padding and radius in `Controls/index.tsx` to match institutional standards.

### Institutional Identity (The Governor)
- **Terminology**: Use authoritative terms. "AI Resolution" → "Autonomous Resolution", "Revenue Captured" → "Revenue Governed".
- **Visuals**: No generic colors (green/blue/purple) in Settings/Admin areas. Use strict **Gold & Stone** (`text-gold-start` / `bg-gold-start/10`) to enforce the premium institutional feel.
- **Value Logic**: "Value Saved" is never just hours. It is an aggregation: `(Hours * Rate) + (Autonomous Ops * Cost) + (Resolutions * Value)`.

### Deployment & Operations
- **Vercel Mapping**: Local repo `Armonyco_v1` (remote `vivilo-commits/armonyco_v1`) maps to Vercel project `armonyco-v1-bsvv`, NOT `armonyco-v1`.
- **Subscription Logic**: Validation checks both `subscription_active` (boolean) AND `plan_tier` (string presence). `entitlements` being null strictly blocks access.

