# Components and States — Interface Design

---

## Component quality (mandatory for every component)

Define all six states before handing off to @dev:

| State | What to specify |
|---|---|
| Default | Baseline appearance |
| Hover | Subtle shift (background, border, or opacity) |
| Focus | Visible ring — `outline: 2px solid brand/primary; outline-offset: 2px` |
| Active / pressed | Slight scale or brightness change |
| Disabled | Reduced opacity (0.4–0.5), no cursor pointer, no hover effect |
| Loading | Skeleton or spinner — never block critical flow |

Container components also need:
- **Empty state** — illustration or message + primary action
- **Error state** — clear message + recovery action
- **Success confirmation** — when relevant, transient (not permanent)

---

## Forms

- Labels outside placeholders. Placeholders are hints, not labels.
- Validate on blur (not on keystroke, not on submit only).
- Inline field errors directly below the field. One global summary for multi-field failures.
- Disable the submit button and show progress during async operations.
- Input height minimum: 40px (desktop), 44px (mobile/touch) — **consumer/public-facing forms only.**

**Admin / operational form scale (settings, config, entity managers):**

```
Label  : text-[0.65rem]  mb: 2px          ← not text-sm mb-2
Input  : px-3 py-2  text-xs  radius 10–12px  (height ~32px)
Select : px-3 py-2  text-xs  radius 10–12px
Button : px-3 py-2  text-xs  radius 10–12px
```

The 40px minimum only applies to authenticated public flows (login, onboarding, checkout). In dense admin contexts, 32px controls reduce visual weight without usability loss — the audience is power users, not first-time visitors.

**Entity add/edit forms → Modal, not inline expansion:**
- Inline accordions (RevealPanel, details-based expansion) inside entity cards cause layout shift and make the page feel unstable
- Correct pattern: `+ Add` button + `Edit` button each open a centered modal (`max-w-448px`, `backdrop-blur overlay`)
- Modal form: single-column, `gap: 10px`, compact controls, full-width submit button

---

## Typography hierarchy

Size alone is never enough. Use weight + tracking + opacity to create layers:

```
Page title    : largest size, 600-weight, tight tracking
Section title : medium-large, 500-weight, normal tracking
Body          : base size, 400-weight, comfortable line-height (1.5–1.6)
Helper / meta : small, 400-weight, muted color
Data / mono   : monospace for numbers in tables, code, metrics
```

---

## Layout and composition

- **Rhythm** — interfaces breathe unevenly: dense tool areas give way to open content. Same card size, same gaps everywhere = flatness = no one decided.
- **Proportions declare intent** — a 280px sidebar says "navigation serves content." A 360px sidebar says "these are peers." Know what your proportions are saying.
- **One focal point per screen** — the primary action dominates through size, position, contrast, or surrounding space. When everything competes equally, nothing wins.
- **Reading order** — 1. Page intent → 2. Primary action → 3. Supporting data. Never invert.

---

## Accessibility baseline (non-negotiable)

- Semantic HTML and proper landmarks (`<main>`, `<nav>`, `<header>`, `<aside>`)
- Full keyboard navigation — Tab order must match visual reading order
- Visible focus rings on all interactive elements
- Color contrast: 4.5:1 for body text, 3:1 for large text and UI components
- Never convey meaning through color alone — add icon, pattern, or text
- `aria-label` on icon-only buttons, `aria-live` on dynamic status regions
- `prefers-reduced-motion` fallback for all animations

---

## Motion rules

- Motion clarifies transitions, it does not decorate them.
- Duration: micro-interactions 100–150ms, page transitions 200–300ms.
- Easing: ease-out for entrances, ease-in for exits.
- Never animate properties that affect layout (width, height, padding). Animate transform and opacity only.
- Always provide `prefers-reduced-motion: reduce` fallback.

---

## Stack-specific notes

| Stack | Priority |
|---|---|
| Laravel + TALL | Flux UI / Livewire primitives first; custom only for signature moves |
| Filament | Built-in Filament components before any override |
| Next.js + shadcn/ui | shadcn primitives + Tailwind tokens; keep component boundaries clean |
| React + Tailwind | Design token CSS vars → Tailwind config → components |
| Vue + Nuxt | Nuxt UI or PrimeVue first; avoid mixing component libraries |
| Vanilla HTML | Define CSS custom properties at `:root`, semantic class names only |
