'use strict';

function getInlineCSS() {
  return `
:root {
  --bg: #0f1117;
  --bg-card: #1a1d27;
  --bg-hover: #222632;
  --border: #2a2e3a;
  --text: #e1e4eb;
  --text-muted: #8b8fa3;
  --accent: #6c8aff;
  --accent-dim: rgba(108,138,255,0.15);
  --success: #4ade80;
  --success-dim: rgba(74,222,128,0.15);
  --warning: #fbbf24;
  --warning-dim: rgba(251,191,36,0.15);
  --danger: #f87171;
  --danger-dim: rgba(248,113,113,0.15);
  --radius: 8px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Layout */
.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 240px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 20px 0;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  overflow-y: auto;
}
.main { margin-left: 240px; padding: 24px; flex: 1; width: calc(100% - 240px); }

.sidebar h1 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.sidebar a {
  display: block;
  padding: 8px 20px;
  color: var(--text);
  font-size: 14px;
  transition: background 0.15s;
}
.sidebar a:hover { background: var(--bg-hover); text-decoration: none; }
.sidebar a.active { background: var(--accent-dim); color: var(--accent); border-right: 2px solid var(--accent); }
.sidebar .squad-mode {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--accent-dim);
  color: var(--accent);
  margin-left: 6px;
  vertical-align: middle;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.page-header h2 { font-size: 20px; font-weight: 600; }
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.badge-content { background: var(--accent-dim); color: var(--accent); }
.badge-software { background: var(--success-dim); color: var(--success); }
.badge-research { background: var(--warning-dim); color: var(--warning); }
.badge-mixed { background: var(--bg-hover); color: var(--text-muted); }

/* Cards */
.grid { display: grid; gap: 16px; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.card h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}
.card .value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}
.card .sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}
.tab {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: var(--font);
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-content { display: none; }
.tab-content.active { display: block; }

/* Table */
table { width: 100%; border-collapse: collapse; }
th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  letter-spacing: 0.3px;
}
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
tr:hover td { background: var(--bg-hover); }

/* Status dots */
.status-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.status-active { background: var(--success); }
.status-stale { background: var(--warning); }
.status-error { background: var(--danger); }
.status-inactive { background: var(--text-muted); }

/* Timeline */
.timeline { border-left: 2px solid var(--border); margin-left: 12px; padding-left: 20px; }
.timeline-item { position: relative; padding-bottom: 16px; }
.timeline-item::before {
  content: '';
  position: absolute;
  left: -25px; top: 6px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
}
.timeline-item .time { font-size: 11px; color: var(--text-muted); }
.timeline-item .event { font-size: 13px; }

/* Empty state */
.empty {
  text-align: center;
  padding: 48px 20px;
  color: var(--text-muted);
}
.empty h3 { font-size: 16px; margin-bottom: 8px; color: var(--text); }

/* Progress bar */
.progress-bar {
  height: 6px;
  background: var(--bg-hover);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s;
}

/* Context category colors */
:root {
  --ctx-system:  #6c8aff;
  --ctx-history: #4ade80;
  --ctx-tools:   #fbbf24;
  --ctx-files:   #c084fc;
  --ctx-inline:  #22d3ee;
  --ctx-other:   #64748b;
}

/* Context donut widget */
.ctx-donut-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.ctx-donut-svg { flex-shrink: 0; }
.ctx-donut-track { fill: none; stroke: var(--bg-hover); stroke-width: 10; }
.ctx-legend { display: flex; flex-direction: column; gap: 4px; }
.ctx-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}
.ctx-legend-dot {
  width: 8px; height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.ctx-center-text { font-size: 13px; font-weight: 700; fill: var(--text); }
.ctx-center-sub  { font-size: 7px; fill: var(--text-muted); }

/* Warning level badges */
.ctx-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.ctx-badge-normal   { background: var(--success-dim); color: var(--success); }
.ctx-badge-warning  { background: var(--warning-dim); color: var(--warning); }
.ctx-badge-critical { background: var(--danger-dim);  color: var(--danger);  }
.ctx-badge-overflow { background: var(--danger); color: #fff; }
.ctx-badge-unknown  { background: var(--bg-hover); color: var(--text-muted); }

/* Token stacked bar */
.token-bar-wrap { margin-top: 8px; }
.token-stacked-bar {
  display: flex;
  height: 14px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-hover);
}
.token-bar-seg { height: 100%; transition: width 0.3s; }
.token-bar-seg:first-child { border-radius: 4px 0 0 4px; }
.token-bar-seg:last-child  { border-radius: 0 4px 4px 0; }
.token-bar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 6px;
}
.token-bar-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
}
.token-bar-legend-dot {
  width: 8px; height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Waste hint */
.waste-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--warning-dim);
  border: 1px solid var(--warning);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--warning);
  margin-top: 8px;
}

/* Process panel */
.proc-pid { font-family: monospace; font-size: 12px; color: var(--text-muted); }
.proc-elapsed { font-family: monospace; font-size: 12px; }
.proc-stop-btn {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  background: var(--danger-dim);
  color: var(--danger);
  border: 1px solid var(--danger);
  transition: background 0.15s;
}
.proc-stop-btn:hover { background: var(--danger); color: #fff; }

/* Autonomy badges */
.autonomy-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  vertical-align: middle;
}
.autonomy-auto    { background: var(--success-dim);  color: var(--success);  border: 1px solid var(--success); }
.autonomy-semi    { background: var(--warning-dim);  color: var(--warning);  border: 1px solid var(--warning); }
.autonomy-approve { background: var(--accent-dim);   color: var(--accent);   border: 1px solid var(--accent); }

.autonomy-select {
  font-size: 12px;
  background: var(--bg-hover);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
}
.autonomy-select:focus { outline: none; border-color: var(--accent); }

/* Agent cards (tasks panel) */
.agent-card { padding: 14px 16px; }
.agent-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px; flex-wrap: wrap; }
.agent-card-slug { font-size: 11px; color: var(--text-muted); font-family: monospace; }
.agent-role { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.agent-focus { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.tag { font-size: 11px; padding: 1px 7px; border-radius: 99px; background: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border); }
.agent-autonomy-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.agent-autonomy-label { font-size: 11px; color: var(--text-muted); }

/* Execution logs timeline */
.log-session {}
.log-session-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.log-summary { font-size: 12px; color: var(--text-muted); font-style: italic; }
.log-timeline { display: flex; flex-direction: column; gap: 6px; }
.log-entry { padding: 8px 10px; border-radius: var(--radius); border-left: 3px solid var(--border); font-size: 13px; }
.log-entry-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.log-icon { font-size: 14px; flex-shrink: 0; }
.log-ts { font-size: 11px; color: var(--text-muted); margin-left: auto; font-family: monospace; }
.log-dur { font-size: 11px; color: var(--text-muted); font-family: monospace; }
.log-tool-name { font-family: monospace; color: var(--accent); }
.log-tool-call { border-left-color: var(--accent); background: rgba(108,138,255,0.04); }
.log-reasoning { border-left-color: var(--text-muted); background: rgba(139,143,163,0.07); }
.log-reasoning-text { font-size: 12px; color: var(--text-muted); margin-top: 4px; line-height: 1.5; white-space: pre-wrap; }
.log-milestone { border-left-color: var(--success); background: var(--success-dim); }
.log-error { border-left-color: var(--danger); background: var(--danger-dim); }
.log-error-msg { color: var(--danger); font-family: monospace; }
.log-toggle {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: var(--bg-hover);
  color: var(--text-muted);
  border: 1px solid var(--border);
  margin-left: 4px;
}
.log-toggle:hover { color: var(--text); }
.log-detail { margin-top: 8px; }
.log-section-label { font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-top: 6px; margin-bottom: 2px; letter-spacing: 0.05em; }
.log-pre { font-size: 11px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 8px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }
.log-stack { color: var(--danger); }

/* Responsive */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { margin-left: 0; width: 100%; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}
`;
}

function getInlineJS() {
  return `
(function() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var group = this.closest('.tab-group');
      group.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      group.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
      var target = document.getElementById(this.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Processes: elapsed timers
  function updateElapsed() {
    document.querySelectorAll('.proc-elapsed[data-startedat]').forEach(function(el) {
      var startedAt = el.dataset.startedat;
      if (!startedAt) { el.textContent = '—'; return; }
      var elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      if (isNaN(elapsed) || elapsed < 0) { el.textContent = '—'; return; }
      if (elapsed < 60) el.textContent = elapsed + 's';
      else if (elapsed < 3600) el.textContent = Math.floor(elapsed / 60) + 'm' + (elapsed % 60) + 's';
      else el.textContent = Math.floor(elapsed / 3600) + 'h' + Math.floor((elapsed % 3600) / 60) + 'm';
    });
  }
  updateElapsed();
  setInterval(updateElapsed, 1000);

  // Processes: SSE live updates
  if (typeof EventSource !== 'undefined') {
    var sse = new EventSource('/api/events/processes');
    sse.onmessage = function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data && data.processes) {
          // Simple refresh: reload if we're on the processes tab
          var procTab = document.getElementById('panel-processes');
          if (procTab && procTab.classList.contains('active')) {
            // Could do DOM diff here; for now just mark stale
          }
        }
      } catch(err) { /* ignore */ }
    };
  }

  // Processes: stop handler
  window.procStop = function(pid) {
    if (!window.confirm('Stop process ' + pid + '?')) return;
    fetch('/api/processes/' + pid + '/stop', { method: 'POST' })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.ok) {
          var btn = document.querySelector('[data-pid="' + pid + '"]');
          if (btn) {
            btn.disabled = true;
            btn.textContent = 'Stopped';
            btn.style.opacity = '0.5';
            var row = btn.closest('tr');
            if (row) {
              var statusCell = row.querySelector('td:first-child');
              if (statusCell) {
                statusCell.innerHTML = '<span class="status-dot status-inactive"></span>stopped';
              }
            }
          }
        } else {
          alert('Failed to stop process: ' + (result.error || 'Unknown error'));
        }
      })
      .catch(function() { alert('Request failed'); });
  };

  // Execution logs: toggle input/output detail
  window.toggleLogDetail = function(btn) {
    var entry = btn.closest('.log-entry');
    var detail = entry && entry.querySelector('.log-detail');
    if (!detail) return;
    var open = detail.style.display !== 'none';
    detail.style.display = open ? 'none' : 'block';
    btn.textContent = open ? '▶ input/output' : '▼ input/output';
  };

  // Autonomy selector: POST level change
  window.setAutonomy = function(agentSlug, level) {
    var slug = document.body.dataset.squad;
    if (!slug) return;
    fetch('/api/squads/' + encodeURIComponent(slug) + '/agents/' + encodeURIComponent(agentSlug) + '/autonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autonomyLevel: level })
    }).then(function(r) { return r.json(); })
      .then(function(result) {
        if (!result.ok) { console.warn('setAutonomy failed', result); }
      })
      .catch(function() {});
  };

  // Auto-refresh
  var slug = document.body.dataset.squad;
  if (slug) {
    setInterval(function() {
      fetch('/api/squad/' + slug + '/data.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.metrics) {
            Object.keys(data.metrics).forEach(function(key) {
              var el = document.getElementById('metric-' + key);
              if (el) el.textContent = data.metrics[key];
            });
          }
        })
        .catch(function() {});
    }, 10000);
  }
})();
`;
}

module.exports = { getInlineCSS, getInlineJS };
