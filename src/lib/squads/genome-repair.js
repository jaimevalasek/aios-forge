'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { normalizeLegacySquadGenomes } = require('../genomes/compat');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function repairSquadManifestGenomeBindings(manifestPath, options = {}) {
  const {
    dryRun = true,
    write = false,
    backup = true
  } = options;

  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const repaired = normalizeLegacySquadGenomes(manifest);
  const changed = JSON.stringify(manifest) !== JSON.stringify(repaired);

  const result = {
    manifestPath,
    changed,
    before: manifest,
    after: repaired,
    backupPath: null
  };

  if (!changed || dryRun || !write) {
    return result;
  }

  if (backup) {
    const backupDir = path.join(path.dirname(manifestPath), '.backup');
    await ensureDir(backupDir);
    const backupPath = path.join(backupDir, `${path.basename(manifestPath)}.bak`);
    await fs.writeFile(backupPath, raw, 'utf8');
    result.backupPath = backupPath;
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
  return result;
}

module.exports = {
  repairSquadManifestGenomeBindings
};
