# Websites & Landing Pages — Cognitive Core UI

Read after `design-tokens.md` and `components.md`. When building websites, leave `dashboards.md` out of context.

The Cognitive Core visual identity scales from dashboards to websites. Same typography, token system, and component vocabulary — but with more whitespace, hero typography, and narrative hierarchy.

A commercial page using this skill should feel **premium and technical, but still behave like a website.** It cannot look like an admin dashboard with the word "site" pasted on top.

## Website Stance

**Use these traits:**
- Stronger narrative hierarchy — one message per section
- More whitespace between sections (`--space-16` to `--space-24`)
- Fewer panels above the fold — never five cards competing with the main message
- Larger display headings (`--text-5xl` for hero)
- Mono labels only as supporting spice, not the main reading experience
- One strong accent family carried through the whole page

**Avoid these traits:**
- Persistent sidebars on marketing pages
- Operational rails and dense status grids above the fold
- Dashboard feeds unless the brand explicitly needs that look
- Five equal-weight cards before the value proposition
- Cyan glow overuse — websites need calm areas
- Uppercase mono for entire paragraphs, nav groups, or section copy
- Every section bordered like a dashboard card

## Website Anti-Patterns

1. Do not use a dashboard shell for a landing page — no persistent sidebar, no live-feed panel.
2. Do not place stat cards before the main value proposition unless the proof IS the product.
3. Do not overuse cyan/teal glow. Websites need breathing room.
4. Do not make every section a bordered card — alternate backgrounds instead.
5. Do not use a hero that is just a grid of equal-weight feature cards. The hero must have ONE dominant message.

---

## Default theme for websites

- **Light theme**: Institutional sites, corporate, marketing pages, client-facing products
- **Dark theme**: Tech products, SaaS, developer tools, agencies
- **Both with toggle**: When the user asks, or when the site needs broad appeal

If the user does not specify, use **dark with a light option toggle** for tech/SaaS, or **light with a dark option toggle** for institutional/corporate.

---

## 1. Landing Page

```
┌────────────────────────────────────────────────────────┐
│  TOP BAR (sticky, bg-void on scroll, transparent hero) │
├────────────────────────────────────────────────────────┤
│                                                         │
│  HERO SECTION (padding: space-24 top, space-20 bottom) │
│  ┌──────────────────────────────────────────────────┐  │
│  │ MONO LABEL: tagline (centered)                   │  │
│  │ DISPLAY HEADING text-5xl, weight-black (centered)│  │
│  │ Subtitle: text-lg, text-secondary (centered)     │  │
│  │ [CTA Primary Button]  [Secondary Button]         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
├────────────────────────────────────────────────────────┤
│  FEATURES (bg-surface, padding: space-20)              │
│  Section Header (centered: mono label + display title) │
│  Card Grid: [InfoCard] [InfoCard] [InfoCard]  3-col    │
│                                                         │
├────────────────────────────────────────────────────────┤
│  STATS (bg-base, padding: space-16)                    │
│  [StatCard] [StatCard] [StatCard] [StatCard]           │
│                                                         │
├────────────────────────────────────────────────────────┤
│  SOCIAL PROOF (bg-surface, padding: space-16)          │
│  Quote cards in 2-col grid or testimonial strip        │
│                                                         │
├────────────────────────────────────────────────────────┤
│  CTA SECTION (bg-void, accent radial glow, space-20)   │
│  Display heading + mono label + CTA Button (centered)  │
│                                                         │
├────────────────────────────────────────────────────────┤
│  FOOTER (bg-void, border-top: border-subtle)           │
│  [Brand | Links | Links | Newsletter or Social]        │
└────────────────────────────────────────────────────────┘
```

### Hero section (required elements)

1. **Mono label** above heading — category / tagline in monospace uppercase
2. **Display heading** — `text-5xl`, `weight-black`, `tracking-tight`, `line-height: 1.1`
3. **Subtitle** — 1–2 sentences, `text-lg`, `text-secondary`
4. **Two CTAs** — primary (solid accent) + secondary (outline or ghost)
5. **Optional**: hero visual (screenshot, illustration, or abstract mesh)

```css
.hero {
  min-height: 90vh; display: flex; align-items: center; justify-content: center;
  padding: var(--space-24) var(--space-6) var(--space-20);
  text-align: center;
  background: var(--bg-base);
  position: relative; overflow: hidden;
}
.hero-content { max-width: 760px; position: relative; z-index: 1; }
.hero-mono-label {
  font-family: var(--font-mono); font-size: var(--text-xs);
  color: var(--accent); letter-spacing: var(--tracking-widest);
  text-transform: uppercase; margin-bottom: var(--space-4);
  display: inline-flex; align-items: center; gap: var(--space-2);
}
.hero-heading {
  font-family: var(--font-display); font-size: var(--text-5xl);
  font-weight: var(--weight-black); color: var(--text-heading);
  letter-spacing: var(--tracking-tight); line-height: 1.05;
  margin-bottom: var(--space-5);
}
.hero-subtitle {
  font-size: var(--text-lg); color: var(--text-secondary);
  line-height: var(--leading-relaxed); margin-bottom: var(--space-8);
  max-width: 560px; margin-left: auto; margin-right: auto;
}
.hero-actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
```

**Optional hero glow (dark theme):**
```css
.hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 800px 600px at 50% 30%, var(--accent-glow), transparent 70%);
  pointer-events: none;
}
```

### Section max-width container

```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-6); }
.section { padding: var(--space-20) var(--space-6); }
.section-header { text-align: center; margin-bottom: var(--space-10); }
.section-mono-label {
  font-family: var(--font-mono); font-size: var(--text-xs);
  color: var(--accent); letter-spacing: var(--tracking-widest);
  text-transform: uppercase; margin-bottom: var(--space-3);
}
.section-heading {
  font-family: var(--font-display); font-size: var(--text-3xl);
  font-weight: var(--weight-black); color: var(--text-heading);
  letter-spacing: var(--tracking-tight); line-height: var(--leading-tight);
}
```

### Features / Benefits section

Use Info Cards (from `components.md`) in a 3-column grid:

```css
.features-grid {
  display: grid; gap: var(--space-5);
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: 900px) { .features-grid { grid-template-columns: 1fr; } }
```

Each card: icon + mono label + heading + description paragraph. Use `var(--bg-elevated)` as card background for contrast against the section.

### Stats section

Row of 4 stat cards. Use light background (`bg-surface`) for the stat numbers section:

```css
.stats-section { background: var(--bg-surface); }
.stats-row { display: flex; gap: var(--space-5); flex-wrap: wrap; justify-content: center; }
.stats-row .stat-card { flex: 1; min-width: 180px; text-align: center; }
```

Stat card center-aligned variant:
- Mono label centered
- Large number centered, accent color optional
- Short subtitle below

### Social proof / Testimonials

```css
.testimonials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }
@media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }
```

Testimonial card:
```css
.testimonial-card {
  background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); padding: var(--space-6);
}
.testimonial-quote {
  font-size: var(--text-base); color: var(--text-primary);
  line-height: var(--leading-relaxed); font-style: italic;
  margin-bottom: var(--space-4);
}
.testimonial-author {
  font-family: var(--font-mono); font-size: var(--text-xs);
  color: var(--text-muted); letter-spacing: var(--tracking-wider); text-transform: uppercase;
}
```

### CTA section

```css
.cta-section {
  background: var(--bg-void); text-align: center;
  position: relative; overflow: hidden;
}
.cta-section::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 600px 400px at 50% 50%, var(--accent-glow), transparent);
  pointer-events: none;
}
.cta-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
```

### Top navigation (landing pages)

Same structure as dashboard top bar, with these differences:
- Initially transparent background, transitions to `bg-void` on scroll
- Links are page anchor links (`#features`, `#pricing`, `#about`)
- Add `data-scrolled` attribute via JS to trigger background fill

```css
.topbar { transition: background var(--transition-slow), border-color var(--transition-slow); }
.topbar[data-scrolled="true"] {
  background: var(--bg-void);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
}
```

---

## 2. Institutional / Corporate Site

Same as landing page with these additions:

### About page
```
Hero (short, 50vh) → Text block + values card grid → Team card grid → CTA
```

### Team card
```css
.team-card { text-align: center; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-6); }
.team-avatar { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--border-subtle); margin: 0 auto var(--space-4); object-fit: cover; }
.team-name { font-weight: var(--weight-bold); color: var(--text-heading); }
.team-role { color: var(--accent); font-style: italic; font-size: var(--text-sm); }
.team-bio { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2); line-height: var(--leading-relaxed); }
```

### Services page
```
Hero → Service cards grid (3-col) → Why Us stats row → CTA
```

### Contact page
```
Two columns: [Left: contact info cards] [Right: form card]
```

---

## 3. Footer

```css
.footer {
  background: var(--bg-void); border-top: 1px solid var(--border-subtle);
  padding: var(--space-10) var(--space-6) var(--space-6);
}
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-8); margin-bottom: var(--space-8);
}
.footer-brand { /* brand column */ }
.footer-col-label {
  font-family: var(--font-mono); font-size: var(--text-xs);
  color: var(--text-muted); letter-spacing: var(--tracking-widest);
  text-transform: uppercase; margin-bottom: var(--space-4);
}
.footer-link {
  display: block; color: var(--text-secondary); text-decoration: none;
  font-size: var(--text-sm); margin-bottom: var(--space-2);
  transition: color var(--transition-fast);
}
.footer-link:hover { color: var(--accent); }
.footer-bottom {
  border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);
  display: flex; justify-content: space-between; align-items: center;
  font-size: var(--text-sm); color: var(--text-muted);
}
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr 1fr; gap: var(--space-6); }
}
```

---

## 4. Buttons (website variants)

Primary CTA button:
```css
.btn-primary {
  background: var(--accent); color: var(--bg-base);
  font-family: var(--font-mono); font-size: var(--text-sm);
  font-weight: var(--weight-semibold); letter-spacing: var(--tracking-wide);
  text-transform: uppercase; padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md); border: none; cursor: pointer;
  transition: var(--transition-base);
  box-shadow: 0 0 20px var(--accent-glow);
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 32px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}
```

Secondary button:
```css
.btn-secondary {
  background: transparent; color: var(--text-primary);
  border: 1px solid var(--border-medium);
  font-family: var(--font-mono); font-size: var(--text-sm);
  font-weight: var(--weight-semibold); letter-spacing: var(--tracking-wide);
  text-transform: uppercase; padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md); cursor: pointer;
  transition: var(--transition-base);
}
.btn-secondary:hover {
  border-color: var(--border-accent);
  color: var(--accent);
}
```

---

## Key differences: dashboard vs website

| Aspect | Dashboard | Website |
|---|---|---|
| Default theme | Dark | Light (or dark for tech) |
| Section padding | `space-4 to space-5` | `space-16 to space-24` |
| Content max-width | Full layout with sidebar | `1200px` centered |
| Heading size | `text-2xl` max | `text-5xl` for hero |
| Cards | Dense, compact | Spacious, feature-oriented |
| Navigation | Tab-heavy, sidebar | Linear anchors, single bar |
| Background alternation | Same bg-base | Alternates `bg-base` / `bg-surface` |
