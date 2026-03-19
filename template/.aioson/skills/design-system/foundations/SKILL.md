---
name: design-foundations
description: Core design tokens for the Cognitive Core visual identity — color palette, typography, spacing, border radius, shadows, and dual dark/light theme CSS variables. This is the base layer that ALL other design modules depend on. Load this FIRST before any other design module.
---

# Foundations — Design Tokens

This module defines the visual primitives. Every other module depends on these CSS variables.

## Google Fonts

Always include first:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

## Complete CSS Variables

Include this full block in every project. The `data-theme` attribute switches all values automatically.

```css
/* ═══ DARK THEME ═══ */
[data-theme="dark"] {
  --bg-void: #060910;
  --bg-base: #0B0F15;
  --bg-surface: #111827;
  --bg-elevated: #1A2332;
  --bg-overlay: #243044;

  --border-subtle: rgba(255,255,255,0.06);
  --border-medium: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.16);
  --border-accent: rgba(34,211,238,0.3);
  --border-accent-strong: rgba(34,211,238,0.6);

  --text-primary: #E5E7EB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-accent: #22D3EE;
  --text-heading: #F9FAFB;
  --text-inverse: #111827;

  --accent: #22D3EE;
  --accent-dim: rgba(14,116,144,0.3);
  --accent-glow: rgba(34,211,238,0.15);
  --accent-hover: #06B6D4;
  --accent-subtle: rgba(34,211,238,0.08);

  --semantic-green: #10B981;
  --semantic-green-dim: rgba(6,95,70,0.4);
  --semantic-red: #EF4444;
  --semantic-red-dim: rgba(153,27,27,0.4);
  --semantic-amber: #F59E0B;
  --semantic-amber-dim: rgba(146,64,14,0.4);
  --semantic-blue: #3B82F6;
  --semantic-blue-dim: rgba(37,99,235,0.3);
  --semantic-purple: #8B5CF6;
  --semantic-purple-dim: rgba(109,40,217,0.3);

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 20px rgba(34,211,238,0.1), 0 0 6px rgba(34,211,238,0.05);
  --shadow-glow-strong: 0 0 30px rgba(34,211,238,0.2), 0 0 10px rgba(34,211,238,0.1);
  --shadow-glow-accent: 0 0 40px rgba(34,211,238,0.15);
}

/* ═══ LIGHT THEME ═══ */
[data-theme="light"] {
  --bg-void: #F1F5F9;
  --bg-base: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F1F5F9;
  --bg-overlay: #E2E8F0;

  --border-subtle: rgba(0,0,0,0.06);
  --border-medium: rgba(0,0,0,0.10);
  --border-strong: rgba(0,0,0,0.16);
  --border-accent: rgba(8,145,178,0.25);
  --border-accent-strong: rgba(8,145,178,0.5);

  --text-primary: #334155;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --text-accent: #0891B2;
  --text-heading: #0F172A;
  --text-inverse: #F9FAFB;

  --accent: #0891B2;
  --accent-dim: rgba(8,145,178,0.10);
  --accent-glow: rgba(8,145,178,0.08);
  --accent-hover: #0E7490;
  --accent-subtle: rgba(8,145,178,0.04);

  --semantic-green: #059669;
  --semantic-green-dim: rgba(5,150,105,0.10);
  --semantic-red: #DC2626;
  --semantic-red-dim: rgba(220,38,38,0.10);
  --semantic-amber: #D97706;
  --semantic-amber-dim: rgba(217,119,6,0.10);
  --semantic-blue: #2563EB;
  --semantic-blue-dim: rgba(37,99,235,0.10);
  --semantic-purple: #7C3AED;
  --semantic-purple-dim: rgba(124,58,237,0.10);

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-glow: 0 2px 8px rgba(8,145,178,0.08), 0 1px 3px rgba(0,0,0,0.06);
  --shadow-glow-strong: 0 4px 16px rgba(8,145,178,0.12);
  --shadow-glow-accent: 0 0 30px rgba(8,145,178,0.08);
}

/* ═══ SHARED (both themes) ═══ */
[data-theme="dark"], [data-theme="light"] {
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter', system-ui, sans-serif;

  --text-xs: 0.675rem;   /* 10.8px — micro labels */
  --text-sm: 0.75rem;    /* 12px */
  --text-base: 0.875rem; /* 14px — default body */
  --text-lg: 1rem;       /* 16px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */
  --text-4xl: 2.75rem;   /* 44px */
  --text-5xl: 3.5rem;    /* 56px — hero headings */

  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-black: 900;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
  --tracking-widest: 0.15em;

  --leading-none: 1;
  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  --space-0: 0;
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-5: 1.25rem;  --space-6: 1.5rem;
  --space-8: 2rem;     --space-10: 2.5rem;  --space-12: 3rem;
  --space-16: 4rem;    --space-20: 5rem;    --space-24: 6rem;

  --radius-sm: 0.375rem; --radius-md: 0.5rem; --radius-lg: 0.75rem;
  --radius-xl: 1rem; --radius-2xl: 1.5rem; --radius-full: 9999px;

  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-theme: background 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease;

  --z-base: 0; --z-elevated: 10; --z-dropdown: 20;
  --z-sticky: 30; --z-modal: 50; --z-toast: 60;
}
```

## Typography Patterns

These are the recurring text styles. Apply them directly — don't create CSS classes.

### Mono Label (most distinctive element of the identity)
```
font-family: var(--font-mono)
font-size: var(--text-xs)
font-weight: var(--weight-semibold)
letter-spacing: var(--tracking-widest)
text-transform: uppercase
color: var(--text-secondary)
```
Used for: section headers, category labels, stat labels, nav labels, badge text, timestamps, IDs.

### Display Heading
```
font-family: var(--font-display)
font-weight: var(--weight-black)
letter-spacing: var(--tracking-tight)
color: var(--text-heading)
line-height: var(--leading-tight)
```
Sizes: `--text-5xl` (hero), `--text-3xl` (page title), `--text-2xl` (section), `--text-xl` (card title).

### Stat Number
```
font-family: var(--font-body)
font-size: var(--text-4xl)
font-weight: var(--weight-bold)
color: var(--text-heading)
line-height: var(--leading-none)
```
Pair with a suffix span: `font-size: var(--text-lg); color: var(--text-muted)`.

### Body Text
```
font-family: var(--font-body)
font-size: var(--text-base)
color: var(--text-primary)
line-height: var(--leading-relaxed)
```

### Accent Link
```
color: var(--text-accent)
font-weight: var(--weight-medium)
text-decoration: none
```

## Visual Direction

### For Dashboards / Admin
- Dense, compact spacing
- Dark theme default
- Heavy use of mono labels
- Card grids for data
- Stat cards with large numbers

### For Frontpages / Landing Pages
- Generous whitespace (use `--space-16` to `--space-24` between sections)
- Light theme default (dark as option)
- Hero section with `--text-5xl` heading
- Mix of display headings + body text
- Cards used for features/benefits
- Full-width sections with alternating backgrounds

### For Institutional / Corporate
- Clean, structured
- Light theme default
- Professional spacing
- Emphasis on readability
- Subtle accent usage
- Cards for team, services, values

## Non-Negotiable Rules

1. **Never pure black or white text** — always use the CSS variables
2. **Mono labels on every section** — this is the identity signature
3. **Three depth levels minimum** — void → base → surface (or base → surface → elevated)
4. **Teal/cyan is the only accent** — never change the primary accent color
5. **JetBrains Mono + Inter** — never use other fonts
6. **Theme transition** — always add `transition: var(--transition-theme)` to themed containers
