'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const {
  getSquadOverview,
  getRecentContent,
  getLearnings,
  getRecentDeliveries,
  getRecentEvents,
  getSquadMetrics
} = require('./metrics');
const { getContextUsage } = require('./context-monitor');
const { getTokenUsage } = require('./token-tracker');
const { getActiveProcesses, stopProcess } = require('./process-monitor');
const { getHunks, updateHunk, getReviewProgress, HUNK_STATES } = require('./hunk-review');
const { generateRecovery, readRecovery } = require('../squad/recovery-context');
const { getLogsForTask, getSessionLog } = require('./execution-logs');

const SQUADS_DIR = path.join('.aioson', 'squads');

async function loadSquadList(projectDir) {
  const squadsDir = path.join(projectDir, SQUADS_DIR);
  let entries;
  try {
    entries = await fs.readdir(squadsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const squads = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(squadsDir, entry.name, 'squad.manifest.json');
    try {
      const raw = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(raw);
      squads.push({
        slug: entry.name,
        name: manifest.name || entry.name,
        mode: manifest.mode || 'mixed',
        goal: manifest.goal || '',
        status: manifest.status || 'active',
        executorCount: (manifest.executors || []).length,
        manifest
      });
    } catch {
      squads.push({
        slug: entry.name,
        name: entry.name,
        mode: 'unknown',
        goal: '',
        status: 'unknown',
        executorCount: 0,
        manifest: null
      });
    }
  }
  return squads;
}

function detectPanels(manifest) {
  const panels = ['overview', 'content', 'learnings', 'logs'];

  if (manifest) {
    if (manifest.mode === 'content') panels.push('content-preview');
    if (manifest.mode === 'software') panels.push('tasks');

    const hasWebhooks = manifest.outputStrategy &&
      manifest.outputStrategy.delivery &&
      Array.isArray(manifest.outputStrategy.delivery.webhooks) &&
      manifest.outputStrategy.delivery.webhooks.length > 0;
    const hasMcps = Array.isArray(manifest.mcps) && manifest.mcps.length > 0;
    if (hasWebhooks || hasMcps) panels.push('integrations');

    const channelMcps = (manifest.mcps || []).filter(function (m) {
      return ['whatsapp', 'telegram', 'sms', 'voice'].some(function (ch) {
        return (m.slug || '').includes(ch);
      });
    });
    if (channelMcps.length > 0) panels.push('channels');
  }

  panels.push('metrics');
  panels.push('processes');
  return panels;
}

function loadSquadData(db, squadSlug) {
  const overview = getSquadOverview(db, squadSlug);
  const content = getRecentContent(db, squadSlug);
  const learnings = getLearnings(db, squadSlug);
  const deliveries = getRecentDeliveries(db, squadSlug);
  const events = getRecentEvents(db, squadSlug);
  const customMetrics = getSquadMetrics(db, squadSlug);

  return {
    overview,
    content,
    learnings,
    deliveries,
    events,
    customMetrics,
    pipelineInfo: overview.pipelineInfo,
    metrics: {
      content_items: overview.contentItems,
      sessions: overview.sessions,
      learnings: overview.learnings,
      delivery_rate: overview.deliveryRate
    }
  };
}

/**
 * GET /api/squads/:slug/context
 * Returns context usage with warning levels for all agents in a squad.
 */
async function getContextData(projectDir, squadSlug, agentSlug) {
  return getContextUsage(projectDir, squadSlug, agentSlug || null);
}

/**
 * GET /api/squads/:slug/tokens?breakdown=true
 * Returns token usage with cost estimates and waste flags.
 */
async function getTokenData(projectDir, squadSlug, breakdown) {
  return getTokenUsage(projectDir, squadSlug, breakdown);
}

/**
 * GET /api/processes[?squad=:slug]
 * Returns active agent processes across all squads (or filtered by squad).
 */
async function getProcesses(projectDir, squadSlug) {
  return getActiveProcesses(projectDir, squadSlug || null);
}

/**
 * POST /api/processes/:pid/stop
 * Sends SIGTERM to the process and removes its process file.
 */
async function stopProcessById(projectDir, pid) {
  return stopProcess(projectDir, pid);
}

/**
 * GET /api/tasks/:id/hunks
 * Returns hunk review state for a task.
 * Requires squadSlug and optionally diff (to init on first call).
 */
async function getTaskHunks(projectDir, squadSlug, taskId, diff) {
  return getHunks(projectDir, squadSlug, taskId, diff || null);
}

/**
 * POST /api/tasks/:id/hunks/:hunkId/approve
 */
async function approveHunk(projectDir, squadSlug, taskId, hunkId) {
  return updateHunk(projectDir, squadSlug, taskId, hunkId, HUNK_STATES.APPROVED, null);
}

/**
 * POST /api/tasks/:id/hunks/:hunkId/reject
 */
async function rejectHunk(projectDir, squadSlug, taskId, hunkId, comment) {
  return updateHunk(projectDir, squadSlug, taskId, hunkId, HUNK_STATES.REJECTED, comment || null);
}

/**
 * POST /api/tasks/:id/hunks/:hunkId/comment
 */
async function commentHunk(projectDir, squadSlug, taskId, hunkId, comment) {
  return updateHunk(projectDir, squadSlug, taskId, hunkId, HUNK_STATES.REVISED, comment || null);
}

/**
 * GET /api/squads/:slug/agents/:agent/recovery
 * Returns the recovery-context.md for an agent (generates if missing).
 */
async function getAgentRecovery(projectDir, squadSlug, agentSlug) {
  // Try to read existing first
  const existing = await readRecovery(projectDir, squadSlug);
  if (existing) return { ok: true, content: existing, squadSlug, agentSlug };
  // Generate on demand
  const result = await generateRecovery(projectDir, squadSlug, agentSlug);
  if (!result.ok) return result;
  const content = await readRecovery(projectDir, squadSlug);
  return { ok: true, content, squadSlug, agentSlug, tokens: result.tokens };
}

/**
 * GET /api/squads/:slug/tasks/:taskId/logs
 * Returns all session logs for a task, sorted oldest-first.
 */
async function getTaskLogs(projectDir, squadSlug, taskId) {
  return getLogsForTask(projectDir, squadSlug, taskId);
}

/**
 * GET /api/squads/:slug/tasks/:taskId/logs/:sessionId
 * Returns a single session log by sessionId.
 */
async function getTaskSessionLog(projectDir, squadSlug, taskId, sessionId) {
  return getSessionLog(projectDir, squadSlug, taskId, sessionId);
}

module.exports = {
  loadSquadList,
  detectPanels,
  loadSquadData,
  getContextData,
  getTokenData,
  getProcesses,
  stopProcessById,
  getTaskHunks,
  approveHunk,
  rejectHunk,
  commentHunk,
  getAgentRecovery,
  getReviewProgress,
  getTaskLogs,
  getTaskSessionLog
};
