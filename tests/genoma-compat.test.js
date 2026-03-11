'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  detectGenomeFormat,
  loadCompatibleGenome,
  normalizeLegacySquadGenomes
} = require('../src/lib/genomes/compat');

const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'fixtures');

function readFixture(...parts) {
  return fs.readFileSync(path.join(FIXTURES_DIR, ...parts), 'utf8');
}

test('detectGenomeFormat distinguishes legacy and v2 markdown fixtures', () => {
  const legacy = readFixture('genomes', 'legacy-copywriter.md');
  const current = readFixture('genomes', 'v2-growth.md');

  assert.equal(detectGenomeFormat(legacy), 'legacy-markdown');
  assert.equal(detectGenomeFormat(current), 'v2-markdown');
});

test('loadCompatibleGenome normalizes legacy markdown to genome v2 shape', () => {
  const legacy = readFixture('genomes', 'legacy-copywriter.md');
  const result = loadCompatibleGenome(legacy, { filePath: 'legacy-copywriter.md' });

  assert.equal(result.migrated, true);
  assert.equal(result.document.version, 2);
  assert.equal(result.document.format, 'genome-v2');
  assert.equal(result.document.slug, 'copywriter-direct-response');
  assert.equal(result.document.type, 'domain');
  assert.equal(Array.isArray(result.document.sections.mentes), true);
  assert.equal(Array.isArray(result.document.sections.skills), true);
});

test('loadCompatibleGenome keeps v2 markdown without migration', () => {
  const current = readFixture('genomes', 'v2-growth.md');
  const result = loadCompatibleGenome(current, { filePath: 'v2-growth.md' });

  assert.equal(result.migrated, false);
  assert.equal(result.document.version, 2);
  assert.equal(result.document.slug, 'growth-marketing');
  assert.equal(result.document.evidenceMode, 'inferred');
});

test('normalizeLegacySquadGenomes materializes genomeBindings while preserving genomes', () => {
  const manifest = JSON.parse(readFixture('squads', 'legacy-manifest-with-genomes.json'));
  const normalized = normalizeLegacySquadGenomes(manifest);

  assert.equal(Array.isArray(normalized.genomes), true);
  assert.equal(normalized.genomes.length, 2);
  assert.equal(typeof normalized.genomeBindings, 'object');
  assert.deepEqual(
    normalized.genomeBindings.squad.map((item) => item.slug),
    ['copywriter-direct-response', 'growth-marketing']
  );
  assert.deepEqual(
    normalized.genomeBindings.executors['lead-copy'].map((item) => item.slug),
    ['copywriter-direct-response']
  );
});
