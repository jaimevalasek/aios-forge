'use strict';

const path = require('node:path');
const {
  resolveRuntimePaths,
  openRuntimeDb,
  runtimeStoreExists,
  startTask,
  updateTask,
  startRun,
  updateRun,
  attachArtifact,
  getStatusSnapshot
} = require('../runtime-store');

function resolveTargetDir(args) {
  return path.resolve(process.cwd(), args[0] || '.');
}

function requireOption(options, key, t) {
  const value = options[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(t('runtime.option_required', { option: `--${key}` }));
  }
  return String(value).trim();
}

async function withRuntimeDb(targetDir, t) {
  const handle = await openRuntimeDb(targetDir, { mustExist: true });
  if (!handle) {
    throw new Error(t('runtime.store_missing', { path: resolveRuntimePaths(targetDir).dbPath }));
  }
  return handle;
}

async function runRuntimeInit({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath, runtimeDir } = await openRuntimeDb(targetDir);
  db.close();

  if (!options.json) {
    logger.log(t('runtime.init_ok', { path: dbPath }));
  }

  return { ok: true, targetDir, runtimeDir, dbPath };
}

async function runRuntimeTaskStart({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const taskKey = startTask(db, {
      taskKey: options.task,
      squadSlug: options.squad,
      sessionKey: options.session,
      title: requireOption(options, 'title', t),
      goal: options.goal,
      createdBy: options.by
    });

    if (!options.json) {
      logger.log(t('runtime.task_start_ok', { task: taskKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      taskKey,
      status: 'running'
    };
  } finally {
    db.close();
  }
}

async function runRuntimeStart({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const runKey = startRun(db, {
      runKey: options.run,
      taskKey: options.task,
      agentName: requireOption(options, 'agent', t),
      agentKind: options.kind,
      squadSlug: options.squad,
      sessionKey: options.session,
      title: options.title,
      message: options.message,
      summary: options.summary,
      outputPath: options.output
    });

    const snapshot = getStatusSnapshot(db);
    if (!options.json) {
      logger.log(t('runtime.start_ok', { run: runKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      runKey,
      status: 'running',
      activeCount: snapshot.activeRuns.length
    };
  } finally {
    db.close();
  }
}

async function runRuntimeUpdate({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const runKey = requireOption(options, 'run', t);
    const status = updateRun(db, {
      runKey,
      status: 'running',
      taskKey: options.task,
      eventType: 'progress',
      message: options.message,
      summary: options.summary,
      outputPath: options.output
    });

    if (!options.json) {
      logger.log(t('runtime.update_ok', { run: runKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      runKey,
      status
    };
  } finally {
    db.close();
  }
}

async function runRuntimeFinish({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const runKey = requireOption(options, 'run', t);
    const status = updateRun(db, {
      runKey,
      status: 'completed',
      taskKey: options.task,
      eventType: 'finish',
      message: options.message || options.summary || 'Run completed',
      summary: options.summary,
      outputPath: options.output
    });

    const finishedRun = db
      .prepare('SELECT run_key, task_key, squad_slug, agent_name, output_path FROM agent_runs WHERE run_key = ?')
      .get(runKey);
    if (finishedRun && finishedRun.output_path) {
      attachArtifact(db, {
        taskKey: finishedRun.task_key,
        runKey: finishedRun.run_key,
        squadSlug: finishedRun.squad_slug,
        agentName: finishedRun.agent_name,
        filePath: finishedRun.output_path,
        title: options.title || options.summary || 'Artifact generated'
      });
    }

    if (!options.json) {
      logger.log(t('runtime.finish_ok', { run: runKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      runKey,
      status
    };
  } finally {
    db.close();
  }
}

async function runRuntimeTaskFinish({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const taskKey = requireOption(options, 'task', t);
    const taskStatus = updateTask(db, {
      taskKey,
      status: 'completed',
      goal: options.goal
    });

    if (!options.json) {
      logger.log(t('runtime.task_finish_ok', { task: taskKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      taskKey,
      status: taskStatus
    };
  } finally {
    db.close();
  }
}

async function runRuntimeFail({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const runKey = requireOption(options, 'run', t);
    const status = updateRun(db, {
      runKey,
      taskKey: options.task,
      status: 'failed',
      eventType: 'fail',
      message: options.message || options.summary || 'Run failed',
      summary: options.summary,
      outputPath: options.output
    });

    if (!options.json) {
      logger.log(t('runtime.fail_ok', { run: runKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      runKey,
      status
    };
  } finally {
    db.close();
  }
}

async function runRuntimeTaskFail({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { db, dbPath } = await withRuntimeDb(targetDir, t);

  try {
    const taskKey = requireOption(options, 'task', t);
    const status = updateTask(db, {
      taskKey,
      status: 'failed',
      goal: options.goal
    });

    if (!options.json) {
      logger.log(t('runtime.task_fail_ok', { task: taskKey, path: dbPath }));
    }

    return {
      ok: true,
      targetDir,
      dbPath,
      taskKey,
      status
    };
  } finally {
    db.close();
  }
}

async function runRuntimeStatus({ args, options = {}, logger, t }) {
  const targetDir = resolveTargetDir(args);
  const { dbPath } = resolveRuntimePaths(targetDir);

  if (!(await runtimeStoreExists(targetDir))) {
    if (options.json) {
      return { ok: false, error: 'store_missing', dbPath };
    }
    throw new Error(t('runtime.store_missing', { path: dbPath }));
  }

  const { db } = await openRuntimeDb(targetDir, { mustExist: true });

  try {
    const snapshot = getStatusSnapshot(db);
    const payload = {
      ok: true,
      targetDir,
      dbPath,
      taskCounts: snapshot.taskCounts,
      counts: snapshot.counts,
      activeTasks: snapshot.activeTasks,
      recentTasks: snapshot.recentTasks,
      activeRuns: snapshot.activeRuns,
      recentRuns: snapshot.recentRuns,
      recentArtifacts: snapshot.recentArtifacts
    };

    if (!options.json) {
      logger.log(t('runtime.status_title', { path: targetDir }));
      logger.log(t('runtime.status_db', { path: dbPath }));
      logger.log(
        t('runtime.status_task_counts', {
          queued: payload.taskCounts.queued,
          running: payload.taskCounts.running,
          completed: payload.taskCounts.completed,
          failed: payload.taskCounts.failed
        })
      );
      logger.log(
        t('runtime.status_counts', {
          queued: payload.counts.queued,
          running: payload.counts.running,
          completed: payload.counts.completed,
          failed: payload.counts.failed
        })
      );
      if (snapshot.activeTasks.length === 0) {
        logger.log(t('runtime.status_no_active_tasks'));
      } else {
        logger.log(t('runtime.status_active_tasks_title'));
        for (const task of snapshot.activeTasks) {
          logger.log(
            t('runtime.status_active_task_line', {
              task: task.task_key,
              squad: task.squad_slug || '—',
              status: task.status,
              title: task.title
            })
          );
        }
      }
      if (snapshot.activeRuns.length === 0) {
        logger.log(t('runtime.status_no_active'));
      } else {
        logger.log(t('runtime.status_active_title'));
        for (const run of snapshot.activeRuns) {
          logger.log(
            t('runtime.status_active_line', {
              agent: run.agent_name,
              squad: run.squad_slug || '—',
              status: run.status,
              title: run.title || run.summary || '—'
            })
          );
        }
      }
    }

    return payload;
  } finally {
    db.close();
  }
}

module.exports = {
  runRuntimeInit,
  runRuntimeTaskStart,
  runRuntimeStart,
  runRuntimeUpdate,
  runRuntimeTaskFinish,
  runRuntimeFinish,
  runRuntimeTaskFail,
  runRuntimeFail,
  runRuntimeStatus
};
