# Armonyco Design Patterns & Architecture Standards

This document defines the visual and architectural standards for the Armonyco project, ensuring consistent, ultra-premium aesthetics across the Landing Page and Web Application.

## [Core Architecture Section]

### Icon Mapping
The 5 Core Constructs of DecisionOS™ must have distinct, meaningful visual identifiers:

| Construct | ID | Icon | Rationale |
|-----------|----|------|-----------|
| Armonyco Event Model™ | `AEM` | `Activity` | Pulsing heart of operational facts |
| Armonyco Reliability System™ | `ASRS` | `ShieldCheck` | The verified governance gate |
| Armonyco Operating System™ | `AOS` | `Cpu` | The logic/orchestration core |
| Armonyco Intelligence Matrix™ | `AIM` | `Zap` | Instant multi-agent intelligence |
| Armonyco Governance Scorecard™ | `AGS` | `BarChart3` | Performance signals and ROI |

- **Brand Watermark**: Use `ASSETS.logos.icon` (the brand "A") as a subtle background element or pulse animation.
- **Color Standard**: Primary Gold `#f5d47c`, Background `stone-900`. Use explicit hex overrides.
- **Glassmorphism**: `bg-stone-900/80` with `backdrop-blur-md` and `border-stone-500/60`.
- **Hash-First Navigation**: URL Hash mapping in `App.tsx` (e.g., `#escalations` -> `View.ESCALATIONS`). Bidirectional sync handles refresh and browser buttons. **Critical**: Initial state must prioritize hash over user state to prevent reset during refresh.
- **Strict Escalation Filtering**: Only show escalations where `human_escalation_triggered` is explicitly `true` AND `escalation_status` is valid (`OPEN`, `RESOLVED`, `DISMISSED`). Never rely on implicit states to prevent "phantom" notification counts.
- **Data Fetching**: Always use **Supabase JS Client** (`.from().select()`). Never use raw `fetch()` for authenticated data.

### Premium Transition Logic (Hover)
Hover effects must feel reactive and high-end:
- **Card**: Increase outer glow (`shadow-gold-glow-lg`) and sharpen the border color.
- **Icon Container**:
    - Default: Dark background, gold icon, 40% fill.
    - Hover: Gold gradient background, dark/stone icon, full fill.
    - Transition: `transition-all duration-300 ease-out`.

### Message Freshness & Sorting
To ensure real-time accuracy in message logs:
- **Backend**: Always fetch messages using `id` DESC to capture the newest entries. Expose a `latestMessageAt` ISO timestamp for reliable frontend sorting.
- **Timestamps**: Show the date if the message is from a previous day (`DD/MM HH:mm`). Show only time (`HH:mm`) for today's messages.
### AI Personas & Guardrails (The Amelia Protocol)
To maintain hospitality-grade excellence, all agents (Amelia, Lara, James, Elon, etc.) must follow these rigid protocols:
- **Safety Hierarchy**: **Safety** → **Truth** → **Clarity** → **Tone**.
- **Rule of Truth**: Never answer a guest without explicit tool validation in the current turn. If data is missing, offer human escalation immediately.
- **Reasoning Space**: Internal thought blocks are mandatory before composing any reply to summarize requests and plan tool usage.
- **Escalation Scoring**: 
    - `0.7+` = FLAG/TRIGGER (Failed Guardrail).
    - `1.0` = Certain escalation.
    - `0.6` = Ambiguous (Requires human review).

### Message Cleaning (UX)
- **Shared Utility**: Use `cleanMessageContent` from `utils.ts` for all displays.
- **Filtering**: Hide tool messages, internal JSON reasoning, and "Calling..." traces. Only show `human` and `ai` roles.
## [Security & Governance]

### Multi-Tenant Isolation (RLS)
The system's integrity relies on strict Row-Level Security. Every table must enforce access based on the user's organization membership:
```sql
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
)
```

### Authentication Hardening
- **Leaked Password Protection**: Must be enabled in Supabase Auth to prevent credential stuffing.
- **Minimum Password Length**: 12 characters recommended for institutional accounts.
- **JWT Awareness**: Use `supabase.auth.getSession()` to ensure the SDK maintains the current state across transitions.

## [Backend Architecture]

### API & Data Fetching
- **Standard Pattern**: `async supabaseFetch<T>(table: string, ...)` using the Supabase client.
- **Authentication**: Rely on the SDK's automatic session handling. Never use raw `fetch()` for authenticated endpoints.
- **RLS Enforcement**: Trust Row-Level Security policies for multi-tenant access control.
- **Error Handling**: Follow the pattern in `docs/api/hotels.ts` (historical reference) for consistent error propagation.

### Message Processing
- **Filtering Rules**: 
  - Hide `type: 'tool'` (internal orchestration).
  - Hide AI traces starting with "Calling " or internal JSON thinking blocks.
  - Only present `type: 'human'` and `type: 'ai'` to the user.
- **Timestamps**: Strictly use `created_at` from the database. Do not generate timestamps on the frontend for historical messages.

### Multi-Tenancy (RLS)
Every table must include the following RLS pattern for selection:
```sql
USING (
  organization_id IS NULL OR 
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```
*Note: Allow `NULL` `organization_id` only for historical data migration if explicitly required.*

### Role-Locked UI Pattern (Viewer Mode)
To ensure multi-tenant integrity for read-only roles:
- **State Source**: Use `AuthContext` to expose a `canEdit` boolean derived from the user's role (`viewer` = false).
- **Form Locking**: Always pass `disabled={!canEdit}` to `FormField`, `AppSwitch`, and `AppButton` elements.
- **Action Suppression**: If a button triggers a modal or side-effect, prefix the `onClick` with `if (!canEdit) return;`.
- **Inheritance**: Atomic components (like `AppSwitch`) must include a `disabled` prop in their interface to support this global lockdown.

### Direct Account Provisioning
When creating sub-accounts (non-invite model):
- **Flow**: Use `supabase.auth.signUp` directly from the Admin's view. This provisions the user immediately.
- **Linking**: The `signUp` response must be used to immediately insert a record into `organization_members`.
- **Security**: In production, prefer the Supabase Admin SDK (Service Role) for direct user creation to avoid triggering email confirmation blockers for the admin user.

## [Maintenance & Structure]

### Project Integrity
To maintain an ultra-premium, maintainable codebase:
- **Zero Redundancy**: If a core logic file (e.g., `credits.ts`) already exists, never create a parallel system (e.g., `credits-system.ts`).
- **Build Isolation**: Build artifacts must only exist in the root `/dist`. No nested `dist` folders are allowed.
- **Single Source of Truth**: All backend services should reside in `/src/backend`. Avoid fragmentation into multiple parallel `api/` folders.
- **No Placeholders**: Interaction-ready code is prioritized over "Coming Soon" banners.

### File Cleanup
Regularly remove:
- `dist/` and `node_modules/` from nested directories if created by mistake.
- Unused `.DS_Store` files.
- Duplicate types or utility functions that have been consolidated into `utils.ts` or `types.ts`.
