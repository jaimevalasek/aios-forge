'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SESSIONS_DIR = path.join('.aioson', 'sessions');
const DEFAULT_TTL_HOURS = 24;

function sanitizeSessionId(sessionId) {
  // Replace anything that isn't alphanumeric, hyphen, or underscore with a dash
  return String(sessionId)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128);
}

function sessionPath(projectDir, sessionId) {
  return path.join(projectDir, SESSIONS_DIR, `${sanitizeSessionId(sessionId)}.json`);
}

async function ensureSessionsDir(projectDir) {
  const dir = path.join(projectDir, SESSIONS_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Load a session by ID. Returns null if not found or expired.
 * @param {string} projectDir
 * @param {string} sessionId
 * @param {number} [ttlHours]
 * @returns {Promise<object|null>}
 */
async function loadSession(projectDir, sessionId, ttlHours = DEFAULT_TTL_HOURS) {
  const filePath = sessionPath(projectDir, sessionId);
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return null;
  }

  // Check TTL
  if (ttlHours > 0 && session.last_active) {
    const idleMs = Date.now() - new Date(session.last_active).getTime();
    if (idleMs > ttlHours * 3_600_000) {
      // Expired — delete and return null
      await fs.unlink(filePath).catch(() => {});
      return null;
    }
  }

  return session;
}

/**
 * Save (overwrite) a session file atomically.
 * @param {string} projectDir
 * @param {object} session  Must have session.session_id
 */
async function saveSession(projectDir, session) {
  await ensureSessionsDir(projectDir);
  const filePath = sessionPath(projectDir, session.session_id);
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(session, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Append a turn to a session. Creates the session file if it doesn't exist.
 * @param {string} projectDir
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 * @param {object} [metadata]  Merged into session.metadata on first creation
 * @param {number} [ttlHours]
 * @returns {Promise<object>} Updated session
 */
async function appendTurn(projectDir, sessionId, role, content, metadata = {}, ttlHours = DEFAULT_TTL_HOURS) {
  let session = await loadSession(projectDir, sessionId, ttlHours);
  const now = new Date().toISOString();

  if (!session) {
    session = {
      session_id: sessionId,
      channel: metadata.channel || 'webhook',
      created_at: now,
      last_active: now,
      turns: [],
      metadata: { ...metadata }
    };
  }

  session.last_active = now;
  session.turns.push({ role, content, ts: now });

  // Merge any new metadata fields without overwriting existing ones
  if (metadata && typeof metadata === 'object') {
    for (const [k, v] of Object.entries(metadata)) {
      if (session.metadata[k] === undefined) session.metadata[k] = v;
    }
  }

  await saveSession(projectDir, session);
  return session;
}

/**
 * Build a context string from session history to inject into the squad input.
 * @param {object} session
 * @param {string} currentInput
 * @returns {string}
 */
function buildContextualInput(session, currentInput) {
  if (!session || !session.turns || session.turns.length === 0) {
    return currentInput;
  }

  const history = session.turns
    .map(t => `${t.role}: ${t.content}`)
    .join('\n');

  return `[Conversation history]\n${history}\n\n[Current message]\n${currentInput}`;
}

/**
 * Delete all session files that have been inactive for longer than ttlHours.
 * @param {string} projectDir
 * @param {number} [ttlHours]
 * @returns {Promise<number>} Number of sessions deleted
 */
async function cleanExpiredSessions(projectDir, ttlHours = DEFAULT_TTL_HOURS) {
  const dir = path.join(projectDir, SESSIONS_DIR);
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  let deleted = 0;
  const cutoff = Date.now() - ttlHours * 3_600_000;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(dir, entry.name);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(raw);
      const lastActive = session.last_active ? new Date(session.last_active).getTime() : 0;
      if (lastActive < cutoff) {
        await fs.unlink(filePath);
        deleted++;
      }
    } catch {
      // Corrupt file — remove it
      await fs.unlink(filePath).catch(() => {});
      deleted++;
    }
  }

  return deleted;
}

module.exports = {
  loadSession,
  saveSession,
  appendTurn,
  buildContextualInput,
  cleanExpiredSessions,
  sanitizeSessionId
};
