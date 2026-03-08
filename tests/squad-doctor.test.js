'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runSquadDoctor } = require('../src/commands/squad-doctor');
const { openRuntimeDb, startRun, upsertContentItem } = require('../src/runtime-store');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-squad-doctor-'));
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

async function createSquadSkeleton(dir, slug) {
  await fs.mkdir(path.join(dir, '.aios-lite', 'squads'), { recursive: true });
  await fs.mkdir(path.join(dir, 'agents', slug), { recursive: true });
  await fs.mkdir(path.join(dir, 'output', slug), { recursive: true });
  await fs.mkdir(path.join(dir, 'media', slug), { recursive: true });

  await fs.writeFile(
    path.join(dir, '.aios-lite', 'squads', `${slug}.md`),
    `Squad: ${slug}\nMode: Squad\nGoal: Gerar conteudos\nAgents: agents/${slug}/\nOutput: output/${slug}/\nLogs: aios-logs/${slug}/\n`,
    'utf8'
  );
  await fs.writeFile(path.join(dir, 'agents', slug, 'agents.md'), '# Rules\n', 'utf8');
  await fs.writeFile(path.join(dir, 'agents', slug, 'design-doc.md'), '# Design doc\n', 'utf8');
  await fs.writeFile(path.join(dir, 'agents', slug, 'readiness.md'), '# Readiness\n', 'utf8');
  await fs.writeFile(path.join(dir, 'agents', slug, 'orquestrador.md'), '# Orquestrador\n', 'utf8');
  await fs.writeFile(
    path.join(dir, 'agents', slug, 'squad.manifest.json'),
    JSON.stringify(
      {
        slug,
        rules: {
          outputsDir: `output/${slug}`,
          mediaDir: `media/${slug}`
        },
        executors: [
          {
            slug: 'orquestrador',
            title: 'Orquestrador',
            file: `agents/${slug}/orquestrador.md`
          }
        ]
      },
      null,
      2
    ),
    'utf8'
  );
}

test('squad:doctor reports healthy squad when manifest and content index are consistent', async () => {
  const dir = await makeTempDir();
  const slug = 'composicao-gospel';
  await createSquadSkeleton(dir, slug);

  const runtime = await openRuntimeDb(dir);
  try {
    upsertContentItem(runtime.db, {
      contentKey: 'musica-01',
      squadSlug: slug,
      title: 'Musica 01',
      contentType: 'song',
      layoutType: 'document',
      payload: {
        contentKey: 'musica-01',
        title: 'Musica 01',
        contentType: 'song',
        layoutType: 'document',
        blocks: [{ type: 'rich-text', content: 'Verso 1\n\nRefrao' }]
      },
      jsonPath: `output/${slug}/musica-01/content.json`,
      htmlPath: `output/${slug}/musica-01/index.html`,
      createdByAgent: '@compositor'
    });
  } finally {
    runtime.db.close();
  }

  const { t } = createTranslator('pt-BR');
  const logger = createCollectLogger();
  const result = await runSquadDoctor({
    args: [dir],
    options: { squad: slug },
    logger,
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.failed, 0);
  assert.equal(result.summary.warned, 0);
});

test('squad:doctor warns about stale runs and output files pending indexing', async () => {
  const dir = await makeTempDir();
  const slug = 'composicao-gospel';
  await createSquadSkeleton(dir, slug);
  await fs.writeFile(path.join(dir, 'output', slug, 'letra-final.md'), '# Letra\n\nVerso 1', 'utf8');

  const runtime = await openRuntimeDb(dir);
  try {
    const runKey = startRun(runtime.db, {
      agentName: '@compositor',
      squadSlug: slug,
      title: 'Gerar letra'
    });
    runtime.db
      .prepare('UPDATE agent_runs SET updated_at = ? WHERE run_key = ?')
      .run('2020-01-01T00:00:00.000Z', runKey);
  } finally {
    runtime.db.close();
  }

  const { t } = createTranslator('pt-BR');
  const logger = createCollectLogger();
  const result = await runSquadDoctor({
    args: [dir],
    options: { squad: slug, 'stale-minutes': 5 },
    logger,
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.failed, 0);
  assert.equal(result.summary.warned >= 2, true);
  assert.equal(logger.lines.some((line) => line.includes('possivelmente travadas')), true);
  assert.equal(logger.lines.some((line) => line.includes('pendentes de indexacao')), true);
});
