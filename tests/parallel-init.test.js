'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runParallelInit, parseWorkers } = require('../src/commands/parallel-init');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-parallel-init-'));
}

function createQuietLogger() {
  return {
    log() {},
    error() {}
  };
}

async function writeContext(dir, classification = 'MEDIUM') {
  const contextPath = path.join(dir, '.aios-lite/context/project.context.md');
  await fs.mkdir(path.dirname(contextPath), { recursive: true });
  await fs.writeFile(
    contextPath,
    `---
project_name: "demo"
project_type: "web_app"
profile: "developer"
framework: "Node"
framework_installed: true
classification: "${classification}"
conversation_language: "en"
aios_lite_version: "0.1.9"
---

# Project Context
`,
    'utf8'
  );
}

test('parseWorkers validates supported worker range', () => {
  assert.equal(parseWorkers(undefined), 3);
  assert.equal(parseWorkers('2'), 2);
  assert.equal(parseWorkers('6'), 6);
  assert.equal(parseWorkers('1'), null);
  assert.equal(parseWorkers('7'), null);
  assert.equal(parseWorkers('abc'), null);
});

test('parallel:init creates shared and lane status files for medium projects', async () => {
  const dir = await makeTempDir();
  await writeContext(dir, 'MEDIUM');

  const { t } = createTranslator('en');
  const result = await runParallelInit({
    args: [dir],
    options: { workers: 4 },
    logger: createQuietLogger(),
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.classification, 'MEDIUM');
  assert.equal(result.workers, 4);
  assert.equal(result.files.length, 5);

  const shared = path.join(dir, '.aios-lite/context/parallel/shared-decisions.md');
  const lane1 = path.join(dir, '.aios-lite/context/parallel/agent-1.status.md');
  const lane4 = path.join(dir, '.aios-lite/context/parallel/agent-4.status.md');
  await assert.doesNotReject(() => fs.access(shared));
  await assert.doesNotReject(() => fs.access(lane1));
  await assert.doesNotReject(() => fs.access(lane4));
});

test('parallel:init rejects non-medium classification unless force is enabled', async () => {
  const dir = await makeTempDir();
  await writeContext(dir, 'SMALL');

  const { t } = createTranslator('en');
  await assert.rejects(
    runParallelInit({
      args: [dir],
      options: {},
      logger: createQuietLogger(),
      t
    }),
    /MEDIUM classification/
  );

  const forced = await runParallelInit({
    args: [dir],
    options: { force: true },
    logger: createQuietLogger(),
    t
  });
  assert.equal(forced.ok, true);
  assert.equal(forced.files.length, 4);
});

test('parallel:init dry-run does not write files', async () => {
  const dir = await makeTempDir();
  await writeContext(dir, 'MEDIUM');
  const { t } = createTranslator('en');

  const result = await runParallelInit({
    args: [dir],
    options: { 'dry-run': true, workers: 2 },
    logger: createQuietLogger(),
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.files.length, 3);
  await assert.rejects(() =>
    fs.access(path.join(dir, '.aios-lite/context/parallel/shared-decisions.md'))
  );
});
