'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

async function readProcessFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all active processes across all squads (or for a specific squad).
 * Reads from .aioson/squads/{slug}/processes/*.json
 * Each file: { pid, squadSlug, agentSlug, startedAt, url, lastActivity, contextPct }
 */
async function getActiveProcesses(projectDir, squadSlug) {
  const squadsDir = path.join(projectDir, SQUADS_DIR);
  const processes = [];

  let squadNames;
  try {
    const entries = await fs.readdir(squadsDir, { withFileTypes: true });
    squadNames = entries
      .filter(e => e.isDirectory() && (!squadSlug || e.name === squadSlug))
      .map(e => e.name);
  } catch {
    return [];
  }

  for (const slug of squadNames) {
    const processesDir = path.join(squadsDir, slug, 'processes');
    let files;
    try {
      files = await fs.readdir(processesDir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const proc = await readProcessFile(path.join(processesDir, file));
      if (!proc) continue;

      const alive = isProcessAlive(proc.pid);
      const startedAt = proc.startedAt ? new Date(proc.startedAt) : null;
      const elapsedSeconds = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : null;

      processes.push({
        pid: proc.pid,
        squadSlug: proc.squadSlug || slug,
        agentSlug: proc.agentSlug || file.replace('.json', ''),
        startedAt: proc.startedAt || null,
        elapsedSeconds,
        url: proc.url || null,
        lastActivity: proc.lastActivity || null,
        contextPct: proc.contextPct != null ? proc.contextPct : null,
        alive,
        _file: path.join(processesDir, file)
      });
    }
  }

  processes.sort((a, b) => {
    if (!a.startedAt) return 1;
    if (!b.startedAt) return -1;
    return b.startedAt.localeCompare(a.startedAt);
  });

  return processes;
}

/**
 * Stop a process by PID (SIGTERM) and remove its process file.
 */
async function stopProcess(projectDir, pid) {
  const processes = await getActiveProcesses(projectDir, null);
  const proc = processes.find(p => String(p.pid) === String(pid));

  if (!proc) {
    return { ok: false, error: 'Process not found' };
  }
  if (!proc.alive) {
    // Clean up stale file anyway
    try { await fs.unlink(proc._file); } catch { /* ignore */ }
    return { ok: false, error: 'Process is not running' };
  }

  try {
    process.kill(Number(proc.pid), 'SIGTERM');
    try { await fs.unlink(proc._file); } catch { /* ignore */ }
    return { ok: true, pid: proc.pid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Stop all processes for a squad.
 */
async function stopSquadProcesses(projectDir, squadSlug) {
  const processes = await getActiveProcesses(projectDir, squadSlug);
  const results = [];
  for (const proc of processes) {
    results.push(await stopProcess(projectDir, proc.pid));
  }
  return results;
}

module.exports = { getActiveProcesses, stopProcess, stopSquadProcesses, isProcessAlive };
