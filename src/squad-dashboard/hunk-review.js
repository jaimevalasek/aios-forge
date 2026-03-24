'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

// Valid hunk states
const HUNK_STATES = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', REVISED: 'revised' };

/**
 * Parse a unified diff string into individual hunks.
 * Each hunk includes its header, lines, and a stable id.
 *
 * @param {string} diff  — full unified diff text
 * @returns {Array<{id, fileHeader, header, lines, additions, deletions}>}
 */
function parseDiffHunks(diff) {
  if (!diff || typeof diff !== 'string') return [];

  const hunks = [];
  let currentFile = '';
  let currentHunk = null;
  let hunkIndex = 0;

  for (const rawLine of diff.split('\n')) {
    // File header lines
    if (rawLine.startsWith('--- ') || rawLine.startsWith('+++ ')) {
      if (rawLine.startsWith('+++ ')) {
        // Strip b/ prefix from git diffs
        currentFile = rawLine.slice(4).replace(/^b\//, '').trim();
      }
      if (currentHunk) {
        hunks.push(finalizeHunk(currentHunk));
        currentHunk = null;
      }
      continue;
    }

    // Hunk header: @@ -a,b +c,d @@
    if (rawLine.startsWith('@@ ')) {
      if (currentHunk) {
        hunks.push(finalizeHunk(currentHunk));
      }
      currentHunk = {
        id: `hunk-${hunkIndex++}`,
        fileHeader: currentFile,
        header: rawLine,
        lines: [],
        additions: 0,
        deletions: 0
      };
      continue;
    }

    if (currentHunk) {
      currentHunk.lines.push(rawLine);
      if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) currentHunk.additions++;
      if (rawLine.startsWith('-') && !rawLine.startsWith('---')) currentHunk.deletions++;
    }
  }

  if (currentHunk) hunks.push(finalizeHunk(currentHunk));
  return hunks;
}

function finalizeHunk(hunk) {
  return {
    id: hunk.id,
    fileHeader: hunk.fileHeader,
    header: hunk.header,
    lines: hunk.lines,
    additions: hunk.additions,
    deletions: hunk.deletions
  };
}

/**
 * Resolve the hunk-review state file path for a task.
 */
function hunkStatePath(projectDir, squadSlug, taskId) {
  return path.join(projectDir, SQUADS_DIR, squadSlug, 'tasks', taskId, 'hunk-review.json');
}

/**
 * Load hunk review state for a task. Returns null if not found.
 */
async function loadHunkState(projectDir, squadSlug, taskId) {
  try {
    const raw = await fs.readFile(hunkStatePath(projectDir, squadSlug, taskId), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save hunk review state for a task.
 */
async function saveHunkState(projectDir, squadSlug, taskId, state) {
  const p = hunkStatePath(projectDir, squadSlug, taskId);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Initialize hunk review state from a diff string.
 * Returns the initial state object (persisted to disk).
 */
async function initHunkReview(projectDir, squadSlug, taskId, diff) {
  const hunks = parseDiffHunks(diff);
  const state = {
    taskId,
    squadSlug,
    diff,
    hunks: hunks.map(h => ({
      id: h.id,
      fileHeader: h.fileHeader,
      header: h.header,
      lines: h.lines,
      additions: h.additions,
      deletions: h.deletions,
      status: HUNK_STATES.PENDING,
      comment: null,
      reviewedAt: null
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await saveHunkState(projectDir, squadSlug, taskId, state);
  return state;
}

/**
 * Get current hunk review state (or init from diff if missing).
 */
async function getHunks(projectDir, squadSlug, taskId, diff) {
  let state = await loadHunkState(projectDir, squadSlug, taskId);
  if (!state && diff) {
    state = await initHunkReview(projectDir, squadSlug, taskId, diff);
  }
  return state;
}

/**
 * Update the status of a single hunk.
 * @param {string} newStatus  — one of HUNK_STATES values
 * @param {string|null} comment
 * @returns {{ state, dispatch: string|null }}
 *   dispatch is 'task_done' | 'task_needs_revision' | null based on overall state after update
 */
async function updateHunk(projectDir, squadSlug, taskId, hunkId, newStatus, comment) {
  const state = await loadHunkState(projectDir, squadSlug, taskId);
  if (!state) return { ok: false, error: 'No hunk review state found' };

  const hunk = state.hunks.find(h => h.id === hunkId);
  if (!hunk) return { ok: false, error: `Hunk "${hunkId}" not found` };

  hunk.status = newStatus;
  if (comment !== undefined && comment !== null) hunk.comment = comment;
  hunk.reviewedAt = new Date().toISOString();
  state.updatedAt = new Date().toISOString();

  await saveHunkState(projectDir, squadSlug, taskId, state);

  const dispatch = computeDispatch(state.hunks);
  return { ok: true, hunk, dispatch, state };
}

/**
 * Compute the dispatch event based on all hunk statuses.
 * Returns: 'task_done' if all approved, 'task_needs_revision' if any rejected,
 *          null if still pending.
 */
function computeDispatch(hunks) {
  const allReviewed = hunks.every(h => h.status !== HUNK_STATES.PENDING);
  if (!allReviewed) return null;

  const rejectedHunks = hunks.filter(h => h.status === HUNK_STATES.REJECTED);
  if (rejectedHunks.length > 0) {
    return { event: 'task_needs_revision', rejectedHunks: rejectedHunks.map(h => h.id) };
  }

  return { event: 'task_done' };
}

/**
 * Get a summary of review progress: total, approved, rejected, pending.
 */
function getReviewProgress(hunks) {
  return {
    total: hunks.length,
    approved: hunks.filter(h => h.status === HUNK_STATES.APPROVED).length,
    rejected: hunks.filter(h => h.status === HUNK_STATES.REJECTED).length,
    revised: hunks.filter(h => h.status === HUNK_STATES.REVISED).length,
    pending: hunks.filter(h => h.status === HUNK_STATES.PENDING).length
  };
}

module.exports = {
  parseDiffHunks,
  initHunkReview,
  getHunks,
  updateHunk,
  loadHunkState,
  computeDispatch,
  getReviewProgress,
  HUNK_STATES
};
