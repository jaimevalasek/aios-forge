# Visual System — Premium Command Center UI

> Extracted from the real AIOS Dashboard implementation. Preserves the aurora-glass premium command-center language.

This is not a generic dark dashboard guide. It captures the concrete moves that produce the premium operational feel:

- Tri-rail shell: left navigation, center workspace, right activity rail
- Aurora-glass surfaces with strong contrast and restrained semantic color
- Compact density tuned for operational reading, not marketing whitespace
- Search-first interaction via top search bar + command palette
- Contextual right rail with status / history / metrics tabs
- Page archetypes built around runtime priority, not equal-weight card walls

---

## Foundation — dark graphite

```
Background base    : #0b1015  (deep graphite)
Background surface : #10161d  (panel, card surfaces)
Background elevated: #151c24  (modals, dropdowns, hover states)
Background sunken  : #080c11  (inputs, inset areas)

Foreground primary : #f3f7fb
Foreground secondary: #b7c2cf
Foreground muted   : #7f8b99
Foreground faint   : #4a5568  (decorative only)

Border default     : rgba(255,255,255,0.08)
Border strong      : rgba(255,255,255,0.15)
Border accent      : rgba(99,179,237,0.30)

Brand accent       : desaturated blue-teal family (never neon)
Accent light       : #63b3ed
Accent muted       : #4a90a4

Semantic green     : #38a169
Semantic amber     : #d97706
Semantic red       : #e53e3e
Semantic blue      : #4299e1
```

Aurora accent — use sparingly, never everywhere:
```css
/* Aurora field on page background, not on every card */
.aurora-field {
  background: radial-gradient(ellipse 1200px 800px at 20% 20%,
    rgba(99,179,237,0.04), transparent 60%);
  pointer-events: none;
  position: fixed; inset: 0; z-index: 0;
}
```

---

## Typography

- **Heading font**: Clean system grotesk or neutral premium sans (Geist, Manrope, IBM Plex Sans, or system-ui)
- **Body font**: Same family as heading at regular weight
- **Mono**: Reserved for operational metadata, IDs, code, timestamps — never prose

```
Page title     : 20–22px, weight 600, tracking -0.01em
Section heading: 14–16px, weight 600, tracking -0.01em
Body           : 13–14px, weight 400, line-height 1.5
Helper / meta  : 11–12px, weight 400, muted color
Mono / data    : 11–12px, JetBrains Mono or SF Mono
```

---

## Spacing

```
Base: 4px
Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
```

Never use arbitrary values. Every measurement is a multiple of 4.

---

## Admin panel density — settings, config, entity management

The premium command center uses **tight operational spacing** for admin and config screens. These values are concrete — apply them directly.

### Card scale

| Level | Use | Padding | Radius |
|---|---|---|---|
| L1 | top-level section card | `16px` | `22px` |
| L2 | nested card inside L1 | `12px` | `18px` |
| L3 | inset block, disclosure body, info row | `10px` | `14px` |

Section gap between L1 cards: `12px`.

### Card headers

```
Eyebrow : font-mono 10–11px  uppercase  letter-spacing: 0.28em  color: muted
Title   : 15px  font-weight: 600  — max size inside a card
Meta    : font-mono 10px  truncate single line  — path, ID, workspace name
```

**No paragraph descriptions inside admin cards.** One eyebrow + one title + optional single-line meta is sufficient. Everything else belongs in a collapsed disclosure or a tooltip.

### Controls in admin context

```
Input / Select : height 32px  (py-2 px-3)  font-size 12px  border-radius 10–12px
Label          : font-size 10–11px  margin-bottom 2px
Button action  : py-2 px-3  font-size 12px  border-radius 10–12px
Button micro   : py-1 px-2.5  font-size 10–11px  border-radius 10px
```

### Row items (provider lists, agent lists)

```
Row padding : py-2 (8px)  divide-y separator
Name width  : 96px (fixed)  text-xs  font-medium
Model       : flex-1 truncate  font-mono  font-size 10–11px
Badges      : px-2 py-0.5  font-size 9–10px
Edit btn    : px-2.5 py-1  font-size 10–11px
```

### Entity grids (projects, agents, squads)

Same-type entities go in a grid — never full-width stacked:
```
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
gap: 12px
Card: rounded-18 p-3
Card header: name (text-sm semibold) + ID (mono 9px truncate)
Card badges: px-2 py-0.5 text-[9-10px]
Card actions: compact row, py-1.5, font-size 10–11px
```

### Add/Edit forms → Modal pattern

Entity add/edit always opens a modal — not inline expansion:
```
Modal: max-w-448px  centered  rounded-22px  p-20px
Overlay: bg-black/50 backdrop-blur
Header: eyebrow + title (text-base) + close button (top right)
Form: single-column grid  gap: 10px
Submit: full-width  py-2  text-xs
```

### Disclosure — secondary tools

Sync, cloud connect, advanced settings behind `<details>`:
```
Summary: flex row  px-3 py-2.5
  Left: label (text-xs) + status badge (alinhado / N diffs)
  Right: action button (micro size)
Body: border-t px-3 pb-3 pt-2  compact rows
```

### Anti-patterns — never do this in admin panels

- `padding: 24px` on inner section cards
- `font-size: 20–24px` headings inside cards
- Verbose description paragraphs in admin cards
- Full-width stacked entity cards (projects, providers)
- Inline accordion for add/edit forms
- `height: 40px+` inputs/buttons in dense tool contexts

---

## Depth — borders-first

Three surface levels maximum:

```
Level 0 — base (#0b1015)      : page background
Level 1 — surface (#10161d)   : cards, panels, nav rail
Level 2 — elevated (#151c24)  : modals, dropdowns, hover overlays
```

Rules:
- Borders separate before shadows
- One shadow family only: `0 4px 16px rgba(0,0,0,0.32)` — reserved for modals and floating elements
- No heavy glow effects on cards
- Aurora fields go on page background, not on individual components

---

## Radius

```
Sharp  : 6px    (compact elements, badges, tags)
Medium : 10px   (cards, inputs, buttons)
Large  : 14px   (panels, modals, sheets)
```

---

## Control heights

```
Compact : 28px  (toolbar items, inline actions)
Default : 34px  (standard controls)
Tall    : 40px  (primary action buttons)
```

---

## Signature rules

- Accent stays cool and controlled — no rainbow, no neon
- Status colors must remain strictly semantic (never decorative)
- Compact density: operational readout, not marketing whitespace
- High contrast without overload: borders quietly separate, they do not shout
- One focal block per screen region
- Three surface levels max — no more
