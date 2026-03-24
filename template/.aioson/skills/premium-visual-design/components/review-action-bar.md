# Review Action Bar Component

Approve / Reject / Comment bar shown at the bottom of each diff hunk in the review workflow.

## Anatomy

```
┌────────────────────────────────────────────────────────┐
│ Hunk 2/4 · @@ -45,7 +45,9 @@       [✓ Approve] [✗ Reject] [💬 Comment] │
└────────────────────────────────────────────────────────┘
```

## States

| State | Approve btn | Reject btn | Comment btn |
|-------|------------|-----------|------------|
| `pending` | outlined | outlined | outlined |
| `approved` | filled green | dimmed | dimmed |
| `rejected` | dimmed | filled red | normal (comment may be shown) |
| `revised` | outlined | outlined | amber tint |

## HTML Structure

```html
<div class="review-action-bar" data-hunk-id="hunk-2" data-status="pending">
  <span class="review-hunk-label">Hunk 2/4 &nbsp;·&nbsp; @@ -45,7 +45,9 @@</span>

  <div class="review-actions">
    <button class="review-btn approve" data-action="approve">
      ✓ Approve
    </button>
    <button class="review-btn reject" data-action="reject">
      ✗ Reject
    </button>
    <button class="review-btn comment" data-action="comment">
      💬 Comment
    </button>
  </div>
</div>

<!-- Comment expansion (hidden by default, shown when comment clicked) -->
<div class="review-comment-box" hidden>
  <textarea class="review-comment-input" placeholder="Leave a comment..."></textarea>
  <div class="review-comment-actions">
    <button class="review-btn comment active">Send</button>
    <button class="review-btn" data-action="cancel-comment">Cancel</button>
  </div>
</div>
```

## CSS

```css
.review-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
  border-radius: 0 0 6px 6px;
}

.review-hunk-label {
  flex: 1;
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.review-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: none;
  color: var(--text-muted);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.review-btn:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

/* Approve */
.review-btn.approve:hover,
.review-btn.approve.active {
  background: rgba(74, 222, 128, 0.15);
  color: var(--success);
  border-color: var(--success);
}

/* Reject */
.review-btn.reject:hover,
.review-btn.reject.active {
  background: rgba(248, 113, 113, 0.15);
  color: var(--danger);
  border-color: var(--danger);
}

/* Comment */
.review-btn.comment:hover,
.review-btn.comment.active {
  background: rgba(192, 132, 252, 0.15);
  color: var(--purple, #c084fc);
  border-color: var(--purple, #c084fc);
}

.review-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Comment box */
.review-comment-box {
  padding: 10px 12px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.review-comment-input {
  width: 100%;
  min-height: 64px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-size: 13px;
  padding: 8px 10px;
  resize: vertical;
  font-family: var(--font, monospace);
}

.review-comment-input:focus {
  outline: none;
  border-color: var(--accent);
}

.review-comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}
```

## Progress Indicator

Show overall review progress above the hunk list:

```html
<div class="review-progress">
  <span class="review-progress-label">2 / 4 hunks reviewed</span>
  <div class="review-progress-bar">
    <div class="review-progress-fill" style="width: 50%"></div>
  </div>
</div>
```

```css
.review-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.review-progress-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.review-progress-bar { flex: 1; height: 4px; background: var(--bg-hover); border-radius: 2px; }
.review-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s; }
/* All done: green */
[data-all-done] .review-progress-fill { background: var(--success); }
```

## Interaction notes

- When `approve` is clicked, add `.active` to approve btn, add `disabled` to reject.
- When `reject` is clicked, add `.active` to reject btn, optionally auto-open comment box for rejection reason.
- Click outside comment box or Cancel: collapse it, clear textarea.
- Sending a comment does NOT change approval state — it's independent.
