# Mention Autocomplete Component

Dropdown that appears when typing `@` (agents/squads) or `#` (tasks) in any text input.

## Anatomy

```
┌─ @write ──────────────────────────┐
│ Agents                             │
│ ● writer       alpha-squad        │  ← highlighted (keyboard/hover)
│   planner      alpha-squad        │
│ Squads                             │
│   bravo-squad                     │
└────────────────────────────────────┘
```

## Trigger rules

| Character | Shows | Groups |
|-----------|-------|--------|
| `@` | Agents, then Squads | "Agents" / "Squads" |
| `#` | Tasks | "Tasks" |

Filter list in real-time as user types after the trigger character.

## HTML Structure

```html
<div class="mention-dropdown" id="mention-dropdown" hidden>
  <!-- Agents group -->
  <div class="mention-group-label">Agents</div>
  <div class="mention-item selected" data-value="@writer" tabindex="-1">
    <span class="mention-item-icon">🤖</span>
    <span class="mention-item-name">writer</span>
    <span class="mention-item-sub">alpha-squad</span>
  </div>
  <div class="mention-item" data-value="@planner" tabindex="-1">
    <span class="mention-item-icon">🤖</span>
    <span class="mention-item-name">planner</span>
    <span class="mention-item-sub">alpha-squad</span>
  </div>

  <!-- Squads group -->
  <div class="mention-group-label">Squads</div>
  <div class="mention-item" data-value="@bravo-squad" tabindex="-1">
    <span class="mention-item-icon">👥</span>
    <span class="mention-item-name">bravo-squad</span>
    <span class="mention-item-sub">squad</span>
  </div>
</div>
```

## CSS

```css
.mention-dropdown {
  position: absolute;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 260px;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.mention-group-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 6px 12px 2px;
  letter-spacing: 0.4px;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s;
}

.mention-item:hover,
.mention-item.selected {
  background: var(--accent-dim);
}

.mention-item-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.mention-item-name {
  font-weight: 500;
  flex: 1;
}

.mention-item-sub {
  font-size: 11px;
  color: var(--text-muted);
}
```

## Keyboard navigation (JS spec)

1. `@` or `#` typed in the input → show dropdown, filter to matching items
2. `ArrowDown` / `ArrowUp` → move `.selected` class between `.mention-item` rows
3. `Enter` → insert selected item's `data-value` + trailing space into the input, close dropdown
4. `Escape` → close dropdown without inserting
5. Click on `.mention-item` → same as Enter
6. Any non-matching char → re-filter, hide if no results

## Resulting inline markup

After insertion, wrap the mention in a `<span>`:

```html
<!-- Agent mention -->
<span class="mention mention-agent" data-slug="writer">@writer</span>

<!-- Squad mention -->
<span class="mention mention-squad" data-slug="bravo-squad">@bravo-squad</span>

<!-- Task mention -->
<span class="mention mention-task" data-slug="write-prd">#write-prd</span>
```

```css
.mention { padding: 1px 4px; border-radius: 3px; font-weight: 500; }
.mention-agent { background: var(--accent-dim); color: var(--accent); }
.mention-squad { background: rgba(34,211,238,0.10); color: var(--cyan, #22d3ee); }
.mention-task  { background: rgba(192,132,252,0.10); color: var(--purple, #c084fc); }
```
