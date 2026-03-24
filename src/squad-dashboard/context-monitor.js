'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { generateRecovery, shouldRefreshOnEvent } = require('../squad/recovery-context');

const SQUADS_DIR = path.join('.aioson', 'squads');

// Minimum ratio drop between consecutive measurements to be considered a compact
const COMPACT_DROP_THRESHOLD = 0.30;

// Warning level thresholds (ratio of used/windowSize)
const THRESHOLDS = { warning: 0.85, critical: 0.95 };

// Notification event types (dispatched by caller when notification system is available)
const EVENTS = {
  CONTEXT_WARNING: 'context_warning',
  CONTEXT_CRITICAL: 'context_critical'
};

// Context categories (6) — order determines donut segment order
const CATEGORIES = [
  'system_prompt',
  'conversation_history',
  'tool_outputs',
  'files_loaded',
  'inline_data',
  'other'
];

function computeWarningLevel(used, windowSize) {
  if (!windowSize || windowSize <= 0) return 'unknown';
  const ratio = used / windowSize;
  if (ratio >= 1.0) return 'overflow';
  if (ratio >= THRESHOLDS.critical) return 'critical';
  if (ratio >= THRESHOLDS.warning) return 'warning';
  return 'normal';
}

/**
 * Read context-monitor.json for a squad and compute warning levels.
 * @param {string} projectDir
 * @param {string} squadSlug
 * @param {string|null} agentSlug  — if set, return only that agent
 * @returns {object|null}
 */
async function getContextUsage(projectDir, squadSlug, agentSlug) {
  const filePath = path.join(projectDir, SQUADS_DIR, squadSlug, 'context-monitor.json');
  let data;
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  const agents = data.agents || {};

  if (agentSlug) {
    const agent = agents[agentSlug];
    if (!agent) return null;
    const warningLevel = computeWarningLevel(agent.totalUsed || 0, agent.windowSize || 0);
    return { squadSlug, agentSlug, ...agent, warningLevel };
  }

  const enrichedAgents = {};
  for (const [slug, agent] of Object.entries(agents)) {
    enrichedAgents[slug] = {
      ...agent,
      warningLevel: computeWarningLevel(agent.totalUsed || 0, agent.windowSize || 0)
    };
  }
  return { squadSlug, agents: enrichedAgents, updatedAt: data.updatedAt };
}

/**
 * Return pending notification events for a context snapshot.
 * Caller dispatches these once the notification system exists.
 */
function checkNotificationEvents(squadSlug, contextData) {
  if (!contextData || !contextData.agents) return [];
  const events = [];
  for (const [agentSlug, agent] of Object.entries(contextData.agents)) {
    if (agent.warningLevel === 'critical' || agent.warningLevel === 'overflow') {
      events.push({ type: EVENTS.CONTEXT_CRITICAL, squadSlug, agentSlug, warningLevel: agent.warningLevel });
    } else if (agent.warningLevel === 'warning') {
      events.push({ type: EVENTS.CONTEXT_WARNING, squadSlug, agentSlug, warningLevel: agent.warningLevel });
    }
  }
  return events;
}

/**
 * Detect if a context compact occurred between two consecutive measurements.
 * A compact is inferred when totalUsed drops by > 30% from the previous snapshot.
 * @param {number} prevUsed   — previous totalUsed value
 * @param {number} currUsed   — current totalUsed value
 * @returns {boolean}
 */
function isCompactDetected(prevUsed, currUsed) {
  if (!prevUsed || prevUsed <= 0) return false;
  const drop = (prevUsed - currUsed) / prevUsed;
  return drop > COMPACT_DROP_THRESHOLD;
}

/**
 * Compare two context-monitor snapshots and trigger recovery injection if a
 * compact is detected for any agent.
 *
 * @param {string} projectDir
 * @param {string} squadSlug
 * @param {object} prevData   — previous result from getContextUsage (or null)
 * @param {object} currData   — current result from getContextUsage
 * @returns {Array<{agentSlug, recovery}>}  list of recovery results triggered
 */
async function checkAndInjectRecovery(projectDir, squadSlug, prevData, currData) {
  if (!prevData || !currData) return [];
  const prevAgents = prevData.agents || {};
  const currAgents = currData.agents || {};
  const triggered = [];

  for (const [agentSlug, curr] of Object.entries(currAgents)) {
    const prev = prevAgents[agentSlug];
    if (!prev) continue;
    if (isCompactDetected(prev.totalUsed || 0, curr.totalUsed || 0)) {
      const recovery = await generateRecovery(projectDir, squadSlug, agentSlug);
      triggered.push({ agentSlug, recovery });
    }
  }

  return triggered;
}

/**
 * Optionally trigger a recovery refresh when a specific runtime event fires.
 * @param {string} projectDir
 * @param {string} squadSlug
 * @param {string} agentSlug
 * @param {string} eventType
 */
async function onRuntimeEvent(projectDir, squadSlug, agentSlug, eventType) {
  if (!shouldRefreshOnEvent(eventType)) return null;
  return generateRecovery(projectDir, squadSlug, agentSlug);
}

module.exports = {
  getContextUsage,
  computeWarningLevel,
  checkNotificationEvents,
  isCompactDetected,
  checkAndInjectRecovery,
  onRuntimeEvent,
  CATEGORIES,
  EVENTS,
  THRESHOLDS,
  COMPACT_DROP_THRESHOLD
};
