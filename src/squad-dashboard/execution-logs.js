'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

const ENTRY_TYPES = {
  TOOL_CALL:  'tool_call',
  REASONING:  'reasoning',
  MILESTONE:  'milestone',
  ERROR:      'error'
};

/**
 * Session log file schema:
 * {
 *   agentSlug: string,
 *   taskId: string,
 *   startedAt: ISO string,
 *   summary: string | null,
 *   entries: Array<{
 *     type: 'tool_call' | 'reasoning' | 'milestone' | 'error',
 *     timestamp: ISO string,
 *     // tool_call
 *     toolName?: string,
 *     input?: any,
 *     output?: any,
 *     durationMs?: number,
 *     // reasoning
 *     text?: string,
 *     // milestone
 *     label?: string,
 *     // error
 *     message?: string,
 *     stack?: string
 *   }>
 * }
 *
 * File path: .aioson/squads/{slug}/logs/{task-id}/session-{timestamp}.json
 */

function logsDir(projectDir, squadSlug, taskId) {
  return path.join(projectDir, SQUADS_DIR, squadSlug, 'logs', taskId);
}

async function listSessionFiles(projectDir, squadSlug, taskId) {
  const dir = logsDir(projectDir, squadSlug, taskId);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  return entries
    .filter(f => f.startsWith('session-') && f.endsWith('.json'))
    .map(f => {
      const ts = f.replace(/^session-/, '').replace(/\.json$/, '');
      return { sessionId: f.replace('.json', ''), filename: f, timestamp: ts, filePath: path.join(dir, f) };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Returns all sessions (with entries) for a given task, sorted oldest-first.
 */
async function getLogsForTask(projectDir, squadSlug, taskId) {
  const files = await listSessionFiles(projectDir, squadSlug, taskId);
  const sessions = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(file.filePath, 'utf8');
      const session = JSON.parse(raw);
      sessions.push({
        sessionId: file.sessionId,
        timestamp: file.timestamp,
        taskId,
        squadSlug,
        agentSlug: session.agentSlug || null,
        startedAt: session.startedAt || file.timestamp,
        summary: session.summary || null,
        entries: session.entries || []
      });
    } catch {
      sessions.push({
        sessionId: file.sessionId,
        timestamp: file.timestamp,
        taskId,
        squadSlug,
        agentSlug: null,
        startedAt: file.timestamp,
        summary: null,
        entries: [],
        parseError: true
      });
    }
  }
  return sessions;
}

/**
 * Returns a single session log by sessionId (filename without .json).
 */
async function getSessionLog(projectDir, squadSlug, taskId, sessionId) {
  const dir = logsDir(projectDir, squadSlug, taskId);
  const filePath = path.join(dir, `${sessionId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { ENTRY_TYPES, getLogsForTask, getSessionLog };
