'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const baseEn = require('./messages/en');
const { exists, ensureDir } = require('../utils');

function isValidLocaleCode(locale) {
  return /^[a-z]{2,3}([_-][a-z0-9]{2,8})?$/i.test(locale);
}

function normalizeLocaleFileName(locale) {
  return String(locale).trim().toLowerCase().replace(/_/g, '-');
}

async function createLocaleScaffold(locale, options = {}) {
  const normalized = normalizeLocaleFileName(locale);
  const messagesDir = options.messagesDir || path.join(__dirname, 'messages');
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);

  if (!isValidLocaleCode(normalized)) {
    const error = new Error(`Invalid locale code: ${locale}`);
    error.code = 'INVALID_LOCALE';
    throw error;
  }

  if (normalized === 'en') {
    const error = new Error('Cannot scaffold locale "en" because it is the base dictionary.');
    error.code = 'BASE_LOCALE';
    throw error;
  }

  await ensureDir(messagesDir);
  const filePath = path.join(messagesDir, `${normalized}.js`);
  const alreadyExists = await exists(filePath);

  if (alreadyExists && !force) {
    const error = new Error(`Locale file already exists: ${filePath}`);
    error.code = 'LOCALE_EXISTS';
    error.path = filePath;
    throw error;
  }

  const payload = JSON.stringify(baseEn, null, 2);
  const content = `'use strict';\n\n// TODO: Replace English strings with ${normalized} translations.\nmodule.exports = ${payload};\n`;

  if (!dryRun) {
    await fs.writeFile(filePath, content, 'utf8');
  }

  return {
    locale: normalized,
    filePath,
    overwritten: alreadyExists,
    dryRun
  };
}

module.exports = {
  createLocaleScaffold,
  isValidLocaleCode,
  normalizeLocaleFileName
};
