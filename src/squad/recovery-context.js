'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

// Events that trigger an automatic refresh of the recovery context
const REFRESH_EVENTS = new Set(['task_completed', 'decision_made', 'handoff']);

// Approximate token count (chars / 4)
function estimateTokens(str) {
  return Math.ceil(str.length / 4);
}

/**
 * Read squad manifest (best-effort, returns {} on failure).
 */
async function readManifest(projectDir, squadSlug) {
  const p = path.join(projectDir, SQUADS_DIR, squadSlug, 'squad.manifest.json');
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Read recent events from session-log.json (last N entries).
 */
async function readRecentEvents(projectDir, squadSlug, limit = 10) {
  const p = path.join(projectDir, SQUADS_DIR, squadSlug, 'session-log.json');
  try {
    const raw = JSON.parse(await fs.readFile(p, 'utf8'));
    const entries = Array.isArray(raw) ? raw : (raw.entries || []);
    return entries.slice(-limit);
  } catch {
    return [];
  }
}

/**
 * Read recent tasks from tasks.json (last 5, enriched).
 */
async function readRecentTasks(projectDir, squadSlug, limit = 5) {
  const p = path.join(projectDir, SQUADS_DIR, squadSlug, 'tasks.json');
  try {
    const raw = JSON.parse(await fs.readFile(p, 'utf8'));
    const tasks = Array.isArray(raw) ? raw : (raw.tasks || []);
    return tasks.slice(-limit);
  } catch {
    return [];
  }
}

/**
 * Read context-monitor.json snapshot for an agent.
 */
async function readContextSnapshot(projectDir, squadSlug, agentSlug) {
  const p = path.join(projectDir, SQUADS_DIR, squadSlug, 'context-monitor.json');
  try {
    const data = JSON.parse(await fs.readFile(p, 'utf8'));
    if (agentSlug && data.agents && data.agents[agentSlug]) {
      return data.agents[agentSlug];
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Build the markdown content for recovery-context.md.
 * Target < 2000 tokens.
 */
function buildRecoveryMarkdown(squadSlug, agentSlug, manifest, tasks, events, ctxSnapshot) {
  const lines = [];

  lines.push(`# Recovery Context — ${squadSlug} / ${agentSlug}`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Squad goal
  if (manifest.goal) {
    lines.push('## Squad Goal');
    lines.push(manifest.goal);
    lines.push('');
  }

  // Agent role (from executors array)
  const executor = (manifest.executors || []).find(e => e.slug === agentSlug);
  if (executor) {
    lines.push('## Your Role');
    lines.push(`**${executor.title || agentSlug}**: ${executor.role || ''}`);
    lines.push('');
  }

  // Recent tasks
  if (tasks.length > 0) {
    lines.push('## Recent Tasks');
    for (const t of tasks) {
      const status = t.status || 'unknown';
      const title = t.title || t.slug || t.id || '(untitled)';
      lines.push(`- [${status}] ${title}`);
      if (t.output && typeof t.output === 'string') {
        // Truncate long outputs
        const out = t.output.length > 200 ? t.output.slice(0, 200) + '…' : t.output;
        lines.push(`  Output: ${out}`);
      }
    }
    lines.push('');
  }

  // Recent events
  if (events.length > 0) {
    lines.push('## Recent Events');
    for (const ev of events) {
      const ts = ev.created_at || ev.timestamp || '';
      const type = ev.event_type || ev.type || 'event';
      const msg = ev.message || ev.summary || '';
      lines.push(`- [${ts}] ${type}: ${msg}`);
    }
    lines.push('');
  }

  // Context snapshot
  if (ctxSnapshot) {
    lines.push('## Context Window at Last Compact');
    const used = ctxSnapshot.totalUsed || 0;
    const win = ctxSnapshot.windowSize || 0;
    const pct = win > 0 ? Math.round((used / win) * 100) : 0;
    lines.push(`Used: ${used.toLocaleString()} / ${win.toLocaleString()} tokens (${pct}%)`);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Inject this file at the top of your next session to restore context after a compact.*');

  const content = lines.join('\n');

  // Enforce token limit: if over budget, trim events section
  if (estimateTokens(content) > 2000) {
    // Rebuild with fewer events
    return buildRecoveryMarkdown(squadSlug, agentSlug, manifest, tasks, events.slice(-3), ctxSnapshot);
  }

  return content;
}

/**
 * Generate and write recovery-context.md for an agent.
 * @param {string} projectDir
 * @param {string} squadSlug
 * @param {string} agentSlug
 * @returns {{ ok: boolean, path: string, tokens: number }}
 */
async function generateRecovery(projectDir, squadSlug, agentSlug) {
  const [manifest, tasks, events, ctxSnapshot] = await Promise.all([
    readManifest(projectDir, squadSlug),
    readRecentTasks(projectDir, squadSlug),
    readRecentEvents(projectDir, squadSlug),
    readContextSnapshot(projectDir, squadSlug, agentSlug)
  ]);

  const content = buildRecoveryMarkdown(squadSlug, agentSlug, manifest, tasks, events, ctxSnapshot);
  const tokens = estimateTokens(content);

  const outDir = path.join(projectDir, SQUADS_DIR, squadSlug);
  const outPath = path.join(outDir, `recovery-context.md`);

  try {
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, content, 'utf8');
  } catch (err) {
    return { ok: false, error: err.message, path: outPath, tokens };
  }

  return { ok: true, path: outPath, tokens, squadSlug, agentSlug };
}

/**
 * Read the current recovery-context.md for an agent (returns null if missing).
 */
async function readRecovery(projectDir, squadSlug) {
  const p = path.join(projectDir, SQUADS_DIR, squadSlug, 'recovery-context.md');
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Check if a runtime event should trigger a recovery refresh.
 * @param {string} eventType
 */
function shouldRefreshOnEvent(eventType) {
  return REFRESH_EVENTS.has(eventType);
}

module.exports = { generateRecovery, readRecovery, shouldRefreshOnEvent, REFRESH_EVENTS };
