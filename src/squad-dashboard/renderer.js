'use strict';

const { getInlineCSS, getInlineJS } = require('./styles');
const { CATEGORIES } = require('./context-monitor');
const { TOKEN_CATEGORIES } = require('./token-tracker');

// CSS color variables per category (must match styles.js :root)
const CTX_COLORS = {
  system_prompt:        'var(--ctx-system)',
  conversation_history: 'var(--ctx-history)',
  tool_outputs:         'var(--ctx-tools)',
  files_loaded:         'var(--ctx-files)',
  inline_data:          'var(--ctx-inline)',
  other:                'var(--ctx-other)'
};

const TOKEN_COLORS = {
  input_tokens:   'var(--ctx-system)',
  output_tokens:  'var(--ctx-history)',
  tool_use_input: 'var(--ctx-tools)',
  tool_outputs:   'var(--ctx-files)',
  cache_write:    'var(--ctx-inline)',
  cache_read:     'var(--ctx-other)'
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function modeBadge(mode) {
  const cls = ({ content: 'badge-content', software: 'badge-software', research: 'badge-research' })[mode] || 'badge-mixed';
  return `<span class="badge ${cls}">${esc(mode)}</span>`;
}

function statusDot(status) {
  const cls = ({
    active: 'status-active', completed: 'status-active',
    stale: 'status-stale', running: 'status-stale',
    error: 'status-error', failed: 'status-error'
  })[status] || 'status-inactive';
  return `<span class="status-dot ${cls}"></span>`;
}

function progressBar(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  <div class="sub">${current}/${total} (${pct}%)</div>`;
}

// --- Context & Token widgets ---

/**
 * SVG donut chart for context usage of a single agent.
 * @param {object} agent  — enriched agent data from context-monitor
 */
function renderContextDonut(agent) {
  if (!agent) return '';
  const cats = agent.categories || {};
  const total = agent.totalUsed || 0;
  const windowSize = agent.windowSize || 0;
  const pct = windowSize > 0 ? Math.round((total / windowSize) * 100) : 0;

  // SVG donut via stroke-dasharray on a circle (r=30, cx=40, cy=40)
  const r = 30;
  const circumference = 2 * Math.PI * r; // ≈188.5
  let offset = 0;
  const segments = CATEGORIES.map(key => {
    const val = cats[key] || 0;
    const len = total > 0 ? (val / total) * circumference : 0;
    const seg = `<circle
      r="${r}" cx="40" cy="40"
      fill="none"
      stroke="${CTX_COLORS[key]}"
      stroke-width="10"
      stroke-dasharray="${len.toFixed(2)} ${(circumference - len).toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}"
      transform="rotate(-90 40 40)"
    />`;
    offset += len;
    return seg;
  });

  const levelBadge = `<span class="ctx-badge ctx-badge-${agent.warningLevel || 'unknown'}">${agent.warningLevel || 'unknown'}</span>`;

  const legend = CATEGORIES.map(key => {
    const val = cats[key] || 0;
    if (val === 0) return '';
    const kPct = total > 0 ? Math.round((val / total) * 100) : 0;
    const label = key.replace(/_/g, ' ');
    return `<div class="ctx-legend-item">
      <span class="ctx-legend-dot" style="background:${CTX_COLORS[key]}"></span>
      ${esc(label)}: ${kPct}%
    </div>`;
  }).join('');

  return `<div class="ctx-donut-wrap">
    <svg class="ctx-donut-svg" width="80" height="80" viewBox="0 0 80 80">
      <circle r="${r}" cx="40" cy="40" fill="none" stroke="var(--bg-hover)" stroke-width="10" class="ctx-donut-track"/>
      ${segments.join('')}
      <text x="40" y="38" text-anchor="middle" class="ctx-center-text">${pct}%</text>
      <text x="40" y="49" text-anchor="middle" class="ctx-center-sub">of window</text>
    </svg>
    <div>
      <div style="margin-bottom:6px">${levelBadge}</div>
      <div class="ctx-legend">${legend || '<span style="font-size:11px;color:var(--text-muted)">No data</span>'}</div>
    </div>
  </div>`;
}

/**
 * Stacked bar chart for token usage across sessions.
 * @param {Array} sessions  — enriched session objects from token-tracker
 * @param {boolean} wasteFlag
 */
function renderTokenStackedBar(sessions, wasteFlag) {
  if (!sessions || sessions.length === 0) {
    return '<div style="font-size:12px;color:var(--text-muted)">No session data</div>';
  }

  // Aggregate all sessions into a single breakdown for the bar
  const agg = {};
  for (const key of TOKEN_CATEGORIES) agg[key] = 0;
  for (const session of sessions) {
    const bd = session.breakdown || {};
    for (const key of TOKEN_CATEGORIES) agg[key] += bd[key] || 0;
  }
  const grandTotal = TOKEN_CATEGORIES.reduce((s, k) => s + agg[k], 0);

  const segments = TOKEN_CATEGORIES.map(key => {
    const w = grandTotal > 0 ? ((agg[key] / grandTotal) * 100).toFixed(1) : 0;
    if (w <= 0) return '';
    return `<div class="token-bar-seg" style="width:${w}%;background:${TOKEN_COLORS[key]}" title="${key}: ${agg[key].toLocaleString()} tokens"></div>`;
  }).join('');

  const legendItems = TOKEN_CATEGORIES.map(key => {
    if (!agg[key]) return '';
    const label = key.replace(/_/g, ' ');
    return `<div class="token-bar-legend-item">
      <span class="token-bar-legend-dot" style="background:${TOKEN_COLORS[key]}"></span>
      ${esc(label)}
    </div>`;
  }).join('');

  const waste = wasteFlag
    ? `<div class="waste-hint">⚠ High tool output ratio — consider summarizing tool results to reduce token waste</div>`
    : '';

  return `<div class="token-bar-wrap">
    <div class="token-stacked-bar">${segments}</div>
    <div class="token-bar-legend">${legendItems}</div>
    ${waste}
  </div>`;
}

// --- Autonomy level ---

const AUTONOMY_LEVELS = {
  autonomous:      { label: 'Autonomous',    icon: '🤖', css: 'autonomy-auto' },
  semi:            { label: 'Semi',          icon: '🤝', css: 'autonomy-semi' },
  'approve-each':  { label: 'Approve Each',  icon: '👤', css: 'autonomy-approve' }
};

function autonomyBadge(level) {
  const info = AUTONOMY_LEVELS[level] || AUTONOMY_LEVELS['semi'];
  return `<span class="autonomy-badge ${info.css}">${info.icon} ${esc(info.label)}</span>`;
}

function autonomySelector(agentSlug, currentLevel) {
  const opts = Object.entries(AUTONOMY_LEVELS).map(([val, info]) =>
    `<option value="${val}"${currentLevel === val ? ' selected' : ''}>${info.icon} ${esc(info.label)}</option>`
  ).join('');
  return `<select class="autonomy-select" data-agent="${esc(agentSlug)}" onchange="setAutonomy('${esc(agentSlug)}',this.value)">${opts}</select>`;
}

// --- Execution logs timeline ---

const ENTRY_ICONS = {
  tool_call:  '🔧',
  reasoning:  '💭',
  milestone:  '🏁',
  error:      '🔴'
};

function renderEntryToolCall(entry) {
  const inputStr = entry.input != null ? JSON.stringify(entry.input, null, 2) : '';
  const outputStr = entry.output != null ? JSON.stringify(entry.output, null, 2) : '';
  const dur = entry.durationMs != null ? `<span class="log-dur">${entry.durationMs}ms</span>` : '';
  return `<div class="log-entry log-tool-call">
  <div class="log-entry-header">
    <span class="log-icon">${ENTRY_ICONS.tool_call}</span>
    <strong class="log-tool-name">${esc(entry.toolName || 'tool')}</strong>
    ${dur}
    <span class="log-ts">${esc(entry.timestamp || '')}</span>
    <button class="log-toggle" onclick="toggleLogDetail(this)">▶ input/output</button>
  </div>
  <div class="log-detail" style="display:none">
    ${inputStr ? `<div class="log-section-label">Input</div><pre class="log-pre">${esc(inputStr)}</pre>` : ''}
    ${outputStr ? `<div class="log-section-label">Output</div><pre class="log-pre">${esc(outputStr)}</pre>` : ''}
  </div>
</div>`;
}

function renderEntryReasoning(entry) {
  return `<div class="log-entry log-reasoning">
  <span class="log-icon">${ENTRY_ICONS.reasoning}</span>
  <span class="log-ts">${esc(entry.timestamp || '')}</span>
  <div class="log-reasoning-text">${esc(entry.text || '')}</div>
</div>`;
}

function renderEntryMilestone(entry) {
  return `<div class="log-entry log-milestone">
  <span class="log-icon">${ENTRY_ICONS.milestone}</span>
  <strong>${esc(entry.label || 'milestone')}</strong>
  <span class="log-ts">${esc(entry.timestamp || '')}</span>
</div>`;
}

function renderEntryError(entry) {
  return `<div class="log-entry log-error">
  <span class="log-icon">${ENTRY_ICONS.error}</span>
  <strong class="log-error-msg">${esc(entry.message || 'error')}</strong>
  <span class="log-ts">${esc(entry.timestamp || '')}</span>
  ${entry.stack ? `<pre class="log-pre log-stack">${esc(entry.stack)}</pre>` : ''}
</div>`;
}

function renderLogEntry(entry) {
  switch (entry.type) {
    case 'tool_call':  return renderEntryToolCall(entry);
    case 'reasoning':  return renderEntryReasoning(entry);
    case 'milestone':  return renderEntryMilestone(entry);
    case 'error':      return renderEntryError(entry);
    default:
      return `<div class="log-entry"><span class="log-icon">•</span><span class="log-ts">${esc(entry.timestamp || '')}</span> ${esc(entry.type || 'unknown')}</div>`;
  }
}

function renderExecutionLogsPanel(data) {
  const sessions = data.executionLogs;
  if (!sessions || sessions.length === 0) {
    return `<div class="empty"><h3>No execution logs</h3><p>Logs are written by agents as they execute tasks.</p></div>`;
  }

  let html = '';
  for (const session of sessions) {
    const entryCount = (session.entries || []).length;
    const sessionLabel = session.agentSlug
      ? `${esc(session.agentSlug)} — ${esc(session.startedAt || session.timestamp)}`
      : esc(session.sessionId);

    const entriesHtml = (session.entries || []).map(renderLogEntry).join('\n');

    html += `<div class="card log-session" style="margin-bottom:16px">
  <div class="log-session-header">
    <strong>${sessionLabel}</strong>
    <span class="badge badge-mixed">${entryCount} entries</span>
    ${session.summary ? `<span class="log-summary">${esc(session.summary)}</span>` : ''}
  </div>
  <div class="log-timeline">${entriesHtml || '<div style="color:var(--text-muted);font-size:12px">No entries</div>'}</div>
</div>`;
  }

  return html;
}

// --- Page layouts ---

function renderLayout(title, sidebarHTML, mainHTML, squadSlug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} - Squad Dashboard</title>
  <style>${getInlineCSS()}</style>
</head>
<body data-squad="${esc(squadSlug || '')}">
  <div class="layout">
    <nav class="sidebar">
      <h1>Squad Dashboard</h1>
      ${sidebarHTML}
    </nav>
    <div class="main">
      ${mainHTML}
    </div>
  </div>
  <script>${getInlineJS()}</script>
</body>
</html>`;
}

function renderSquadSidebar(squads, activeSlug) {
  if (!squads || squads.length === 0) {
    return '<div style="padding:20px;color:var(--text-muted)">No squads found</div>';
  }
  return squads.map(s => {
    const active = s.slug === activeSlug ? ' active' : '';
    const mode = s.mode ? `<span class="squad-mode">${esc(s.mode)}</span>` : '';
    return `<a href="/squad/${esc(s.slug)}" class="${active}">${esc(s.name || s.slug)}${mode}</a>`;
  }).join('\n');
}

// --- Home page (list of squads) ---

function renderHomePage(squads) {
  const sidebar = renderSquadSidebar(squads, null);
  let main;
  if (!squads || squads.length === 0) {
    main = `<div class="empty"><h3>No squads found</h3><p>Create a squad with <code>@squad design &lt;slug&gt;</code></p></div>`;
  } else {
    const rows = squads.map(s => `
      <tr>
        <td><a href="/squad/${esc(s.slug)}">${esc(s.name || s.slug)}</a></td>
        <td>${modeBadge(s.mode)}</td>
        <td>${esc(s.goal || '-')}</td>
        <td>${s.executorCount || 0}</td>
        <td>${esc(s.status || 'active')}</td>
      </tr>
    `).join('');
    main = `
      <div class="page-header"><h2>All Squads</h2><span class="badge badge-mixed">${squads.length} squads</span></div>
      <div class="card">
        <table>
          <thead><tr><th>Squad</th><th>Mode</th><th>Goal</th><th>Executors</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  return renderLayout('All Squads', sidebar, main, '');
}

// --- Squad detail page ---

function renderSquadPage(squad, panels, data, allSquads) {
  const sidebar = renderSquadSidebar(allSquads, squad.slug);

  const tabButtons = panels.map((p, i) =>
    `<button class="tab${i === 0 ? ' active' : ''}" data-tab="panel-${p}">${panelLabel(p)}</button>`
  ).join('');

  const tabContents = panels.map((p, i) =>
    `<div id="panel-${p}" class="tab-content${i === 0 ? ' active' : ''}">${renderPanel(p, data, squad)}</div>`
  ).join('');

  const main = `
    <div class="page-header">
      <h2>${esc(squad.name || squad.slug)} ${modeBadge(squad.mode)}</h2>
    </div>
    <div class="tab-group">
      <div class="tabs">${tabButtons}</div>
      ${tabContents}
    </div>`;

  return renderLayout(squad.name || squad.slug, sidebar, main, squad.slug);
}

function panelLabel(panel) {
  const labels = {
    overview: 'Overview',
    content: 'Content',
    learnings: 'Learnings',
    logs: 'Events',
    'content-preview': 'Preview',
    tasks: 'Tasks',
    'code-output': 'Code',
    integrations: 'Integrations',
    channels: 'Channels',
    pipeline: 'Pipeline',
    metrics: 'Metrics',
    processes: 'Processes',
    review: 'Review',
    'execution-logs': 'Execution Logs'
  };
  return labels[panel] || panel;
}

function renderPanel(panel, data, squad) {
  switch (panel) {
    case 'overview': return renderOverview(data);
    case 'content': return renderContentPanel(data);
    case 'learnings': return renderLearningsPanel(data);
    case 'logs': return renderEventsPanel(data);
    case 'pipeline': return renderPipelinePanel(data);
    case 'integrations': return renderIntegrationsPanel(squad, data);
    case 'metrics': return renderMetricsPanel(data);
    case 'processes': return renderProcessesPanel(data);
    case 'review': return renderHunkReviewPanel(data);
    case 'tasks': return renderTasksPanel(data, squad);
    case 'execution-logs': return renderExecutionLogsPanel(data);
    default: return `<div class="empty"><h3>${esc(panelLabel(panel))}</h3><p>Coming soon</p></div>`;
  }
}

// --- Overview panel ---

function renderOverview(data) {
  const ov = data.overview || {};
  const cards = [
    { label: 'Content Items', value: ov.contentItems || 0 },
    { label: 'Sessions', value: ov.sessions || 0 },
    { label: 'Learnings', value: ov.learnings || 0 },
    { label: 'Delivery Rate', value: ov.deliveryRate != null ? `${ov.deliveryRate}%` : 'N/A' }
  ];

  let html = `<div class="grid grid-4">${cards.map(c => `
    <div class="card">
      <h3>${esc(c.label)}</h3>
      <div class="value" id="metric-${c.label.toLowerCase().replace(/\s+/g, '_')}">${esc(String(c.value))}</div>
    </div>`).join('')}</div>`;

  // Execution plan progress
  const plan = ov.executionPlan;
  if (plan) {
    html += `<div class="card" style="margin-top:16px">
      <h3>Execution Plan</h3>
      <div style="font-size:14px">${statusDot(plan.status)} ${esc(plan.plan_slug)} (${esc(plan.status)})</div>
      ${progressBar(plan.rounds_completed, plan.rounds_total)}
    </div>`;
  }

  // Learning stats
  const ls = ov.learningStats;
  if (ls && (ls.active + ls.stale + ls.archived + ls.promoted) > 0) {
    html += `<div class="card" style="margin-top:16px">
      <h3>Learning Stats</h3>
      <div class="grid grid-4" style="margin-top:8px">
        <div>${statusDot('active')} Active: ${ls.active}</div>
        <div>${statusDot('stale')} Stale: ${ls.stale}</div>
        <div>${statusDot('inactive')} Archived: ${ls.archived}</div>
        <div>${statusDot('completed')} Promoted: ${ls.promoted}</div>
      </div>
    </div>`;
  }

  // Context & Token observability section
  const contextData = data.contextData;
  const tokenData = data.tokenData;
  const agentSlugs = new Set([
    ...Object.keys((contextData && contextData.agents) || {}),
    ...Object.keys((tokenData && tokenData.agents) || {})
  ]);

  if (agentSlugs.size > 0) {
    for (const agentSlug of agentSlugs) {
      const agentCtx = contextData && contextData.agents && contextData.agents[agentSlug];
      const agentTok = tokenData && tokenData.agents && tokenData.agents[agentSlug];

      const donutHTML = agentCtx ? renderContextDonut(agentCtx) : '<div style="font-size:12px;color:var(--text-muted)">No context data</div>';
      const totalTokens = agentTok ? agentTok.totalTokens.toLocaleString() : '—';
      const totalCost = agentTok ? `$${agentTok.totalCostUsd.toFixed(4)}` : '—';
      const barHTML = agentTok ? renderTokenStackedBar(agentTok.sessions, agentTok.wasteFlag) : '';

      html += `<div class="card" style="margin-top:16px">
        <h3>Observability — ${esc(agentSlug)}</h3>
        <div class="grid grid-2" style="margin-top:12px">
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Context Window</div>
            ${donutHTML}
          </div>
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">
              Token Usage &nbsp;<span style="color:var(--text-muted);font-weight:400">${totalTokens} tokens · ${totalCost}</span>
            </div>
            ${barHTML}
          </div>
        </div>
      </div>`;
    }
  }

  return html;
}

// --- Content panel ---

function renderContentPanel(data) {
  const items = data.content || [];
  if (items.length === 0) {
    return '<div class="empty"><h3>No content items</h3><p>Content will appear here after squad execution</p></div>';
  }
  const rows = items.map(item => `
    <tr>
      <td>${esc(item.content_key)}</td>
      <td>${esc(item.title || '-')}</td>
      <td>${esc(item.content_type)}</td>
      <td>${esc(item.layout_type || '-')}</td>
      <td>${statusDot(item.status)} ${esc(item.status)}</td>
      <td>${esc(item.updated_at || item.created_at)}</td>
    </tr>
  `).join('');
  return `<div class="card"><table>
    <thead><tr><th>Key</th><th>Title</th><th>Type</th><th>Layout</th><th>Status</th><th>Updated</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// --- Learnings panel ---

function renderLearningsPanel(data) {
  const items = data.learnings || [];
  if (items.length === 0) {
    return '<div class="empty"><h3>No learnings yet</h3><p>Learnings are captured during squad execution</p></div>';
  }
  const rows = items.map(item => `
    <tr>
      <td>${statusDot(item.status)} ${esc(item.status)}</td>
      <td>${esc(item.type)}</td>
      <td>${esc(item.title)}</td>
      <td>${esc(item.confidence || '-')}</td>
      <td>${item.frequency || 1}</td>
      <td>${esc(item.updated_at)}</td>
    </tr>
  `).join('');
  return `<div class="card"><table>
    <thead><tr><th>Status</th><th>Type</th><th>Title</th><th>Confidence</th><th>Freq</th><th>Updated</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// --- Events/Logs panel ---

function renderEventsPanel(data) {
  const events = data.events || [];
  if (events.length === 0) {
    return '<div class="empty"><h3>No events</h3><p>Events are recorded during execution</p></div>';
  }
  const items = events.map(ev => `
    <div class="timeline-item">
      <div class="time">${esc(ev.created_at)}</div>
      <div class="event">${statusDot(ev.status)} <strong>${esc(ev.phase || ev.event_type || 'event')}</strong> ${esc(ev.message || '')}</div>
    </div>
  `).join('');
  return `<div class="card"><div class="timeline">${items}</div></div>`;
}

// --- Pipeline panel ---

function renderPipelinePanel(data) {
  const info = data.pipelineInfo;
  if (!info || !info.pipeline) {
    return '<div class="empty"><h3>Not in a pipeline</h3><p>This squad is not part of any pipeline</p></div>';
  }
  let html = `<div class="card">
    <h3>Pipeline: ${esc(info.pipeline.pipeline_slug)}</h3>
    <div class="sub">${esc(info.pipeline.description || '')}</div>
  </div>`;

  if (info.handoffs && info.handoffs.length > 0) {
    const rows = info.handoffs.map(h => `
      <tr>
        <td>${esc(h.from_squad)}:${esc(h.from_port)}</td>
        <td>${esc(h.to_squad)}:${esc(h.to_port)}</td>
        <td>${statusDot(h.status)} ${esc(h.status)}</td>
        <td>${esc(h.created_at)}</td>
      </tr>
    `).join('');
    html += `<div class="card" style="margin-top:16px"><h3>Handoffs</h3><table>
      <thead><tr><th>From</th><th>To</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }
  return html;
}

// --- Integrations panel ---

function renderIntegrationsPanel(squad, data) {
  const mcps = (squad.manifest && squad.manifest.mcps) || [];
  const webhooks = (squad.manifest && squad.manifest.outputStrategy &&
    squad.manifest.outputStrategy.delivery && squad.manifest.outputStrategy.delivery.webhooks) || [];

  if (mcps.length === 0 && webhooks.length === 0) {
    return '<div class="empty"><h3>No integrations configured</h3><p>Add MCPs or webhooks to the squad manifest</p></div>';
  }

  let html = '';
  if (mcps.length > 0) {
    html += `<div class="card"><h3>MCPs</h3><table>
      <thead><tr><th>Slug</th><th>Title</th><th>Description</th></tr></thead>
      <tbody>${mcps.map(m => `<tr><td>${esc(m.slug)}</td><td>${esc(m.title || '-')}</td><td>${esc(m.description || '-')}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  if (webhooks.length > 0) {
    html += `<div class="card" style="margin-top:16px"><h3>Webhooks</h3><table>
      <thead><tr><th>Slug</th><th>URL</th><th>Trigger</th></tr></thead>
      <tbody>${webhooks.map(w => `<tr><td>${esc(w.slug)}</td><td>${esc(w.url)}</td><td>${esc(w.trigger)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  // Recent deliveries
  const deliveries = data.deliveries || [];
  if (deliveries.length > 0) {
    const rows = deliveries.map(d => `
      <tr>
        <td>${esc(d.webhook_slug || '-')}</td>
        <td>${esc(d.content_key || '-')}</td>
        <td>${d.status_code || '-'}</td>
        <td>${d.attempt}</td>
        <td>${esc(d.created_at)}</td>
      </tr>
    `).join('');
    html += `<div class="card" style="margin-top:16px"><h3>Recent Deliveries</h3><table>
      <thead><tr><th>Webhook</th><th>Content</th><th>Status</th><th>Attempt</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  return html;
}

// --- Metrics panel ---

function renderMetricsPanel(data) {
  const metrics = data.customMetrics || [];
  if (metrics.length === 0) {
    return '<div class="empty"><h3>No metrics tracked</h3><p>Use <code>aioson squad:metric</code> to track squad metrics</p></div>';
  }

  const cards = metrics.map(m => {
    const improvement = m.baseline != null ? Math.round(((m.baseline - m.metric_value) / m.baseline) * 100) : null;
    return `<div class="card">
      <h3>${esc(m.metric_key)}</h3>
      <div class="value">${m.metric_value}${esc(m.metric_unit || '')}</div>
      ${m.baseline != null ? `<div class="sub">Baseline: ${m.baseline}${esc(m.metric_unit || '')}${improvement != null ? ` (${improvement > 0 ? '+' : ''}${improvement}% change)` : ''}</div>` : ''}
      ${m.target != null ? `<div class="sub">Target: ${m.target}${esc(m.metric_unit || '')}</div>` : ''}
      <div class="sub">${esc(m.period || '')} via ${esc(m.source || 'manual')}</div>
    </div>`;
  }).join('');

  return `<div class="grid grid-3">${cards}</div>`;
}

// --- Processes panel ---

function renderProcessesPanel(data) {
  const processes = data.processes || [];

  const squadGroups = {};
  for (const proc of processes) {
    const key = proc.squadSlug || 'unknown';
    if (!squadGroups[key]) squadGroups[key] = [];
    squadGroups[key].push(proc);
  }

  if (processes.length === 0) {
    return `<div class="empty">
      <h3>No active processes</h3>
      <p>Processes appear here when squad agents are running.</p>
    </div>`;
  }

  let html = `<div id="processes-root">`;

  for (const [squadSlug, procs] of Object.entries(squadGroups)) {
    html += `<div class="card" style="margin-bottom:16px">
      <h3>${esc(squadSlug)} <span class="badge badge-mixed">${procs.length}</span></h3>
      <table style="margin-top:8px">
        <thead>
          <tr>
            <th>Status</th><th>Agent</th><th>PID</th><th>Elapsed</th><th>Context</th><th>URL</th><th>Action</th>
          </tr>
        </thead>
        <tbody>`;

    for (const proc of procs) {
      const aliveClass = proc.alive ? 'status-active' : 'status-inactive';
      const aliveLabel = proc.alive ? 'running' : 'stopped';
      const ctxPct = proc.contextPct != null ? `${proc.contextPct}%` : '—';
      const urlCell = proc.url
        ? `<a href="${esc(proc.url)}" target="_blank" rel="noopener">${esc(proc.url)}</a>`
        : '—';
      const stopBtn = proc.alive
        ? `<button class="proc-stop-btn" data-pid="${esc(String(proc.pid))}" onclick="procStop(${Number(proc.pid)})">Stop</button>`
        : '';

      html += `<tr>
        <td><span class="status-dot ${aliveClass}"></span>${esc(aliveLabel)}</td>
        <td>${esc(proc.agentSlug)}</td>
        <td class="proc-pid">${esc(String(proc.pid))}</td>
        <td class="proc-elapsed" data-startedat="${esc(proc.startedAt || '')}">—</td>
        <td>${esc(ctxPct)}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${urlCell}</td>
        <td>${stopBtn}</td>
      </tr>`;
    }

    html += `</tbody></table></div>`;
  }

  html += `</div>`;
  return html;
}

// --- Tasks panel (agents + autonomy config) ---

function renderTasksPanel(data, squad) {
  const executors = (squad.manifest && squad.manifest.executors) || [];

  let html = '';

  if (executors.length > 0) {
    const agentCards = executors.map(ex => {
      const level = ex.autonomyLevel || 'semi';
      const info = AUTONOMY_LEVELS[level] || AUTONOMY_LEVELS['semi'];
      const modelBadge = ex.modelTier
        ? `<span class="badge badge-mixed">${esc(ex.modelTier)}</span>`
        : '';
      const focusTags = (ex.focus || []).map(f => `<span class="tag">${esc(f)}</span>`).join(' ');

      return `<div class="card agent-card" id="agent-card-${esc(ex.slug)}">
  <div class="agent-card-header">
    <div>
      <strong>${esc(ex.title || ex.slug)}</strong>
      ${modelBadge}
      ${autonomyBadge(level)}
    </div>
    <div class="agent-card-slug">${esc(ex.slug)}</div>
  </div>
  ${ex.role ? `<div class="agent-role">${esc(ex.role)}</div>` : ''}
  ${focusTags ? `<div class="agent-focus">${focusTags}</div>` : ''}
  <div class="agent-autonomy-row">
    <label class="agent-autonomy-label">Autonomy:</label>
    ${autonomySelector(ex.slug, level)}
  </div>
</div>`;
    }).join('\n');

    html += `<div class="card" style="margin-bottom:16px">
  <h3>Agent Configuration</h3>
  <div class="grid grid-3" style="margin-top:12px">${agentCards}</div>
</div>`;
  }

  // Task list (from data.tasks if available)
  const tasks = data.tasks || [];
  if (tasks.length > 0) {
    const rows = tasks.map(t => {
      const agent = executors.find(ex => ex.slug === t.agentSlug);
      const level = (agent && agent.autonomyLevel) || t.autonomyLevel || 'semi';
      return `<tr>
      <td>${esc(t.id || '-')}</td>
      <td>${esc(t.title || '-')}</td>
      <td>${esc(t.agentSlug || '-')}</td>
      <td>${statusDot(t.status)} ${esc(t.status || 'pending')}</td>
      <td>${autonomyBadge(level)}</td>
    </tr>`;
    }).join('');
    html += `<div class="card">
  <h3>Tasks</h3>
  <table style="margin-top:8px">
    <thead><tr><th>ID</th><th>Title</th><th>Agent</th><th>Status</th><th>Autonomy</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  } else if (executors.length === 0) {
    html = `<div class="empty"><h3>No executors configured</h3><p>Add executors to the squad manifest.</p></div>`;
  }

  return html || `<div class="empty"><h3>No tasks yet</h3><p>Tasks appear here during squad execution.</p></div>`;
}

// --- Hunk Review panel ---

/**
 * Render a single diff hunk with approve/reject/comment controls.
 */
function renderHunkCard(hunk, taskId) {
  const statusClass = {
    pending:  'hunk-pending',
    approved: 'hunk-approved',
    rejected: 'hunk-rejected',
    revised:  'hunk-revised'
  }[hunk.status] || 'hunk-pending';

  const statusIcon = {
    pending:  '⏳',
    approved: '✅',
    rejected: '❌',
    revised:  '💬'
  }[hunk.status] || '⏳';

  const diffLines = (hunk.lines || []).map(line => {
    let cls = 'diff-ctx';
    if (line.startsWith('+')) cls = 'diff-add';
    else if (line.startsWith('-')) cls = 'diff-del';
    return `<div class="${cls}">${esc(line)}</div>`;
  }).join('');

  const commentBlock = hunk.comment
    ? `<div class="hunk-comment">💬 ${esc(hunk.comment)}</div>`
    : '';

  return `<div class="hunk-card ${statusClass}" id="hunk-${esc(hunk.id)}">
  <div class="hunk-header">
    <span class="hunk-file">${esc(hunk.fileHeader || '')}</span>
    <code class="hunk-range">${esc(hunk.header || '')}</code>
    <span class="hunk-delta">+${hunk.additions || 0} / -${hunk.deletions || 0}</span>
    <span class="hunk-status-icon">${statusIcon} ${esc(hunk.status)}</span>
  </div>
  <div class="hunk-diff">${diffLines}</div>
  ${commentBlock}
  <div class="hunk-actions">
    <button class="btn-approve" onclick="hunkAction('${esc(taskId)}','${esc(hunk.id)}','approve')">✅ Approve</button>
    <button class="btn-reject"  onclick="hunkAction('${esc(taskId)}','${esc(hunk.id)}','reject')">❌ Reject</button>
    <button class="btn-comment" onclick="toggleComment('${esc(hunk.id)}')">💬 Comment</button>
    <div class="hunk-comment-input" id="ci-${esc(hunk.id)}" style="display:none">
      <input type="text" id="ct-${esc(hunk.id)}" placeholder="Add comment…" style="width:100%;margin-top:6px;padding:4px 8px;background:var(--bg-hover);border:1px solid var(--border);border-radius:4px;color:var(--text)">
      <button onclick="hunkAction('${esc(taskId)}','${esc(hunk.id)}','comment')" style="margin-top:4px">Submit</button>
    </div>
  </div>
</div>`;
}

/**
 * Render the hunk review panel.
 * data.hunkReview = { taskId, hunks: [...], diff }
 */
function renderHunkReviewPanel(data) {
  const hr = data.hunkReview;
  if (!hr || !hr.hunks || hr.hunks.length === 0) {
    return `<div class="empty"><h3>No hunks to review</h3><p>Submit a task diff to start hunk-level review.</p></div>`;
  }

  const total = hr.hunks.length;
  const reviewed = hr.hunks.filter(h => h.status !== 'pending').length;
  const approved = hr.hunks.filter(h => h.status === 'approved').length;
  const rejected = hr.hunks.filter(h => h.status === 'rejected').length;
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const progressBar = `<div class="hunk-progress-wrap">
    <div class="hunk-progress-label">
      ${reviewed}/${total} hunks reviewed (${approved} approved, ${rejected} rejected)
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;

  const cards = hr.hunks.map(h => renderHunkCard(h, hr.taskId)).join('\n');

  return `<div class="hunk-review-panel">
  ${progressBar}
  <div class="hunk-list">${cards}</div>
</div>`;
}

module.exports = {
  renderHomePage,
  renderSquadPage,
  renderLayout,
  renderSquadSidebar,
  renderHunkReviewPanel,
  esc
};
