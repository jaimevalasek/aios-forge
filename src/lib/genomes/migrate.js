'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { loadCompatibleGenome, serializeCompatibleGenome } = require('./compat');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function migrateGenomeFile(filePath, options = {}) {
  const {
    dryRun = true,
    write = false,
    backup = true,
    backupDir = null
  } = options;

  const raw = await fs.readFile(filePath, 'utf8');
  const loaded = loadCompatibleGenome(raw, { filePath });
  const output = serializeCompatibleGenome(loaded.document, { filePath });
  const changed = loaded.migrated;

  const result = {
    filePath,
    detectedFormat: loaded.format,
    migrated: loaded.migrated,
    changed,
    output,
    backupPath: null
  };

  if (!write || dryRun || !changed) {
    return result;
  }

  if (backup) {
    const targetBackupDir = backupDir || path.join(path.dirname(filePath), '.backup');
    await ensureDir(targetBackupDir);
    const backupPath = path.join(targetBackupDir, `${path.basename(filePath)}.bak`);
    await fs.writeFile(backupPath, raw, 'utf8');
    result.backupPath = backupPath;
  }

  await fs.writeFile(filePath, output, 'utf8');
  return result;
}

async function migrateGenomeDirectory(dirPath, options = {}) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.md')) continue;
    if (entry.name.endsWith('.meta.json')) continue;

    const filePath = path.join(dirPath, entry.name);
    results.push(await migrateGenomeFile(filePath, options));
  }

  return {
    directory: dirPath,
    total: results.length,
    changed: results.filter((item) => item.changed).length,
    results
  };
}

async function migrateIfLegacyGenome(filePath, options = {}) {
  if (!(await fileExists(filePath))) {
    throw new Error(`Genome file not found: ${filePath}`);
  }
  return migrateGenomeFile(filePath, options);
}

module.exports = {
  migrateGenomeFile,
  migrateGenomeDirectory,
  migrateIfLegacyGenome
};
