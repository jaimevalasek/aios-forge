'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  parseGenomeMarkdown,
  supportsLegacyGenomeMarkdown
} = require('../src/genome-format');
const { readGenome } = require('../src/genome-files');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-genomes-compat-'));
}

test('parseGenomeMarkdown supports legacy genome markdown', () => {
  const markdown = `---
genome: copywriting
domain: Copywriting
language: pt-BR
depth: standard
generated: 2026-03-10
mentes: 1
skills: 1
---

# Genome: Copywriting

## O que saber

Promessa, dor e clareza precisam aparecer juntas.

## Mentes

### O Estrategista
- Cognitive signature: pensa em posicionamento e ângulo
- Favourite question: "qual promessa move a audiência?"
- Blind spot: detalhes visuais

## Skills

- SKILL: hooks — cria ganchos com tensão e benefício`;

  const genome = parseGenomeMarkdown(markdown);

  assert.equal(genome.slug, 'copywriting');
  assert.equal(genome.legacyFormat, true);
  assert.equal(genome.sections.knowledge.length, 1);
  assert.equal(genome.sections.mentes.length, 1);
  assert.equal(genome.sections.skills.length, 1);
  assert.equal(supportsLegacyGenomeMarkdown(markdown), true);
});

test('parseGenomeMarkdown tolerates markdown without frontmatter', () => {
  const genome = parseGenomeMarkdown('# Storytelling BR\n\nHeurísticas para vídeos curtos.\n');

  assert.equal(genome.slug, 'storytelling-br');
  assert.equal(genome.domain, 'Storytelling BR');
  assert.equal(genome.legacyFormat, true);
  assert.equal(genome.sections.knowledge.length, 1);
});

test('readGenome synthesizes metadata when .meta.json does not exist', async () => {
  const dir = await makeTempDir();
  const genomeDir = path.join(dir, '.aios-lite', 'genomas');
  await fs.mkdir(genomeDir, { recursive: true });
  await fs.writeFile(
    path.join(genomeDir, 'copywriting.md'),
    `---
genome: copywriting
domain: Copywriting
language: pt-BR
depth: standard
generated: 2026-03-10
mentes: 1
skills: 1
---

# Genome: Copywriting

## O que saber

Promessa e clareza definem a leitura.

## Mentes

### O Estrategista
- Cognitive signature: busca vantagem narrativa
- Favourite question: "qual é a promessa?"
- Blind spot: acabamento visual

## Skills

- SKILL: hooks — abre textos com tensão`,
    'utf8'
  );

  const result = await readGenome(dir, 'copywriting');

  assert.equal(result.genome.slug, 'copywriting');
  assert.equal(result.meta.schemaVersion, 2);
  assert.equal(result.meta.compat.synthesizedFromLegacy, true);
  assert.equal(result.meta.counts.mentes, 1);
  assert.match(result.meta.createdAt, /^2026-03-10T/);
});

test('readGenome throws a clear error when metadata json is invalid', async () => {
  const dir = await makeTempDir();
  const genomeDir = path.join(dir, '.aios-lite', 'genomas');
  await fs.mkdir(genomeDir, { recursive: true });
  await fs.writeFile(path.join(genomeDir, 'storytelling-br.md'), '# Storytelling BR\n\nHeurísticas.\n', 'utf8');
  await fs.writeFile(path.join(genomeDir, 'storytelling-br.meta.json'), '{ invalid json', 'utf8');

  await assert.rejects(
    () => readGenome(dir, 'storytelling-br'),
    /Invalid genome meta JSON|Invalid genome meta|Unexpected token/
  );
});
