'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MESSAGES_DIR = path.join(__dirname, 'messages');

function getByPath(obj, dottedPath) {
  return dottedPath.split('.').reduce((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return acc[key];
  }, obj);
}

function applyParams(template, params = {}) {
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return match;
  });
}

function loadMessages() {
  const messages = {};

  if (!fs.existsSync(MESSAGES_DIR)) {
    return { en: {} };
  }

  const files = fs.readdirSync(MESSAGES_DIR);
  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    const locale = path.basename(file, '.js').toLowerCase();
    try {
      const modulePath = path.join(MESSAGES_DIR, file);
      delete require.cache[require.resolve(modulePath)];
      const dict = require(modulePath);
      if (dict && typeof dict === 'object') {
        messages[locale] = dict;
      }
    } catch {
      // Ignore invalid locale files and rely on fallback locales.
    }
  }

  if (!messages.en) {
    messages.en = {};
  }

  return messages;
}

function normalizeLocale(raw, messages = loadMessages()) {
  const supported = Object.keys(messages);
  if (supported.length === 0) return 'en';

  if (!raw) return supported.includes('en') ? 'en' : supported[0];

  const clean = String(raw).toLowerCase();
  if (supported.includes(clean)) return clean;

  const base = clean.split(/[-_]/)[0];
  if (supported.includes(base)) return base;

  if (supported.includes('en')) return 'en';
  return supported[0];
}

function createTranslator(locale) {
  const messages = loadMessages();
  const resolvedLocale = normalizeLocale(locale, messages);
  const dictionary = messages[resolvedLocale] || messages.en || {};

  function t(key, params) {
    const fromLocale = getByPath(dictionary, key);
    if (fromLocale !== undefined) return applyParams(fromLocale, params);

    const fallback = getByPath(messages.en || {}, key);
    if (fallback !== undefined) return applyParams(fallback, params);

    return key;
  }

  return {
    locale: resolvedLocale,
    t
  };
}

module.exports = {
  createTranslator,
  normalizeLocale,
  loadMessages
};
