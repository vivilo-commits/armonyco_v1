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
