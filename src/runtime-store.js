'use strict';

const path = require('node:path');
const Database = require('better-sqlite3');
const { ensureDir, exists } = require('./utils');

const RUNTIME_DIR = path.join('.aios-lite', 'runtime');
const DB_FILE = 'aios.sqlite';
const VALID_STATUSES = new Set(['queued', 'running', 'completed', 'failed']);
const VALID_TASK_STATUSES = new Set(['queued', 'running', 'completed', 'failed']);

function slugify(value) {
  return String(value || 'run')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'run';
}

function nowIso() {
  return new Date().toISOString();
}

function resolveRuntimePaths(targetDir) {
  const runtimeDir = path.join(targetDir, RUNTIME_DIR);
  return {
    runtimeDir,
    dbPath: path.join(runtimeDir, DB_FILE)
  };
}

async function runtimeStoreExists(targetDir) {
  const { dbPath } = resolveRuntimePaths(targetDir);
  return exists(dbPath);
}

async function openRuntimeDb(targetDir, options = {}) {
  const { runtimeDir, dbPath } = resolveRuntimePaths(targetDir);
  const mustExist = Boolean(options.mustExist);

  if (mustExist && !(await exists(dbPath))) {
    return null;
  }

  await ensureDir(runtimeDir);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS squads (
      squad_slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mission TEXT,
      goal TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      visibility TEXT NOT NULL DEFAULT 'private',
      manifest_json TEXT,
      context_json TEXT,
      agents_dir TEXT,
      output_dir TEXT,
      logs_dir TEXT,
      media_dir TEXT,
      latest_session_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS squad_executors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_slug TEXT NOT NULL,
      executor_slug TEXT NOT NULL,
      title TEXT,
      role TEXT,
      file_path TEXT,
      skills_json TEXT,
      genomes_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (squad_slug, executor_slug),
      FOREIGN KEY (squad_slug) REFERENCES squads(squad_slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS squad_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_slug TEXT NOT NULL,
      skill_slug TEXT NOT NULL,
      title TEXT,
      description TEXT,
      UNIQUE (squad_slug, skill_slug),
      FOREIGN KEY (squad_slug) REFERENCES squads(squad_slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS squad_mcps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_slug TEXT NOT NULL,
      mcp_slug TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      purpose TEXT,
      UNIQUE (squad_slug, mcp_slug),
      FOREIGN KEY (squad_slug) REFERENCES squads(squad_slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS squad_genomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_slug TEXT NOT NULL,
      genome_slug TEXT NOT NULL,
      scope_type TEXT NOT NULL DEFAULT 'squad',
      agent_slug TEXT,
      UNIQUE (squad_slug, genome_slug, scope_type, agent_slug),
      FOREIGN KEY (squad_slug) REFERENCES squads(squad_slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      task_key TEXT PRIMARY KEY,
      squad_slug TEXT,
      session_key TEXT,
      title TEXT NOT NULL,
      goal TEXT,
      status TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      run_key TEXT PRIMARY KEY,
      task_key TEXT,
      agent_name TEXT NOT NULL,
      agent_kind TEXT NOT NULL DEFAULT 'official',
      squad_slug TEXT,
      session_key TEXT,
      title TEXT,
      status TEXT NOT NULL,
      summary TEXT,
      output_path TEXT,
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      finished_at TEXT,
      FOREIGN KEY (task_key) REFERENCES tasks(task_key) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      payload_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_key) REFERENCES agent_runs(run_key) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_key TEXT,
      run_key TEXT,
      squad_slug TEXT,
      agent_name TEXT,
      kind TEXT NOT NULL,
      title TEXT,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_key) REFERENCES tasks(task_key) ON DELETE SET NULL,
      FOREIGN KEY (run_key) REFERENCES agent_runs(run_key) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_squads_updated ON squads(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_squad_executors_squad ON squad_executors(squad_slug, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_squad_skills_squad ON squad_skills(squad_slug);
    CREATE INDEX IF NOT EXISTS idx_squad_mcps_squad ON squad_mcps(squad_slug);
    CREATE INDEX IF NOT EXISTS idx_squad_genomes_squad ON squad_genomes(squad_slug);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_squad ON tasks(squad_slug, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_task ON agent_runs(task_key, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_squad ON agent_runs(squad_slug, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_events_run ON agent_events(run_key, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_artifacts_task ON artifacts(task_key, created_at DESC);
  `);

  ensureLegacyColumns(db);

  return { db, dbPath, runtimeDir };
}

function createRunKey(agentName) {
  return `${slugify(agentName)}-${Date.now()}`;
}

function createTaskKey(title) {
  return `task-${slugify(title)}-${Date.now()}`;
}

function normalizeStatus(value, fallback) {
  const candidate = String(value || fallback || '')
    .trim()
    .toLowerCase();
  return VALID_STATUSES.has(candidate) ? candidate : fallback;
}

function normalizeTaskStatus(value, fallback) {
  const candidate = String(value || fallback || '')
    .trim()
    .toLowerCase();
  return VALID_TASK_STATUSES.has(candidate) ? candidate : fallback;
}

function ensureLegacyColumns(db) {
  const agentRunColumns = db.prepare('PRAGMA table_info(agent_runs)').all();
  const agentRunColumnNames = new Set(agentRunColumns.map((column) => column.name));

  if (!agentRunColumnNames.has('task_key')) {
    db.exec('ALTER TABLE agent_runs ADD COLUMN task_key TEXT');
  }

  const squadColumns = db.prepare('PRAGMA table_info(squads)').all();
  const squadColumnNames = new Set(squadColumns.map((column) => column.name));

  if (!squadColumnNames.has('context_json')) {
    db.exec('ALTER TABLE squads ADD COLUMN context_json TEXT');
  }
}

function insertEvent(db, record) {
  db.prepare(`
    INSERT INTO agent_events (run_key, event_type, message, payload_json, created_at)
    VALUES (@run_key, @event_type, @message, @payload_json, @created_at)
  `).run(record);
}

function startTask(db, options) {
  const now = nowIso();
  const taskKey = String(options.taskKey || createTaskKey(options.title));
  const status = normalizeTaskStatus(options.status, 'running');

  db.prepare(`
    INSERT INTO tasks (
      task_key, squad_slug, session_key, title, goal, status, created_by,
      created_at, updated_at, finished_at
    ) VALUES (
      @task_key, @squad_slug, @session_key, @title, @goal, @status, @created_by,
      @created_at, @updated_at, @finished_at
    )
  `).run({
    task_key: taskKey,
    squad_slug: options.squadSlug ? String(options.squadSlug).trim() : null,
    session_key: options.sessionKey ? String(options.sessionKey).trim() : null,
    title: String(options.title).trim(),
    goal: options.goal ? String(options.goal).trim() : null,
    status,
    created_by: options.createdBy ? String(options.createdBy).trim() : null,
    created_at: now,
    updated_at: now,
    finished_at: status === 'completed' || status === 'failed' ? now : null
  });

  return taskKey;
}

function updateTask(db, options) {
  const existing = db.prepare('SELECT task_key, status FROM tasks WHERE task_key = ?').get(options.taskKey);
  if (!existing) {
    throw new Error(`Task not found: ${options.taskKey}`);
  }

  const now = nowIso();
  const nextStatus = normalizeTaskStatus(options.status, existing.status || 'running');

  db.prepare(`
    UPDATE tasks
    SET
      status = @status,
      goal = COALESCE(@goal, goal),
      updated_at = @updated_at,
      finished_at = CASE
        WHEN @status IN ('completed', 'failed') THEN @updated_at
        ELSE finished_at
      END
    WHERE task_key = @task_key
  `).run({
    task_key: String(options.taskKey),
    status: nextStatus,
    goal: options.goal ? String(options.goal).trim() : null,
    updated_at: now
  });

  return nextStatus;
}

function attachArtifact(db, options) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO artifacts (
      task_key, run_key, squad_slug, agent_name, kind, title, file_path, created_at
    ) VALUES (
      @task_key, @run_key, @squad_slug, @agent_name, @kind, @title, @file_path, @created_at
    )
  `).run({
    task_key: options.taskKey ? String(options.taskKey) : null,
    run_key: options.runKey ? String(options.runKey) : null,
    squad_slug: options.squadSlug ? String(options.squadSlug) : null,
    agent_name: options.agentName ? String(options.agentName) : null,
    kind: String(options.kind || inferArtifactKind(options.filePath || '')).trim(),
    title: options.title ? String(options.title).trim() : null,
    file_path: String(options.filePath).trim(),
    created_at: now
  });
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function upsertSquadManifest(db, options) {
  const now = nowIso();
  const slug = String(options.slug).trim();
  const manifest = options.manifest && typeof options.manifest === 'object' ? options.manifest : {};
  const context =
    options.context && typeof options.context === 'object'
      ? options.context
      : manifest.context && typeof manifest.context === 'object'
        ? manifest.context
        : null;
  const skills = normalizeArray(manifest.skills);
  const mcps = normalizeArray(manifest.mcps);
  const executors = normalizeArray(manifest.executors);
  const genomes = normalizeArray(manifest.genomes);

  db.prepare(`
    INSERT INTO squads (
      squad_slug, name, mission, goal, status, visibility, manifest_json,
      context_json,
      agents_dir, output_dir, logs_dir, media_dir, latest_session_path,
      created_at, updated_at
    ) VALUES (
      @squad_slug, @name, @mission, @goal, @status, @visibility, @manifest_json,
      @context_json,
      @agents_dir, @output_dir, @logs_dir, @media_dir, @latest_session_path,
      @created_at, @updated_at
    )
    ON CONFLICT(squad_slug) DO UPDATE SET
      name = excluded.name,
      mission = excluded.mission,
      goal = excluded.goal,
      status = excluded.status,
      visibility = excluded.visibility,
      manifest_json = excluded.manifest_json,
      context_json = excluded.context_json,
      agents_dir = excluded.agents_dir,
      output_dir = excluded.output_dir,
      logs_dir = excluded.logs_dir,
      media_dir = excluded.media_dir,
      latest_session_path = excluded.latest_session_path,
      updated_at = excluded.updated_at
  `).run({
    squad_slug: slug,
    name: String(options.name || manifest.name || slug).trim(),
    mission: options.mission ? String(options.mission).trim() : manifest.mission ? String(manifest.mission).trim() : null,
    goal: options.goal ? String(options.goal).trim() : manifest.goal ? String(manifest.goal).trim() : null,
    status: String(options.status || 'active').trim(),
    visibility: String(options.visibility || manifest.visibility || 'private').trim(),
    manifest_json: JSON.stringify(manifest),
    context_json: context ? JSON.stringify(context) : null,
    agents_dir: options.agentsDir ? String(options.agentsDir).trim() : null,
    output_dir: options.outputDir ? String(options.outputDir).trim() : null,
    logs_dir: options.logsDir ? String(options.logsDir).trim() : null,
    media_dir: options.mediaDir ? String(options.mediaDir).trim() : null,
    latest_session_path: options.latestSessionPath ? String(options.latestSessionPath).trim() : null,
    created_at: now,
    updated_at: now
  });

  db.prepare('DELETE FROM squad_executors WHERE squad_slug = ?').run(slug);
  db.prepare('DELETE FROM squad_skills WHERE squad_slug = ?').run(slug);
  db.prepare('DELETE FROM squad_mcps WHERE squad_slug = ?').run(slug);
  db.prepare('DELETE FROM squad_genomes WHERE squad_slug = ?').run(slug);

  const insertExecutor = db.prepare(`
    INSERT INTO squad_executors (
      squad_slug, executor_slug, title, role, file_path, skills_json, genomes_json,
      created_at, updated_at
    ) VALUES (
      @squad_slug, @executor_slug, @title, @role, @file_path, @skills_json, @genomes_json,
      @created_at, @updated_at
    )
  `);

  for (const executor of executors) {
    insertExecutor.run({
      squad_slug: slug,
      executor_slug: String(executor.slug || '').trim(),
      title: executor.title ? String(executor.title).trim() : null,
      role: executor.role ? String(executor.role).trim() : null,
      file_path: executor.file ? String(executor.file).trim() : null,
      skills_json: JSON.stringify(normalizeArray(executor.skills)),
      genomes_json: JSON.stringify(normalizeArray(executor.genomes)),
      created_at: now,
      updated_at: now
    });
  }

  const insertSkill = db.prepare(`
    INSERT INTO squad_skills (squad_slug, skill_slug, title, description)
    VALUES (@squad_slug, @skill_slug, @title, @description)
  `);

  for (const skill of skills) {
    insertSkill.run({
      squad_slug: slug,
      skill_slug: String(skill.slug || '').trim(),
      title: skill.title ? String(skill.title).trim() : null,
      description: skill.description ? String(skill.description).trim() : null
    });
  }

  const insertMcp = db.prepare(`
    INSERT INTO squad_mcps (squad_slug, mcp_slug, required, purpose)
    VALUES (@squad_slug, @mcp_slug, @required, @purpose)
  `);

  for (const mcp of mcps) {
    insertMcp.run({
      squad_slug: slug,
      mcp_slug: String(mcp.slug || '').trim(),
      required: mcp.required ? 1 : 0,
      purpose: mcp.purpose ? String(mcp.purpose).trim() : null
    });
  }

  const insertGenome = db.prepare(`
    INSERT INTO squad_genomes (squad_slug, genome_slug, scope_type, agent_slug)
    VALUES (@squad_slug, @genome_slug, @scope_type, @agent_slug)
  `);

  for (const genome of genomes) {
    insertGenome.run({
      squad_slug: slug,
      genome_slug: String(genome.slug || '').trim(),
      scope_type: String(genome.scope || 'squad').trim(),
      agent_slug: genome.agentSlug ? String(genome.agentSlug).trim() : null
    });
  }

  return slug;
}

function inferArtifactKind(filePath) {
  if (/\.html?$/i.test(filePath)) return 'html';
  if (/\.md$/i.test(filePath)) return 'markdown';
  return 'file';
}

function startRun(db, options) {
  const now = nowIso();
  const runKey = String(options.runKey || createRunKey(options.agentName));
  const status = normalizeStatus(options.status, 'running');
  const agentKind = String(options.agentKind || (options.squadSlug ? 'squad' : 'official')).trim();
  const taskKey = options.taskKey ? String(options.taskKey).trim() : null;

  if (taskKey) {
    const taskExists = db.prepare('SELECT task_key FROM tasks WHERE task_key = ?').get(taskKey);
    if (!taskExists) {
      throw new Error(`Task not found: ${taskKey}`);
    }
  }

  db.prepare(`
    INSERT INTO agent_runs (
      run_key, task_key, agent_name, agent_kind, squad_slug, session_key, title,
      status, summary, output_path, started_at, updated_at, finished_at
    ) VALUES (
      @run_key, @task_key, @agent_name, @agent_kind, @squad_slug, @session_key, @title,
      @status, @summary, @output_path, @started_at, @updated_at, @finished_at
    )
  `).run({
    run_key: runKey,
    task_key: taskKey,
    agent_name: String(options.agentName).trim(),
    agent_kind: agentKind,
    squad_slug: options.squadSlug ? String(options.squadSlug).trim() : null,
    session_key: options.sessionKey ? String(options.sessionKey).trim() : null,
    title: options.title ? String(options.title).trim() : null,
    status,
    summary: options.summary ? String(options.summary).trim() : null,
    output_path: options.outputPath ? String(options.outputPath).trim() : null,
    started_at: now,
    updated_at: now,
    finished_at: status === 'completed' || status === 'failed' ? now : null
  });

  insertEvent(db, {
    run_key: runKey,
    event_type: 'start',
    message: String(options.message || options.title || 'Agent started'),
    payload_json: options.payload ? JSON.stringify(options.payload) : null,
    created_at: now
  });

  return runKey;
}

function updateRun(db, options) {
  const now = nowIso();
  const existing = db.prepare('SELECT run_key, status FROM agent_runs WHERE run_key = ?').get(options.runKey);
  if (!existing) {
    throw new Error(`Run not found: ${options.runKey}`);
  }
  const taskKey = options.taskKey ? String(options.taskKey).trim() : null;

  if (taskKey) {
    const taskExists = db.prepare('SELECT task_key FROM tasks WHERE task_key = ?').get(taskKey);
    if (!taskExists) {
      throw new Error(`Task not found: ${taskKey}`);
    }
  }

  const nextStatus = normalizeStatus(options.status, existing.status || 'running');
  db.prepare(`
    UPDATE agent_runs
    SET
      status = @status,
      summary = COALESCE(@summary, summary),
      output_path = COALESCE(@output_path, output_path),
      task_key = COALESCE(@task_key, task_key),
      updated_at = @updated_at,
      finished_at = CASE
        WHEN @status IN ('completed', 'failed') THEN @updated_at
        ELSE finished_at
      END
    WHERE run_key = @run_key
  `).run({
    run_key: String(options.runKey),
    status: nextStatus,
    summary: options.summary ? String(options.summary).trim() : null,
    output_path: options.outputPath ? String(options.outputPath).trim() : null,
    task_key: taskKey,
    updated_at: now
  });

  insertEvent(db, {
    run_key: String(options.runKey),
    event_type: String(options.eventType || 'update'),
    message: String(options.message || options.summary || 'Run updated'),
    payload_json: options.payload ? JSON.stringify(options.payload) : null,
    created_at: now
  });

  return nextStatus;
}

function getStatusSnapshot(db) {
  const taskSummaryRows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM tasks
    GROUP BY status
  `).all();

  const taskCounts = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0
  };

  for (const row of taskSummaryRows) {
    if (Object.prototype.hasOwnProperty.call(taskCounts, row.status)) {
      taskCounts[row.status] = Number(row.count || 0);
    }
  }

  const summaryRows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM agent_runs
    GROUP BY status
  `).all();

  const counts = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0
  };

  for (const row of summaryRows) {
    if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
      counts[row.status] = Number(row.count || 0);
    }
  }

  const activeRuns = db.prepare(`
    SELECT run_key, task_key, agent_name, agent_kind, squad_slug, session_key, title, status, summary, output_path, started_at, updated_at
    FROM agent_runs
    WHERE status IN ('queued', 'running')
    ORDER BY updated_at DESC, started_at DESC
  `).all();

  const recentRuns = db.prepare(`
    SELECT run_key, task_key, agent_name, agent_kind, squad_slug, session_key, title, status, summary, output_path, started_at, updated_at, finished_at
    FROM agent_runs
    ORDER BY updated_at DESC, started_at DESC
    LIMIT 20
  `).all();

  const activeTasks = db.prepare(`
    SELECT
      task_key, squad_slug, session_key, title, goal, status, created_by, created_at, updated_at,
      (
        SELECT COUNT(*)
        FROM agent_runs
        WHERE agent_runs.task_key = tasks.task_key
      ) AS agent_count,
      (
        SELECT COUNT(*)
        FROM artifacts
        WHERE artifacts.task_key = tasks.task_key
      ) AS artifact_count
    FROM tasks
    WHERE status IN ('queued', 'running')
    ORDER BY updated_at DESC, created_at DESC
  `).all();

  const recentTasks = db.prepare(`
    SELECT
      task_key, squad_slug, session_key, title, goal, status, created_by, created_at, updated_at, finished_at,
      (
        SELECT COUNT(*)
        FROM agent_runs
        WHERE agent_runs.task_key = tasks.task_key
      ) AS agent_count,
      (
        SELECT COUNT(*)
        FROM artifacts
        WHERE artifacts.task_key = tasks.task_key
      ) AS artifact_count
    FROM tasks
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 20
  `).all();

  const recentArtifacts = db.prepare(`
    SELECT id, task_key, run_key, squad_slug, agent_name, kind, title, file_path, created_at
    FROM artifacts
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  return {
    taskCounts,
    counts,
    activeTasks,
    recentTasks,
    activeRuns,
    recentRuns,
    recentArtifacts
  };
}

module.exports = {
  resolveRuntimePaths,
  runtimeStoreExists,
  openRuntimeDb,
  upsertSquadManifest,
  startTask,
  updateTask,
  startRun,
  updateRun,
  attachArtifact,
  getStatusSnapshot,
  createRunKey,
  createTaskKey
};
