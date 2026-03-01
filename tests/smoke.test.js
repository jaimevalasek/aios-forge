'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runSmokeTest } = require('../src/commands/smoke');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-smoke-test-'));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

test('test:smoke runs end-to-end and keeps workspace when requested', async () => {
  const baseDir = await makeTempDir();
  const { t } = createTranslator('en');
  const logger = { log() {}, error() {} };

  const result = await runSmokeTest({
    args: [baseDir],
    options: { lang: 'pt-BR', keep: true },
    logger,
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.steps.length >= 8, true);
  assert.equal(await fileExists(path.join(result.projectDir, '.aios-lite/context/project.context.md')), true);

  await fs.rm(result.workspaceRoot, { recursive: true, force: true });
});
