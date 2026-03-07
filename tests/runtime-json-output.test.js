'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-runtime-json-'));
}

function runCli(args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(process.cwd(), 'bin/aios-lite.js'), ...args], {
      cwd,
      env: process.env
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

test('runtime commands return structured JSON payloads', async () => {
  const dir = await makeTempDir();

  const init = await runCli(['runtime:init', dir, '--json']);
  assert.equal(init.code, 0);
  const initParsed = JSON.parse(init.stdout);
  assert.equal(initParsed.ok, true);

  const task = await runCli([
    'runtime:task:start',
    dir,
    '--title=Gerar pacote editorial',
    '--squad=youtube-creator',
    '--session=session-002',
    '--json'
  ]);
  assert.equal(task.code, 0);
  const taskParsed = JSON.parse(task.stdout);
  assert.equal(taskParsed.ok, true);
  assert.equal(typeof taskParsed.taskKey, 'string');

  const start = await runCli([
    'runtime:start',
    dir,
    `--task=${taskParsed.taskKey}`,
    '--agent=@copywriter',
    '--squad=youtube-creator',
    '--session=session-002',
    '--title=Gerar titulos',
    '--json'
  ]);
  assert.equal(start.code, 0);
  const startParsed = JSON.parse(start.stdout);
  assert.equal(startParsed.ok, true);
  assert.equal(typeof startParsed.runKey, 'string');

  const status = await runCli(['runtime:status', dir, '--json']);
  assert.equal(status.code, 0);
  const statusParsed = JSON.parse(status.stdout);
  assert.equal(statusParsed.ok, true);
  assert.equal(statusParsed.taskCounts.running, 1);
  assert.equal(statusParsed.counts.running, 1);
  assert.equal(statusParsed.activeTasks[0].task_key, taskParsed.taskKey);
  assert.equal(statusParsed.activeRuns[0].agent_name, '@copywriter');
});
