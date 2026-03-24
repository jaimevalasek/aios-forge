# Notification Center Component

Bell icon with unread count badge + toggle for the notification panel dropdown.

## Anatomy

```
  🔔 [3]       ← no notifications: 🔔 only
  🔔 [!]       ← critical: red badge
```

## States

| State | Bell | Badge |
|-------|------|-------|
| No notifications | muted color | hidden |
| Has unread | normal color | accent bg, count |
| Has critical unread | normal color | red bg, count |
| Panel open | accent bg | same |

## HTML Structure

```html
<div class="notif-center">
  <button class="notif-bell" id="notif-bell" aria-label="Notifications" aria-expanded="false">
    <!-- Bell SVG or emoji -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  </button>

  <!-- Badge — hidden when count = 0 -->
  <span class="notif-badge" id="notif-badge" hidden>3</span>

  <!-- Panel wrapper — shown on bell click -->
  <div class="notif-panel-wrapper" id="notif-panel-wrapper">
    <!-- Insert notification-panel.md pattern here -->
  </div>
</div>
```

## CSS

```css
.notif-center {
  position: relative;
  display: inline-flex;
}

.notif-bell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  background: none;
  border: none;
  transition: background 0.15s, color 0.15s;
}

.notif-bell:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.notif-bell[aria-expanded="true"] {
  background: var(--accent-dim);
  color: var(--accent);
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  padding: 0 4px;
  pointer-events: none;
}

.notif-badge.critical {
  background: var(--danger);
}

.notif-panel-wrapper {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 500;
  display: none;
}

.notif-panel-wrapper.open {
  display: block;
}
```

## Interaction (JS spec)

```javascript
// Toggle panel on bell click
bellBtn.addEventListener('click', function() {
  const isOpen = wrapper.classList.toggle('open');
  bellBtn.setAttribute('aria-expanded', String(isOpen));
});

// Close on outside click
document.addEventListener('click', function(e) {
  if (!notifCenter.contains(e.target)) {
    wrapper.classList.remove('open');
    bellBtn.setAttribute('aria-expanded', 'false');
  }
});

// Update badge
function setNotifCount(count, hasCritical) {
  badge.hidden = count === 0;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('critical', hasCritical);
}
```

## Placement

Place in the top-right of the dashboard header bar. Keep 8px gap from other header icons.
