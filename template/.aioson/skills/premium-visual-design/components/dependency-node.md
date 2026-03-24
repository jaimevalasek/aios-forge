# Dependency Node Component

Individual node in the task dependency graph. Rendered as an SVG `<g>` element.

## Dimensions

- Width: `120px`
- Height: `44px`
- Corner radius: `6px`
- Status bar: left `4px` wide, full height

## Anatomy

```
┌─┬────────────────────────┐
│█│ write-prd         [▶]  │  ← task slug + status icon (right)
│█│ planner               │  ← agent slug (muted, smaller)
└─┴────────────────────────┘
  ↑ 4px status bar (color by state)
```

## SVG Structure

```svg
<g class="dep-node" data-status="running" data-task="write-prd">
  <!-- Background rect -->
  <rect width="120" height="44" rx="6"
        fill="#1a1d27" stroke="#2a2e3a" stroke-width="1"/>

  <!-- Status bar (left edge) -->
  <rect width="4" height="44" rx="2"
        fill="#6c8aff"/>  <!-- color changes by status -->

  <!-- Task slug -->
  <text x="16" y="18"
        font-size="12" font-weight="600" fill="#e1e4eb"
        font-family="monospace">write-prd</text>

  <!-- Agent label -->
  <text x="16" y="32"
        font-size="10" fill="#8b8fa3"
        font-family="monospace">planner</text>

  <!-- Status label (right side) -->
  <text x="112" y="18"
        font-size="9" fill="#6c8aff"
        text-anchor="end">running</text>

  <!-- Connector port — left (incoming edges) -->
  <circle cx="0" cy="22" r="3" fill="#2a2e3a" stroke="#6c8aff" stroke-width="1"/>

  <!-- Connector port — right (outgoing edges) -->
  <circle cx="120" cy="22" r="3" fill="#2a2e3a" stroke="#6c8aff" stroke-width="1"/>
</g>
```

## Status Bar Colors

Map from `status-extended.md` tokens:

| Status | Color | Hex |
|--------|-------|-----|
| `pending` | `--state-idle` | `#8b8fa3` |
| `ready` | `--state-ready` | `#4ade80` |
| `running` | `--state-running` | `#6c8aff` |
| `blocked` | `--state-blocked` | `#f87171` |
| `done` | `--state-done` | `#4ade80` |
| `error` | `--state-error` | `#f87171` |
| `review` | `--state-review` | `#c084fc` |

## CSS (applied to SVG via class)

```css
.dep-node rect:first-of-type {
  transition: stroke 0.15s, stroke-width 0.15s;
}

.dep-node:hover rect:first-of-type {
  stroke: var(--accent);
  stroke-width: 1.5;
}

.dep-node.selected rect:first-of-type {
  stroke: var(--accent);
  stroke-width: 2;
}

.dep-node { cursor: pointer; }
```

## Connector Ports

Ports are small circles at `(0, 22)` (left, for incoming) and `(120, 22)` (right, outgoing). Show on hover using CSS opacity:

```css
.dep-node circle { opacity: 0; transition: opacity 0.15s; }
.dep-node:hover circle { opacity: 1; }
```

## Usage

Used inside the task dependency graph pattern (`task-dependency-graph.md`). Each node is a `<g>` positioned by the layout algorithm at `transform="translate(x, y)"`.
