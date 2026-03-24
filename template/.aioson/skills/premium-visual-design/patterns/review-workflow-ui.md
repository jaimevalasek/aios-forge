# Review Workflow UI Pattern

Full hunk-level code review layout for the Squad Dashboard. Diff viewer + per-hunk approve/reject sidebar.

## Layout

Split view: diff on the left (70%), hunk status sidebar on the right (30%).

```
┌──────────────────────────────────────────┬─────────────────────┐
│ DIFF VIEWER                              │ HUNK STATUS          │
│                                          │                      │
│ ─── Hunk 1/4 [● pending] ────────────── │ 1/4 hunks reviewed  │
│ @@ -12,8 +12,10 @@                       │ ──────────────────── │
│   context line                           │ ✓ Hunk 1  approved  │
│ - removed line                           │ ● Hunk 2  pending   │
│ + added line                             │ ✗ Hunk 3  rejected  │
│ [✓ Approve] [✗ Reject] [💬]            │ ● Hunk 4  pending   │
│                                          │                      │
│ ─── Hunk 2/4 [● pending] ────────────── │ ──────────────────── │
│ @@ -45,7 +45,9 @@                        │ [Submit Review]      │
│   ...                                    │                      │
└──────────────────────────────────────────┴─────────────────────┘
```

## HTML Structure

```html
<div class="review-layout">

  <!-- Progress bar at top -->
  <div class="review-progress">
    <span class="review-progress-label">1 / 4 hunks reviewed</span>
    <div class="review-progress-bar">
      <div class="review-progress-fill" style="width: 25%"></div>
    </div>
  </div>

  <div class="review-split">

    <!-- Left: Diff viewer -->
    <div class="review-diff-panel">

      <!-- Hunk 1 — approved -->
      <div class="diff-hunk approved" data-hunk="1" data-status="approved">
        <div class="diff-hunk-header">
          <span class="diff-hunk-title">Hunk 1/4</span>
          <code class="diff-hunk-range">@@ -12,8 +12,10 @@</code>
          <span class="diff-hunk-status-badge status-approved">✓ approved</span>
        </div>
        <div class="diff-lines">
          <div class="diff-line diff-context">  context line</div>
          <div class="diff-line diff-remove">- removed line</div>
          <div class="diff-line diff-add">+ added line</div>
        </div>
        <!-- action bar from review-action-bar.md -->
      </div>

      <!-- Hunk 2 — pending -->
      <div class="diff-hunk" data-hunk="2" data-status="pending">
        <!-- ... -->
      </div>

    </div>

    <!-- Right: Status sidebar -->
    <div class="review-sidebar">
      <div class="review-sidebar-header">Hunks</div>
      <div class="review-hunk-list">
        <div class="review-hunk-item approved" data-hunk="1">
          <span class="review-hunk-icon">✓</span>
          <span class="review-hunk-label">Hunk 1</span>
          <span class="review-hunk-status">approved</span>
        </div>
        <div class="review-hunk-item pending active" data-hunk="2">
          <span class="review-hunk-icon">●</span>
          <span class="review-hunk-label">Hunk 2</span>
          <span class="review-hunk-status">pending</span>
        </div>
        <div class="review-hunk-item rejected" data-hunk="3">
          <span class="review-hunk-icon">✗</span>
          <span class="review-hunk-label">Hunk 3</span>
          <span class="review-hunk-status">rejected</span>
        </div>
      </div>
      <div class="review-sidebar-footer">
        <button class="review-submit-btn" disabled>Submit Review</button>
        <div class="review-submit-hint">Review all hunks to submit</div>
      </div>
    </div>

  </div>
</div>
```

## CSS

```css
/* Layout */
.review-layout { display: flex; flex-direction: column; gap: 16px; }

.review-split {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: flex-start;
}

/* Progress bar */
.review-progress { display: flex; align-items: center; gap: 12px; }
.review-progress-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.review-progress-bar { flex: 1; height: 4px; background: var(--bg-hover); border-radius: 2px; }
.review-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s; }

/* Diff panel */
.diff-hunk {
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.diff-hunk.approved {
  border-color: var(--success);
  background: rgba(74, 222, 128, 0.04);
}

.diff-hunk.rejected {
  border-color: var(--danger);
  background: rgba(248, 113, 113, 0.04);
}

.diff-hunk.revised {
  border-color: var(--warning);
  background: rgba(251, 191, 36, 0.04);
}

.diff-hunk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-hover);
  font-size: 12px;
}

.diff-hunk-title { font-weight: 600; }
.diff-hunk-range { font-family: monospace; color: var(--text-muted); flex: 1; }

.diff-hunk-status-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
}

.diff-hunk-status-badge.status-approved { background: rgba(74,222,128,0.15); color: var(--success); }
.diff-hunk-status-badge.status-rejected { background: rgba(248,113,113,0.15); color: var(--danger); }
.diff-hunk-status-badge.status-pending  { background: var(--bg-hover); color: var(--text-muted); }

.diff-lines { overflow-x: auto; }
.diff-line { font-family: monospace; font-size: 12px; padding: 1px 12px; line-height: 1.6; }
.diff-add     { background: rgba(74, 222, 128, 0.10); color: var(--success); }
.diff-remove  { background: rgba(248, 113, 113, 0.10); color: var(--danger); }
.diff-context { color: var(--text-muted); }

/* Sidebar */
.review-sidebar {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  position: sticky;
  top: 16px;
}

.review-sidebar-header {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}

.review-hunk-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }

.review-hunk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.review-hunk-item:hover { background: var(--bg-hover); }
.review-hunk-item.active { background: var(--accent-dim); }

.review-hunk-icon { font-size: 13px; flex-shrink: 0; }
.review-hunk-label { flex: 1; }
.review-hunk-status { font-size: 11px; color: var(--text-muted); }

.review-hunk-item.approved .review-hunk-icon { color: var(--success); }
.review-hunk-item.rejected .review-hunk-icon { color: var(--danger); }

.review-sidebar-footer { border-top: 1px solid var(--border); padding-top: 12px; }

.review-submit-btn {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.review-submit-btn:disabled {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
}

.review-submit-hint { font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 6px; }
```

## Interaction notes

- Clicking a hunk in the sidebar scrolls the diff panel to that hunk.
- Submit becomes enabled only when all hunks have a status (approved/rejected/revised).
- If any hunks are rejected, submit posts a `task_needs_revision` event with the list of rejected hunk IDs.
- If all hunks are approved, submit posts a `task_done` event.
