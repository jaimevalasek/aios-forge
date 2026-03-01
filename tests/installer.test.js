'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { installTemplate, detectExistingInstall } = require('../src/installer');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-installer-'));
}

test('installTemplate creates base installation', async () => {
  const dir = await makeTempDir();
  const result = await installTemplate(dir, { mode: 'install' });

  assert.equal(result.copied.length > 0, true);
  assert.equal(await detectExistingInstall(dir), true);
  assert.equal(await fileExists(path.join(dir, 'CLAUDE.md')), true);
  assert.equal(await fileExists(path.join(dir, '.aios-lite/config.md')), true);
});

test('update mode creates backups for managed files', async () => {
  const dir = await makeTempDir();
  await installTemplate(dir, { mode: 'install' });

  const target = path.join(dir, 'AGENTS.md');
  await fs.writeFile(target, '# custom\n', 'utf8');

  const result = await installTemplate(dir, {
    mode: 'update',
    overwrite: true,
    backupOnOverwrite: true
  });

  assert.equal(result.backedUp.length > 0, true);

  const backupsDir = path.join(dir, '.aios-lite/backups');
  assert.equal(await fileExists(backupsDir), true);
});

test('context folder is preserved during update', async () => {
  const dir = await makeTempDir();
  await installTemplate(dir, { mode: 'install' });

  const contextFile = path.join(dir, '.aios-lite/context/project.context.md');
  const customContext = 'custom-context';
  await fs.writeFile(contextFile, customContext, 'utf8');

  await installTemplate(dir, {
    mode: 'update',
    overwrite: true,
    backupOnOverwrite: true
  });

  const readBack = await fs.readFile(contextFile, 'utf8');
  assert.equal(readBack, customContext);
});

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
