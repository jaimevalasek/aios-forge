# Notification Panel Pattern

Full notification list with filter tabs, grouping by squad, and mark-all-read. Used inside the notification-center component's dropdown.

## Anatomy

```
┌─ Notifications ─────────────────── [Mark all read] ┐
│ [All] [Unread ③] [Mentions] [Errors]                │
├─────────────────────────────────────────────────────┤
│ ● merge_conflict  alpha-squad/dev       2m ago  ●   │  ← unread dot
│   Branch aioson/alpha/writer has conflicts           │
├─────────────────────────────────────────────────────┤
│ ✓ task_completed  bravo-squad/planner   5m ago       │
│   PRD v2 delivered to output port                    │
├─────────────────────────────────────────────────────┤
│ ⚠ context_warning alpha-squad/writer   8m ago  ●    │
│   Context window at 87% — approaching limit          │
└─────────────────────────────────────────────────────┘
```

## HTML Structure

```html
<div class="notif-panel">

  <!-- Header -->
  <div class="notif-header">
    <span class="notif-title">Notifications</span>
    <button class="notif-mark-all">Mark all read</button>
  </div>

  <!-- Filter tabs -->
  <div class="notif-filters">
    <button class="notif-filter active">All</button>
    <button class="notif-filter">
      Unread <span class="notif-filter-badge">3</span>
    </button>
    <button class="notif-filter">Mentions</button>
    <button class="notif-filter">Errors</button>
  </div>

  <!-- Notification list -->
  <div class="notif-list">

    <!-- Unread item -->
    <div class="notif-item unread" data-id="n1" data-type="merge_conflict">
      <div class="notif-type-dot" style="background:#c084fc" title="merge_conflict"></div>
      <div class="notif-body">
        <div class="notif-meta">merge_conflict &nbsp;·&nbsp; alpha-squad/dev</div>
        <div class="notif-summary">Branch aioson/alpha/writer has conflicts</div>
      </div>
      <div class="notif-right">
        <span class="notif-time">2m ago</span>
        <span class="notif-unread-dot"></span>
      </div>
    </div>

    <!-- Read item -->
    <div class="notif-item" data-id="n2" data-type="task_completed">
      <div class="notif-type-dot" style="background:#4ade80" title="task_completed"></div>
      <div class="notif-body">
        <div class="notif-meta">task_completed &nbsp;·&nbsp; bravo-squad/planner</div>
        <div class="notif-summary">PRD v2 delivered to output port</div>
      </div>
      <div class="notif-right">
        <span class="notif-time">5m ago</span>
      </div>
    </div>

    <!-- Squad group (when > 5 items from same squad) -->
    <div class="notif-group">
      <div class="notif-group-header" data-group="gamma-squad">
        <span class="notif-group-name">gamma-squad</span>
        <span class="notif-group-count">6 notifications</span>
        <button class="notif-group-toggle">▼</button>
      </div>
      <div class="notif-group-items">
        <!-- items... -->
      </div>
    </div>

  </div>

  <!-- Empty state -->
  <div class="notif-empty" hidden>
    <div class="notif-empty-icon">🔔</div>
    <div>No notifications</div>
  </div>

</div>
```

## CSS

```css
.notif-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 380px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.notif-title { font-size: 13px; font-weight: 600; }

.notif-mark-all {
  font-size: 11px;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
}

.notif-mark-all:hover { text-decoration: underline; }

/* Filter tabs */
.notif-filters {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.notif-filter {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted);
  transition: all 0.12s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notif-filter:hover { color: var(--text); border-color: var(--border); }

.notif-filter.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent);
}

.notif-filter-badge {
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  font-size: 9px;
  padding: 0 5px;
  font-weight: 700;
  line-height: 14px;
}

/* Notification list */
.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
  align-items: flex-start;
}

.notif-item:hover { background: var(--bg-hover); }
.notif-item:last-child { border-bottom: none; }

.notif-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-body { flex: 1; min-width: 0; }

.notif-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-summary {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text);
}

.notif-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.notif-time {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.notif-unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

/* Grouping */
.notif-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-hover);
  font-size: 12px;
  cursor: pointer;
}

.notif-group-name { font-weight: 500; flex: 1; }
.notif-group-count { font-size: 11px; color: var(--text-muted); }
.notif-group-toggle { background: none; border: none; color: var(--text-muted); cursor: pointer; }
.notif-group-items { display: none; }
.notif-group.open .notif-group-items { display: block; }
.notif-group.open .notif-group-toggle { transform: rotate(180deg); }

/* Empty state */
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 13px;
  gap: 8px;
}

.notif-empty-icon { font-size: 28px; }
```

## Interaction notes

- Filter `Unread` shows only items with `.unread` class. Clicking any item marks it read.
- Filter `Mentions` shows items whose summary contains a `@{currentAgent}` pattern.
- Filter `Errors` shows items with type `error`, `merge_conflict`, or `context_critical`.
- Groups collapse/expand on header click. Groups auto-form when ≥ 5 items share the same `squadSlug`.
- Mark all read: removes `.unread` and `.notif-unread-dot` from all items, resets unread count in notification-center badge.
