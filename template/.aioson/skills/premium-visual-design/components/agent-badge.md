# Agent Badge Component

Visual badge identifying the execution type of an agent: `auto`, `human`, or `solo`.

## Anatomy

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ ⚡ auto  │   │ 👤 human │   │ ◆ solo   │
└──────────┘   └──────────┘   └──────────┘
  cyan          amber           muted
```

## Types

| Type | Icon | Color token | Meaning |
|------|------|------------|---------|
| `auto` | ⚡ | `--state-auto` (#22d3ee) | Fully autonomous — no human gates |
| `human` | 👤 | `--state-human` (#fbbf24) | Human-in-the-loop agent |
| `solo` | ◆ | `--state-solo` (#8b8fa3) | Single agent, no squad context |

## Sizes

| Size class | Height | Font |
|-----------|--------|------|
| `sm` | 18px | 10px |
| (default) | 24px | 12px |
| `lg` | 32px | 14px |

## CSS

```css
.agent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  white-space: nowrap;
}

.agent-badge-auto {
  background:   rgba(34, 211, 238, 0.12);
  color:        var(--state-auto, #22d3ee);
  border-color: rgba(34, 211, 238, 0.25);
}

.agent-badge-human {
  background:   rgba(251, 191, 36, 0.12);
  color:        var(--state-human, #fbbf24);
  border-color: rgba(251, 191, 36, 0.25);
}

.agent-badge-solo {
  background:   rgba(139, 143, 163, 0.12);
  color:        var(--state-solo, #8b8fa3);
  border-color: rgba(139, 143, 163, 0.25);
}

/* Sizes */
.agent-badge.sm { padding: 1px 6px; font-size: 10px; }
.agent-badge.lg { padding: 4px 12px; font-size: 14px; }
```

## HTML Examples

```html
<!-- Default sizes -->
<span class="agent-badge agent-badge-auto">⚡ auto</span>
<span class="agent-badge agent-badge-human">👤 human</span>
<span class="agent-badge agent-badge-solo">◆ solo</span>

<!-- Small (in team-switcher or compact lists) -->
<span class="agent-badge agent-badge-auto sm">⚡</span>

<!-- Large (agent profile header) -->
<span class="agent-badge agent-badge-human lg">👤 human-gate</span>
```

## Usage in context

**In agent card header**: place badge after agent name, same line.
```html
<h4>planner <span class="agent-badge agent-badge-auto sm">⚡ auto</span></h4>
```

**In team-switcher**: use `sm` to avoid crowding the sidebar item.

**In process list**: show alongside agent slug in the Processes tab.
