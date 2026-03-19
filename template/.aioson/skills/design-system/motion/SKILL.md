---
name: design-motion
description: Animation and motion patterns for the Cognitive Core design system — entrance animations, hover effects, loading states, scroll reveals, theme transitions, and micro-interactions. Load foundations first. Use when building pages that need animation polish, especially landing pages, frontpages, and interactive dashboards.
---

# Motion — Animation System

Requires: `foundations/SKILL.md` loaded first.

Motion in Cognitive Core is **purposeful and restrained**. Dashboards use minimal motion (fast transitions, no flashy animations). Landing pages and frontpages use more dramatic entrances and scroll effects.

**Note:** CSS keyframes and transition values below are universal. Implementation examples (event handlers, observers) are illustrative — adapt to whatever framework the agent targets.

## Principles

1. **Functional first** — Every animation communicates state change or hierarchy
2. **Fast transitions** — UI state changes: 150ms. Theme changes: 250ms. Entrances: 400-600ms.
3. **Ease curves** — Default: `ease`. Entrances: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth decelerate)
4. **No bounce, no elastic** — This is a command center, not a toy

## CSS Keyframes

Include these in your `<style>` block:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
  50% { box-shadow: var(--shadow-glow-strong); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes progressFill {
  from { width: 0%; }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Entrance Patterns

### Page Load Sequence (staggered)

Apply to dashboard elements in this order, using `animation-delay`:

```
Top bar:      fadeInDown    0ms     300ms duration
Stats row:    fadeInUp      100ms   400ms duration (each card +80ms delay)
Tab bar:      fadeIn        250ms   300ms
Sidebar:      slideInLeft   200ms   400ms
Content:      fadeInUp      350ms   500ms (each card in grid +60ms stagger)
```

**Stagger formula:** For each item at index `i`, apply `animation-delay: base + (i × step)ms`. Typical values: base = 350ms, step = 60ms.

```css
/* Example: stagger cards in a grid */
.card:nth-child(1) { animation-delay: 350ms; }
.card:nth-child(2) { animation-delay: 410ms; }
.card:nth-child(3) { animation-delay: 470ms; }
/* ... pattern: 350 + (n × 60) */
```

### Landing Page Hero Entrance

```
Mono label:    fadeInUp    0ms      500ms
Heading:       fadeInUp    150ms    600ms
Subtitle:      fadeInUp    300ms    500ms
CTA buttons:   fadeInUp    450ms    500ms
```

### Modal Entrance

```css
.modal-backdrop { animation: fadeIn 200ms ease both; }
.modal-content { animation: scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both; }
```

## Hover Effects

### Card Hover (default for all cards)
```css
.card {
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}
.card:hover {
  border-color: var(--border-medium);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}
```

### Button Hover
Primary: darken background. Secondary: accent border + accent text.
```
transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
```

### Link Hover
```
color: var(--text-accent) → var(--accent-hover)
transition: color 150ms ease
```

### Tab Hover
Non-active tab: `background: var(--bg-elevated)`, `border-radius: var(--radius-md) var(--radius-md) 0 0`

### Sidebar Item Hover
`background: var(--bg-elevated)`, `color: var(--text-primary)`

## Loading States

### Skeleton Loading (shimmer)
```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
/* Apply with specific height/width per placeholder element */
```

### Pulse Glow (for Mode Panel when "active")
```css
animation: pulseGlow 3s ease-in-out infinite;
```

### Progress Bar Animation
When progress bars first appear:
```css
animation: progressFill 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
```

### Stat Number Count-up
```css
animation: countUp 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
```

## Theme Transition

When toggling dark/light:
```css
transition: var(--transition-theme);
/* = background 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease */
```

Apply to ALL themed containers.

## Scroll-Triggered Animations (Landing Pages)

Use IntersectionObserver (or framework equivalent) to trigger entrance animations when elements scroll into view.

**Behavior spec:**
- Observe each section/card with `threshold: 0.15`
- On intersect: transition from `opacity: 0; transform: translateY(24px)` to `opacity: 1; transform: translateY(0)`
- Duration: `600ms`, curve: `cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger delay per item: `+80ms`
- Fire once — disconnect observer after triggering

## When to Use What

| Context | Motion Level | Techniques |
|---|---|---|
| Dashboard | Minimal | Card hover, tab switch, theme transition, progress bar fill |
| Landing page | Moderate | Staggered entrances, scroll reveals, hero sequence, card hovers |
| Frontpage | Moderate | Hero entrance, scroll reveals, CTA glow pulse |
| Modal/Detail | Light | scaleIn entrance, fadeIn backdrop |
| Loading state | Ambient | Skeleton shimmer, pulse glow |
