'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

/**
 * Create a git worktree for a squad agent.
 * Branch: aioson/{squadSlug}/{agentSlug}
 * Path: .aioson/squads/{squadSlug}/worktrees/{agentSlug}
 */
function createWorktree(projectDir, squadSlug, agentSlug) {
  const branchName = `aioson/${squadSlug}/${agentSlug}`;
  const worktreePath = path.join(projectDir, '.aioson', 'squads', squadSlug, 'worktrees', agentSlug);

  // Try with new branch first
  let result = spawnSync('git', ['worktree', 'add', '-b', branchName, worktreePath], {
    cwd: projectDir,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    // Branch may already exist — try without -b
    result = spawnSync('git', ['worktree', 'add', worktreePath, branchName], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || 'Failed to create worktree');
    }
  }

  return { ok: true, branchName, worktreePath };
}

/**
 * Merge worktree branch back to the current branch.
 * autoMerge=true → attempt fast-forward. false → report without merging.
 */
function mergeWorktree(projectDir, squadSlug, agentSlug, autoMerge = false) {
  const branchName = `aioson/${squadSlug}/${agentSlug}`;

  if (!autoMerge) {
    return { ok: false, reason: 'auto_merge_disabled', branch: branchName };
  }

  const result = spawnSync('git', ['merge', '--ff-only', branchName], {
    cwd: projectDir,
    encoding: 'utf8'
  });

  if (result.status === 0) {
    return { ok: true, branch: branchName, merged: true };
  }

  return {
    ok: false,
    reason: 'merge_conflict',
    branch: branchName,
    detail: (result.stderr || result.stdout || '').trim()
  };
}

/**
 * Remove a worktree (and optionally delete its branch).
 */
function cleanupWorktree(projectDir, squadSlug, agentSlug, deleteBranch = false) {
  const worktreePath = path.join(projectDir, '.aioson', 'squads', squadSlug, 'worktrees', agentSlug);
  const branchName = `aioson/${squadSlug}/${agentSlug}`;

  const result = spawnSync('git', ['worktree', 'remove', '--force', worktreePath], {
    cwd: projectDir,
    encoding: 'utf8'
  });

  const removed = result.status === 0;

  if (deleteBranch) {
    spawnSync('git', ['branch', '-D', branchName], { cwd: projectDir, encoding: 'utf8' });
  }

  return { ok: removed, worktreePath, branchName };
}

/**
 * List all squad worktrees (filters by aioson/{squadSlug}/ branch prefix).
 */
function listWorktrees(projectDir, squadSlug) {
  const result = spawnSync('git', ['worktree', 'list', '--porcelain'], {
    cwd: projectDir,
    encoding: 'utf8'
  });

  if (result.status !== 0) return [];

  const entries = [];
  const blocks = result.stdout.trim().split('\n\n');
  for (const block of blocks) {
    if (!block.trim()) continue;
    const entry = {};
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) entry.path = line.slice(9);
      else if (line.startsWith('branch ')) entry.branch = line.slice(7).replace('refs/heads/', '');
      else if (line.startsWith('HEAD ')) entry.head = line.slice(5);
    }
    if (entry.branch && entry.branch.startsWith(`aioson/${squadSlug}/`)) {
      entry.agentSlug = entry.branch.split('/').pop();
      entries.push(entry);
    }
  }

  return entries;
}

module.exports = { createWorktree, mergeWorktree, cleanupWorktree, listWorktrees };
