# Team Switcher Component

Sidebar squad navigation. Shows all squads, highlights the active one, displays mode badge and agent count.

## Anatomy

```
─ Squads ─────────────────
  ● Alpha Squad  [software]  3 agents   ← active (accent border + bg)
    Bravo Squad  [content]   2 agents
    Gamma Squad  [research]  1 agent
──────────────────────────
  + New Squad
```

## HTML Structure

```html
<nav class="team-switcher">
  <div class="team-switcher-header">Squads</div>

  <a class="team-item active" href="/squad/alpha">
    <div class="team-name">Alpha Squad</div>
    <div class="team-meta">
      <span class="mode-badge mode-software">software</span>
      <span class="agent-count">3 agents</span>
    </div>
  </a>

  <a class="team-item" href="/squad/bravo">
    <div class="team-name">Bravo Squad</div>
    <div class="team-meta">
      <span class="mode-badge mode-content">content</span>
      <span class="agent-count">2 agents</span>
    </div>
  </a>

  <div class="team-switcher-divider"></div>
  <a class="team-item team-item-new" href="/squad/new">+ New Squad</a>
</nav>
```

## CSS

```css
.team-switcher {
  width: 240px;
}

.team-switcher-header {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 16px 8px;
  letter-spacing: 0.5px;
}

.team-item {
  display: block;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  color: var(--text);
  margin: 1px 8px;
  border-left: 2px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}

.team-item:hover {
  background: var(--bg-hover);
  text-decoration: none;
}

.team-item.active {
  background: var(--accent-dim);
  border-left-color: var(--accent);
  color: var(--accent);
}

.team-item.active .team-name { color: var(--accent); }

.team-name {
  font-size: 13px;
  font-weight: 500;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

/* Mode badges */
.mode-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 500;
}

.mode-software { background: rgba(74, 222, 128, 0.15); color: var(--success); }
.mode-content  { background: rgba(108, 138, 255, 0.15); color: var(--accent); }
.mode-research { background: rgba(251, 191, 36, 0.15);  color: var(--warning); }
.mode-mixed    { background: var(--bg-hover); color: var(--text-muted); }

.agent-count {
  font-size: 11px;
  color: var(--text-muted);
}

.team-switcher-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 16px;
}

.team-item-new {
  font-size: 12px;
  color: var(--text-muted);
}

.team-item-new:hover { color: var(--accent); }
```

## Interaction notes

- Active item has `border-left: 2px solid var(--accent)` — requires `margin-left: 8px` on items to preserve alignment.
- On narrow screens (< 768px) the sidebar hides; team switcher may move to a top dropdown.
- Optionally show an unread notification dot on squad items: small `6px` circle (accent color) after the agent count.
