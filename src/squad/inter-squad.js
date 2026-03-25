'use strict';
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { openRuntimeDb, insertWorkerRun } = require('../runtime-store');

const INBOX_DIR = (projectDir, squadSlug) =>
  path.join(projectDir, '.aioson', 'squads', squadSlug, 'inbox');

async function callSquad({ projectDir, from, to, worker, payload, conversationId, depth = 0 }) {
  // 1. Cascade guard
  if (depth > 5) return { ok: false, error: 'cascade_guard' };

  conversationId = conversationId || randomUUID();

  // 2. Resolver porta do squad destino no SQLite (manter DB aberto para log)
  const handle = await openRuntimeDb(projectDir);
  const db = handle?.db;
  const port = db
    ?.prepare("SELECT port FROM squad_daemons WHERE squad_slug = ? AND status = 'running'")
    .get(to)?.port;

  let result;

  // 3. Tentar chamada direta
  if (port) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/webhook/${worker}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, _inter_squad: { from, conversationId, depth: depth + 1 } }),
        signal: AbortSignal.timeout(10000)
      });
      const json = await res.json();
      result = { ok: res.ok, result: json, conversationId };
    } catch {
      // cai para inbox
    }
  }

  // 4. Enfileirar na inbox do squad destino
  if (!result) {
    const inboxDir = INBOX_DIR(projectDir, to);
    await fs.mkdir(inboxDir, { recursive: true });
    const id = randomUUID();
    await fs.writeFile(
      path.join(inboxDir, `${id}.json`),
      JSON.stringify({ id, from, to, worker, payload, conversationId, depth, created_at: new Date().toISOString() })
    );
    result = { ok: false, error: 'offline_queued', conversationId };
  }

  // 5. Gravar chamada emitida no runtime store (trigger_type = 'inter-squad')
  if (db) {
    try {
      insertWorkerRun(db, {
        squadSlug: from,
        workerSlug: worker,
        triggerType: 'inter-squad',
        inputJson: JSON.stringify({ to, payload, conversationId }),
        outputJson: result.ok ? JSON.stringify(result.result) : null,
        status: result.ok ? 'completed' : 'failed',
        errorMessage: result.ok ? null : result.error,
        durationMs: 0,
        attempt: 1
      });
    } catch { /* ignore */ }
    db.close();
  }

  return result;
}

module.exports = { callSquad, INBOX_DIR };
