---
name: cognitive-core-ui
description: Cognitive Core UI is the visual identity system for premium, command-center-style interfaces inspired by the Mentes Sintéticas platform. Use it when `design_skill: cognitive-core-ui` is set in project.context.md OR when the user explicitly asks for "cognitive core", "mentes sintéticas layout", "cognitive core style", "aquele layout escuro", "dark dashboard command center", or similar. Supports dashboards, admin panels, detail/profile pages, landing pages, and websites — all with dark (default) and light themes via a single toggle. Do NOT use this skill unless explicitly selected.
---

# Cognitive Core UI

The Cognitive Core system sits at the intersection of **military-grade data dashboard** and **refined SaaS UI** — dense, structured, and polished. This is the visual identity of the Mentes Sintéticas platform.

**This is one visual system.** Never combine it with another design skill.

## Package structure

```text
.aioson/skills/design/cognitive-core-ui/
  SKILL.md                      ← you are here (load this first)
  references/
    design-tokens.md            ← CSS variables dark + light, typography, token scope guardrails
    components.md               ← All reusable components (nav, stat card, badges, table, modal, DNA panel, etc.)
    patterns.md                 ← Page layouts: dashboard shell, detail/profile, settings, auth, list-detail
    dashboards.md               ← Dashboard presets: inventory, control center, analytics, ops cockpit, CRM
    websites.md                 ← Landing page, frontpage, institutional layouts + anti-patterns
    motion.md                   ← Animations: keyframes, entrance sequences, scroll reveal, loading states
```

## Activation rules

- Apply this package **only** when `project.context.md` contains `design_skill: "cognitive-core-ui"` or the user explicitly chooses it.
- If another design skill is selected, do **not** load this package.
- Never auto-select this skill — always require explicit confirmation.
- If no skill is set yet, the active agent must ask or confirm before applying.

## Responsibility boundary

This skill defines:
- Visual direction and aesthetic DNA
- Design tokens (colors, typography, spacing, radius, shadows)
- Component vocabulary and anatomy
- Page composition patterns
- Theme switching behavior (dark/light)

This skill does **not** decide:
- Stack (React, Vue, Blade, HTML, etc.)
- Output format (single file, multi-file, CSS modules, Tailwind, etc.)
- Icon library choice
- Whether a theme toggle exists in the product (the agent decides)

## Loading guide

Always load only what the current task needs:

| Task | Load |
|---|---|
| Any UI work | `references/design-tokens.md` |
| Reusable components | `references/design-tokens.md` + `references/components.md` |
| Dashboard or admin panel | `references/design-tokens.md` + `references/components.md` + `references/patterns.md` + `references/dashboards.md` |
| Detail / profile page | `references/design-tokens.md` + `references/components.md` + `references/patterns.md` |
| Landing page or website | `references/design-tokens.md` + `references/components.md` + `references/websites.md` |
| Motion / animation | add `references/motion.md` when animation materially improves the result |
| Full UI build | all six reference files |

## Visual signature — three pillars

1. **Command-center authority** — Dense information when the product is operational. Monospaced uppercase labels on every section. Large numeric stat readouts. Everything feels like a mission control panel.
2. **Premium refinement** — Three depth levels minimum (void → base → surface → elevated). Subtle borders (`rgba(255,255,255,0.06)` in dark). Teal/cyan as the only accent — used for active states, borders, glow effects. Never harsh contrasts.
3. **Structured rhythm** — Tab navigation, sidebar trees, card grids, section headers with icons. Information is organized into labeled zones. One focal block per viewport.

## Theme system

```html
<div data-theme="dark">   <!-- or data-theme="light" -->
```

- **Dark (default)**: Dashboards, monitoring, analytics, dev tools, anything data-heavy or operational
- **Light**: Client-facing apps, content-heavy pages, e-commerce admin, institutional websites
- **Both with toggle**: When the user asks, or when the target audience varies

If the user does not specify: default to **dark with a theme toggle** in the top bar.

## Visual DNA (from reference screenshots)

### Colors — dark theme
- Background void: `#060910`
- Background base: `#0B0F15` (main app background)
- Surface: `#111827` (cards)
- Elevated: `#1A2332` (hover, nested)
- Primary accent: `#22D3EE` (teal/cyan) — active tabs, badges, glow, borders
- Text heading: `#F9FAFB`
- Text primary: `#E5E7EB`
- Text secondary: `#9CA3AF`
- Text muted: `#6B7280`

### Colors — light theme
- Background void: `#F1F5F9`
- Background base: `#F8FAFC`
- Surface: `#FFFFFF`
- Primary accent: `#0891B2` (deeper teal for legibility)
- Text heading: `#0F172A`
- Text primary: `#334155`

### Typography
- Headings: `Inter`, `weight-black (900)`, `letter-spacing: -0.02em`
- Body: `Inter`, `weight-normal (400)`, `line-height: 1.6`
- Labels (most distinctive): `JetBrains Mono`, `weight-semibold`, `uppercase`, `letter-spacing: 0.15em`, `font-size: 0.675rem`
- Stats: `Inter`, `weight-bold (700)`, `font-size: 2.75rem`

### Layout structure (dashboards)
```
┌──────────────────────────────────────────────────────────┐
│  TOP BAR: [Logo + Name] [Tab Nav (center)] [Actions]     │
├──────────────────────────────────────────────────────────┤
│  [Optional: breadcrumbs]                                  │
│  PROFILE/HEADER ZONE: avatar + name + badges + stat cards│
├──────────────────────────────────────────────────────────┤
│  TAB NAVIGATION (full width)                              │
├───────────┬──────────────────────────────────────────────┤
│ SIDEBAR   │  CONTENT                                      │
│ 200px     │  SECTION HEADER (mono label + icon)           │
│ tree nav  │  CARD GRID (2-4 col, auto-fill)               │
│           │  SECTION HEADER                               │
│           │  CARD GRID                                    │
└───────────┴──────────────────────────────────────────────┘
```

### Signature details
- Monospace uppercase labels on every section (never skip this)
- Badge chips with teal/cyan glow in dark mode
- Progress bars with colored semantic fills (green/red/amber/purple)
- Featured quote blocks: italic large text + mono attribution
- Cards with `1px` border + subtle hover glow (never box shadows only)
- Active tab: teal bottom border `3px` + teal text
- Sidebar active item: `border-left: 3px solid var(--accent)` + `bg-elevated`
- Theme transition: `250ms ease` on background, color, border-color, box-shadow

## Application rules

- Treat `references/design-tokens.md` as the source of truth for ALL tokens.
- Resolve the page variant before composing: dashboard uses dense operational rhythm; website/landing page uses more whitespace, hero typography, and narrative hierarchy.
- Never combine this package with `interface-design`, `premium-command-center-ui`, or any other design skill in the same task.
- Reuse the project's component library if one exists — map Cognitive Core tokens onto it instead of rebuilding primitives.
- Adapt code examples to the active stack. Reference snippets are design specifications, not copy-paste code.
- Accessibility, responsiveness, and production semantics are the agent's responsibility (not this skill).

## Delivery modes

### Greenfield
1. Choose page variant (dashboard, detail, settings, landing, institutional)
2. Load relevant references
3. Apply token scope from `design-tokens.md`
4. Compose layout from `patterns.md` or `websites.md`
5. Build components from `components.md`

### Brownfield
1. Audit existing UI before rewriting
2. Map Cognitive Core tokens onto the existing component library
3. Fix token scope issues (font/color variables must be on the correct container)
4. Prefer targeted upgrades over full rewrites unless the user asks for a redesign
