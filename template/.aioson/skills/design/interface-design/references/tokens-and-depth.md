# Tokens and Depth — Interface Design

Lock these decisions before implementation. If you cannot state the checkpoint clearly, the system is not ready to build.

---

## Decision checkpoint (write this before any component)

Before building any screen or component family, write a short checkpoint that locks:

- **Depth strategy**
- **Surface levels**
- **Border recipe** (including alpha)
- **Spacing base**
- **Radius ladder**
- **Control height**
- **Typography anchor**
- **Motion posture**

Example (Sophistication & Trust):
> Depth: borders-only • Surfaces: base / surface / elevated • Borders: rgba(15,23,42,0.08) • Spacing: 8px • Radius: 10/12 • Controls: 38px • Type: IBM Plex Sans 14/16/24 • Motion: 120ms ease-out

Example (Premium Dark Platform):
> Depth: borders-first • Surfaces: #0b1015 / #10161d / #151c24 • Borders: rgba(255,255,255,0.08) • Spacing: 8px • Radius: 12/14 • Controls: 40px • Type: Geist 14/16/28 • Motion: 140ms ease-out

---

## Token architecture (define all levels)

### Color token families

```
foreground/primary     ← body text, labels, high-emphasis
foreground/secondary   ← supporting text, placeholders
foreground/muted       ← captions, disabled labels
foreground/faint       ← decorative only, never critical

background/base        ← page background
background/surface     ← cards, panels
background/elevated    ← modals, dropdowns (shadow system) or third surface level
background/sunken      ← inputs, inset areas

border/default         ← standard separator
border/strong          ← focused inputs, active states
border/faint           ← ultra-subtle dividers

brand/primary          ← main CTA color
brand/secondary        ← supporting brand accent

semantic/success       ← green family
semantic/warning       ← amber family
semantic/danger        ← red family
semantic/info          ← blue family
```

### Spacing — base × multiples only

Never use arbitrary values (17px, 22px, 37px). Every value must be a multiple of your base.

Common bases:
- 4px base for dense/operational: 4, 8, 12, 16, 24, 32
- 4px base for generous/consumer: 8, 12, 16, 24, 32, 48

### Depth — pick ONE and commit

| Strategy | When | Implementation |
|---|---|---|
| **Borders only** | Maximum density, zero visual noise | `border: 1px solid border/faint` |
| **Subtle shadows** | Gentle, approachable feel | `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` |
| **Layered surfaces** | Modern minimal, dark platforms | Background elevation without shadows or borders |

**Never mix depth strategies on the same surface.**

### Radius ladder

Define three values and use only them:
- Sharp (small controls, tags, badges)
- Medium (cards, inputs, buttons)
- Large (panels, modals, sheets)

### Typography anchor

Define one font family and its full scale before touching components:

```
Page title    : largest size, 600-weight, tight tracking
Section title : medium-large, 500-weight, normal tracking
Body          : base size, 400-weight, line-height 1.5–1.6
Helper / meta : small, 400-weight, muted color
Data / mono   : monospace for numbers in tables, code, metrics
```

Size alone is never enough. Use weight + tracking + opacity to create layers.

### Motion posture

- Fast & utilitarian: 100–150ms ease-out
- Comfortable & polished: 140–200ms ease-out
- Expressive & refined: 200–300ms ease-out with spring for entrances

Never animate layout properties (width, height, padding). Animate `transform` and `opacity` only.
Always provide `prefers-reduced-motion: reduce` fallback.
