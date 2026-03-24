# Agent Message Thread Pattern

Inter-squad message feed. Displays communication between agents across squads in a vertical timeline.

## Layout

Vertical thread, chronological (oldest at top, newest at bottom). Each message: avatar (agent-badge) on left, message bubble on right. Optional timeline connector line between items.

```
 ⚡  ┌─ writer · alpha-squad · 2m ago ─────────────────────┐
     │ Here's the draft PRD. @planner please review §3.     │
     │ Related: #write-prd                                   │
     │ 👍 2  ✅ 1  💬 1 reply                               │
     └───────────────────────────────────────────────────────┘

 👤  ┌─ planner · alpha-squad · 1m ago ─────────────────────┐
     │ Section 3 looks good. Forwarding to @bravo-squad      │
     │ for implementation estimates.                          │
     └───────────────────────────────────────────────────────┘
```

## Message Types

| Type | Visual treatment |
|------|-----------------|
| `message` | Standard bubble |
| `handoff` | Special card: `→ from → to`, summary, task reference |
| `decision` | Highlighted with left border (accent), bold label "Decision" |
| `milestone` | Green left border, italic summary |

## HTML Structure

### Standard message

```html
<div class="thread">

  <!-- Standard message -->
  <div class="thread-msg" data-type="message">
    <div class="thread-msg-avatar">
      <span class="agent-badge agent-badge-auto sm">⚡</span>
    </div>
    <div class="thread-msg-bubble">
      <div class="thread-msg-header">
        writer &nbsp;·&nbsp; alpha-squad &nbsp;·&nbsp; 2m ago
      </div>
      <div class="thread-msg-body">
        Here's the draft PRD.
        <span class="mention mention-agent">@planner</span>
        please review §3. Related:
        <span class="mention mention-task">#write-prd</span>
      </div>
      <div class="thread-reactions">
        <button class="reaction-btn">👍 2</button>
        <button class="reaction-btn">✅ 1</button>
        <button class="reaction-btn">💬 1 reply</button>
      </div>
    </div>
  </div>

  <!-- Handoff message -->
  <div class="thread-msg thread-msg-handoff" data-type="handoff">
    <div class="thread-msg-avatar">
      <span class="agent-badge agent-badge-auto sm">⚡</span>
    </div>
    <div class="thread-msg-bubble">
      <div class="thread-msg-header">orchestrator &nbsp;·&nbsp; 30s ago</div>
      <div class="thread-handoff-card">
        <span class="handoff-from">analyst</span>
        <span class="handoff-arrow">→</span>
        <span class="handoff-to">architect</span>
        <span class="handoff-task">#discovery-phase</span>
      </div>
      <div class="thread-msg-body">Discovery complete. Passing findings to architect.</div>
    </div>
  </div>

  <!-- Decision message -->
  <div class="thread-msg thread-msg-decision" data-type="decision">
    <div class="thread-msg-avatar">
      <span class="agent-badge agent-badge-human sm">👤</span>
    </div>
    <div class="thread-msg-bubble">
      <div class="thread-msg-header">pm &nbsp;·&nbsp; alpha-squad &nbsp;·&nbsp; 5m ago</div>
      <div class="thread-decision-label">Decision</div>
      <div class="thread-msg-body">Use SQLite for local storage. Rationale: zero infra overhead.</div>
    </div>
  </div>

</div>
```

## CSS

```css
.thread {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thread-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.thread-msg-avatar {
  flex-shrink: 0;
  padding-top: 2px;
}

.thread-msg-bubble {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  flex: 1;
  min-width: 0;
}

.thread-msg-header {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.thread-msg-body {
  font-size: 13px;
  line-height: 1.55;
  word-wrap: break-word;
}

/* Mention styles — see mention-autocomplete.md */
.mention { padding: 1px 4px; border-radius: 3px; font-weight: 500; }
.mention-agent { background: var(--accent-dim); color: var(--accent); }
.mention-squad { background: rgba(34,211,238,0.10); color: #22d3ee; }
.mention-task  { background: rgba(192,132,252,0.10); color: #c084fc; }

/* Reactions */
.thread-reactions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.reaction-btn {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-muted);
  transition: border-color 0.15s;
}

.reaction-btn:hover { border-color: var(--accent); color: var(--text); }

/* Handoff card */
.thread-msg-handoff .thread-msg-bubble { border-color: var(--accent); }
.thread-handoff-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
}
.handoff-arrow { color: var(--accent); font-size: 16px; }
.handoff-from, .handoff-to { font-family: monospace; }
.handoff-task { font-size: 11px; color: #c084fc; margin-left: 4px; }

/* Decision card */
.thread-msg-decision .thread-msg-bubble {
  border-left: 3px solid var(--accent);
}
.thread-decision-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

/* Milestone */
.thread-msg[data-type="milestone"] .thread-msg-bubble {
  border-left: 3px solid var(--success);
}
```

## Interaction notes

- "Reply" button expands an inline thread (nested `.thread` with `margin-left: 36px`).
- Reactions are togglable: clicking one you already gave removes it (add `active` class + accent fill).
- For long threads (> 30 messages), virtualize or paginate. Show "Load earlier" at top.
