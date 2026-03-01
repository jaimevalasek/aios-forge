'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  resolveAgentLocale,
  getLocalizedAgentPath,
  applyAgentLocale
} = require('../src/locales');
const { installTemplate } = require('../src/installer');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-locales-'));
}

test('resolveAgentLocale maps base language and fallback correctly', () => {
  assert.equal(resolveAgentLocale('pt'), 'pt-BR');
  assert.equal(resolveAgentLocale('pt-BR'), 'pt-BR');
  assert.equal(resolveAgentLocale('en-US'), 'en');
  assert.equal(resolveAgentLocale('unknown'), 'en');
});

test('getLocalizedAgentPath builds expected path', () => {
  assert.equal(
    getLocalizedAgentPath('setup', 'pt-BR'),
    '.aios-lite/locales/pt-BR/agents/setup.md'
  );
});

test('applyAgentLocale copies localized files into active agents directory', async () => {
  const dir = await makeTempDir();
  await installTemplate(dir, { mode: 'install' });

  const result = await applyAgentLocale(dir, 'pt-BR');
  assert.equal(result.locale, 'pt-BR');
  assert.equal(result.copied.length > 0, true);

  const setupPath = path.join(dir, '.aios-lite/agents/setup.md');
  const content = await fs.readFile(setupPath, 'utf8');
  assert.equal(content.includes('(pt-BR)'), true);
});

