'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { runDoctor } = require('../src/doctor');
const { installTemplate } = require('../src/installer');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-doctor-'));
}

test('doctor reports issues in empty folder', async () => {
  const dir = await makeTempDir();
  const report = await runDoctor(dir);
  assert.equal(report.ok, false);
  assert.equal(report.failedCount > 0, true);
});

test('doctor passes after install and context generation', async () => {
  const dir = await makeTempDir();
  await installTemplate(dir, { mode: 'install' });
  await fs.writeFile(path.join(dir, '.aios-lite/context/project.context.md'), '# context\n', 'utf8');

  const report = await runDoctor(dir);
  assert.equal(report.ok, true);
});
