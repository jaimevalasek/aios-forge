'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runInit } = require('../src/commands/init');
const { runInstall } = require('../src/commands/install');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-guidance-'));
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

test('init prints agent onboarding hints and defaults tool to codex', async () => {
  const tempDir = await makeTempDir();
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const { t } = createTranslator('en');
    const logger = createCollectLogger();
    await runInit({
      args: ['demo-app'],
      options: { 'dry-run': true },
      logger,
      t
    });

    assert.equal(logger.lines.some((line) => line.includes('aios-lite agents')), true);
    assert.equal(
      logger.lines.some((line) =>
        line.includes('aios-lite agent:prompt setup --tool=codex')
      ),
      true
    );
  } finally {
    process.chdir(originalCwd);
  }
});

test('install prints agent onboarding hints and honors explicit --tool', async () => {
  const tempDir = await makeTempDir();
  const { t } = createTranslator('en');
  const logger = createCollectLogger();

  await runInstall({
    args: [tempDir],
    options: { 'dry-run': true, tool: 'claude' },
    logger,
    t
  });

  assert.equal(
    logger.lines.some((line) => line.includes('aios-lite setup:context --defaults')),
    true
  );
  assert.equal(logger.lines.some((line) => line.includes('aios-lite agents')), true);
  assert.equal(
    logger.lines.some((line) =>
      line.includes('aios-lite agent:prompt setup --tool=claude')
    ),
    true
  );
});
