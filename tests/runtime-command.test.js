'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const {
  runRuntimeInit,
  runRuntimeTaskStart,
  runRuntimeStart,
  runRuntimeUpdate,
  runRuntimeTaskFinish,
  runRuntimeFinish,
  runRuntimeStatus
} = require('../src/commands/runtime');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-runtime-'));
}

function createCollectLogger() {
  const lines = [];
  return {
    lines,
    log(line) {
      lines.push(String(line));
    },
    error(line) {
      lines.push(String(line));
    }
  };
}

test('runtime flow initializes store and tracks start/update/finish lifecycle', async () => {
  const dir = await makeTempDir();
  const { t } = createTranslator('pt-BR');
  const logger = createCollectLogger();

  const init = await runRuntimeInit({ args: [dir], options: {}, logger, t });
  assert.equal(init.ok, true);
  assert.equal(init.dbPath.endsWith(path.join('.aios-lite', 'runtime', 'aios.sqlite')), true);

  const task = await runRuntimeTaskStart({
    args: [dir],
    options: {
      squad: 'youtube-creator',
      session: 'session-001',
      title: 'Criar roteiro do video',
      goal: 'Entregar roteiro, titulo e hook',
      by: '@orquestrador'
    },
    logger,
    t
  });

  assert.equal(task.ok, true);
  assert.equal(typeof task.taskKey, 'string');

  const start = await runRuntimeStart({
    args: [dir],
    options: {
      task: task.taskKey,
      agent: '@roteirista-viral',
      squad: 'youtube-creator',
      session: 'session-001',
      title: 'Gerar roteiro do video'
    },
    logger,
    t
  });

  assert.equal(start.ok, true);
  assert.equal(typeof start.runKey, 'string');
  assert.equal(start.status, 'running');

  const update = await runRuntimeUpdate({
    args: [dir],
    options: {
      run: start.runKey,
      message: 'Estrutura do roteiro pronta',
      summary: 'Abertura e blocos definidos'
    },
    logger,
    t
  });

  assert.equal(update.ok, true);
  assert.equal(update.status, 'running');

  const finish = await runRuntimeFinish({
    args: [dir],
    options: {
      run: start.runKey,
      task: task.taskKey,
      summary: 'Roteiro final entregue',
      output: 'output/youtube-creator/2026-03-06-video.html'
    },
    logger,
    t
  });

  assert.equal(finish.ok, true);
  assert.equal(finish.status, 'completed');

  const taskFinish = await runRuntimeTaskFinish({
    args: [dir],
    options: {
      task: task.taskKey
    },
    logger,
    t
  });

  assert.equal(taskFinish.ok, true);
  assert.equal(taskFinish.status, 'completed');

  const status = await runRuntimeStatus({
    args: [dir],
    options: { json: true },
    logger,
    t
  });

  assert.equal(status.ok, true);
  assert.equal(status.taskCounts.completed, 1);
  assert.equal(status.counts.running, 0);
  assert.equal(status.counts.completed, 1);
  assert.equal(status.activeTasks.length, 0);
  assert.equal(status.activeRuns.length, 0);
  assert.equal(status.recentTasks[0].task_key, task.taskKey);
  assert.equal(status.recentTasks[0].artifact_count, 1);
  assert.equal(status.recentRuns[0].agent_name, '@roteirista-viral');
  assert.equal(status.recentRuns[0].task_key, task.taskKey);
  assert.equal(status.recentRuns[0].squad_slug, 'youtube-creator');
  assert.equal(status.recentRuns[0].output_path, 'output/youtube-creator/2026-03-06-video.html');
  assert.equal(status.recentArtifacts[0].task_key, task.taskKey);
  assert.equal(status.recentArtifacts[0].file_path, 'output/youtube-creator/2026-03-06-video.html');
});
