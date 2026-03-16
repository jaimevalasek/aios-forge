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
