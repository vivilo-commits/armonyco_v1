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

### Visual Identity Pattern
- **Brand Watermark**: Use `ASSETS.logos.icon` (the brand "A") as a subtle background element or pulse animation within core identity containers.
- **Color Standard**: All primary indicators must use the Armonyco Gold `#f5d47c` with explicit hex overrides to bypass CSS inheritance issues.
- **Glassmorphism**: Use `bg-stone-900/80` with `backdrop-blur-md` and `border-stone-500/60` for cards.

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
- **Frontend**: Never sort by formatted time strings. Always use secondary ISO timestamps or trust the API's sorted response.

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

## [Implementation Rules]
1. **Zero-Mistake Repetition**: Always check this document before modifying core visual sections.
2. **Explicit Styling**: When using Lucide icons, apply `color="#f5d47c"`, `strokeWidth={2.5}`, and optional `fill` props directly to the component.
3. **Institutional Tone**: Avoid generic red/blue/green colors. Use the Stone and Gold palette for all primary communications.
