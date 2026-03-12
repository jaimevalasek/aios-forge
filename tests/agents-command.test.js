'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runAgentsList } = require('../src/commands/agents');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-forge-agents-cmd-'));
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

test('agents command localizes line formatting in pt-BR', async () => {
  const dir = await makeTempDir();
  const { t } = createTranslator('pt-BR');
  const logger = createCollectLogger();

  const result = await runAgentsList({
    args: [dir],
    options: { lang: 'pt-BR' },
    logger,
    t
  });

  assert.equal(result.count > 0, true);
  assert.equal(logger.lines.some((line) => line.includes('- Agente: ')), true);
  assert.equal(logger.lines.some((line) => line.includes('Caminho: ')), true);
});
