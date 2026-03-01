'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTranslator, normalizeLocale } = require('../src/i18n');

test('normalizeLocale falls back to en', () => {
  assert.equal(normalizeLocale('pt-BR'), 'pt-br');
  assert.equal(normalizeLocale('pt_br'), 'pt-br');
  assert.equal(normalizeLocale('pt'), 'pt-br');
  assert.equal(normalizeLocale('EN-us'), 'en');
  assert.equal(normalizeLocale(undefined), 'en');
});

test('normalizeLocale resolves base locale when region variant is requested', () => {
  const resolved = normalizeLocale('fr-CA', { en: {}, fr: {} });
  assert.equal(resolved, 'fr');
});

test('translator returns english messages and key fallback', () => {
  const { t } = createTranslator('en');
  assert.equal(t('cli.title'), 'AIOS Lite CLI');
  assert.equal(t('not.exists.key'), 'not.exists.key');
});

test('translator resolves pt-BR dictionary', () => {
  const { locale, t } = createTranslator('pt-BR');
  assert.equal(locale, 'pt-br');
  assert.equal(t('cli.title'), 'CLI do AIOS Lite');
  assert.equal(t('cli.usage'), 'Uso:');
});
