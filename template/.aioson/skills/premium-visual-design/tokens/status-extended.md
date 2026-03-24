# Status Extended Tokens

Extended state and status tokens for Squad Dashboard v3 inter-squad UI.

## Agent & Task State Tokens

```css
:root {
  /* --- Blocked --- */
  --state-blocked:        #f87171;
  --state-blocked-bg:     rgba(248, 113, 113, 0.12);
  --state-blocked-border: rgba(248, 113, 113, 0.30);

  /* --- Ready --- */
  --state-ready:          #4ade80;
  --state-ready-bg:       rgba(74, 222, 128, 0.12);
  --state-ready-border:   rgba(74, 222, 128, 0.30);

  /* --- Solo (no squad context) --- */
  --state-solo:           #8b8fa3;
  --state-solo-bg:        rgba(139, 143, 163, 0.12);
  --state-solo-border:    rgba(139, 143, 163, 0.25);

  /* --- Auto (fully autonomous agent) --- */
  --state-auto:           #22d3ee;
  --state-auto-bg:        rgba(34, 211, 238, 0.12);
  --state-auto-border:    rgba(34, 211, 238, 0.30);

  /* --- Human (human-in-the-loop) --- */
  --state-human:          #fbbf24;
  --state-human-bg:       rgba(251, 191, 36, 0.12);
  --state-human-border:   rgba(251, 191, 36, 0.30);

  /* --- Review (awaiting review) --- */
  --state-review:         #c084fc;
  --state-review-bg:      rgba(192, 132, 252, 0.12);
  --state-review-border:  rgba(192, 132, 252, 0.30);

  /* --- Running (animated pulse) --- */
  --state-running:        #6c8aff;
  --state-running-bg:     rgba(108, 138, 255, 0.12);

  /* --- Idle --- */
  --state-idle:           #8b8fa3;
  --state-idle-bg:        rgba(139, 143, 163, 0.10);

  /* --- Error --- */
  --state-error:          #f87171;
  --state-error-bg:       rgba(248, 113, 113, 0.12);

  /* --- Done --- */
  --state-done:           #4ade80;
  --state-done-bg:        rgba(74, 222, 128, 0.10);
}
```

## Running Pulse Animation

Apply to indicators when `state = running`:

```css
@keyframes state-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

.state-dot-running {
  background: var(--state-running);
  animation: state-pulse 1.6s ease-in-out infinite;
}
```

## Agent Type Tokens

Used by `agent-badge` component.

| Type | Token | Color |
|------|-------|-------|
| `auto` | `--state-auto` | Cyan `#22d3ee` |
| `human` | `--state-human` | Amber `#fbbf24` |
| `solo` | `--state-solo` | Muted `#8b8fa3` |

## Priority Tokens

```css
:root {
  --priority-critical: #f87171;   /* red */
  --priority-high:     #fb923c;   /* orange */
  --priority-medium:   #fbbf24;   /* amber */
  --priority-low:      #8b8fa3;   /* muted */
}
```

## Notification Type Tokens

Map event types to colors for notification icons:

| Event type | Token | Notes |
|-----------|-------|-------|
| `info` | `--accent` `#6c8aff` | General info |
| `warning` | `--warning` `#fbbf24` | Soft warning |
| `error` | `--danger` `#f87171` | Errors |
| `success` | `--success` `#4ade80` | Completions |
| `merge_conflict` | `--purple` `#c084fc` | Git conflicts |
| `context_warning` | `--warning` | Context at 85% |
| `context_critical` | `--danger` | Context at 95% |
| `task_completed` | `--success` | Task done |
| `task_needs_revision` | `--state-review` | Hunk rejected |
| `handoff` | `--accent` | Agent handoff |
| `decision` | `--cyan` `#22d3ee` | Decision recorded |

## Usage

Reference tokens in component CSS. Always fall back gracefully:

```css
.task-status-badge[data-status="blocked"] {
  background: var(--state-blocked-bg);
  color:      var(--state-blocked);
  border:     1px solid var(--state-blocked-border);
}
```

Map exhaustive status values:

```javascript
const STATE_TOKEN = {
  blocked:  'blocked',
  ready:    'ready',
  solo:     'solo',
  auto:     'auto',
  human:    'human',
  review:   'review',
  running:  'running',
  idle:     'idle',
  error:    'error',
  done:     'done',
  pending:  'idle',    // alias
  active:   'running', // alias
  completed:'done'     // alias
};
```
