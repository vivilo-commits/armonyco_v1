# 🦎 The Chameleon Project (Superpowers)

**You just found a superpower.** This folder is your "Superpower". It provides you with a deterministic, self-healing, and evolving system to build world-class software.

---

## 🏗️ The Chameleon Hierarchy

1.  **THE IDENTITY**: **Armonyco DecisionOS™**
    - An institutional, premium orchestration layer for hospitality.
    - Identity is "Vibrant Gold" (`#f5d47c`) on "Rich Stone" (`stone-900`).
2.  **THE CONCEPT**: **Adaptive Governance & Truth**
    - The system is built on 5 Core Constructs (AEM, ASRS, AOS, AIM, AGS).
    - Every action must be auditable, verified, and "governed".
3.  **THE MODUS OPERANDI**: **P.R.I.S.M.A. Framework**
    - The 6-phase execution engine: **P**lanning, **R**each, **I**mplementation, **S**tylization, **M**anifestation, **A**nnealing.
4.  **THE PERSONA**: **Institutional Excellence**
    - Professional, sleek, and high-spec. Avoid generic UI; prioritize "Apple-grade" mechanical transitions.

---

## 📂 Project Structure & Architecture

- **[Chef's Memory](file:///Users/lucasfurlan/Downloads/Armonyco_v1/src/the_chameleon/chef_memory.md)** (Project-specific lessons & recipes).

### `/src`
Main application source code.
- **`/frontend`**: React orchestration.
    - **`/components`**: UI elements. Use `/design-system` for tokens.
    - **`/pages`**: View-level composites (Dashboard, Growth, etc.).
    - **`/contexts`**: Global state (Auth, Language).
- **`/backend`**: The "Governing Body" of the app.
    - `api.ts`: Central execution service.
    - `credits.ts`: Single source of truth for config and transactions.
    - `utils.ts`: Shared logic.
- **`/database`**: Supabase client and migration history.
- **`/the_chameleon`**: This directory (The Brain & Superpowers).

---

## 🎨 Design Patterns & UI Standards

### Visual Identity
- **Gold Standard**: `#f5d47c` only.
- **Glassmorphism**: `bg-stone-900/80` + `backdrop-blur-md`.
- **Iconography**: 2.5 stroke width, high-specificity explicit hex, partial fill (40% opacity).
- **Icon Mapping**:
    - **AEM**: `Activity`
    - **ASRS**: `ShieldCheck`
    - **AOS**: `Cpu`
    - **AIM**: `Zap`
    - **AGS**: `BarChart3`

### Absolute Rules
1. **Zero Redundancy**: Never create parallel systems for existing logic.
2. **Standard Fetching**: All data must flow through the **Supabase JS Client**. Raw `fetch()` is forbidden.
3. **Institutional Persona**: UI must follow "Gold on Stone".
4. **Navigation Persistence**: Use URL Hash sync to survive refreshes.
5. **Multi-Tenant Integrity**: Every query must be governed by RLS (`organization_id`).

---

## 🛠️ Infrastructure & Optimization

### SRC-Only Isolation Policy
All configuration and environment files MUST be isolated within `src/`.
- **Vercel**: Config resides in `src/.vercel/`. No root symlinks.
- **Environment**: Primary `.env` is in `src/`. Build tools use `envDir: 'src'`.
- **Zero Clutter**: `.env.local` or legacy stubs in root are forbidden.

### Git Governance
- **Remote**: `origin` -> `https://github.com/vivilo-commits/armonyco_v1.git`.
- **Strategy**: Clean, rebased history is mandatory.

---

## ⚡ The 15 Superpower Skills

### Core & Framework
1. **skill-self-regenerating**: The Operational Hub (P.R.I.S.M.A. engine + Memory).
2. **project-brainstorming**: Design-first Socratic dialogue.
3. **plan-writing**: TDD-focused task breakdown.
4. **subagent-orchestration**: Recursive Spec & Quality Review.
5. **test-driven-developing**: Pure RED-GREEN-REFACTOR rigor.

### Specialized Discipline
6. **api-integrating**: Connection verification & handshake scripts.
7. **database-managing**: Schema safety & connection links.
8. **debugging-errors**: Systematic 4-phase repair loop.
9. **best-practices-enforcing**: 12 principles + Systematic Refactoring.
10. **finishing-development**: Cloud manifestation & logs.

### Support & Tooling
11. **documentation-generating**: Payload refinement.
12. **performance-optimization**: Speed and premium UI.
13. **security-auditing**: OWASP checks and secrets detection.
14. **using-git-worktrees**: The Isolation Superpower.
15. **code-reviewing**: Comprehensive multi-dimensional analysis.

---
*Built for Antigravity Agents. Optimized for P.R.I.S.M.A. Methodology.*

## 🔗 Synergy Map (How Skills Connect)

| Phase | Lead Skill | Supporting Skills |
|-------|------------|-------------------|
| Phase | Lead Skill | Supporting Skills | Context | Status |
|-------|------------|-------------------|---------|--------|
| 0 (Init) | `skill-self-regenerating` | — | | |
| 1 (Plan) | `plan-writing` | `project-brainstorming` | | |
| 2 (Reach) | `api-integrating` | `database-managing` | | |
| 3 (Implement) | `test-driven-developing` | `subagent-orchestration`, `best-practices-enforcing` | | |
| 4 (Stylize) | `performance-optimization` | `documentation-generating` | | |
| 5 (Manifest) | `finishing-development` | `security-auditing`, `using-git-worktrees` | | |
| 6 (Anneal) | `skill-self-regenerating` | All skills | **Complete**: Dashboard & Growth refined featuring Institutional Value Saved KPIs (17€/h) and Date Filtering. **LATEST**: Implemented Smart Escalations Merge (preserving execution history) and Team Member Management (Edit Modal + API). FIXED: Organization ID initialization bug in `App.tsx` ensuring correct data load on first paint. | ✅ |
