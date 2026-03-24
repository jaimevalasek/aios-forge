# Task Dependency Graph Pattern

SVG-based DAG (Directed Acyclic Graph) visualization for task dependencies. Zero external dependencies — pure SVG + DOM.

## Example Layout (5 nodes, 3 layers)

```
Layer 1          Layer 2          Layer 3
─────────        ─────────        ─────────
┌──────────┐
│ research │ ──→ ┌──────────┐
└──────────┘     │ analyze  │ ──→ ┌──────────┐
                 └──────────┘     │  write   │
┌──────────┐     ┌──────────┐ ──→ └──────────┘
│  gather  │ ──→ │  review  │
└──────────┘     └──────────┘

x=0              x=160            x=320
```

Nodes: 120×44px. Column spacing: 160px. Row spacing: 60px.

## SVG Container

```html
<div class="dep-graph-wrap">
  <svg class="dep-graph-svg"
       width="560" height="240"
       viewBox="0 0 560 240"
       xmlns="http://www.w3.org/2000/svg">

    <!-- Arrow marker definition -->
    <defs>
      <marker id="dep-arrow" markerWidth="8" markerHeight="8"
              refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#2a2e3a"/>
      </marker>
    </defs>

    <!-- Edges (draw before nodes so nodes render on top) -->
    <path class="dep-edge" d="M120,22 C140,22 140,82 160,82"
          stroke="#2a2e3a" stroke-width="1.5" fill="none"
          marker-end="url(#dep-arrow)"/>

    <!-- Nodes (use dep-node component) -->
    <g transform="translate(0, 0)">
      <!-- dep-node component for "research" -->
    </g>
    <g transform="translate(160, 60)">
      <!-- dep-node component for "analyze" -->
    </g>

  </svg>
</div>
```

## Edge Types

| Type | Stroke | Style |
|------|--------|-------|
| `dependency` (normal) | `--border` (#2a2e3a) | Solid, 1.5px |
| `blocking` | `--danger` (#f87171) | Solid, 2px |
| `soft` (optional dep) | `--text-muted` | Dashed 4,3 |

```svg
<!-- Blocking edge -->
<path class="dep-edge dep-edge-blocking" d="..."
      stroke="#f87171" stroke-width="2" fill="none"
      marker-end="url(#dep-arrow-danger)"/>

<!-- Soft/optional edge -->
<path class="dep-edge dep-edge-soft" d="..."
      stroke="#8b8fa3" stroke-width="1" stroke-dasharray="4,3"
      fill="none" marker-end="url(#dep-arrow-muted)"/>
```

## Layout Algorithm (spec)

1. **Topological sort** — group nodes by their earliest possible layer (depth from source).
2. **Column assignment** — layer N is at `x = N * 160`.
3. **Row stacking** — within each layer, nodes stacked at `y = index * 60`.
4. **Edge routing** — cubic bezier from right port of source to left port of target:
   - `C1 = (srcX + dx*0.5, srcY)` — horizontal pull at source
   - `C2 = (tgtX - dx*0.5, tgtY)` — horizontal pull at target
   - Where `dx = tgtX - srcX` (always positive for left→right edges)

```
path d="M{sx},{sy} C{c1x},{c1y} {c2x},{c2y} {tx},{ty}"
```

5. **SVG sizing** — `width = (maxLayer + 1) * 160 + 40`. `height = maxNodesInLayer * 60 + 20`.

## CSS

```css
.dep-graph-wrap {
  overflow: auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.dep-graph-svg {
  display: block;
}

.dep-edge {
  transition: stroke 0.15s;
}

.dep-edge:hover {
  stroke: var(--accent);
}
```

## Interaction

- **Click node**: Show task detail panel or tooltip with status, agent, blockers.
- **Hover node**: Highlight all edges connected to that node (add `.highlighted` class, dim others).
- **Pan**: Drag the SVG container when graph is wider than viewport.

## Tooltip on hover

```html
<div class="dep-tooltip" style="position:absolute; display:none;">
  <div class="dep-tooltip-title">write-prd</div>
  <div class="dep-tooltip-row">Agent: <strong>planner</strong></div>
  <div class="dep-tooltip-row">Status: <strong class="state-running">running</strong></div>
  <div class="dep-tooltip-row">Blocked by: <em>none</em></div>
</div>
```

```css
.dep-tooltip {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  pointer-events: none;
  z-index: 100;
}
.dep-tooltip-title { font-weight: 600; margin-bottom: 4px; }
.dep-tooltip-row { color: var(--text-muted); line-height: 1.8; }
```
